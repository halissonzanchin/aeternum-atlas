import { createClient } from "npm:@supabase/supabase-js@2.105.4";

const PRIMARY_MODEL = (Deno.env.get("VITA_GEMINI_MODEL") || "gemini-3.7-flash").trim();
const FALLBACK_MODELS = (Deno.env.get("VITA_GEMINI_FALLBACK_MODELS") || "gemini-2.5-flash,gemini-2.5-pro")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

const ACTIVE_GEMINI_MODELS = [...new Set([PRIMARY_MODEL, ...FALLBACK_MODELS])];

const MAX_REQUEST_BYTES = 64_000;
const MAX_PROMPT_CHARACTERS = 4_000;
const MAX_CONTEXT_CHARACTERS = 12_000;
const MAX_HISTORY_MESSAGES = 24;

const LOCAL_ANATOMY_FALLBACKS: Record<string, { title: string; text: string; sources: string }> = {
  clavicula: {
    title: "Clavícula e Cíngulo Peitoral",
    text: "A clavícula é um osso longo e recurvado em dupla curvatura (em forma de S) que atua como suporte rígido conectando o membro superior ao esqueleto axial. Proximalmente, sua extremidade esternal articula-se com o manúbrio do esterno na articulação esternoclavicular; distalmente, sua extremidade acromial articula-se com o acrômio da escápula na articulação acromioclavicular. Sua face inferior apresenta acidentes anatômicos cruciais: a impressão do ligamento costoclavicular, o sulco do músculo subclávio, o tubérculo conoide e a linha trapezoide (onde se insere o potente ligamento coracoclavicular). Serve de fixação para os músculos peitoral maior, deltoide, trapézio, esternocleidomastóideo e subclávio. Na prática clínica, é um dos ossos mais comumente fraturados no corpo humano, especialmente na transição entre o terço médio e o terço lateral, exigindo atenção às estruturas neurovasculares subjacentes (plexo braquial e vasos subclávios).",
    sources: "Moore — Anatomia Orientada para a Clínica, 8ª Ed., p. 672; Netter — Atlas de Anatomia Humana, 7ª Ed., prancha 407."
  },
  escapula: {
    title: "Escápula e Cíngulo do Membro Superior",
    text: "A escápula é um osso plano e triangular situado na face posterolateral do tórax, sobrepondo-se da 2ª à 7ª costelas. Seus principais acidentes ósseos são a espinha da escápula (que culmina no acrômio lateralmente), o processo coracoide, a cavidade glenoide e as fossas subescapular, supraespinhal e infraespinhal. Articula-se com a clavícula (articulação acromioclavicular) e com a cabeça do úmero (articulação glenoumeral). É a base de fixação dos quatro músculos do manguito rotador (supraespinhal, infraespinhal, redondo menor e subescapular), além do trapézio, deltoide, serrátil anterior e levantador da escápula. Clinicamente, lesões do nervo torácico longo geram a clássica 'escápula alada' por desnervação do serrátil anterior.",
    sources: "Moore — Anatomia Orientada para a Clínica, 8ª Ed., p. 674; Sobotta — Atlas de Anatomia Humana, 24ª Ed., p. 182."
  },
  femur: {
    title: "Fêmur e Articulação Coxofemoral",
    text: "O fêmur é o osso mais longo, pesado e resistente do corpo humano, constituindo o esqueleto da coxa. Proximalmente apresenta a cabeça femoral (com a fóvea do ligamento da cabeça), colo anatômico, trocânter maior, trocânter menor e a linha intertrocantérica. A diáfise possui uma crista longitudinal posterior proeminente, a linha áspera, local de inserção de múltiplos músculos adutores e extensores. Distalmente, expande-se nos côndilos medial e lateral e na tróclea patelar. Articula-se no acetábulo do osso do quadril (articulação esferóidea coxofemoral) e distalmente com a tíbia e patela no joelho. Na clínica ortopédica e geriátrica, fraturas do colo femoral comprometem os ramos retinaculares da artéria circunflexa femoral medial, com alto risco de necrose avascular da cabeça.",
    sources: "Moore — Anatomia Orientada para a Clínica, 8ª Ed., p. 512; Netter — Atlas de Anatomia Humana, 7ª Ed., prancha 476."
  },
  tibia: {
    title: "Tíbia, Fíbula e Esqueleto da Perna",
    text: "O esqueleto da perna é constituído pela tíbia (medial, robusta e responsável por toda a transmissão de carga do peso corporal) e pela fíbula (lateral, delgada e não suporta carga direta). Proximalmente, a tíbia apresenta o platô tibial com côndilos medial e lateral e a tuberosidade da tíbia (onde se fixa o ligamento patelar). Distalmente, a tíbia forma o maléolo medial e a fíbula o maléolo lateral, constituindo a pinça maleolar da articulação talocrural (tornozelo). Fraturas da diáfise tibial são frequentemente expostas devido à sua borda anterior subcutânea ('canela'), com risco de síndrome compartimental.",
    sources: "Moore — Anatomia Orientada para a Clínica, 8ª Ed., p. 560; Netter — Atlas de Anatomia Humana, 7ª Ed., prancha 508."
  },
  quadriceps: {
    title: "Músculos da Coxa e Quadríceps Femoral",
    text: "O Músculo Quadríceps Femoral é o potente extensor da perna no compartimento anterior da coxa, inervado pelo nervo femoral (L2-L4). É composto por quatro ventres: Reto Femoral (que também auxilia na flexão do quadril), Vasto Lateral, Vasto Medial e Vasto Intermédio. Todos convergem no tendão quadricipital comum, que engloba a patela e continua como ligamento patelar até a tuberosidade da tíbia. No compartimento posterior situam-se os Isquiotibiais (Bíceps Femoral, Semitendíneo e Semimembranoso), inervados pelo nervo isquiático. O reflexo patelar (L2-L4) avalia clinicamente a integridade do nervo femoral e dos segmentos medulares lombares.",
    sources: "Moore — Anatomia Orientada para a Clínica, 8ª Ed., p. 575; Sobotta — Atlas de Anatomia Humana, 24ª Ed., p. 245."
  },
  triceps: {
    title: "Tríceps Sural, Tendão de Aquiles e Tarso",
    text: "O Músculo Tríceps Sural localiza-se no compartimento posterior da perna, formado pelas cabeças medial e lateral do Gastrocnêmio e pelo Músculo Sóleo profundo. Seus ventres fundem-se no robusto Tendão Calcâneo (Tendão de Aquiles), o mais espesso do corpo, que se insere no túber do calcâneo. É inervado pelo nervo tibial (S1-S2) e é o principal motor da flexão plantar na corrida e salto. O esqueleto do tarso possui 7 ossos: Tálus, Calcâneo, Navicular, Cuboide e 3 Cuneiformes. A ruptura do tendão calcâneo é confirmada clinicamente pela ausência de flexão plantar na compressão da panturrilha (Teste de Thompson positivo).",
    sources: "Moore — Anatomia Orientada para a Clínica, 8ª Ed., p. 602; Netter — Atlas de Anatomia Humana, 7ª Ed., prancha 512."
  }
};

function jsonResponse(body: Record<string, unknown>, status: number, headers: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" }
  });
}

function allowedOrigins() {
  const configured = (Deno.env.get("AETERNUM_ALLOWED_ORIGINS") || "https://aeternum-atlas.vercel.app,https://www.aeternumatlas.com,https://aeternumatlas.com")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [...new Set([
    ...configured,
    "https://aeternumatlas.com",
    "https://www.aeternumatlas.com",
    "https://aeternum-atlas.vercel.app",
    "http://localhost:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174"
  ])];
}

function isAllowedOrigin(origin: string) {
  if (!origin) return false;
  if (allowedOrigins().includes(origin)) return true;
  try {
    const url = new URL(origin);
    if (url.protocol === "https:") {
      if (url.hostname === "aeternumatlas.com" || url.hostname === "www.aeternumatlas.com" || url.hostname.endsWith(".aeternumatlas.com")) return true;
      if (url.hostname === "aeternum-atlas.vercel.app" || url.hostname.endsWith(".vercel.app")) return true;
    }
    if (url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const acceptedOrigin = isAllowedOrigin(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": acceptedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function cleanText(value: unknown, max: number) {
  return String(value || "")
    .replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, max);
}

function matchLocalFallback(prompt: string): string | null {
  const lower = prompt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [key, item] of Object.entries(LOCAL_ANATOMY_FALLBACKS)) {
    if (lower.includes(key)) {
      return item.text + "\n\nFontes recuperadas: " + item.sources;
    }
  }
  return null;
}

function systemInstruction(role: string, context: Record<string, unknown>, name = "") {
  const firstName = cleanText(name, 80).split(/\s+/)[0] || "";
  const namePersonalization = firstName
    ? " O nome do estudante é " + firstName + ". Cumprimente-o com naturalidade em momentos oportunos."
    : "";

  return "Você é o Atlas AI Tutor (Professor Eduardo) da plataforma Aeternum Atlas 26.1, o ecossistema educacional de anatomia humana.\n\n" +
    "MISSÃO PEDAGÓGICA:" + namePersonalization + "\n" +
    "- Atue como Professor Sênior de Anatomia Humana, caloroso, natural, preciso e academicamente rigoroso.\n" +
    "- Quando o estudante citar uma estrutura anatômica (ex: clavícula, escápula, fêmur, quadríceps, tíbia, etc.), NUNCA devolva apenas perguntas superficiais. Entregue imediatamente a explicação anatômica completa seguindo o Roteiro de 5 Pontos:\n" +
    "  1. Definição e sintopia (localização exata);\n" +
    "  2. Acidentes anatômicos principais;\n" +
    "  3. Articulações e conexões;\n" +
    "  4. Inserções musculares e relações neurovasculares;\n" +
    "  5. Aplicação clínica e funcional.\n" +
    "- Se o estudante pedir um simulado/quiz, formule 1 pergunta instigante por vez.\n" +
    "- Se pedir revisão rápida, sintetize em 3 frases compactas.\n" +
    "- Use tom humano, acolhedor e oralizável, usando a Terminologia Anatomica da IFAA/FCAT.";
}

interface GeminiCallResult {
  text: string;
  model: string;
  latencyMs: number;
}

async function callGemini(
  apiKey: string,
  prompt: string,
  sysPrompt: string
): Promise<{ result: GeminiCallResult | null; lastError?: string }> {
  let lastError = "";
  for (const model of ACTIVE_GEMINI_MODELS) {
    const start = performance.now();
    try {
      const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(apiKey);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sysPrompt }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && typeof text === "string" && text.trim()) {
          const latencyMs = Math.round(performance.now() - start);
          return {
            result: {
              text: text.trim(),
              model,
              latencyMs
            }
          };
        }
      } else {
        const errorBody = await res.text().catch(() => "");
        lastError = "Model " + model + " returned HTTP " + res.status + ": " + errorBody.slice(0, 100);
        console.warn("[ai-tutor] " + lastError);
      }
    } catch (err) {
      lastError = "Model " + model + " exception: " + (err as Error)?.message;
      console.warn("[ai-tutor] " + lastError);
    }
  }
  return { result: null, lastError };
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  const origin = req.headers.get("origin") || "";

  if (req.method === "OPTIONS") {
    if (origin && !cors["Access-Control-Allow-Origin"]) return jsonResponse({ error: "Origem não autorizada." }, 403, cors);
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405, cors);

  // ==========================================
  // BLINDAGEM DE SEGURANÇA P0 — ZERO GUESTS
  // ==========================================
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResponse({
      error: "Autenticação obrigatória. Usuários não autenticados não possuem permissão para interagir com o Tutor IA.",
      code: "AUTH_REQUIRED"
    }, 401, cors);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const geminiKey = (
    Deno.env.get("GEMINI_API_KEY") ||
    Deno.env.get("VITA_GEMINI_API_KEY") ||
    Deno.env.get("GOOGLE_API_KEY") ||
    ""
  ).trim();

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Configuração do servidor incompleta.", code: "SERVER_CONFIG_ERROR" }, 503, cors);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData?.user?.id) {
    return jsonResponse({ error: "Sessão inválida ou expirada.", code: "AUTH_INVALID" }, 401, cors);
  }
  const userId = authData.user.id;

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: profile, error: profileError } = await adminClient
    .from("users")
    .select("id, institution_id, role, status, name")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile || !["active", "ativo"].includes(String(profile.status).toLowerCase())) {
    return jsonResponse({ error: "Perfil não autorizado ou inativo.", code: "USER_INACTIVE" }, 403, cors);
  }

  // Rate limiting de Chat
  const { data: limitData } = await userClient.rpc("consume_ai_rate_limit", {
    max_requests: 30,
    window_seconds: 60
  });
  const limit = Array.isArray(limitData) ? limitData[0] : limitData;
  if (limit && limit.allowed === false) {
    const retryAfter = Number(limit.retry_after_seconds || 30);
    return jsonResponse({
      error: "Muitas solicitações. Aguarde um instante.",
      code: "AI_RATE_LIMITED",
      retryAfterSeconds: retryAfter
    }, 429, { ...cors, "Retry-After": String(retryAfter) });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Corpo JSON inválido." }, 400, cors);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastMessage = messages.at(-1) as Record<string, unknown> | undefined;
  const prompt = cleanText(lastMessage?.text || body.prompt, MAX_PROMPT_CHARACTERS);
  if (!prompt) return jsonResponse({ error: "Mensagem vazia." }, 400, cors);

  let conversationId = cleanText(body.conversationId, 64) || crypto.randomUUID();
  const userName = profile.name || authData.user.email?.split("@")[0] || "Estudante";

  const sysInstruction = systemInstruction("student", {}, userName);

  let actualProvider = "google-gemini";
  let actualModel = PRIMARY_MODEL;
  let fallbackUsed = false;
  let responseText = "";
  let latencyMs = 0;
  let debugError = "";

  // 1. Tenta gerar via Gemini oficial (se configurado)
  if (geminiKey) {
    const { result, lastError } = await callGemini(geminiKey, prompt, sysInstruction);
    if (result) {
      responseText = result.text;
      actualModel = result.model;
      actualProvider = "google-gemini";
      fallbackUsed = false;
      latencyMs = result.latencyMs;
    } else {
      debugError = lastError || "All active Gemini models failed";
    }
  } else {
    debugError = "GEMINI_API_KEY environment variable is not set";
  }

  // 2. Fallback na base anatômica local se Gemini não responder
  if (!responseText) {
    actualProvider = "local-fallback";
    actualModel = "vita-rag-dictionary";
    fallbackUsed = true;
    const startFallback = performance.now();
    const localMatch = matchLocalFallback(prompt);
    if (localMatch) {
      responseText = localMatch;
    } else {
      responseText = "Olá " + userName + "! Sou o Eduardo, seu tutor de anatomia na Aeternum Atlas. Sobre " + prompt + ", apresentamos a estrutura, relações ósseas, musculares e aplicação clínica com base nos tratados de Moore e Netter. Como deseja aprofundar este estudo?";
    }
    latencyMs = Math.round(performance.now() - startFallback);
  }

  const finalSanitizedText = responseText.replace(/[ACTION:[A-Z_]+\]/g, "").trim();

  // Registro factual de auditoria com garantia de foreign key em ai_conversations
  try {
    await adminClient.from("ai_conversations").upsert({
      id: conversationId,
      user_id: userId,
      institution_id: profile.institution_id,
      title: prompt.slice(0, 50),
      context: {}
    }, { onConflict: "id" });

    await adminClient.from("ai_audit_events").insert({
      user_id: userId,
      institution_id: profile.institution_id,
      conversation_id: conversationId,
      event_type: "generation_completed",
      model_name: actualModel,
      input_characters: prompt.length,
      output_characters: finalSanitizedText.length,
      success: true,
      metadata: {
        actual_provider: actualProvider,
        actual_model: actualModel,
        fallback_used: fallbackUsed,
        latency_ms: latencyMs
      }
    });
  } catch (auditErr) {
    console.error("[ai-tutor] audit event error", auditErr);
  }

  // Streaming SSE com metadados de observabilidade
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode("data: " + JSON.stringify({ conversationId, source: actualProvider, model: actualModel, fallbackUsed, latencyMs }) + "\n\n")
      );
      for (let offset = 0; offset < finalSanitizedText.length; offset += 200) {
        controller.enqueue(
          encoder.encode("data: " + JSON.stringify({ text: finalSanitizedText.slice(offset, offset + 200) }) + "\n\n")
        );
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      ...cors,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Aeternum-AI-Source": actualProvider,
      "X-Aeternum-AI-Model": actualModel,
      "X-Aeternum-AI-Fallback": String(fallbackUsed)
    }
  });
});
