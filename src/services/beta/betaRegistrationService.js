/**
 * AETERNUM ATLAS — OPERAÇÃO EL DORADO (P0.21-E.1)
 * Serviço de Candidatura e Gestão do Programa de Teste Beta.
 * Conexão com Supabase via RPCs atômicas e políticas RLS restritas.
 */

import { supabase } from "../../lib/supabase.js";

/**
 * Obtém o status público do Programa Beta (abertura de inscrições e capacidade de vagas).
 * Chamada pública via RPC get_beta_program_public_status.
 */
export async function getBetaProgramPublicStatus() {
  try {
    const { data, error } = await supabase.rpc("get_beta_program_public_status");
    if (error) throw error;
    return {
      success: true,
      data: data || {
        registration_open: false,
        batch: "batch_1_30",
        capacity_total: 30,
        approved_count: 0,
        remaining_slots: 30,
        launch_notice: "Inscrições abrem na primeira semana de dezembro de 2026"
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      data: {
        registration_open: false,
        batch: "batch_1_30",
        capacity_total: 30,
        approved_count: 0,
        remaining_slots: 30,
        launch_notice: "Inscrições abrem na primeira semana de dezembro de 2026"
      }
    };
  }
}

/**
 * Validação client-side para pré-checagem dos campos de candidatura.
 */
export function validateBetaApplication(values) {
  const errors = {};

  if (!values.fullName || values.fullName.trim().length < 3) {
    errors.fullName = "Nome completo deve ter pelo menos 3 caracteres.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!values.email || !emailRegex.test(values.email.trim())) {
    errors.email = "Informe um e-mail válido (preferencialmente acadêmico).";
  }

  if (!values.institutionName || values.institutionName.trim().length < 2) {
    errors.institutionName = "Informe o nome da universidade ou instituição de ensino.";
  }

  if (!values.course || values.course.trim().length < 2) {
    errors.course = "Informe seu curso de graduação ou pós-graduação.";
  }

  if (!values.academicTerm || values.academicTerm.trim().length < 1) {
    errors.academicTerm = "Informe seu ano ou semestre atual.";
  }

  if (!values.primaryDevice || values.primaryDevice.trim().length < 2) {
    errors.primaryDevice = "Selecione o dispositivo principal de acesso.";
  }

  if (!values.motivation || values.motivation.trim().length < 10) {
    errors.motivation = "Compartilhe uma breve motivação (mínimo de 10 caracteres).";
  }

  if (!values.privacyConsent) {
    errors.privacyConsent = "É necessário aceitar os termos de tratamento de dados acadêmicos.";
  }

  if (!values.termsConsent) {
    errors.termsConsent = "É necessário declarar ciência sobre as vagas limitadas e ausência de acesso imediato.";
  }

  return errors;
}

/**
 * Submete uma nova candidatura ao Programa de Teste Beta via RPC submit_beta_application.
 */
export async function submitBetaApplication(formData) {
  const clientValidation = validateBetaApplication(formData);
  if (Object.keys(clientValidation).length > 0) {
    return {
      success: false,
      code: "VALIDATION_FAILED",
      message: "Por favor, corrija os campos indicados antes de enviar.",
      errors: clientValidation
    };
  }

  try {
    const { data, error } = await supabase.rpc("submit_beta_application", {
      p_full_name: formData.fullName.trim(),
      p_email: formData.email.trim().toLowerCase(),
      p_institution_name: formData.institutionName.trim(),
      p_course: formData.course.trim(),
      p_academic_term: formData.academicTerm.trim(),
      p_student_group: formData.studentGroup ? formData.studentGroup.trim() : null,
      p_student_id_number: formData.studentIdNumber ? formData.studentIdNumber.trim() : null,
      p_country: formData.country ? formData.country.trim() : "Brasil",
      p_primary_device: formData.primaryDevice || "Desktop Windows",
      p_referral_source: formData.referralSource ? formData.referralSource.trim() : null,
      p_motivation: formData.motivation.trim(),
      p_privacy_consent: Boolean(formData.privacyConsent),
      p_terms_consent: Boolean(formData.termsConsent),
      p_communication_consent: Boolean(formData.communicationConsent),
      p_source_origin: "landing_beta"
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (err) {
    return {
      success: false,
      code: "RPC_ERROR",
      message: err.message || "Ocorreu um erro ao registrar sua candidatura. Tente novamente em instantes."
    };
  }
}

/**
 * Consulta candidaturas ao Programa Beta (Acesso exclusivo para administradores).
 * Permite isolamento opcional de registros sintéticos de auditoria técnica.
 */
export async function listBetaApplications({ status = null, search = "", limit = 50, offset = 0, includeSynthetic = false } = {}) {
  try {
    let query = supabase
      .from("beta_applications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (!includeSynthetic) {
      query = query.neq("batch", "synthetic_test").not("source_origin", "ilike", "%synthetic%");
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`full_name.ilike.${term},email.ilike.${term},institution_name.ilike.${term},student_group.ilike.${term}`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      success: true,
      data: data || [],
      count: count || 0
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      data: [],
      count: 0
    };
  }
}

/**
 * Avalia administrativamente uma candidatura (Aprovar, Lista de Espera, etc.).
 */
export async function reviewBetaApplication(applicationId, newStatus, reviewNotes = "", batch = null) {
  // P0.21-ADM.2.7-E: Bloqueio estrito de invited e activated enquanto E7.3 não estiver autorizada
  if (["invited", "activated"].includes(newStatus)) {
    return {
      success: false,
      code: "E7_3_NOT_AUTHORIZED",
      message: "Transições para 'invited' e 'activated' permanecem bloqueadas na fase de pré-lançamento. Justificativas textuais ou existência de user_id não constituem autorização suficiente (Gate E7.3)."
    };
  }

  try {
    const { data, error } = await supabase.rpc("admin_review_beta_application", {
      p_application_id: applicationId,
      p_new_status: newStatus,
      p_review_notes: reviewNotes.trim() || null,
      p_batch: batch
    });

    if (error) throw error;
    return data;
  } catch (err) {
    return {
      success: false,
      code: "REVIEW_ERROR",
      message: err.message || "Falha ao registrar avaliação da candidatura."
    };
  }
}

/**
 * Obtém sumário de capacidade e lotes do Programa Beta.
 * Métricas: Total, Pendentes, Em Análise, Aprovadas, Lista de Espera, Convites Enviados, Contas Ativadas.
 * Prioriza a RPC autorizada get_beta_operational_summary e nunca retorna falsos zeros ou 30s em falha.
 */
export async function getBetaCapacitySummary() {
  // 1. Tentar RPC autorizada agregada (sem PII)
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_beta_operational_summary");
    if (!rpcError && rpcData && rpcData.success) {
      return {
        success: true,
        summary: {
          total: rpcData.total_applications,
          syntheticTotal: 0,
          pending: rpcData.pending,
          under_review: rpcData.under_review,
          approved: rpcData.approved,
          waitlisted: rpcData.waitlisted,
          rejected: rpcData.rejected,
          invited: rpcData.invited,
          activated: rpcData.activated,
          batch1Approved: rpcData.batch_1_reserved,
          batch1Cap: rpcData.batch_1_capacity || 30,
          batch2Cap: 50,
          batch3Cap: 100,
          batch1Remaining: rpcData.batch_1_remaining,
          notifications: rpcData.notifications || null,
          registrationOpen: rpcData.registration_open,
          isUnavailable: false
        }
      };
    }
  } catch {
    // Fallback gracioso para query direta se a RPC ainda não tiver sido migrada
  }

  // 2. Fallback via consulta direta com tratamento estrito de indisponibilidade
  try {
    const { data, error } = await supabase
      .from("beta_applications")
      .select("status, batch, user_id, email, source_origin");

    if (error) throw error;
    if (!data) throw new Error("Dados de candidaturas indisponíveis");

    const legitimateData = data.filter(item => item.batch !== "synthetic_test" && !item.source_origin?.includes("synthetic"));
    const syntheticCount = data.length - legitimateData.length;

    const summary = {
      total: legitimateData.length,
      syntheticTotal: syntheticCount,
      pending: 0,
      under_review: 0,
      approved: 0,
      waitlisted: 0,
      rejected: 0,
      invited: 0,
      activated: 0,
      batch1Approved: 0,
      batch1Cap: 30,
      batch2Cap: 50,
      batch3Cap: 100,
      isUnavailable: false
    };

    for (const item of legitimateData) {
      if (summary[item.status] !== undefined) {
        summary[item.status]++;
      }
      // Vaga reservada no Lote 1: approved, invited ou activated (definição canônica rigorosa)
      const isReserved = (item.status === "approved" || item.status === "invited" || item.status === "activated") && item.batch === "batch_1_30";
      if (isReserved) {
        summary.batch1Approved++;
      }
      if (item.status === "activated") {
        summary.activated++;
      }
    }

    summary.batch1Remaining = Math.max(0, summary.batch1Cap - summary.batch1Approved);
    summary.notifications = null;
    summary.notifications_status = "NOT_CONFIGURED";

    return { success: true, summary };
  } catch {
    // Em caso de erro ou indisponibilidade, retornar null/isUnavailable para exibir traços (—)
    return {
      success: false,
      isUnavailable: true,
      summary: {
        total: null,
        syntheticTotal: null,
        pending: null,
        under_review: null,
        approved: null,
        waitlisted: null,
        rejected: null,
        invited: null,
        activated: null,
        batch1Approved: null,
        batch1Cap: 30,
        batch2Cap: 50,
        batch3Cap: 100,
        batch1Remaining: null,
        notifications: null,
        notifications_status: "UNAVAILABLE",
        isUnavailable: true
      }
    };
  }
}

/**
 * Busca todas as candidaturas que correspondem aos filtros para exportação completa,
 * evitando truncamento na paginação da interface (suporta até 5.000 registros).
 */
export async function fetchAllBetaApplicationsForExport({ status = null, search = "", includeSynthetic = false, maxRecords = 5000 } = {}) {
  try {
    let allRecords = [];
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore && allRecords.length < maxRecords) {
      let query = supabase
        .from("beta_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (!includeSynthetic) {
        query = query.neq("batch", "synthetic_test").not("source_origin", "ilike", "%synthetic%");
      }

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(`full_name.ilike.${term},email.ilike.${term},institution_name.ilike.${term},student_group.ilike.${term}`);
      }

      const limit = Math.min(batchSize, maxRecords - allRecords.length);
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allRecords = allRecords.concat(data);
        offset += data.length;
        if (data.length < limit) {
          hasMore = false;
        }
      }
    }

    return allRecords;
  } catch (err) {
    console.error("Erro ao buscar candidaturas completas para exportação:", err);
    throw err;
  }
}

/**
 * Sanitiza valores contra injeção de fórmulas CSV (CWE-1236).
 * Previne execução de comandos em Microsoft Excel / LibreOffice se o campo iniciar com =, +, -, @, tab ou cr.
 */
export function sanitizeCsvFormula(val) {
  if (val === null || val === undefined) return "";
  let str = String(val);
  if (/^[=+\-@\t\r]/.test(str) || /^[=+\-@]/.test(str.trimStart())) {
    str = "'" + str;
  }
  return str;
}

/**
 * Constrói o conteúdo CSV estruturado e compatível com Microsoft Excel
 * (com UTF-8 BOM, delimitador ';' para Excel pt-BR e proteção CWE-1236 contra formula injection).
 */
export function buildBetaApplicationsCsvContent(applications, { excludeSynthetic = true } = {}) {
  const filtered = excludeSynthetic
    ? applications.filter(app => app.batch !== "synthetic_test" && !app.source_origin?.includes("synthetic"))
    : applications;

  if (!filtered || !filtered.length) return "";

  const headers = [
    "Protocolo",
    "Data Submissão",
    "Nome Completo",
    "E-mail",
    "Instituição",
    "Curso",
    "Período/Ano",
    "Turma/Grupo",
    "Matrícula",
    "Dispositivo",
    "País",
    "Como Conheceu",
    "Motivação",
    "Status",
    "Lote",
    "Notas de Revisão",
    "Data Avaliação",
    "Avaliador"
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const sanitized = sanitizeCsvFormula(val).replace(/\r\n/g, " ").replace(/[\r\n]/g, " ");
    const str = sanitized.replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = filtered.map(app => [
    escapeCsv(app.protocol_number || "N/A"),
    escapeCsv(app.created_at ? new Date(app.created_at).toLocaleString("pt-BR") : ""),
    escapeCsv(app.full_name),
    escapeCsv(app.email),
    escapeCsv(app.institution_name),
    escapeCsv(app.course),
    escapeCsv(app.academic_term),
    escapeCsv(app.student_group || ""),
    escapeCsv(app.student_id_number || ""),
    escapeCsv(app.primary_device || ""),
    escapeCsv(app.country || "Brasil"),
    escapeCsv(app.referral_source || ""),
    escapeCsv(app.motivation || ""),
    escapeCsv(app.status),
    escapeCsv(app.batch || "batch_1_30"),
    escapeCsv(app.review_notes || ""),
    escapeCsv(app.reviewed_at ? new Date(app.reviewed_at).toLocaleString("pt-BR") : ""),
    escapeCsv(app.reviewed_by || "")
  ]);

  return "\uFEFF" + [
    headers.join(";"),
    ...rows.map(row => row.join(";"))
  ].join("\r\n");
}

/**
 * Exporta candidaturas para formato CSV estruturado e compatível com Microsoft Excel
 * (com UTF-8 BOM e delimitador ';' para correta abertura no Excel pt-BR).
 */
export function exportBetaApplicationsCsv(applications, { excludeSynthetic = true } = {}) {
  const csvContent = buildBetaApplicationsCsvContent(applications, { excludeSynthetic });
  if (!csvContent) return false;

  if (typeof document === "undefined") {
    return csvContent;
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const now = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `aeternum_atlas_candidatos_beta_${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

