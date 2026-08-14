import { useState } from "react";
import LineIcon from "../../icons/LineIcon";
import { formatAgendaDate, parseAgendaDate } from "../../../hooks/useStudyAgenda";
import { useLanguage } from "../../../context/LanguageContext";
import { A26Button, A26Card, A26Sidebar, A26Surface } from "../../aeternum-26";
import { agendaAnatomicalSystems } from "../../../data/studyAgendaCatalog";

export default function AgendaSidebar({
  selectedDate,
  setSelectedDate,
  layersFilter,
  setLayersFilter,
  selectedSystem,
  setSelectedSystem,
  onNewActivity,
  user,
  events = [],
  syncStatus = "loading"
}) {
  const { language } = useLanguage();
  const [miniCursor, setMiniCursor] = useState(() => parseAgendaDate(selectedDate));

  function shiftMiniMonth(amount) {
    setMiniCursor(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + amount);
      return next;
    });
  }

  function toggleLayer(layerKey) {
    setLayersFilter(prev => ({
      ...prev,
      [layerKey]: !prev[layerKey]
    }));
  }

  // Generate 35 days for mini calendar
  const firstOfMonth = new Date(miniCursor.getFullYear(), miniCursor.getMonth(), 1);
  const startDay = firstOfMonth.getDay();
  const startDate = new Date(firstOfMonth);
  startDate.setDate(startDate.getDate() - (startDay === 0 ? 6 : startDay - 1));

  const miniDays = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });

  const rawTitle = new Intl.DateTimeFormat(language === "pt" ? "pt-BR" : "en-US", { month: "long", year: "numeric" }).format(miniCursor);
  const miniTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
  const layerDescriptors = [
    { key: "student", icon: "👤", title: "Minha agenda pessoal", detail: user?.name || user?.email || "Conta autenticada" },
    { key: "teacher", icon: "👨‍🏫", title: "Atividades de professores", detail: "Compartilhadas pela equipe docente" },
    { key: "institution", icon: "🏛️", title: "Agenda institucional", detail: "Avaliações e atividades compartilhadas" },
    { key: "ai_tutor", icon: "✦", title: "Sugestões do Atlas AI", detail: "Atividades realmente gravadas pelo Tutor" }
  ].map((descriptor) => ({
    ...descriptor,
    count: events.filter((event) => (event.createdByRole || "student") === descriptor.key).length
  })).filter((descriptor) => descriptor.key === "student" || descriptor.count > 0);

  const syncLabel = {
    synced: "Sincronizado",
    pending: "Pendente",
    local: "Local",
    "auth-required": "Sem sessão",
    loading: "Verificando"
  }[syncStatus] || "Indisponível";

  return (
    <A26Sidebar label="Filtros e calendário da agenda" className="a26-agenda-sidebar">
      {/* Primary Action Button (Google Calendar "+ Criar" Pattern) */}
      <A26Button variant="primary" className="a26-sidebar-create-btn" onClick={onNewActivity}>
        <span className="a26-sidebar-create-btn__icon">+</span>
        <span>Agendar Nova Atividade</span>
      </A26Button>

      {/* Mini Calendar Navigation */}
      <A26Card material="clear" className="a26-mini-calendar">
        <div className="a26-mini-calendar__header">
          <strong>{miniTitle}</strong>
          <div className="a26-mini-calendar__nav">
            <button onClick={() => shiftMiniMonth(-1)} aria-label="Mês anterior"><LineIcon name="chevron" /></button>
            <button onClick={() => shiftMiniMonth(1)} aria-label="Próximo mês"><LineIcon name="chevron" /></button>
          </div>
        </div>

        <div className="a26-mini-calendar__weekdays">
          {["S", "T", "Q", "Q", "S", "S", "D"].map((d, idx) => <span key={idx}>{d}</span>)}
        </div>

        <div className="a26-mini-calendar__grid">
          {miniDays.map(d => {
            const dateStr = formatAgendaDate(d);
            const isSelected = dateStr === formatAgendaDate(selectedDate);
            const isToday = dateStr === formatAgendaDate(new Date());
            const isOutside = d.getMonth() !== miniCursor.getMonth();

            return (
              <button
                key={dateStr}
                className={[
                  "a26-mini-day",
                  isOutside ? "is-outside" : "",
                  isToday ? "is-today" : "",
                  isSelected ? "is-selected" : ""
                ].join(" ")}
                onClick={() => setSelectedDate(d)}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </A26Card>

      <div className="a26-sidebar-systems">
        <div className="a26-sidebar-section-header">
          <h4 className="a26-sidebar-section-title">Foco anatômico</h4>
          {selectedSystem !== "all" ? <span className="a26-filter-active">Filtro ativo</span> : null}
        </div>
        <label className="a26-sidebar-filter-label" htmlFor="agenda-system-filter">
          Sistema exibido
        </label>
        <select
          id="agenda-system-filter"
          className="a26-sidebar-system-select"
          value={selectedSystem}
          onChange={(event) => setSelectedSystem(event.target.value)}
        >
          <option value="all">Todos os sistemas</option>
          {agendaAnatomicalSystems.map((system) => <option key={system} value={system}>{system}</option>)}
        </select>
      </div>

      {/* Camadas derivadas exclusivamente dos eventos observados. */}
      <div className="a26-sidebar-layers">
        <div className="a26-sidebar-section-header">
          <h4 className="a26-sidebar-section-title">Camadas da agenda</h4>
          <span className="a26-sync-live-badge">{syncLabel}</span>
        </div>
        {layerDescriptors.map((layer) => (
          <A26Surface material="clear" tone={layersFilter[layer.key] ? "teal" : "neutral"} key={layer.key} className={`a26-teacher-card ${layersFilter[layer.key] ? "is-active" : ""}`}>
            <div className={`a26-teacher-avatar is-${layer.key}`}>{layer.icon}</div>
            <div className="a26-teacher-info">
              <strong>{layer.title}</strong>
              <small>{layer.detail}{layer.count ? ` · ${layer.count}` : ""}</small>
            </div>
            <button
              type="button"
              className={`a26-ios-toggle ${layersFilter[layer.key] ? "is-on" : ""}`}
              onClick={() => toggleLayer(layer.key)}
              aria-label={`Alternar ${layer.title.toLowerCase()}`}
            >
              <span className="a26-ios-toggle-track">
                <span className="a26-ios-toggle-glow" />
                <span className="a26-ios-toggle-knob"><span className="a26-knob-core" /></span>
              </span>
            </button>
          </A26Surface>
        ))}
      </div>
    </A26Sidebar>
  );
}
