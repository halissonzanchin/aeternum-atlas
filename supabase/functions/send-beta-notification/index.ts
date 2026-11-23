import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_RECIPIENT = "aeternumatlas@gmail.com";
const RESEND_API_URL = "https://api.resend.com/emails";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration in environment.");
    }

    // 1. AUTENTICAÇÃO ESTREITA: Apenas service_role ou chamada autorizada pode disparar o envio
    const authHeader = req.headers.get("Authorization");
    let isServiceRole = false;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "").trim();
      if (supabaseServiceKey && (token === supabaseServiceKey || authHeader.includes(supabaseServiceKey))) {
        isServiceRole = true;
      } else {
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.role === "service_role") {
              isServiceRole = true;
            }
          }
        } catch {
          // Ignore
        }
      }
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (!isServiceRole) {
      // Verificar se é admin autenticado
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userErr } = await userClient.auth.getUser();
      if (userErr || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || !["admin", "super_admin", "institution_admin"].includes(profile.role)) {
        return new Response(JSON.stringify({ error: "Forbidden: Admin access required." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 2. EXTRAÇÃO DE PAYLOAD OU CONSUMO DA FILA
    let notificationId: string | null = null;
    let applicationId: string | null = null;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        notificationId = body.notification_id || null;
        applicationId = body.application_id || null;
      } catch {
        // Sem payload, consome próximo da fila
      }
    }

    // Buscar item na fila
    let queueQuery = supabaseAdmin
      .from("beta_email_notifications")
      .select("*")
      .in("status", ["queued", "failed"])
      .lt("attempts", 5);

    if (notificationId) {
      queueQuery = queueQuery.eq("id", notificationId);
    } else if (applicationId) {
      queueQuery = queueQuery.eq("application_id", applicationId);
    }

    const { data: queueItems, error: queueErr } = await queueQuery.order("created_at", { ascending: true }).limit(1);

    if (queueErr) throw queueErr;
    if (!queueItems || queueItems.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "Nenhuma notificação pendente na fila.",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const item = queueItems[0];

    // Marcar como 'processing' e incrementar tentativa (Idempotência atômica)
    await supabaseAdmin
      .from("beta_email_notifications")
      .update({
        status: "processing",
        attempts: item.attempts + 1,
        last_attempt_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    // 3. CONSULTAR DADOS COMPLETOS DA CANDIDATURA
    const { data: appData, error: appErr } = await supabaseAdmin
      .from("beta_applications")
      .select("id, protocol_number, full_name, email, institution_name, course, academic_term, student_group, primary_device, motivation, created_at, status")
      .eq("id", item.application_id)
      .single();

    if (appErr || !appData) {
      await supabaseAdmin
        .from("beta_email_notifications")
        .update({
          status: "failed",
          error_message: `Candidatura ${item.application_id} não localizada no banco.`,
        })
        .eq("id", item.id);

      throw new Error(`Candidatura ${item.application_id} não localizada.`);
    }

    const formattedDate = new Date(appData.created_at).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "full",
      timeStyle: "medium",
    });

    const subject = `[AETERNUM ATLAS | BETA] Nova candidatura — ${appData.full_name}`;
    const adminLink = "https://www.aeternumatlas.com/super-admin/programa-beta";

    // 4. CORPO DO E-MAIL SEGUNDO DIRETRIZ 4
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1319; color: #e2e8f0; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #0f1c24; border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 16px; padding: 32px; }
    .header { border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 20px; margin-bottom: 24px; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    h1 { color: #f8fafc; font-size: 20px; margin-top: 12px; margin-bottom: 4px; font-weight: 700; }
    .protocol { font-family: monospace; font-size: 14px; background: rgba(255, 255, 255, 0.06); padding: 6px 12px; border-radius: 6px; display: inline-block; color: #38bdf8; margin-top: 6px; }
    .field-group { margin-bottom: 16px; }
    .field-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .field-value { font-size: 15px; color: #f1f5f9; font-weight: 500; }
    .motivation-box { background: rgba(255, 255, 255, 0.03); border-left: 3px solid #38bdf8; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-top: 6px; font-style: italic; color: #cbd5e1; }
    .cta-button { display: inline-block; background: #38bdf8; color: #0b1319; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 24px; }
    .footer { border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; margin-top: 32px; font-size: 12px; color: #64748b; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">Operação El Dorado · Notificação Oficial</span>
      <h1>Nova Candidatura ao Programa de Teste Beta</h1>
      <div>Protocolo: <span class="protocol">${appData.protocol_number || "PENDENTE"}</span></div>
    </div>

    <div class="field-group">
      <div class="field-label">Candidato</div>
      <div class="field-value">${appData.full_name} &lt;${appData.email}&gt;</div>
    </div>

    <div class="field-group">
      <div class="field-label">Universidade / Instituição</div>
      <div class="field-value">${appData.institution_name}</div>
    </div>

    <div class="field-group">
      <div class="field-label">Curso e Período</div>
      <div class="field-value">${appData.course} — ${appData.academic_term}${appData.student_group ? ` (${appData.student_group})` : ""}</div>
    </div>

    <div class="field-group">
      <div class="field-label">Dispositivo de Acesso</div>
      <div class="field-value">${appData.primary_device}</div>
    </div>

    <div class="field-group">
      <div class="field-label">Data e Horário do Registro</div>
      <div class="field-value">${formattedDate} (Horário de Brasília)</div>
    </div>

    <div class="field-group">
      <div class="field-label">Situação Atual</div>
      <div class="field-value" style="color: #fbbf24;">Aguardando Análise Manual do Operador</div>
    </div>

    <div class="field-group">
      <div class="field-label">Motivação Apresentada</div>
      <div class="motivation-box">${appData.motivation}</div>
    </div>

    <a href="${adminLink}" class="cta-button" target="_blank">Acessar Painel de Avaliação Administrativa</a>

    <div class="footer">
      <strong>Aviso de Confidencialidade e Governança:</strong> Este comunicado destina-se exclusivamente à equipe de coordenação da Aeternum Atlas (aeternumatlas@gmail.com). A aprovação de vagas é de responsabilidade manual exclusiva do operador. Nenhuma conta de usuário ou sessão de IA é provisionada de forma automática.
    </div>
  </div>
</body>
</html>
    `;

    const textBody = `
AETERNUM ATLAS — OPERAÇÃO EL DORADO
NOTIFICAÇÃO ADMINISTRATIVA DE CANDIDATURA BETA

Protocolo: ${appData.protocol_number || "PENDENTE"}
Data: ${formattedDate} (Horário de Brasília)
Situação: Aguardando Análise Manual do Operador

DADOS DO CANDIDATO:
- Nome Completo: ${appData.full_name}
- E-mail: ${appData.email}
- Universidade: ${appData.institution_name}
- Curso: ${appData.course}
- Período: ${appData.academic_term} ${appData.student_group ? `(${appData.student_group})` : ""}
- Dispositivo Principal: ${appData.primary_device}

MOTIVAÇÃO:
"${appData.motivation}"

Para avaliar esta candidatura, acesse o painel administrativo:
${adminLink}

Aviso: A seleção de participantes da primeira turma (meta: 30 vagas) é estritamente manual pelo operador.
    `;

    // 5. ENVIO REAL VIA RESEND (SE CONFIGURADO)
    if (!resendApiKey) {
      const errorMsg = "BLOCKED: Provedor de e-mail (Resend) não configurado. Defina a secret RESEND_API_KEY no Supabase para habilitar o envio real.";
      await supabaseAdmin
        .from("beta_email_notifications")
        .update({
          status: "failed",
          error_message: errorMsg,
        })
        .eq("id", item.id);

      return new Response(JSON.stringify({
        success: false,
        status: "BLOCKED",
        code: "MISSING_RESEND_API_KEY",
        message: errorMsg,
        protocol: appData.protocol_number,
        recipient: ADMIN_RECIPIENT,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Remetente autenticado: preferir domínio próprio verificado, fallback para sandbox Resend
    const sender = Deno.env.get("RESEND_SENDER_EMAIL") || "Aeternum Atlas <notificacoes@aeternumatlas.com>";

    const emailPayload = {
      from: sender,
      to: [ADMIN_RECIPIENT],
      subject: subject,
      html: htmlBody,
      text: textBody,
    };

    const resendRes = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      const errDetail = resendData.message || JSON.stringify(resendData);
      await supabaseAdmin
        .from("beta_email_notifications")
        .update({
          status: "failed",
          error_message: `Resend API Error (HTTP ${resendRes.status}): ${errDetail}`,
          provider_response: resendData,
        })
        .eq("id", item.id);

      return new Response(JSON.stringify({
        success: false,
        status: "FAIL",
        error: errDetail,
        code: "PROVIDER_ERROR",
        recipient: ADMIN_RECIPIENT,
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. GRAVAR SUCESSO DO PROVEDOR NO BANCO
    await supabaseAdmin
      .from("beta_email_notifications")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id: resendData.id,
        provider_response: resendData,
        error_message: null,
      })
      .eq("id", item.id);

    return new Response(JSON.stringify({
      success: true,
      status: "DELIVERED",
      provider_message_id: resendData.id,
      protocol: appData.protocol_number,
      recipient: ADMIN_RECIPIENT,
      subject: subject,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message || "Internal Server Error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
