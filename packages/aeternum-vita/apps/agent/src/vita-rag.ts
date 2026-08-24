import type { TutorId } from "./agent.ts";
import { searchLocalAnatomy } from "./anatomical-knowledge.ts";
import type { VoiceRuntimeConfig } from "./runtime-config.ts";

export interface KnowledgeSource {
  title: string;
  page?: number;
  reference?: string;
}

export interface KnowledgeResult {
  context: string;
  sources: KnowledgeSource[];
}

const MAX_CONTEXT_CHARACTERS = 24_000;
let knowledgeCache = new Map<string, { result: KnowledgeResult; timestamp: number }>();
const CACHE_TTL_MS = 60_000 * 15; // 15 minutos

export const clearKnowledgeCache = (): void => {
  knowledgeCache.clear();
};

const isSource = (value: unknown): value is KnowledgeSource => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const source = value as Record<string, unknown>;
  return (
    typeof source.title === "string" &&
    (source.page === undefined || typeof source.page === "number") &&
    (source.reference === undefined || typeof source.reference === "string")
  );
};

export const queryVitaKnowledge = async (
  query: string,
  tutorId: TutorId,
  language: string,
  runtime: VoiceRuntimeConfig,
  fetchImplementation: typeof fetch = fetch,
): Promise<KnowledgeResult | null> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return null;
  }

  const cacheKey = `${language}:${tutorId}:${trimmed.toLowerCase()}`;
  const cached = knowledgeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  // 1. Se houver RAG_URL remota, tenta buscar primeiro
  if (runtime.ragUrl) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), runtime.ragTimeoutMs);

    try {
      const response = await fetchImplementation(runtime.ragUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(runtime.ragApiKey
            ? { Authorization: `Bearer ${runtime.ragApiKey}` }
            : {}),
        },
        body: JSON.stringify({
          query: trimmed,
          tutorId,
          language,
          limit: 8,
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        const payload = (await response.json()) as Record<string, unknown>;
        if (typeof payload.context === "string" && payload.context.trim()) {
          const result: KnowledgeResult = {
            context: payload.context.trim().slice(0, MAX_CONTEXT_CHARACTERS),
            sources: Array.isArray(payload.sources)
              ? payload.sources.filter(isSource).slice(0, 12)
              : [],
          };
          knowledgeCache.set(cacheKey, { result, timestamp: Date.now() });
          return result;
        }
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`Consulta ao RAG HTTP indisponível (${reason}), acionando base local de contingência.`);
    } finally {
      clearTimeout(timeout);
    }
  }

  // 2. Base anatômica local de alta precisão (Zero atraso / 100% offline)
  const langKey = (["pt", "es", "en", "de"].includes(language) ? language : "pt") as "pt" | "es" | "en" | "de";
  const localMatch = searchLocalAnatomy(trimmed, langKey);
  if (localMatch) {
    const result: KnowledgeResult = {
      context: localMatch.context.slice(0, MAX_CONTEXT_CHARACTERS),
      sources: localMatch.sources,
    };
    knowledgeCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  }

  return null;
};

export const formatKnowledgeContext = (result: KnowledgeResult): string => {
  const sources = result.sources
    .map((source) => {
      const page = source.page === undefined ? "" : `, página ${source.page}`;
      const reference = source.reference
        ? `, referência ${source.reference}`
        : "";
      return `${source.title}${page}${reference}`;
    })
    .join("; ");

  return [
    "CONTEXTO BIBLIOGRÁFICO TEMPORÁRIO DA AETERNUM VITA:",
    result.context,
    sources ? `FONTES RECUPERADAS: ${sources}` : "",
    "Use este contexto apenas para responder ao turno atual. Não invente fonte, página ou detalhe ausente.",
  ]
    .filter(Boolean)
    .join("\n");
};
