import { Document } from "@gltf-transform/core";

const document = new Document();

// Check what's available in functions
import("@gltf-transform/functions").then((functions: any) => {
  console.log("Functions keys:", Object.keys(functions).filter(k => k.toLowerCase().includes('write')));
  
  // Try to find a write function
  for (const key of Object.keys(functions)) {
    if (typeof functions[key] === 'function' && key.toLowerCase().includes('write')) {
      console.log("Write-like function found:", key);
    }
  }
});

// Check Document methods
console.log("\nDocument prototype keys:");
const protoKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(document));
for (const key of protoKeys) {
  if (key.toLowerCase().includes('write') || key.toLowerCase().includes('export')) {
    console.log("  -", key);
  }
}
