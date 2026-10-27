import { describe, expect, it } from 'vitest';
import { NodeIO } from '@gltf-transform/core';
import { evolutionTorso } from './evolutionTorso';

describe('the original torso fixture', () => {
  it('round-trips a single-weight mesh in the existing spine joint slot', async () => {
    const io = new NodeIO();
    const doc = await io.readBinary(await io.writeBinary(evolutionTorso()));
    const mesh = doc.getRoot().listMeshes()[0].listPrimitives()[0];
    const indices = mesh.getAttribute('JOINTS_0');
    const weights = mesh.getAttribute('WEIGHTS_0');
    if (!indices || !weights) throw new Error('Missing skin attributes');
    expect(doc.getRoot().listSkins()[0].listJoints()).toHaveLength(20);
    expect(mesh.getAttribute('POSITION')?.getCount()).toBe(24);
    expect(mesh.getIndices()?.getCount()).toBe(36);
    for (let i = 0; i < indices.getCount(); i++) {
      expect(indices.getElement(i, [])).toEqual([19, 0, 0, 0]);
      expect(weights.getElement(i, [])).toEqual([1, 0, 0, 0]);
    }
    expect(doc.getRoot().listAnimations()).toHaveLength(0);
    expect(doc.getRoot().listTextures()).toHaveLength(0);
  });
});
