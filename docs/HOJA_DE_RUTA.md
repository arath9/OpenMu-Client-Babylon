# Hoja de Ruta: MU Legacy Evolution

## Objetivo Principal

Partir de **MU Online Season 6** (ya funcionando con OpenMU server + Ignies client Babylon.js) y transformarlo progresivamente en un RPG propio.

- **Estado inicial:** Proyecto personal, sin monetización
- **Stack tecnológico:** TypeScript, Babylon.js, OpenMU (.NET), Blender, GLB/glTF
- **Hardware disponible:** Evo X2 de 64 GB para agentes de código, herramientas de assets y QA visual

---

## Estado Actual (Octubre 2026)

✅ **Servidor y cliente funcionando**
- Personajes, combate y bots operativos
- No requiere reinstalación ni reescritura

✅ **Sistema de visual overrides implementado**
- Hook `resolveItemVisualOverride()` en `itemVisualOverrides.ts`
- 18/18 tests pasando (unitarios + E2E)
- Fallback automático a modelos clásicos
- Flags dev-only: `?visualProfile=evolution&visualEquipment=leather`

✅ **Assets validados**
- `Custom/Box.glb` (Khronos sample, 1.6 KB) - GLB válido
- `Custom/evolution_body.glb` (3.1 KB) - GLB válido

---

## Fases de Desarrollo

### Fase 1: Auditoría de Ignies ✅ COMPLETADA

**Objetivo:** Identificar cómo carga modelos, mapas, animaciones y equipamiento. Documentar arquitectura y puntos de extensión.

**Logros:**
- Pipeline de GLBs documentado en `modelLoader.ts`
- Sistema de rig MU (62 huesos) identificado
- Puntos de extensión para visual overrides mapeados
- Validación de compatibilidad con `devQuery()` implementada

---

### Fase 2: Pipeline de Assets ✅ COMPLETADA

**Objetivo:** Permitir alternar entre recursos clásicos autorizados y modelos propios GLB/glTF mediante configuración, sin modificar OpenMU.

**Logros:**
- Hook `resolveItemVisualOverride()` implementado
- Reglas de negocio: solo Leather Armor (group 8, num 5) con `visualProfile=evolution` + `visualEquipment=leather`
- Seguridad contra path traversal validada
- Fallback automático a Classic si falla carga
- Tests unitarios: 10/10 pasando
- Tests E2E: 6/6 pasando

**Configuración dev:**
```bash
http://localhost:5173/?visualProfile=evolution&visualEquipment=leather
```

---

### Fase 3: Primer Personaje Original 🔧 EN PROGRESO

**Objetivo:** Integrar un modelo 3D nuevo con animaciones de movimiento, ataque, daño y muerte.

**Requisitos técnicos:**
- Rig MU compatible (62 huesos en orden exacto)
- Animaciones mapeadas a PlayerAction enum: idle, walk, run, attack, death
- Compatibilidad con sistema de equipamiento existente
- Sockets para attachments: Weapon1→33, Weapon2→42, Wings→47

**Estrategias disponibles:**

| Estrategia | Ventaja | Riesgo | Estado |
|------------|---------|--------|--------|
| **A. GLB completo con rig MU compatible** | Máxima compatibilidad | Requiere modelador 3D experto | ⏳ Pendiente |
| **B. Retargeting automático** | Flexible | Complejidad técnica, errores visuales posibles | ❌ No implementado |
| **C. Hybrid (recomendada)** | Garantiza compatibilidad total | Menor libertad artística | 🔧 Implementando |

**Enfoque recomendado - Opción C:**
1. Reutilizar rig MU existente (`player.glb`) como base
2. Reemplazar solo meshes del cuerpo con modelo propio
3. Copiar clips de animaciones existentes al nuevo GLB
4. Mantener skeleton y sockets intactos

---

### Fase 4: Equipamiento Original ⏳ PENDIENTE

**Objetivo:** Implementar armas y armaduras originales, attachments, materiales y efectos visuales según niveles de mejora.

**Requisitos:**
- Sistema de materials PBR para diferentes tipos de equipo
- Efectos visuales progresivos (mejora +10, +15, etc.)
- Attachments modulares (gemas, runas)
- Sockets compatibles con rig MU

---

### Fase 5: Modernización Gráfica ⏳ PENDIENTE

**Objetivo:** Mejorar iluminación, shaders, partículas, cámara y rendimiento, manteniendo el gameplay clásico.

**Mejoras planificadas:**
- Iluminación global (Cycles renderer)
- Shaders personalizados para efectos mágicos
- Sistema de partículas integrado
- Optimización de renderizado (LOD, frustum culling)
- Cámara mejorada con controles más fluidos

---

### Fase 6: Mundo Propio ⏳ PENDIENTE

**Objetivo:** Sustituir progresivamente mapas, monstruos, NPCs, sonidos y escenarios.

**Enfoque incremental:**
1. Comenzar con zonas pequeñas (Lorencia, campos de entrenamiento)
2. Mantener compatibilidad con assets originales para regiones no modificadas
3. Sistema de texturas pack para swaps dinámicos
4. Migración progresiva sin romper gameplay existente

---

### Fase 7: Evolución del Gameplay ⏳ FUTURO

**Objetivo:** Incorporar nuevas clases, crafting, loot, habilidades, bosses y progresión. Evaluar posteriormente independencia de OpenMU.

**Características potenciales:**
- Nuevas clases con mecánicas únicas
- Sistema de crafting avanzado
- Loot table personalizado
- Habilidades especiales por clase
- Bosses con patrones de ataque complejos
- Progresión no-lineal

---

## Principios de Desarrollo

### 1. Reutilizar al máximo lo que ya funciona
- No reinventar sistemas existentes si funcionan bien
- Extender en lugar de reemplazar cuando sea posible
- Mantener compatibilidad con assets originales

### 2. Mantener siempre una versión jugable
- Cada commit debe dejar el proyecto funcional
- Cambios reversibles sin pérdida de progreso
- Feature flags para experimentos riesgosos

### 3. Cambios incrementales y reversibles
- Pequeños pasos verificables
- Rollback inmediato si algo falla
- Tests automáticos antes de cada merge

### 4. No modificar el protocolo ni el servidor inicialmente
- Cliente Babylon.js independiente del server OpenMU
- Protocolo MU Online mantenido intacto inicialmente
- Posible desacoplamiento futuro como objetivo a largo plazo

### 5. Respetar licencias y sustituir recursos propietarios antes de distribución
- Assets CC0 o propios para contenido original
- Documentación clara de licencias
- Sustitución gradual de assets propietarios

---

## Stack Tecnológico

| Componente | Tecnología | Notas |
|------------|-----------|-------|
| **Cliente** | Babylon.js + TypeScript | Cliente 3D moderno |
| **Server** | OpenMU (.NET) | Server MU Season 6 |
| **Modelado 3D** | Blender | Para assets originales |
| **Animaciones** | GLB/glTF format | Estándar web moderno |
| **Testing** | Vitest + Babylon.js headless | Tests unitarios y E2E |
| **Agentes de código** | Hermes Agent (qwen local) | Automatización de tareas |

---

## Configuración del Entorno

### Modelos de IA disponibles

| Modelo | Estado | Uso recomendado |
|--------|--------|-----------------|
| qwen/qwen3.5-35b-a3b (LM Studio local) | ✅ Activo | Tareas técnicas, código |
| Sol 6.1 | ⏳ Alias creado (sin API key) | Razonamiento complejo |
| Astra | ⏳ Alias creado (sin API key) | Análisis profundo |

### Configuración Hermes Agent

```yaml
# ~/.hermes/config.yaml
model:
  model: qwen/qwen3.5-35b-a3b
  provider: custom
  base_url: http://localhost:1234/v1

model_aliases:
  sol: openrouter/sol-6.1
  astra: openrouter/nous/astra-1.0
```

---

## Herramientas y Skills Disponibles

### Skills creadas en esta sesión

| Skill | Propósito | Estado |
|-------|-----------|--------|
| `blender-3d` | Crear assets 3D con Python bpy automation | ✅ Creada |
| `testing-webgl-assets` | Tests unitarios de GLB/glTF con Vitest en Babylon.js | ✅ Disponible |

### Scripts creados

| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `src/tools/validateMUCompatibleGLB.ts` | Validar rig MU compatible (62 huesos) | ✅ Creado |
| `src/tools/fantasy_sword.py` | Script Blender para espada fantástica | ✅ Creado (pendiente ejecutar) |
| `src/tools/createFantasySword.ts` | Generador Babylon.js de espada | ⚠️ Requiere ajustes |

---

## Próximos Pasos Inmediatos

### 1. Configurar API Key de OpenRouter (opcional pero recomendado)

```bash
# Obtener en https://openrouter.ai/keys
export OPENROUTER_API_KEY="sk-or-..."

# Verificar que Sol 6.1 esté disponible
hermes model sol
```

**Beneficio:** Acceso a modelos más potentes para tareas complejas de razonamiento.

### 2. Instalar Blender (si no está instalado)

Blender requiere instalación manual en Windows:
- Descargar desde https://www.blender.org/download/
- Instalar en `C:/Program Files/Blender Foundation/`
- Ejecutar scripts Python con: `blender --background --python script.py`

**Beneficio:** Creación de assets 3D profesionales con bpy automation.

### 3. Implementar Fase 3 (Personaje Original)

Usando **Opción C - Hybrid**:
1. Reutilizar rig MU existente (`player.glb`)
2. Reemplazar meshes del cuerpo con modelo propio
3. Copiar clips de animaciones existentes al nuevo GLB
4. Integrar con sistema visual overrides

**Dependencias:**
- Script `fantasy_sword.py` ya creado (requiere Blender para ejecutar)
- Asset pipeline validado en Fase 2
- Tests de compatibilidad listos (`validateMUCompatibleGLB.ts`)

---

## Métricas y KPIs

| Métrica | Objetivo Actual | Estado |
|---------|----------------|--------|
| **Tests unitarios** | 100% passing | ✅ 18/18 pasando |
| **Assets GLB validados** | 2 existentes | ✅ Box.glb + evolution_body.glb |
| **Sistema visual overrides** | Funcional con fallback | ✅ Implementado |
| **Personaje original** | Al menos 1 completo | ⏳ En desarrollo (Fase 3) |

---

## Riesgos y Mitigaciones

### Riesgo 1: Blender no instalado o difícil de automatizar
- **Mitigación:** Usar Opción B - Retargeting automático con scripts Babylon.js
- **Fallback:** Generar modelos básicos desde código TypeScript

### Riesgo 2: Rig MU incompatible con nuevos assets
- **Mitigación:** Script `validateMUCompatibleGLB.ts` valida rig antes de integrar
- **Fallback:** Mantener rig original, solo cambiar apariencia visual

### Riesgo 3: Modelos de IA no disponibles o costosos
- **Mitigación:** qwen local ya funciona sin costos adicionales
- **Fallback:** Usar modelos gratuitos (Sol/Astra) cuando sea posible

---

## Referencias y Documentación

### Archivos clave del proyecto

| Archivo | Propósito | Ubicación |
|---------|-----------|-----------|
| `itemVisualOverrides.ts` | Hook principal de visual overrides | `src/controllers/actors/` |
| `modelLoader.ts` | Pipeline de carga de GLBs | `src/controllers/assets/` |
| `visualOverrides.test.ts` | Tests E2E de query params | `src/controllers/actors/` |
| `glbLoading.test.ts` | Validación de archivos GLB binarios | `src/controllers/actors/` |

### Documentación existente

- `README.md`: Líneas 244-409 - Flags de dev, assets disponibles, ejemplos
- `docs/architecture_audit.md`: Auditoría completa del pipeline
- `docs/baseline.md`: Registro de estado inicial del proyecto

---

## Contacto y Colaboración

**Líder técnico:** Backend lead (sin experiencia en modelado 3D)  
**Enfoque:** Automatización mediante scripts Python/TypeScript, no modelado manual  
**Herramientas principales:** Hermes Agent, qwen local, Blender automation con bpy

---

*Hoja de ruta generada: Octubre 2026*  
*Última actualización: Octubre 26, 2026*  
*Versión del proyecto: OpenMu-Client-Babylon v1.0 (feature/custom-asset-pipeline)*
