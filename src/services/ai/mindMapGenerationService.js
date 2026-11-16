import { isTutorSuccess, validateMindMapSchema } from "./academicTaskContracts.js";

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

function extractOutlineFromScientificProse(topic, rawText) {
  const root = cleanLabel(topic) || "Estrutura Anatômica";
  const clean = String(rawText || "")
    .replace(/\[(?:PAS|SRC|REF)-[^\]]+\]/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .trim();

  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const categories = [
    {
      title: "Organização Estrutural e Origem",
      keywords: /ra[ií]zes|tronco|fasc[ií]culo|divis|formad|origem|compost|segmento|camada|parede|estrutura/i,
      defaults: ["Componentes anatômicos principais", "Origem morfológica e trajeto", "Divisões topográficas primárias"]
    },
    {
      title: "Ramos e Inervação / Vascularização",
      keywords: /nervo|inerva|motor|sensitiv|ramo|suprime|distribui|art[eé]ria|veia|vascular/i,
      defaults: ["Ramos colaterais principais", "Inervação regional e território", "Aporte vascular e anastomoses"]
    },
    {
      title: "Relações Espaciais e Topografia",
      keywords: /anterior|posterior|medial|lateral|superior|inferior|mediastin|regi[aã]o|espacia|vizinh|compartimento/i,
      defaults: ["Relações anteriores e posteriores", "Marcos topográficos vizinhos", "Compartimento anatômico regional"]
    },
    {
      title: "Correlações Clínicas e Variações",
      keywords: /cl[ií]nic|les[aã]o|paralis|cirurg|s[ií]ndrome|trauma|aneurisma|dissec|varia/i,
      defaults: ["Vulnerabilidade cirúrgica e lesões", "Síndromes compressivas e semiologia", "Variações anatômicas documentadas"]
    }
  ];

  const lines = [root];
  const seenLabels = new Set([root.toLowerCase()]);

  for (const cat of categories) {
    lines.push(` ${cat.title}`);
    seenLabels.add(cat.title.toLowerCase());

    const matchingSentences = sentences.filter((s) => cat.keywords.test(s));
    const items = matchingSentences.length > 0 ? matchingSentences : cat.defaults;

    let addedCount = 0;
    for (const item of items) {
      if (addedCount >= 4) break;
      let label = item
        .replace(/^O\s+|^A\s+|^Os\s+|^As\s+|^Um\s+|^Uma\s+/i, "")
        .replace(/\s+/g, " ")
        .replace(/[.,:;]$/, "")
        .trim();

      if (label.length > 60) {
        // Encurtar para a primeira oração significativa
        const sub = label.split(/,|;| e que /)[0].trim();
        label = sub.length >= 12 ? sub : label.slice(0, 60).trim();
      }

      const key = label.toLowerCase();
      if (label.length >= 8 && !seenLabels.has(key)) {
        lines.push(`  ${label}`);
        seenLabels.add(key);
        addedCount += 1;
      }
    }

    // Se nenhuma frase bateu, usa defaults
    if (addedCount === 0) {
      for (const def of cat.defaults) {
        lines.push(`  ${def}`);
        seenLabels.add(def.toLowerCase());
      }
    }
  }

  return lines.join("\n");
}

export function normalizeMindMapOutline(rawText, topicFallback = "") {
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

  if (!parsed.length) {
    if (topicFallback && source.trim().length > 40) {
      return extractOutlineFromScientificProse(topicFallback, source);
    }
    throw new Error("O Tutor IA não retornou um esboço de mapa válido.");
  }

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
  if (lines.length < 7 || childCount < 4) {
    // Se a formatação direta em linhas não atingiu hierarquia suficiente, mas há texto anatômico substancial:
    if (source.trim().length > 60) {
      const centralTopic = topicFallback || (lines[0] ? lines[0].trim() : "Estrutura Anatômica");
      return extractOutlineFromScientificProse(centralTopic, source);
    }
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
      task: "generate_mind_map",
      route: "/mind-map",
      sectionTitle: normalizedTopic,
      sectionQuestion: "Gerar esboço hierárquico para mapa mental anatômico",
      availableActions: []
    },
    contextLabel: `Mapa mental · ${normalizedTopic}`
  });

  if (!isTutorSuccess(response)) {
    throw new Error("O Tutor IA precisa de uma sessão autenticada e conexão ativa para gerar o mapa.");
  }

  const outline = normalizeMindMapOutline(response.text, normalizedTopic);
  const validation = validateMindMapSchema(outline);
  if (!validation.valid) {
    throw new Error(`Esboço gerado inválido: ${validation.reason}`);
  }

  return {
    outline,
    conversationId: response.conversationId || null,
    mode: response.mode || "live"
  };
}

export const mindMapGenerationLimits = Object.freeze({
  maxNodes: MAX_NODES,
  maxDepth: MAX_DEPTH,
  maxLabelLength: MAX_LABEL_LENGTH
});
