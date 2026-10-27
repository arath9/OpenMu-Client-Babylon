# Primer override visual de desarrollo

El experimento sustituye solo la armadura predeterminada de `PlayerClass.DarkKnight`
(valor 2). Conserva el rig, clips, equipo, inventario y autoridad del servidor.
No admite todavia un skeleton humanoide arbitrario ni archivos glTF separados.

## Activacion

En desarrollo, seleccionar perfil y archivo explicitamente y recargar.
Ejemplo: `/online?visualProfile=evolution&visualBody=Custom/evolution_body.glb`.
Sin archivo configurado no se solicita ningun recurso alternativo.
La seleccion pasa por `devQuery`, que devuelve null fuera de desarrollo.
Quitar el parametro y recargar restaura Classic. No hay cambio en caliente.

El resolver acepta `Custom/<nombre>.glb` bajo la raiz de assets de la version
activa. Para Season 6 se propone `public/game-assets/Custom/evolution_body.glb`;
confirmar la raiz de la sesion antes de colocarlo. Ya se incluye un prototipo
geometrico cian generado con `bun tools/evolutionTorso.ts`: no lee ni copia
geometria, texturas o animaciones originales. Es una caja rigida de 12 triangulos
asignada al slot de spine 18, con material propio y joints provisionales. No es
un rig nuevo ni una armadura final. Su test verifica serializacion, indices y
pesos; el ajuste y movimiento en pantalla siguen pendientes.

Para verlo offline usar
`/offline?bare&visualProfile=evolution&visualBody=Custom/evolution_body.glb`.
`bare` evita el equipo Dragon de la demo, que de otro modo tapa el torso base.
Para comparar Classic: `/offline?bare`.

Si el archivo falta o no puede cargarse, aparece una advertencia y se carga la
armadura clasica. Si otra carga reemplazo esa pieza o el jugador fue destruido,
el fallo viejo no dispara un fallback nuevo. Los clones que llegan fuera de
secuencia o tras destruir al jugador se liberan.

## Prueba con inventario real

Agregar `visualEquipment=leather` al perfil:
`/online?visualProfile=evolution&visualBody=Custom/evolution_body.glb&visualEquipment=leather`.
En este modo el cuerpo sin armadura queda Classic y solo la Leather Armor
(`group=8`, `num=5`, `Player/ArmorMale06.glb`) del Dark Knight base usa el GLB.
El inventario, nombre, icono, requisitos y estadisticas siguen siendo los de
Leather Armor; todavia no es una definicion nueva de item. El cliente de desarrollo
aplica esa apariencia a las instancias compatibles, no solo a un numero de serie.
Si falla la carga custom se conserva el modelo de Leather Armor.

El entorno local existente se inicio con sus contenedores y el script de proxy
existente. La consulta de solo lectura encontro `test0Dk`, de la cuenta `test0`,
con Leather Armor +0 equipada en slot 3. No se escribio en la base de datos ni
se duplico el item. Para probar: quitarla hacia un espacio libre del inventario,
comprobar cuerpo Classic y volver a equiparla para recuperar el torso cian.

## Limites del prototipo de cuerpo base

- Solo Dark Knight base; otras clases y evoluciones mantienen sus rutas.
- Una armadura equipada sustituye el cuerpo predeterminado como antes.
- No cambia cabeza, guantes, botas, pantalones ni armas.
- Cargar un GLB no valida automaticamente su rig o materiales. El pipeline
  actual aplica materiales MU y un solo peso por vertice.
- Verificar visualmente caminar, atacar, recibir dano, morir, equipar y
  desequipar; cambiar mapa, salir de scope y repetir creacion/destruccion.
- Comparar meshes, skeletons y clips tras ciclos, teniendo en cuenta la cache.
- Comprobar perfil desactivado, perfil activo con asset valido y URL ausente.

La arquitectura y los riesgos estan en la [auditoria](architecture_audit.md).
