export function mapMeshToLayer(meshName, knowledgeGraphEntities) {
  if (!meshName) return "unknown";
  
  const normalizedMeshName = meshName.toLowerCase();
  
  // Tentar encontrar uma entidade no KG que corresponda ao nome da mesh
  // Isso pode ser aprimorado usando fuse.js ou regex mais complexos futuramente
  const entity = knowledgeGraphEntities.find(e => 
    normalizedMeshName.includes(e.id.toLowerCase()) || 
    (e.latinName && normalizedMeshName.includes(e.latinName.toLowerCase())) ||
    normalizedMeshName.includes(e.name.toLowerCase())
  );

  if (entity && entity.layer) {
    return entity.layer;
  }

  // Fallback baseado em prefixos heurísticos genéricos
  if (normalizedMeshName.includes("art")) return "arterial";
  if (normalizedMeshName.includes("vein") || normalizedMeshName.includes("ven")) return "venous";
  if (normalizedMeshName.includes("ner")) return "nervous";
  if (normalizedMeshName.includes("lig")) return "ligament";
  if (normalizedMeshName.includes("mus")) return "muscular";
  if (normalizedMeshName.includes("lym")) return "lymphatic";

  return "unknown";
}
