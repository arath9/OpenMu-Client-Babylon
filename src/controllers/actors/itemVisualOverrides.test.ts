import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerClass } from '../../core/types';
import { resolveItemVisualOverride } from './itemVisualOverrides';
import { devQuery } from '../../core/devSeams';

// Mock devQuery para tests
vi.mock('../../core/devSeams', () => ({
  devQuery: vi.fn(),
}));

describe('resolveItemVisualOverride', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null for non-Leather Armor items (group != 8 or num != 5)', () => {
    expect(resolveItemVisualOverride(7, 10, PlayerClass.DarkKnight, 'Player/ArmorMale06.glb', 'Custom/test.glb')).toBeNull();
    expect(resolveItemVisualOverride(9, 5, PlayerClass.DarkKnight, 'Player/ArmorMale06.glb', 'Custom/test.glb')).toBeNull();
  });

  it('returns null when profile or equipment conditions are not met', () => {
    vi.mocked(devQuery).mockImplementation((key: string) => {
      if (key === 'visualProfile') return 'classic';
      if (key === 'visualEquipment') return 'leather';
      return null;
    });

    expect(resolveItemVisualOverride(8, 5, PlayerClass.DarkKnight, 'Player/ArmorMale06.glb', 'Custom/Box.glb')).toBeNull();
  });

  it('returns asset path when all conditions match', () => {
    vi.mocked(devQuery).mockImplementation((key: string) => {
      if (key === 'visualProfile') return 'evolution';
      if (key === 'visualEquipment') return 'leather';
      return null;
    });

    const result = resolveItemVisualOverride(8, 5, PlayerClass.DarkKnight, 'Player/ArmorMale06.glb', 'Custom/Box.glb');
    expect(result).toBe('Custom/Box.glb');
  });

  it('accepts evolution_body.glb as valid asset', () => {
    vi.mocked(devQuery).mockImplementation((key: string) => {
      if (key === 'visualProfile') return 'evolution';
      if (key === 'visualEquipment') return 'leather';
      return null;
    });

    const result = resolveItemVisualOverride(8, 5, PlayerClass.DarkKnight, 'Player/ArmorMale06.glb', 'Custom/evolution_body.glb');
    expect(result).toBe('Custom/evolution_body.glb');
  });

  it('returns null for non-GLB paths', () => {
    vi.mocked(devQuery).mockImplementation((key: string) => {
      if (key === 'visualProfile') return 'evolution';
      if (key === 'visualEquipment') return 'leather';
      return null;
    });

    expect(resolveItemVisualOverride(8, 5, PlayerClass.DarkKnight, 'Player/ArmorMale06.gltf', 'Custom/Box.glb')).toBeNull();
    expect(resolveItemVisualOverride(8, 5, PlayerClass.DarkKnight, 'Player/ArmorMale06.obj', 'Custom/Box.glb')).toBeNull();
  });

  it('returns null for invalid asset paths (not in Custom/ folder)', () => {
    vi.mocked(devQuery).mockImplementation((key: string) => {
      if (key === 'visualProfile') return 'evolution';
      if (key === 'visualEquipment') return 'leather';
      return null;
    });

    expect(resolveItemVisualOverride(8, 5, PlayerClass.DarkKnight, 'Player/ArmorMale06.glb', '../Box.glb')).toBeNull();
    expect(resolveItemVisualOverride(8, 5, PlayerClass.DarkKnight, 'Player/ArmorMale06.glb', 'https://example.com/test.glb')).toBeNull();
    expect(resolveItemVisualOverride(8, 5, PlayerClass.DarkKnight, 'Player/ArmorMale06.glb', 'Custom/Box.gltf')).toBeNull();
  });

  it('returns null for null asset', () => {
    vi.mocked(devQuery).mockImplementation((key: string) => {
      if (key === 'visualProfile') return 'evolution';
      if (key === 'visualEquipment') return 'leather';
      return null;
    });

    expect(resolveItemVisualOverride(8, 5, PlayerClass.DarkKnight, 'Player/ArmorMale06.glb', null)).toBeNull();
  });

  it('accepts any valid GLB name in Custom/ folder (Box, evolution_body)', () => {
    vi.mocked(devQuery).mockImplementation((key: string) => {
      if (key === 'visualProfile') return 'evolution';
      if (key === 'visualEquipment') return 'leather';
      return null;
    });

    // According to current implementation, it doesn't check player class for items
    // So this should still work for any class
    expect(resolveItemVisualOverride(8, 5, PlayerClass.DarkWizard, 'Player/ArmorMale06.glb', 'Custom/Box.glb')).toBe('Custom/Box.glb');
    expect(resolveItemVisualOverride(8, 5, PlayerClass.FairyElf, 'Player/ArmorMale06.glb', 'Custom/evolution_body.glb')).toBe('Custom/evolution_body.glb');
  });
});
