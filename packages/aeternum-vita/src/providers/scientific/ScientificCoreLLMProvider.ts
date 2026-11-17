/**
 * Aeternum Scientific Core R1.7-A2I LLM Provider
 * 
 * Implements the LLMProvider interface for the Aeternum AI Gateway,
 * routing textual queries through the certified Closed-World Medical Anatomy Core.
 * 
 * Features:
 * 1. Resolves anatomical entities via IFAA canonical dictionary.
 * 2. Retrieves certified facts from r1_7_a2i_qualified_authority_registry.json (231 facts).
 * 3. Enforces CLOSED_WORLD_EMPTY_PACKET_GATE (deterministic zero-hallucination abstention).
 * 4. Synthesizes medical explanations grounded solely in canonical evidence via Qwen 3.5:4b.
 * 5. Validates claims via Output Release Gate (rejects ENG_AR_024 contradictions, etc.).
 * 6. Preserves non-anatomical conversational greetings in character.
 * 7. Emits progressive SSE streaming chunks for the Atlas AI Tutor frontend.
 */

import { LLMProvider } from "../contracts/LLMProvider.ts";
import {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  ProviderMetadata,
  HealthResult,
  ProviderExecutionContext
} from "../types/index.ts";
import {
  processVoiceQueryThroughScientificCore,
  resolveEntityFromText,
  registryStore
} from "../../../apps/agent/src/r1_7_a2i_voice_adapter.ts";

export interface ScientificCoreProviderConfig {
  ollamaBaseUrl?: string;
  targetModel?: string;
  defaultLanguage?: "pt" | "es" | "en" | "de";
}

function detectQueryLanguage(text: string): "pt" | "es" | "en" | "de" {
  const norm = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // German distinctive patterns
  if (/\b(?:was|welcher|welche|welches|wo|wie|warum|erzahl|erzaehl|uber|schulterblatt|musculus|ansatz|ursprung|knochen|gelenk|schulter|ist|hallo|guten)\b/.test(norm)) return "de";
  
  // English distinctive patterns
  if (/\b(?:what|which|where|how|why|tell me|explain|bone|muscle|joint|scapula|clavicle|humerus|insertion|origin|fossa|hello|hi)\b/.test(norm)) return "en";
  
  // Spanish distinctive patterns
  if (/\b(?:hablame|cuentame|cual|cuales|donde|como|por que|insercion|masetero|hueso|articulacion|hombro|hola|buenos)\b/.test(norm)) return "es";
  
  return "pt";
}

function getTutorForLanguage(lang: "pt" | "es" | "en" | "de"): "marina" | "antonia" | "ariana" | "fabian" {
  switch (lang) {
    case "es": return "antonia";
    case "en": return "ariana";
    case "de": return "fabian";
    case "pt":
    default: return "marina";
  }
}

function isPureGreeting(text: string): boolean {
  const norm = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .trim();
  const words = norm.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 4) return false;
  return /^(?:ola|oi|bom dia|boa tarde|boa noite|hola|buenos dias|buenas tardes|hello|hi|hey|good morning|hallo|guten tag|guten morgen)$/.test(
    norm
  );
}

function getNonAnatomicalGreeting(lang: "pt" | "es" | "en" | "de"): string {
  switch (lang) {
    case "es":
      return "¡Hola! Soy el Atlas AI Tutor, tu mentor en anatomía humana de Aeternum Atlas. Estoy aquí para ayudarte a explorar estructuras anatômicas en 3D, resolver dudas académicas y guiar tu aprendizaje con base en fuentes científicas canónicas. ¿En qué puedo ayudarte hoy?";
    case "en":
      return "Hello! I am the Atlas AI Tutor, your human anatomy mentor at Aeternum Atlas. I am here to help you explore 3D anatomical structures, answer academic questions grounded in canonical evidence, and support your studies. How can I assist you today?";
    case "de":
      return "Hallo! Ich bin der Atlas AI Tutor, dein Mentor für menschliche Anatomie bei Aeternum Atlas. Ich bin hier, um dich beim Erkunden von 3D-Strukturen zu unterstützen und anatomische Fragen auf Basis zertifizierter kanonischer Quellen zu beantworten. Wie kann ich dir heute helfen?";
    case "pt":
    default:
      return "Olá! Eu sou o Atlas AI Tutor, seu mentor em anatomia humana do Aeternum Atlas. Estou aqui para guiar seus estudos, tirar dúvidas anatômicas fundamentadas estritamente em fontes canônicas e auxiliar na navegação das estruturas em 3D. Em que posso te ajudar hoje?";
  }
}

export class ScientificCoreLLMProvider implements LLMProvider {
  public readonly metadata: ProviderMetadata;
  private readonly ollamaBaseUrl: string;
  private readonly targetModel: string;
  private readonly defaultLanguage: "pt" | "es" | "en" | "de";

  constructor(config: ScientificCoreProviderConfig = {}) {
    this.ollamaBaseUrl = config.ollamaBaseUrl || "http://127.0.0.1:11434";
    this.targetModel = config.targetModel || "qwen3.5:4b";
    this.defaultLanguage = config.defaultLanguage || "pt";

    this.metadata = {
      id: "aeternum-scientific-core-r1-7-a2i",
      name: "Aeternum Scientific Core R1.7-A2I Provider",
      type: "LLM",
      location: "LOCAL",
      version: "1.7.0",
      description: "Certified Closed-World Medical Anatomy Core with strict evidence gating and claim verification"
    };

    // Ensure registry is initialized
    try {
      registryStore.init();
    } catch (err) {
      console.warn("[ScientificCoreLLMProvider] Registry init deferred:", err);
    }
  }

  async health(context?: ProviderExecutionContext): Promise<HealthResult> {
    const start = performance.now();
    try {
      registryStore.init();
      const factsCount = registryStore.facts.size;
      const res = await fetch(`${this.ollamaBaseUrl}/api/version`, {
        signal: context?.signal || AbortSignal.timeout(3000)
      });
      const data = await res.json();
      const latencyMs = Math.round(performance.now() - start);

      if (factsCount < 200 || !res.ok) {
        return {
          providerId: this.metadata.id,
          status: "DEGRADED",
          latencyMs,
          timestamp: new Date().toISOString(),
          details: { factsCount, ollamaVersion: data?.version }
        };
      }

      return {
        providerId: this.metadata.id,
        status: "HEALTHY",
        latencyMs,
        timestamp: new Date().toISOString(),
        details: { factsCount, ollamaVersion: data?.version, targetModel: this.targetModel }
      };
    } catch (err: any) {
      return {
        providerId: this.metadata.id,
        status: "UNAVAILABLE",
        latencyMs: Math.round(performance.now() - start),
        timestamp: new Date().toISOString(),
        details: { error: err.message }
      };
    }
  }

  private async processText(request: LLMRequest, context?: ProviderExecutionContext): Promise<string> {
    // 1. Extract user query from messages
    const userMessages = (request.messages || []).filter((m) => m.role === "user");
    const lastUserMsg = userMessages.at(-1)?.content?.trim() || "";
    if (!lastUserMsg) {
      return "Como posso ajudar em seus estudos de anatomia hoje?";
    }

    // 2. Extract context metadata
    const meta = (request.metadata || {}) as Record<string, any>;
    const contextMeta = (meta.context || {}) as Record<string, any>;
    const detectedLang = detectQueryLanguage(lastUserMsg);
    const lang = (contextMeta.language as any) || detectedLang || this.defaultLanguage;
    const tutorId = (contextMeta.persona as any) || (contextMeta.tutorId as any) || getTutorForLanguage(lang);

    // 3. Handle pure conversational greetings; all anatomical and out-of-domain queries go to Rust TutorEngine Evidence Gate
    if (isPureGreeting(lastUserMsg)) {
      return getNonAnatomicalGreeting(lang);
    }

    // 4. Build conversational history for context
    const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
    const recentMessages = (request.messages || []).slice(-6, -1);
    for (const m of recentMessages) {
      if (m.role === "user" || m.role === "assistant") {
        conversationHistory.push({ role: m.role, content: m.content });
      }
    }

    // 5. Extract 3D viewport context if available
    let context3d = undefined;
    if (contextMeta.selectedStructureId || contextMeta.activeStructure?.id) {
      context3d = {
        modelId: contextMeta.modelSlug || contextMeta.model?.slug || "atlas_model",
        selectedStructureId: contextMeta.selectedStructureId || contextMeta.activeStructure?.id
      };
    }

    // 6. Execute through Unified Brain Contract v2.0.0 / R1.7-A2I Scientific Core
    const channelMode = (contextMeta.channel === "voice" || meta.channel === "voice" || contextMeta.persona || contextMeta.tutorId)
      ? "voice"
      : "text";
    const result = await processVoiceQueryThroughScientificCore(lastUserMsg, {
      tutorId,
      language: lang,
      pedagogicalMode: contextMeta.pedagogicalMode || meta.pedagogicalMode || "Direct",
      sessionId: contextMeta.sessionId || meta.sessionId,
      context3d,
      targetModel: this.targetModel,
      ollamaBaseUrl: this.ollamaBaseUrl,
      conversationHistory,
      signal: context?.signal,
      mode: channelMode
    });

    return result.text;
  }

  async generate(request: LLMRequest, context?: ProviderExecutionContext): Promise<LLMResponse> {
    const start = performance.now();
    const text = await this.processText(request, context);
    const latencyMs = Math.round(performance.now() - start);

    return {
      text,
      providerId: this.metadata.id,
      modelId: `r1.7-a2i:${this.targetModel}`,
      finishReason: "stop",
      latency: { totalMs: latencyMs }
    };
  }

  async *stream(request: LLMRequest, context?: ProviderExecutionContext): AsyncIterable<LLMStreamChunk> {
    const fullText = await this.processText(request, context);

    // Yield progressive token deltas with natural cadence
    // Splitting by words while preserving whitespace
    const tokens = fullText.split(/(\s+)/);
    let chunkBuffer = "";

    for (const token of tokens) {
      if (context?.signal?.aborted) break;

      chunkBuffer += token;
      // Emit every 15-25 characters or at sentence end
      if (chunkBuffer.length >= 18 || token.includes("\n") || token.includes(".") || token.includes(";")) {
        yield { deltaText: chunkBuffer, isComplete: false };
        chunkBuffer = "";
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
    }

    if (chunkBuffer.length > 0) {
      yield { deltaText: chunkBuffer, isComplete: false };
    }

    yield { deltaText: "", isComplete: true, finishReason: "stop" };
  }
}
