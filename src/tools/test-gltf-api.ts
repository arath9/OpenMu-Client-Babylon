import { Document } from "@gltf-transform/core";

const document = new Document();
console.log("Document methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(document)));

// Try to create skeleton and bones using correct v4 API
try {
  const skeleton = Skeleton.create(document, "TestSkeleton");
  console.log("Created skeleton via Skeleton.create");
  
  const bone1 = Bone.create(document, "Bone1");
  console.log("Created bone via Bone.create:", bone1);
  
} catch (error) {
  console.error("Error:", error.message);
}

// Try write
document.write().then((result: any) => {
  console.log("Write result type:", typeof result);
}).catch((err: Error) => {
  console.error("Write error:", err.message);
});
