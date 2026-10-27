import { PlayerClass } from '../../core/types';

export function resolveEquipmentOverride(profile: string | null, equipment: string | null, playerClass: PlayerClass, path: string, asset: string | null): string | null {
  return equipment === 'leather' && path === 'Player/ArmorMale06.glb'
    ? resolveBodyOverride(profile, playerClass, 'ArmorClass', asset)
    : null;
}

/** Development profile for a body part exported against the existing MU rig. */
export function resolveBodyOverride(profile: string | null, playerClass: PlayerClass, prefix: string, asset: string | null = null): string | null {
  return profile === 'evolution' && playerClass === PlayerClass.DarkKnight && prefix === 'ArmorClass'
    && asset !== null && /^Custom\/[A-Za-z0-9_-]+\.glb$/.test(asset)
    ? asset
    : null;
}

export async function loadBodyOverride(
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
