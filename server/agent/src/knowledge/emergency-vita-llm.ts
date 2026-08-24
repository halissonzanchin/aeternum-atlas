import {
  DEFAULT_API_CONNECT_OPTIONS,
  llm,
  type APIConnectOptions
} from "@livekit/agents";
import { randomUUID } from "node:crypto";
import { extractAnatomySearchTerms } from "./vita-knowledge.ts";

const MAX_FALLBACK_CHARACTERS = 760;

type EmergencyLanguage = "pt" | "es" | "en" | "de";

type SourceBlock = {
  reference: string;
  content: string;
};

const LANGUAGE_COPY: Record<
  EmergencyLanguage,
  { evidence: string; source: string; unavailable: string }
> = {
  pt: {
    evidence: "Enquanto o raciocínio avançado se recupera, a biblioteca da Aeternum Vita informa:",
    source: "Fonte recuperada:",
    unavailable:
      "O mecanismo de raciocínio está temporariamente indisponível e não recuperei um trecho bibliográfico seguro para responder agora. Tente novamente em alguns instantes."
  },
  es: {
    evidence: "Mientras se recupera el razonamiento avanzado, la biblioteca de Aeternum Vita indica:",
    source: "Fuente recuperada:",
    unavailable:
      "El mecanismo de razonamiento no está disponible temporalmente y no recuperé un fragmento bibliográfico seguro para responder ahora. Inténtalo de nuevo en unos instantes."
  },
  en: {
    evidence: "While advanced reasoning recovers, the Aeternum Vita library states:",
    source: "Retrieved source:",
    unavailable:
      "The reasoning service is temporarily unavailable, and I could not retrieve a safe bibliographic passage for this question. Please try again in a moment."
  },
  de: {
    evidence: "Während sich der erweiterte Denkservice erholt, zeigt die Bibliothek von Aeternum Vita:",
    source: "Abgerufene Quelle:",
    unavailable:
      "Der Denkservice ist vorübergehend nicht verfügbar, und ich konnte keinen sicheren bibliografischen Abschnitt abrufen. Bitte versuche es gleich noch einmal."
  }
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function languageFromContext(chatCtx: llm.ChatContext): EmergencyLanguage {
  const instructions = chatCtx.items
    .filter((item) => item.type === "message")
    .map((item) => item.textContent || "")
    .join("\n");
  if (/Idioma obrigatório da resposta:\s*Español/i.test(instructions)) return "es";
  if (/Idioma obrigatório da resposta:\s*English/i.test(instructions)) return "en";
  if (/Idioma obrigatório da resposta:\s*Deutsch/i.test(instructions)) return "de";
  return "pt";
}

function lastUserText(chatCtx: llm.ChatContext) {
  for (let index = chatCtx.items.length - 1; index >= 0; index -= 1) {
    const item = chatCtx.items[index];
    if (item.type === "message" && item.role === "user") return item.textContent || "";
  }
  return "";
}

function knowledgeDirective(chatCtx: llm.ChatContext) {
  for (let index = chatCtx.items.length - 1; index >= 0; index -= 1) {
    const item = chatCtx.items[index];
    if (
      item.type === "message"
      && item.role === "developer"
      && item.extra?.aeternumVitaKnowledge === true
    ) {
      return item.textContent || "";
    }
  }
  return "";
}

function parseSourceBlocks(directive: string): SourceBlock[] {
  const library = directive.match(/<biblioteca>([\s\S]*?)<\/biblioteca>/i)?.[1]?.trim() || "";
  if (!library) return [];

  return library
    .split(/\n(?=\[Fonte\s+\d+\])/i)
    .map((block) => {
      const [header = "", ...body] = block.split("\n");
      return {
        reference: header.replace(/^\[Fonte\s+\d+\]\s*/i, "").trim(),
        content: body.join(" ").replace(/\s+/g, " ").trim()
      };
    })
    .filter((source) => source.reference && source.content);
}

function relevantSentences(query: string, sources: SourceBlock[]) {
  const queryTerms = extractAnatomySearchTerms(query)
    .split(/\s+/)
    .map(normalize)
    .filter((term) => term.length >= 3);

  const ranked = sources.flatMap((source, sourceIndex) => {
    return source.content
      .split(/(?<=[.!?])\s+(?=[\p{Lu}\d])/u)
      .map((sentence, sentenceIndex) => {
        const clean = sentence.replace(/\s+/g, " ").trim();
        const normalized = normalize(clean);
        const termHits = queryTerms.filter((term) => normalized.includes(term)).length;
        const score = termHits * 10 - sourceIndex - sentenceIndex / 100;
        return { clean, score, reference: source.reference };
      })
      .filter(({ clean }) => clean.length >= 35 && clean.length <= 420);
  });

  ranked.sort((left, right) => right.score - left.score);
  const selected: typeof ranked = [];
  let characterCount = 0;
  for (const candidate of ranked) {
    if (selected.some(({ clean }) => normalize(clean) === normalize(candidate.clean))) continue;
    if (characterCount + candidate.clean.length > 560) continue;
    selected.push(candidate);
    characterCount += candidate.clean.length;
    if (selected.length === 3) break;
  }
  return selected;
}

export function buildEmergencyVitaReply(chatCtx: llm.ChatContext) {
  const language = languageFromContext(chatCtx);
  const copy = LANGUAGE_COPY[language];
  const sources = parseSourceBlocks(knowledgeDirective(chatCtx));
  const sentences = relevantSentences(lastUserText(chatCtx), sources);
  if (!sentences.length) return copy.unavailable;

  const references = [...new Set(sentences.map(({ reference }) => reference))].slice(0, 2).join("; ");
  const response = `${copy.evidence} ${sentences.map(({ clean }) => clean).join(" ")} ${copy.source} ${references}.`;
  return response.slice(0, MAX_FALLBACK_CHARACTERS).trim();
}

class EmergencyVitaLLMStream extends llm.LLMStream {
  protected async run() {
    const content = buildEmergencyVitaReply(this.chatCtx);
    this.queue.put({
      id: `vita-emergency-${randomUUID()}`,
      delta: { role: "assistant", content }
    });
  }
}

export class EmergencyVitaLLM extends llm.LLM {
  label() {
    return "aeternum-vita-emergency-rag";
  }

  get model() {
    return "private-library-extractive-fallback";
  }

  get provider() {
    return "aeternum-vita";
  }

  chat({
    chatCtx,
    toolCtx,
    connOptions = DEFAULT_API_CONNECT_OPTIONS
  }: {
    chatCtx: llm.ChatContext;
    toolCtx?: llm.ToolContextLike;
    connOptions?: APIConnectOptions;
    parallelToolCalls?: boolean;
    toolChoice?: llm.ToolChoice;
    extraKwargs?: Record<string, unknown>;
  }) {
    return new EmergencyVitaLLMStream(this, { chatCtx, toolCtx, connOptions });
  }
}
