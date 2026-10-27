/**
 * Fantasy Sword Generator for OpenMu-Client-Babylon  
 * Creates an original MMORPG-style fantasy sword using Babylon.js
 */

import { Engine, Scene, ArcRotateCamera, HemisphericLight, PBRMaterial, MeshBuilder, Vector3 } from '@babylonjs/core';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '/c/Users/Andres/Documents/Codex/2026-10-24/bu/mu-online/OpenMu-Client-Babylon/public/game-assets/FantasyItems';
const GLB_PATH = path.join(OUTPUT_DIR, 'fantasy_sword.glb');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function createFantasySword() {
  console.log('🔨 Creating Fantasy Sword...');

  const engine = new Engine(null, true);
  const scene = new Scene(engine);

  const camera = new ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 3, 5, Vector3.Zero(), scene);
  camera.attachControl(false);

  const hemiLight = new HemisphericLight('HemiLight', new Vector3(1, -1, 0), scene);
  hemiLight.intensity = 0.7;
  hemiLight.diffuse = new Color4(0.95, 0.95, 1.0);

  // Materials
  const bladeMaterial = new PBRMaterial('Blade', scene);
  bladeMaterial.albedoColor = new Color3(0.2, 0.25, 0.4);
  bladeMaterial.metallic = 0.95;
  bladeMaterial.roughness = 0.15;

  const guardMaterial = new PBRMaterial('Guard', scene);
  guardMaterial.albedoColor = new Color3(0.95, 0.82, 0.35);
  guardMaterial.metallic = 0.98;
  guardMaterial.roughness = 0.1;

  const handleMaterial = new PBRMaterial('Handle', scene);
  handleMaterial.albedoColor = new Color3(0.15, 0.08, 0.05);
  handleMaterial.metallic = 0.0;
  handleMaterial.roughness = 0.65;

  const swordGroup = new TransformNode('FantasySword', scene);

  // Blade
  const blade = MeshBuilder.CreateCylinder('Blade', { diameter: 0.9, height: 2.8, tessellation: 32 }, scene);
  blade.parent = swordGroup;
  blade.position = new Vector3(0, 1.4, 0);
  blade.scaling = new Vector3(1, 1, 0.6);
  blade.material = bladeMaterial;

  // Guard
  const guard = MeshBuilder.CreateCylinder('Guard', { diameter: 1.1, height: 0.15, tessellation: 32 }, scene);
  guard.parent = swordGroup;
  guard.position = new Vector3(0, 0.75, 0);
  guard.rotation.x = Math.PI / 2;
  guard.material = guardMaterial;

  // Handle  
  const handle = MeshBuilder.CreateCylinder('Handle', { diameter: 0.4, height: 1.2, tessellation: 16 }, scene);
  handle.parent = swordGroup;
  handle.position = new Vector3(0, 0.3, 0);
  handle.material = handleMaterial;

  // Pommel
  const pommel = MeshBuilder.CreateSphere('Pommel', { diameter: 0.5, tessellation: 16 }, scene);
  pommel.parent = swordGroup;
  pommel.position = new Vector3(0, -0.15, 0);
  pommel.scaling.y = 0.8;
  pommel.material = guardMaterial;

  console.log('✅ Sword created');
  console.log(`📦 Exporting to: ${GLB_PATH}`);

  const exporter = new GLTFExporter();
  const gltf = await exporter.serializeAsync(scene, swordGroup, {});
  
  fs.writeFileSync(GLB_PATH, Buffer.from(gltf));
  console.log('✅ GLB export successful!');
}

createFantasySword().catch(console.error);
