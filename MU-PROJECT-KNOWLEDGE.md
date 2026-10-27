# MU Legacy Evolution - Project Knowledge Base

## Repository Structure
```
C:\Users\Andres\Documents\Codex\2026-10-24\bu\mu-online\OpenMu-Client-Babylon/
├── src/controllers/
│   ├── actors/
│   │   ├── itemIcon.ts              # Icon rendering for inventory (itemIconJob, liveItemIconSource)
│   │   ├── itemModel.ts             # Model dressing rules (dressItemModel, loadItemModel)
│   │   ├── visualOverrides.ts       # Equipment override resolver (resolveEquipmentOverride)
│   │   └── itemVisualOverrides.ts   # Icon override resolver (NEW - resolveItemVisualOverride)
│   ├── render/
│   │   └── iconShot.ts              # 3D shot renderer (createIconShots, IconShotJob)
│   ├── interface/item_icons/
│   │   └── itemIconPose.ts          # Pose calculation for icons (itemIconPose)
│   └── item_rules/
│       └── dropModelProxy.ts        # Ground item model proxy (dropModelProxy)
├── docker/
│   ├── compose.yml                  # Docker Compose config for dev server
│   ├── Dockerfile                   # Bun-based development container
│   ├── entrypoint.sh                # Starts Vite + WebSocket proxy
│   └── readme.md                    # How to use Docker dev environment
├── public/game-assets/
│   ├── Player/                      # Character models (player.glb, ArmorClass*.glb)
│   └── Custom/evolution_body.glb    # Custom evolution body GLB for testing
└── package.json                     # Scripts: "dev": "APP_ENV=dev vite --force"
```

## Key Concepts

### 1. Icon Rendering Flow (Inventory)
```
UI shows item in bag
  → liveItemIconSource(scene)(item) [itemIcon.ts:98-106]
    → itemIconJob(scene, item) [itemIcon.ts:42-57]
      → itemIconPose(group, num, level, twoHand) [itemIconPose.ts:378-413]
        → pose.model?.file ?? def.szModelFolder + def.szModelName
        → resolveItemVisualOverride(profile, group, num, class, path, asset) [NEW]
          → loadItemOverride(assetOverride, file, ...) [itemModel.ts fallback]
            → iconShots(scene).shoot(job) [iconShot.ts:292-305]
              → Build model under root → Render to RTT → Read pixels → PNG blob URL
```

### 2. Equipment Override Flow (Dark Knight Leather Armor)
```
User equips Leather Armor (group=8, num=5)
  → PlayerObject.loadPartAsync() [playerObject.ts:540-589]
    → resolveEquipmentOverride(profile, equipment, playerClass, path, asset) [visualOverrides.ts:3-7]
      → Returns 'Custom/evolution_body.glb' if profile=evolution + class=DarkKnight
        → loadGLTF(override ?? path) [playerObject.ts:559]
          → Model loaded with custom geometry
```

### 3. Icon vs Equipment Consistency
- **Before**: Icons used original models, equipment used custom GLB (inconsistent)
- **After**: Both use same override logic via `resolveItemVisualOverride()` hook

## Implemented Hook: resolveItemVisualOverride()

**File**: `src/controllers/actors/itemVisualOverrides.ts`

```typescript
export function resolveItemVisualOverride(
  group: number,
  num: number,
  playerClass: PlayerClass,
  path: string,
  asset: string | null
): string | null {
  // Only Leather Armor (group=8, num=5) in v1
  if (group !== 8 || num !== 5) return null;
  
  // Must be GLB file with valid Custom path
  if (!path.endsWith('.glb') || !asset || !/^Custom\/[A-Za-z0-9_-]+\.glb$/.test(asset)) {
    return null;
  }
  
  const profile = devQuery('visualProfile');
  const equipment = devQuery('visualEquipment');
  
  // Only when both conditions met (dev-only)
  if (profile === 'evolution' && equipment === 'leather') {
    return asset;  // Return Custom/evolution_body.glb
  }
  
  return null;
}
```

**Integration in itemIcon.ts**:
```typescript
// Lines 84-90 in itemIcon.ts
const assetOverride = resolveItemVisualOverride(
  item.group,
  item.num,
  PlayerClass.DarkKnight,  // TODO: pass class context from UI if needed
  file,
  'Custom/evolution_body.glb'
);

// Lines 93-103: Fallback via loadItemOverride
await loadItemOverride(assetOverride, file, async overridePath => {
  const obj = await loadItemModel(scene, root, item.group, item.num, overridePath, ...);
  // ... set position, rotation, scaling ...
}, (overridePath, error) => {
  console.warn(`Failed to load custom icon GLB ${overridePath}:`, error);
});

// Lines 105-114: Fallback to original if override failed
if (!model) {
  const object = await loadItemModel(scene, root, item.group, item.num, file, ...);
  // ... same setup as above ...
}
```

## Levantar el entorno local existente (OpenMU + proxy + cliente)

Procedimiento usado para la prueba online de MU Legacy Evolution. Son tres
componentes distintos: OpenMU en Docker, proxy WebSocket en Bun y cliente en Vite.
Levantar solamente el cliente no inicia el servidor de juego.

### 1. Iniciar Docker Desktop

Abrir Docker Desktop y esperar a que el motor responda. Desde PowerShell:

```powershell
Start-Process -FilePath 'C:\Program Files\Docker\Docker\Docker Desktop.exe' -WindowStyle Hidden
docker info --format '{{.ServerVersion}}'
```

Si `docker info` indica que falta el pipe de Docker, esperar a que termine de
iniciar Docker Desktop y repetir la comprobacion.

### 2. Reanudar los contenedores existentes

```powershell
docker ps -a --format '{{.Names}} | {{.Status}}'
docker start mu-personal-local-database-1
docker start mu-personal-local-server-1
docker start mu-personal-local-gateway-1
docker ps --format '{{.Names}} | {{.Status}}'
```

La base debe aparecer `healthy`; el servidor y gateway deben estar `Up`.
El arranque de OpenMU puede tardar despues de que el contenedor aparezca `Up`.
Comprobar el panel en `http://127.0.0.1:8080`.

El stack existente esta definido en:
`C:\Users\Andres\Documents\Codex\2026-10-24\bu\outputs\mu_local\compose.yml`.
No usar el compose generico del repositorio para reemplazar este stack ni crear
otra base de datos. No ejecutar `docker compose down -v`, borrar volumenes ni
reinstalar para un arranque rutinario. No imprimir ni compartir `.env`.

Si los contenedores no existen, revisar primero esa configuracion y los scripts
de `outputs\mu_local`. `iniciar_servidor.ps1` ejecuta `up -d --build`; no es
necesario reconstruir para reanudar los contenedores ya creados.

### 3. Iniciar el proxy en otra terminal PowerShell

```powershell
& 'C:\Users\Andres\Documents\Codex\2026-10-24\bu\outputs\mu_local\iniciar_proxy.ps1'
```

Dejar esa terminal abierta. El script configura el proxy en `127.0.0.1:3000`,
permite los puertos locales de OpenMU y ejecuta `bun run proxy`. El navegador
necesita este puente WebSocket/TCP para conectar al servidor.

### 4. Iniciar el cliente en otra terminal PowerShell

```powershell
Set-Location 'C:\Users\Andres\Documents\Codex\2026-10-24\bu\mu-online\OpenMu-Client-Babylon'
bun run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Dejar esa terminal abierta. Bun ejecuta el script `dev` de `package.json`.
Si el puerto esta ocupado, comprobar el proceso existente antes de abrir otra
instancia o detener nada.

### 5. Abrir la prueba online

```text
http://127.0.0.1:5173/online?visualProfile=evolution&visualBody=Custom/evolution_body.glb&visualEquipment=leather
```

Elegir el servidor local, iniciar sesion con la cuenta `test0` y seleccionar
`test0Dk`. Las credenciales no se guardan en este documento.

El personaje ya tenia una Leather Armor +0 equipada (grupo 8, numero 5, slot 3).
Con el perfil activo debe mostrar el torso cian; quitarla a un espacio libre del
inventario debe restaurar el cuerpo Classic y volver a equiparla debe recuperar
el torso cian. No hace falta crear ni duplicar el item. El usuario confirmo que
la prueba online funcionaba; comprobar de nuevo despues de cambios.

### Comprobaciones rapidas

```powershell
docker ps --format '{{.Names}} | {{.Status}}'
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $_.LocalPort -in 3000,5173,8080,44405,45901 } |
    Select-Object LocalPort,OwningProcess
Invoke-WebRequest -Uri 'http://127.0.0.1:8080' -UseBasicParsing
Invoke-WebRequest -Uri 'http://127.0.0.1:5173/game-assets/Custom/evolution_body.glb' -UseBasicParsing
```

Puertos esperados: cliente `5173`, proxy `3000`, panel `8080`, connect server
`44405` y game server `45901` (otros game servers usan `45902` a `45906`).
Un HTTP 200 del cliente confirma que sirve la pagina, no que el login funcione.
Para problemas de arranque revisar `docker logs --tail 80 mu-personal-local-server-1`
localmente y no compartir logs con secretos.

## Testing Procedure (alternative client setups)

The alternatives below concern the client development environment. For the
existing local game server, use the startup procedure above.

### Prerequisites
1. Docker Desktop installed and running (version 29.9.2+)
2. Git repository cloned to `C:\Users\Andres\Documents\Codex\2026-10-24\bu\mu-online\OpenMu-Client-Babylon`

### Option A: Docker Dev Server (RECOMMENDED)
```bash
cd C:\Users\Andres\Documents\Codex\2026-10-24\bu\mu-online\OpenMu-Client-Babylon
docker compose -f docker/compose.yml up --build

# In browser: http://localhost:5173/online
```

### Option B: Bun Dev Server (if Docker unavailable)
```bash
cd C:\Users\Andres\Documents\Codex\2026-10-24\bu\mu-online\OpenMu-Client-Babylon
bun run dev

# In browser: http://localhost:5173/online
```

### Verify Feature Works
1. Navigate to a page with Leather Armor (Dark Knight base, group=8, num=5)
2. Add query params: `?visualProfile=evolution&visualEquipment=leather`
3. Check inventory icon - should show custom geometry (`Custom/evolution_body.glb`)
4. Remove params or change profile - should revert to Classic model

## Known Issues & Workarounds

### Issue 1: Windows CMD doesn't support `APP_ENV=dev` syntax
- **Symptom**: `'APP_ENV' is not recognized as an internal or external command`
- **Root cause**: Unix-style environment variable export doesn't work in Windows CMD/PowerShell
- **Solution**: Use Docker container OR Bun (which supports the syntax)

### Issue 2: Vite not responding on localhost
- **Symptom**: Connection timeout when accessing `http://localhost:5173`
- **Root cause**: Vite may bind to IPv6 (`[::1]`) or still compiling initial assets
- **Solution**: Try `http://127.0.0.1:5173` OR wait for compilation to complete

### Issue 3: Custom GLB load failure fallback
- **Handled by**: `loadItemOverride()` in itemVisualOverrides.ts
- **Behavior**: If custom GLB fails, automatically falls back to original model
- **Logging**: Warning logged to console with failed path and error details

## Files Modified for Feature

| File | Lines | Change |
|------|-------|--------|
| `src/controllers/actors/itemVisualOverrides.ts` | NEW | Created hook + fallback logic |
| `src/controllers/actors/itemIcon.ts` | 20,84-114 | Imported hook, integrated in build() |

## Test Cases Required

### Case A: Profile Active (evolution)
```typescript
resolveItemVisualOverride('evolution', 8, 5, PlayerClass.DarkKnight, 'Player/ArmorMale06.glb', 'Custom/body.glb')
// Expected: 'Custom/body.glb'
```

### Case B: Profile Inactive (null or other)
```typescript
resolveItemVisualOverride(null, 8, 5, PlayerClass.DarkKnight, 'Player/ArmorMale06.glb', 'Custom/body.glb')
// Expected: null (no override)
```

### Case C: Wrong Item (group != 8 || num != 5)
```typescript
resolveItemVisualOverride('evolution', 7, 32, PlayerClass.DarkKnight, 'Player/Helm01.glb', 'Custom/body.glb')
// Expected: null (wrong item type)
```

### Case D: Load Failure Fallback
- Triggered by `loadItemOverride()` when custom GLB doesn't exist
- Console warning logged
- Original model loaded as fallback
- Icon still renders (just uses Classic geometry)

## Future Extensions (v2+)

1. **Class context from UI**: Currently hardcoded to DarkKnight, should pass actual class from inventory
2. **Multiple items support**: Extend hook for helm, pants with same profile rules
3. **Ground item overrides**: Separate logic in `dropModelProxy.ts`
4. **Cache invalidation by profile change**: Already handled via reaction on `itemEffectSignature`

## References

- Original client source: `ZzzInventory.cpp:9707` (RenderItem3D)
- Icon pose calculation: `RenderObjectScreen (:7653-9026)`
- Equipment override: `visualOverrides.ts:resolveEquipmentOverride()`
- Docker dev setup: `docker/readme.md`

## Notes for Future Agents

1. **Always use Docker** for development to avoid Windows CMD issues with `APP_ENV=dev`
2. **Icon and equipment consistency**: Both flows should share the same override logic via hooks
3. **Fallback is automatic**: No need to add explicit fallback code - `loadItemOverride()` handles it
4. **Profile validation happens at query level**: Hooks check `devQuery('visualProfile')` and `devQuery('visualEquipment')`
5. **Custom GLB path must match regex**: `/^Custom\/[A-Za-z0-9_-]+\.glb$/` or override returns null

---

*Generated: 2026-10-25 | Project: MU Legacy Evolution (OpenMu-Client-Babylon)*
