import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { Scene, LoadAssetContainerAsync } from '@babylonjs/core';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine';
import * as fs from 'fs/promises';
import * as path from 'path';
import '@babylonjs/loaders/glTF';

describe('GLB Loading with Babylon.js NullEngine', () => {
  let engine: null;
  let scene: Scene;

  beforeEach(() => {
    // Create a headless engine for testing without GPU
    engine = new NullEngine();
    scene = new Scene(engine);
  });

  afterEach(() => {
    scene.dispose();
    engine.dispose();
  });

  it('loads Custom/Box.glb and verifies scene.getMeshes() > 0', async () => {
    const glbPath = path.join(process.cwd(), 'public/game-assets/Custom/Box.glb');
    
    // Read the GLB file as a buffer
    const glbBuffer = await fs.readFile(glbPath);
    
    // Use LoadAssetContainerAsync to load from binary buffer with Babylon.js loaders
    const container = await LoadAssetContainerAsync(glbBuffer, scene, { pluginExtension: '.glb' });
    
    // Add all loaded assets to the scene
    container.addAllToScene();

    // Verify that meshes were created from the GLB file using getMeshes() > 0
    const meshes = scene.meshes;
    expect(meshes.length).toBeGreaterThan(0);
  }, 10000);

  it('loads evolution_body.glb and verifies scene.getMeshes() > 0', async () => {
    const glbPath = path.join(process.cwd(), 'public/game-assets/Custom/evolution_body.glb');
    
    // Read the GLB file as a buffer
    const glbBuffer = await fs.readFile(glbPath);
    
    const container = await LoadAssetContainerAsync(glbBuffer, scene, { pluginExtension: '.glb' });
    container.addAllToScene();

    const meshes = scene.meshes;
    expect(meshes.length).toBeGreaterThan(0);
  }, 10000);
});
