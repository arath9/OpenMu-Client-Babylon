# Veyra phase 3 base character

Original procedural segmented armor, obsidian, steel and turquoise. This is a
low-poly authoring base, not an approved final production character.

## Activate

Run the development client and append `?character=veira` (the requested alias),
or `?character=veyra`. With existing query parameters use `&character=veira`.
The selector uses `devQuery`, so production keeps Classic. No profile, equipment
or explicit asset parameter is required. All five default class parts are replaced
once, on the existing `Player/player.glb` rig. Equipped armor and accessories keep
their normal models; unequipping restores the Veyra default part. A missing part
falls back to its original class model, with existing disposal/load sequence guards.

## Regenerate

From the repository root, using Blender 4.2.3 LTS or a compatible installation:

```text
blender --background --factory-startup --python-exit-code 1 --python src/tools/fantasy_sword.py
```

The historical script filename is retained. It now generates a character, not a
sword. `run_fantasy_sword.bat` uses Blender on PATH or `BLENDER_EXE`. It runs
synchronously and propagates failures. Optional script arguments follow `--`:
`--reference <player.glb> --output-dir <directory> --blend <source.blend>`.
The input hash is pinned; a different game version fails rather than silently
mixing its rig or clips with this profile.

Outputs:

- `art/veyra/character_source.blend`: editable original geometry, rigid vertex
  groups, and an auxiliary authoring armature. Do not export this armature with
  an ordinary glTF export and discard its inverse binds.
- `public/game-assets/Custom/veyra_body.glb`: combined inspection asset, preserving
  all 284 canonical clips byte-for-byte, including their order and samples.
- `veyra_head.glb`, `veyra_armor.glb`, `veyra_pants.glb`, `veyra_gloves.glb`,
  `veyra_boots.glb`: actual runtime parts, with no duplicate animations.
- `veyra_manifest.json`: reference/output hashes, bind pose, skin/socket indices,
  measured triangle counts and maximum bind round-trip error.

The complete body is 1184 triangles, three materials, one embedded procedural
2048-square PNG atlas. UV reuse within each flat-color atlas band is intentional.
The body contains no weapon or wings. Reference animation redistribution rights
must be checked separately from the original procedural geometry.

## MU contract

The skin has exactly 61 ordered slots: `skin_player`, then `bone_0_*` through
`bone_59_*`, with full original names and hierarchy. Socket MU indices 33/42/47
map to skin/Babylon slots 34/43/48, not the unshifted indices. The source rig is
unchanged. The script samples `player_action_0` at time zero, models in that pose,
and converts each rigid vertex and normal into its joint's local space. There
are no conventional inverse bind matrices and no extra base-axis conversion.

Each material primitive is a separate scene-root mesh. This is deliberate:
`ModelObject.load` replaces only direct child mesh skeletons for `LinkParent`.
A single glTF mesh with several primitives creates nested Babylon meshes that
would otherwise retain their part skeleton and never follow the player.

## Validate

```text
bun src/tools/validateMUCompatibleGLB.ts public/game-assets/Custom/veyra_body.glb
bun src/tools/validateMUCompatibleGLB.ts public/game-assets/Custom/veyra_head.glb --part
bun run test src/tools/validateMUCompatibleGLB.test.ts src/controllers/actors/veyra.test.ts src/controllers/actors/veyraRuntime.test.ts
```

Run the part command for armor, pants, gloves and boots too. The legacy
`src/tools/validate-mu-glb.ts` CLI forwards the same options. The validator is
filesystem-based and needs neither a browser nor a WebGL engine. It checks the
canonical reference hash, joint slots/full names/parents/transforms, sockets,
embedded resources, attributes, normals, rigid weights, forbidden joint targets,
binary bounds, triangle budget and exact animation samples. Negative mutation
tests cover swapped sockets, names, hierarchy, transforms, weights, slot ranges,
non-finite data, truncated files and altered animation payloads.

`veyraRuntime.test.ts` exercises the real `loadGLTF` and `PlayerObject` paths with
two characters, five shared-skeleton parts each, socket instance isolation and
CPU samples at the start/middle/end of idle, walk, run, attack and death. Only
file transport and browser FileReader are adapted for Node; headless loading
skips materials. This does not certify visual quality, lighting, weapon pivot
calibration, or gameplay one-shot transitions.

`validation/mu_contract.json` contains the actual six CLI results.
`validation/khronos.json` contains glTF Validator 2.0.0-dev.3.10 results: no errors
or warnings for any output. The pants have one informational unused material.
`productionApproved` intentionally remains false pending visual and state gates.
