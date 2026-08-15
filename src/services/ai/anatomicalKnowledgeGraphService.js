/**
 * Anatomical Knowledge Graph & Hybrid Reranker Engine
 * Conecta Estruturas, Inervações, Vascularização, Modelos 3D e Capítulos do Latarjet
 */

import { anatomicalStructureRegistry } from "../../data/anatomicalStructureRegistry";
import { latarjetQuestionBank } from "../../data/latarjetQuestionBank";
import { LOCAL_MODELS } from "../../data/localModels";

/**
 * Grafo de Conhecimento Anatômico Relacional
 */
export function queryAnatomicalKnowledgeGraph(searchTerm) {
  if (!searchTerm || typeof searchTerm !== "string") return null;

  const termLower = searchTerm.toLowerCase().trim();
  const structureList = Object.values(anatomicalStructureRegistry || {});

  // 1. Busca no Registro de Estruturas Anatômicas
  const matchedStructures = structureList.filter((item) => {
    return (
      item.regionName?.toLowerCase().includes(termLower) ||
      item.anatomicalSystem?.toLowerCase().includes(termLower) ||
      item.relatedStructures?.some((s) => s.toLowerCase().includes(termLower))
    );
  });

  // 2. Busca na Base Latarjet de 1.500 Questões
  const matchedQuestions = (latarjetQuestionBank || []).filter((q) => {
    return (
      q.pergunta?.toLowerCase().includes(termLower) ||
      q.subtema?.toLowerCase().includes(termLower) ||
      q.tema?.toLowerCase().includes(termLower) ||
      q.macroCategoria?.toLowerCase().includes(termLower)
    );
  });

  // 3. Busca na Biblioteca de Modelos 3D
  const matchedModels = (LOCAL_MODELS || []).filter((m) => {
    return (
      m.title?.toLowerCase().includes(termLower) ||
      m.system?.toLowerCase().includes(termLower) ||
      m.region?.toLowerCase().includes(termLower) ||
      m.description?.toLowerCase().includes(termLower)
    );
  });

  // Re-Ranking Híbrido por Pontuação de Relevância
  const scoredStructures = matchedStructures.map((s) => {
    let score = 0;
    const name = s.regionName || s.name || "";
    if (name.toLowerCase() === termLower) score += 100;
    else if (name.toLowerCase().startsWith(termLower)) score += 60;
    else if (name.toLowerCase().includes(termLower)) score += 30;
    if (s.anatomicalSystem?.toLowerCase().includes(termLower)) score += 15;
    return { ...s, name, relevanceScore: score };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);

  return {
    query: searchTerm,
    totalHits: scoredStructures.length + matchedQuestions.length + matchedModels.length,
    primaryStructure: scoredStructures[0] || null,
    relatedStructures: scoredStructures.slice(0, 5),
    latarjetReferences: matchedQuestions.slice(0, 4).map((q) => ({
      tomo: q.tomo,
      macrocategoria: q.macrocategoria,
      tema: q.tema,
      subtema: q.subtema,
      capitulo: q.latarjetCapitulo || "Capítulo do Latarjet",
      pergunta: q.pergunta
    })),
    models3D: matchedModels.slice(0, 3).map((m) => ({
      id: m.id,
      title: m.title,
      system: m.system,
      region: m.region,
      slug: m.slug
    }))
  };
}

/**
 * Gera o contexto estruturado do Grafo Anatômico para injeção no Tutor IA
 */
export function buildGraphContextPrompt(searchTerm) {
  const graphData = queryAnatomicalKnowledgeGraph(searchTerm);
  if (!graphData || graphData.totalHits === 0) return "";

  let prompt = `\n--- GRAFO DE CONHECIMENTO ANATÔMICO (Nível de Confiança 100%) ---\n`;
  
  if (graphData.primaryStructure) {
    const p = graphData.primaryStructure;
    prompt += `📌 ESTRUTURA PRINCIPAL: ${p.name || p.regionName}\n`;
    prompt += `   • Sistema/Região: ${p.anatomicalSystem || p.system} | ${p.regionName || p.region}\n`;
    if (p.relatedStructures?.length) prompt += `   • Estruturas Relacionadas: ${p.relatedStructures.join(", ")}\n`;
  }

  if (graphData.latarjetReferences.length > 0) {
    prompt += `📚 REFERÊNCIAS DO LATARJET & RUIZ LIARD:\n`;
    graphData.latarjetReferences.forEach((ref, idx) => {
      prompt += `   ${idx + 1}. [Tomo ${ref.tomo}] ${ref.macrocategoria} -> ${ref.tema} (${ref.subtema})\n`;
    });
  }

  if (graphData.models3D.length > 0) {
    prompt += `🧊 MODELOS 3D DISPONÍVEIS NA PLATAFORMA:\n`;
    graphData.models3D.forEach((m) => {
      prompt += `   • ${m.title} (${m.system} / ${m.region})\n`;
    });
  }

  prompt += `--- FIM DO GRAFO ---\n`;
  return prompt;
}
