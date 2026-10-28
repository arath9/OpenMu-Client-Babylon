# Veyra offline: diagnóstico y corrección

## Causa confirmada

El hook sí recibe los paths correctos y los GLB sí cargan. El aspecto final lo cambiaba el equipo de prueba de la demo:

1. `PlayerObject.init()` carga `Player/player.glb`, después los cinco sockets del cuerpo.
2. Sin query, `setTestItems()` equipaba Dragon (grupos 7–11, número 1).
3. `AppearanceSystem`, cuando el personaje queda Ready, aplica esos items. El casco cerrado descarga `Helm`; los otros items **reemplazan**, no superponen, los sockets. El resultado final ya no contiene geometría Veyra.
4. El resolver también excluía `ArmorClass`, dejando el torso Classic incluso con `?bare`. Ese socket es el torso del cuerpo; no equivale a un item de armadura equipado. La comprobación `character=classic` estaba después del retorno de las otras cuatro partes y nunca podía desactivarlas.

## Paths exactos observados

En el test integrado, con resolver, PlayerObject, AppearanceSystem y loader GLB reales:

| Entrada al resolver | Override corporal |
| --- | --- |
| `Player/HelmClass02.glb` | `Custom/veyra_head.glb` |
| `Player/ArmorClass02.glb` | `Custom/veyra_armor.glb` |
| `Player/PantClass02.glb` | `Custom/veyra_pants.glb` |
| `Player/GloveClass02.glb` | `Custom/veyra_gloves.glb` |
| `Player/BootClass02.glb` | `Custom/veyra_boots.glb` |

Al equipar Dragon llegan `Player/HelmMale02.glb`, `Player/ArmorMale02.glb`, `Player/PantMale02.glb`, `Player/GloveMale02.glb`, `Player/BootMale02.glb`. No coinciden con `*ClassXX` y correctamente NO se convierten a Veyra. El rig padre sigue siendo `Player/player.glb`.

## GLB real y carga directa sin hook

Verificado en Edge headless con WebGL2, contra Vite local, sin omitir materiales:

```js
const { Ecs } = await import('/src/ecs/current.ts');
const { loadGLTF } = await import('/src/controllers/assets/modelLoader.ts');
const player = [...Ecs.world.with('localPlayer', 'modelObject')][0].modelObject;
player.Helm.load(await loadGLTF('Custom/veyra_head.glb', Ecs.world));
```

Esto evita completamente `resolveCharacterVisualOverride` y carga directamente la cabeza en el socket, manteniendo el rig padre. Respuesta HTTP de `/game-assets/Custom/veyra_head.glb`: **200**, **60180 bytes**, magic **glTF**. Tres meshes reales, con 96, 192 y 192 vértices; materiales StandardMaterial listos; visibles, habilitados y compartiendo el skeleton padre de 61 slots. No se observó un fallo de carga del GLB.

El test automático de carga directa también comprueba tres meshes, 480 vértices y cero llamadas al hook. Los tests de Node omiten materiales por las limitaciones del entorno; la verificación WebGL del navegador anterior no los omite.

## Solución aplicada

- `itemVisualOverrides.ts`: selección compartida `usesVeyraDefaultBody()`; Veyra por defecto para los cinco sockets, incluido torso. `?character=classic` se evalúa antes de devolver overrides (flag de desarrollo, como `devQuery`). Producción sigue usando Veyra cuando `devQuery` devuelve null.
- `offline.ts`: el loadout usa esa misma selección. No equipa Dragon por defecto y limpia los cinco slots corporales previamente usados; conserva la demo Dragon en Classic explícito. No se cambia AppearanceSystem ni se impide equipar items legítimos.
- Se conserva el fallback existente al modelo Classic si un override no carga.

En navegador, después de la corrección, `/offline` sin query: cinco slots de equipo corporal null, apariencia aplicada, `PartsPending=0`; los cinco sockets contienen sólo meshes `veyra_*`. Los meshes con geometría están en la lista activa de render y sus materiales están listos. `/offline?character=classic`: cinco items Dragon y ningún mesh `veyra_*`.

## Verificación automatizada

```sh
npx vitest run src/controllers/actors/veyra.test.ts src/app/offlineLoadout.test.ts src/controllers/actors/veyraOffline.test.ts src/controllers/actors/veyraRuntime.test.ts src/controllers/actors/visualOverrides.test.ts src/ecs/systems/appearanceSystem.test.ts src/tools/validateMUCompatibleGLB.test.ts
npx vitest run src/controllers/actors/playerObject.test.ts -t 'Veyra default parts'
```

Resultados: **57 tests aprobados en siete archivos**; test específico del fallback Veyra aprobado adicionalmente. El test integrado confirma cargar Veyra → equipar Dragon (desaparece Veyra) → quitar Dragon (vuelve Veyra), sin warnings del loader. Las nuevas regresiones se ejecutaron en rojo antes de aplicar la corrección: fallaban por torso Classic, Classic incompleto, Dragon por defecto y slots antiguos no limpiados.

ESLint de archivos cambiados y `git diff --check`: aprobados.

## Límites y problemas ajenos encontrados

- Al incluir completo `playerObject.test.ts`: 70 tests aprobados y uno falla en el caso de alas Mantle/Cape; `itemVisualTier` intenta leer `gameVersion.features` sin una versión inicializada. El stack falla antes de llamar al loader/resolver de partes. No se modifica ese comportamiento ajeno.
- `tsc --noEmit` falla por errores en scripts de generación y tests preexistentes (`glbLoading.test.ts`, `visualOverrides.e2e.test.ts`, `src/tools/*`, declaración de `xhr2`); no se reportaron errores en los archivos modificados de esta corrección.
- El navegador mostró advertencias de sidecars comprimidos ausentes (fallback a archivos plain) y conexiones rechazadas a servicios no iniciados; no errores de Veyra.
- No se ejecutó toda la suite del repositorio ni el pipeline completo de producción. No se regeneraron GLB ni se cambió `player.glb`.
