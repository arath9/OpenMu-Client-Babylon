import { describe, expect, it } from 'vitest';
import validate, { parseGLB, validateDocument, type GLB } from './validateMUCompatibleGLB';
import { readFileSync } from 'node:fs';

function must<T>(value: T | undefined | null): T {
  if (value == null) throw new Error('Missing GLB test data');
  return value;
}
const source = parseGLB(readFileSync('public/game-assets/Player/player.glb'));
function changed(change: (glb: GLB) => void) {
  const asset = parseGLB(readFileSync('public/game-assets/Custom/veyra_body.glb'));
  change(asset);
  return validateDocument(asset, source);
}
function binaryOffset(asset: GLB, index: number) {
  const accessor = asset.json.accessors[index];
  return (asset.json.bufferViews[accessor.bufferView].byteOffset ?? 0) + (accessor.byteOffset ?? 0);
}

const root = 'public/game-assets/';
describe('MU rigid character gate', () => {
  it('rejects malformed or truncated GLB data', () => {
    expect(() => parseGLB(Buffer.from('<html>not a GLB</html>'))).toThrow('Invalid GLB');
    const data = readFileSync(`${root}Custom/veyra_body.glb`);
    expect(() => parseGLB(data.subarray(0, data.length - 4))).toThrow('Invalid GLB');
  });
  it('rejects swapped sockets even with 61 slots', () => {
    const report = changed(asset => {
      const joints = asset.json.skins[0].joints;
      [joints[34], joints[43]] = [joints[43], joints[34]];
    });
    expect(report.valid).toBe(false);
    expect(report.socketsValid).toBe(false);
  });
  it('checks the entire bone name, not only a prefix', () => {
    expect(changed(asset => { asset.json.nodes[asset.json.skins[0].joints[10]].name += '_wrong'; }).valid).toBe(false);
  });
  it('rejects a changed bone transform', () => {
    expect(changed(asset => { asset.json.nodes[asset.json.skins[0].joints[18]].translation = [1, 0, 0]; }).valid).toBe(false);
  });
  it('rejects a changed hierarchy', () => {
    expect(changed(asset => { asset.json.nodes[4].children = must(asset.json.nodes[4].children).filter(i => i !== 5); must(asset.json.nodes[2].children).push(5); }).valid).toBe(false);
  });
  it.each([0.5, -1, NaN])('rejects invalid rigid weights (%s)', weight => {
    const report = changed(asset => {
      const index = must(asset.json.meshes)[0].primitives[0].attributes.WEIGHTS_0;
      asset.bin.writeFloatLE(weight, binaryOffset(asset, index));
    });
    expect(report.valid).toBe(false);
  });
  it.each([0, 34, 61])('rejects root/socket/out-of-range body slot %s', slot => {
    expect(changed(asset => {
      const index = must(asset.json.meshes)[0].primitives[0].attributes.JOINTS_0;
      asset.bin.writeUInt16LE(slot, binaryOffset(asset, index));
    }).valid).toBe(false);
  });
  it('rejects changed animation payload even when all 284 names are intact', () => {
    const report = changed(asset => {
      const animation = must(asset.json.animations)[15];
      const index = animation.samplers[0].output;
      asset.bin.writeFloatLE(123, binaryOffset(asset, index));
    });
    expect(report.valid).toBe(false);
    expect(report.errors.some(error => error.includes('samples differ'))).toBe(true);
  });
  it('rejects missing clips, attributes and out-of-range binary views', () => {
    expect(changed(asset => { must(asset.json.animations).pop(); }).valid).toBe(false);
    expect(changed(asset => { delete must(asset.json.meshes)[0].primitives[0].attributes.NORMAL; }).valid).toBe(false);
    expect(changed(asset => {
      const index = must(asset.json.meshes)[0].primitives[0].attributes.POSITION;
      asset.json.accessors[index].byteOffset = asset.bin.length;
    }).valid).toBe(false);
  });
  it('accepts the generated Veyra body with all 284 unmodified clips', async () => {
    const report = await validate(`${root}Custom/veyra_body.glb`);
    expect(report.errors).toEqual([]);
    expect(report.valid).toBe(true);
    expect(report.boneCount).toBe(61);
    expect(report.animationCount).toBe(284);
    expect(report.triangles).toBeGreaterThan(100);
  });
  it.each(['head', 'armor', 'pants', 'gloves', 'boots'])('accepts the modular %s on the parent rig without duplicate clips', async part => {
    const report = await validate(`${root}Custom/veyra_${part}.glb`, { part: true });
    expect(report.errors).toEqual([]);
    expect(report.valid).toBe(true);
    expect(report.animationCount).toBe(0);
  });
  it('rejects the meshless canonical rig as a character candidate', async () => {
    const report = await validate(`${root}Player/player.glb`);
    expect(report.valid).toBe(false);
    expect(report.boneCount).toBe(61);
    expect(report.socketsValid).toBe(true);
    expect(report.errors).toContain('No skinned body geometry');
  });
});
