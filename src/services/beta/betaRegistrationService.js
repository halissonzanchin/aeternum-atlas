/**
 * AETERNUM ATLAS — OPERAÇÃO EL DORADO (P0.21-E.1)
 * Serviço de Candidatura e Gestão do Programa de Teste Beta.
 * Conexão com Supabase via RPCs atômicas e políticas RLS restritas.
 */

import { supabase } from "../../lib/supabase.js";

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
 */
export async function listBetaApplications({ status = null, search = "", limit = 50, offset = 0 } = {}) {
  try {
    let query = supabase
      .from("beta_applications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

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
 */
export async function getBetaCapacitySummary() {
  try {
    const { data, error } = await supabase
      .from("beta_applications")
      .select("status, batch, user_id, email");

    if (error) throw error;

    const summary = {
      total: data.length,
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
      batch3Cap: 100
    };

    for (const item of data) {
      if (summary[item.status] !== undefined) {
        summary[item.status]++;
      }
      if ((item.status === "approved" || item.status === "invited") && item.batch === "batch_1_30") {
        summary.batch1Approved++;
      }
      if (item.user_id) {
        summary.activated++;
      }
    }

    summary.batch1Remaining = Math.max(0, summary.batch1Cap - summary.batch1Approved);

    return { success: true, summary };
  } catch {
    return {
      success: false,
      summary: {
        total: 0,
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
        batch1Remaining: 30
      }
    };
  }
}

/**
 * Exporta candidaturas para formato CSV estruturado e compatível com Microsoft Excel
 * (com UTF-8 BOM e delimitador ';' para correta abertura no Excel pt-BR).
 */
export function exportBetaApplicationsCsv(applications) {
  if (!applications || !applications.length) return false;

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
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = applications.map(app => [
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

  const csvContent = "\uFEFF" + [
    headers.join(";"),
    ...rows.map(row => row.join(";"))
  ].join("\r\n");

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

