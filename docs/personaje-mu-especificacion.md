# MU Legacy Evolution — contrato técnico de personaje original

**Versión:** 1.0 · **Fecha:** 27 de octubre de 2026 · **Idioma:** español  
**Destinatarios:** modelador 3D, technical artist y autor de scripts Blender.  
**Personaje propuesto:** *Veyra, Custodia del Umbral*; humanoide original con armadura segmentada, superficies de obsidiana y acentos turquesa. El nombre y diseño son una propuesta artística, no contenido ya implementado.

## 0. Hallazgo bloqueante: «62 huesos» no describe el archivo disponible

La inspección binaria del asset local y la lectura del cargador muestran:

| Magnitud | Referencia principal inspeccionada |
|---|---:|
| Nodos glTF totales | 62 |
| Nodo de modelo sin función de hueso | 1 (`model_player`) |
| Raíz de skin | 1 (`skin_player`) |
| Huesos MU numerados | 60 (`bone_0_…` a `bone_59_…`) |
| Entradas `skins[0].joints` / huesos del esqueleto sintetizado | 61 |
| Mallas / materiales | 0 / 0 |
| Clips | 284 |

**No existe una lista verificable de 62 huesos en estas referencias.** No añadir `bone_60`, `bone_61` ni un hueso ficticio para cumplir un contador: cambiaría el contrato real. Esta entrega define el perfil compatible verificable **`MU-legacy-local-284`**, con 62 nodos de referencia y 61 slots de skin. Un requisito literal de 62 huesos queda **pendiente de una referencia distinta y su adaptador de runtime**; no queda validado por este documento.

Referencia principal: `public/game-assets/Player/player.glb`. SHA-256:

```text
34bf609f29b3587fb51140e83a5ed43bee3c9dfa2b3d7ad35d26a3be58c844a5
```

También se inspeccionó `public/game-assets-v097d/Player/player.glb`: 62 nodos, 61 joints, raíz `skin_Player` y 141 clips; SHA-256 `4e89ef1243975806c8211e7f78ed537129ca8fad9452435fe1714978d4881de9`. **No mezclar su raíz, clips ni índices de acciones con el perfil principal.** Los nombres distinguen mayúsculas. [L1, L2]

## 1. Objetivo y límites del diseño

- Crear geometría, UV y texturas originales; conservar el contrato del rig, no copiar la apariencia del personaje de referencia.
- Mantener proporciones cercanas a la plantilla para que manos, pies y espalda conserven el encaje. El diseño debe ser reconocible por silueta, materiales y armadura, no por cambiar longitudes de huesos.
- Para el perfil estricto, priorizar placas y segmentos rígidos; ocultar transiciones bajo guantes, botas, faldones y hombreras. No prometer deformación orgánica multipeso sin adaptar la vinculación.
- Armas y alas intercambiables son assets separados. No soldarlas al cuerpo ni añadir sus huesos al rig corporal.
- No se entrega aquí un modelo terminado ni un `.blend`. Se entregan el contrato, el manifiesto extraído y una puerta automática de inventario estructural. La aceptación visual y de runtime necesita un candidato real.
- Reutilizar clips o distribuir la referencia exige comprobar previamente los derechos de uso. La compatibilidad técnica no acredita una licencia.

**Presupuestos propuestos de producción, no límites demostrados del cliente:** objetivo de cuerpo hasta 15 000 triángulos, máximo acordado de 20 000; hasta 3 materiales corporales, un atlas de color de 2048 × 2048 y atlas auxiliares solo si se usan. Reducir a 1024 × 1024 para variantes de baja calidad. No contar armas/alas dentro de ese presupuesto sin indicarlo. Justificar excepciones con una medición en la escena objetivo.

## 2. Estructura del paquete y del GLB

### 2.1 Ruta recomendada: modular, fiel al cliente existente

```text
character_source.blend                  # autoría; rig auxiliar y geometría original
character_manifest.json                 # versión, hashes, licencia, bindFrame, sockets
original_body.glb                       # cuerpo/piezas originales, skin y materiales
original_weapon_main.glb                # accesorio rígido independiente
original_weapon_off.glb                 # accesorio rígido independiente, opcional
original_wings.glb                      # accesorio independiente, opcional
Player/player.glb                       # referencia existente sin modificar
validation/                            # informes, capturas y resultados de pruebas
```

`PlayerObject.init()` carga el rig sin mallas. Las partes corporales usan `LinkParent` y reemplazan su esqueleto por el del padre; se detienen sus clips propios. Por ello **no basta con reemplazar meshes dentro de `player.glb`: el original no tiene ninguno**. El punto de integración son las partes y su selección/carga. Mantener el rig padre y sus 284 clips evita alterar el sistema de acciones. Integrar un cuerpo único exige cargarlo como parte vinculada y evitar que se sigan mostrando las partes anteriores. Esta especificación no modifica ese código. [L2, L3]

### 2.2 Ruta opcional: GLB combinado, requiere integración y prueba

```text
scene
├─ model_player                         # identidad; contenedor de meshes corporales
│  ├─ body_head                         # mesh, skin 0
│  ├─ body_torso                        # mesh, skin 0
│  └─ body_limbs                        # mesh, skin 0
└─ skin_player                          # skin.skeleton y joints[0]
   └─ bone_0_Bip01
      └─ ... jerarquía exacta de la sección 3
```

- Archivo binario glTF **2.0 / GLB**, con JSON y BIN válidos, buffers e imágenes embebidos. No rutas absolutas, dependencias de disco del artista, cámaras ni luces de autoría.
- Una skin corporal canónica; `skins[0].skeleton` apunta al nodo `skin_player`. El array `joints` respeta los 61 nombres/slots indicados abajo.
- Nombres de meshes y materiales propios y únicos. Mantener intactos los nombres del rig; se admiten nodos de malla adicionales. **62 no es el total obligatorio de nodos del personaje terminado**.
- El número de nodo glTF es una referencia interna, no un índice de hueso estable. Si el exportador reordena nodos, actualizar `children`, `skin.skeleton`, `skin.joints`, targets de animación y demás referencias. Validar nombres y slots, no exigir los antiguos IDs de nodo.
- El perfil combinado conserva los 284 clips en su orden exacto, incluido `player_action_0`. Evitar que el cliente cree un segundo cuerpo o dos esqueletos activos sobre la misma malla.
- No activar Draco, meshopt, KTX2 ni otras extensiones nuevas sin verificar su decodificador en la ruta real. Para la primera entrega, geometría sin compresión e imágenes PNG/JPEG; no hace falta reproducir las extensiones de texturas de assets antiguos.

Las reglas del contenedor, skins, accessors y atributos proceden de glTF 2.0 [E1]. La estructura modular y las excepciones de MU proceden del código local [L2, L3, L6].

## 3. Orden exacto, jerarquía e índices

**Autoridad de máquina:** `mu-rig-contract.json`, generado del GLB principal e incluyendo los 62 nodos y las 284 entradas de animación. La tabla siguiente distingue explícitamente cada dominio de índices.

- `Índice MU`: número incluido en `bone_<i>_<nombre>` y valor de `ParentBoneLink`.
- `Slot skin/Babylon`: posición en `skins[0].joints` y en el esqueleto sintetizado del proyecto. El slot 0 es `skin_player`.
- **Conversión:** un hueso MU `i` ocupa el slot `i + 1`. Esta suma ocurre en el código; no se debe repetir en un llamador de `setBoneLink(i)`.
- `Nodo fuente`: ID observado en este archivo, meramente informativo. `model_player` no es un hueso.
- Conservar todos los nombres, espacios, mayúsculas y sufijos, incluidos `Dummy`, `Mesh*`, `gfh` y los nombres poco descriptivos. No convertirlos en una cadena artificial ni renombrarlos por anatomía.

| Nodo fuente | Slot skin/Babylon | Índice MU | Nombre exacto | Padre exacto |
|---:|---:|---:|---|---|
| 0 | — | — | `model_player` | escena |
| 1 | 0 | — | `skin_player` | escena |
| 2 | 1 | 0 | `bone_0_Bip01` | `skin_player` |
| 3 | 2 | 1 | `bone_1_Bip01 Footsteps` | `bone_0_Bip01` |
| 4 | 3 | 2 | `bone_2_Bip01 Pelvis` | `bone_0_Bip01` |
| 5 | 4 | 3 | `bone_3_Bip01 L Thigh` | `bone_2_Bip01 Pelvis` |
| 6 | 5 | 4 | `bone_4_Bip01 L Calf` | `bone_3_Bip01 L Thigh` |
| 7 | 6 | 5 | `bone_5_Bip01 L Foot` | `bone_4_Bip01 L Calf` |
| 8 | 7 | 6 | `bone_6_Bip01 L Toe0` | `bone_5_Bip01 L Foot` |
| 9 | 8 | 7 | `bone_7_Bip01 L Toe01` | `bone_6_Bip01 L Toe0` |
| 10 | 9 | 8 | `bone_8_Bip01 L Toe02` | `bone_7_Bip01 L Toe01` |
| 11 | 10 | 9 | `bone_9_Dummy` | `bone_0_Bip01` |
| 12 | 11 | 10 | `bone_10_Bip01 R Thigh` | `bone_2_Bip01 Pelvis` |
| 13 | 12 | 11 | `bone_11_Bip01 R Calf` | `bone_10_Bip01 R Thigh` |
| 14 | 13 | 12 | `bone_12_Bip01 R Foot` | `bone_11_Bip01 R Calf` |
| 15 | 14 | 13 | `bone_13_Bip01 R Toe0` | `bone_12_Bip01 R Foot` |
| 16 | 15 | 14 | `bone_14_Bip01 R Toe01` | `bone_13_Bip01 R Toe0` |
| 17 | 16 | 15 | `bone_15_Bip01 R Toe02` | `bone_14_Bip01 R Toe01` |
| 18 | 17 | 16 | `bone_16_Dummy` | `bone_0_Bip01` |
| 19 | 18 | 17 | `bone_17_Bip01 Spine` | `bone_2_Bip01 Pelvis` |
| 20 | 19 | 18 | `bone_18_Bip01 Spine1` | `bone_17_Bip01 Spine` |
| 21 | 20 | 19 | `bone_19_Bip01 Neck` | `bone_18_Bip01 Spine1` |
| 22 | 21 | 20 | `bone_20_Bip01 Head` | `bone_19_Bip01 Neck` |
| 23 | 22 | 21 | `bone_21_Dummy` | `bone_0_Bip01` |
| 24 | 23 | 22 | `bone_22_Bip01 Ponytail1` | `bone_20_Bip01 Head` |
| 25 | 24 | 23 | `bone_23_Bip01 Ponytail11` | `bone_22_Bip01 Ponytail1` |
| 26 | 25 | 24 | `bone_24_Dummy` | `bone_0_Bip01` |
| 27 | 26 | 25 | `bone_25_Bip01 R Clavicle` | `bone_19_Bip01 Neck` |
| 28 | 27 | 26 | `bone_26_Bip01 R UpperArm` | `bone_25_Bip01 R Clavicle` |
| 29 | 28 | 27 | `bone_27_Bip01 R Forearm` | `bone_26_Bip01 R UpperArm` |
| 30 | 29 | 28 | `bone_28_Bip01 R Hand` | `bone_27_Bip01 R Forearm` |
| 31 | 30 | 29 | `bone_29_Bip01 R Finger0` | `bone_28_Bip01 R Hand` |
| 32 | 31 | 30 | `bone_30_Bip01 R Finger01` | `bone_29_Bip01 R Finger0` |
| 33 | 32 | 31 | `bone_31_Bip01 R Finger02` | `bone_30_Bip01 R Finger01` |
| 34 | 33 | 32 | `bone_32_Dummy` | `bone_0_Bip01` |
| 35 | 34 | 33 | `bone_33_knife_gdf` | `bone_28_Bip01 R Hand` |
| 36 | 35 | 34 | `bone_34_Bip01 L Clavicle` | `bone_19_Bip01 Neck` |
| 37 | 36 | 35 | `bone_35_Bip01 L UpperArm` | `bone_34_Bip01 L Clavicle` |
| 38 | 37 | 36 | `bone_36_Bip01 L Forearm` | `bone_35_Bip01 L UpperArm` |
| 39 | 38 | 37 | `bone_37_Bip01 L Hand` | `bone_36_Bip01 L Forearm` |
| 40 | 39 | 38 | `bone_38_Bip01 L Finger0` | `bone_37_Bip01 L Hand` |
| 41 | 40 | 39 | `bone_39_Bip01 L Finger01` | `bone_38_Bip01 L Finger0` |
| 42 | 41 | 40 | `bone_40_Bip01 L Finger02` | `bone_39_Bip01 L Finger01` |
| 43 | 42 | 41 | `bone_41_Dummy` | `bone_0_Bip01` |
| 44 | 43 | 42 | `bone_42_hand_bofdgne01` | `bone_37_Bip01 L Hand` |
| 45 | 44 | 43 | `bone_43_Bone01` | `bone_17_Bip01 Spine` |
| 46 | 45 | 44 | `bone_44_Bone02` | `bone_43_Bone01` |
| 47 | 46 | 45 | `bone_45_Bone03` | `bone_44_Bone02` |
| 48 | 47 | 46 | `bone_46_Bone04` | `bone_45_Bone03` |
| 49 | 48 | 47 | `bone_47_Bone05` | `bone_17_Bip01 Spine` |
| 50 | 49 | 48 | `bone_48_Bone06` | `bone_47_Bone05` |
| 51 | 50 | 49 | `bone_49_Bone07` | `bone_48_Bone06` |
| 52 | 51 | 50 | `bone_50_Bone08` | `bone_49_Bone07` |
| 53 | 52 | 51 | `bone_51_Mesh01` | `bone_2_Bip01 Pelvis` |
| 54 | 53 | 52 | `bone_52_Mesh02` | `bone_2_Bip01 Pelvis` |
| 55 | 54 | 53 | `bone_53_Mesh04` | `bone_2_Bip01 Pelvis` |
| 56 | 55 | 54 | `bone_54_gfh` | `bone_2_Bip01 Pelvis` |
| 57 | 56 | 55 | `bone_55_Mesh03` | `bone_2_Bip01 Pelvis` |
| 58 | 57 | 56 | `bone_56_Dummy` | `bone_0_Bip01` |
| 59 | 58 | 57 | `bone_57_Dummy` | `bone_0_Bip01` |
| 60 | 59 | 58 | `bone_58_Dummy` | `bone_0_Bip01` |
| 61 | 60 | 59 | `bone_59_Dummy` | `bone_0_Bip01` |

Las transformaciones locales iniciales de estos nodos no contienen TRS explícito: son identidad. **La pose útil viene en los canales de animación**, no en una T-pose guardada en los nodos. Por eso importar este rig sin geometría a Blender y aplicar pesos automáticos no reconstruye por sí mismo un bind pose válido. Conservar también las transformaciones de los nodos auxiliares. [L1, L2, L6]

## 4. Geometría, bind pose y coordenadas

### 4.1 Perfil estricto compatible con las partes actuales

El conversor local escribe posiciones de vértices en el espacio local de su hueso, asigna `JOINTS_0 = (muIndex + 1, 0, 0, 0)` y `WEIGHTS_0 = (1, 0, 0, 0)`. La skin no declara `inverseBindMatrices`, por lo que el contrato glTF usa identidades. **Esto no es equivalente al skinning habitual exportado por un armature Blender.** [L6, E1]

Requisitos del perfil rígido original:

1. Un único hueso efectivo por vértice, representado mediante atributos VEC4. Usar la entrada del array `skin.joints`, no el ID del nodo ni el índice MU sin desplazar.
2. Posiciones expresadas en el espacio local del hueso elegido; normales transformadas y normalizadas en el mismo espacio. No ponderar la geometría corporal a slots `Dummy`, a sockets ni a la raíz de skin salvo justificación y prueba específica.
3. Si se modela en espacio de modelo sobre una pose de trabajo, guardar `bindAction = player_action_0` y `bindTimeSeconds = 0` en el manifiesto. Componer matrices mundiales por jerarquía en esa pose y transformar cada vértice por la inversa de la matriz de su hueso. Registrar además los ancestros/transformaciones del objeto de malla. No asumir que una T-pose genérica coincide con esa pose.
4. Para cada vértice rígido, verificar el round-trip `M_hueso(bind) · p_local ≈ p_modelo`. Para normales usar la matriz normal correspondiente y comprobar orientación, especialmente ante espejados.
5. No eliminar las inverse bind matrices de un export Blender ordinario sin hacer la conversión geométrica: produciría un archivo formalmente legible pero deformado.
6. Si se exige piel suave con varios pesos, abrir un perfil diferente con inverse bind matrices, espacio de malla y vinculación Babylon correctos. Probar la sustitución del esqueleto de las partes antes de aceptarlo. No mezclar vértices convencionales multipeso con el supuesto rígido anterior.

### 4.2 Atributos y materiales

- Primitivas triangulares (`mode = 4`); índices, si existen, dentro del rango. Triangular antes de medir presupuesto.
- `POSITION` VEC3, `NORMAL` VEC3 y `TEXCOORD_0` VEC2. Valores finitos, sin NaN/Infinity. `JOINTS_0` VEC4 de enteros unsigned byte/short y `WEIGHTS_0` VEC4 normalizables conforme a glTF. Para este perfil, pesos float32 `(1,0,0,0)` y sin `JOINTS_1/WEIGHTS_1`.
- Normales consistentes; añadir tangentes solo si se usan normal maps. UV sin solapamientos involuntarios. `COLOR_0` blanco si se suministra.
- Materiales identificados por nombre propio, texturas embebidas y canales documentados. Opaque por defecto; alpha mask solo para recortes deliberados y alpha blend reservado a superficies que lo necesitan. No corregir normales invertidas activando double-sided en todo el cuerpo.
- El cliente adapta materiales y luces: no considerar validado un material porque se vea bien en un visor glTF genérico. Probar atlas/color primero; PBR avanzado requiere comprobar el shader utilizado por las partes. [L2]

### 4.3 Escala y ejes: no aplicar dos conversiones

glTF define metros y un sistema diestro con +Y arriba [E1]. El cliente MU añade su propia conversión a las raíces: rotación X de −90° y escala `(1,−1,1)` al cargar un `ModelObject`. Los sockets deshacen esa base para los accesorios. Mantener las coordenadas del perfil de referencia en los GLB finales; no prehornear otra vez la conversión del runtime. [L3]

Para autoría se puede trabajar en metros con un rig auxiliar visible. Medir la escala contra una parte existente en la misma pose y ruta de carga; no imponer una altura arbitraria al esqueleto. Aplicar transformaciones a la geometría propia antes de vincularla, nunca al rig canónico ni a sus clips. Aprobar orientación y tamaño viendo personaje y accesorio juntos en Babylon, no solo en Blender.

## 5. Animaciones obligatorias y despacho real

**Política de compatibilidad:** mantener los clips de referencia sin retiming, sin resampling, sin cambiar canales, targets ni muestras, en su orden original. La versión principal usa `animationGroups[PlayerAction]`; nombrar cinco acciones `idle`, `walk`, `run`, `attack` y `death` **no basta**. En el perfil modular los 284 clips siguen en el rig padre; no es necesario duplicarlos en cada parte. [L2, L3, L4]

| Semántica mínima | Miembro PlayerAction | Índice principal | Nombre GLB | Bucle | Fin fuente (s) | Keys primer sampler |
|---|---|---:|---|---|---:|---:|
| idle | `PLAYER_STOP_MALE` | 1 | `player_action_1` | sí | 0.25 | 7 |
| walk | `PLAYER_WALK_MALE` | 15 | `player_action_15` | sí | 0.25 | 7 |
| run | `PLAYER_RUN` | 25 | `player_action_25` | sí | 0.25 | 7 |
| attack básico sin arma | `PLAYER_ATTACK_FIST` | 38 | `player_action_38` | no | 0.2916666567325592 | 8 |
| death principal | `PLAYER_DIE1` | 231 | `player_action_231` | no | 1.25 | 31 |

Estos tiempos son los máximos observados en los accessors de entrada del asset, **no duraciones garantizadas de reproducción en el juego**. Las velocidades las controla el runtime. El conversor toma 24 FPS como base y añade un tramo de cierre; `ModelObject.startGroup()` detiene los one-shots en la penúltima key real y conserva la pose. No borrar ese cierre ni reiniciar una muerte al primer frame. El comportamiento de bucle se configura en Babylon, no se deduce solo del nombre del clip. [L1, L3, L6]

También deben seguir disponibles:

- `PLAYER_SET = 0` / `player_action_0`, utilizado inicialmente por el cargador.
- Variantes femeninas: `PLAYER_STOP_FEMALE = 2`, `PLAYER_WALK_FEMALE = 16`; no elegir animación por género narrativo del personaje sin revisar la clase/estado del cliente.
- Si lleva espada: `PLAYER_ATTACK_SWORD_RIGHT1 = 39`, `RIGHT2 = 40`, `LEFT1 = 41`, `LEFT2 = 42`; conservar las variantes de caminar/correr con equipamiento y las demás acciones.
- `PLAYER_DIE2 = 232` y el resto del inventario hasta índice 283, dado que gameplay puede solicitarlos.

No dejar huecos, ordenar alfabéticamente los clips ni confundir el ordinal de Blender/NLA con `PlayerAction`. Para copiar animaciones entre documentos glTF, trasladar samplers, accessors y datos binarios; remapear los targets por nombre exacto. Copiar solo el array JSON deja índices inválidos. La comprobación completa compara cada canal `(targetName, path)`, interpolación y muestras con la fuente.

Una entrega de solo cinco clips es admisible únicamente como demo aislada con un adaptador explícito de acciones; no es reemplazo drop-in del jugador actual. El perfil v097d necesita su propio manifiesto de acciones y no hereda el valor 231 de este perfil.

## 6. Sockets de armas y alas

| Slot funcional | Índice MU / `ParentBoneLink` | Slot `skeleton.bones` | Nodo fuente | Nombre exacto | Padre |
|---|---:|---:|---:|---|---|
| `Weapon1` / mano principal derecha | 33 | 34 | 35 | `bone_33_knife_gdf` | `bone_28_Bip01 R Hand` |
| `Weapon2` / mano secundaria izquierda | 42 | 43 | 44 | `bone_42_hand_bofdgne01` | `bone_37_Bip01 L Hand` |
| `Wings` / espalda | 47 | 48 | 49 | `bone_47_Bone05` | `bone_17_Bip01 Spine` |

Los sockets son huesos ya existentes, no tres joints nuevos. Los nombres de appearance `leftHand/rightHand` pueden parecer invertidos respecto de la anatomía: para este cliente slot 0 → `Weapon1` → mano derecha, slot 1 → `Weapon2` → mano izquierda. No corregirlos por intuición. Las reglas de equipamiento pueden mover un arma al índice MU 47 al enfundarla. [L3, L7]

**API del proyecto, índices MU sin desplazar:**

```typescript
player.Weapon1.setBoneLink(33);
player.Weapon2.setBoneLink(42);
// Wings ya se inicializa con ParentBoneLink = 47.
// Su encaje final debe respetar también las reglas de wings.ts.
```

Para inspeccionar el hueso de verdad en un test Babylon:

```typescript
const sockets = [
  [33, 'bone_33_knife_gdf'],
  [42, 'bone_42_hand_bofdgne01'],
  [47, 'bone_47_Bone05'],
] as const;
for (const [muIndex, expected] of sockets) {
  const bone = loaded.skeleton.bones[muIndex + 1];
  if (bone?.name !== expected || !bone.getTransformNode()) {
    throw new Error(`Socket MU inválido: ${muIndex}`);
  }
}
```

Los fragmentos TypeScript son especificación para el harness del proyecto; no son un CLI autónomo entregado ni se ejecutaron en esta entrega. No usar `skeleton.bones[33]` para `Weapon1`: seleccionaría el dummy equivocado.

### Contrato de pivote del accesorio

- Arma: origen en el punto de agarre; definir eje longitudinal y orientación del filo en el manifiesto. Preparar un accesorio de prueba asimétrico con ejes coloreados para detectar espejados.
- Alas: origen en el punto de anclaje dorsal; extensión equilibrada respecto del socket. Si las alas tienen rig propio, su skin y animación viven en el GLB de alas, no aumentan el contador del cuerpo.
- Registrar para cada accesorio `targetMuIndex`, `targetNodeName`, desplazamiento local, quaternion local `[x,y,z,w]` y escala local; sus valores deben medirse, no inventarse. Identidad es solo el punto de partida de un accesorio nuevo, no una calibración universal.
- Runtime: `bone TransformNode → socket (BoneLinkMatrix) → nodo de accesorio (base inversa) → root del GLB (base del loader)`. Mantener la ruta de `ModelObject`; no añadir otra corrección de −90° al archivo por encima de ella. [L3]
- En un visor independiente puede utilizarse `attachToBone`, pero requiere el transform de referencia correcto; no mezclarlo simultáneamente con el parenting de sockets del proyecto [E2].

## 7. Procedimiento de autoría Blender / script

1. Congelar la referencia principal por hash. Leer `mu-rig-contract.json` antes de crear huesos. Mantener nombres, padres, slots y clips fuera de las decisiones artísticas.
2. Evaluar `player_action_0` en tiempo 0 y componer la pose de trabajo. Construir un rig **auxiliar** si Blender lo necesita; no sustituir la jerarquía MU con un auto-rig humanoide genérico.
3. Modelar el personaje original, retopologizar, triangular y crear UV/materiales. Conservar volumen en codos/rodillas usando segmentos y solapes apropiados para el perfil rígido.
4. Asignar grupos de vértices por nombre exacto; una influencia efectiva por vértice para el perfil estricto. Los huesos auxiliares de control no deben aparecer en la skin final. Conservar los huesos MU sin peso: los sockets y dummies no se eliminan por no deformar geometría.
5. Convertir las posiciones a espacio local del hueso usando la pose de trabajo documentada; reconstruir los slots canónicos al ensamblar el GLB. Exportar glTF convencional de Blender es una etapa intermedia, no garantía del contrato MU.
6. En la ruta modular, producir partes compatibles y dejar intacto `Player/player.glb`. En la combinada, ensamblar la geometría original con el rig y las animaciones canónicas, copiando sus datos completos y remapeando referencias.
7. Exportar, reabrir el GLB, ejecutar validadores, cargarlo con el cargador real y grabar las cinco animaciones con armas/alas. No aprobar mirando solamente la pose de trabajo.

**Configuración mínima de exportador Blender, orientativa y dependiente de versión:** GLB, selección explícita, normales/UV/materiales y skins habilitados; sin cámaras/luces, morphs o compresión. Si las animaciones se conservan mediante ensamblado posterior, no regenerarlas desde Blender. Consultar las propiedades RNA de `bpy.ops.export_scene.gltf` en la instalación objetivo: el argumento de selección actual es `use_selection`, no `export_exportSelected`. Registrar versión exacta de Blender y del exportador; no se ejecutó Blender en esta entrega. [E3]

Comando de ejecución de un futuro script de autoría, una vez implementado:

```text
blender --background character_source.blend --python export_mu_character.py
```

`export_mu_character.py` es el nombre propuesto para ese entregable futuro; no forma parte de los archivos creados aquí.

## 8. Validación automática y criterios de aceptación

### 8.1 Puerta suministrada y verificada: inventario estructural

Archivos ejecutables entregados:

- `validate_contract.py`: Python estándar, sin pip; lee GLB 2.0, valida cabecera/chunks, nombres, padres, transformaciones locales declaradas, slots de skin, raíz, inventario/orden de 284 clips, conteo de canales y metadatos de tiempos/keys.
- Sin `--rig-only` exige además que exista un nodo de malla vinculado a la skin corporal. Ese chequeo **no** valida sus vértices ni sus pesos.
- `test_validate_contract.py`: pruebas usando el GLB local real; comprueba aceptación del rig canónico, rechazo del intercambio de slots de sockets y rechazo del rig sin cuerpo en modo candidato.

Desde el directorio de esta entrega:

```text
python test_validate_contract.py
python validate_contract.py --rig-only "C:/Users/Andres/Documents/Codex/2026-10-24/bu/mu-online/OpenMu-Client-Babylon/public/game-assets/Player/player.glb"
python validate_contract.py "ruta/al/personaje_combinado.glb"
```

Resultados reales de la entrega: **2 tests OK**; la referencia en modo rig devuelve `contractValid: true`. El informe siempre mantiene `productionApproved: false` y enumera las puertas pendientes; no convierte una comprobación parcial en certificación de personaje. Su comparación de transformaciones es deliberadamente estricta: un exportador que escriba TRS identidad explícito en vez de omitirlo puede requerir normalización consciente del contrato, no eliminar el chequeo.

La puerta entregada no valida payloads binarios de animación, pesos, inverse bind matrices, materiales ni la escena Babylon. El modo candidato está pensado para el GLB combinado, no para exigir 284 clips a cada parte modular. En la ruta modular, ejecutar el chequeo rig sobre el padre y añadir el gate de geometría/pesos de las partes descrito abajo.

### 8.2 Matriz de gates obligatorios para aprobación de producción

| Gate | Comprobaciones automáticas exigidas | Criterio de fallo |
|---|---|---|
| G0 Formato | Khronos glTF Validator sobre cada GLB; buffers/accessors/targets/bounds/extensions | cualquier error; warnings sin justificación |
| G1 Rig | manifiesto canónico; nombres completos, orden, padres, transformaciones y sockets; no conteo aislado | cualquier diferencia no aprobada |
| G2 Geometría | atributos, primitiva triangular, índices válidos, valores finitos, presupuestos, UV/materiales/imágenes embebidos | cualquier atributo obligatorio ausente o presupuesto excedido sin aprobación |
| G3 Skin rígida | slots en `[0,60]`, pesos finitos/no negativos, suma por vértice con tolerancia 1e-4; exactamente un peso efectivo; root y sockets no usados indebidamente; IBM ausente o identidad conforme al perfil | slot desplazado, multipeso no autorizado o espacio/bind incompatibles |
| G4 Clips | 284 acciones; mismos nombres/ordinales; canales por `(targetName,path)`; interpolación y todas las muestras de tiempo/TRS iguales a la referencia copiada | metadata correcta con payload alterado también falla |
| G5 Babylon real | cargar con `loadGLTF`, compartir esqueleto con partes, comprobar `bones[mu+1]`, matrices y parenting de sockets | malla sin esqueleto, hueso equivocado, doble transform o animación no vinculada |
| G6 Estados | idle→walk→run→attack→idle→death, reinicio de ataque, muerte one-shot con pose final, variantes de equipo | transición inválida, snap, root motion indebido, resurrección visual o socket que deriva |

Para G3, añadir un test de round-trip de bind y skinning CPU en muestras de inicio/mitad/final de cada acción mínima. Para G5, comprobar que los TransformNodes de los sockets son los mismos de la instancia cargada, no los de un asset container original o de otro personaje. Verificar transformaciones con dos personajes simultáneos y accesorios distintos.

**Criterios visuales propuestos:** ausencia de explosiones/colapsos de geometría, arma dentro de la mano, alas centradas, pies sin penetración continua, muerte estable sin regreso al primer frame, materiales correctos y ausencia de cuerpo duplicado. Medir deriva del pivote contra su socket; tolerancia inicial propuesta de 0.005 m en un visor normalizado a metros, convertida a las unidades reales de la prueba. No aplicar ese número directamente a matrices de mundo MU sin documentar la escala.

Registrar por gate el comando/harness, versiones, hash de cada entrada, resultado y evidencia. Solo marcar producción aprobada cuando G0–G6 y la revisión visual hayan pasado; este paquete no afirma que ya lo hayan hecho.

### 8.3 El validador TypeScript existente no es autoridad suficiente

`src/tools/validateMUCompatibleGLB.ts` se inspeccionó, no se corrigió ni se certificó. Sus problemas observados son concretos: [L5]

- Exige 62 huesos y `skin_root`, que no corresponden a la referencia principal de 61 slots / `skin_player`.
- Busca prefijos con `some()`, no el nombre completo en cada posición: no valida orden real ni jerarquía.
- Comprueba `bones[33]`, `[42]` y `[47]` por existencia, sin el desplazamiento real ni los nombres de socket.
- Permite una coincidencia parcial de al menos 50 nombres.
- La expresión final usa `socketsValid` sin variable local declarada, en lugar de `report.socketsValid`.
- La API de carga que intenta usar no es la ruta de `loadGLTF` del proyecto; un rig sin mallas no materializa por sí solo el Skeleton que este código presupone.

**No ejecutar ese archivo y presentar su resultado como validación completa.** Integrar sus futuras correcciones en el harness real, con pruebas de reordenamiento y nombres incorrectos. Tampoco usar `src/tools/generate-mu-character-glb.ts` como plantilla anatómica canónica: contiene nombres y jerarquía sintéticos distintos del asset real. [L5, L8]

## 9. Checklist de entrega al modelador

- [ ] Confirmar aceptación explícita del perfil real de 61 slots; si el requisito sigue siendo 62 huesos, aportar otra referencia antes de exportar.
- [ ] `.blend`, texturas fuente, licencia/origen de cada recurso y geometría propia.
- [ ] Variante modular o combinada indicada sin ambigüedad; contrato/versión/hash adjuntos.
- [ ] Lista completa de joints y padres idéntica al manifiesto; sin huesos extra de control.
- [ ] Pose y espacio de bind documentados; exportación rígida MU o perfil convencional adaptado, nunca una mezcla accidental.
- [ ] Idle/walk/run/attack/death accesibles por el enum real; 284 clips conservados en el rig principal.
- [ ] Weapon1 33→slot34, Weapon2 42→slot43, Wings 47→slot48 verificados en runtime.
- [ ] Pivotes y offsets medidos para cada accesorio, sin correcciones duplicadas de base.
- [ ] Informes G0–G6, presupuestos medidos y evidencia visual en la escena objetivo.

## 10. Fuentes y trazabilidad

Repositorio local inspeccionado:

```text
C:/Users/Andres/Documents/Codex/2026-10-24/bu/mu-online/OpenMu-Client-Babylon
```

- **[L1]** `public/game-assets/Player/player.glb`, JSON binario leído directamente; `public/game-assets-v097d/Player/player.glb` como contraste. El manifiesto guarda nombres, IDs fuente, jerarquía y metadatos de todas las acciones.
- **[L2]** `src/controllers/assets/modelLoader.ts`, especialmente líneas 688–746 (skeleton sintetizado), 818–834 (síntesis y primer clip) y función `prepareMeshes`.
- **[L3]** `src/controllers/render/modelObject.ts`, líneas 925–973 (acciones), 1173–1213 (base y `LinkParent`), 1861–1885 (socket con índice +1); `src/controllers/actors/playerObject.ts`, líneas 200–228 y 256–261.
- **[L4]** `versions/shared/objects/enum.ts`, enum PlayerAction, líneas 235–522; incluye el máximo 284.
- **[L5]** `src/tools/validateMUCompatibleGLB.ts`, líneas 20–78.
- **[L6]** `tools/bmdToGlb.ts`, líneas 451–485 (orden), 487–539 (tiempos y cierre), 691–708 (posiciones/índices/pesos).
- **[L7]** `src/controllers/actors/weaponAttachment.ts`, constantes 31–33 y enlaces 314–331; `src/controllers/actors/wings.ts`, constante `WING_BONE = 47`.
- **[L8]** `src/tools/generate-mu-character-glb.ts`, array `MU_BONE_ORDER` y construcción de jerarquía.

Referencias externas primarias consultadas para formato/API, no para inventar el rig MU:

- **[E1]** Khronos, *glTF 2.0 Specification*, secciones Coordinate System and Units, Skins, Skinned Mesh Attributes y GLB File Format. Localizador: `https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html`. Se recuperó además el texto fuente oficial `https://raw.githubusercontent.com/KhronosGroup/glTF/main/specification/2.0/Specification.adoc`.
- **[E2]** Babylon.js, *Bones and Skeletons*, apartado de attachment; documentación `TransformNode.attachToBone`. Localizadores: `https://doc.babylonjs.com/features/featuresDeepDive/mesh/bonesSkeletons` y `https://doc.babylonjs.com/typedoc/classes/BABYLON.TransformNode`. La versión instalada declarada por el proyecto es `@babylonjs/core 7.51.1`; el código local prevalece sobre ejemplos de otras versiones.
- **[E3]** Blender Python API, *Export Scene Operators*, operador `bpy.ops.export_scene.gltf`. Localizador: `https://docs.blender.org/api/current/bpy.ops.export_scene.html`; comprobar RNA de la versión instalada antes de ejecutar.

La extracción web genérica no estuvo disponible; se usaron búsqueda de documentación primaria y lectura directa del texto oficial Khronos. No se afirma una ejecución de Blender, un render ni una prueba del personaje final.
