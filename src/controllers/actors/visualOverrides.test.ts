import { describe, expect, it, vi } from 'vitest';
import { PlayerClass } from '../../core/types';
import { resolveBodyOverride, resolveEquipmentOverride, loadBodyOverride } from './visualOverrides';

describe('the development body override', () => {
  it('selects only Leather Armor in the equipment profile', () => {
    expect(resolveEquipmentOverride('evolution', 'leather', PlayerClass.DarkKnight, 'Player/ArmorMale06.glb', 'Custom/body.glb')).toBe('Custom/body.glb');
    expect(resolveEquipmentOverride('evolution', null, PlayerClass.DarkKnight, 'Player/ArmorMale06.glb', 'Custom/body.glb')).toBeNull();
    expect(resolveEquipmentOverride('evolution', 'leather', PlayerClass.DarkWizard, 'Player/ArmorMale06.glb', 'Custom/body.glb')).toBeNull();
    expect(resolveEquipmentOverride('evolution', 'leather', PlayerClass.DarkKnight, 'Player/ArmorMale02.glb', 'Custom/body.glb')).toBeNull();
  });
  it('keeps Classic without an explicitly selected profile', () => {
    expect(resolveBodyOverride(null, PlayerClass.DarkKnight, 'ArmorClass')).toBeNull();
    expect(resolveBodyOverride('unknown', PlayerClass.DarkKnight, 'ArmorClass')).toBeNull();
  });

  it('replaces only the selected class and default armor', () => {
    expect(resolveBodyOverride('evolution', PlayerClass.DarkKnight, 'ArmorClass', 'Custom/body.glb')).toBe('Custom/body.glb');
    expect(resolveBodyOverride('evolution', PlayerClass.DarkWizard, 'ArmorClass')).toBeNull();
    expect(resolveBodyOverride('evolution', PlayerClass.DarkKnight, 'HelmClass')).toBeNull();
  });

  it('requires an explicit local GLB without path traversal', () => {
    for (const asset of [null, '../body.glb', 'Custom/../body.glb', 'https://example.com/body.glb', 'Custom/body.gltf']) {
      expect(resolveBodyOverride('evolution', PlayerClass.DarkKnight, 'ArmorClass', asset)).toBeNull();
    }
  });

  it('loads only the override when it succeeds', async () => {
    const load = vi.fn().mockResolvedValue(undefined);
    const warn = vi.fn();
    await loadBodyOverride('Custom/body.glb', 'Player/ArmorClass02.glb', load, warn);
    expect(load.mock.calls).toEqual([['Custom/body.glb']]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('reports a failed override and loads the original', async () => {
    const error = new Error('missing');
    const load = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    const warn = vi.fn();
    await loadBodyOverride('Custom/body.glb', 'Player/ArmorClass02.glb', load, warn);
    expect(load.mock.calls).toEqual([['Custom/body.glb'], ['Player/ArmorClass02.glb']]);
    expect(warn).toHaveBeenCalledWith('Custom/body.glb', error);
  });

  it('keeps an original load failure observable', async () => {
    const load = vi.fn().mockRejectedValue(new Error('missing'));
    await expect(loadBodyOverride(null, 'Player/ArmorClass02.glb', load, vi.fn())).rejects.toThrow('missing');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does not restore an obsolete part after another load or disposal', async () => {
    const load = vi.fn().mockRejectedValue(new Error('missing'));
    await loadBodyOverride('Custom/body.glb', 'Player/ArmorClass02.glb', load, vi.fn(), () => false);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
