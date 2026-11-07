import { isStudyToolSuccess } from "./studyToolContract.js";
import { generateMindMapAI, checkTermDisambiguation } from "./unifiedStudyAIService.js";

const MAX_NODES = 40;
const MAX_DEPTH = 4;
const MAX_LABEL_LENGTH = 112;

const FORMAT_INSTRUCTIONS = `Crie um mapa mental anatômico didático sobre o tema informado.

FORMATO OBRIGATÓRIO:
- Responda somente com o esboço hierárquico, sem introdução, conclusão, Markdown, numeração ou bloco de código.
- A primeira linha é o tema central e não possui espaços iniciais.
- Cada nível filho usa exatamente um espaço adicional no início da linha.
- Use entre 12 e 32 nós, no máximo quatro níveis e no máximo seis filhos por nó.
- Cada rótulo deve ser curto, único e anatomicamente específico.

QUALIDADE DIDÁTICA:
- Organize do fundamento estrutural para relações, vascularização/inervação e aplicação clínica.
- Use Terminologia Anatomica quando aplicável.
- Não invente referências, páginas ou fontes.
- Não inclua diagnóstico individual nem conduta terapêutica.`;

function stripLinePrefix(line) {
  return line
    .replace(/^\s*#{1,6}\s+/, "")
    .replace(/^(\s*)(?:[-*+] |\d+[.)]\s+)/, "$1")
    .replace(/^[│├└─┬┼]+\s*/, "");
}

function cleanLabel(value) {
  return String(value || "")
    .replace(/[*_`#]+/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[:;\-–—]+|[:;\-–—]+$/g, "")
    .trim()
    .slice(0, MAX_LABEL_LENGTH);
}

export function normalizeMindMapOutline(rawText, maxNodesLimit = MAX_NODES) {
  const source = String(rawText || "")
    .replace(/```(?:text|markdown)?/gi, "")
    .replace(/```/g, "")
    .replace(/\r/g, "");

  const limit = (typeof maxNodesLimit === "number" && maxNodesLimit > 0) ? maxNodesLimit : MAX_NODES;

  const parsed = source
    .split("\n")
    .map((originalLine) => {
      const expanded = originalLine.replace(/\t/g, "  ");
      const leading = expanded.match(/^\s*/)?.[0].length || 0;
      const label = cleanLabel(stripLinePrefix(expanded).trim());
      return { leading, label };
    })
    .filter(({ label }) => label && !/^(fontes recuperadas|observação|nota|explicação)\b/i.test(label));

  if (!parsed.length) throw new Error("O Tutor IA não retornou um esboço de mapa válido.");

  const baseIndent = parsed[0].leading;
  const seen = new Set();
  const lines = [];
  let previousDepth = 0;

  for (const item of parsed) {
    if (lines.length >= limit) break;
    const normalizedKey = item.label.toLocaleLowerCase("pt-BR");
    if (seen.has(normalizedKey)) continue;

    let depth = lines.length === 0 ? 0 : Math.max(1, item.leading - baseIndent);
    depth = Math.min(depth, previousDepth + 1, MAX_DEPTH);
    if (lines.length === 0) depth = 0;

    lines.push(`${" ".repeat(depth)}${item.label}`);
    seen.add(normalizedKey);
    previousDepth = depth;
  }

  const childCount = lines.filter((line) => /^\s+\S/.test(line)).length;
  if (lines.length < 7 || childCount < 5) {
    throw new Error("A resposta do Tutor IA não contém nós suficientes para um mapa didático.");
  }

  return lines.join("\n");
}

export function buildMindMapTutorPrompt(topic, options = {}) {
  const normalizedTopic = cleanLabel(topic);
  if (normalizedTopic.length < 3) throw new Error("Informe um tema anatômico com pelo menos três caracteres.");
  const minNodes = options?.minNodes || 10;
  const maxNodes = options?.maxNodes || 20;
  const instructions = FORMAT_INSTRUCTIONS.replace(
    "- Use entre 12 e 32 nós, no máximo quatro níveis e no máximo seis filhos por nó.",
    `- Use entre ${minNodes} e ${maxNodes} nós, no máximo quatro níveis e no máximo seis filhos por nó.`
  );
  return `${instructions}\n\nTEMA: ${normalizedTopic}`;
}

export async function generateAuthenticatedMindMap({ topic, sendTutorMessage }) {
  if (typeof sendTutorMessage !== "function") {
    throw new Error("A sessão autenticada do Tutor IA não está disponível.");
  }

  const normalizedTopic = cleanLabel(topic);
  const response = await sendTutorMessage({
    text: buildMindMapTutorPrompt(normalizedTopic),
    context: {
      source: "mind-map",
      route: "/mind-map",
      sectionTitle: normalizedTopic,
      sectionQuestion: "Gerar esboço hierárquico para mapa mental anatômico",
      availableActions: []
    },
    contextLabel: `Mapa mental · ${normalizedTopic}`
  });

  const isSuccess = response && (
    response.mode === "online" ||
    response.mode === "live" ||
    isStudyToolSuccess(response)
  );

  if (!isSuccess || !response.text) {
    throw new Error("O Tutor IA precisa de uma sessão autenticada e conexão ativa para gerar o mapa.");
  }

  return {
    outline: normalizeMindMapOutline(response.text),
    conversationId: response.conversationId || null,
    mode: response.mode || "live"
  };
}

export async function generateUnifiedMindMap({ topic, language = "pt", maxNodes = MAX_NODES }) {
  const result = await generateMindMapAI({ topic, language, maxNodes });
  const isSuccess = isStudyToolSuccess(result) && result.text;

  if (!isSuccess) {
    throw new Error(result.message || "O Tutor IA precisa de uma sessão autenticada e conexão ativa para gerar o mapa.");
  }

  return {
    outline: normalizeMindMapOutline(result.text, maxNodes),
    generationId: result.generationId,
    timestamp: result.timestamp,
    mode: result.mode,
    source: result.source,
    disambiguation: result.disambiguation,
    effectiveTopic: result.effectiveTopic
  };
}

export { checkTermDisambiguation };

export const mindMapGenerationLimits = Object.freeze({
  maxNodes: MAX_NODES,
  maxDepth: MAX_DEPTH,
  maxLabelLength: MAX_LABEL_LENGTH
});

