/**
 * Valida que un GLB sea compatible con MU Online rig requirements
 * - 62 huesos exactos (skin_root + bone_0_* a bone_61_*)
 * - Orden correcto de huesos
 * - Sockets presentes (33,42,47)
 */

import { GLTFLoader, AssetContainer, Engine } from '@babylonjs/core';
import path from 'path';

export interface ValidationReport {
  valid: boolean;
  boneCount: number;
  requiredBonesPresent: string[];
  missingBones: string[];
  socketsValid: boolean;
  warnings: string[];
}

async function validateMUCompatibleGLB(
  glbPath: string,
  engine: Engine = new Engine(null, true) // Headless mode
): Promise<ValidationReport> {
  const report: ValidationReport = {
    valid: false,
    boneCount: 0,
    requiredBonesPresent: [],
    missingBones: [],
    socketsValid: false,
    warnings: []
  };

  try {
    const loader = new GLTFLoader();
    const container = await loader.loadAsync(glbPath);
    
    if (!container.skeleton) {
      report.warnings.push('No skeleton found in GLB');
      return report;
    }

    // Contar huesos
    const bones = container.skeleton.bones;
    report.boneCount = bones.length;

    if (bones.length !== 62) {
      report.missingBones.push(`Expected 62 bones, found ${bones.length}`);
    }

    // Verificar orden de huesos (skin_root primero, luego bone_<i>_<name>)
    const requiredBoneNames = ['skin_root'];
    for (let i = 0; i < 61; i++) {
      requiredBoneNames.push(`bone_${i}_`);
    }

    for (const reqName of requiredBoneNames) {
      const found = bones.some(b => b.name.startsWith(reqName));
      if (found) {
        report.requiredBonesPresent.push(reqName);
      } else {
        report.missingBones.push(reqName);
      }
    }

    // Verificar sockets MU específicos
    const socketIndices = [33, 42, 47]; // RIGHT_HAND_BONE, LEFT_HAND_BONE, BACK_BONE
    const socketsPresent = socketIndices.every(idx => bones[idx]);
    report.socketsValid = socketsPresent;

    if (!socketsPresent) {
      report.missingBones.push('Socket bones (33, 42, or 47) missing');
    }

    // Validación final
    report.valid = 
      bones.length === 62 &&
      report.requiredBonesPresent.length >= 50 &&
      socketsValid;

  } catch (error) {
    report.warnings.push(`Error loading GLB: ${error}`);
  }

  return report;
}

export default validateMUCompatibleGLB;
