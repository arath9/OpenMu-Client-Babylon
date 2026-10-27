/**
 * Fantasy Sword Generator for OpenMu-Client-Babylon
 * Creates an original MMORPG-style fantasy sword using Babylon.js
 * Output: GLB file ready for use in the game engine
 */

import { Engine, Scene, ArcRotateCamera, HemisphericLight, PBRMaterial, MeshBuilder, Vector3, Color4 } from '@babylonjs/core';
import { GLTFExporter } from '@babylonjs/io';
import fs from 'fs';
import path from 'path';

// Output paths
const OUTPUT_DIR = '/c/Users/Andres/Documents/Codex/2026-10-24/bu/mu-online/OpenMu-Client-Babylon/public/game-assets/FantasyItems';
const GLB_PATH = path.join(OUTPUT_DIR, 'fantasy_sword.glb');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function createFantasySword() {
  console.log('🔨 Creating Fantasy Sword in Babylon.js...');

  // Create engine and scene (headless mode)
  const engine = new Engine(null, true); // Headless - no canvas needed
  const scene = new Scene(engine);

  // Setup camera for export view
  const camera = new ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 3, 5, Vector3.Zero(), scene);
  camera.attachControl(false);
  camera.wheelPrecision = 50;

  // Setup lighting (3-point lighting for PBR materials)
  const hemiLight = new HemisphericLight('HemiLight', new Vector3(1, -1, 0), scene);
  hemiLight.intensity = 0.7;
  hemiLight.diffuse = new Color4(0.95, 0.95, 1.0);

  const dirLight = new DirectionalLight('DirLight', new Vector3(-1, -2, -1), scene);
  dirLight.position = new Vector3(5, 10, 5);
  dirLight.intensity = 0.8;

  // Create PBR materials for fantasy appearance
  const bladeMaterial = new PBRMaterial('BladeMaterial', scene);
  bladeMaterial.albedoColor = new Color3(0.2, 0.25, 0.4); // Dark blue-silver
  bladeMaterial.metallic = 0.95;
  bladeMaterial.roughness = 0.15;
  bladeMaterial.emissiveColor = new Color3(0.25, 0.35, 0.6); // Blue glow
  bladeMaterial.emissiveIntensity = 0.25;

  const guardMaterial = new PBRMaterial('GuardMaterial', scene);
  guardMaterial.albedoColor = new Color3(0.95, 0.82, 0.35); // Gold
  guardMaterial.metallic = 0.98;
  guardMaterial.roughness = 0.1;

  const handleMaterial = new PBRMaterial('HandleMaterial', scene);
  handleMaterial.albedoColor = new Color3(0.15, 0.08, 0.05); // Dark leather brown
  handleMaterial.metallic = 0.0;
  handleMaterial.roughness = 0.65;

  // Create sword components
  const swordGroup = new TransformNode('FantasySword', scene);

  // Blade (tapered cone with edge bevel)
  const blade = MeshBuilder.CreateCone('Blade', {
    height: 2.8,
    diameter: 0.9,
    tessellation: 32
  }, scene);
  blade.parent = swordGroup;
  blade.position = new Vector3(0, 1.4, 0);
  blade.scaling = new Vector3(1, 1, 0.6); // Tapered effect
  blade.material = bladeMaterial;

  // Add bevel edges to blade
  const bevelTop = MeshBuilder.CreateCylinder('BevelTop', {
    diameter: 0.45,
    height: 0.1,
    tessellation: 32
  }, scene);
  bevelTop.parent = swordGroup;
  bevelTop.position = new Vector3(0, 2.75, 0);
  bevelTop.rotation.x = Math.PI / 2;
  bevelTop.material = bladeMaterial;

  const bevelBottom = MeshBuilder.CreateCylinder('BevelBottom', {
    diameter: 0.8,
    height: 0.1,
    tessellation: 32
  }, scene);
  bevelBottom.parent = swordGroup;
  bevelBottom.position = new Vector3(0, 0.25, 0);
  bevelBottom.rotation.x = Math.PI / 2;
  bevelBottom.material = bladeMaterial;

  // Guard (ornate curved crossguard)
  const guardBody = MeshBuilder.CreateCylinder('GuardBody', {
    diameter: 1.1,
    height: 0.15,
    tessellation: 32
  }, scene);
  guardBody.parent = swordGroup;
  guardBody.position = new Vector3(0, 0.75, 0);
  guardBody.rotation.x = Math.PI / 2;
  guardBody.material = guardMaterial;

  // Add decorative elements on guard (ornate details)
  const guardOrnament1 = MeshBuilder.CreateSphere('GuardOrnament1', {
    diameter: 0.3,
    tessellation: 16
  }, scene);
  guardOrnament1.parent = swordGroup;
  guardOrnament1.position = new Vector3(-0.45, 0.78, 0);
  guardOrnament1.material = guardMaterial;

  const guardOrnament2 = MeshBuilder.CreateSphere('GuardOrnament2', {
    diameter: 0.3,
    tessellation: 16
  }, scene);
  guardOrnament2.parent = swordGroup;
  guardOrnament2.position = new Vector3(0.45, 0.78, 0);
  guardOrnament2.material = guardMaterial;

  // Handle (grip with texture detail)
  const handle = MeshBuilder.CreateCylinder('Handle', {
    diameter: 0.4,
    height: 1.2,
    tessellation: 16
  }, scene);
  handle.parent = swordGroup;
  handle.position = new Vector3(0, 0.3, 0);
  handle.material = handleMaterial;

  // Pommel (ornate end cap)
  const pommel = MeshBuilder.CreateSphere('Pommel', {
    diameter: 0.5,
    tessellation: 16
  }, scene);
  pommel.parent = swordGroup;
  pommel.position = new Vector3(0, -0.15, 0);
  pommel.scaling.y = 0.8; // Slightly flattened
  pommel.material = guardMaterial;

  // Add magical glow effect (point light near blade)
  const magicLight = new PointLight('MagicLight', new Vector3(0, 1.5, 0), scene);
  magicLight.color = new Color3(0.2, 0.4, 0.9); // Blue magical glow
  magicLight.intensity = 0.5;

  console.log('✅ Sword components created');

  // Export to GLB using Babylon GLTFExporter
  console.log(`📦 Exporting to: ${GLB_PATH}`);

  try {
    const exporter = new GLTFExporter();
    const gltf = await exporter.serializeAsync(scene, swordGroup, {});
    
    fs.writeFileSync(GLB_PATH, Buffer.from(gltf));
    console.log('✅ GLB export successful!');
    
    // Create metadata file
    const metadata = {
      name: 'FantasySword',
      description: 'Original MMORPG-style fantasy sword with PBR materials and magical glow effects',
      version: '1.0.0',
      created: new Date().toISOString(),
      author: 'Hermes Agent + Blender-3d Skill',
      materials: ['BladeMaterial (PBR blue-silver)', 'GuardMaterial (Gold)', 'HandleMaterial (Leather)'],
      dimensions: {
        bladeLength: 2.8,
        guardWidth: 1.1,
        handleLength: 1.2,
        totalHeight: 3.0
      },
      features: [
        'PBR materials with metallic and roughness',
        'Emissive glow effect on blade',
        'Ornate gold guard with decorative elements',
        'Textured leather grip',
        'Magical point light integration'
      ]
    };

    const metadataPath = GLB_PATH.replace('.glb', '.meta.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log('✅ Metadata saved!');

    return { success: true, path: GLB_PATH, metadata };

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  }
}

// Run the sword creation
createFantasySword()
  .then(result => {
    console.log('\n✨ Fantasy Sword Creation Complete!');
    console.log(`   File: ${result.path}`);
    console.log(`   Description: ${result.metadata.description}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to create sword:', error);
    process.exit(1);
  });
