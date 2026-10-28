# Especificación Técnica: Equipamiento Fantasy (Fase 4)

## Objetivo

Crear armas y armaduras con calidad artística profesional que combinen con Veyra.

---

## Requisitos Técnicos Comunes

### Rig MU Compatible
- **Slots**: 61 (skin_player + bone_0..59)
- **Sockets**: Weapon1→34, Weapon2→43, Wings→48
- **Animaciones**: Reutilizar clips existentes de player.glb

### Formato GLB/glTF
- glTF 2.0 válido
- Sin Draco/meshopt en primera entrega
- Texturas PNG/JPEG embebidas o en directorio assets/textures/
- Máximo 15,000 triángulos por arma completa
- Atlas de texturas 2048x2048 para armadura

---

## Espada Fantasy "Custodia del Umbral"

### Geometría
- **Lámina**: Obsidiana negra con vetas turquesa (300-500 triángulos)
- **Empuñadura**: Metal oscuro con runas grabadas (150-250 triángulos)
- **Guardamanos**: Diseño asimétrico, wings extendidas (200-400 triángulos)
- **Gema central**: Turquesa brillante incrustada en la cruz (20-50 triángulos)

### Materiales PBR
| Parte | Material | Propiedades |
|-------|----------|-------------|
| Lámina | ObsidianMetal | roughness=0.3, metallic=1.0, normal map |
| Empuñadura | DarkLeather | roughness=0.7, metallic=0.2, bump map |
| Guardamanos | RunedSilver | roughness=0.4, metallic=0.9, emissive=0.1 (turquesa) |
| Gema | CrystalTurquoise | roughness=0.1, metallic=0.5, transmission=0.8, IOR=1.45 |

### Efectos Visuales por Nivel
- **+0**: Aura turquesa tenue (emissive glow), runas ligeramente brillantes
- **+10**: Aura turquesa intensa, partículas flotantes alrededor de la hoja
- **+15**: Aura dorada + turquesa, partículas doradas, sonido visual (ondas)

### Animaciones Específicas
- **Idle**: Rotación suave de la espada en mano
- **Attack**: 3 animaciones (horizontal, vertical, thrust)
- **Equip/Unequip**: Slide-in/slide-out effect

---

## Armadura Segmentada "Veyra Detailed"

### Geometría y Materiales por Parte

| Parte | Triángulos | Material Principal | Detalles |
|-------|------------|-------------------|----------|
| Head | 400-600 | ObsidianPlate | Visor turquesa brillante, crestas laterales |
| Torso | 800-1200 | CompositeArmor | Placas superpuestas con runas incrustadas |
| Limbs | 600-900 | DarkLeather + Metal | Rodilleras/ coderalas plateadas |
| Armor (Chest) | 500-800 | RunedPlate | Runas turquesa luminosas, bordes dorados |
| Boots | 300-500 | HeavyBoots | Espuelas ornamentales, suela antideslizante |

### Texturas Detalladas (2048x2048 cada una)
- **obsidian_plate**: Normal map de placas superpuestas, roughness map de desgaste
- **runed_silver**: Emissive map de runas turquesa, normal map de grabados profundos
- **dark_leather**: Bump map de textura cuero realista, color variation random

### Sistema de Mejoras Progresivas
- **+10**: Runas se iluminan más intensamente (emissive multiplier 2x)
- **+15**: Runas cambian a dorado (color shift + emissive multiplier 3x), partículas flotantes

---

## Scripts Blender Required

### fantasy_sword.py
```python
import bpy, bmesh

# Generar espada procedural con gemas incrustadas
# - Crear lámina de obsidiana con normal map procedimental
# - Añadir empuñadura con textura leather
# - Insertar gema turquesa como mesh separado con material cristal
# - Exportar GLB válido

bpy.ops.export_scene.gltf(filepath="public/game-assets/Custom/equipment/fantasy_sword.fantasy_sword.glb")
```

### armor_detailed.py  
```python
import bpy

# Generar armadura segmentada Veyra Detailed
# - Crear 5 partes separadas con materiales PBR distintos
# - Aplicar texturas detalladas (normal, roughness, metalness maps)
# - Añadir runas como meshes independientes para emissive control
# - Exportar GLB compatible con rig MU

bpy.ops.export_scene.gltf(filepath="public/game-assets/Custom/equipment/veyra_armor_detailed.glb")
```

---

## Validación y Tests

### validateMUCompatibleGLB.ts
- Ejecutar contra fantasy_sword.fantasy_sword.glb
- Verificar rig 61 slots, sockets Weapon1/2 correctos
- Confirmar animaciones compatibles con PlayerAction enum

### Babylon.js Headless Tests
```typescript
describe('Fantasy Sword Load', () => {
  it('should load without errors', async () => {
    const gltf = await loadGLTF('Custom/equipment/fantasy_sword.fantasy_sword.glb');
    expect(gltf.meshes.length).toBeGreaterThan(0);
  });

  it('should have correct sockets', () => {
    const weapon1Slot = getSocketByIndex(34);
    const weapon2Slot = getSocketByIndex(43);
    expect(weapon1Slot.name).toBe('Weapon1');
    expect(weapon2Slot.name).toBe('Weapon2');
  });
});
```

### Screenshots Manuales
- Capturar espada en modo idle con aura +0, +10, +15
- Capturar armadura completa en Lorencia (luz día) y Devias (luz noche)
- Comparar calidad visual vs assets originales MU Classic

---

## Entregables Esperados

### Archivos GLB
```
public/game-assets/Custom/equipment/fantasy_sword.fantasy_sword.glb  (~200 KB, ~800 triangles)
public/game-assets/Custom/equipment/veyra_armor_detailed.glb        (~500 KB, ~3000 triangles total)
```

### Texturas
```
assets/textures/fantasy_sword/
  - obsidian_albedo.png (1024x1024)
  - obsidian_normal.png (1024x1024)
  - obsidian_roughness.png (1024x1024)

assets/textures/veyra_armor/
  - runed_plate_albedo.png (2048x2048)
  - runed_plate_normal.png (2048x2048)
  - runed_plate_emissive.png (2048x2048)
```

### Scripts Blender
```
src/tools/fantasy_sword.py    # Generador espada procedural
src/tools/armor_detailed.py   # Generador armadura Veyra Detailed
```

### Documentación
```
docs/equipamiento-fase4-especificacion.md  # Este documento completo
art/equipment_fantasy/readme.md            # Guía de assets generados
```

---

*Especificación creada: Octubre 2026 - Fase 4 MU Legacy Evolution*
