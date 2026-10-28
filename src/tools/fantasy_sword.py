"""Veyra base character, strict MU rigid skin. Run with Blender --background --python.
The historical filename is retained; weapons and wings remain separate assets.
"""
import argparse
import copy
import hashlib
import json
import math
from pathlib import Path
import struct
import sys
import zlib

import bpy
from mathutils import Matrix, Quaternion, Vector

ROOT = Path(__file__).resolve().parents[2]
REFERENCE_HASH = '34bf609f29b3587fb51140e83a5ed43bee3c9dfa2b3d7ad35d26a3be58c844a5'
PARTS = ('head', 'armor', 'pants', 'gloves', 'boots')
COLORS = ((24, 30, 43, 255), (9, 203, 190, 255), (103, 113, 135, 255))


def read_glb(path):
    raw = Path(path).read_bytes()
    if struct.unpack_from('<III', raw) != (0x46546C67, 2, len(raw)):
        raise ValueError('Invalid GLB header')
    length, tag = struct.unpack_from('<II', raw, 12)
    if tag != 0x4E4F534A:
        raise ValueError('Missing JSON chunk')
    doc = json.loads(raw[20:20 + length])
    offset = 20 + length
    size, tag = struct.unpack_from('<II', raw, offset)
    if tag != 0x004E4942:
        raise ValueError('Missing BIN chunk')
    return doc, raw[offset + 8:offset + 8 + size]


def accessor(doc, binary, index):
    a = doc['accessors'][index]
    view = doc['bufferViews'][a['bufferView']]
    width = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
    fmt = {5126: 'f', 5123: 'H', 5121: 'B', 5125: 'I'}[a['componentType']]
    size = struct.calcsize('<' + fmt * width)
    start = view.get('byteOffset', 0) + a.get('byteOffset', 0)
    return [struct.unpack_from('<' + fmt * width, binary, start + i * view.get('byteStride', size)) for i in range(a['count'])]


def bind_pose(doc, binary):
    local = {}
    for channel in doc['animations'][0]['channels']:
        sampler = doc['animations'][0]['samplers'][channel['sampler']]
        if accessor(doc, binary, sampler['input'])[0][0] != 0:
            raise ValueError('Expected bind sample at time zero')
        local.setdefault(channel['target']['node'], {})[channel['target']['path']] = accessor(doc, binary, sampler['output'])[0]
    parents = {child: i for i, node in enumerate(doc['nodes']) for child in node.get('children', [])}
    result = {}

    def world(i):
        if i not in result:
            trs = {**doc['nodes'][i], **local.get(i, {})}
            q = trs.get('rotation', (0, 0, 0, 1))
            matrix = Matrix.LocRotScale(Vector(trs.get('translation', (0, 0, 0))), Quaternion((q[3], *q[:3])), Vector(trs.get('scale', (1, 1, 1))))
            result[i] = world(parents[i]) @ matrix if i in parents else matrix
        return result[i]
    for i in range(len(doc['nodes'])):
        world(i)
    return result


def atlas_png(size=2048):
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    row = b''.join(bytes(COLORS[min(2, x * 3 // size)]) for x in range(size))
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress((b'\0' + row) * size, 9)) + chunk(b'IEND', b'')


def geometry(doc, pose):
    groups = {part: [] for part in PARTS}
    joints = doc['skins'][0]['joints']
    at = lambda mu: pose[joints[mu + 1]].translation.copy()
    up = (at(19) - at(2)).normalized()
    across = (at(3) - at(10)).normalized()
    front = up.cross(across).normalized()
    unit = (at(4) - at(3)).length / 0.42

    def surface(part, mu, points, faces, material):
        for face in faces:
            tri = [Vector(points[i]) for i in face]
            normal = (tri[1] - tri[0]).cross(tri[2] - tri[0]).normalized()
            groups[part].append((mu + 1, material, tri, normal))

    def shell(part, mu, start, end, r0, r1, material=0, aspect=0.82):
        axis = (end - start).normalized()
        x = axis.cross(front).normalized()
        if x.length < 0.1:
            x = axis.cross(across).normalized()
        y = axis.cross(x).normalized()
        points = []
        count = 8
        for center, radius in ((start, r0 * unit), (end, r1 * unit)):
            for k in range(count):
                angle = 2 * math.pi * k / count
                points.append(center + x * (math.cos(angle) * radius) + y * (math.sin(angle) * radius * aspect))
        points.extend((start, end))
        faces = []
        for k in range(count):
            nxt = (k + 1) % count
            faces.extend(((k, nxt, count + nxt), (k, count + nxt, count + k), (16, nxt, k), (17, count + k, count + nxt)))
        surface(part, mu, points, faces, material)

    def segment(part, mu, child, radius0, radius1, material=0):
        start, end = at(mu), at(child)
        direction = end - start
        shell(part, mu, start - direction * 0.035, end + direction * 0.035, radius0, radius1, material)
        # A raised turquoise cuff is geometry, not an extra attachment bone.
        shell(part, mu, start + direction * 0.16, start + direction * 0.23, radius0 * 1.025, radius0, 1)

    segment('armor', 2, 17, 0.17, 0.16)
    segment('armor', 17, 18, 0.16, 0.20)
    segment('armor', 18, 19, 0.20, 0.14)
    segment('head', 19, 20, 0.065, 0.065, 2)
    head = at(20)
    shell('head', 20, head - up * (0.025 * unit), head + up * (0.22 * unit), 0.105, 0.085)
    # Visor and asymmetric crest give the base an original silhouette.
    shell('head', 20, head + up * (0.11 * unit), head + up * (0.14 * unit), 0.11, 0.106, 1)
    shell('head', 20, head + across * (0.055 * unit) + up * (0.2 * unit), head + across * (0.055 * unit) + up * (0.33 * unit), 0.05, 0.008, 2, 0.35)
    for thigh, calf, foot, toe in ((3, 4, 5, 6), (10, 11, 12, 13)):
        segment('pants', thigh, calf, 0.105, 0.083)
        segment('boots', calf, foot, 0.09, 0.065)
        segment('boots', foot, toe, 0.078, 0.085, 2)
    for upper, forearm, hand, finger in ((26, 27, 28, 29), (35, 36, 37, 38)):
        segment('armor', upper, forearm, 0.115, 0.068)
        segment('gloves', forearm, hand, 0.082, 0.055)
        segment('gloves', hand, finger, 0.065, 0.053, 2)
        axis = (at(forearm) - at(upper)).normalized()
        shell('armor', upper, at(upper) - axis * (0.035 * unit), at(upper) + axis * (0.14 * unit), 0.16, 0.125, 2)
    return groups


def write_character(reference, source_bin, pose, triangles, output, combined):
    if combined:
        doc, binary = copy.deepcopy(reference), bytearray(source_bin)
    else:
        doc = {key: copy.deepcopy(reference[key]) for key in ('asset', 'scenes', 'nodes', 'skins')}
        doc.update(accessors=[], bufferViews=[])
        binary = bytearray()
    doc['scene'] = 0
    doc.pop('extensionsUsed', None)
    doc.pop('extensionsRequired', None)
    doc['asset'] = {'version': '2.0', 'generator': 'Veyra MU rigid authoring pipeline'}
    doc['nodes'][0].update(name='veyra_body' if combined else output.stem, mesh=0, skin=0)
    doc['materials'] = [{'name': name, 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'metallicFactor': metal, 'roughnessFactor': rough}} for name, metal, rough in (('Veyra_Obsidian', 0.65, 0.35), ('Veyra_Umbral', 0.25, 0.3), ('Veyra_Steel', 0.8, 0.28))]

    def view(data, target=None):
        binary.extend(b'\0' * (-len(binary) % 4))
        index = len(doc['bufferViews'])
        entry = {'buffer': 0, 'byteOffset': len(binary), 'byteLength': len(data)}
        if target:
            entry['target'] = target
        doc['bufferViews'].append(entry)
        binary.extend(data)
        return index

    def attribute(rows, kind, fmt, component):
        payload = b''.join(struct.pack('<' + fmt * len(row), *row) for row in rows)
        entry = {'bufferView': view(payload, 34962), 'componentType': component, 'count': len(rows), 'type': kind}
        if kind == 'VEC3' and fmt == 'f':
            entry.update(min=[min(row[i] for row in rows) for i in range(3)], max=[max(row[i] for row in rows) for i in range(3)])
        index = len(doc['accessors'])
        doc['accessors'].append(entry)
        return index

    doc['images'] = [{'name': 'veyra_atlas', 'bufferView': view(atlas_png()), 'mimeType': 'image/png'}]
    doc['textures'] = [{'source': 0, 'sampler': 0}]
    doc['samplers'] = [{'magFilter': 9729, 'minFilter': 9729, 'wrapS': 33071, 'wrapT': 33071}]
    primitives, max_error = [], 0.0
    for material in range(3):
        positions, normals, uvs, weights, slots = [], [], [], [], []
        for slot, mat, tri, normal in triangles:
            if mat != material:
                continue
            matrix = pose[reference['skins'][0]['joints'][slot]]
            inverse = matrix.inverted()
            for k, point in enumerate(tri):
                local = inverse @ point
                max_error = max(max_error, (matrix @ local - point).length)
                positions.append(tuple(local))
                normals.append(tuple((matrix.to_3x3().transposed() @ normal).normalized()))
                uvs.append(((material + (0.15, 0.85, 0.5)[k]) / 3, (0.15, 0.15, 0.85)[k]))
                weights.append((1.0, 0.0, 0.0, 0.0))
                slots.append((slot, 0, 0, 0))
        if positions:
            attrs = {'POSITION': attribute(positions, 'VEC3', 'f', 5126), 'NORMAL': attribute(normals, 'VEC3', 'f', 5126), 'TEXCOORD_0': attribute(uvs, 'VEC2', 'f', 5126), 'JOINTS_0': attribute(slots, 'VEC4', 'H', 5123), 'WEIGHTS_0': attribute(weights, 'VEC4', 'f', 5126)}
            primitives.append({'attributes': attrs, 'mode': 4, 'material': material})
    if max_error > 1e-5:
        raise ValueError(f'Bind round-trip error {max_error}')
    # One primitive per scene-root mesh: LinkParent only replaces direct child mesh skins.
    doc['meshes'] = [{'name': f'{output.stem}_{i}', 'primitives': [primitive]} for i, primitive in enumerate(primitives)]
    for i in range(1, len(primitives)):
        doc['scenes'][0]['nodes'].append(len(doc['nodes']))
        doc['nodes'].append({'name': f'{output.stem}_{i}', 'mesh': i, 'skin': 0})
    doc['buffers'] = [{'byteLength': len(binary)}]
    text = json.dumps(doc, separators=(',', ':')).encode()
    text += b' ' * (-len(text) % 4)
    binary.extend(b'\0' * (-len(binary) % 4))
    raw = struct.pack('<III', 0x46546C67, 2, 28 + len(text) + len(binary)) + struct.pack('<II', len(text), 0x4E4F534A) + text + struct.pack('<II', len(binary), 0x004E4942) + binary
    output.write_bytes(raw)
    return {'file': output.name, 'sha256': hashlib.sha256(raw).hexdigest(), 'triangles': len(triangles), 'bindRoundTripMaxError': max_error}


def save_blend(doc, pose, groups, path):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    armature = bpy.data.armatures.new('MU_authoring_rig')
    rig = bpy.data.objects.new('MU_authoring_rig', armature)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    by_id = {}
    parents = {child: i for i, node in enumerate(doc['nodes']) for child in node.get('children', [])}
    for node_id in doc['skins'][0]['joints']:
        node = doc['nodes'][node_id]
        bone = armature.edit_bones.new(node['name'])
        bone.head = pose[node_id].translation
        bone.tail = bone.head + (pose[node_id].to_3x3() @ Vector((0, 0.03, 0)))
        bone.parent = by_id.get(parents.get(node_id))
        bone.use_connect = False
        by_id[node_id] = bone
    bpy.ops.object.mode_set(mode='OBJECT')
    materials = []
    for index, color in enumerate(COLORS):
        material = bpy.data.materials.new(('Veyra_Obsidian', 'Veyra_Umbral', 'Veyra_Steel')[index])
        material.diffuse_color = tuple(c / 255 for c in color)
        materials.append(material)
    for part, triangles in groups.items():
        points = [tuple(point) for _, _, tri, _ in triangles for point in tri]
        mesh = bpy.data.meshes.new('veyra_' + part)
        mesh.from_pydata(points, [], [tuple(range(i, i + 3)) for i in range(0, len(points), 3)])
        mesh.update()
        obj = bpy.data.objects.new(mesh.name, mesh)
        bpy.context.collection.objects.link(obj)
        for material in materials:
            mesh.materials.append(material)
        uv = mesh.uv_layers.new(name='Veyra_Atlas')
        for i, (slot, mat, _, _) in enumerate(triangles):
            name = doc['nodes'][doc['skins'][0]['joints'][slot]]['name']
            group = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
            group.add([3 * i + k for k in range(3)], 1, 'REPLACE')
            mesh.polygons[i].material_index = mat
            for k in range(3):
                uv.data[3 * i + k].uv = ((mat + (0.15, 0.85, 0.5)[k]) / 3, (0.15, 0.15, 0.85)[k])
        obj.modifiers.new('MU_Rigid_Preview', 'ARMATURE').object = rig
    bpy.ops.wm.save_as_mainfile(filepath=str(path))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reference', type=Path, default=ROOT / 'public/game-assets/Player/player.glb')
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'public/game-assets/Custom')
    parser.add_argument('--blend', type=Path, default=ROOT / 'art/veyra/character_source.blend')
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    if hashlib.sha256(args.reference.read_bytes()).hexdigest() != REFERENCE_HASH:
        raise ValueError('Reference hash differs from MU-legacy-local-284')
    reference, binary = read_glb(args.reference)
    pose = bind_pose(reference, binary)
    groups = geometry(reference, pose)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    args.blend.parent.mkdir(parents=True, exist_ok=True)
    outputs = [write_character(reference, binary, pose, [t for ts in groups.values() for t in ts], args.output_dir / 'veyra_body.glb', True)]
    for part, triangles in groups.items():
        outputs.append(write_character(reference, binary, pose, triangles, args.output_dir / f'veyra_{part}.glb', False))
    save_blend(reference, pose, groups, args.blend)
    manifest = {'name': 'Veyra, Custodia del Umbral', 'profile': 'MU-legacy-local-284', 'skinSlots': 61, 'referenceSHA256': REFERENCE_HASH, 'bindAction': 'player_action_0', 'bindTimeSeconds': 0, 'coordinates': 'Unmodified canonical MU GLB coordinates; runtime applies its own base', 'skin': 'Rigid bone-local vertices; identity inverse binds', 'blenderVersion': bpy.app.version_string, 'sockets': {'Weapon1': {'muIndex': 33, 'skinSlot': 34}, 'Weapon2': {'muIndex': 42, 'skinSlot': 43}, 'Wings': {'muIndex': 47, 'skinSlot': 48}}, 'license': {'geometry': 'Original procedural Veyra geometry', 'referenceClips': 'Inherited local game reference; redistribution rights must be checked separately'}, 'productionApproved': False, 'outputs': outputs}
    (args.output_dir / 'veyra_manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(manifest, indent=2))


if __name__ == '__main__':
    main()
