import { useState, useEffect, useCallback, useMemo } from "react";
import {
  A26Button,
  A26Card,
  A26EmptyState,
  A26Field,
  A26Modal,
  A26Toolbar
} from "../../../components/aeternum-26";
import LineIcon from "../../../components/icons/LineIcon";
import {
  AFFECTED_RESOURCES_CATALOG,
  cancelNotification,
  completeMaintenance,
  createNotification,
  fetchAdminNotifications,
  fillMaintenanceTemplate,
  formatMaintenanceWindow,
  formatNotificationDate,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
  postponeMaintenance,
  publishNotification,
  STANDARD_MAINTENANCE_TEMPLATE_ES,
  STANDARD_MAINTENANCE_TEMPLATE_PT,
  startMaintenance,
  TARGET_AUDIENCES,
  updateNotification,
  validateTemplatePlaceholders
} from "../../../services/notifications/institutionalNotificationService";
import { useLanguage } from "../../../context/LanguageContext";

export default function AnnouncementsManagementSection({ scope, data, notify = () => {} }) {
  const { language } = useLanguage();
  const isEs = language === "es";

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modais de Criação e Edição
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: NOTIFICATION_TYPES.SCHEDULED_MAINTENANCE,
    priority: NOTIFICATION_PRIORITIES.NORMAL,
    status: NOTIFICATION_STATUSES.DRAFT,
    targetAudience: TARGET_AUDIENCES.ALL,
    institutionId: "",
    affectedResources: [],
    scheduledStartAt: "",
    scheduledEndAt: "",
    publishedAt: "",
    timezone: "America/Sao_Paulo"
  });

  // Confirmações
  const [actionConfirmation, setActionConfirmation] = useState(null);
  const [postponeModal, setPostponeModal] = useState(null);
  const [auditLogModal, setAuditLogModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminNotifications({
        status: statusFilter !== "all" ? statusFilter : undefined,
        query: search
      });
      setAnnouncements(res.data || []);
    } catch (err) {
      notify("Erro ao carregar avisos: " + (err.message || "Falha na consulta."));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, notify]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  function handleOpenCreate() {
    setEditingItem(null);
    setFormData({
      title: "",
      message: "",
      type: NOTIFICATION_TYPES.SCHEDULED_MAINTENANCE,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      status: NOTIFICATION_STATUSES.DRAFT,
      targetAudience: TARGET_AUDIENCES.ALL,
      institutionId: "",
      affectedResources: ["Tutor IA", "Visualizador 3D"],
      scheduledStartAt: "",
      scheduledEndAt: "",
      publishedAt: "",
      timezone: "America/Sao_Paulo"
    });
    setEditorOpen(true);
  }

  function handleOpenEdit(item) {
    setEditingItem(item);
    setFormData({
      title: item.title,
      message: item.message,
      type: item.type,
      priority: item.priority,
      status: item.status,
      targetAudience: item.target_audience || item.targetAudience || TARGET_AUDIENCES.ALL,
      institutionId: item.institution_id || item.institutionId || "",
      affectedResources: item.affected_resources || item.affectedResources || [],
      scheduledStartAt: item.scheduled_start_at ? item.scheduled_start_at.slice(0, 16) : "",
      scheduledEndAt: item.scheduled_end_at ? item.scheduled_end_at.slice(0, 16) : "",
      publishedAt: item.published_at ? item.published_at.slice(0, 16) : "",
      timezone: item.timezone || "America/Sao_Paulo"
    });
    setEditorOpen(true);
  }

  function handleApplyStandardTemplate() {
    const tpl = isEs ? STANDARD_MAINTENANCE_TEMPLATE_ES : STANDARD_MAINTENANCE_TEMPLATE_PT;
    let messageText = tpl.message;

    // Se datas já foram preenchidas, substitui automaticamente
    if (formData.scheduledStartAt) {
      const start = new Date(formData.scheduledStartAt);
      const end = formData.scheduledEndAt ? new Date(formData.scheduledEndAt) : null;
      const dateStr = start.toLocaleDateString(isEs ? "es-ES" : "pt-BR");
      const startTimeStr = start.toLocaleTimeString(isEs ? "es-ES" : "pt-BR", { hour: "2-digit", minute: "2-digit" });
      const endTimeStr = end
        ? end.toLocaleTimeString(isEs ? "es-ES" : "pt-BR", { hour: "2-digit", minute: "2-digit" })
        : "término a definir";

      messageText = fillMaintenanceTemplate(messageText, {
        date: dateStr,
        startTime: startTimeStr,
        endTime: endTimeStr
      });
    }

    setFormData(prev => ({
      ...prev,
      title: tpl.title,
      message: messageText,
      type: NOTIFICATION_TYPES.SCHEDULED_MAINTENANCE
    }));
  }

  async function handleSaveAnnouncement(overrideStatus) {
    const effectiveStatus = overrideStatus || formData.status;

    // Se publicar imediatamente ou agendar, validar placeholders
    if (effectiveStatus === NOTIFICATION_STATUSES.PUBLISHED || effectiveStatus === NOTIFICATION_STATUSES.SCHEDULED) {
      const val = validateTemplatePlaceholders(formData.title, formData.message);
      if (!val.valid) {
        notify(val.error);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        priority: formData.priority,
        status: effectiveStatus,
        targetAudience: formData.targetAudience,
        institutionId: formData.institutionId || null,
        affectedResources: formData.affectedResources,
        scheduledStartAt: formData.scheduledStartAt ? new Date(formData.scheduledStartAt).toISOString() : null,
        scheduledEndAt: formData.scheduledEndAt ? new Date(formData.scheduledEndAt).toISOString() : null,
        publishedAt:
          effectiveStatus === NOTIFICATION_STATUSES.PUBLISHED && !formData.publishedAt
            ? new Date().toISOString()
            : formData.publishedAt
            ? new Date(formData.publishedAt).toISOString()
            : null,
        timezone: formData.timezone
      };

      if (editingItem?.id) {
        await updateNotification(editingItem.id, payload);
        notify("Comunicado atualizado com sucesso.");
      } else {
        await createNotification(payload);
        notify("Comunicado cadastrado com sucesso.");
      }

      setEditorOpen(false);
      await loadAnnouncements();
    } catch (err) {
      notify("Erro ao salvar comunicado: " + (err.message || "Erro desconhecido"));
    } finally {
      setSaving(false);
    }
  }

  async function handleExecuteAction() {
    if (!actionConfirmation) return;
    const { action, id, notes } = actionConfirmation;
    setSaving(true);
    try {
      if (action === "publish") {
        await publishNotification(id);
        notify("Comunicado publicado para os estudantes.");
      } else if (action === "start") {
        await startMaintenance(id);
        notify("Manutenção marcada como em andamento.");
      } else if (action === "complete") {
        await completeMaintenance(id, notes || "Manutenção finalizada com sucesso pela administração.");
        notify("Manutenção concluída com confirmação administrativa.");
      } else if (action === "cancel") {
        await cancelNotification(id, notes || "Cancelada pela administração.");
        notify("Manutenção cancelada.");
      }
      setActionConfirmation(null);
      await loadAnnouncements();
    } catch (err) {
      notify("Erro ao executar ação: " + (err.message || "Falha na transição."));
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmPostpone() {
    if (!postponeModal?.id || !postponeModal.newStartAt) return;
    setSaving(true);
    try {
      await postponeMaintenance(postponeModal.id, {
        newStartAt: new Date(postponeModal.newStartAt).toISOString(),
        newEndAt: postponeModal.newEndAt ? new Date(postponeModal.newEndAt).toISOString() : null,
        reason: postponeModal.reason
      });
      notify("Manutenção adiada com sucesso.");
      setPostponeModal(null);
      await loadAnnouncements();
    } catch (err) {
      notify("Erro ao adiar manutenção: " + (err.message || "Falha."));
    } finally {
      setSaving(false);
    }
  }

  function toggleResource(resource) {
    setFormData(prev => {
      const exists = prev.affectedResources.includes(resource);
      return {
        ...prev,
        affectedResources: exists
          ? prev.affectedResources.filter(r => r !== resource)
          : [...prev.affectedResources, resource]
      };
    });
  }

  return (
    <div className="admin26-section-container">
      <header className="admin26-section-header">
        <div>
          <h2>{isEs ? "Gestión de Comunicados y Actualizaciones" : "Gestão de Comunicados e Atualizações"}</h2>
          <p className="admin26-subtitle">
            {isEs
              ? "Programación de mantenimientos técnicos, anuncios y avisos con impacto mínimo en producción."
              : "Programação de manutenções técnicas, comunicados e avisos com impacto mínimo em produção."}
          </p>
        </div>
        <A26Button variant="primary" onClick={handleOpenCreate} icon={<LineIcon name="note" />}>
          {isEs ? "Nuevo comunicado" : "Novo comunicado"}
        </A26Button>
      </header>

      <A26Toolbar label="Filtros de comunicados" className="admin26-toolbar">
        <A26Field
          as="select"
          label={isEs ? "Estado operacional" : "Status operacional"}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">{isEs ? "Todos los estados" : "Todos os status"}</option>
          <option value="draft">{isEs ? "Borradores" : "Rascunhos"}</option>
          <option value="scheduled">{isEs ? "Programados" : "Programados"}</option>
          <option value="published">{isEs ? "Publicados" : "Publicados"}</option>
          <option value="in_progress">{isEs ? "En curso" : "Em andamento"}</option>
          <option value="completed">{isEs ? "Concluidos" : "Concluídos"}</option>
          <option value="postponed">{isEs ? "Pospuestos" : "Adiados"}</option>
          <option value="cancelled">{isEs ? "Cancelados" : "Cancelados"}</option>
        </A26Field>

        <A26Field
          label={isEs ? "Buscar comunicados" : "Buscar comunicados"}
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={isEs ? "Título do comunicado..." : "Título do comunicado..."}
        />

        <A26Button onClick={loadAnnouncements} loading={loading} icon={<LineIcon name="refresh" />}>
          {isEs ? "Actualizar" : "Atualizar"}
        </A26Button>
      </A26Toolbar>

      {/* Lista de Comunicados */}
      <div className="admin26-table-wrap">
        {announcements.length === 0 ? (
          <A26EmptyState
            title={isEs ? "Sin comunicados" : "Nenhum comunicado cadastrado"}
            text={isEs ? "Crea un nuevo comunicado institucional para informar a los estudiantes." : "Crie um novo comunicado institucional para informar os estudantes sobre manutenções e novidades."}
            action={<A26Button variant="primary" onClick={handleOpenCreate}>{isEs ? "Crear comunicado" : "Criar comunicado"}</A26Button>}
          />
        ) : (
          <table className="admin26-table" aria-label="Tabela de Comunicados Institucionais">
            <thead>
              <tr>
                <th>Título / Tipo</th>
                <th>Status</th>
                <th>Público-alvo</th>
                <th>Janela de Manutenção</th>
                <th>Publicação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map(item => {
                const windowLabel = formatMaintenanceWindow(
                  item.scheduled_start_at,
                  item.scheduled_end_at,
                  language,
                  item.timezone
                );

                return (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                      <div className="text-xs text-white/50">{item.type} · Prioridade: {item.priority}</div>
                      {item.affected_resources && item.affected_resources.length > 0 ? (
                        <div className="flex gap-1 mt-1">
                          {item.affected_resources.map(r => (
                            <span key={r} className="a26-resource-tag">{r}</span>
                          ))}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <span className={`a26-notification-type-pill a26-type-${item.type}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>{item.target_audience || "all"}</td>
                    <td>
                      {windowLabel ? (
                        <small className="text-amber-400 font-mono">{windowLabel}</small>
                      ) : (
                        <small className="text-white/40">Não aplicável</small>
                      )}
                    </td>
                    <td>
                      {item.published_at ? (
                        <small>{formatNotificationDate(item.published_at, language, item.timezone)}</small>
                      ) : (
                        <small className="text-white/40">Não publicado</small>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          type="button"
                          className="admin26-action-link"
                          onClick={() => handleOpenEdit(item)}
                        >
                          Editar
                        </button>

                        {item.status === "draft" || item.status === "scheduled" ? (
                          <button
                            type="button"
                            className="admin26-action-link text-emerald-400"
                            onClick={() => setActionConfirmation({ action: "publish", id: item.id, title: item.title })}
                          >
                            Publicar
                          </button>
                        ) : null}

                        {item.status === "published" || item.status === "scheduled" ? (
                          <button
                            type="button"
                            className="admin26-action-link text-cyan-400"
                            onClick={() => setActionConfirmation({ action: "start", id: item.id, title: item.title })}
                          >
                            Iniciar
                          </button>
                        ) : null}

                        {item.status === "in_progress" ? (
                          <button
                            type="button"
                            className="admin26-action-link text-emerald-300 font-bold"
                            onClick={() => setActionConfirmation({ action: "complete", id: item.id, title: item.title })}
                          >
                            Concluir
                          </button>
                        ) : null}

                        {item.status !== "completed" && item.status !== "cancelled" ? (
                          <button
                            type="button"
                            className="admin26-action-link text-orange-400"
                            onClick={() => setPostponeModal({ id: item.id, title: item.title, newStartAt: "", newEndAt: "", reason: "" })}
                          >
                            Adiar
                          </button>
                        ) : null}

                        {item.status !== "cancelled" && item.status !== "completed" ? (
                          <button
                            type="button"
                            className="admin26-action-link text-rose-400"
                            onClick={() => setActionConfirmation({ action: "cancel", id: item.id, title: item.title })}
                          >
                            Cancelar
                          </button>
                        ) : null}

                        {item.notification_audit_log && item.notification_audit_log.length > 0 ? (
                          <button
                            type="button"
                            className="admin26-action-link text-purple-300"
                            onClick={() => setAuditLogModal({ title: item.title, logs: item.notification_audit_log })}
                          >
                            Auditoria ({item.notification_audit_log.length})
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Editor / Criação */}
      <A26Modal
        open={editorOpen}
        title={editingItem ? "Editar Comunicado Institucional" : "Novo Comunicado Institucional"}
        description="Configure os parâmetros, público-alvo e janela de manutenção com fuso de Brasília."
        onClose={() => !saving && setEditorOpen(false)}
        actions={
          <div className="flex gap-2 justify-end w-full">
            <A26Button onClick={() => setEditorOpen(false)} disabled={saving}>Cancelar</A26Button>
            <A26Button variant="secondary" onClick={() => handleSaveAnnouncement("draft")} disabled={saving}>
              Salvar como rascunho
            </A26Button>
            <A26Button variant="primary" onClick={() => handleSaveAnnouncement()} loading={saving}>
              Salvar e confirmar
            </A26Button>
          </div>
        }
      >
        <div className="grid gap-3 py-2">
          <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
            <span className="text-xs text-white/70">Modelo padronizado de manutenção:</span>
            <A26Button variant="ghost" onClick={handleApplyStandardTemplate}>
              Inserir texto padrão de manutenção
            </A26Button>
          </div>

          <A26Field
            label="Título do comunicado *"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Atualização programada — Aeternum Atlas"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <A26Field
              as="select"
              label="Tipo de aviso *"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
            >
              <option value={NOTIFICATION_TYPES.SCHEDULED_MAINTENANCE}>Atualização programada</option>
              <option value={NOTIFICATION_TYPES.MAINTENANCE_IN_PROGRESS}>Manutenção em andamento</option>
              <option value={NOTIFICATION_TYPES.MAINTENANCE_COMPLETED}>Manutenção concluída</option>
              <option value={NOTIFICATION_TYPES.MAINTENANCE_POSTPONED}>Manutenção adiada</option>
              <option value={NOTIFICATION_TYPES.MAINTENANCE_CANCELLED}>Manutenção cancelada</option>
              <option value={NOTIFICATION_TYPES.PLATFORM_IMPROVEMENT}>Melhoria ou nova função</option>
              <option value={NOTIFICATION_TYPES.INSTITUTIONAL_ANNOUNCEMENT}>Comunicado institucional</option>
            </A26Field>

            <A26Field
              as="select"
              label="Prioridade *"
              value={formData.priority}
              onChange={e => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value={NOTIFICATION_PRIORITIES.LOW}>Baixa</option>
              <option value={NOTIFICATION_PRIORITIES.NORMAL}>Normal</option>
              <option value={NOTIFICATION_PRIORITIES.HIGH}>Alta</option>
              <option value={NOTIFICATION_PRIORITIES.CRITICAL}>Crítica</option>
            </A26Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <A26Field
              as="select"
              label="Público-alvo *"
              value={formData.targetAudience}
              onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
            >
              <option value={TARGET_AUDIENCES.ALL}>Todos os estudantes e docentes</option>
              <option value={TARGET_AUDIENCES.STUDENTS}>Apenas estudantes</option>
              <option value={TARGET_AUDIENCES.TEACHERS}>Apenas professores</option>
              <option value={TARGET_AUDIENCES.INSTITUTION_ADMINS}>Apenas administradores</option>
            </A26Field>

            <A26Field
              as="select"
              label="Estado inicial *"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
            >
              <option value={NOTIFICATION_STATUSES.DRAFT}>Rascunho (não visível)</option>
              <option value={NOTIFICATION_STATUSES.SCHEDULED}>Programado (visível após data)</option>
              <option value={NOTIFICATION_STATUSES.PUBLISHED}>Publicar agora</option>
            </A26Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <A26Field
              type="datetime-local"
              label="Início previsto da manutenção (Brasília)"
              value={formData.scheduledStartAt}
              onChange={e => setFormData({ ...formData, scheduledStartAt: e.target.value })}
            />
            <A26Field
              type="datetime-local"
              label="Término previsto da manutenção (Brasília)"
              value={formData.scheduledEndAt}
              onChange={e => setFormData({ ...formData, scheduledEndAt: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs text-white/70 block mb-1">Recursos potencialmente afetados:</label>
            <div className="flex flex-wrap gap-1.5">
              {AFFECTED_RESOURCES_CATALOG.map(res => {
                const selected = formData.affectedResources.includes(res);
                return (
                  <button
                    key={res}
                    type="button"
                    onClick={() => toggleResource(res)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                      selected
                        ? "bg-teal-500/20 border-teal-400 text-teal-300"
                        : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                    }`}
                  >
                    {res} {selected ? "✓" : "+"}
                  </button>
                );
              })}
            </div>
          </div>

          <A26Field
            as="textarea"
            rows={6}
            label="Mensagem completa do comunicado *"
            value={formData.message}
            onChange={e => setFormData({ ...formData, message: e.target.value })}
            placeholder="Digite o texto detalhado para os estudantes..."
            required
          />
        </div>
      </A26Modal>

      {/* Modal de Confirmação de Ações Operacionais */}
      <A26Modal
        open={Boolean(actionConfirmation)}
        title={
          actionConfirmation?.action === "publish"
            ? "Publicar comunicado imediatamente?"
            : actionConfirmation?.action === "start"
            ? "Marcar manutenção como em andamento?"
            : actionConfirmation?.action === "complete"
            ? "Confirmar conclusão de manutenção?"
            : "Cancelar manutenção?"
        }
        description="Esta operação altera o status oficial visualizado por todos os estudantes autorizados."
        onClose={() => !saving && setActionConfirmation(null)}
        actions={
          <>
            <A26Button onClick={() => setActionConfirmation(null)} disabled={saving}>Cancelar</A26Button>
            <A26Button
              variant={actionConfirmation?.action === "cancel" ? "danger" : "primary"}
              onClick={handleExecuteAction}
              loading={saving}
            >
              Confirmar operação
            </A26Button>
          </>
        }
      >
        <p>Aviso: <strong>{actionConfirmation?.title}</strong></p>
        {actionConfirmation?.action === "complete" ? (
          <A26Field
            label="Notas de conclusão (opcional)"
            placeholder="Descreva as verificações técnicas realizadas..."
            onChange={e => setActionConfirmation({ ...actionConfirmation, notes: e.target.value })}
          />
        ) : null}
      </A26Modal>

      {/* Modal de Adiar Manutenção */}
      <A26Modal
        open={Boolean(postponeModal)}
        title="Adiar Manutenção Programada"
        description="Defina os novos horários e a justificativa para atualização aos estudantes."
        onClose={() => !saving && setPostponeModal(null)}
        actions={
          <>
            <A26Button onClick={() => setPostponeModal(null)} disabled={saving}>Cancelar</A26Button>
            <A26Button variant="primary" onClick={handleConfirmPostpone} loading={saving}>
              Confirmar adiamento
            </A26Button>
          </>
        }
      >
        <div className="grid gap-3 py-2">
          <p>Manutenção: <strong>{postponeModal?.title}</strong></p>
          <A26Field
            type="datetime-local"
            label="Novo início previsto (Brasília) *"
            value={postponeModal?.newStartAt || ""}
            onChange={e => setPostponeModal({ ...postponeModal, newStartAt: e.target.value })}
            required
          />
          <A26Field
            type="datetime-local"
            label="Novo término previsto (Brasília)"
            value={postponeModal?.newEndAt || ""}
            onChange={e => setPostponeModal({ ...postponeModal, newEndAt: e.target.value })}
          />
          <A26Field
            as="textarea"
            rows={3}
            label="Motivo do adiamento (visível aos estudantes)"
            placeholder="Ex: Ajuste na janela técnica de validação."
            value={postponeModal?.reason || ""}
            onChange={e => setPostponeModal({ ...postponeModal, reason: e.target.value })}
          />
        </div>
      </A26Modal>

      {/* Modal de Trilha de Auditoria */}
      <A26Modal
        open={Boolean(auditLogModal)}
        title={`Trilha de Auditoria: ${auditLogModal?.title}`}
        description="Histórico de alterações e transições administrativas registradas no banco."
        onClose={() => setAuditLogModal(null)}
        actions={<A26Button variant="primary" onClick={() => setAuditLogModal(null)}>Fechar</A26Button>}
      >
        <div className="divide-y divide-white/10 max-h-96 overflow-y-auto">
          {(auditLogModal?.logs || []).map((log, idx) => (
            <div key={log.id || idx} className="py-2 text-xs">
              <div className="flex justify-between text-white/50 mb-0.5">
                <span>Ação: <strong className="text-teal-300 uppercase">{log.action}</strong></span>
                <span>{formatNotificationDate(log.created_at, language)}</span>
              </div>
              <div className="text-white/70">Papel: {log.actor_role || "Não registrado"}</div>
              {log.details ? (
                <pre className="mt-1 p-1.5 bg-black/30 rounded text-[10px] text-white/60 overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              ) : null}
            </div>
          ))}
        </div>
      </A26Modal>
    </div>
  );
}
