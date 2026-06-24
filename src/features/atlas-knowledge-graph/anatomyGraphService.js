import { anatomyEntities } from './anatomyEntities.mock';
import { anatomyRelations } from './anatomyRelations.mock';

export const anatomyGraphService = {
  getEntityById: (id) => {
    return anatomyEntities.find(e => e.id === id);
  },

  getEntityByName: (name) => {
    return anatomyEntities.find(e => e.name.toLowerCase() === name.toLowerCase() || e.latinName.toLowerCase() === name.toLowerCase());
  },

  getRelatedEntities: (entityId) => {
    // Busca relações onde a entidade é a fonte (source) ou o alvo (target)
    const relations = anatomyRelations.filter(r => r.source === entityId || r.target === entityId);
    
    return relations.map(rel => {
      const isSource = rel.source === entityId;
      const relatedId = isSource ? rel.target : rel.source;
      
      // Procura a entidade completa para complementar os dados do grafo, ou se for patologia simples, retorna só o ID
      const entity = anatomyEntities.find(e => e.id === relatedId) || { id: relatedId, name: relatedId.toUpperCase() };
      
      return {
        relationType: rel.type,
        relationLabel: rel.label,
        isSource,
        entity
      };
    });
  },

  getEntitiesBySystem: (system) => {
    return anatomyEntities.filter(e => e.system === system);
  },

  getEntitiesByCategory: (category) => {
    return anatomyEntities.filter(e => e.category === category);
  },

  getEntitiesByMarkerId: (markerId) => {
    return anatomyEntities.filter(e => e.markerIds.includes(markerId));
  },

  searchAnatomyGraph: (query) => {
    const q = query.toLowerCase();
    return anatomyEntities.filter(e => 
      e.name.toLowerCase().includes(q) || 
      e.latinName.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
    );
  },

  // ---- Advanced Query Intelligence (Phase 8.0B) ----

  getClinicalSummary: (entityId) => {
    const e = anatomyEntities.find(x => x.id === entityId);
    return e?.clinicalRelevance || [];
  },

  getExamPearls: (entityId) => {
    const e = anatomyEntities.find(x => x.id === entityId);
    return e?.examPearls || [];
  },

  getPathologyLinks: (entityId) => {
    const e = anatomyEntities.find(x => x.id === entityId);
    return e?.relatedPathologies || [];
  },

  getGraphContextForAI: (entityId) => {
    const e = anatomyEntities.find(x => x.id === entityId);
    if (!e) return null;
    return {
      entity: e.name,
      latin: e.latinName,
      description: e.description,
      clinical: e.clinicalRelevance,
      pearls: e.examPearls,
      pathologies: e.relatedPathologies
    };
  },

  answerStructuredQuery: (query) => {
    const q = query.toLowerCase();
    let targetEntity = null;

    // Acha a entidade alvo mencionada na query
    for (const e of anatomyEntities) {
      if (q.includes(e.name.toLowerCase()) || q.includes(e.latinName.toLowerCase())) {
        targetEntity = e;
        break; // Pega a primeira que achar
      }
    }

    if (!targetEntity) {
      return {
        intent: "unknown",
        entityId: null,
        answer: "Não consegui identificar a estrutura anatômica na sua pergunta. Tente algo como 'Qual a irrigação do útero?'.",
        relatedEntities: [],
        suggestedViewerCommand: null
      };
    }

    let intent = "general";
    let answer = `Sobre o ${targetEntity.name}: ${targetEntity.description}`;
    let related = [];

    if (q.includes("irrigação") || q.includes("artéria") || q.includes("sangue")) {
      intent = "arterial_supply";
      answer = `A irrigação arterial principal do ${targetEntity.name} é fornecida por: ${targetEntity.arterialSupply.join(", ") || 'Não catalogado'}.`;
      related = targetEntity.arterialSupply;
    } 
    else if (q.includes("patologia") || q.includes("doença")) {
      intent = "pathologies";
      answer = `As patologias comumente associadas ao ${targetEntity.name} são: ${targetEntity.relatedPathologies.join(", ")}.`;
      related = targetEntity.relatedPathologies;
    }
    else if (q.includes("prova") || q.includes("saber") || q.includes("dica") || q.includes("pérola")) {
      intent = "exam_pearls";
      answer = `Dica clínica/prova sobre ${targetEntity.name}: ${targetEntity.examPearls.join(" ")}`;
    }
    else if (q.includes("estrutura") || q.includes("relacionada") || q.includes("vizinhança")) {
      intent = "adjacent_to";
      answer = `O ${targetEntity.name} possui relação íntima com: ${targetEntity.relatedStructures.join(", ")}.`;
      related = targetEntity.relatedStructures;
    }

    return {
      intent,
      entityId: targetEntity.id,
      answer,
      relatedEntities: related,
      suggestedViewerCommand: {
        type: "focusMarker",
        markerId: targetEntity.markerIds[0] || null
      }
    };
  }
};
