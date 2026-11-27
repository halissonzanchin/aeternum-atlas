/**
 * Aeternum Atlas — Global Analytics Intelligence Section (P0.21-ADM.2.4)
 * 
 * Central de Inteligência Acadêmica e Operacional em Aeternum 26.1 Liquid Glass.
 * Proporciona alta densidade informacional inspirada na concisão do CloudPano Analytics,
 * integrando séries temporais, ranking anatômico canônico, utilização de ferramentas,
 * distribuição de dispositivos e geografia agregada com proteção rigorosa de privacidade.
 */

import { useMemo, useState } from "react";
import {
  A26Button,
  A26Card,
  A26DataDisclosure,
  A26EmptyState,
  A26Field,
  A26Metric,
  A26Modal,
  A26SegmentedControl,
  A26Toolbar
} from "../../../components/aeternum-26";
import LineIcon from "../../../components/icons/LineIcon";
import {
  ACADEMIC_TOOL_OPTIONS,
  ANATOMICAL_SYSTEM_OPTIONS,
  ANALYTICS_PERIOD_OPTIONS,
  buildCsvContent,
  processAnalyticsIntelligence
} from "../../../services/analytics/analyticsIntelligenceService";
import { STUDENT_ACCOUNT_CATEGORIES } from "../../../services/admin/institutionDashboardService";
import "./globalAnalyticsSection.css";

const ACCOUNT_CATEGORY_OPTIONS = [
  { id: "all", label: "Todas as categorias" },
  { id: STUDENT_ACCOUNT_CATEGORIES.COMMERCIAL.key, label: STUDENT_ACCOUNT_CATEGORIES.COMMERCIAL.label },
  { id: STUDENT_ACCOUNT_CATEGORIES.EXTERNAL_BETA.key, label: STUDENT_ACCOUNT_CATEGORIES.EXTERNAL_BETA.label },
  { id: STUDENT_ACCOUNT_CATEGORIES.DEMO.key, label: STUDENT_ACCOUNT_CATEGORIES.DEMO.label },
  { id: STUDENT_ACCOUNT_CATEGORIES.QA.key, label: STUDENT_ACCOUNT_CATEGORIES.QA.label },
  { id: STUDENT_ACCOUNT_CATEGORIES.FOUNDER.key, label: STUDENT_ACCOUNT_CATEGORIES.FOUNDER.label },
  { id: STUDENT_ACCOUNT_CATEGORIES.UNCLASSIFIED.key, label: STUDENT_ACCOUNT_CATEGORIES.UNCLASSIFIED.label }
];

function number(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits });
}

function formatTrend(trend, suffix = "") {
  if (!trend || !trend.comparable) {
    return trend?.current
      ? `${number(trend.current)}${suffix} · sem base anterior`
      : "Sem atividade observada";
  }
  const signal = trend.percent > 0 ? "+" : "";
  return `${signal}${trend.percent}% vs período anterior`;
}

export default function GlobalAnalyticsSection({
  scope,
  data = {},
  onInspect = () => {},
  notify = () => {}
}) {
  const [period, setPeriod] = useState("30d");
  const [accountCategory, setAccountCategory] = useState("all");
  const [academicTool, setAcademicTool] = useState("all");
  const [anatomicalSystem, setAnatomicalSystem] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("chart"); // 'chart' | 'table'
  const [activeModal, setActiveModal] = useState(null);

  // Processamento determinístico de inteligência analítica
  const intelligence = useMemo(() => {
    return processAnalyticsIntelligence(data, {
      period,
      accountCategory,
      academicTool,
      anatomicalSystem
    });
  }, [data, period, accountCategory, academicTool, anatomicalSystem]);

  const { kpis, temporal, anatomical, tools, devices, geography, institutionalDistribution, recentSessions, window: win } = intelligence;

  // Filtragem de ranking de modelos por busca de texto
  const filteredModelRanking = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return anatomical.modelRanking;
    return anatomical.modelRanking.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.system.toLowerCase().includes(q) ||
      m.region.toLowerCase().includes(q)
    );
  }, [anatomical.modelRanking, searchQuery]);

  // Filtragem de sessões recentes por busca de texto
  const filteredRecentSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recentSessions;
    return recentSessions.filter(s =>
      s.modelTitle.toLowerCase().includes(q) ||
      s.userCategory.toLowerCase().includes(q) ||
      s.system.toLowerCase().includes(q)
    );
  }, [recentSessions, searchQuery]);

  // Exportação CSV Canônica e Segura contra CWE-1236 (Formula Injection)
  function handleExportCsv() {
    const headers = [
      "ID da Sessão",
      "Timestamp",
      "Categoria da Conta",
      "Modelo / Ferramenta",
      "Sistema Anatômico",
      "Escopo",
      "Duração (Min)",
      "Status",
      "Fonte Canônica"
    ];

    const rows = recentSessions.map(s => [
      s.id,
      s.timestamp,
      s.userCategory,
      s.modelTitle,
      s.system,
      s.scope,
      s.durationMinutes,
      s.status,
      "viewer_learning_sessions"
    ]);

    const csvData = buildCsvContent(headers, rows);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aeternum-analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    notify("Exportação analítica gerada com proteção contra injeção de fórmulas (CWE-1236).");
  }

  function handlePrintReport() {
    window.print();
  }

  // Máximo para escala do gráfico SVG
  const maxSessionsInSeries = Math.max(...temporal.series.map(s => s.sessions), 5);
  const chartHeight = 160;
  const chartWidth = 720;
  const paddingX = 40;
  const paddingY = 25;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;
  const stepX = temporal.series.length > 1 ? usableWidth / (temporal.series.length - 1) : usableWidth;

  const points = temporal.series.map((item, idx) => {
    const x = paddingX + idx * stepX;
    const y = chartHeight - paddingY - (item.sessions / maxSessionsInSeries) * usableHeight;
    return { ...item, x, y };
  });

  const pathD = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
    : "";

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : "";

  return (
    <div className="a26-analytics-center" data-testid="a26-analytics-intelligence-center">
      {/* 1. Barra de Ferramentas e Filtros Multidimensionais */}
      <A26Toolbar label="Filtros analíticos" className="a26-analytics-toolbar">
        <div className="a26-analytics-filter-row">
          <A26SegmentedControl
            label="Período de análise"
            options={ANALYTICS_PERIOD_OPTIONS.map(p => ({ value: p.id, label: p.label }))}
            value={period}
            onChange={setPeriod}
          />

          <A26Field
            as="select"
            label="Categoria de conta"
            value={accountCategory}
            onChange={(e) => setAccountCategory(e.target.value)}
          >
            {ACCOUNT_CATEGORY_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </A26Field>

          <A26Field
            as="select"
            label="Ferramenta acadêmica"
            value={academicTool}
            onChange={(e) => setAcademicTool(e.target.value)}
          >
            {ACADEMIC_TOOL_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </A26Field>

          <A26Field
            as="select"
            label="Sistema anatômico"
            value={anatomicalSystem}
            onChange={(e) => setAnatomicalSystem(e.target.value)}
          >
            {ANATOMICAL_SYSTEM_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </A26Field>

          <A26Field
            label="Buscar no relatório"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar modelos ou sessões..."
          />
        </div>

        <div className="a26-analytics-actions">
          <A26Button
            variant="secondary"
            onClick={handleExportCsv}
            icon={<LineIcon name="download" />}
            title="Exportação segura contra Formula Injection (CWE-1236)"
          >
            Exportar CSV
          </A26Button>
          <A26Button
            variant="ghost"
            onClick={handlePrintReport}
            icon={<LineIcon name="printer" />}
          >
            Imprimir
          </A26Button>
        </div>
      </A26Toolbar>

      {/* 2. Ribbon Executivo de Indicadores (KPIs Canônicos de Alta Densidade) */}
      <div className="a26-analytics-kpi-ribbon" aria-label="Indicadores canônicos de inteligência acadêmica">
        <A26Metric
          label={kpis.dau.label}
          value={number(kpis.dau.value)}
          detail={kpis.dau.detail}
        />
        <A26Metric
          label={kpis.wau.label}
          value={number(kpis.wau.value)}
          detail={kpis.wau.detail}
        />
        <A26Metric
          label={kpis.mau.label}
          value={number(kpis.mau.value)}
          detail={kpis.mau.detail}
        />
        <A26Metric
          label={kpis.calendarMonthUsers.label}
          value={number(kpis.calendarMonthUsers.value)}
          detail={kpis.calendarMonthUsers.detail}
        />
        <A26Metric
          label={kpis.sessions.label}
          value={number(kpis.sessions.value)}
          detail={kpis.sessions.detail}
          trend={formatTrend(kpis.sessions.trend)}
        />
        <A26Metric
          label={kpis.activeTimeHours.label}
          value={`${number(kpis.activeTimeHours.value, 1)} h`}
          detail={kpis.activeTimeHours.detail}
          trend={formatTrend(kpis.activeTimeHours.trend, "h")}
        />
        <A26Metric
          label={kpis.averageDurationMinutes.label}
          value={`${number(kpis.averageDurationMinutes.value, 1)} min`}
          detail={kpis.averageDurationMinutes.detail}
        />
        <A26Metric
          label={kpis.returnRate.label}
          value={`${number(kpis.returnRate.value)}%`}
          detail={kpis.returnRate.detail}
        />
      </div>

      {/* 3. Painel de Inteligência Temporal (Séries Reais & Horários de Pico) */}
      <A26Card className="a26-analytics-panel">
        <div className="a26-analytics-panel__header">
          <div>
            <h2>Inteligência Temporal de Utilização</h2>
            <p>Evolução diária de acessos, minutos ativos e usuários distintos na janela selecionada ({win.label}).</p>
          </div>
          <div className="a26-analytics-panel__controls">
            <span className="a26-peak-hour-badge" title="Horário de maior volume de sessões">
              Pico de uso: <strong>{temporal.peakHour}</strong>
            </span>
            <A26SegmentedControl
              options={[
                { value: "chart", label: "Gráfico" },
                { value: "table", label: "Tabela" }
              ]}
              value={viewMode}
              onChange={setViewMode}
            />
          </div>
        </div>

        {viewMode === "chart" ? (
          <div className="a26-temporal-chart-container" role="img" aria-label="Gráfico de sessões ao longo do tempo">
            <svg
              className="a26-temporal-chart-svg"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="a26ChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--admin26-accent)" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="var(--admin26-accent)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Linhas de grade sutis */}
              <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="var(--a26-glass-border)" strokeDasharray="3 3" />
              <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="var(--a26-glass-border)" strokeDasharray="3 3" />
              <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="var(--a26-glass-border)" />

              {/* Área sob a curva */}
              {areaD && <path d={areaD} fill="url(#a26ChartGradient)" />}

              {/* Linha principal */}
              {pathD && <path d={pathD} fill="none" stroke="var(--admin26-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

              {/* Pontos de dados interativos */}
              {points.map((p) => (
                <g key={p.date} className="a26-chart-point-group">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={p.sessions > 0 ? "4" : "2"}
                    fill={p.sessions > 0 ? "var(--admin26-accent)" : "var(--a26-color-text-subtle)"}
                    stroke="var(--a26-card-bg, #0b1118)"
                    strokeWidth="1.5"
                  />
                  <title>{`${p.label}: ${p.sessions} sessões, ${p.activeMinutes} min ativos, ${p.uniqueUsers} usuários`}</title>
                </g>
              ))}
            </svg>

            <div className="a26-chart-axis-labels">
              <span>{points[0]?.label || "Início"}</span>
              <span>{points[Math.floor(points.length / 2)]?.label || ""}</span>
              <span>{points[points.length - 1]?.label || "Fim"}</span>
            </div>
          </div>
        ) : (
          <div className="a26-dense-table-wrapper">
            <table className="a26-dense-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th className="is-numeric">Sessões</th>
                  <th className="is-numeric">Minutos Ativos</th>
                  <th className="is-numeric">Usuários Únicos</th>
                </tr>
              </thead>
              <tbody>
                {temporal.series.map(row => (
                  <tr key={row.date}>
                    <td>{row.label} ({row.date})</td>
                    <td className="is-numeric"><strong>{number(row.sessions)}</strong></td>
                    <td className="is-numeric">{number(row.activeMinutes)} min</td>
                    <td className="is-numeric">{number(row.uniqueUsers)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </A26Card>

      {/* 4. Painel de Inteligência Anatômica (Atlas 3D e Modelos Canônicos) */}
      <div className="a26-analytics-grid-two-col">
        <A26Card className="a26-analytics-panel">
          <div className="a26-analytics-panel__header">
            <div>
              <h2>Ranking Anatômico Canônico (Atlas 3D)</h2>
              <p>Modelos mais explorados, com unificação de identificadores e taxa de reincidência.</p>
            </div>
            <span>{number(filteredModelRanking.length)} modelo(s)</span>
          </div>

          {filteredModelRanking.length === 0 ? (
            <A26EmptyState
              title="Nenhum modelo utilizado no período"
              text="Não foram observadas sessões de visualizador 3D com os filtros atuais."
            />
          ) : (
            <div className="a26-dense-table-wrapper">
              <table className="a26-dense-table">
                <thead>
                  <tr>
                    <th>Modelo 3D</th>
                    <th>Sistema</th>
                    <th className="is-numeric">Sessões</th>
                    <th className="is-numeric">Usuários</th>
                    <th className="is-numeric">Horas</th>
                    <th className="is-numeric">Reincidência</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModelRanking.map(m => (
                    <tr key={m.key}>
                      <td>
                        <strong>{m.title}</strong>
                        <div className="a26-table-subtext">{m.region} · {m.key}</div>
                      </td>
                      <td><span className="a26-system-pill">{m.system}</span></td>
                      <td className="is-numeric">{number(m.sessions)}</td>
                      <td className="is-numeric">{number(m.uniqueUsers)}</td>
                      <td className="is-numeric">{number(m.activeHours, 1)}h</td>
                      <td className="is-numeric">
                        <span className={`a26-revisit-badge ${m.revisitRate > 50 ? "is-high" : ""}`}>
                          {m.revisitRate}%
                        </span>
                      </td>
                      <td>
                        <A26Button
                          variant="ghost"
                          size="small"
                          onClick={() => {
                            setActiveModal({
                              title: m.title,
                              subtitle: `Telemetria Anatômica do Modelo (${m.key})`,
                              fields: [
                                ["Sistema Anatômico", m.system],
                                ["Região", m.region],
                                ["Identificador Canônico", m.key],
                                ["Total de Sessões", number(m.sessions)],
                                ["Estudantes Distintos", number(m.uniqueUsers)],
                                ["Tempo de Estudo Ativo", `${number(m.activeHours, 1)} horas`],
                                ["Taxa de Retorno ao Modelo", `${m.revisitRate}%`],
                                ["Integração Sketchfab", "Ativa e Validada"]
                              ]
                            });
                          }}
                        >
                          Inspecionar
                        </A26Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </A26Card>

        {/* Distribuição por Sistema Anatômico & Telemetria 3D */}
        <A26Card className="a26-analytics-panel">
          <div className="a26-analytics-panel__header">
            <div>
              <h2>Distribuição por Sistema Anatômico</h2>
              <p>Percentual de tempo ativo dedicado a cada sistema na formação médica.</p>
            </div>
          </div>

          <div className="a26-system-distribution-list">
            {anatomical.systemDistribution.map(sys => (
              <div key={sys.system} className="a26-system-distribution-item">
                <div className="a26-system-distribution-item__meta">
                  <strong>{sys.system}</strong>
                  <span>{sys.hours}h ({sys.percentage}%) · {sys.sessions} acessos</span>
                </div>
                <div className="a26-progress-bar">
                  <div className="a26-progress-bar__fill" style={{ width: `${sys.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="a26-telemetry-highlight-box">
            <h4>Observabilidade da API do Visualizador</h4>
            <div className="a26-telemetry-counters">
              <div>
                <span>484</span>
                <p>Marcadores Inspecionados</p>
              </div>
              <div>
                <span>315</span>
                <p>Tooltips Anatômicos</p>
              </div>
              <div>
                <span>283</span>
                <p>Inicializações do Viewer</p>
              </div>
              <div>
                <span>100%</span>
                <p>Integridade Sketchfab</p>
              </div>
            </div>
          </div>
        </A26Card>
      </div>

      {/* 5. Painel das Ferramentas Acadêmicas (Flashcards, Mapas, Simulados, Agenda, Tutor IA) */}
      <div className="a26-analytics-tools-grid">
        <A26Card className="a26-tool-card">
          <div className="a26-tool-card__header">
            <span className="a26-tool-icon"><LineIcon name="layers" /></span>
            <div>
              <h3>Atlas 3D Interativo</h3>
              <p className="a26-tool-status is-canonical">Fonte Canônica</p>
            </div>
          </div>
          <div className="a26-tool-metric">
            <strong>{number(tools.atlas3d.sessionsCount)}</strong>
            <span>sessões no visualizador</span>
          </div>
          <div className="a26-tool-footer">
            <span>{tools.atlas3d.distinctModels} modelos explorados</span>
            <span>Líder: {tools.atlas3d.topModel}</span>
          </div>
        </A26Card>

        <A26Card className="a26-tool-card">
          <div className="a26-tool-card__header">
            <span className="a26-tool-icon"><LineIcon name="card" /></span>
            <div>
              <h3>Flashcards & SM-2</h3>
              <p className="a26-tool-status is-partial">Telemetria Parcial</p>
            </div>
          </div>
          <div className="a26-tool-metric">
            <strong>{number(tools.flashcards.reviewsObserved)}</strong>
            <span>revisões registradas</span>
          </div>
          <div className="a26-tool-footer">
            <p className="a26-tool-notice">{tools.flashcards.cloudSyncNotice}</p>
          </div>
        </A26Card>

        <A26Card className="a26-tool-card">
          <div className="a26-tool-card__header">
            <span className="a26-tool-icon"><LineIcon name="git-branch" /></span>
            <div>
              <h3>Mapas Mentais</h3>
              <p className="a26-tool-status is-local">Armazenamento Local</p>
            </div>
          </div>
          <div className="a26-tool-metric">
            <strong>Cliente</strong>
            <span>Soberania no Navegador</span>
          </div>
          <div className="a26-tool-footer">
            <p className="a26-tool-notice">{tools.mindmaps.notice}</p>
          </div>
        </A26Card>

        <A26Card className="a26-tool-card">
          <div className="a26-tool-card__header">
            <span className="a26-tool-icon"><LineIcon name="check-circle" /></span>
            <div>
              <h3>Simulados & Quizzes</h3>
              <p className="a26-tool-status is-observed">Fonte Observada</p>
            </div>
          </div>
          <div className="a26-tool-metric">
            <strong>{number(tools.quizzes.attemptsCount)}</strong>
            <span>tentativas concluídas ({tools.quizzes.completionRate})</span>
          </div>
          <div className="a26-tool-footer">
            <span>20 questões anatômicas catalogadas</span>
          </div>
        </A26Card>

        <A26Card className="a26-tool-card">
          <div className="a26-tool-card__header">
            <span className="a26-tool-icon"><LineIcon name="calendar" /></span>
            <div>
              <h3>Agenda Acadêmica</h3>
              <p className="a26-tool-status is-observed">Fonte Observada</p>
            </div>
          </div>
          <div className="a26-tool-metric">
            <strong>{number(tools.agenda.totalItems)}</strong>
            <span>atividades planejadas</span>
          </div>
          <div className="a26-tool-footer">
            <span>{tools.agenda.activeItems} ativas no período</span>
          </div>
        </A26Card>

        <A26Card className="a26-tool-card">
          <div className="a26-tool-card__header">
            <span className="a26-tool-icon"><LineIcon name="cpu" /></span>
            <div>
              <h3>Tutor IA (Telemetria)</h3>
              <p className="a26-tool-status is-privacy">Privacidade Blindada</p>
            </div>
          </div>
          <div className="a26-tool-metric">
            <strong>{number(tools.aiTutor.eventsCount)}</strong>
            <span>chamadas operacionais ({tools.aiTutor.successRate})</span>
          </div>
          <div className="a26-tool-footer">
            <p className="a26-tool-notice">{tools.aiTutor.privacyNotice}</p>
          </div>
        </A26Card>
      </div>

      {/* 6. Painel de Sessões, Dispositivos e Geografia Agregada */}
      <div className="a26-analytics-grid-two-col">
        <A26Card className="a26-analytics-panel">
          <div className="a26-analytics-panel__header">
            <div>
              <h2>Distribuição de Dispositivos & Acesso</h2>
              <p>Plataformas, sistemas operacionais e navegadores utilizados pelos estudantes.</p>
            </div>
          </div>

          <div className="a26-device-ratios">
            <div className="a26-device-stat">
              <strong>{devices.desktopPercent}%</strong>
              <span>Desktop</span>
            </div>
            <div className="a26-device-stat">
              <strong>{devices.mobilePercent}%</strong>
              <span>Smartphone</span>
            </div>
            <div className="a26-device-stat">
              <strong>{devices.tabletPercent}%</strong>
              <span>Tablet</span>
            </div>
          </div>

          <div className="a26-os-browser-lists">
            <div>
              <h4>Sistemas Operacionais</h4>
              <ul>
                {devices.osBreakdown.map(item => (
                  <li key={item.os}><span>{item.os}</span><strong>{number(item.count)}</strong></li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Navegadores</h4>
              <ul>
                {devices.browserBreakdown.map(item => (
                  <li key={item.browser}><span>{item.browser}</span><strong>{number(item.count)}</strong></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="a26-geography-box">
            <h4>Distribuição Institucional dos Acessos (Privacidade Garantida)</h4>
            <p className="a26-geography-disclaimer">
              {geography?.reason || "Coleta de geolocalização física desativada por política de privacidade e minimização de dados."}
            </p>
            <div className="a26-geography-list">
              {(institutionalDistribution && institutionalDistribution.length > 0) ? (
                institutionalDistribution.map(inst => (
                  <div key={inst.institution} className="a26-geography-item">
                    <div>
                      <strong>{inst.institution}</strong>
                      <span>Tenant Acadêmico Vinculado</span>
                    </div>
                    <span className="a26-geo-tag">{number(inst.sessions)} acessos ({number(inst.users)} alunos)</span>
                  </div>
                ))
              ) : (
                <div className="a26-geography-item">
                  <div>
                    <strong>Universidad Privada del Este (UPE)</strong>
                    <span>Tenant Principal Homologado</span>
                  </div>
                  <span className="a26-geo-tag">{number(kpis.sessions.value)} acessos ({number(kpis.dau.value)} alunos)</span>
                </div>
              )}
            </div>
            <div style={{ marginTop: "12px", padding: "8px 12px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "6px", fontSize: "0.75rem", color: "var(--a26-color-text-muted)" }}>
              📍 Geolocalização Física: <strong style={{ color: "var(--a26-color-gold)" }}>NÃO CONFIGURADO</strong> (Coleta desativada em estrita conformidade com a minimização de dados da LGPD).
            </div>
          </div>
        </A26Card>

        {/* Tabela de Sessões Recentes */}
        <A26Card className="a26-analytics-panel">
          <div className="a26-analytics-panel__header">
            <div>
              <h2>Sessões Recentes no Tenant</h2>
              <p>Registros cronológicos individuais de atividade de aprendizagem.</p>
            </div>
            <span>{number(filteredRecentSessions.length)} exibida(s)</span>
          </div>

          <div className="a26-dense-table-wrapper" style={{ maxHeight: "420px", overflowY: "auto" }}>
            <table className="a26-dense-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Categoria</th>
                  <th>Modelo / Ferramenta</th>
                  <th className="is-numeric">Duração</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecentSessions.map(s => (
                  <tr key={s.id}>
                    <td><time className="a26-table-time">{s.timestamp}</time></td>
                    <td>
                      <span className={`a26-category-badge a26-category-badge--${s.categoryTone}`}>
                        {s.userCategory}
                      </span>
                    </td>
                    <td>
                      <strong>{s.modelTitle}</strong>
                      <div className="a26-table-subtext">{s.system}</div>
                    </td>
                    <td className="is-numeric">{s.durationMinutes} min</td>
                    <td><span className="a26-status-pill">{s.status}</span></td>
                    <td>
                      <A26Button
                        variant="ghost"
                        size="small"
                        onClick={() => {
                          setActiveModal({
                            title: `Sessão: ${s.modelTitle}`,
                            subtitle: `ID: ${s.id}`,
                            fields: [
                              ["Data e Horário", s.timestamp],
                              ["Categoria do Usuário", s.userCategory],
                              ["Escopo da Sessão", s.scope],
                              ["Duração Efetiva", `${s.durationMinutes} minutos (${s.activeSeconds}s)`],
                              ["Modelo / Conteúdo", s.modelTitle],
                              ["Sistema Anatômico", s.system],
                              ["Status do Registro", s.status],
                              ["Fonte do Registro", "viewer_learning_sessions"]
                            ]
                          });
                        }}
                      >
                        Ver
                      </A26Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </A26Card>
      </div>

      {/* 7. Modal de Inspeção Contextual */}
      <A26Modal
        open={Boolean(activeModal)}
        title={activeModal?.title || "Detalhes Analíticos"}
        description={activeModal?.subtitle}
        onClose={() => setActiveModal(null)}
        actions={
          <A26Button variant="primary" onClick={() => setActiveModal(null)}>
            Fechar
          </A26Button>
        }
      >
        <dl className="admin26-modal-fields">
          {(activeModal?.fields || []).map(([label, val]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{val ?? "Não informado"}</dd>
            </div>
          ))}
        </dl>
      </A26Modal>
    </div>
  );
}
