"""
Fantasy Sword Creation Script for OpenMu-Client-Babylon
Creates an original MMORPG-style fantasy sword with PBR materials
Output: .blend file, PNG render, .glb export
"""

import bpy
import os

# ============================
# CONFIGURATION
# ============================
OUTPUT_DIR = r"C:\Users\Andres/Documents/Codex/2026-10-24/bu/mu-online/OpenMu-Client-Babylon/public/game-assets/FantasyItems"
BLEND_FILE = os.path.join(OUTPUT_DIR, "fantasy_sword.blend")
RENDER_OUTPUT = os.path.join(OUTPUT_DIR, "sword_render.png")
GLB_EXPORT = os.path.join(OUTPUT_DIR, "fantasy_sword.glb")

# ============================
# SCENE SETUP
# ============================
def clear_scene():
    """Clear all objects from scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Clear materials and textures
    for mat in bpy.data.materials:
        bpy.data.materials.remove(mat)
    for tex in bpy.data.textures:
        bpy.data.textures.remove(tex)

def setup_scene():
    """Setup camera, lighting, and world"""
    scene = bpy.context.scene
    
    # Camera setup
    cam = bpy.data.cameras.new(name="Camera")
    cam_obj = bpy.data.objects.new("Camera", cam)
    scene.collection.objects.link(cam_obj)
    
    cam_obj.location = (3, -3, 2.5)
    cam_obj.rotation_euler = (1.047, 0, 0.785)  # 60° angle
    scene.camera = cam_obj
    
    # Lighting setup (3-point lighting)
    # Key light
    key_light = bpy.data.lights.new(name="KeyLight", type='SUN')
    key_obj = bpy.data.objects.new("KeyLight", key_light)
    scene.collection.objects.link(key_obj)
    key_obj.location = (2, -1, 3)
    key_obj.rotation_euler = (0.5, 0, -0.5)
    
    # Fill light
    fill_light = bpy.data.lights.new(name="FillLight", type='SUN')
    fill_obj = bpy.data.objects.new("FillLight", fill_light)
    scene.collection.objects.link(fill_obj)
    fill_obj.location = (-2, 1, 2)
    fill_obj.rotation_euler = (0.3, 0, -2.5)
    
    # Rim light for fantasy effect
    rim_light = bpy.data.lights.new(name="RimLight", type='POINT')
    rim_obj = bpy.data.objects.new("RimLight", rim_light)
    scene.collection.objects.link(rim_obj)
    rim_obj.location = (0, 2, 1.5)
    rim_obj.energy = 150
    
    # World background for fantasy atmosphere
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    world.use_nodes = True
    nodes = world.node_tree.nodes
    bg = nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.1, 0.15, 0.25, 1)  # Dark blue tint
        bg.inputs['Strength'].default_value = 0.3

# ============================
# MATERIAL CREATION
# ============================
def create_fantasy_blade_material():
    """Create PBR material for blade with magical glow"""
    mat = bpy.data.materials.new(name="FantasyBlade")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    
    # Clear existing nodes
    for node in nodes:
        nodes.remove(node)
    
    # Principled BSDF
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)
    bsdf.inputs['Base Color'].default_value = (0.15, 0.2, 0.35, 1)  # Dark blue-silver
    bsdf.inputs['Metallic'].default_value = 0.95
    bsdf.inputs['Roughness'].default_value = 0.15
    bsdf.inputs['Specular Level'].default_value = 0.8
    bsdf.inputs['Emission Color'].default_value = (0.2, 0.3, 0.7, 1)  # Blue glow
    bsdf.inputs['Emission Strength'].default_value = 0.2
    
    # Output node
    output = nodes.get("Material Output")
    if output:
        links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    return mat

def create_fantasy_guard_material():
    """Create ornate guard material with gold accents"""
    mat = bpy.data.materials.new(name="FantasyGuard")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    
    # Clear existing nodes
    for node in nodes:
        nodes.remove(node)
    
    # Principled BSDF with gold appearance
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)
    bsdf.inputs['Base Color'].default_value = (0.95, 0.82, 0.35, 1)  # Gold
    bsdf.inputs['Metallic'].default_value = 0.98
    bsdf.inputs['Roughness'].default_value = 0.1
    bsdf.inputs['Emission Color'].default_value = (0.4, 0.2, 0.1, 1)  # Warm glow
    bsdf.inputs['Emission Strength'].default_value = 0.15
    
    output = nodes.get("Material Output")
    if output:
        links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    return mat

def create_fantasy_handle_material():
    """Create grip material with leather/wood appearance"""
    mat = bpy.data.materials.new(name="FantasyHandle")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    
    # Clear existing nodes
    for node in nodes:
        nodes.remove(node)
    
    # Principled BSDF with dark leather appearance
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)
    bsdf.inputs['Base Color'].default_value = (0.15, 0.08, 0.05, 1)  # Dark brown leather
    bsdf.inputs['Metallic'].default_value = 0.0
    bsdf.inputs['Roughness'].default_value = 0.65
    bsdf.inputs['Normal Strength'].default_value = 0.3
    
    output = nodes.get("Material Output")
    if output:
        links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    return mat

# ============================
# GEOMETRY CREATION
# ============================
def create_blade():
    """Create sword blade with tapered shape"""
    # Main blade (cone for tapering)
    bpy.ops.mesh.primitive_cone_add(
        vertices=32,
        radius1=0.45,
        radius2=0.08,
        depth=2.8,
        location=(0, 0, 1.9),
        rotation=(0, 0, 0)
    )
    blade = bpy.context.active_object
    blade.name = "Blade"
    
    # Add bevel modifier for sharp edge
    bevel_mod = blade.modifiers.new(name="Bevel", type='BEVEL')
    bevel_mod.width=0.02
    bevel_mod.segments=3
    bevel_mod.limit_method='ANGLE'
    bevel_mod.angle=0.785
    
    # Add subdivision for smoothness
    subsurf = blade.modifiers.new(name="Subdivision", type='SUBSURF')
    subsurf.levels=1
    subsurf.render_levels=2
    
    # Apply material
    blade.data.materials.append(create_fantasy_blade_material())
    
    return blade

def create_guard():
    """Create ornate guard with curved design"""
    # Main guard body (cylinder flattened)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=32,
        radius=0.55,
        depth=0.15,
        location=(0, 0, 0.8),
        rotation=(1.57, 0, 0)
    )
    guard = bpy.context.active_object
    guard.name = "Guard"
    
    # Shape it to be curved outward
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.transform.shrink_fatten(value=-0.05)  # Slight inward curve at center
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # Add bevel for smooth edges
    bevel_mod = guard.modifiers.new(name="Bevel", type='BEVEL')
    bevel_mod.width=0.02
    bevel_mod.segments=3
    
    # Apply material
    guard.data.materials.append(create_fantasy_guard_material())
    
    return guard

def create_handle():
    """Create sword handle with grip texture"""
    # Main handle (cylinder)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=16,
        radius=0.2,
        depth=1.2,
        location=(0, 0, 0.4),
        rotation=(0, 0, 0)
    )
    handle = bpy.context.active_object
    handle.name = "Handle"
    
    # Add texture detail (grooves for grip)
    mod = handle.modifiers.new(name="Grooves", type='DISPLACE')
    mod.texture = bpy.data.textures.new(name="GripTexture", type='NONE')  # Will add bump later
    
    # Apply material
    handle.data.materials.append(create_fantasy_handle_material())
    
    return handle

def create_pommel():
    """Create ornate pommel (end cap)"""
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdiv=3,
        radius=0.25,
        location=(0, 0, -0.1),
        scale=(1, 1, 0.8)
    )
    pommel = bpy.context.active_object
    pommel.name = "Pommel"
    
    # Apply same material as guard
    pommel.data.materials.append(create_fantasy_guard_material())
    
    return pommel

# ============================
# MAIN EXECUTION
# ============================
def main():
    print("🔨 Creating Fantasy Sword...")
    
    # Clear scene
    clear_scene()
    
    # Setup environment
    setup_scene()
    
    # Create sword parts
    blade = create_blade()
    guard = create_guard()
    handle = create_handle()
    pommel = create_pommel()
    
    # Select all for rendering
    bpy.ops.object.select_all(action='DESELECT')
    blade.select_set(True)
    guard.select_set(True)
    handle.select_set(True)
    pommel.select_set(True)
    
    # Render settings
    scene = bpy.context.scene
    render = scene.render
    
    # Cycles renderer for PBR quality
    render.engine = 'CYCLES'
    scene.cycles.samples = 128
    scene.cycles.use_denoising = True
    
    # Resolution
    render.resolution_x = 1920
    render.resolution_y = 1080
    render.resolution_percentage = 100
    render.filepath = RENDER_OUTPUT
    
    print(f"📸 Rendering to: {RENDER_OUTPUT}")
    bpy.ops.render.render(write_still=True)
    print("✅ Render complete!")
    
    # Export to GLB
    print(f"\n💾 Exporting to GLB: {GLB_EXPORT}")
    bpy.ops.object.select_all(action='DESELECT')
    blade.select_set(True)
    guard.select_set(True)
    handle.select_set(True)
    pommel.select_set(True)
    
    bpy.ops.export_scene.gltf(
        filepath=GLB_EXPORT,
        export_format='GLB',
        export_exportSelected=True,
        export_morph=False,
        export_animations=False,
        export_texembed=False,
        export_apply=True
    )
    print("✅ GLB export complete!")
    
    # Save blend file
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_FILE)
    print(f"💾 Blend file saved: {BLEND_FILE}")
    
    print("\n✨ Fantasy Sword Creation Complete!")
    print(f"   - Render: {RENDER_OUTPUT}")
    print(f"   - GLB Model: {GLB_EXPORT}")
    print(f"   - Source File: {BLEND_FILE}")

if __name__ == "__main__":
    main()
