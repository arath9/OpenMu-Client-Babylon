# MU Legacy Evolution: baseline

Registro del 2026-10-25, antes del primer override visual.

## Revisiones y aislamiento

- Ignies: `6d3cbf9913126d2835feb7077937a25c40761e07`, rama inicial `main` limpia.
- OpenMU: `59fa740ae582b75d50d83f9de35c408ad5514e4f`, sin cambios locales.
- Version de ensamblado declarada por OpenMU: `0.9.12.0` en
  `src/SharedAssemblyInfo.cs`. La version del proceso o contenedor que esta
  corriendo no fue comprobada: un checkout no identifica por si solo el binario.
- Rama de implementacion: `feature/custom-asset-pipeline`.
- Sin commits automaticos, cambios a OpenMU, protocolo ni base de datos.

La [auditoria](architecture_audit.md) identifica el pipeline y sus limites.
Se usa guion bajo en el nombre para pasar el check de nombres del repositorio.

## Comandos existentes

Desde la raiz del cliente:

```text
bun install
bun install --cwd install
bun run dev
bun run proxy
bun run tsc
bun run test
bun run test:server
bun run check
bun run check:lint
bunx vite build
```

`dev` y `proxy` se ejecutan en terminales separadas. El build de distribucion
`bun run build` tambien procesa y copia assets; no equivale al build de codigo
de Vite. No se han reinstalado ni reiniciado servicios.

## Estado manual de referencia

El usuario confirma que el servidor y el cliente funcionan, permiten jugar,
combatir y usar bots. Esta sesion no ejecuto una regresion visual del juego.

| Prueba | Evidencia actual |
| --- | --- |
| Login y seleccion | Pendiente de comprobacion manual en esta sesion |
| Movimiento y animaciones | Pendiente de comprobacion manual en esta sesion |
| Combate y bots | Funcionamiento informado por el usuario; sin prueba independiente |
| Inventario y equipamiento | Pendiente de comprobacion manual |
| Drops y crafting | Pendiente de comprobacion manual |
| Cambio de mapa y reconexion | Pendiente de comprobacion manual |

No se declara una funcionalidad rota por no haberla probado.

## Validacion automatica

- Primer check de estructura: fallo por el nombre `architecture-audit.md`;
  corregido a `architecture_audit.md`. El check posterior paso.
- Primera prueba nueva: fallo por ausencia del modulo `visualOverrides`, antes
  de implementar el resolver.
- Tests focalizados iniciales: 22 pasaron (resolver, PlayerObject y apariencia).
  Las pruebas adicionales de integracion se agregaron despues y requieren la
  ejecucion final.
- Servicio marketplace: 82 tests pasaron.
- Primer typecheck: bloqueo en `install/cli/ui.ts` por dependencia existente
  `@clack/prompts` ausente y tipos derivados. No corresponde a archivos del
  override; se intenta instalar las dependencias declaradas del instalador.
- Vite build, lint, estructura y typecheck: pasaron. Para typecheck se instalaron
  las dependencias ya declaradas en `install/` con lockfile congelado.
- Suite completa: 521 archivos aprobados y uno fallido; 5326 tests aprobados y
  uno fallido. `tools/assetCase.test.ts` detecto la referencia fija a un GLB aun
  inexistente. Se corrige mediante seleccion explicita del archivo de desarrollo,
  sin excepciones al check ni assets ficticios. Se reejecutan las pruebas afectadas.
- Pruebas focalizadas anteriores a la revision: 16 aprobadas.
- Tras contrastar la revision externa: 26 pruebas aprobadas en resolver,
  PlayerObject, loader y assetCase; incluye la unica prueba fallida de la suite
  completa anterior. Typecheck y estructura tambien pasaron tras la correccion.
  La suite completa no se repitio; se verificaron los archivos afectados.

Posteriormente se genero un asset original de prueba con `tools/evolutionTorso.ts`:
torso cian rigido, 12 triangulos, sin recursos graficos originales. Su test de
serializacion paso. No se certifica su ajuste visual: el acceso automatizado al
navegador local fue denegado y la prueba dentro del juego queda pendiente.
