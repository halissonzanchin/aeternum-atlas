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

  const miniTitle = new Intl.DateTimeFormat(language === "pt" ? "pt-BR" : "en-US", { month: "long", year: "numeric" }).format(miniCursor);

  return (
    <aside className="a26-agenda-sidebar">
      {/* Quick Action Button */}
      <button className="a26-sidebar-create-btn" onClick={onNewActivity}>
        <span className="a26-sidebar-create-btn__icon">+</span>
        <span>Agendar Nova Atividade</span>
      </button>

      {/* Mini Calendar Navigation */}
      <div className="a26-mini-calendar">
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
      </div>

      {/* Synchronized Real Teachers & Accounts */}
      <div className="a26-sidebar-layers">
        <div className="a26-sidebar-section-header">
          <h4 className="a26-sidebar-section-title">Professores & Contas Conectadas</h4>
          <span className="a26-sync-live-badge">🟢 Tempo Real</span>
        </div>
        
        {/* Personal Student Account */}
        <div className={`a26-teacher-card ${layersFilter.student ? "is-active" : ""}`}>
          <div className="a26-teacher-avatar is-student">👤</div>
          <div className="a26-teacher-info">
            <strong>Minha Agenda Pessoal</strong>
            <small>Halisson Zanchin (Sua Conta)</small>
          </div>
          <button
            type="button"
            className={`a26-ios-toggle ${layersFilter.student ? "is-on" : ""}`}
            onClick={() => toggleLayer("student")}
            aria-label="Alternar agenda pessoal"
          >
            <span className="a26-ios-toggle-track">
              <span className="a26-ios-toggle-glow" />
              <span className="a26-ios-toggle-knob">
                <span className="a26-knob-core" />
              </span>
            </span>
          </button>
        </div>

        {/* Real Professor 1 */}
        <div className={`a26-teacher-card ${layersFilter.teacher ? "is-active" : ""}`}>
          <div className="a26-teacher-avatar is-teacher">👨‍🏫</div>
          <div className="a26-teacher-info">
            <strong>Prof. Dr. Halisson Zanchin</strong>
            <small>Anatomia Humana & Dissecação</small>
          </div>
          <button
            type="button"
            className={`a26-ios-toggle ${layersFilter.teacher ? "is-on" : ""}`}
            onClick={() => toggleLayer("teacher")}
            aria-label="Alternar agenda do Prof. Halisson"
          >
            <span className="a26-ios-toggle-track">
              <span className="a26-ios-toggle-glow" />
              <span className="a26-ios-toggle-knob">
                <span className="a26-knob-core" />
              </span>
            </span>
          </button>
        </div>

        {/* Real Professor 2 */}
        <div className={`a26-teacher-card ${layersFilter.teacher ? "is-active" : ""}`}>
          <div className="a26-teacher-avatar is-teacher">👩‍🏫</div>
          <div className="a26-teacher-info">
            <strong>Profª. Dra. Mariana Lima</strong>
            <small>Neuroanatomia Clínica</small>
          </div>
          <button
            type="button"
            className={`a26-ios-toggle ${layersFilter.teacher ? "is-on" : ""}`}
            onClick={() => toggleLayer("teacher")}
            aria-label="Alternar agenda da Profª. Mariana"
          >
            <span className="a26-ios-toggle-track">
              <span className="a26-ios-toggle-glow" />
              <span className="a26-ios-toggle-knob">
                <span className="a26-knob-core" />
              </span>
            </span>
          </button>
        </div>

        {/* Institution Coordination */}
        <div className={`a26-teacher-card ${layersFilter.institution ? "is-active" : ""}`}>
          <div className="a26-teacher-avatar is-institution">🏛️</div>
          <div className="a26-teacher-info">
            <strong>Coordenação de Medicina</strong>
            <small>Simulados & Avaliações Globais</small>
          </div>
          <button
            type="button"
            className={`a26-ios-toggle ${layersFilter.institution ? "is-on" : ""}`}
            onClick={() => toggleLayer("institution")}
            aria-label="Alternar agenda da coordenação"
          >
            <span className="a26-ios-toggle-track">
              <span className="a26-ios-toggle-glow" />
              <span className="a26-ios-toggle-knob">
                <span className="a26-knob-core" />
              </span>
            </span>
          </button>
        </div>

        {/* AI Tutor Preceptor */}
        <div className={`a26-teacher-card ${layersFilter.ai_tutor ? "is-active" : ""}`}>
          <div className="a26-teacher-avatar is-ai-tutor">🤖</div>
          <div className="a26-teacher-info">
            <strong>Atlas AI Preceptor</strong>
            <small>Casos Clínicos Socráticos</small>
          </div>
          <button
            type="button"
            className={`a26-ios-toggle ${layersFilter.ai_tutor ? "is-on" : ""}`}
            onClick={() => toggleLayer("ai_tutor")}
            aria-label="Alternar agenda do tutor IA"
          >
            <span className="a26-ios-toggle-track">
              <span className="a26-ios-toggle-glow" />
              <span className="a26-ios-toggle-knob">
                <span className="a26-knob-core" />
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Anatomical System Filter */}
      <div className="a26-sidebar-systems">
        <h4 className="a26-sidebar-section-title">Filtrar por Sistema Anatômico</h4>
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
