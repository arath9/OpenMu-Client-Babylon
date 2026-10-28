import { afterAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine';
import { Scene } from '@babylonjs/core/scene';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import '@babylonjs/loaders/glTF/2.0/index';
import { loadGLTF } from '../assets/modelLoader';
import { PlayerObject } from './playerObject';
import { Ecs } from '../../ecs/current';
import type { World } from '../../ecs/world';

vi.hoisted(() => {
  (globalThis as Record<string, unknown>).location = { href: 'http://localhost/', search: '?character=veira', hostname: 'localhost', protocol: 'http:' };
});
vi.mock('../assets/resolveUrlToDataFolder', () => ({ resolveUrlToDataFolder: (path: string) => path }));
vi.mock('../assets/compressedAssets', async original => ({
  ...await original<object>(),
  fetchAsset: async (path: string) => ({ bytes: new Uint8Array(readFileSync(`public/game-assets/${path}`)), fromSidecar: false }),
}));

// Node supplies File but not FileReader. Geometry-only loading leaves material review to the browser.
vi.stubGlobal('FileReader', class {
  result?: ArrayBuffer;
  onload?: (event: { target: { result?: ArrayBuffer } }) => void;
  onloadend?: () => void;
  onerror?: () => void;
  readAsArrayBuffer(file: Blob) {
    file.arrayBuffer().then(result => { this.result = result; this.onload?.({ target: this }); this.onloadend?.(); }, () => this.onerror?.());
  }
  abort() {}
});
const plugin = SceneLoader.OnPluginActivatedObservable.add(loader => { (loader as unknown as { skipMaterials: boolean }).skipMaterials = true; });
function must<T>(value: T | undefined | null): T {
  if (value == null) throw new Error('Missing MU runtime data');
  return value;
}
const engine = new NullEngine();
const scene = new Scene(engine);
Ecs.world = { scene } as World;
afterAll(() => { Ecs.world = null; SceneLoader.OnPluginActivatedObservable.remove(plugin); scene.dispose(); engine.dispose(); vi.unstubAllGlobals(); });

describe('Veyra real MU loader', () => {
  it('shares every body mesh with the canonical parent and isolates sockets for two players', async () => {
    const players = [];
    for (let i = 0; i < 2; i++) {
      const player = new PlayerObject(scene, new TransformNode(`veyra_${i}`, scene));
      player.load(await loadGLTF('Player/player.glb', { scene }));
      await player.updateBodyPartClassesAsync();
      const skeleton = must(player.gltf).skeleton;
      expect(skeleton.bones).toHaveLength(61);
      const meshes = [player.Helm, player.Armor, player.Pants, player.Gloves, player.Boots].flatMap(part => must(part.gltf).mesh.getChildMeshes(false));
      expect(meshes.length).toBeGreaterThanOrEqual(5);
      for (const mesh of meshes.filter(mesh => mesh.getTotalVertices() > 0)) expect(mesh.skeleton === skeleton, mesh.name).toBe(true);
      for (const [slot, name] of [[34, 'bone_33_knife_gdf'], [43, 'bone_42_hand_bofdgne01'], [48, 'bone_47_Bone05']] as const) {
        expect(skeleton.bones[slot].name).toBe(name);
        expect(skeleton.bones[slot].getTransformNode()?.isDescendantOf(must(player.gltf).mesh)).toBe(true);
      }
      // Start/middle/end CPU samples of idle, walk, run, attack and death must stay finite.
      for (const action of [1, 15, 25, 38, 231]) {
        const clip = must(player.gltf).animationGroups[action];
        clip.start(false, 1);
        for (const frame of [clip.from, (clip.from + clip.to) / 2, clip.to]) {
          clip.goToFrame(frame);
          for (const bone of skeleton.bones) {
            const transform = must(bone.getTransformNode());
            transform.computeWorldMatrix(true);
            expect(transform.getWorldMatrix().asArray().every(Number.isFinite)).toBe(true);
          }
          for (const mesh of meshes.filter(mesh => mesh.getTotalVertices() > 0)) {
            const positions = must(mesh.getVerticesData('position')), slots = must(mesh.getVerticesData('matricesIndices'));
            for (let vertex = 0; vertex < positions.length / 3; vertex += 17) {
              const point = Vector3.FromArray(positions, vertex * 3);
              const matrix = must(skeleton.bones[slots[vertex * 4]].getTransformNode()).getWorldMatrix();
              expect(Vector3.TransformCoordinates(point, matrix).asArray().every(Number.isFinite)).toBe(true);
            }
          }
        }
        clip.stop();
      }
      players.push(player);
    }
    expect(must(players[0].gltf).skeleton).not.toBe(must(players[1].gltf).skeleton);
    expect(must(players[0].gltf).skeleton.bones[34].getTransformNode()).not.toBe(must(players[1].gltf).skeleton.bones[34].getTransformNode());
    for (const player of players) player.dispose();
  }, 120000);
});
