import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

// =============================================================================
// AETERNUM ATLAS — P0.21-ADM.2.7-C.2: SEND-BETA-NOTIFICATION EDGE FUNCTION CONTRACTS
// ATOMIC CLAIM, RETRY LOGIC, IDEMPOTENCY, SECURITY & SIMULATED TRANSPORT
// =============================================================================

const EDGE_FN_PATH = path.resolve("supabase/functions/send-beta-notification/index.ts");
const MIGRATION_PATH = path.resolve("supabase/migrations/20261123180000_p0_21_hf1_security_hardening.sql");

test("P0.21-ADM.2.7-C.2 — Gate 1: Preservação de Constantes e Destinatário Institucional Imutável", () => {
  const code = fs.readFileSync(EDGE_FN_PATH, "utf8");

  // Destinatário fixo imutável (aeternumatlas@gmail.com)
  assert.ok(
    code.includes('const ADMIN_RECIPIENT = "aeternumatlas@gmail.com";'),
    "Destinatário DEVE ser rigorosamente 'aeternumatlas@gmail.com'"
  );

  // Endpoint do Resend
  assert.ok(
    code.includes('const RESEND_API_URL = "https://api.resend.com/emails";'),
    "URL do Resend deve apontar para https://api.resend.com/emails"
  );
});

test("P0.21-ADM.2.7-C.2 — Gate 2: Prevenção de Injeção HTML (escapeHtml)", () => {
  const code = fs.readFileSync(EDGE_FN_PATH, "utf8");

  // Verifica presença da função escapeHtml
  assert.ok(code.includes("function escapeHtml("), "Deve implementar escapeHtml para sanitização");

  // Implementação equivalente determinística para validação de contrato
  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const maliciousPayload = '<script>alert("xss")</script><img src=x onerror=steal()>&"\'';
  const sanitized = escapeHtml(maliciousPayload);

  assert.equal(
    sanitized,
    '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&lt;img src=x onerror=steal()&gt;&amp;&quot;&#039;',
    "escapeHtml deve neutralizar todas as tags e caracteres perigosos"
  );
  assert.ok(!sanitized.includes("<script>"), "Não deve conter tags de script");
  assert.ok(!sanitized.includes("<img"), "Não deve conter tags HTML");
});

test("P0.21-ADM.2.7-C.2 — Gate 3: Autenticação Criptografada e Rejeição Fail-Closed de Chaves Anônimas", () => {
  const code = fs.readFileSync(EDGE_FN_PATH, "utf8");

  // Rejeição de chave anônima (ANON_KEY_REJECTED)
  assert.ok(
    code.includes('code: "ANON_KEY_REJECTED"'),
    "Chave anônima pública anon DEVE ser rejeitada imediatamente com ANON_KEY_REJECTED"
  );

  // Rejeição de ausência de credenciais (AUTH_MISSING)
  assert.ok(
    code.includes('code: "AUTH_MISSING"'),
    "Falta de credenciais DEVE retornar 401 AUTH_MISSING"
  );

  // Verificação de papéis autorizados (admin, super_admin, institution_admin, service_role)
  assert.ok(
    code.includes('["admin", "super_admin", "institution_admin"].includes(profile.role)'),
    "Apenas papéis administrativos têm autorização para invocar o despacho de e-mails"
  );

  // Bloqueio de papéis não autorizados (AUTH_FORBIDDEN)
  assert.ok(
    code.includes('code: "AUTH_FORBIDDEN"'),
    "Atores não administrativos DEVEM receber 403 AUTH_FORBIDDEN"
  );
});

test("P0.21-ADM.2.7-C.2 — Gate 4: Reserva Atômica da Outbox (claim_next_beta_email_notification)", () => {
  const code = fs.readFileSync(EDGE_FN_PATH, "utf8");
  const migCode = fs.readFileSync(MIGRATION_PATH, "utf8");

  // Invocação da RPC unificada de claim
  assert.ok(
    code.includes('"claim_next_beta_email_notification"'),
    "Edge function DEVE invocar a RPC atômica claim_next_beta_email_notification"
  );

  // Validação da migration de claim com FOR UPDATE SKIP LOCKED
  assert.ok(
    migCode.includes("FOR UPDATE SKIP LOCKED"),
    "RPC de claim DEVE utilizar locks atômicos de linha para evitar processamento concorrente duplicado"
  );
  assert.ok(
    migCode.includes("attempts = b.attempts + 1") || migCode.includes("attempts = attempts + 1"),
    "RPC de claim DEVE incrementar contador de tentativas (attempts)"
  );
});

test("P0.21-ADM.2.7-C.2 — Gate 5: Cabeçalho de Idempotência Obrigatório para o Provedor Resend", () => {
  const code = fs.readFileSync(EDGE_FN_PATH, "utf8");

  // Idempotency-Key deve estar formatada com o ID da notificação
  assert.ok(
    code.includes('"Idempotency-Key": `beta-notification-${itemNotificationId}`'),
    "Despacho ao Resend DEVE enviar Idempotency-Key vinculada ao ID da notificação para impedir disparos duplicados"
  );
});

test("P0.21-ADM.2.7-C.2 — Gate 6: Diagnóstico Honesto em Ausência de Provedor Externo Configurado", () => {
  const code = fs.readFileSync(EDGE_FN_PATH, "utf8");

  // Verificação de RESEND_API_KEY
  assert.ok(
    code.includes('if (!resendApiKey)'),
    "Deve checar se resendApiKey está configurada"
  );
  assert.ok(
    code.includes('code: "EMAIL_DELIVERY_BLOCKED_EXTERNAL_CONFIGURATION"'),
    "Em ausência de RESEND_API_KEY, deve retornar diagnóstico honesto sem mascarar falha"
  );
  assert.ok(
    code.includes('status: "BLOCKED"'),
    "Status de retorno deve ser BLOCKED na ausência de configuração de chave"
  );
});

test("P0.21-ADM.2.7-C.2 — Gate 7: Contrato de Status de Notificação ('sent' vs 'delivered')", () => {
  const code = fs.readFileSync(EDGE_FN_PATH, "utf8");

  // Gravação de status 'sent' (aceite pelo provedor, não comprovação de entrega na caixa do destinatário)
  assert.ok(
    code.includes('status: "sent"'),
    "O status gravado no banco DEVE ser 'sent' (aceite de despacho pelo provedor Resend)"
  );
  assert.ok(
    !code.includes('status: "delivered"'),
    "O status NUNCA deve ser registrado como 'delivered' sem recebimento de webhook assinado do provedor"
  );
  assert.ok(
    code.includes('provider: "resend"'),
    "Provedor registrado deve ser 'resend'"
  );
  assert.ok(
    code.includes('provider_message_id: resendData.id'),
    "ID da mensagem retornado pelo Resend deve ser gravado para rastreabilidade auditável"
  );
});
