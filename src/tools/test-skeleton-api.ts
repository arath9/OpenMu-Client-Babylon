import { Document } from "@gltf-transform/core";

const document = new Document();

// Try different approaches for creating skeleton with bones
console.log("=== Testing Skin creation ===");

try {
  const skin = document.createSkin("TestSkin");
  console.log("Created Skin:", skin);
  console.log("Skin methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(skin)));
  
  // Try to create a bone as Node and add to skin
  const node1 = document.createNode("Bone1");
  console.log("Created Bone1 (as Node):", node1);
  
  skin.addJoint(node1);
  console.log("Added joint, joints count:", skin.joints.length);
  
} catch (error: any) {
  console.error("Error:", error.message);
}

// Try writing with correct API
console.log("\n=== Testing write ===");
try {
  import("@gltf-transform/functions").then((functions: any) => {
    console.log("Functions exported:", Object.keys(functions));
    
    // Check for writeBinary or similar
    if (functions.writeBinary) {
      console.log("writeBinary found!");
    } else {
      console.log("writeBinary NOT found");
    }
  });
} catch (error: any) {
  console.error("Error:", error.message);
}
