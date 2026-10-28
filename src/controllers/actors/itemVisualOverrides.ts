import { PlayerClass } from '../../core/types';
import { devQuery } from '../../core/devSeams';

const VEYRA_PARTS: Record<string, string> = {
  Helm: 'head', Armor: 'armor', Pant: 'pants', Glove: 'gloves', Boot: 'boots',
};

/** Modular default body; keep the parent rig, equipment and accessory sockets unchanged. */
export function resolveCharacterVisualOverride(path: string): string | null {
  // Check if this is a Player part path (HelmClass01, ArmorClass02, etc.)
  const match = /^Player\/(Helm|Armor|Pant|Glove|Boot)Class\d{2}\.glb$/.exec(path);
  if (!match) {
    return null;
  }

  console.log('[Veyra] resolveCharacterVisualOverride called for:', path, 'match:', match[1]);

  // Production mode: always use Veyra for body parts (except Armor which is handled separately)
  const part = match[1];
  if (part !== 'Armor') {
    console.log('[Veyra] Returning Veyra override for', part, ': Custom/veyra_', VEYRA_PARTS[part], '.glb');
    return `Custom/veyra_${VEYRA_PARTS[part]}.glb`;
  }

  // Dev mode: respect ?character=veira|veyra for all parts including Armor
  const character = devQuery('character');
  if ((character === 'veira' || character === 'veyra') && part !== 'Armor') {
    console.log('[Veyra] Returning Veyra override (dev) for', part, ': Custom/veyra_', VEYRA_PARTS[part], '.glb');
    return `Custom/veyra_${VEYRA_PARTS[part]}.glb`;
  }

  // Dev mode: fallback to Classic when ?character=classic
  if (character === 'classic') {
    console.log('[Veyra] Returning null for Classic fallback');
    return null; // Let original path be used for all parts
  }

  return null;
}

/**
 * Resolve a custom GLB for an item icon based on profile/equipment/body settings.
 * v1: only Leather Armor (group 8, num 5) with the "evolution" profile and "leather" equipment.
 */
export function resolveItemVisualOverride(
  group: number,
  num: number,
  playerClass: PlayerClass,
  path: string,
  asset: string | null
): string | null {
  // Only Leather Armor (group 8, num 5) in the v1 implementation
  if (group !== 8 || num !== 5) return null;

  // Must be a GLB file and use a local path
  if (!path.endsWith('.glb') || !asset || !/^Custom\/[A-Za-z0-9_-]+\.glb$/.test(asset)) {
    return null;
  }

  const profile = devQuery('visualProfile');
  const equipment = devQuery('visualEquipment');

  // Only when both conditions are met (dev-only, so safe)
  if (profile === 'evolution' && equipment === 'leather') {
    return asset;
  }

  return null;
}

/**
 * Load an item model with optional override support. Falls back to the original path
 * when no override applies or when loading fails, unless the component is already disposed.
 */
export async function loadItemOverride(
  override: string | null,
  original: string,
  load: (path: string) => Promise<void>,
  warn: (path: string, error: unknown) => void,
  current: () => boolean = () => true
): Promise<void> {
  if (override) {
    try {
      await load(override);
      return;
    } catch (error) {
      warn(override, error);
      if (!current()) return;
    }
  }
  await load(original);
}
