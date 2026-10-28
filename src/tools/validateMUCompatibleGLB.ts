import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface NodeDef { name?: string; children?: number[]; mesh?: number; skin?: number; translation?: number[]; rotation?: number[]; scale?: number[]; matrix?: number[] }
interface Accessor { bufferView: number; byteOffset?: number; componentType: number; count: number; type: string; normalized?: boolean; sparse?: unknown }
interface AnimationDef { name?: string; channels: { sampler: number; target: { node: number; path: string } }[]; samplers: { input: number; output: number; interpolation?: string }[] }
export interface GLBDocument {
  asset: { version: string }; nodes: NodeDef[];
  skins: { skeleton: number; joints: number[]; inverseBindMatrices?: number }[];
  buffers: { byteLength: number; uri?: string }[];
  bufferViews: { buffer: number; byteOffset?: number; byteLength: number; byteStride?: number }[];
  accessors: Accessor[];
  meshes?: { primitives: { mode?: number; indices?: number; material?: number; attributes: Record<string, number> }[] }[];
  materials?: { name?: string }[]; images?: { uri?: string; bufferView?: number; mimeType?: string }[];
  animations?: AnimationDef[]; extensionsRequired?: string[];
}
export interface GLB { json: GLBDocument; bin: Buffer }
export interface ValidationReport {
  valid: boolean; boneCount: number; requiredBonesPresent: string[]; missingBones: string[];
  socketsValid: boolean; triangles: number; vertices: number; animationCount: number;
  errors: string[]; warnings: string[]; productionApproved: false;
}
export const REFERENCE_SHA256 = '34bf609f29b3587fb51140e83a5ed43bee3c9dfa2b3d7ad35d26a3be58c844a5';
export const REFERENCE_PATH = fileURLToPath(new URL('../../public/game-assets/Player/player.glb', import.meta.url));
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function parseGLB(bytes: Buffer): GLB {
  if (bytes.length < 28 || bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) throw new Error('Invalid GLB 2.0 header');
  let json: GLBDocument | undefined;
  let bin: Buffer | undefined;
  for (let offset = 12; offset < bytes.length;) {
    if (offset + 8 > bytes.length) throw new Error('Truncated GLB chunk');
    const length = bytes.readUInt32LE(offset), type = bytes.readUInt32LE(offset + 4);
    const end = offset + 8 + length;
    if (length % 4 || end > bytes.length) throw new Error('Invalid GLB chunk length');
    if (type === 0x4e4f534a && offset === 12 && !json) json = JSON.parse(bytes.subarray(offset + 8, end).toString('utf8'));
    else if (type === 0x004e4942 && json && !bin) bin = bytes.subarray(offset + 8, end);
    else throw new Error('Unsupported or duplicate GLB chunk');
    offset = end;
  }
  if (!json || !bin || json.asset?.version !== '2.0' || json.buffers?.length !== 1 || json.buffers[0].uri || json.buffers[0].byteLength > bin.length) throw new Error('Expected one embedded GLB buffer');
  return { json, bin };
}

export function readAccessor(glb: GLB, index: number): number[] {
  const a = glb.json.accessors[index];
  if (!a || a.sparse || !Number.isInteger(a.count) || a.count < 1) throw new Error(`Invalid accessor ${index}`);
  const view = glb.json.bufferViews[a.bufferView];
  const size = ({ 5121: 1, 5123: 2, 5125: 4, 5126: 4 } as Record<number, number>)[a.componentType];
  const width = ({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 } as Record<string, number>)[a.type];
  if (!view || view.buffer !== 0 || !size || !width) throw new Error(`Unsupported accessor ${index}`);
  const start = (view.byteOffset ?? 0) + (a.byteOffset ?? 0), stride = view.byteStride ?? width * size;
  const end = start + (a.count - 1) * stride + width * size;
  if (start < (view.byteOffset ?? 0) || stride < width * size || stride % size || start % size || end > (view.byteOffset ?? 0) + view.byteLength || end > glb.json.buffers[0].byteLength || end > glb.bin.length) throw new Error(`Accessor ${index} out of bounds`);
  const result: number[] = [];
  for (let i = 0; i < a.count; i++) for (let k = 0; k < width; k++) {
    const offset = start + i * stride + k * size;
    let value = a.componentType === 5126 ? glb.bin.readFloatLE(offset) : a.componentType === 5125 ? glb.bin.readUInt32LE(offset) : a.componentType === 5123 ? glb.bin.readUInt16LE(offset) : glb.bin.readUInt8(offset);
    if (!Number.isFinite(value)) throw new Error(`Non-finite accessor ${index}`);
    if (a.normalized && a.componentType !== 5126) value /= a.componentType === 5121 ? 255 : a.componentType === 5123 ? 65535 : 4294967295;
    result.push(value);
  }
  return result;
}

function parents(nodes: NodeDef[]): (string | null)[] {
  const result: (string | null)[] = nodes.map(() => null);
  for (const node of nodes) for (const child of node.children ?? []) {
    if (!nodes[child] || result[child] !== null) throw new Error('Invalid node parent');
    result[child] = node.name ?? '';
  }
  return result;
}
const transform = (n: NodeDef) => [n.translation ?? [0, 0, 0], n.rotation ?? [0, 0, 0, 1], n.scale ?? [1, 1, 1], n.matrix ?? null];

export function validateDocument(candidate: GLB, reference: GLB, part = false): ValidationReport {
  const report: ValidationReport = { valid: false, boneCount: 0, requiredBonesPresent: [], missingBones: [], socketsValid: false, triangles: 0, vertices: 0, animationCount: candidate.json.animations?.length ?? 0, errors: [], warnings: [], productionApproved: false };
  const check = (ok: boolean, error: string) => { if (!ok) report.errors.push(error); };
  try {
    const doc = candidate.json, ref = reference.json;
    const skin = doc.skins?.[0], canonical = ref.skins[0];
    report.boneCount = skin?.joints.length ?? 0;
    check(doc.skins?.length === 1 && report.boneCount === 61, 'Expected one skin with 61 slots');
    if (!skin) return report;
    const actualParents = parents(doc.nodes), expectedParents = parents(ref.nodes);
    const names = skin.joints.map(index => doc.nodes[index]?.name);
    check(new Set(names).size === 61, 'Duplicate or missing joint names');
    canonical.joints.forEach((nodeId, slot) => {
      const expected = ref.nodes[nodeId], actualId = skin.joints[slot], actual = doc.nodes[actualId];
      const ok = !!actual && actual.name === expected.name && actualParents[actualId] === expectedParents[nodeId] && equal(transform(actual), transform(expected));
      (ok ? report.requiredBonesPresent : report.missingBones).push(expected.name ?? '');
    });
    check(report.missingBones.length === 0, 'Joint order, name, hierarchy or transform differs from canonical rig');
    check(skin.skeleton === skin.joints[0] && names[0] === 'skin_player', 'Invalid skin root');
    const sockets = [[34, 'bone_33_knife_gdf'], [43, 'bone_42_hand_bofdgne01'], [48, 'bone_47_Bone05']] as const;
    report.socketsValid = sockets.every(([slot, name]) => names[slot] === name);
    check(report.socketsValid, 'Invalid MU socket slots 34/43/48');
    if (skin.inverseBindMatrices !== undefined) {
      const a = doc.accessors[skin.inverseBindMatrices], values = readAccessor(candidate, skin.inverseBindMatrices);
      check(a.type === 'MAT4' && a.count === 61 && a.componentType === 5126 && values.every((v, i) => Math.abs(v - (i % 16 % 5 === 0 ? 1 : 0)) < 1e-6), 'Rigid MU inverse bind matrices must be identity');
    }
    check(!(doc.extensionsRequired?.length), 'Unsupported required extensions');
    for (const image of doc.images ?? []) check(!image.uri && image.bufferView !== undefined && !!doc.bufferViews[image.bufferView] && ['image/png', 'image/jpeg'].includes(image.mimeType ?? ''), 'Images must be embedded PNG/JPEG');
    check((doc.materials?.length ?? 0) <= 3, 'Body exceeds three materials');
    const bodyNodes = doc.nodes.filter(n => n.mesh !== undefined && n.skin === 0);
    check(bodyNodes.length > 0, 'No skinned body geometry');
    for (const node of bodyNodes) {
      check(equal(transform(node), transform({})), 'Body mesh transform must be identity');
      const mesh = doc.meshes?.[node.mesh ?? -1];
      if (!mesh?.primitives.length) throw new Error('Empty body mesh');
      for (const primitive of mesh.primitives) {
        const attr = primitive.attributes;
        check((primitive.mode ?? 4) === 4, 'Body primitives must be triangles');
        for (const name of ['POSITION', 'NORMAL', 'TEXCOORD_0', 'JOINTS_0', 'WEIGHTS_0']) if (attr[name] === undefined) throw new Error(`Missing ${name}`);
        check(attr.JOINTS_1 === undefined && attr.WEIGHTS_1 === undefined, 'Secondary skin influences are not supported');
        const p = doc.accessors[attr.POSITION], n = doc.accessors[attr.NORMAL], uv = doc.accessors[attr.TEXCOORD_0], j = doc.accessors[attr.JOINTS_0], w = doc.accessors[attr.WEIGHTS_0];
        check(p.type === 'VEC3' && n.type === 'VEC3' && uv.type === 'VEC2' && p.componentType === 5126 && n.componentType === 5126, 'Invalid position, normal or UV shape');
        check(j.type === 'VEC4' && [5121, 5123].includes(j.componentType) && !j.normalized && w.type === 'VEC4' && w.componentType === 5126, 'Invalid rigid skin attribute types');
        check([n, uv, j, w].every(a => a.count === p.count), 'Vertex attribute counts differ');
        const positions = readAccessor(candidate, attr.POSITION), normals = readAccessor(candidate, attr.NORMAL);
        readAccessor(candidate, attr.TEXCOORD_0);
        const joints = readAccessor(candidate, attr.JOINTS_0), weights = readAccessor(candidate, attr.WEIGHTS_0);
        for (let vertex = 0; vertex < p.count; vertex++) {
          const offset = vertex * 4, slot = joints[offset], name = names[slot];
          if (![0, 1, 2, 3].every(k => Number.isInteger(joints[offset + k]) && joints[offset + k] >= 0 && joints[offset + k] < 61)) throw new Error('Joint slot outside [0,60]');
          if (Math.abs(weights[offset] - 1) > 1e-4 || [1, 2, 3].some(k => Math.abs(weights[offset + k]) > 1e-6) || weights.slice(offset, offset + 4).some(v => v < 0)) throw new Error('Expected rigid weights (1,0,0,0)');
          if (!name || slot === 0 || /Dummy/.test(name) || sockets.some(([s]) => s === slot)) throw new Error('Body weighted to root, dummy or socket');
          if (Math.abs(Math.hypot(...normals.slice(vertex * 3, vertex * 3 + 3)) - 1) > 1e-3) throw new Error('Non-unit body normal');
        }
        const indices = primitive.indices === undefined ? Array.from({ length: p.count }, (_, i) => i) : readAccessor(candidate, primitive.indices);
        if (primitive.indices !== undefined) check(doc.accessors[primitive.indices].type === 'SCALAR' && [5121, 5123, 5125].includes(doc.accessors[primitive.indices].componentType), 'Invalid index type');
        check(indices.length % 3 === 0 && indices.every(i => Number.isInteger(i) && i >= 0 && i < positions.length / 3), 'Invalid triangle indices');
        check(primitive.material !== undefined && !!doc.materials?.[primitive.material], 'Body material missing');
        report.vertices += p.count;
        report.triangles += indices.length / 3;
      }
    }
    check(report.triangles <= 20000, 'Body exceeds 20000 triangles');
    const animations = doc.animations ?? [];
    check(part ? animations.length === 0 : animations.length === 284, part ? 'Modular body parts must not duplicate parent clips' : 'Expected 284 ordered player actions');
    if (!part && animations.length === 284) {
      for (let i = 0; i < 284; i++) {
        const animation = animations[i], source = ref.animations?.[i];
        if (!source) throw new Error(`Missing canonical animation ${i}`);
        if (animation.name !== source.name || animation.channels.length !== source.channels.length || animation.samplers.length !== source.samplers.length) throw new Error(`Animation ${i} inventory differs`);
        for (let k = 0; k < source.channels.length; k++) {
          const c = animation.channels[k], r = source.channels[k];
          if (doc.nodes[c.target.node]?.name !== ref.nodes[r.target.node].name || c.target.path !== r.target.path) throw new Error(`Animation ${i} channel differs`);
          const cs = animation.samplers[c.sampler], rs = source.samplers[r.sampler];
          if (!cs || (cs.interpolation ?? 'LINEAR') !== (rs.interpolation ?? 'LINEAR') || !equal(readAccessor(candidate, cs.input), readAccessor(reference, rs.input)) || !equal(readAccessor(candidate, cs.output), readAccessor(reference, rs.output))) throw new Error(`Animation ${i} samples differ`);
        }
      }
    }
  } catch (error) { report.errors.push(error instanceof Error ? error.message : String(error)); }
  report.valid = report.errors.length === 0;
  report.warnings.push('Automated rig/geometry/skin/clip gate only; production still requires Babylon state and visual acceptance.');
  return report;
}

export default async function validateMUCompatibleGLB(glbPath: string, options: { part?: boolean } = {}): Promise<ValidationReport> {
  try {
    const bytes = readFileSync(REFERENCE_PATH);
    if (createHash('sha256').update(bytes).digest('hex') !== REFERENCE_SHA256) throw new Error('Canonical reference hash changed');
    return validateDocument(parseGLB(readFileSync(glbPath)), parseGLB(bytes), options.part);
  } catch (error) {
    return { valid: false, boneCount: 0, requiredBonesPresent: [], missingBones: [], socketsValid: false, triangles: 0, vertices: 0, animationCount: 0, errors: [String(error)], warnings: [], productionApproved: false };
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const filename = process.argv.slice(2).find(arg => !arg.startsWith('--'));
  if (!filename) { console.error('Usage: bun src/tools/validateMUCompatibleGLB.ts <asset.glb> [--part]'); process.exitCode = 2; }
  else {
    const report = await validateMUCompatibleGLB(filename, { part: process.argv.includes('--part') });
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    if (!report.valid) process.exitCode = 1;
  }
}
