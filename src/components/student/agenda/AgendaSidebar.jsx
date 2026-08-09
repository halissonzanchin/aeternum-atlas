import { useState } from "react";
import LineIcon from "../../icons/LineIcon";
import { formatAgendaDate, parseAgendaDate } from "../../../hooks/useStudyAgenda";
import { useLanguage } from "../../../context/LanguageContext";

export default function AgendaSidebar({
  selectedDate,
  setSelectedDate,
  layersFilter,
  setLayersFilter,
  selectedSystem,
  setSelectedSystem,
  onNewActivity
}) {
  const { language, t } = useLanguage();
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

  // Generate 42 days for mini calendar
  const firstOfMonth = new Date(miniCursor.getFullYear(), miniCursor.getMonth(), 1);
  const startDay = firstOfMonth.getDay();
  const startDate = new Date(firstOfMonth);
  startDate.setDate(startDate.getDate() - (startDay === 0 ? 6 : startDay - 1));

  const miniDays = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });

  const miniTitle = new Intl.DateTimeFormat(language === "pt" ? "pt-BR" : "en-US", { month: "long", year: "numeric" }).format(miniCursor);

  return (
    <aside className="a26-agenda-sidebar">
      {/* Quick Action Button */}
      <button className="a26-sidebar-create-btn" onClick={onNewActivity}>
        <span className="a26-sidebar-create-btn__icon">+</span>
        <span>Nova Atividade</span>
      </button>

      {/* Mini Calendar Navigation */}
      <div className="a26-mini-calendar">
        <div className="a26-mini-calendar__header">
          <strong>{miniTitle}</strong>
          <div className="a26-mini-calendar__nav">
            <button onClick={() => shiftMiniMonth(-1)}><LineIcon name="chevron" /></button>
            <button onClick={() => shiftMiniMonth(1)}><LineIcon name="chevron" /></button>
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
      </div>

      {/* Synchronized Layers Filters */}
      <div className="a26-sidebar-layers">
        <h4 className="a26-sidebar-section-title">Camadas da Agenda</h4>
        
        <label className="a26-layer-toggle is-student">
          <input
            type="checkbox"
            checked={Boolean(layersFilter.student)}
            onChange={() => toggleLayer("student")}
          />
          <span className="a26-layer-indicator is-student" />
          <div className="a26-layer-info">
            <strong>Minha Agenda Pessoal</strong>
            <small>Halisson (Você)</small>
          </div>
        </label>

        <label className="a26-layer-toggle is-teacher">
          <input
            type="checkbox"
            checked={Boolean(layersFilter.teacher)}
            onChange={() => toggleLayer("teacher")}
          />
          <span className="a26-layer-indicator is-teacher" />
          <div className="a26-layer-info">
            <strong>Professores Sincronizados</strong>
            <small>Prof. Dr. Halisson / Dra. Mariana</small>
          </div>
        </label>

        <label className="a26-layer-toggle is-institution">
          <input
            type="checkbox"
            checked={Boolean(layersFilter.institution)}
            onChange={() => toggleLayer("institution")}
          />
          <span className="a26-layer-indicator is-institution" />
          <div className="a26-layer-info">
            <strong>Simulados & Avaliações</strong>
            <small>Coordenação de Medicina</small>
          </div>
        </label>

        <label className="a26-layer-toggle is-ai-tutor">
          <input
            type="checkbox"
            checked={Boolean(layersFilter.ai_tutor)}
            onChange={() => toggleLayer("ai_tutor")}
          />
          <span className="a26-layer-indicator is-ai-tutor" />
          <div className="a26-layer-info">
            <strong>Recomendações Tutor IA</strong>
            <small>Casos Clínicos Socráticos</small>
          </div>
        </label>
      </div>

      {/* Anatomical System Filter */}
      <div className="a26-sidebar-systems">
        <h4 className="a26-sidebar-section-title">Filtrar por Sistema</h4>
        <select
          value={selectedSystem}
          onChange={(e) => setSelectedSystem(e.target.value)}
          className="a26-sidebar-system-select"
        >
          <option value="all">Todos os Sistemas Anatômicos</option>
          <option value="Cardiovascular">Cardiovascular</option>
          <option value="Membro Superior">Membro Superior</option>
          <option value="Sistema nervoso">Sistema Nervoso</option>
          <option value="Tórax">Tórax</option>
          <option value="Abdome">Abdome</option>
          <option value="Cabeça e Pescoço">Cabeça e Pescoço</option>
        </select>
      </div>
    </aside>
  );
}
