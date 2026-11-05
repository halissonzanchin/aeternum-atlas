import { useMemo, useState } from "react";
import AgendaCalendar from "../../components/student/agenda/AgendaCalendar";
import AgendaDayPanel from "../../components/student/agenda/AgendaDayPanel";
import AgendaHourlyGrid from "../../components/student/agenda/AgendaHourlyGrid";
import AgendaPopoverModal from "../../components/student/agenda/AgendaPopoverModal";
import AgendaSidebar from "../../components/student/agenda/AgendaSidebar";
import AgendaTaskModal from "../../components/student/agenda/AgendaTaskModal";
import UpcomingReviews from "../../components/student/agenda/UpcomingReviews";
import WeeklyStudySummary from "../../components/student/agenda/WeeklyStudySummary";
import LineIcon from "../../components/icons/LineIcon";
import { formatAgendaDate, parseAgendaDate, useStudyAgenda } from "../../hooks/useStudyAgenda";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { A26Button, A26Card, A26FeatureShell, A26Metric, A26Modal, A26PageHeader, A26SegmentedControl } from "../../components/aeternum-26";
import { generateStudyPlanProposal, commitProposedStudyPlan } from "../../services/studyAgendaService";
import "../../styles/A26StudyAgenda.css";

export default function StudyAgendaPage({ navigate }) {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const agenda = useStudyAgenda();

  const [displayMode, setDisplayMode] = useState("month"); // 'month' | 'hourly_week' | 'day'
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [popoverEvent, setPopoverEvent] = useState(null);

  // Synchronized layers filter
  const [layersFilter, setLayersFilter] = useState({
    student: true,
    teacher: true,
    institution: true,
    ai_tutor: true
  });

  const [selectedSystem, setSelectedSystem] = useState("all");

  function shiftDate(direction) {
    const curr = parseAgendaDate(agenda.selectedDate);
    if (displayMode === "month") {
      const next = new Date(curr);
      next.setMonth(next.getMonth() + direction);
      agenda.setSelectedDate(next);
    } else if (displayMode === "hourly_week") {
      const next = new Date(curr);
      next.setDate(next.getDate() + direction * 7);
      agenda.setSelectedDate(next);
    } else {
      const next = new Date(curr);
      next.setDate(next.getDate() + direction);
      agenda.setSelectedDate(next);
    }
  }

  const headerTitle = useMemo(() => {
    const safeSelected = parseAgendaDate(agenda.selectedDate);
    const localeMap = { pt: "pt-BR", es: "es-ES", en: "en-US", de: "de-DE" };
    const loc = localeMap[language] || "pt-BR";
    if (displayMode === "month") {
      const monthStr = new Intl.DateTimeFormat(loc, { month: "long", year: "numeric" }).format(safeSelected);
      return monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
    }
    if (displayMode === "hourly_week") {
      const day = safeSelected.getDay();
      const diff = safeSelected.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(safeSelected);
      start.setDate(diff);
      const startStr = new Intl.DateTimeFormat(loc, { day: "2-digit", month: "short" }).format(start);
      return t("agenda.weekOf", { start: startStr, defaultValue: `Semana de ${startStr}` });
    }
    const dayStr = new Intl.DateTimeFormat(loc, { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(safeSelected);
    return dayStr.charAt(0).toUpperCase() + dayStr.slice(1);
  }, [agenda.selectedDate, displayMode, language, t]);

  // Filter events based on active layers & anatomical system
  const filteredEventsMap = useMemo(() => {
    const map = new Map();
    const eventList = Array.isArray(agenda?.events) ? agenda.events : [];
    eventList.forEach(evt => {
      if (!evt) return;
      const role = evt.createdByRole || "student";
      if (layersFilter && !layersFilter[role]) return;

      if (selectedSystem !== "all" && evt.anatomicalSystem !== selectedSystem) {
        return;
      }

      const key = evt.date;
      if (key) {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(evt);
      }
    });
    return map;
  }, [agenda?.events, layersFilter, selectedSystem]);

  const selectedEvents = useMemo(() => {
    if (!agenda?.selectedDate) return [];
    const key = formatAgendaDate(agenda.selectedDate);
    return filteredEventsMap.get(key) || [];
  }, [filteredEventsMap, agenda?.selectedDate]);

  const weeklySummary = useMemo(() => {
    if (typeof agenda?.getWeeklySummary === 'function') {
      return agenda.getWeeklySummary();
    }
    return { scheduled: 0, completed: 0, pending: 0, plannedMinutes: 0, completionRate: 0 };
  }, [agenda]);

  const upcomingReviews = useMemo(() => {
    if (typeof agenda?.getUpcomingReviews === 'function') {
      return agenda.getUpcomingReviews();
    }
    return [];
  }, [agenda]);

  function openNewActivity() {
    setEditingEvent(null);
    setModalOpen(true);
  }

  function openEditActivity(event) {
    setEditingEvent(event);
    setModalOpen(true);
  }

  async function submitActivity(payload) {
    let result;
    if (editingEvent) {
      result = await agenda.updateEvent(editingEvent.id, payload);
    } else {
      result = await agenda.addEvent({
        ...payload,
        date: payload.date || formatAgendaDate(agenda.selectedDate),
        createdByRole: "student",
        creatorName: user?.name || user?.email || "Usuário"
      });
    }
    if (result?.success === false) return result;
    setModalOpen(false);
    setEditingEvent(null);
    return result || { success: true };
  }

  // AI Study Plan Proposal state
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planTopic, setPlanTopic] = useState("");
  const [planHours, setPlanHours] = useState(10);
  const [planDays, setPlanDays] = useState(5);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planProposals, setPlanProposals] = useState([]);
  const [selectedProposals, setSelectedProposals] = useState({});
  const [planError, setPlanError] = useState("");
  const [planSuccessNotice, setPlanSuccessNotice] = useState("");

  async function handleGeneratePlan() {
    if (!planTopic.trim()) {
      setPlanError("Informe o tema anatômico para o cronograma.");
      return;
    }
    setIsGeneratingPlan(true);
    setPlanError("");
    try {
      const res = await generateStudyPlanProposal({
        user,
        topic: planTopic,
        availableHours: Number(planHours) || 10,
        daysCount: Number(planDays) || 5,
        language: language || "pt"
      });
      if (res.success && res.proposals?.length) {
        setPlanProposals(res.proposals);
        const initialSelected = {};
        res.proposals.forEach((p) => { initialSelected[p.id] = true; });
        setSelectedProposals(initialSelected);
      } else {
        setPlanError(res.error || "Não foi possível gerar a proposta de cronograma.");
      }
    } catch (err) {
      setPlanError(err?.message || "Erro ao conectar com o Tutor IA.");
    } finally {
      setIsGeneratingPlan(false);
    }
  }

  async function handleCommitPlan() {
    const toCommit = planProposals.filter((p) => selectedProposals[p.id]);
    if (!toCommit.length) {
      setPlanError("Selecione ao menos uma sessão para adicionar à sua agenda.");
      return;
    }
    setIsGeneratingPlan(true);
    try {
      const res = await commitProposedStudyPlan(user, toCommit);
      if (res.success) {
        setPlanSuccessNotice(`${res.count} sessões de estudo adicionadas à sua agenda!`);
        setPlanModalOpen(false);
        setPlanProposals([]);
        for (const evt of res.inserted) {
          await agenda.addEvent(evt);
        }
      } else {
        setPlanError(res.error || "Erro ao salvar as sessões.");
      }
    } catch (err) {
      setPlanError(err?.message || "Erro ao salvar na agenda.");
    } finally {
      setIsGeneratingPlan(false);
    }
  }

  return (
    <A26FeatureShell
      variant="tool"
      className="study-agenda-page fade-in-up"
      data-testid="a26-student-agenda"
      data-a26-source="account-persisted"
      header={
        <A26PageHeader
          eyebrow={t("studyAgenda.eyebrow")}
          title={t("studyAgenda.title")}
          description={t("studyAgenda.subtitle")}
        />
      }
    >
      {/* Google Calendar Style Unified Top Header Bar */}
      <A26Card as="div" material="substantial" tone="teal" className="study-agenda-top-bar">
        <div className="study-agenda-top-bar__left">
          <A26Button
            variant="secondary"
            className="a26-today-btn"
            onClick={() => agenda.setSelectedDate(new Date())}
          >
            🎯 {t("agenda.today", { defaultValue: "Hoje" })}
          </A26Button>
          <div className="a26-calendar-nav-arrows">
            <button className="a26-nav-arrow" onClick={() => shiftDate(-1)} aria-label={t("agenda.previous", { defaultValue: "Anterior" })}>
              ‹
            </button>
            <button className="a26-nav-arrow" onClick={() => shiftDate(1)} aria-label={t("agenda.next", { defaultValue: "Próximo" })}>
              ›
            </button>
          </div>
          <h2 className="a26-header-month-title">{headerTitle}</h2>
          <div className="a26-hero-sync-badges" aria-label="Estado da agenda">
            <span className={`a26-hero-sync-badge ${agenda.syncStatus === "synced" ? "is-active" : ""}`}>
              {agenda.syncStatus === "synced" ? t("agenda.accountSynced", { defaultValue: "Conta sincronizada" }) : agenda.syncStatus === "pending" ? t("agenda.syncPending", { defaultValue: "Sincronização pendente" }) : t("agenda.localAgenda", { defaultValue: "Agenda local" })}
            </span>
            <span className="a26-hero-sync-badge">{t("agenda.activitiesCount", { count: agenda.events.length, defaultValue: `${agenda.events.length} atividades` })}</span>
          </div>
        </div>

        <div className="a26-hero-actions" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <A26Button
            variant="secondary"
            className="a26-ai-plan-btn"
            onClick={() => {
              setPlanError("");
              setPlanSuccessNotice("");
              setPlanModalOpen(true);
            }}
          >
            <LineIcon name="spark" /> {t("agenda.aiPlanButton", { defaultValue: "Planejar com IA" })}
          </A26Button>
          {/* Main Display Switcher (Google Calendar Pattern: Mês | Semana | Dia) */}
          <A26SegmentedControl
            className="a26-main-mode-switcher"
            label={t("agenda.viewSwitcherLabel", { defaultValue: "Visualização da agenda" })}
            value={displayMode}
            onChange={setDisplayMode}
            options={[
              { value: "month", label: t("agenda.monthView", { defaultValue: "Mês" }) },
              { value: "hourly_week", label: t("agenda.weekView", { defaultValue: "Grade semanal" }) },
              { value: "day", label: t("agenda.dayView", { defaultValue: "Dia" }) }
            ]}
          />
        </div>
      </A26Card>

      <div className="a26-weekly-quick-stats" aria-label="Resumo semanal real">
        <A26Metric label={t("agenda.scheduledMetric", { defaultValue: "Programadas" })} value={weeklySummary.scheduled} icon={<LineIcon name="clipboardCheck" />} />
        <A26Metric label={t("agenda.completedMetric", { defaultValue: "Concluídas" })} value={weeklySummary.completed} icon={<LineIcon name="check" />} />
        <A26Metric label={t("agenda.pendingMetric", { defaultValue: "Pendentes" })} value={weeklySummary.pending} icon={<LineIcon name="clock" />} />
        <A26Metric label={t("agenda.plannedTimeMetric", { defaultValue: "Tempo planejado" })} value={`${Math.round(weeklySummary.plannedMinutes / 60)}h ${weeklySummary.plannedMinutes % 60}m`} icon={<LineIcon name="clock" />} />
        <A26Metric label={t("agenda.consistencyMetric", { defaultValue: "Constância" })} value={`${weeklySummary.completionRate}%`} icon={<LineIcon name="spark" />} />
      </div>

      {/* Main Agenda Grid Layout (Sidebar 270px + Main Workspace 100%) */}
      <div className="study-agenda-main-grid">
        {/* Left Sidebar Filters & Mini Calendar */}
        <AgendaSidebar
          selectedDate={agenda.selectedDate}
          setSelectedDate={agenda.setSelectedDate}
          layersFilter={layersFilter}
          setLayersFilter={setLayersFilter}
          selectedSystem={selectedSystem}
          setSelectedSystem={setSelectedSystem}
          onNewActivity={openNewActivity}
          user={user}
          events={agenda.events}
          syncStatus={agenda.syncStatus}
        />

        {/* Center Main Workspace (100% Full Width Active View) */}
        <A26Card as="main" material="clear" className="a26-agenda-view-container">

          {displayMode === "hourly_week" ? (
            <AgendaHourlyGrid
              eventsByDate={filteredEventsMap}
              selectedDate={agenda.selectedDate}
              setSelectedDate={agenda.setSelectedDate}
              onSelectEvent={(evt) => setPopoverEvent(evt)}
              onNewActivity={openNewActivity}
            />
          ) : displayMode === "month" ? (
            <div className="a26-month-view-container">
              <AgendaCalendar
                eventsByDate={filteredEventsMap}
                selectedDate={agenda.selectedDate}
                setSelectedDate={agenda.setSelectedDate}
              />
              <div className="a26-day-panel-drawer">
                  <AgendaDayPanel
                    selectedDate={agenda.selectedDate}
                    events={selectedEvents}
                    onNew={openNewActivity}
                    onEdit={openEditActivity}
                    onDelete={agenda.deleteEvent}
                    onComplete={agenda.completeEvent}
                    navigate={navigate}
                  >
                    <WeeklyStudySummary summary={weeklySummary} />
                    <UpcomingReviews reviews={upcomingReviews} navigate={navigate} />
                  </AgendaDayPanel>
              </div>
            </div>
          ) : (
            <AgendaDayPanel
              selectedDate={agenda.selectedDate}
              events={selectedEvents}
              onNew={openNewActivity}
              onEdit={openEditActivity}
              onDelete={agenda.deleteEvent}
              onComplete={agenda.completeEvent}
              navigate={navigate}
            >
              <WeeklyStudySummary summary={weeklySummary} />
              <UpcomingReviews reviews={upcomingReviews} navigate={navigate} />
            </AgendaDayPanel>
          )}
        </A26Card>
      </div>

      {/* Floating Popover Event Modal */}
      {popoverEvent && (
        <AgendaPopoverModal
          event={popoverEvent}
          onClose={() => setPopoverEvent(null)}
          onComplete={agenda.completeEvent}
          onEdit={openEditActivity}
          onDelete={agenda.deleteEvent}
          navigate={navigate}
        />
      )}

      {/* Create / Edit Task Modal */}
      <AgendaTaskModal
        open={modalOpen}
        selectedDate={agenda.selectedDate}
        event={editingEvent}
        onClose={() => {
          setModalOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={submitActivity}
      />

      {/* AI Study Plan Proposal & Confirmation Modal */}
      <A26Modal
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title={t("agenda.planModalTitle", { defaultValue: "Planejar Cronograma de Estudos com IA" })}
        size="large"
      >
        <div className="a26-plan-modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {planSuccessNotice && (
            <div className="a26-alert a26-alert--success" style={{ padding: "0.75rem", borderRadius: "6px" }}>
              {planSuccessNotice}
            </div>
          )}
          {planError && (
            <div className="a26-alert a26-alert--error" style={{ color: "var(--color-error, #f87171)", padding: "0.75rem" }}>
              {planError}
            </div>
          )}

          {!planProposals.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <label>
                <strong>{t("agenda.planTopicLabel", { defaultValue: "Tema Anatômico:" })}</strong>
                <input
                  type="text"
                  className="a26-input"
                  style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem", borderRadius: "4px" }}
                  placeholder="Ex: Plexo Braquial, Coração, Osteologia da Pelve"
                  value={planTopic}
                  onChange={(e) => setPlanTopic(e.target.value)}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <label>
                  <span>{t("agenda.planHoursLabel", { defaultValue: "Horas de estudo totais:" })}</span>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    className="a26-input"
                    style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
                    value={planHours}
                    onChange={(e) => setPlanHours(e.target.value)}
                  />
                </label>
                <label>
                  <span>{t("agenda.planDaysLabel", { defaultValue: "Número de sessões:" })}</span>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    className="a26-input"
                    style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
                    value={planDays}
                    onChange={(e) => setPlanDays(e.target.value)}
                  />
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem", gap: "0.5rem" }}>
                <A26Button variant="secondary" onClick={() => setPlanModalOpen(false)}>
                  {t("common.cancel", { defaultValue: "Cancelar" })}
                </A26Button>
                <A26Button variant="primary" onClick={handleGeneratePlan} disabled={isGeneratingPlan}>
                  {isGeneratingPlan ? t("common.generating", { defaultValue: "Gerando cronograma..." }) : t("agenda.generatePlanAction", { defaultValue: "Gerar Proposta" })}
                </A26Button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p>
                <strong>Proposta gerada pelo Tutor IA:</strong> Revise as sessões abaixo e selecione quais deseja adicionar à sua agenda pessoal.
              </p>
              <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {planProposals.map((prop) => (
                  <label
                    key={prop.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      padding: "0.75rem",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "6px",
                      background: selectedProposals[prop.id] ? "rgba(79, 216, 201, 0.08)" : "transparent",
                      cursor: "pointer"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(selectedProposals[prop.id])}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectedProposals((prev) => ({ ...prev, [prop.id]: checked }));
                      }}
                      style={{ marginTop: "0.25rem" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{prop.title}</div>
                      <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                        📅 {prop.date} · ⏰ {prop.startTime} - {prop.endTime} · 🏷️ {prop.type}
                      </div>
                      <div style={{ fontSize: "0.82rem", marginTop: "0.25rem", opacity: 0.7 }}>
                        {prop.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                <A26Button variant="secondary" onClick={() => setPlanProposals([])}>
                  {t("common.back", { defaultValue: "Voltar e refazer" })}
                </A26Button>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <A26Button variant="secondary" onClick={() => setPlanModalOpen(false)}>
                    {t("common.cancel", { defaultValue: "Cancelar" })}
                  </A26Button>
                  <A26Button variant="primary" onClick={handleCommitPlan} disabled={isGeneratingPlan}>
                    {isGeneratingPlan ? t("common.saving", { defaultValue: "Salvando..." }) : t("agenda.confirmPlanAction", { defaultValue: "Confirmar e Adicionar" })}
                  </A26Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </A26Modal>
    </A26FeatureShell>
  );
}
