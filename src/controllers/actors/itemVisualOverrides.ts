import { PlayerClass } from '../../core/types';
import { devQuery } from '../../core/devSeams';

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
