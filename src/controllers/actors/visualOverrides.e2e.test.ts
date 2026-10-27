import { beforeEach, describe, expect, it, vi } from 'vitest';

// Setup mock location BEFORE importing modules that use devQuery
(globalThis as any).location = { href: 'http://localhost/', search: '', hostname: 'localhost', protocol: 'http:' };

import type { PlayerClass } from '../../core/types';
import { resolveItemVisualOverride, loadItemOverride } from './itemVisualOverrides';
import { devQuery } from '../../core/devSeams';

// Get reference to the mocked location
const mockLocation = (globalThis as any).location;

// Mock devQuery - matches pattern in itemVisualOverrides.test.ts but reads from URL params
vi.mock('../../core/devSeams', () => ({
  devQuery: vi.fn((key: string) => {
    const params = new URLSearchParams(mockLocation.search);
    return params.get(key);
  }),
}));

describe('E2E: Visual Overrides - Leather Armor Custom GLB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset search params before each test
    mockLocation.search = '';
  });

  it('verifies Leather Armor (group 8, num 5) uses custom GLB with ?visualProfile=evolution&visualEquipment=leather', () => {
    // Simulate URL: ?visualProfile=evolution&visualEquipment=leather
    mockLocation.search = '?visualProfile=evolution&visualEquipment=leather';

    const result = resolveItemVisualOverride(
      8, // Leather Armor group
      5, // Leather Armor num
      'dark_knight' as PlayerClass,
      'Player/ArmorMale06.glb',
      'Custom/evolution_body.glb'
    );

    expect(result).toBe('Custom/evolution_body.glb');
  });

  it('verifies Leather Armor uses custom GLB for all player classes with correct query params', () => {
    // Simulate URL: ?visualProfile=evolution&visualEquipment=leather
    mockLocation.search = '?visualProfile=evolution&visualEquipment=leather';

    const resultDarkKnight = resolveItemVisualOverride(
      8, 5, 'dark_knight' as PlayerClass, 'Player/ArmorMale06.glb', 'Custom/evolution_body.glb'
    );
    const resultDarkWizard = resolveItemVisualOverride(
      8, 5, 'dark_wizard' as PlayerClass, 'Player/ArmorFemale04.glb', 'Custom/evolution_body.glb'
    );
    const resultFairyElf = resolveItemVisualOverride(
      8, 5, 'fairy_elf' as PlayerClass, 'Player/ElfMale01.glb', 'Custom/evolution_body.glb'
    );

    expect(resultDarkKnight).toBe('Custom/evolution_body.glb');
    expect(resultDarkWizard).toBe('Custom/evolution_body.glb');
    expect(resultFairyElf).toBe('Custom/evolution_body.glb');
  });

  it('verifies Leather Armor does NOT use custom GLB without query params', () => {
    // No query params - should return null
    mockLocation.search = '';

    const result = resolveItemVisualOverride(
      8, // Leather Armor group
      5, // Leather Armor num
      'dark_knight' as PlayerClass,
      'Player/ArmorMale06.glb',
      'Custom/evolution_body.glb'
    );

    expect(result).toBeNull();
  });

  it('verifies Leather Armor does NOT use custom GLB with wrong visualProfile', () => {
    // Wrong profile - should return null
    mockLocation.search = '?visualProfile=classic&visualEquipment=leather';

    const result = resolveItemVisualOverride(
      8, 5, 'dark_knight' as PlayerClass, 'Player/ArmorMale06.glb', 'Custom/evolution_body.glb'
    );

    expect(result).toBeNull();
  });

  it('verifies Leather Armor does NOT use custom GLB with wrong visualEquipment', () => {
    // Wrong equipment - should return null
    mockLocation.search = '?visualProfile=evolution&visualEquipment=plate';

    const result = resolveItemVisualOverride(
      8, 5, 'dark_knight' as PlayerClass, 'Player/ArmorMale06.glb', 'Custom/evolution_body.glb'
    );

    expect(result).toBeNull();
  });

  it('verifies other armor items do NOT use custom GLB even with correct query params', () => {
    // Correct query params but wrong item - should return null
    mockLocation.search = '?visualProfile=evolution&visualEquipment=leather';

    const resultChainMail = resolveItemVisualOverride(
      8, // group
      3, // Chain Mail (num != 5)
      'dark_knight' as PlayerClass,
      'Player/ArmorMale06.glb',
      'Custom/something_else.glb'
    );

    const resultPlateArmor = resolveItemVisualOverride(
      8, // group
      7, // Plate Armor (num != 5)
      'dark_knight' as PlayerClass,
      'Player/ArmorMale06.glb',
      'Custom/something_else.glb'
    );

    expect(resultChainMail).toBeNull();
    expect(resultPlateArmor).toBeNull();
  });

  it('verifies loadItemOverride loads custom GLB when override is provided', async () => {
    mockLocation.search = '?visualProfile=evolution&visualEquipment=leather';

    const loadPath: string[] = [];
    const warnCalls: [string, unknown][] = [];

    await loadItemOverride(
      'Custom/evolution_body.glb', // override
      'Player/ArmorMale06.glb',   // original
      async (path: string) => {
        loadPath.push(path);
      },
      (path: string, error: unknown) => {
        warnCalls.push([path, error]);
      }
    );

    expect(loadPath).toContain('Custom/evolution_body.glb');
    expect(warnCalls.length).toBe(0);
  });

  it('verifies loadItemOverride falls back to original GLB when override fails', async () => {
    mockLocation.search = '?visualProfile=evolution&visualEquipment=leather';

    const loadPath: string[] = [];
    const warnCalls: [string, unknown][] = [];
    let shouldFail = true;

    await loadItemOverride(
      'Custom/failing.glb', // override that will fail
      'Player/ArmorMale06.glb',   // original fallback
      async (path: string) => {
        if (shouldFail && path === 'Custom/failing.glb') {
          shouldFail = false;
          throw new Error('Load failed');
        }
        loadPath.push(path);
      },
      (path: string, error: unknown) => {
        warnCalls.push([path, error]);
      }
    );

    expect(loadPath).toContain('Player/ArmorMale06.glb'); // Should fallback to original
  });
});
