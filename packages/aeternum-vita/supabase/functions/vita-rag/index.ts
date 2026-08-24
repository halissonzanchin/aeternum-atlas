import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const jsonHeaders = (request: Request) => {
  const allowedOrigin = Deno.env.get("VOICE_ALLOWED_ORIGIN") || "*";
  const requestOrigin = request.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": requestOrigin || allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
};

serve(async (request: Request) => {
  const headers = jsonHeaders(request);
  const reply = (body: Record<string, unknown>, status: number) =>
    new Response(JSON.stringify(body), { status, headers });

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  if (request.method !== "POST") {
    return reply({ error: "Metodo nao permitido." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";

    let body: { query?: string; tutorId?: string; language?: string; limit?: number } = {};
    try {
      body = await request.json();
    } catch {
      return reply({ error: "JSON invalido no corpo da requisicao." }, 400);
    }

    const query = body.query?.trim();
    if (!query || query.length < 2) {
      return reply({ error: "Termo de busca insuficiente." }, 400);
    }

    const language = body.language || "pt";
    const limit = Math.min(body.limit || 8, 12);

    if (!supabaseUrl || !supabaseKey) {
      return reply({ error: "Configuracao do Supabase ausente." }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Busca textual e correspondencia estruturada
    const { data, error } = await supabase
      .from("vita_knowledge_chunks")
      .select("book_title, page_number, section_reference, content")
      .eq("language", language)
      .ilike("content", `%${query}%`)
      .limit(limit);

    if (error) {
      console.error("Erro na busca do RAG:", error);
      return reply({ error: "Falha ao consultar base bibliografica." }, 500);
    }

    if (!data || data.length === 0) {
      return reply({ context: "", sources: [] }, 200);
    }

    const context = data.map((d: any) => d.content).join("\n\n");
    const sources = data.map((d: any) => ({
      title: d.book_title,
      page: d.page_number,
      reference: d.section_reference,
    }));

    return reply({ context, sources }, 200);
  } catch (error) {
    console.error("Erro inesperado no vita-rag:", error);
    return reply({ error: "Erro interno no servidor RAG." }, 500);
  }
});