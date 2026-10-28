import { afterAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine';
import { Scene } from '@babylonjs/core/scene';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import '@babylonjs/loaders/glTF/2.0/index';
import { loadGLTF } from '../assets/modelLoader';
import { PlayerObject } from './playerObject';
import * as overrides from './itemVisualOverrides';
import { Ecs } from '../../ecs/current';
import { AppearanceSystem } from '../../ecs/systems/appearanceSystem';
import type { Item, World } from '../../ecs/world';
import type { ModelObject } from '../render/modelObject';
import { CharacterClassNumber } from '../../core/types';

const requests = vi.hoisted(() => [] as string[]);
vi.hoisted(() => {
  (globalThis as Record<string, unknown>).location = {
    href: 'http://localhost/offline', search: '', hostname: 'localhost', protocol: 'http:',
  };
});
// Keep the resolver, PlayerObject, appearance system and GLB loader real.
// Only replace browser I/O and unrelated world/UI integration seams.
vi.mock('../assets/resolveUrlToDataFolder', () => ({ resolveUrlToDataFolder: (path: string) => path }));
vi.mock('../assets/compressedAssets', async original => ({
  ...await original<object>(),
  fetchAsset: async (path: string) => {
    requests.push(path);
    return { bytes: new Uint8Array(readFileSync(`public/game-assets/${path}`)), fromSidecar: false };
  },
}));
vi.mock('../item_fx/itemVisualTier', () => ({ itemVisualTier: () => ({ active: false }) }));
vi.mock('../../ecs/systems/gmMark', () => ({ syncGmMark: () => {} }));
vi.mock('../../ecs/systems/creditsAccent', () => ({ syncCreditsAccent: () => {} }));
vi.stubGlobal('FileReader', class {
  result?: ArrayBuffer;
  onload?: (event: { target: { result?: ArrayBuffer } }) => void;
  onloadend?: () => void;
  onerror?: () => void;
  readAsArrayBuffer(file: Blob) {
    file.arrayBuffer().then(result => {
      this.result = result;
      this.onload?.({ target: this });
      this.onloadend?.();
    }, () => this.onerror?.());
  }
  abort() {}
});
const plugin = SceneLoader.OnPluginActivatedObservable.add(loader => {
  (loader as unknown as { skipMaterials: boolean }).skipMaterials = true;
});
const engine = new NullEngine();
const scene = new Scene(engine);
Ecs.world = { scene } as World;
afterAll(() => {
  Ecs.world = null;
  SceneLoader.OnPluginActivatedObservable.remove(plugin);
  scene.dispose();
  engine.dispose();
  vi.unstubAllGlobals();
});

function meshNames(part: ModelObject): string[] {
  return part.getMeshes(true).filter(mesh => mesh.getTotalVertices() > 0).map(mesh => mesh.name);
}

// Dragon equipment (the former offline default) replaces the body sockets;
// it is not layered over the Veyra default body.
describe('Veyra offline appearance', () => {
  it('loads the actual head GLB directly without consulting the override hook', async () => {
    const hook = vi.spyOn(overrides, 'resolveCharacterVisualOverride');
    const player = new PlayerObject(scene, new TransformNode('directVeyraHead', scene));
    try {
      player.load(await loadGLTF('Player/player.glb', { scene }));
      player.Helm.load(await loadGLTF('Custom/veyra_head.glb', { scene }));
      const meshes = player.Helm.getMeshes(true).filter(mesh => mesh.getTotalVertices() > 0);
      expect(meshes).toHaveLength(3);
      expect(meshes.reduce((vertices, mesh) => vertices + mesh.getTotalVertices(), 0)).toBe(480);
      expect(meshes.every(mesh => mesh.name.startsWith('veyra_head'))).toBe(true);
      expect(meshes.every(mesh => mesh.skeleton === player.gltf?.skeleton)).toBe(true);
      expect(hook).not.toHaveBeenCalled();
    } finally {
      hook.mockRestore();
      player.dispose();
    }
  });
  it('loads Veyra without a character query, replaces it with Dragon, and restores it when bare', async () => {
    const hook = vi.spyOn(overrides, 'resolveCharacterVisualOverride');
    const warning = vi.spyOn(console, 'warn');
    const player = new PlayerObject(scene, new TransformNode('offlineHero', scene));
    const parts = [player.Helm, player.Armor, player.Pants, player.Gloves, player.Boots];
    try {
      player.load(await loadGLTF('Player/player.glb', { scene }));
      await player.updateBodyPartClassesAsync();
      const veyraPaths = ['head', 'armor', 'pants', 'gloves', 'boots'].map(part => `Custom/veyra_${part}.glb`);
      expect(requests).toEqual(expect.arrayContaining(veyraPaths));
      expect(hook.mock.calls.map(call => call[0])).toEqual(expect.arrayContaining([
        'Player/HelmClass02.glb', 'Player/ArmorClass02.glb', 'Player/PantClass02.glb',
        'Player/GloveClass02.glb', 'Player/BootClass02.glb',
      ]));
      for (const part of parts) {
        expect(meshNames(part).length).toBeGreaterThan(0);
        expect(meshNames(part).every(name => name.startsWith('veyra_'))).toBe(true);
      }
      const dragon = (group: number): Item => ({ group, num: 1, lvl: 0, isExcellent: false });
      const appearance = {
        charClass: CharacterClassNumber.DarkKnight,
        helm: dragon(7) as Item | null, armor: dragon(8) as Item | null,
        pants: dragon(9) as Item | null, gloves: dragon(10) as Item | null,
        boots: dragon(11) as Item | null,
        leftHand: null, rightHand: null, wings: null, pet: null, changed: true,
      };
      const entity = { modelObject: player, charAppearance: appearance, visibility: { state: 'visible' } };
      const system = AppearanceSystem({ with: () => [entity], mapIndex: 0 } as unknown as World);
      player.Ready = true;
      system.update?.(0);
      await vi.waitFor(() => expect(player.PartsPending).toBe(0));
      expect(player.Helm.gltf).toBeNull(); // Dragon is a closed helmet.
      const equippedNames = [player.HelmMask, ...parts.slice(1)].flatMap(meshNames);
      expect(equippedNames.length).toBeGreaterThan(0);
      expect(equippedNames.some(name => name.startsWith('veyra_'))).toBe(false);
      expect(requests).toEqual(expect.arrayContaining([
        'Player/HelmMale02.glb', 'Player/ArmorMale02.glb', 'Player/PantMale02.glb',
        'Player/GloveMale02.glb', 'Player/BootMale02.glb',
      ]));
      Object.assign(appearance, { helm: null, armor: null, pants: null, gloves: null, boots: null, changed: true });
      system.update?.(0);
      await vi.waitFor(() => expect(player.PartsPending).toBe(0));
      for (const part of parts) {
        expect(meshNames(part).length).toBeGreaterThan(0);
        expect(meshNames(part).every(name => name.startsWith('veyra_'))).toBe(true);
      }
      expect(warning).not.toHaveBeenCalled();
      console.info('Veyra offline diagnostic', JSON.stringify({
        hookCalls: hook.mock.calls.map(call => call[0]), loaded: requests,
        restored: parts.flatMap(meshNames), warnings: warning.mock.calls.length,
      }));
    } finally {
      hook.mockRestore();
      warning.mockRestore();
      player.dispose();
    }
  }, 60_000);
});
