import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_RECIPIENT = "aeternumatlas@gmail.com";
const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Sanitiza valores inseridos no corpo HTML do e-mail para impedir injeção de tags ou scripts.
 */
function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
    const legacyServiceKey = (Deno.env.get("LEGACY_SERVICE_ROLE_KEY") ?? "").trim();
    const resendApiKey = (Deno.env.get("RESEND_API_KEY") ?? "").trim();
    const anonKey = (Deno.env.get("SUPABASE_ANON_KEY") ?? "").trim();
    const legacyAnonKey = (Deno.env.get("LEGACY_ANON_KEY") ?? "").trim();

    if (!supabaseUrl || (!supabaseServiceKey && !legacyServiceKey)) {
      throw new Error("Missing Supabase configuration in environment.");
    }

    // 1. AUTENTICAÇÃO CRIPTOGRAFICAMENTE VALIDADA (Zero decodificação arbitrária via atob)
    const authHeader = req.headers.get("Authorization") ?? "";
    const reqApiKey = (req.headers.get("apikey") ?? "").trim();
    const token = authHeader.replace(/^Bearer\s+/i, "").trim() || reqApiKey;

    if (!token) {
      return new Response(JSON.stringify({
        error: "Unauthorized: Missing authorization credentials.",
        code: "AUTH_MISSING"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rejeição estrita da chave anônima pública (novo formato ou formato legado)
    if (
      (anonKey && (token === anonKey || reqApiKey === anonKey)) ||
      (legacyAnonKey && (token === legacyAnonKey || reqApiKey === legacyAnonKey))
    ) {
      return new Response(JSON.stringify({
        error: "Unauthorized: Anonymous public key is not permitted to trigger administrative notifications.",
        code: "ANON_KEY_REJECTED"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const activeAdminKey = supabaseServiceKey || legacyServiceKey;
    const supabaseAdmin = createClient(supabaseUrl, activeAdminKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let isAuthorized = false;
    let authActor = "unknown";

    // Verificação 1: Chamada interna de serviço com chave service_role autêntica (novo formato ou formato legado)
    if (
      (supabaseServiceKey && (token === supabaseServiceKey || authHeader.includes(supabaseServiceKey))) ||
      (legacyServiceKey && (token === legacyServiceKey || authHeader.includes(legacyServiceKey)))
    ) {
      isAuthorized = true;
      authActor = "service_role";
    }

    // Verificação 2: Validação criptográfica de JWT de administrador via Supabase Auth
    if (!isAuthorized) {
      // getUser() envia o token ao Auth Server do Supabase, que valida matematicamente a assinatura
      // e o tempo de expiração do JWT. Tokens forjados ou expirados falham com erro.
      const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);

      if (!authErr && authData?.user?.id) {
        const userId = authData.user.id;
        const { data: profile, error: profErr } = await supabaseAdmin
          .from("users")
          .select("role")
          .eq("id", userId)
          .single();

        if (!profErr && profile && ["admin", "super_admin", "institution_admin"].includes(profile.role)) {
          isAuthorized = true;
          authActor = `admin_user:${userId}`;
        }
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({
        error: "Forbidden: Operation requires administrative or verified internal service privileges.",
        code: "AUTH_FORBIDDEN"
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. EXTRAÇÃO DE PARÂMETROS OU RESERVA ATÔMICA DA FILA (FOR UPDATE SKIP LOCKED)
    let explicitNotificationId: string | null = null;
    let explicitApplicationId: string | null = null;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        explicitNotificationId = body.notification_id || null;
        explicitApplicationId = body.application_id || null;
      } catch {
        // Chamada sem corpo (ex: trigger cron periódico)
      }
    }

    let claimedItem: any = null;

    if (explicitNotificationId) {
      // Reserva direta pelo ID da notificação
      const { data, error } = await supabaseAdmin
        .from("beta_email_notifications")
        .update({
          status: "processing",
          attempts: 1,
          last_attempt_at: new Date().toISOString()
        })
        .eq("id", explicitNotificationId)
        .select()
        .single();
      if (!error && data) claimedItem = data;
    } else if (explicitApplicationId) {
      // Reserva pelo ID da candidatura
      const { data, error } = await supabaseAdmin
        .from("beta_email_notifications")
        .update({
          status: "processing",
          attempts: 1,
          last_attempt_at: new Date().toISOString()
        })
        .eq("application_id", explicitApplicationId)
        .select()
        .single();
      if (!error && data) claimedItem = data;
    } else {
      // Consumo atômico da fila via RPC com SKIP LOCKED
      const { data: claimedRows, error: claimErr } = await supabaseAdmin.rpc("claim_next_beta_email_notification");
      if (claimErr) throw claimErr;
      if (claimedRows && claimedRows.length > 0) {
        claimedItem = claimedRows[0];
      }
    }

    if (!claimedItem) {
      return new Response(JSON.stringify({
        success: true,
        message: "Nenhuma notificação pendente na fila para processamento.",
        queue_status: "idle",
        actor: authActor
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const itemNotificationId = claimedItem.notification_id || claimedItem.id;
    const itemApplicationId = claimedItem.app_id || claimedItem.application_id;

    // 3. CONSULTAR DADOS COMPLETOS DA CANDIDATURA
    const { data: appData, error: appErr } = await supabaseAdmin
      .from("beta_applications")
      .select("id, protocol_number, full_name, email, institution_name, course, academic_term, student_group, primary_device, motivation, created_at, status")
      .eq("id", itemApplicationId)
      .single();

    if (appErr || !appData) {
      await supabaseAdmin
        .from("beta_email_notifications")
        .update({
          status: "failed",
          error_message: `Candidatura ${itemApplicationId} não localizada no banco.`,
        })
        .eq("id", itemNotificationId);

      throw new Error(`Candidatura ${itemApplicationId} não localizada.`);
    }

    const formattedDate = new Date(appData.created_at).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "full",
      timeStyle: "medium",
    });

    // Destinatário SEMPRE fixo e imutável
    const subject = `[AETERNUM ATLAS | BETA] Nova candidatura — ${appData.full_name}`;
    const adminLink = "https://www.aeternumatlas.com/super-admin/programa-beta";

    // 4. CORPO DO E-MAIL COM SANITIZAÇÃO COMPLETA CONTRA INJEÇÃO HTML
    const safeName = escapeHtml(appData.full_name);
    const safeEmail = escapeHtml(appData.email);
    const safeInst = escapeHtml(appData.institution_name);
    const safeCourse = escapeHtml(appData.course);
    const safeTerm = escapeHtml(appData.academic_term);
    const safeGroup = escapeHtml(appData.student_group || "");
    const safeDevice = escapeHtml(appData.primary_device);
    const safeProtocol = escapeHtml(appData.protocol_number || "PENDENTE");
    const safeMotivation = escapeHtml(appData.motivation);
    const safeFormattedDate = escapeHtml(formattedDate);

    const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
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
      <div>Protocolo: <span class="protocol">${safeProtocol}</span></div>
    </div>

    <div class="field-group">
      <div class="field-label">Candidato</div>
      <div class="field-value">${safeName} &lt;${safeEmail}&gt;</div>
    </div>

    <div class="field-group">
      <div class="field-label">Universidade / Instituição</div>
      <div class="field-value">${safeInst}</div>
    </div>

    <div class="field-group">
      <div class="field-label">Curso e Período</div>
      <div class="field-value">${safeCourse} — ${safeTerm}${safeGroup ? ` (${safeGroup})` : ""}</div>
    </div>

    <div class="field-group">
      <div class="field-label">Dispositivo de Acesso</div>
      <div class="field-value">${safeDevice}</div>
    </div>

    <div class="field-group">
      <div class="field-label">Data e Horário do Registro</div>
      <div class="field-value">${safeFormattedDate} (Horário de Brasília)</div>
    </div>

    <div class="field-group">
      <div class="field-label">Status Inicial</div>
      <div class="field-value"><strong style="color: #fbbf24;">Aguardando análise</strong> (Meta inicial: 30 vagas convidadas)</div>
    </div>

    <div class="field-group">
      <div class="field-label">Motivação Declarada pelo Estudante</div>
      <div class="motivation-box">"${safeMotivation}"</div>
    </div>

    <div>
      <a href="${adminLink}" class="cta-button" target="_blank" rel="noopener noreferrer">Acessar Painel de Triagem Beta</a>
    </div>

    <div class="footer">
      Esta é uma notificação institucional automática gerada pela plataforma Aeternum Atlas.<br>
      A seleção para o Programa Beta da Operação El Dorado ocorre na primeira semana de dezembro de 2026.<br>
      Destinatário exclusivo: ${ADMIN_RECIPIENT}
    </div>
  </div>
</body>
</html>`;

    const textBody = `
============================================================
AETERNUM ATLAS — OPERAÇÃO EL DORADO (PROGRAMA DE TESTE BETA)
NOVA CANDIDATURA PROTOCOLADA
============================================================

Protocolo: ${appData.protocol_number || "PENDENTE"}
Data/Hora: ${formattedDate} (BRT)
Status Inicial: Aguardando análise

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

    // 5. ENVIO REAL VIA RESEND (SE CONFIGURADO) OU DIAGNÓSTICO HONESTO
    if (!resendApiKey) {
      const errorMsg = "BLOCKED: EMAIL_DELIVERY_BLOCKED_EXTERNAL_CONFIGURATION - Provedor de e-mail (Resend) não configurado. Defina a secret RESEND_API_KEY no Supabase para habilitar o envio real.";
      await supabaseAdmin
        .from("beta_email_notifications")
        .update({
          status: "failed",
          error_message: errorMsg,
        })
        .eq("id", itemNotificationId);

      return new Response(JSON.stringify({
        success: false,
        status: "BLOCKED",
        code: "EMAIL_DELIVERY_BLOCKED_EXTERNAL_CONFIGURATION",
        message: errorMsg,
        protocol: appData.protocol_number,
        recipient: ADMIN_RECIPIENT,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Remetente autenticado
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
        .eq("id", itemNotificationId);

      return new Response(JSON.stringify({
        success: false,
        status: "FAILED",
        error: errDetail,
        code: "PROVIDER_ERROR",
        recipient: ADMIN_RECIPIENT,
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. GRAVAR SUCESSO DE ACEITE DO PROVEDOR NO BANCO (Status 'sent', NÃO 'delivered')
    await supabaseAdmin
      .from("beta_email_notifications")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        provider: "resend",
        provider_message_id: resendData.id,
        provider_response: resendData,
        error_message: null,
      })
      .eq("id", itemNotificationId);

    return new Response(JSON.stringify({
      success: true,
      status: "SENT",
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
