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

export function normalizeMindMapOutline(rawText) {
  const source = String(rawText || "")
    .replace(/```(?:text|markdown)?/gi, "")
    .replace(/```/g, "")
    .replace(/\r/g, "");

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
    if (lines.length >= MAX_NODES) break;
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

export function buildMindMapTutorPrompt(topic) {
  const normalizedTopic = cleanLabel(topic);
  if (normalizedTopic.length < 3) throw new Error("Informe um tema anatômico com pelo menos três caracteres.");
  return `${FORMAT_INSTRUCTIONS}\n\nTEMA: ${normalizedTopic}`;
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

  if (!response || response.mode !== "online") {
    throw new Error("O Tutor IA precisa de uma sessão autenticada e conexão ativa para gerar o mapa.");
  }

  return {
    outline: normalizeMindMapOutline(response.text),
    conversationId: response.conversationId || null,
    mode: response.mode
  };
}

export const mindMapGenerationLimits = Object.freeze({
  maxNodes: MAX_NODES,
  maxDepth: MAX_DEPTH,
  maxLabelLength: MAX_LABEL_LENGTH
});
