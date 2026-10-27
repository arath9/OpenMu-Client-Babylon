/**
 * Script para generar GLB básico con rig MU compatible usando @gltf-transform/core v4
 * 
 * Requisitos:
 * - 62 huesos en orden exacto MU (skin_root primero, luego bone_0_* a bone_61_*)
 * - Mallas básicas geométricas (cubo cabeza, cilindros extremidades)
 * - Exportar GLB válido a /public/game-assets/Custom/basic_character.glb
 */

import { Document } from "@gltf-transform/core";
import fs from "fs";
import path from "path";

/**
 * Nombres de huesos MU en orden exacto (62 huesos)
 */
const MU_BONE_ORDER = [
  "skin_root",
  "bone_1_spine_", "bone_2_spine_", "bone_3_spine_",
  "bone_4_neck_", "bone_5_head_",
  "bone_6_left_shoulder_upper_", "bone_7_left_shoulder_", "bone_8_right_shoulder_",
  "bone_9_left_elbow_", "bone_10_right_elbow_",
  "bone_11_left_hand_",    // LEFT_HAND_BONE socket
  "bone_12_right_hand_",   // RIGHT_HAND_BONE socket
  "bone_13_hip_left_", "bone_14_hip_right_",
  "bone_15_knee_left_", "bone_16_knee_right_",
  "bone_17_foot_left_", "bone_18_foot_right_",
  // Huesos adicionales para completar rig MU hasta 62 huesos
  "bone_19_chest_front_", "bone_20_chest_back_", "bone_21_stomach_",
  "bone_22_left_bicep_upper_", "bone_23_right_bicep_upper_",
  "bone_24_left_forearm_lower_", "bone_25_right_forearm_lower_",
  "bone_26_left_thigh_front_", "bone_27_right_thigh_front_",
  "bone_28_left_thigh_back_", "bone_29_right_thigh_back_",
  "bone_30_left_shin_front_", "bone_31_right_shin_front_",
  "bone_32_left_shin_back_", "bone_33_right_shin_back_",
  "bone_34_toe_left_", "bone_35_toe_right_",
  "bone_36_fingertip_left_thumb_", "bone_37_fingertip_left_index_",
  "bone_38_fingertip_left_middle_", "bone_39_fingertip_left_ring_",
  "bone_40_fingertip_left_pinky_", "bone_41_fingertip_right_thumb_",
  "bone_42_fingertip_right_index_", // RIGHT_HAND_BONE socket (índice 42)
  "bone_43_fingertip_right_middle_", "bone_44_fingertip_right_ring_",
  "bone_45_fingertip_right_pinky_", "bone_46_back_upper_", "bone_47_back_lower_", // BACK_BONE socket (índice 47)
  "bone_48_wing_left_root_", "bone_49_wing_right_root_",
  "bone_50_wing_left_middle_", "bone_51_wing_right_middle_",
  "bone_52_wing_left_tip_", "bone_53_wing_right_tip_",
  "bone_54_armor_chest_left_", "bone_55_armor_chest_right_",
  "bone_56_armor_legs_left_", "bone_57_armor_legs_right_",
  "bone_58_weapon_hilt_left_", "bone_59_weapon_hilt_right_",
  "bone_60_glove_left_", "bone_61_glove_right_"
];

/**
 * Crea un esqueleto MU compatible con exactamente 62 huesos en orden correcto
 */
function createMUSkeleton(document: Document) {
  const skin = document.createSkin("MU_Skin");
  
  let parentIndex: number | null = null;
  
  for (let i = 0; i < MU_BONE_ORDER.length; i++) {
    const boneName = MU_BONE_ORDER[i];
    
    switch(i) {
      case 0: parentIndex = null; break;   // skin_root - root sin padre
      case 1: parentIndex = 0; break;      // spine_1 → root
      case 2: parentIndex = 1; break;      // spine_2 → spine_1
      case 3: parentIndex = 2; break;      // spine_3 → spine_2
      case 4: parentIndex = 3; break;      // neck → spine_3
      case 5: parentIndex = 4; break;      // head → neck
      case 6: parentIndex = 2; break;      // left_shoulder_upper → spine_2
      case 7: parentIndex = 6; break;      // left_shoulder → shoulder_upper
      case 8: parentIndex = 2; break;      // right_shoulder → spine_2
      case 9: parentIndex = 7; break;      // left_elbow → left_shoulder
      case 10: parentIndex = 8; break;     // right_elbow → right_shoulder
      case 11: parentIndex = 9; break;     // left_hand → left_elbow (socket)
      case 12: parentIndex = 10; break;    // right_hand → right_elbow (socket)
      case 13: parentIndex = 2; break;     // hip_left → spine_2
      case 14: parentIndex = 2; break;     // hip_right → spine_2
      case 15: parentIndex = 13; break;    // knee_left → hip_left
      case 16: parentIndex = 14; break;    // knee_right → hip_right
      case 17: parentIndex = 15; break;    // foot_left → knee_left
      case 18: parentIndex = 16; break;    // foot_right → knee_right
      default: 
        parentIndex = i - 1;
    }
    
    const bone = document.createNode(boneName);
    skin.addJoint(bone);
    
    if (parentIndex !== null && parentIndex >= 0) {
      const joints = skin.listJoints();
      const parentNode = joints[parentIndex];
      if (parentNode) {
        parentNode.addChild(bone);
      }
    }
  }
  
  console.log(`✅ Created skeleton with ${skin.listJoints().length} bones`);
  
  return skin;
}

/**
 * Crea mallas básicas geométricas para personaje MU
 */
function createBasicMeshes(document: Document) {
  const materials: any = {};
  const meshes: any = {};
  
  const bodyMaterial = document.createMaterial("BodyMaterial");
  bodyMaterial.setBaseColorFactor([0.5, 0.5, 0.6, 1.0]);
  
  const skinMaterial = document.createMaterial("SkinMaterial");
  skinMaterial.setBaseColorFactor([0.9, 0.8, 0.7, 1.0]);
  
  materials.body = bodyMaterial;
  materials.skin = skinMaterial;
  
  function createBox(name: string, material: any, position: [number, number, number], size: { x: number, y: number, z: number }): any {
    const halfSize = { 
      x: Math.abs(size.x) / 2, 
      y: Math.abs(size.y) / 2, 
      z: Math.abs(size.z) / 2 
    };
    
    const positions = new Float32Array([
      position[0]-halfSize.x, position[1]-halfSize.y, position[2]+halfSize.z,
      position[0]+halfSize.x, position[1]-halfSize.y, position[2]+halfSize.z,
      position[0]+halfSize.x, position[1]+halfSize.y, position[2]+halfSize.z,
      position[0]-halfSize.x, position[1]+halfSize.y, position[2]+halfSize.z,
      position[0]-halfSize.x, position[1]-halfSize.y, position[2]-halfSize.z,
      position[0]-halfSize.x, position[1]+halfSize.y, position[2]-halfSize.z,
      position[0]+halfSize.x, position[1]+halfSize.y, position[2]-halfSize.z,
      position[0]+halfSize.x, position[1]-halfSize.y, position[2]-halfSize.z,
    ]);
    
    const indices = new Uint16Array([
      0, 1, 2, 0, 2, 3,    // front
      4, 5, 6, 4, 6, 7,    // back
      8, 9, 10, 8, 10, 11, // top
      12, 13, 14, 12, 14, 15, // bottom
      16, 17, 18, 16, 18, 19, // left
      20, 21, 22, 20, 22, 23  // right
    ]);
    
    const mesh = document.createMesh(name);
    const prim = document.createPrimitive();
    prim.setMaterial(material);
    
    const positionAccessor = document.createAccessor();
    positionAccessor.setType("VEC3");
    positionAccessor.setArray(positions);
    
    const indexAccessor = document.createAccessor();
    indexAccessor.setType("SCALAR");
    indexAccessor.setArray(indices);
    
    prim.setAttribute("POSITION", positionAccessor);
    prim.setIndices(indexAccessor);
    
    mesh.addPrimitive(prim);
    
    return mesh;
  }
  
  meshes["head"] = createBox("Head", skinMaterial, [0, 1.75, 0], { x: 0.4, y: 0.4, z: 0.4 });
  meshes["torso"] = createBox("Torso", bodyMaterial, [0, 1.2, 0], { x: 0.6, y: 0.8, z: 0.3 });
  meshes["leftArm"] = createBox("LeftArm", bodyMaterial, [-0.45, 1.4, 0], { x: 0.18, y: 0.7, z: 0.09 });
  meshes["rightArm"] = createBox("RightArm", bodyMaterial, [0.45, 1.4, 0], { x: 0.18, y: 0.7, z: 0.09 });
  meshes["leftForearm"] = createBox("LeftForearm", bodyMaterial, [-0.7, 1.05, 0], { x: 0.15, y: 0.6, z: 0.075 });
  meshes["rightForearm"] = createBox("RightForearm", bodyMaterial, [0.7, 1.05, 0], { x: 0.15, y: 0.6, z: 0.075 });
  meshes["leftHand"] = createBox("LeftHand", skinMaterial, [-0.9, 0.75, 0], { x: 0.15, y: 0.15, z: 0.15 });
  meshes["rightHand"] = createBox("RightHand", skinMaterial, [0.9, 0.75, 0], { x: 0.15, y: 0.15, z: 0.15 });
  meshes["leftLeg"] = createBox("LeftLeg", bodyMaterial, [-0.15, 0.4, 0], { x: 0.22, y: 0.8, z: 0.11 });
  meshes["rightLeg"] = createBox("RightLeg", bodyMaterial, [0.15, 0.4, 0], { x: 0.22, y: 0.8, z: 0.11 });
  
  console.log(`✅ Created ${Object.keys(meshes).length} basic meshes`);
  
  return { materials, meshes };
}

/**
 * Exporta el personaje como GLB válido usando @gltf-transform/core v4
 */
async function exportCharacterToGLB(
  document: Document,
  outputPath: string
): Promise<void> {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ Created directory: ${outputDir}`);
  }
  
  try {
    const functions = await import("@gltf-transform/functions");
    await functions.writeGLTF(document, outputPath);
    
    console.log(`✅ Character exported to: ${path.resolve(outputPath)}`);
  } catch (error: any) {
    console.error("❌ Error exporting GLB:", error.message);
    throw error;
  }
}

/**
 * Función principal: genera GLB MU compatible
 */
async function generateMUCompatibleCharacter(
  outputPath: string = "/public/game-assets/Custom/basic_character.glb"
): Promise<void> {
  console.log("\n🎮 Generating MU-compatible character GLB...\n");
  
  const document = new Document();
  
  console.log("🦴 Creating skeleton with MU rig structure...");
  const skin = createMUSkeleton(document);
  
  if (skin.listJoints().length !== 62) {
    throw new Error(`Expected 62 bones, got ${skin.listJoints().length}`);
  }
  console.log(`✅ Skeleton has exactly 62 bones\n`);
  
  console.log("📐 Creating basic geometric meshes...");
  const { materials, meshes } = createBasicMeshes(document);
  
  console.log("\n💾 Exporting to GLB...");
  await exportCharacterToGLB(document, outputPath);
  
  console.log("\n✅ Character generation complete!");
}

// Ejecutar generación si este script se ejecuta directamente
if (require.main === module) {
  const outputPath = process.argv[2] || "/public/game-assets/Custom/basic_character.glb";
  
  generateMUCompatibleCharacter(outputPath)
    .then(() => {
      console.log("\n✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error: Error) => {
      console.error("❌ Error generating character:", error.message);
      process.exit(1);
    });
}

export default generateMUCompatibleCharacter;
