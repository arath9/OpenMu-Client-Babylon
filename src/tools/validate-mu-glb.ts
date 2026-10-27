/**
 * Script CLI para validar GLBs MU compatibles
 * Uso: bun src/tools/validate-mu-glb.ts /path/to/model.glb
 */

import validateMUCompatibleGLB from './validateMUCompatibleGLB.js';
import { Engine } from '@babylonjs/core';
import fs from 'fs';
import path from 'path';

const glbPath = process.argv[2];

if (!glbPath) {
  console.error('Usage: bun src/tools/validate-mu-glb.ts <path-to-glb>');
  process.exit(1);
}

// Validar que archivo existe
if (!fs.existsSync(glbPath)) {
  console.error(`Error: File not found: ${glbPath}`);
  process.exit(1);
}

console.log(`\n🔍 Validating GLB for MU compatibility:`);
console.log(`   Path: ${path.resolve(glbPath)}\n`);

const engine = new Engine(null, true); // Headless mode
const report = await validateMUCompatibleGLB(glbPath, engine);

// Reporte de validación
console.log('📊 VALIDATION REPORT');
console.log('=' .repeat(50));

if (report.valid) {
  console.log('✅ GLB COMPATIBLE CON MU ONLINE RIG\n');
} else {
  console.log('❌ GLB NO COMPATIBLE - ISSUES FOUND:\n');
}

console.log(`   Bone Count: ${report.boneCount}/62`);
console.log(`   Required Bones Present: ${report.requiredBonesPresent.length}/${path.resolve(glbPath).split('/').pop()}`);

if (report.missingBones.length > 0) {
  console.log('\n   Missing Bones/Elements:');
  report.missingBones.forEach(bone => console.log(`      ❌ ${bone}`));
}

if (!report.socketsValid) {
  console.log('\n   ⚠️ Socket bones (33,42,47) missing - weapons/wings may fail to attach');
}

if (report.warnings.length > 0) {
  console.log('\n   Warnings:');
  report.warnings.forEach(w => console.log(`      ⚠️ ${w}`));
}

// Validar GLBs existentes en proyecto
console.log('\n' + '='.repeat(50));
console.log('📁 VALIDATING EXISTING ASSETS IN PROJECT:\n');

const projectPath = path.join(__dirname, '..', 'public', 'game-assets', 'Custom');
if (fs.existsSync(projectPath)) {
  const files = fs.readdirSync(projectPath);
  
  for (const file of files) {
    if (file.endsWith('.glb')) {
      const filePath = path.join(projectPath, file);
      console.log(`\n📄 ${file}:`);
      
      try {
        const testReport = await validateMUCompatibleGLB(filePath, engine);
        
        if (testReport.valid) {
          console.log('   ✅ MU COMPATIBLE');
        } else {
          console.log('   ❌ NOT MU COMPATIBLE');
          
          // Mostrar solo errores críticos
          const criticalIssues = testReport.missingBones.filter(b => 
            b.includes('Expected') || b.includes('Socket')
          );
          
          if (criticalIssues.length > 0) {
            console.log('   Critical issues:');
            criticalIssues.forEach(issue => console.log(`      • ${issue}`));
          }
        }
        
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
      }
    }
  }
}

console.log('\n' + '='.repeat(50));
console.log('✅ Validation complete');
