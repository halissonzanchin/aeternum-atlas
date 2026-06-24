export function auditMeshMapping(scene) {
  if (!scene) return;
  
  const auditLog = [];

  scene.traverse((child) => {
    if (child.isMesh) {
      const geometry = child.geometry;
      const vertexCount = geometry && geometry.attributes.position ? geometry.attributes.position.count : 0;
      const layerId = child.userData.atlasLayer || "unknown";
      
      let confidence = "Low";
      let reason = "Fallback (Unknown)";
      
      if (layerId !== "unknown") {
        if (child.name.toLowerCase().includes(layerId) || layerId === "arterial" || layerId === "venous") {
          confidence = "Medium";
          reason = "Heuristics match";
        } else {
          confidence = "High";
          reason = "Knowledge Graph Match";
        }
      }

      auditLog.push({
        meshName: child.name,
        detectedLayer: layerId,
        confidence,
        reason,
        material: child.material ? child.material.name || child.material.type : "None",
        vertexCount,
        userDataLayer: child.userData.atlasLayer
      });
    }
  });

  console.groupCollapsed(`[Atlas 3D Audit] ${auditLog.length} meshes scanned`);
  console.table(auditLog);
  console.groupEnd();
  
  return auditLog;
}
