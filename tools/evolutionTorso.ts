/** Original rigid torso fixture. Run: bun tools/evolutionTorso.ts. No legacy asset is read or copied. */
import { Document, NodeIO } from '@gltf-transform/core';
import { mkdir } from 'node:fs/promises';

export function evolutionTorso(): Document {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const joints: number[] = [];
  const weights: number[] = [];
  // Bone-local space: spine X points up. Each face has its own normal.
  const corners = [
    [-0.08, -0.15, -0.23], [0.42, -0.15, -0.23],
    [0.42, 0.15, -0.23], [-0.08, 0.15, -0.23],
    [-0.08, -0.15, 0.23], [0.42, -0.15, 0.23],
    [0.42, 0.15, 0.23], [-0.08, 0.15, 0.23],
  ];
  const faces = [
    { ids: [0, 3, 2, 1], normal: [0, 0, -1] },
    { ids: [4, 5, 6, 7], normal: [0, 0, 1] },
    { ids: [0, 1, 5, 4], normal: [0, -1, 0] },
    { ids: [3, 7, 6, 2], normal: [0, 1, 0] },
    { ids: [0, 4, 7, 3], normal: [-1, 0, 0] },
    { ids: [1, 2, 6, 5], normal: [1, 0, 0] },
  ];
  for (const face of faces) {
    const start = positions.length / 3;
    for (const id of face.ids) {
      positions.push(...corners[id]);
      normals.push(...face.normal);
      joints.push(19, 0, 0, 0); // MU spine bone 18 + skin-root offset.
      weights.push(1, 0, 0, 0);
    }
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }
  const attribute = (name: string, type: 'VEC3' | 'VEC4', values: Float32Array | Uint16Array) =>
    doc.createAccessor(name).setBuffer(buffer).setType(type).setArray(values);
  const material = doc.createMaterial('Evolution cyan prototype')
    .setBaseColorFactor([0.02, 0.85, 0.95, 1])
    .setEmissiveFactor([0.01, 0.22, 0.28]).setMetallicFactor(0).setRoughnessFactor(0.8).setDoubleSided(true);
  const primitive = doc.createPrimitive()
    .setAttribute('POSITION', attribute('positions', 'VEC3', new Float32Array(positions)))
    .setAttribute('NORMAL', attribute('normals', 'VEC3', new Float32Array(normals)))
    .setAttribute('JOINTS_0', attribute('joints', 'VEC4', new Uint16Array(joints)))
    .setAttribute('WEIGHTS_0', attribute('weights', 'VEC4', new Float32Array(weights)))
    .setIndices(doc.createAccessor('indices').setBuffer(buffer).setType('SCALAR').setArray(new Uint16Array(indices)))
    .setMaterial(material);
  const scene = doc.createScene('Evolution fixture');
  const root = doc.createNode('skin_evolution');
  const skin = doc.createSkin('Runtime joint slots').setSkeleton(root).addJoint(root);
  // Placeholder joint slots only; the player's live skeleton replaces this skin.
  for (let i = 0; i < 19; i++) {
    const joint = doc.createNode(`slot_${i}`);
    root.addChild(joint);
    skin.addJoint(joint);
  }
  scene.addChild(root);
  scene.addChild(doc.createNode('evolution_torso').setMesh(doc.createMesh('Original box torso').addPrimitive(primitive)).setSkin(skin));
  return doc;
}

if (import.meta.main) {
  await mkdir('public/game-assets/Custom', { recursive: true });
  await new NodeIO().write('public/game-assets/Custom/evolution_body.glb', evolutionTorso());
}
