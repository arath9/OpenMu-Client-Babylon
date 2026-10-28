import validateMUCompatibleGLB from './validateMUCompatibleGLB';

const filename = process.argv.slice(2).find(arg => !arg.startsWith('--'));
if (!filename) {
  console.error('Usage: bun src/tools/validate-mu-glb.ts <asset.glb> [--part]');
  process.exitCode = 2;
} else {
  const report = await validateMUCompatibleGLB(filename, { part: process.argv.includes('--part') });
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (!report.valid) process.exitCode = 1;
}
