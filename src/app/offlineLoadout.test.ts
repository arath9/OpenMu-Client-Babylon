import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InventoryConstants } from '../core/inventoryConstants';

const state = vi.hoisted(() => ({
  hero: { items: [] as unknown[], syncPlayerAppearance: vi.fn(), name: '', charClass: 0 },
  world: { addComponent: vi.fn() },
}));
vi.mock('../controllers/actors', () => ({ characterSkinBody: () => null }));
vi.mock('../controllers/interface/uiState', () => ({ AppState: {}, UIState: { World: 'world' } }));
vi.mock('../modules/session', () => ({ Session: {} }));
vi.mock('../modules/hero', () => ({ Hero: state.hero }));
vi.mock('../modules/scope/net', () => ({ spawnPlayer: () => ({}) }));
vi.mock('../core/eventBus', () => ({ EventBus: { emit: vi.fn() } }));
vi.mock('../ecs/current', () => ({ Ecs: { world: state.world } }));
vi.mock('../core/devSeams', () => ({
  devQuery: (key: string) => new URLSearchParams(location.search).get(key),
  devVitalPercent: () => null,
}));
import { playOffline } from './offline';

const bodySlots = [InventoryConstants.HelmSlot, InventoryConstants.ArmorSlot,
  InventoryConstants.PantsSlot, InventoryConstants.GlovesSlot, InventoryConstants.BootsSlot];
beforeEach(() => {
  state.hero.items = Array.from({ length: 100 }, () => null);
  vi.stubGlobal('location', { search: '' });
  vi.stubGlobal('history', { replaceState: vi.fn() });
});

afterEach(() => vi.unstubAllGlobals());

describe('offline body loadout', () => {
  it.each(['', '?character=veira', '?character=veyra'])('does not cover Veyra with Dragon (%s)', search => {
    vi.stubGlobal('location', { search });
    // Also clear a previous demo loadout when entering offline again.
    for (const slot of bodySlots) state.hero.items[slot] = { group: 7, num: 1 };
    playOffline();
    expect(bodySlots.map(slot => state.hero.items[slot])).toEqual(bodySlots.map(() => null));
  });
  it('retains the Classic Dragon demo when explicitly requested', () => {
    vi.stubGlobal('location', { search: '?character=classic' });
    playOffline();
    expect(bodySlots.map(slot => state.hero.items[slot])).toEqual(bodySlots.map(() => expect.objectContaining({ num: 1 })));
  });
});
