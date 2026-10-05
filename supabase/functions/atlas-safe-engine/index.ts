/**
 * AETERNUM ATLAS — ATLAS SAFE ENGINE (DENO EDGE RUNTIME)
 * Edge Function: atlas-safe-engine
 * Phase: AETERNUM-ATLAS-AI-CLOUD-R2.1
 * Security Mode: STAGING SECURITY HARDENED
 *
 * Deterministic sovereign anatomical teaching runtime for Supabase Edge Functions.
 * Consumes Canonical Memory 0.2.2 via static cloud bundle.
 * Cryptographically verifies authenticated user JWT against GoTrue Auth.
 * Enforces distributed user-aware rate limiting via consume_ai_rate_limit RPC.
 * Enforces strict CORS origin allowlist (no wildcard * for authenticated traffic).
 * Strictly rejects public anon/publishable key masquerading as user token.
 * Zero external LLMs. Zero localhost dependencies. Zero native binaries.
 *
 * Request Contract:
 * POST /functions/v1/atlas-safe-engine
 * Headers:
 *   Authorization: Bearer <authenticated_user_jwt>
 *   apikey: <supabase_anon_key>
 *   Content-Type: application/json
 * Body:
 *   { "query": string, "language"?: "pt", "depth"?: "DIRECT" | "CONTEXTUAL" | "PROFESSOR" }
 */

import { createClient } from "@supabase/supabase-js";
import { safeEngine, SAFE_ENGINE_VERSION, CANONICAL_MEMORY_VERSION } from "./core/safeEngine.ts";

declare const Deno: any;

// 1. Strict CORS Allowlist
const ALLOWED_ORIGINS = [
  "https://aeternum-atlas.vercel.app",
  "https://aeternumatlas.com",
  "https://www.aeternumatlas.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000"
];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Match staging and branch preview deployments on Vercel
  if (/^https:\/\/aeternum-atlas-[a-z0-9]+-aeternum-atlas\.vercel\.app$/.test(origin)) return true;
  if (/^https:\/\/aeternum-atlas-[a-z0-9]+\.vercel\.app$/.test(origin)) return true;
  return false;
}

function getCorsHeaders(origin: string | null) {
  const allowed = isOriginAllowed(origin);
  return {
    "Access-Control-Allow-Origin": allowed && origin ? origin : "",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8"
  };
}

function jsonResponse(body: Record<string, unknown>, status = 200, corsHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders
    }
  });
}

// 2. In-Memory Burst IP Rate Limiting Guard
interface IpBucket {
  count: number;
  resetAt: number;
}
const ipBuckets = new Map<string, IpBucket>();
const IP_WINDOW_MS = 60000;
const IP_BURST_MAX = 120;

function checkIpBurstRate(ip: string): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    ipBuckets.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
    return true;
  }
  if (bucket.count >= IP_BURST_MAX) {
    return false;
  }
  bucket.count++;
  return true;
}

Deno.serve(async (req: Request) => {
  const tStart = globalThis.performance.now();
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // A. CORS Preflight Handling
  if (req.method === "OPTIONS") {
    if (origin && !isOriginAllowed(origin)) {
      return new Response("CORS origin not allowed", { status: 403 });
    }
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  // B. HTTP Method Guard (Strictly Read-Only POST)
  if (req.method !== "POST") {
    return jsonResponse({
      status: "ERROR_SAFE_CLOSED",
      answer: "Método HTTP não permitido. O Atlas Safe Engine é estritamente de consulta (POST).",
      knowledge_state: "NO_CANONICAL_EVIDENCE",
      confidence: 0.0,
      matched_entities: [],
      facts_used: [],
      provenance: [],
      engine_version: SAFE_ENGINE_VERSION,
      memory_version: CANONICAL_MEMORY_VERSION,
      latencies_ms: { total_request_ms: 0 }
    }, 405, corsHeaders);
  }

  // C. CORS Origin Validation for POST Requests
  if (origin && !isOriginAllowed(origin)) {
    return jsonResponse({
      status: "ERROR_SAFE_CLOSED",
      answer: "Origem não autorizada por política estrita de CORS.",
      knowledge_state: "NO_CANONICAL_EVIDENCE",
      confidence: 0.0,
      matched_entities: [],
      facts_used: [],
      provenance: [],
      engine_version: SAFE_ENGINE_VERSION,
      memory_version: CANONICAL_MEMORY_VERSION,
      latencies_ms: { total_request_ms: 0 }
    }, 403);
  }

  // D. IP Burst Protection Guard
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  if (!checkIpBurstRate(clientIp)) {
    return jsonResponse({
      status: "ERROR_SAFE_CLOSED",
      answer: "Limite de conexões temporárias por IP excedido. Aguarde um minuto.",
      knowledge_state: "NO_CANONICAL_EVIDENCE",
      confidence: 0.0,
      matched_entities: [],
      facts_used: [],
      provenance: [],
      engine_version: SAFE_ENGINE_VERSION,
      memory_version: CANONICAL_MEMORY_VERSION,
      latencies_ms: { total_request_ms: parseFloat((globalThis.performance.now() - tStart).toFixed(3)) }
    }, 429, { ...corsHeaders, "Retry-After": "60" });
  }

  try {
    // E. Cryptographic JWT Authentication & User Context
    const authHeader = req.headers.get("Authorization") || "";
    const apiKey = req.headers.get("apikey") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse({
        status: "ERROR_SAFE_CLOSED",
        answer: "Sessão não autenticada. É obrigatório fornecer o cabeçalho Authorization com Bearer token.",
        knowledge_state: "NO_CANONICAL_EVIDENCE",
        confidence: 0.0,
        matched_entities: [],
        facts_used: [],
        provenance: [],
        engine_version: SAFE_ENGINE_VERSION,
        memory_version: CANONICAL_MEMORY_VERSION,
        latencies_ms: { total_request_ms: parseFloat((globalThis.performance.now() - tStart).toFixed(3)) }
      }, 401, corsHeaders);
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return jsonResponse({
        status: "ERROR_SAFE_CLOSED",
        answer: "Token de autenticação ausente ou em formato inválido.",
        knowledge_state: "NO_CANONICAL_EVIDENCE",
        confidence: 0.0,
        matched_entities: [],
        facts_used: [],
        provenance: [],
        engine_version: SAFE_ENGINE_VERSION,
        memory_version: CANONICAL_MEMORY_VERSION,
        latencies_ms: { total_request_ms: parseFloat((globalThis.performance.now() - tStart).toFixed(3)) }
      }, 401, corsHeaders);
    }

    // Explicit rejection: Anon/Publishable key used as Bearer token
    if (token === apiKey || token === supabaseAnonKey || token.startsWith("sb_publishable_")) {
      return jsonResponse({
        status: "ERROR_SAFE_CLOSED",
        answer: "Acesso não autorizado. A chave pública (anon/publishable key) não constitui autenticação de usuário.",
        knowledge_state: "NO_CANONICAL_EVIDENCE",
        confidence: 0.0,
        matched_entities: [],
        facts_used: [],
        provenance: [],
        engine_version: SAFE_ENGINE_VERSION,
        memory_version: CANONICAL_MEMORY_VERSION,
        latencies_ms: { total_request_ms: parseFloat((globalThis.performance.now() - tStart).toFixed(3)) }
      }, 401, corsHeaders);
    }

    let userId = "";
    let userRole = "student";
    let institutionId = "default";
    let isServiceRole = false;

    // Check if internal service role key for automated pipelines
    if (serviceRoleKey && token === serviceRoleKey) {
      isServiceRole = true;
      userId = "service_role";
      userRole = "service_role";
    } else {
      // Cryptographic user validation against Supabase GoTrue Auth
      if (!supabaseUrl || !supabaseAnonKey) {
        return jsonResponse({
          status: "ERROR_SAFE_CLOSED",
          answer: "Configuração interna do serviço de autenticação indisponível.",
          knowledge_state: "NO_CANONICAL_EVIDENCE",
          confidence: 0.0,
          matched_entities: [],
          facts_used: [],
          provenance: [],
          engine_version: SAFE_ENGINE_VERSION,
          memory_version: CANONICAL_MEMORY_VERSION,
          latencies_ms: { total_request_ms: parseFloat((globalThis.performance.now() - tStart).toFixed(3)) }
        }, 500, corsHeaders);
      }

      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false }
      });

      const { data: authData, error: authError } = await userClient.auth.getUser(token);

      if (authError || !authData?.user?.id) {
        return jsonResponse({
          status: "ERROR_SAFE_CLOSED",
          answer: "Sessão inválida ou expirada. É obrigatório um token JWT de usuário autenticado.",
          knowledge_state: "NO_CANONICAL_EVIDENCE",
          confidence: 0.0,
          matched_entities: [],
          facts_used: [],
          provenance: [],
          engine_version: SAFE_ENGINE_VERSION,
          memory_version: CANONICAL_MEMORY_VERSION,
          latencies_ms: { total_request_ms: parseFloat((globalThis.performance.now() - tStart).toFixed(3)) }
        }, 401, corsHeaders);
      }

      const user = authData.user;

      if (user.role !== "authenticated") {
        return jsonResponse({
          status: "ERROR_SAFE_CLOSED",
          answer: "Acesso não autorizado. Papel de usuário inválido.",
          knowledge_state: "NO_CANONICAL_EVIDENCE",
          confidence: 0.0,
          matched_entities: [],
          facts_used: [],
          provenance: [],
          engine_version: SAFE_ENGINE_VERSION,
          memory_version: CANONICAL_MEMORY_VERSION,
          latencies_ms: { total_request_ms: parseFloat((globalThis.performance.now() - tStart).toFixed(3)) }
        }, 401, corsHeaders);
      }

      // Check account suspension / ban status
      if (user.banned_until && new Date(user.banned_until) > new Date()) {
        return jsonResponse({
          status: "ERROR_SAFE_CLOSED",
          answer: "Conta de usuário suspensa ou bloqueada.",
          knowledge_state: "NO_CANONICAL_EVIDENCE",
          confidence: 0.0,
          matched_entities: [],
          facts_used: [],
          provenance: [],
          engine_version: SAFE_ENGINE_VERSION,
          memory_version: CANONICAL_MEMORY_VERSION,
          latencies_ms: { total_request_ms: parseFloat((globalThis.performance.now() - tStart).toFixed(3)) }
        }, 403, corsHeaders);
      }

      userId = user.id;

      // Verify User Profile & Tenant Governance in public.users
      const adminClient = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      const { data: profile } = await adminClient
        .from("users")
        .select("id, institution_id, role, status, name")
        .eq("id", userId)
        .maybeSingle();

      if (profile) {
        if (profile.status && !["active", "ativo"].includes(String(profile.status).toLowerCase())) {
          return jsonResponse({
            status: "ERROR_SAFE_CLOSED",
            answer: "Perfil de usuário inativo ou não autorizado.",
            knowledge_state: "NO_CANONICAL_EVIDENCE",
            confidence: 0.0,
            matched_entities: [],
            facts_used: [],
            provenance: [],
            engine_version: SAFE_ENGINE_VERSION,
            memory_version: CANONICAL_MEMORY_VERSION,
            latencies_ms: { total_request_ms: parseFloat((globalThis.performance.now() - tStart).toFixed(3)) }
          }, 403, corsHeaders);
        }
        userRole = profile.role || "student";
        institutionId = profile.institution_id || "aeternum_direct";
      }

      // Distributed Persistent Rate Limiting via consume_ai_rate_limit RPC
      try {
        const { data: limitData, error: limitError } = await userClient.rpc("consume_ai_rate_limit", {
          max_requests: 60,
          window_seconds: 60
        });
        if (!limitError && limitData) {
          const limit = Array.isArray(limitData) ? limitData[0] : limitData;
          if (limit && limit.allowed === false) {
            const retryAfter = Number(limit.retry_after_seconds || 30);
            return jsonResponse({
              status: "ERROR_SAFE_CLOSED",
              answer: "Limite de consultas excedido. Aguarde um momento antes de nova consulta.",
              knowledge_state: "NO_CANONICAL_EVIDENCE",
              confidence: 0.0,
              matched_entities: [],
              facts_used: [],
              provenance: [],
              engine_version: SAFE_ENGINE_VERSION,
              memory_version: CANONICAL_MEMORY_VERSION,
              latencies_ms: { total_request_ms: parseFloat((globalThis.performance.now() - tStart).toFixed(3)) }
            }, 429, { ...corsHeaders, "Retry-After": String(retryAfter) });
          }
        }
      } catch {
        // Fallback to IP bucket guard already applied
      }
    }

    // F. Payload Parsing & Sanitization
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return jsonResponse({
        status: "ERROR_SAFE_CLOSED",
        answer: "Corpo da requisição inválido. Envie um JSON com o campo 'query'.",
        knowledge_state: "NO_CANONICAL_EVIDENCE",
        confidence: 0.0,
        matched_entities: [],
        facts_used: [],
        provenance: [],
        engine_version: SAFE_ENGINE_VERSION,
        memory_version: CANONICAL_MEMORY_VERSION,
        latencies_ms: { total_request_ms: parseFloat((globalThis.performance.now() - tStart).toFixed(3)) }
      }, 400, corsHeaders);
    }

    const query = typeof body.query === "string" ? body.query.trim() : "";
    const depth = (body.depth === "CONTEXTUAL" || body.depth === "PROFESSOR") ? body.depth : "DIRECT";
    const language = body.language || "pt";

    if (!query) {
      return jsonResponse({
        status: "ENTITY_NOT_RESOLVED",
        answer: "Consulta vazia. Por favor, forneça uma pergunta anatômica.",
        knowledge_state: "NO_CANONICAL_EVIDENCE",
        confidence: 0.0,
        matched_entities: [],
        facts_used: [],
        provenance: [],
        engine_version: SAFE_ENGINE_VERSION,
        memory_version: CANONICAL_MEMORY_VERSION,
        latencies_ms: { total_request_ms: parseFloat((globalThis.performance.now() - tStart).toFixed(3)) }
      }, 200, corsHeaders);
    }

    // G. Safe Engine Execution (100% In-Memory Deterministic)
    const result = safeEngine.query(query, {
      depth,
      language
    });

    const totalReqMs = globalThis.performance.now() - tStart;

    // H. Response Envelope (Strictly Read-Only, No Secret Leakage)
    return jsonResponse({
      status: result.status,
      answer: result.answer,
      knowledge_state: result.knowledge_state,
      confidence: result.confidence,
      matched_entities: result.matched_entities,
      facts_used: result.facts_used,
      provenance: result.provenance,
      engine_version: result.engine_version,
      memory_version: result.memory_version,
      latencies_ms: {
        ...result.latencies_ms,
        total_request_ms: parseFloat(totalReqMs.toFixed(3))
      },
      audit: {
        user_id: userId,
        institution_id: institutionId,
        user_role: userRole,
        is_service_role: isServiceRole,
        external_llm_calls: 0
      }
    }, 200, corsHeaders);

  } catch (error: any) {
    const totalReqMs = globalThis.performance.now() - tStart;
    return jsonResponse({
      status: "ERROR_SAFE_CLOSED",
      answer: "Ocorreu um erro interno de proteção determinística. A consulta foi encerrada de forma segura.",
      knowledge_state: "NO_CANONICAL_EVIDENCE",
      confidence: 0.0,
      matched_entities: [],
      facts_used: [],
      provenance: [],
      engine_version: SAFE_ENGINE_VERSION,
      memory_version: CANONICAL_MEMORY_VERSION,
      error_detail: error?.message || String(error),
      latencies_ms: { total_request_ms: parseFloat(totalReqMs.toFixed(3)) }
    }, 500, corsHeaders);
  }
});
