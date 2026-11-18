/**
 * AETERNUM ATLAS — SERVIÇO DE NOTIFICAÇÕES INSTITUCIONAIS
 *
 * Suporta avisos de manutenção programada, melhorias da plataforma e comunicados.
 * Integração resiliente com Supabase, fallback seguro e validação estrita de modelos.
 */

import { getSupabaseClient, isSupabaseConfigured } from "../supabase/supabaseClient.js";

export const NOTIFICATION_TYPES = {
  SCHEDULED_MAINTENANCE: "scheduled_maintenance",
  MAINTENANCE_IN_PROGRESS: "maintenance_in_progress",
  MAINTENANCE_COMPLETED: "maintenance_completed",
  MAINTENANCE_POSTPONED: "maintenance_postponed",
  MAINTENANCE_CANCELLED: "maintenance_cancelled",
  PLATFORM_IMPROVEMENT: "platform_improvement",
  INSTITUTIONAL_ANNOUNCEMENT: "institutional_announcement"
};

export const NOTIFICATION_PRIORITIES = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  CRITICAL: "critical"
};

export const NOTIFICATION_STATUSES = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  POSTPONED: "postponed",
  CANCELLED: "cancelled"
};

export const TARGET_AUDIENCES = {
  ALL: "all",
  STUDENTS: "students",
  TEACHERS: "teachers",
  INSTITUTION_ADMINS: "institution_admins",
  SPECIFIC_INSTITUTION: "specific_institution"
};

export const AFFECTED_RESOURCES_CATALOG = [
  "Tutor IA",
  "Visualizador 3D",
  "Flashcards Anatômicos",
  "Mapas Mentais",
  "Quizzes e Avaliações",
  "Biblioteca Cadavérica",
  "Agenda de Estudos",
  "Plataforma Geral"
];

export const STANDARD_MAINTENANCE_TEMPLATE_PT = {
  title: "Atualização programada — Aeternum Atlas",
  message: `Prezados estudantes,

Informamos que a plataforma Aeternum Atlas passará por uma atualização programada no dia [DATA], das [INÍCIO] às [TÉRMINO], no horário de Brasília.

Essa atualização tem como objetivo aprimorar a estabilidade, o desempenho e as funcionalidades acadêmicas da plataforma.

Durante esse período, alguns recursos poderão apresentar instabilidade ou interrupções temporárias. Recomendamos salvar suas atividades antes do início da atualização.

A conclusão será comunicada nesta Central de Notificações.

Agradecemos pela compreensão.

Equipe Aeternum Atlas.`
};

export const STANDARD_MAINTENANCE_TEMPLATE_ES = {
  title: "Actualización programada — Aeternum Atlas",
  message: `Estimados estudiantes,

Les informamos que la plataforma Aeternum Atlas pasará por una actualización programada el día [DATA], de [INÍCIO] a [TÉRMINO], en el horario de Brasilia.

Esta actualización tiene como objetivo optimizar la estabilidad, el rendimiento y las funciones académicas de la plataforma.

Durante este período, algunos recursos podrían presentar inestabilidad o interrupciones temporales. Recomendamos guardar sus actividades antes del inicio de la actualización.

La conclusión se comunicará en este Centro de Notificaciones.

Agradecemos su comprensión.

Equipo Aeternum Atlas.`
};

/**
 * Valida a presença de substituições pendentes em modelos de texto.
 * Não permite publicação de modelos com campos entre colchetes não preenchidos.
 */
export function validateTemplatePlaceholders(title = "", message = "") {
  const combined = `${title}\n${message}`;
  const unreplaced = combined.match(/\[([A-ZÁÉÍÓÚÂÊÔÃÕÇ_-]+)\]/g);
  if (unreplaced && unreplaced.length > 0) {
    const unique = Array.from(new Set(unreplaced)).join(", ");
    return {
      valid: false,
      error: `Existem campos obrigatórios não preenchidos no comunicado: ${unique}. Substitua todos os valores antes de publicar.`
    };
  }
  return { valid: true, error: null };
}

/**
 * Substitui com segurança as variáveis de data e horário do template.
 */
export function fillMaintenanceTemplate(templateMessage, { date = "", startTime = "", endTime = "" } = {}) {
  let result = templateMessage || "";
  if (date) result = result.replaceAll("[DATA]", date);
  if (startTime) result = result.replaceAll("[INÍCIO]", startTime);
  if (endTime) result = result.replaceAll("[TÉRMINO]", endTime);
  return result;
}

/**
 * Formata um timestamp UTC para a exibição com fuso horário e localidade
 */
export function formatNotificationDate(utcIsoString, locale = "pt-BR", timeZone = "America/Sao_Paulo") {
  if (!utcIsoString) return "—";
  try {
    const date = new Date(utcIsoString);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "pt-BR", {
      timeZone,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  } catch {
    return utcIsoString;
  }
}

/**
 * Formata intervalo de manutenção para visualização compacta.
 */
export function formatMaintenanceWindow(startUtc, endUtc, locale = "pt-BR", timeZone = "America/Sao_Paulo") {
  if (!startUtc) return null;
  try {
    const startDate = new Date(startUtc);
    const endDate = endUtc ? new Date(endUtc) : null;
    const l = locale === "es" ? "es-ES" : "pt-BR";

    const datePart = new Intl.DateTimeFormat(l, {
      timeZone,
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(startDate);

    const startTime = new Intl.DateTimeFormat(l, {
      timeZone,
      hour: "2-digit",
      minute: "2-digit"
    }).format(startDate);

    if (!endDate) {
      return `${datePart} às ${startTime} (${timeZone === "America/Sao_Paulo" ? "Brasília" : timeZone})`;
    }

    const endTime = new Intl.DateTimeFormat(l, {
      timeZone,
      hour: "2-digit",
      minute: "2-digit"
    }).format(endDate);

    return `${datePart}, ${startTime} – ${endTime} (${timeZone === "America/Sao_Paulo" ? "Brasília" : timeZone})`;
  } catch {
    return null;
  }
}

/**
 * Formata tempo decorrido relativo ("há 5 min", "há 2 horas", etc.)
 */
export function formatRelativeTime(utcIsoString, locale = "pt-BR") {
  if (!utcIsoString) return "";
  try {
    const now = Date.now();
    const timestamp = new Date(utcIsoString).getTime();
    const diffSec = Math.floor((now - timestamp) / 1000);

    const isEs = locale === "es";
    if (diffSec < 60) return isEs ? "Hace un momento" : "Agora mesmo";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return isEs ? `Hace ${diffMin} min` : `Há ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return isEs ? `Hace ${diffHours} h` : `Há ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return isEs ? `Hace ${diffDays} d` : `Há ${diffDays} d`;

    return formatNotificationDate(utcIsoString, locale);
  } catch {
    return "";
  }
}

// ------------------------------------------------------------------------------
// CLIENTE DO ESTUDANTE (LEITURA E CONSUMO)
// ------------------------------------------------------------------------------

/**
 * Busca notificações ativas e destinadas ao usuário atual.
 * Trata graciosamente caso as tabelas ainda não existam no ambiente.
 */
export async function fetchStudentNotifications({ limit = 50, offset = 0 } = {}) {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  const supabase = getSupabaseClient();
  try {
    const { data, error } = await supabase.rpc("get_student_notifications", {
      p_limit: limit,
      p_offset: offset
    });

    if (error) {
      // Degradação graciosa: se o RPC não existir ou o banco de homologação estiver sem migration
      if (error.code === "PGRST202" || error.code === "42883" || error.message?.includes("function")) {
        console.warn("[InstitutionalNotifications] RPC get_student_notifications indisponível, fallback ativo.");
        return { data: [], error: null };
      }
      return { data: [], error };
    }

    const normalized = (data || []).map(row => ({
      id: row.notification_id || row.id,
      title: row.title,
      message: row.message,
      type: row.type,
      priority: row.priority,
      status: row.status,
      targetAudience: row.target_audience,
      institutionId: row.institution_id,
      affectedResources: Array.isArray(row.affected_resources) ? row.affected_resources : [],
      scheduledStartAt: row.scheduled_start_at,
      scheduledEndAt: row.scheduled_end_at,
      publishedAt: row.published_at,
      timezone: row.timezone || "America/Sao_Paulo",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isRead: Boolean(row.is_read),
      readAt: row.read_at
    }));

    return { data: normalized, error: null };
  } catch (err) {
    console.warn("[InstitutionalNotifications] Falha na consulta de notificações:", err);
    return { data: [], error: err };
  }
}

/**
 * Marca uma notificação individual como lida pelo estudante.
 */
export async function markNotificationAsRead(notificationId) {
  if (!notificationId || !isSupabaseConfigured()) return { success: false };

  const supabase = getSupabaseClient();
  try {
    const { data, error } = await supabase.rpc("mark_notification_as_read", {
      p_notification_id: notificationId
    });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("[InstitutionalNotifications] Erro ao marcar como lida:", err);
    return { success: false, error: err };
  }
}

/**
 * Marca todas as notificações visíveis como lidas pelo estudante.
 */
export async function markAllNotificationsAsRead() {
  if (!isSupabaseConfigured()) return { success: false, count: 0 };

  const supabase = getSupabaseClient();
  try {
    const { data, error } = await supabase.rpc("mark_all_notifications_as_read");
    if (error) throw error;
    return { success: true, count: data?.marked_count || 0 };
  } catch (err) {
    console.error("[InstitutionalNotifications] Erro ao marcar todas como lidas:", err);
    return { success: false, error: err };
  }
}

// ------------------------------------------------------------------------------
// CLIENTE ADMINISTRATIVO (GESTÃO DE COMUNICADOS)
// ------------------------------------------------------------------------------

/**
 * Consulta comunicados para a área administrativa.
 */
export async function fetchAdminNotifications({ status, type, limit = 100, offset = 0, query = "" } = {}) {
  if (!isSupabaseConfigured()) {
    return { data: [], total: 0, error: null };
  }

  const supabase = getSupabaseClient();
  try {
    let q = supabase
      .from("institutional_notifications")
      .select("*, notification_audit_log(id, action, actor_role, created_at, details)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      q = q.eq("status", status);
    }
    if (type && type !== "all") {
      q = q.eq("type", type);
    }
    if (query) {
      q = q.ilike("title", `%${query}%`);
    }

    const { data, count, error } = await q;
    if (error) throw error;

    return { data: data || [], total: count || 0, error: null };
  } catch (err) {
    console.error("[InstitutionalNotifications] Erro ao buscar avisos administrativos:", err);
    return { data: [], total: 0, error: err };
  }
}

/**
 * Cria um novo comunicado institucional (Admin)
 */
export async function createNotification(payload) {
  if (!isSupabaseConfigured()) throw new Error("Supabase não configurado.");

  // Validação estrita se for publicar ou agendar com template
  if (payload.status === NOTIFICATION_STATUSES.PUBLISHED || payload.status === NOTIFICATION_STATUSES.SCHEDULED) {
    const val = validateTemplatePlaceholders(payload.title, payload.message);
    if (!val.valid) throw new Error(val.error);
  }

  const supabase = getSupabaseClient();
  const record = {
    title: payload.title.trim(),
    message: payload.message.trim(),
    type: payload.type || NOTIFICATION_TYPES.INSTITUTIONAL_ANNOUNCEMENT,
    priority: payload.priority || NOTIFICATION_PRIORITIES.NORMAL,
    status: payload.status || NOTIFICATION_STATUSES.DRAFT,
    target_audience: payload.targetAudience || TARGET_AUDIENCES.ALL,
    institution_id: payload.institutionId || null,
    affected_resources: Array.isArray(payload.affectedResources) ? payload.affectedResources : [],
    scheduled_start_at: payload.scheduledStartAt || null,
    scheduled_end_at: payload.scheduledEndAt || null,
    published_at: payload.publishedAt || (payload.status === NOTIFICATION_STATUSES.PUBLISHED ? new Date().toISOString() : null),
    timezone: payload.timezone || "America/Sao_Paulo"
  };

  const { data, error } = await supabase
    .from("institutional_notifications")
    .insert([record])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Atualiza um comunicado existente (Admin)
 */
export async function updateNotification(id, payload) {
  if (!id || !isSupabaseConfigured()) throw new Error("ID ou Supabase ausente.");

  if (payload.status === NOTIFICATION_STATUSES.PUBLISHED || payload.status === NOTIFICATION_STATUSES.SCHEDULED) {
    const val = validateTemplatePlaceholders(payload.title, payload.message);
    if (!val.valid) throw new Error(val.error);
  }

  const supabase = getSupabaseClient();
  const updateData = {};
  if (payload.title !== undefined) updateData.title = payload.title.trim();
  if (payload.message !== undefined) updateData.message = payload.message.trim();
  if (payload.type !== undefined) updateData.type = payload.type;
  if (payload.priority !== undefined) updateData.priority = payload.priority;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.targetAudience !== undefined) updateData.target_audience = payload.targetAudience;
  if (payload.institutionId !== undefined) updateData.institution_id = payload.institutionId;
  if (payload.affectedResources !== undefined) updateData.affected_resources = payload.affectedResources;
  if (payload.scheduledStartAt !== undefined) updateData.scheduled_start_at = payload.scheduledStartAt;
  if (payload.scheduledEndAt !== undefined) updateData.scheduled_end_at = payload.scheduledEndAt;
  if (payload.publishedAt !== undefined) updateData.published_at = payload.publishedAt;
  if (payload.timezone !== undefined) updateData.timezone = payload.timezone;

  const { data, error } = await supabase
    .from("institutional_notifications")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Publica imediatamente um comunicado.
 */
export async function publishNotification(id) {
  return updateNotification(id, {
    status: NOTIFICATION_STATUSES.PUBLISHED,
    publishedAt: new Date().toISOString()
  });
}

/**
 * Marca uma manutenção como iniciada.
 */
export async function startMaintenance(id) {
  return updateNotification(id, {
    status: NOTIFICATION_STATUSES.IN_PROGRESS,
    type: NOTIFICATION_TYPES.MAINTENANCE_IN_PROGRESS
  });
}

/**
 * Conclui uma manutenção com confirmação administrativa explícita.
 * Nunca conclui automaticamente apenas pelo encerramento do horário.
 */
export async function completeMaintenance(id, completionNotes = "") {
  const updatePayload = {
    status: NOTIFICATION_STATUSES.COMPLETED,
    type: NOTIFICATION_TYPES.MAINTENANCE_COMPLETED
  };
  if (completionNotes) {
    // Pode anexar notas de conclusão à mensagem
    const existing = await fetchAdminNotifications({ query: "" });
    const current = existing.data.find(n => n.id === id);
    if (current) {
      updatePayload.message = `${current.message}\n\n[Conclusão confirmada em ${formatNotificationDate(new Date().toISOString())}]: ${completionNotes}`;
    }
  }
  return updateNotification(id, updatePayload);
}

/**
 * Adia uma manutenção configurando nova janela de início/término.
 */
export async function postponeMaintenance(id, { newStartAt, newEndAt, reason = "" }) {
  return updateNotification(id, {
    status: NOTIFICATION_STATUSES.POSTPONED,
    type: NOTIFICATION_TYPES.MAINTENANCE_POSTPONED,
    scheduledStartAt: newStartAt,
    scheduledEndAt: newEndAt
  });
}

/**
 * Cancela uma manutenção programada.
 */
export async function cancelNotification(id, reason = "") {
  return updateNotification(id, {
    status: NOTIFICATION_STATUSES.CANCELLED,
    type: NOTIFICATION_TYPES.MAINTENANCE_CANCELLED
  });
}
