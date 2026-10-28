import { afterEach, describe, expect, it, vi } from 'vitest';
import * as overrides from './itemVisualOverrides';
import { devQuery } from '../../core/devSeams';

vi.mock('../../core/devSeams', () => ({ devQuery: vi.fn() }));
afterEach(() => vi.resetAllMocks());

describe('Veyra default body selection', () => {
  it.each([null, '', 'other'])('keeps Classic without an explicit Veyra selection (%s)', character => {
    vi.mocked(devQuery).mockImplementation(key => key === 'character' ? character : null);
    expect(overrides.resolveCharacterVisualOverride('Player/ArmorClass02.glb')).toBeNull();
  });
  it('accepts the canonical spelling without rewriting the requested veira alias', () => {
    vi.mocked(devQuery).mockReturnValue('veyra');
    expect(overrides.resolveCharacterVisualOverride('Player/ArmorClass03.glb')).toBe('Custom/veyra_armor.glb');
  });
  it.each(['Player/player.glb', 'Player/ArmorMale06.glb', 'Item/Sword01.glb', 'Custom/body.glb', '../Player/ArmorClass02.glb', 'https://host/Player/ArmorClass02.glb'])('does not replace equipment, rigs or arbitrary paths: %s', path => {
    vi.mocked(devQuery).mockReturnValue('veira');
    expect(overrides.resolveCharacterVisualOverride(path)).toBeNull();
  });
  it('selects all five original body parts for the requested veira query', () => {
    vi.mocked(devQuery).mockImplementation(key => key === 'character' ? 'veira' : null);
    const resolve = overrides.resolveCharacterVisualOverride;
    for (const [prefix, part] of [['Helm', 'head'], ['Armor', 'armor'], ['Pant', 'pants'], ['Glove', 'gloves'], ['Boot', 'boots']]) {
      expect(resolve(`Player/${prefix}Class02.glb`)).toBe(`Custom/veyra_${part}.glb`);
    }
  });
});
