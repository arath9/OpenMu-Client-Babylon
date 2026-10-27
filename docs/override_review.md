# Revision contrastada del override

Fecha: 2026-10-25. Revision externa contrastada con el codigo actual.

## Hallazgos que no se confirman

- Capturar `loadSeq` despues de invocar `loadPartAsync` es correcto: la funcion
  incrementa el contador sincronicamente antes de su primer await. El callback
  captura el valor de su solicitud, no el anterior. Eliminar esa asignacion
  impide el fallback valido. La condicion tambien comprueba `!this.disposed`.
- Una carga de equipo posterior incrementa el mismo contador. Por lo tanto, un
  override viejo que falla no inicia fallback cuando ya existe una carga nueva.
  No existe ni hace falta una propiedad inventada `Armor.isEquipped`.
- La prueba de destruccion si comprueba `PartsPending === 0`. Usa meshes y
  skeleton reales de Babylon con NullEngine; simula solamente la llegada tardia.
- La cache debe conservar contenedores compartidos tras liberar un clon. Pedir
  `containersCache.size === 0` seria una expectativa incorrecta, ademas de acceder
  a una variable privada del modulo. Los skeletons se clonan por instancia en
  `instantiateModelsToScene`; no se demuestra un skeleton compartido entre jugadores.
- `devQuery` usa el flag de Vite `import.meta.env.DEV`, sustituido en el build.
  No hay evidencia que justifique agregar una dependencia de feature flags remotos.

## Limites reales y acciones

Una fuga dentro del parser cuando un GLB corrupto rechaza su promesa es una
hipotesis. `loadBodyOverride` no recibe un modelo en ese caso y no puede liberar
un objeto que nunca se le entrego. Harian falta un GLB que reproduzca el fallo y
mediciones de la escena. No se modifica el loader sobre esa suposicion.

Se agrega una prueba con promesa rechazada diferida que ejecuta el incremento
real de `loadPartAsync`, simula la generacion de equipamiento posterior y verifica
que no haya una segunda solicitud. La prueba existente de destruccion verifica
liberacion del mesh, skeleton y contador pendiente.

La suite completa encontro un problema independiente y confirmado: la referencia
fija a un asset inexistente incumplia `assetCase.test.ts`. El override ahora exige
`visualBody=Custom/<nombre>.glb` junto al perfil. Sin seleccion mantiene Classic;
con archivo configurado pero ausente, prueba el fallback. No se debilita el check.

La revision no certifica todavia un asset original, retargeting ni gameplay visual.
