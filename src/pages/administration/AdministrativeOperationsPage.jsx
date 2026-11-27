/* eslint-disable no-unused-vars -- o parser ESLint atual não contabiliza identificadores usados apenas em JSX */
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  A26Button,
  A26Card,
  A26DataDisclosure,
  A26EmptyState,
  A26ErrorState,
  A26Field,
  A26LoadingState,
  A26Metric,
  A26Modal,
  A26SegmentedControl,
  A26Toolbar
} from "../../components/aeternum-26";
import LineIcon from "../../components/icons/LineIcon";
import { adminSectionFromPath } from "../../config/adminNavigation";
import { createGovernancePeriodSnapshot, createGovernanceSeries, formatPeriodComparison } from "../governance/governanceDecisionModel";
import {
  getRestrictedInstitutionDashboardData,
  loadInstitutionDashboardData
} from "../../services/admin/institutionDashboardService";
import { normalizeRole, ROLES } from "../../services/permissions/permissionService";
import { reviewPendingUserRegistration } from "../../services/users/userService";
import {
  administrationSourceState,
  createAdministrationAlerts,
  createAdministrationModelRows,
  createAdministrationSystemRows
} from "./administrationDecisionModel";
import AnnouncementsManagementSection from "./sections/AnnouncementsManagementSection";
import BetaCandidatesManagementSection from "./sections/BetaCandidatesManagementSection";
import InfrastructureMonitorSection from "./sections/InfrastructureMonitorSection";
import { sessionGuardService } from "../../services/session/sessionGuardService";
import "./administrativeOperations.css";

const PERIOD_OPTIONS = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" }
];

const SECTION_META = {
  overview: ["Centro operacional", "Resumo, exceções e próximos passos com escopo verificável."],
  institution: ["Instituição", "Contrato, capacidade e responsáveis visíveis ao papel autenticado."],
  students: ["Alunos da instituição", "Cadastros, estados de acesso e atividade observada no tenant."],
  beta_candidates: ["Programa Beta (Operação El Dorado)", "Triagem, avaliação acadêmica e controle de capacidade dos candidatos ao beta."],
  import_students: ["Importar alunos", "Operação pausada até a publicação do contrato acadêmico canônico."],
  announcements: ["Gestão de Comunicados e Atualizações", "Programação e publicação de manutenções técnicas e avisos aos estudantes."],
  analytics: ["Analytics operacionais", "Uso, estabilidade e eventos derivados das fontes autorizadas."],
  academic_analytics: ["Analytics acadêmicos", "Sinais de aprendizagem disponíveis sem inferir resultados ausentes."],
  roi: ["Retorno institucional", "Base observável para decisão, sem transformar uso em retorno financeiro ou acadêmico."],
  heatmap: ["Mapa anatômico de uso", "Distribuição do tempo registrado por sistema anatômico."],
  models_3d: ["Atlas CMS", "Inventário do catálogo 3D e estado editorial observável."],
  viewer_analytics: ["Análises do visualizador", "Eventos e sessões observáveis no período selecionado."],
  digital_twins: ["Gêmeos digitais", "Contrato planejado para réplicas anatômicas versionadas e rastreáveis."],
  billing: ["Faturamento", "Capacidade e valores contratuais retornados pela fonte institucional."],
  reports: ["Relatórios", "Exportações construídas somente com os registros atualmente observados."],
  settings: ["Configurações", "Escopo, permissões e integrações administrativas verificáveis."],
  infrastructure: ["Infrastructure Monitor", "Observabilidade operacional, conectividade, Vercel e IA local em tempo real."]
};

const COVERAGE_LABELS = {
  users: "Perfis institucionais",
  studentProfiles: "Perfis acadêmicos",
  activityLogs: "Acessos a modelos",
  platformEvents: "Eventos da plataforma",
  models: "Catálogo 3D",
  classes: "Turmas",
  classMemberships: "Vínculos aluno-turma",
  subjects: "Disciplinas"
};

function number(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits });
}

function percentage(value) {
  return `${number(value, 1)}%`;
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  });
}

function dateTime(value) {
  if (!value) return "Não registrado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não registrado";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatTableState(item, count, unit, isNotImplementedByDefault = false) {
  if (!item) return "Não verificado";
  const state = item?.state || (isNotImplementedByDefault ? "not_implemented" : null);
  if (unit) {
    if (state === "observed") {
      const num = count ?? item?.rows ?? 0;
      return `Observado (${number(num)} ${unit})`;
    }
    if (state === "empty") {
      return `Vazio (0 ${unit})`;
    }
    if (state === "unavailable") {
      return "Indisponível (Falha na consulta)";
    }
    if (state === "not_implemented") {
      return "NOT_IMPLEMENTED (Planejado)";
    }
    return "Não verificado";
  }
  if (state === "not_implemented") return "Não implementado";
  if (state === "not_configured") return "Não configurado";
  if (state === "unauthorized") return "Não autorizado";
  if (state === "unavailable") return "Indisponível";
  if (state === "empty") return "0 linha(s) (vazio)";
  return `${number(item.rows)} linha(s)`;
}

function getTableStateColor(tableInfo, isNotImplementedByDefault = false) {
  const state = tableInfo?.state || (isNotImplementedByDefault ? "not_implemented" : null);
  if (state === "observed") return "var(--a26-color-teal)";
  if (state === "unavailable") return "var(--a26-color-danger, #ef4444)";
  if (state === "empty" || state === "not_implemented") return "var(--a26-color-text-subtle)";
  return "var(--a26-color-text-muted)";
}

function csvValue(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function filterRows(rows, query) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return rows;
  return rows.filter((row) => JSON.stringify(row).toLocaleLowerCase("pt-BR").includes(normalized));
}

function handleTableKeyDown(event) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  if (event.key === "Home") {
    event.currentTarget.scrollLeft = 0;
    return;
  }
  if (event.key === "End") {
    event.currentTarget.scrollLeft = event.currentTarget.scrollWidth;
    return;
  }
  event.currentTarget.scrollLeft += event.key === "ArrowRight" ? 160 : -160;
}

function SectionHeader({ scope, section, actions }) {
  const [title, text] = SECTION_META[section] || ["Operação administrativa", "Módulo administrativo contextual."];
  return (
    <header className="admin26-heading">
      <div>
        <p className="a26-kicker">{scope === ROLES.SUPER_ADMIN ? "Superadministração global" : "Administração institucional"}</p>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {actions ? <div className="admin26-heading__actions">{actions}</div> : null}
    </header>
  );
}

function SourceNotice({ state, data }) {
  return (
    <A26Card className={`admin26-source is-${state.key}`} role="status" data-testid="a26-administration-source">
      <span className="admin26-source__dot" aria-hidden="true" />
      <div>
        <strong>{state.label}</strong>
        <p>{state.text}</p>
      </div>
      {data?.lastUpdated ? <time dateTime={data.lastUpdated}>Atualizado {dateTime(data.lastUpdated)}</time> : null}
    </A26Card>
  );
}

function Coverage({ quality, source, scope }) {
  const tables = Object.entries(quality?.tables || {});
  return (
    <A26DataDisclosure
      summary="Cobertura, fonte e política"
      meta={`${tables.filter(([, item]) => item.state === "observed").length} fonte(s) com linhas`}
      className="admin26-coverage"
    >
      <p>
        Escopo: <strong>{scope === ROLES.SUPER_ADMIN ? "global permitido" : "tenant autenticado"}</strong>.
        Fonte: <strong>{source || "não certificada"}</strong>. Zero representa apenas as linhas visíveis pelas políticas atuais.
      </p>
      <div className="admin26-coverage__grid">
        {tables.map(([key, item]) => (
          <div key={key} className={`is-${item.state}`}>
            <span>{COVERAGE_LABELS[key] || key}</span>
            <strong>{formatTableState(item)}</strong>
          </div>
        ))}
      </div>
    </A26DataDisclosure>
  );
}

function MetricGrid({ metrics }) {
  return (
    <div className="admin26-metrics" aria-label="Indicadores administrativos">
      {metrics.map((metric) => <A26Metric key={metric.label} {...metric} />)}
    </div>
  );
}

function DenseTable({ title, description, rows, columns, emptyTitle, emptyText, onInspect }) {
  if (!rows.length) {
    return <A26EmptyState title={emptyTitle} text={emptyText} />;
  }
  return (
    <A26Card className="admin26-table-card">
      <div className="admin26-card-heading">
        <div><h2>{title}</h2><p>{description}</p></div>
        <span>{number(rows.length)} registro(s)</span>
      </div>
      <div className="admin26-table-scroll" tabIndex="0" aria-label={`${title}: tabela rolável`} onKeyDown={handleTableKeyDown}>
        <table>
          <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}{onInspect ? <th>Ação</th> : null}</tr></thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id || row.slug || row.email || index}>
                {columns.map((column) => <td key={column.key} data-label={column.label}>{column.render ? column.render(row) : row[column.key] || "—"}</td>)}
                {onInspect ? (
                  <td data-label="Ação"><A26Button variant="ghost" onClick={() => onInspect(row)}>Ver contexto</A26Button></td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </A26Card>
  );
}

function PriorityStack({ alerts, onInspect }) {
  return (
    <div className="admin26-priorities">
      {alerts.map((alert, index) => (
        <A26Card key={alert.id} className={`admin26-priority is-${alert.priority}`}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div><h3>{alert.title}</h3><p>{alert.text}</p></div>
          <A26Button onClick={() => onInspect({ title: alert.title, subtitle: "Critério operacional observado", fields: [
            ["Prioridade", alert.priority],
            ["Evidência", alert.text]
          ] })}>Ver contexto</A26Button>
        </A26Card>
      ))}
    </div>
  );
}

function OverviewSection({ scope, data, snapshot, alerts, query, onInspect, navigate }) {
  const isSuper = scope === ROLES.SUPER_ADMIN;
  const institution = data?.institution || {};
  const overviewMetrics = data?.overviewMetrics || {};
  const betaOperations = data?.betaOperations || {};
  const mostAccessedModels = (data?.mostAccessedModels || []).slice(0, 5);
  const rawStudents = data?.students || [];
  const institutions = filterRows(data?.institutions || [], query);
  const [studentCategoryFilter, setStudentCategoryFilter] = useState("all");

  const [guardState, setGuardState] = useState(() => sessionGuardService?.getState?.() || {});

  useEffect(() => {
    if (typeof sessionGuardService?.subscribe === "function") {
      return sessionGuardService.subscribe((next) => setGuardState({ ...next }));
    }
  }, []);

  const isGuardActive = Boolean(
    guardState?.isAuthorized ||
    guardState?.status === "AUTHORIZED" ||
    guardState?.status === "SESSION_VALID" ||
    guardState?.status === "SESSION_GRANTED"
  );
  const isGuardUnavailable = Boolean(
    guardState?.isUnavailable === true ||
    guardState?.status === "UNAVAILABLE"
  );

  const isLogsUnavailable = data?.quality?.tables?.activityLogs?.state === "unavailable";
  const isEventsUnavailable = data?.quality?.tables?.platformEvents?.state === "unavailable";

  const filteredStudents = useMemo(() => {
    let list = rawStudents;
    if (studentCategoryFilter !== "all") {
      list = list.filter(s => s.accountCategoryKey === studentCategoryFilter);
    }
    return filterRows(list, query);
  }, [rawStudents, studentCategoryFilter, query]);

  // Topline Executive Pulse: 5 cards ópticos com ergonomia calibrada (~33% menos altura) e números tabulares
  const pulseMetrics = isSuper ? [
    {
      kicker: "Instituições Visíveis",
      value: number(institutions.length),
      badge: "escopo global",
      badgeType: "observed",
      detail: "Tenants autorizados pela política",
      icon: "home"
    },
    {
      kicker: "Perfis Acadêmicos",
      value: number(data?.raw?.users?.length || rawStudents.length),
      badge: "amostragem observada",
      badgeType: "observed",
      detail: "Identidades observadas no banco",
      icon: "users"
    },
    {
      kicker: "Sessões 3D no Mês",
      value: overviewMetrics.accessesThisMonth != null ? number(overviewMetrics.accessesThisMonth) : "—",
      badge: "mês corrente",
      badgeType: overviewMetrics.accessesThisMonth != null ? "observed" : "unavailable",
      detail: "Sessões registradas no mês corrente",
      icon: "layers"
    },
    {
      kicker: "Duração Média no Mês",
      value: overviewMetrics.averageSessionMinutes != null ? `${number(overviewMetrics.averageSessionMinutes)} min` : "—",
      badge: "mês corrente",
      badgeType: overviewMetrics.averageSessionMinutes != null ? "observed" : "unavailable",
      detail: "Duração média no mês corrente",
      icon: "clock"
    },
    {
      kicker: "Operação El Dorado",
      value: "Capacidade: 30",
      badge: betaOperations.registrationOpen === false
        ? "Inscrições Fechadas"
        : betaOperations.registrationOpen === true
        ? "Inscrições Abertas"
        : "Inscrições: Certificação Pendente",
      badgeType: betaOperations.registrationOpen === false
        ? "closed"
        : betaOperations.registrationOpen === true
        ? "open"
        : "unavailable",
      detail: betaOperations.isPendingCertification
        ? "Candidaturas em certificação na ADM.2.3"
        : `${number(betaOperations.activated ?? 0)} ativadas · Quarentena sintética estrita`,
      icon: "award"
    }
  ] : [
    {
      kicker: "Usuários 3D ativos no mês",
      value: overviewMetrics.monthlyActiveUsers != null
        ? number(overviewMetrics.monthlyActiveUsers)
        : overviewMetrics.mau != null
        ? number(overviewMetrics.mau)
        : "—",
      badge: "mês corrente",
      badgeType: (overviewMetrics.monthlyActiveUsers != null || overviewMetrics.mau != null) ? "observed" : "unavailable",
      detail: "Usuários com sessões no mês corrente",
      icon: "users"
    },
    {
      kicker: "Sessões 3D no Mês",
      value: overviewMetrics.accessesThisMonth != null ? number(overviewMetrics.accessesThisMonth) : "—",
      badge: "mês corrente",
      badgeType: overviewMetrics.accessesThisMonth != null ? "observed" : "unavailable",
      detail: "Sessões registradas no mês corrente",
      icon: "layers"
    },
    {
      kicker: "Duração Média no Mês",
      value: overviewMetrics.averageSessionMinutes != null ? `${number(overviewMetrics.averageSessionMinutes)} min` : "—",
      badge: "mês corrente",
      badgeType: overviewMetrics.averageSessionMinutes != null ? "observed" : "unavailable",
      detail: "Duração média no mês corrente",
      icon: "clock"
    },
    {
      kicker: "Presença Recente",
      value: overviewMetrics.recentActivity1h != null ? `${number(overviewMetrics.recentActivity1h)} recente(s)` : "—",
      badge: "Tempo Real: Indisponível",
      badgeType: "unavailable",
      detail: "Instantâneo (<=5m) requer componente dedicado",
      icon: "activity"
    },
    {
      kicker: "Operação El Dorado",
      value: "Capacidade: 30",
      badge: betaOperations.registrationOpen === false
        ? "Inscrições Fechadas"
        : betaOperations.registrationOpen === true
        ? "Inscrições Abertas"
        : "Inscrições: Certificação Pendente",
      badgeType: betaOperations.registrationOpen === false
        ? "closed"
        : betaOperations.registrationOpen === true
        ? "open"
        : "unavailable",
      detail: betaOperations.isPendingCertification
        ? "Candidaturas em certificação na ADM.2.3"
        : `${number(betaOperations.activated ?? 0)} ativadas · Quarentena sintética ativa`,
      icon: "award"
    }
  ];

  return (
    <>
      <SectionHeader scope={scope} section="overview" />

      {/* 1. Command Header com escopo e integridade */}
      <div className="admin26-command-header">
        <div className="admin26-command-header__meta">
          <span className="admin26-command-header__tenant">
            <span className="admin26-command-header__tenant-dot" aria-hidden="true" />
            {isSuper
              ? (data?.selectedInstitutionId ? `Tenant Selecionado: ${institution.displayName || institution.name}` : "Escopo Global — Todas as Instituições")
              : `Tenant Ativo: ${institution.displayName || institution.name || "Instituição não identificada"}${institution.id ? ` (${institution.id})` : ""}`}
          </span>
          <span className="admin26-command-header__badge">
            <LineIcon name="check" className="h-3 w-3" />
            {data?.source === "supabase" && data?.quality?.status !== "restricted"
              ? "PostgREST Seguro"
              : data?.source === "restricted"
              ? "PostgREST Restrito"
              : "PostgREST: Não verificado"}
            {" · "}
            {isGuardActive
              ? "Session Guard Ativo"
              : isGuardUnavailable
              ? "Session Guard Indisponível"
              : "Session Guard: Não verificado"}
          </span>
        </div>
        <div className="admin26-command-header__time">
          {data?.lastUpdated
            ? `Última sincronização: ${dateTime(data.lastUpdated)} (Horário Local)`
            : "Última sincronização: Não sincronizado"}
        </div>
      </div>

      {/* 2. Topline Executive Pulse (5 Cards com ~33% menos altura) */}
      <div className="admin26-pulse-grid" role="region" aria-label="Indicadores executivos do centro de controle">
        {pulseMetrics.map((metric, idx) => (
          <A26Card key={idx} className="admin26-pulse-card" tone={isSuper ? "gold" : "teal"}>
            <div className="admin26-pulse-card__header">
              <span className="admin26-pulse-card__kicker">{metric.kicker}</span>
              <LineIcon name={metric.icon} className="admin26-pulse-card__icon" />
            </div>
            <div className="admin26-pulse-card__value">{metric.value}</div>
            <div className="admin26-pulse-card__footer">
              <span>{metric.detail}</span>
              <span className={`admin26-pulse-card__badge admin26-pulse-card__badge--${metric.badgeType}`}>
                {metric.badge}
              </span>
            </div>
          </A26Card>
        ))}
      </div>

      {/* 3. Grid dos 6 Núcleos Operacionais */}
      <div className="admin26-command-grid">
        {/* Coluna Principal (Esquerda - 60%) */}
        <div className="admin26-command-column">
          {/* NÚCLEO 2: Operação El Dorado (Comando Rápido) */}
          <A26Card className="admin26-funnel-card">
            <div className="admin26-funnel-header">
              <div>
                <p className="a26-kicker">Núcleo 2: Operações & Comunidade</p>
                <h3>Operação El Dorado — Programa Beta</h3>
                <p>Triagem, controle de vagas e admissão de discentes pioneiros.</p>
              </div>
              <A26Button variant="primary" onClick={() => navigate?.(isSuper ? "/super-admin/candidatos-beta" : "/admin/candidatos-beta")}>
                Abrir Triagem
              </A26Button>
            </div>
            <div className="admin26-funnel-grid">
              <div className="admin26-funnel-step">
                <span className="admin26-funnel-step__count">
                  {data?.betaOperations?.isPendingCertification || data?.betaOperations?.totalApplications == null
                    ? "—"
                    : number(data.betaOperations.totalApplications)}
                </span>
                <span className="admin26-funnel-step__label">Recebidos</span>
              </div>
              <div className="admin26-funnel-step">
                <span className="admin26-funnel-step__count">
                  {data?.betaOperations?.isPendingCertification || data?.betaOperations?.pending == null
                    ? "—"
                    : number(data.betaOperations.pending)}
                </span>
                <span className="admin26-funnel-step__label">Em Análise</span>
              </div>
              <div className="admin26-funnel-step">
                <span className="admin26-funnel-step__count">
                  {data?.betaOperations?.isPendingCertification || data?.betaOperations?.approved == null
                    ? "—"
                    : number(data.betaOperations.approved)}
                </span>
                <span className="admin26-funnel-step__label">Aprovados</span>
              </div>
              <div className="admin26-funnel-step">
                <span className="admin26-funnel-step__count">
                  {data?.betaOperations?.isPendingCertification || data?.betaOperations?.invited == null
                    ? "—"
                    : number(data.betaOperations.invited)}
                </span>
                <span className="admin26-funnel-step__label">Convidados</span>
              </div>
              <div className="admin26-funnel-step is-activated">
                <span className="admin26-funnel-step__count">
                  {data?.betaOperations?.isPendingCertification || data?.betaOperations?.activated == null
                    ? "—"
                    : number(data.betaOperations.activated)}
                </span>
                <span className="admin26-funnel-step__label">Ativados</span>
              </div>
            </div>
            <div className="admin26-funnel-notice">
              <span>
                <strong>Quarentena Sintética {data?.betaOperations ? "Ativa" : "Não verificada"}:</strong>{" "}
                {data?.betaOperations?.isPendingCertification
                  ? "Candidaturas em certificação na ADM.2.3 para isolamento de escopo."
                  : data?.betaOperations
                  ? "Registros de teste estão rigorosamente excluídos da contagem de produção."
                  : "Estado de quarentena não verificado."}
              </span>
              <span className={`admin26-pill ${data?.betaOperations?.registrationOpen === true ? "admin26-pill--qa" : "admin26-pill--unclassified"}`}>
                {data?.betaOperations?.registrationOpen === false
                  ? "Inscrições Fechadas"
                  : data?.betaOperations?.registrationOpen === true
                  ? "Inscrições Abertas"
                  : "Inscrições: Certificação Pendente"}
              </span>
            </div>
          </A26Card>

          {/* NÚCLEO 3: Analytics Intelligence — Ritmo de Utilização & Modelos 3D */}
          <A26Card className="admin26-core-card">
            <div className="admin26-card-heading">
              <div>
                <p className="a26-kicker">Núcleo 3: Analytics Intelligence</p>
                <h2>Ritmo de Utilização & Modelos 3D</h2>
                <p>Curva temporal e ranking anatômico derivados unicamente de viewer_learning_sessions.</p>
              </div>
              <A26Button variant="ghost" onClick={() => navigate?.(isSuper ? "/super-admin/analytics" : "/admin/global-analytics")}>
                Ver Analytics Completo
              </A26Button>
            </div>

            {/* Gráfico Temporal Executivo */}
            <div className="admin26-trend-section">
              <div className="admin26-trend-header">
                <span className="admin26-trend-title">Sessões 3D ao Longo do Tempo ({snapshot.label})</span>
                <span className="admin26-trend-comparison">
                  {isLogsUnavailable ? "Indisponível na fonte" : formatPeriodComparison(snapshot.accesses)}
                </span>
              </div>
              {isLogsUnavailable ? (
                <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--a26-color-text-muted)" }}>
                  <p style={{ margin: 0, fontSize: "0.875rem" }}>Curva temporal indisponível devido a falha na consulta de sessões.</p>
                </div>
              ) : (
                <div className="admin26-trend-chart" role="img" aria-label={`Sessões observadas nos ${snapshot.days} dias selecionados`}>
                  {createGovernanceSeries(snapshot).map((item, idx, arr) => {
                    const max = Math.max(...arr.map((i) => i.accesses), 1);
                    return (
                      <div key={item.id} className="admin26-trend-column">
                        <span className="admin26-trend-value">{number(item.accesses)}</span>
                        <span className="admin26-trend-track">
                          <span style={{ height: `${Math.max((item.accesses / max) * 100, item.accesses ? 8 : 2)}%` }} />
                        </span>
                        <small className="admin26-trend-label">{item.label}</small>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sub-título Ranking Anatômico */}
            <div className="admin26-ranking-heading">
              <span className="a26-metric__label">Modelos Anatômicos Mais Explorados — Histórico Observado</span>
            </div>

            <div className="admin26-ranking-list">
              {isLogsUnavailable ? (
                <div style={{ padding: "20px 16px", textAlign: "center", color: "var(--a26-color-text-muted)" }}>
                  <p style={{ margin: 0, fontSize: "0.875rem" }}>Ranking anatômico indisponível devido a falha na consulta de sessões.</p>
                </div>
              ) : mostAccessedModels.length > 0 ? (
                mostAccessedModels.map((model, idx) => (
                  <div key={model.id || idx} className="admin26-ranking-item">
                    <span className={`admin26-ranking-pos ${idx === 0 ? "is-top" : ""}`}>{idx + 1}</span>
                    <div>
                      <div className="admin26-ranking-title">{model.title || model.name || `Modelo ${model.id}`}</div>
                      <span className="admin26-ranking-system">{model.anatomicalSystem || model.system || "Anatomia Humana"}</span>
                    </div>
                    <div className="admin26-ranking-views">{number(model.views || model.accesses || 0)} acessos</div>
                    <div className="admin26-ranking-system">{number(model.totalStudyHours ?? model.studyHours ?? 0, 1)} h de estudo</div>
                  </div>
                ))
              ) : (
                <A26EmptyState title="Nenhum acesso no período" text="Nenhum modelo foi acessado na janela selecionada." />
              )}
            </div>
          </A26Card>

          {/* NÚCLEO 4: Gestão Institucional — Cadastros e Alunos Recentes */}
          {isSuper ? (
            <DenseTable
              title="Instituições observadas"
              description="Tenants retornados pelo escopo global da conta."
              rows={institutions}
              columns={[
                { key: "displayName", label: "Instituição", render: (row) => row.displayName || row.name },
                { key: "contractStatus", label: "Contrato" },
                { key: "registeredStudents", label: "Alunos", render: (row) => number(row.registeredStudents) },
                { key: "contractedCapacity", label: "Capacidade", render: (row) => row.contractedCapacity ? number(row.contractedCapacity) : "—" }
              ]}
              emptyTitle="Nenhuma instituição visível"
              emptyText="A política global retornou zero tenants; nenhuma instituição de demonstração foi inserida."
              onInspect={(row) => onInspect({
                title: row.displayName || row.name || "Instituição",
                subtitle: "Tenant observado",
                fields: [["ID", row.id], ["Contrato", row.contractStatus], ["Capacidade", row.contractedCapacity || "Não informada"]]
              })}
            />
          ) : (
            <A26Card className="admin26-core-card">
              <div className="admin26-card-heading">
                <div>
                  <p className="a26-kicker">Núcleo 4: Gestão Institucional</p>
                  <h2>Alunos Observados no Tenant</h2>
                  <p>Classificação operacional sem suposições artificiais de curso ou semestre.</p>
                </div>
                <A26Button variant="ghost" onClick={() => navigate?.(isSuper ? "/super-admin/students" : "/admin/institution-students")}>
                  Ver Todos ({rawStudents.length})
                </A26Button>
              </div>

              {/* Pílulas de Filtro Rápido */}
              <div className="admin26-pill-filters">
                {[
                  { key: "all", label: `Todos (${rawStudents.length})` },
                  { key: "founder", label: `Fundadores (${rawStudents.filter(s => s.accountCategoryKey === "founder").length})` },
                  { key: "commercial", label: `Comercial (${rawStudents.filter(s => s.accountCategoryKey === "commercial").length})` },
                  { key: "beta", label: `Beta Ativado (${rawStudents.filter(s => s.accountCategoryKey === "beta").length})` },
                  { key: "qa", label: `QA (${rawStudents.filter(s => s.accountCategoryKey === "qa").length})` },
                  { key: "demo", label: `Demo (${rawStudents.filter(s => s.accountCategoryKey === "demo").length})` },
                  { key: "unclassified", label: `Não Classificado (${rawStudents.filter(s => s.accountCategoryKey === "unclassified").length})` }
                ].map(filter => (
                  <button
                    key={filter.key}
                    type="button"
                    className={`admin26-pill-btn ${studentCategoryFilter === filter.key ? "is-active" : ""}`}
                    onClick={() => setStudentCategoryFilter(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <DenseTable
                title=""
                description=""
                rows={filteredStudents.slice(0, 6)}
                columns={[
                  { key: "name", label: "Aluno" },
                  {
                    key: "accountCategory",
                    label: "Classificação",
                    render: (row) => (
                      <span className={`admin26-pill admin26-pill--${row.accountCategoryKey || "unclassified"}`}>
                        {row.accountCategoryLabel || "Não Classificado"}
                      </span>
                    )
                  },
                  { key: "registration", label: "Matrícula", render: (row) => (row.registration === "—" ? <span className="text-textMuted">—</span> : row.registration) },
                  { key: "course", label: "Curso", render: (row) => (row.course === "—" ? <span className="text-textMuted">—</span> : row.course) },
                  {
                    key: "profileStatus",
                    label: "Perfil",
                    render: (row) => (
                      <span className={`admin26-pill admin26-pill--${row.isProfileMissing ? "qa" : "commercial"}`}>
                        {row.profileStatusLabel || (row.isProfileMissing ? "Não cadastrado" : "Disponível")}
                      </span>
                    )
                  },
                  { key: "totalAccesses", label: "Acessos", render: (row) => number(row.totalAccesses) }
                ]}
                emptyTitle="Nenhum aluno neste filtro"
                emptyText="Nenhum aluno corresponde à classificação selecionada."
                onInspect={onInspect}
              />
            </A26Card>
          )}
        </div>

        {/* Coluna Lateral (Direita - 40%) */}
        <div className="admin26-command-column">
          {/* NÚCLEO 1: Prioridades Operacionais (Alertas) */}
          <section aria-labelledby="admin26-priority-title">
            <div className="admin26-card-heading">
              <div>
                <p className="a26-kicker">Núcleo 1: Centro Operacional</p>
                <h2 id="admin26-priority-title">Prioridades de Decisão</h2>
              </div>
            </div>
            <PriorityStack alerts={alerts} onInspect={onInspect} />
          </section>

          {/* NÚCLEO 5: Financial Intelligence & Sandbox B2B */}
          <A26Card className="admin26-core-card">
            <div className="admin26-card-heading">
              <div>
                <p className="a26-kicker">Núcleo 5: Financial Intelligence</p>
                <h2>Inteligência Financeira B2B</h2>
                <p>Contratos formais e sandbox de projeção institucional.</p>
              </div>
            </div>

            <div className="admin26-finance-brief">
              <div className="admin26-brief-item">
                <span className="a26-metric__label">Receita Contratual Base (MRR)</span>
                <strong className="admin26-detail-value">
                  {data?.stats?.contractCertified ? money(data.stats.contractedRevenue) : "NÃO CERTIFICADO"}
                </strong>
                <small className="text-textMuted">
                  {data?.stats?.contractCertified ? "Capacidade acordada × preço" : "Parâmetros dependem de certificação formal na ADM.2.6"}
                </small>
              </div>

              <div className="admin26-brief-item" style={{ marginTop: "10px" }}>
                <span className="a26-metric__label">Receita Faturada e Realizada</span>
                <strong className="admin26-detail-value">NÃO DISPONÍVEL</strong>
                <small className="text-textMuted">Sem faturamento emitido (Requer conciliação bancária ADM.2.6)</small>
              </div>

              {/* Simulador de Projeção B2B */}
              <div className="admin26-simulator-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="admin26-simulator-badge">Projeção Teórica Não Contratual</span>
                  <small style={{ color: "var(--a26-color-teal)" }}>R$ 45,00 / licença</small>
                </div>
                <div className="admin26-simulator-scenarios">
                  <div className="admin26-simulator-item">
                    <small>100 alunos</small>
                    <strong>{money(100 * 45)}</strong>
                  </div>
                  <div className="admin26-simulator-item">
                    <small>300 alunos</small>
                    <strong>{money(300 * 45)}</strong>
                  </div>
                  <div className="admin26-simulator-item">
                    <small>500 alunos</small>
                    <strong>{money(500 * 45)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </A26Card>

          {/* NÚCLEO 6: Governança, Fontes e Integridade de Dados */}
          <A26Card className="admin26-core-card admin26-governance-card">
            <div className="admin26-card-heading">
              <div>
                <p className="a26-kicker">Núcleo 6: Governança & Integridade</p>
                <h2>Status de Conectividade</h2>
                <p>Auditoria em tempo real das fontes canônicas de dados.</p>
              </div>
            </div>
            <dl className="admin26-brief dl" style={{ margin: 0 }}>
              <div>
                <dt>Sessões 3D (PostgREST)</dt>
                <dd style={{ color: getTableStateColor(data?.quality?.tables?.activityLogs) }}>
                  {formatTableState(
                    data?.quality?.tables?.activityLogs,
                    data?.sourceCoverage?.observedCounts?.viewerSessions ?? data?.quality?.tables?.activityLogs?.rows,
                    "observadas"
                  )}
                </dd>
              </div>
              <div>
                <dt>Eventos da Plataforma</dt>
                <dd style={{ color: getTableStateColor(data?.quality?.tables?.platformEvents) }}>
                  {formatTableState(
                    data?.quality?.tables?.platformEvents,
                    data?.sourceCoverage?.observedCounts?.platformEvents ?? data?.quality?.tables?.platformEvents?.rows,
                    "observados"
                  )}
                </dd>
              </div>
              <div>
                <dt>Tabela academic_subjects</dt>
                <dd style={{ color: getTableStateColor(data?.quality?.tables?.subjects, true) }}>
                  {formatTableState(data?.quality?.tables?.subjects, 0, "registros", true)}
                </dd>
              </div>
              <div>
                <dt>Session Guard (Sessão Única)</dt>
                <dd style={{
                  color: isGuardActive
                    ? "var(--a26-color-teal)"
                    : isGuardUnavailable
                    ? "var(--a26-color-danger, #ef4444)"
                    : "var(--a26-color-text-muted)"
                }}>
                  {isGuardActive
                    ? "Ativo (First Session Wins)"
                    : isGuardUnavailable
                    ? "Indisponível (Falha de verificação)"
                    : "Não verificado"}
                </dd>
              </div>
              <div>
                <dt>Marina Orb (Tutor IA)</dt>
                <dd style={{ color: "var(--a26-color-text-subtle)" }}>100% Isolada (Bloqueio ADM)</dd>
              </div>
            </dl>
            <div style={{ marginTop: "var(--a26-space-4)", display: "flex", justifyContent: "flex-end" }}>
              <A26Button
                variant="ghost"
                size="small"
                onClick={() => navigate?.(isSuper ? "/super-admin/infrastructure" : "/admin/infrastructure")}
              >
                Abrir Monitor de Infraestrutura →
              </A26Button>
            </div>
          </A26Card>
        </div>
      </div>
    </>
  );
}

function InstitutionSection({ scope, data }) {
  const institution = data?.institution || {};
  const available = Boolean(institution.id || institution.name || institution.displayName);
  return (
    <>
      <SectionHeader scope={scope} section="institution" />
      {!available ? (
        <A26EmptyState title="Instituição não observável" text="Nenhum tenant foi retornado para a seleção e a política atuais." />
      ) : (
        <div className="admin26-detail-grid">
          {[
            ["Instituição", institution.displayName || institution.name],
            ["Identificador", institution.id],
            ["Contrato", institution.contractStatus || institution.licenseStatus],
            ["Capacidade", institution.contractedCapacity ? number(institution.contractedCapacity) : "Não informada"],
            ["Preço por aluno", institution.pricePerStudent ? money(institution.pricePerStudent) : "Não informado"],
            ["Responsável", institution.institutionalResponsible || "Não informado"],
            ["E-mail administrativo", institution.administrativeEmail || "Não informado"],
            ["Próxima renovação", institution.nextRenewal ? dateTime(institution.nextRenewal) : "Não informada"]
          ].map(([label, value]) => <A26Card key={label}><span className="a26-metric__label">{label}</span><strong className="admin26-detail-value">{value || "Não informado"}</strong></A26Card>)}
        </div>
      )}
    </>
  );
}

function StudentsSection({ scope, data, query, onInspect, onReview, onExport, canReview }) {
  const rows = filterRows(data?.students || [], query);
  return (
    <>
      <SectionHeader scope={scope} section="students" actions={<A26Button onClick={onExport} icon={<LineIcon name="download" />}>Exportar registros</A26Button>} />
      <DenseTable
        title="Cadastros institucionais"
        description="Estados de conta e atividade derivados da fonte autorizada."
        rows={rows}
        columns={[
          { key: "name", label: "Aluno" },
          {
            key: "accountCategory",
            label: "Classificação",
            render: (row) => (
              <span className={`admin26-pill admin26-pill--${row.accountCategoryKey || "unclassified"}`}>
                {row.accountCategoryLabel || "Não Classificado"}
              </span>
            )
          },
          { key: "email", label: "E-mail" },
          { key: "registration", label: "Matrícula", render: (row) => (row.registration === "—" ? <span className="text-textMuted">—</span> : row.registration) },
          { key: "course", label: "Curso", render: (row) => (row.course === "—" ? <span className="text-textMuted">—</span> : row.course) },
          { key: "semester", label: "Semestre", render: (row) => (row.semester === "—" ? <span className="text-textMuted">—</span> : row.semester) },
          {
            key: "profileStatus",
            label: "Perfil",
            render: (row) => (
              <span className={`admin26-pill admin26-pill--${row.isProfileMissing ? "qa" : "commercial"}`}>
                {row.profileStatusLabel || (row.isProfileMissing ? "Não cadastrado" : "Disponível")}
              </span>
            )
          },
          { key: "status", label: "Status" },
          { key: "totalAccesses", label: "Acessos", render: (row) => number(row.totalAccesses) },
          { key: "lastAccess", label: "Último acesso", render: (row) => dateTime(row.lastAccess) }
        ]}
        emptyTitle="Nenhum aluno visível"
        emptyText="A consulta retornou zero cadastros acadêmicos para o tenant atual."
        onInspect={(row) => onInspect({
          title: row.name || "Aluno",
          subtitle: "Contexto institucional",
          fields: [
            ["Classificação", row.accountCategoryLabel || "Não Classificado"],
            ["E-mail", row.email],
            ["Status", row.status],
            ["Status do perfil", row.profileStatusLabel || (row.isProfileMissing ? "Não cadastrado" : "Disponível")],
            ["Matrícula", row.registration || "—"],
            ["Curso", row.course || "—"],
            ["Semestre", row.semester || "—"],
            ["Acessos", row.totalAccesses],
            ["Minutos de estudo", row.totalStudyMinutes]
          ],
          actions: canReview && ["pending", "pendente"].includes(String(row.status || "").toLowerCase())
            ? <><A26Button onClick={() => onReview(row, "reject")} variant="danger">Rejeitar</A26Button><A26Button onClick={() => onReview(row, "approve")} variant="primary">Aprovar</A26Button></>
            : null
        })}
      />
    </>
  );
}

function AnalyticsSection({ scope, section, data, snapshot, query, onInspect }) {
  const series = filterRows(createGovernanceSeries(snapshot), query);
  const models = filterRows(createAdministrationModelRows(data, snapshot), query);
  return (
    <>
      <SectionHeader scope={scope} section={section} />
      <MetricGrid metrics={[
        { label: "Acessos", value: number(snapshot.accesses.current), detail: snapshot.label, trend: formatPeriodComparison(snapshot.accesses) },
        { label: "Usuários com atividade", value: number(snapshot.activeUsers.current), detail: snapshot.label, trend: formatPeriodComparison(snapshot.activeUsers) },
        { label: "Tempo registrado", value: `${number(snapshot.studyMinutes.current)} min`, detail: snapshot.label, trend: formatPeriodComparison(snapshot.studyMinutes) },
        { label: "Eventos", value: number(snapshot.events.current), detail: snapshot.label, trend: formatPeriodComparison(snapshot.events) }
      ]} />
      <DenseTable
        title="Atividade por intervalo"
        description="Série derivada dos acessos do período selecionado."
        rows={series.filter((row) => row.accesses || row.studyMinutes || row.users)}
        columns={[
          { key: "label", label: "Intervalo" },
          { key: "accesses", label: "Acessos", render: (row) => number(row.accesses) },
          { key: "studyMinutes", label: "Minutos", render: (row) => number(row.studyMinutes) },
          { key: "users", label: "Usuários", render: (row) => number(row.users) }
        ]}
        emptyTitle="Sem atividade observável"
        emptyText="Nenhum acesso foi retornado na janela atual."
      />
      <DenseTable
        title="Utilização de modelos"
        description="Ranking restrito aos acessos observados na janela atual."
        rows={models}
        columns={[
          { key: "title", label: "Modelo" },
          { key: "system", label: "Sistema" },
          { key: "accesses", label: "Acessos", render: (row) => number(row.accesses) },
          { key: "hours", label: "Horas", render: (row) => number(row.hours, 1) }
        ]}
        emptyTitle="Nenhum modelo utilizado"
        emptyText="Não há acessos a modelos na janela selecionada."
        onInspect={(row) => onInspect({ title: row.title, subtitle: "Utilização observada", fields: [["Sistema", row.system], ["Acessos", row.accesses], ["Horas", row.hours]] })}
      />
    </>
  );
}

function AcademicSection({ scope, data, snapshot }) {
  const quizSourceAvailable = Boolean(data?.quality?.tables?.quizAttempts);
  return (
    <>
      <SectionHeader scope={scope} section="academic_analytics" />
      <MetricGrid metrics={[
        { label: "Sessões 3D observadas", value: number(snapshot.accesses.current), detail: snapshot.label },
        { label: "Tempo de estudo", value: `${number(snapshot.studyMinutes.current)} min`, detail: snapshot.label },
        { label: "Tentativas de quiz", value: quizSourceAvailable ? number(data?.analytics?.snapshot?.quizAttempts) : "—", detail: quizSourceAvailable ? "Fonte consultada" : "Fonte fora do contrato atual" }
      ]} />
      <A26EmptyState
        title={quizSourceAvailable ? "Nenhuma tentativa observada" : "Resultados acadêmicos ainda não certificados"}
        text="Desempenho, dificuldade e resultado de aprendizagem exigem uma fonte de tentativas vinculada ao tenant. Atividade de uso não foi convertida em nota."
      />
    </>
  );
}

function ReturnSection({ scope, data }) {
  const institution = data?.institution || {};
  const capacity = Number(data?.stats?.contractedCapacity || institution.contractedCapacity || 0);
  const price = Number(institution.pricePerStudent || 0);
  const hasContract = capacity > 0 && price > 0;

  return (
    <>
      <SectionHeader scope={scope} section="roi" />
      <MetricGrid metrics={[
        {
          label: "Capacidade contratada",
          value: capacity > 0 ? `${number(capacity)} licenças` : "NÃO CONFIGURADO",
          detail: capacity > 0 ? "Licenças acordadas" : "Sem base contratual no tenant"
        },
        {
          label: "Receita contratual",
          value: (data?.stats?.contractCertified && hasContract) ? money(capacity * price) : "NÃO CERTIFICADO",
          detail: data?.stats?.contractCertified ? "Capacidade × preço contratual certificado" : "Parâmetros contratuais não certificados (Requer ADM.2.6)"
        },
        {
          label: "Receita realizada",
          value: "NÃO DISPONÍVEL",
          detail: "Sem faturamento emitido (Requer ADM.2.6)"
        }
      ]} />
      <A26EmptyState
        title="ROI não inferido"
        text="Impacto pedagógico, economia laboratorial, payback e margem exigem custos e resultados comprovados. Nenhuma dessas medidas foi estimada a partir de cliques ou tempo de uso."
      />
    </>
  );
}

function HeatmapSection({ scope, data, snapshot, query, onInspect }) {
  const rows = filterRows(createAdministrationSystemRows(data, snapshot), query);
  return (
    <>
      <SectionHeader scope={scope} section="heatmap" />
      <DenseTable
        title="Tempo por sistema anatômico"
        description={`Agregação dos registros em ${snapshot.label.toLowerCase()}.`}
        rows={rows}
        columns={[
          { key: "system", label: "Sistema" },
          { key: "hours", label: "Horas", render: (row) => number(row.hours, 1) },
          { key: "percentage", label: "Participação", render: (row) => percentage(row.percentage) }
        ]}
        emptyTitle="Mapa sem atividade observável"
        emptyText="Nenhum tempo de estudo por sistema foi retornado."
        onInspect={(row) => onInspect({ title: row.system, subtitle: "Distribuição observada", fields: [["Horas", row.hours], ["Participação", percentage(row.percentage)]] })}
      />
    </>
  );
}

function CatalogGovernanceSection({ scope, section, data, query, navigate, onInspect }) {
  const rows = filterRows((data?.raw?.models || []).map((model) => ({
    ...model,
    displayStatus: model.status || "Não informado",
    evidence: model.status ? "Registro editorial" : "Estado não certificado"
  })), query);
  return (
    <>
      <SectionHeader scope={scope} section={section} />
      <DenseTable
        title="Catálogo 3D"
        description="Registros retornados por models_3d. O Viewer oficial utiliza Sketchfab."
        rows={rows}
        columns={[
          { key: "title", label: "Modelo", render: (row) => row.title || row.slug },
          { key: "anatomical_system", label: "Sistema" },
          { key: "displayStatus", label: "Estado editorial" },
          { key: "evidence", label: "Evidência", render: () => "Registro do catálogo" }
        ]}
        emptyTitle="Nenhum modelo visível"
        emptyText="A fonte de catálogo retornou zero registros para o escopo atual."
        onInspect={(row) => onInspect({
          title: row.title || row.slug || "Modelo 3D",
          subtitle: "Registro do catálogo",
          fields: [["ID", row.id], ["Slug", row.slug], ["Sistema", row.anatomical_system], ["Estado editorial", row.displayStatus], ["Motor", "Sketchfab"]],
          actions: <A26Button variant="primary" onClick={() => navigate(`/viewer/${row.slug || row.id}`)}>Abrir visualizador</A26Button>
        })}
      />
    </>
  );
}

function BillingSection({ scope, data }) {
  const institution = data?.institution || {};
  const capacity = Number(data?.stats?.contractedCapacity || institution.contractedCapacity || 0);
  const price = Number(institution.pricePerStudent || 0);
  const registered = Number(data?.stats?.registeredStudents || 0);
  const active = Number(data?.stats?.activeStudents || 0);
  const hasContractualParams = capacity > 0 && price > 0;
  const simulationPrice = 45; // Premissa explícita para projeção comercial

  return (
    <>
      <SectionHeader scope={scope} section="billing" />

      {/* 1. Receita Contratada (MRR Base) */}
      <div className="admin26-card-heading">
        <div>
          <h2>1. Receita Contratada (MRR Base)</h2>
          <p>Valores formalmente acordados no contrato institucional ativo.</p>
        </div>
      </div>
      <MetricGrid metrics={[
        {
          label: "Capacidade contratada",
          value: capacity > 0 ? `${number(capacity)} licenças` : "NÃO CONFIGURADO",
          detail: capacity > 0 ? "Licenças sob contrato" : "Sem base de capacidade no tenant"
        },
        {
          label: "Valor unitário contratual",
          value: price > 0 ? money(price) : "NÃO CONFIGURADO",
          detail: price > 0 ? "Preço acordado por aluno (BRL)" : "Sem tarifação ativa no tenant"
        },
        {
          label: "MRR Contratual Base",
          value: (data?.stats?.contractCertified && hasContractualParams) ? money(capacity * price) : "NÃO CERTIFICADO",
          detail: data?.stats?.contractCertified ? "Capacidade × valor unitário certificado" : "Requer certificação contratual de licenças faturáveis na ADM.2.6"
        }
      ]} />

      {/* 2. Receita Faturada e Recebida */}
      <div className="admin26-card-heading" style={{ marginTop: "var(--a26-space-4)" }}>
        <div>
          <h2>2. Receita Faturada e Recebida</h2>
          <p>Registros financeiros de faturamento emitido e conciliação bancária.</p>
        </div>
      </div>
      <MetricGrid metrics={[
        {
          label: "Receita faturada no ciclo",
          value: "NÃO CONFIGURADO",
          detail: "Sem faturas emitidas no ciclo atual (Tenant em homologação)"
        },
        {
          label: "Receita recebida (liquidada)",
          value: "NÃO DISPONÍVEL",
          detail: "Requer conciliação bancária / gateway — Planejado para ADM.2.6"
        },
        {
          label: "Base de alunos ativa",
          value: `${number(active)} ativo(s) de ${number(registered)}`,
          detail: "Estudantes verificados no tenant"
        }
      ]} />

      {/* 3. Projeções Comerciais de Escala (Simulação B2B) */}
      <div className="admin26-card-heading" style={{ marginTop: "var(--a26-space-4)" }}>
        <div>
          <h2>3. Projeções Comerciais de Escala (Simulação B2B)</h2>
          <p>Modelagem de expansão institucional — Premissa explícita de simulação: {money(simulationPrice)} / licença.</p>
        </div>
      </div>
      <MetricGrid metrics={[
        {
          label: "Cenário 100 licenças (Simulado)",
          value: money(100 * simulationPrice),
          detail: `100 alunos × ${money(simulationPrice)} (Projeção)`
        },
        {
          label: "Cenário 300 licenças (Simulado)",
          value: money(300 * simulationPrice),
          detail: `300 alunos × ${money(simulationPrice)} (Referência Piloto)`
        },
        {
          label: "Cenário 500 licenças (Simulado)",
          value: money(500 * simulationPrice),
          detail: `500 alunos × ${money(simulationPrice)} (Projeção)`
        }
      ]} />

      <A26Card className="admin26-detail-notice" style={{ marginTop: "var(--a26-space-4)" }}>
        <strong>Nota de Governança Financeira (P0.21-ADM.2.1-R1)</strong>
        <p>
          Este painel distingue estritamente entre Receita Contratada, Receita Faturada, Receita Recebida e Projeções Simuladas.
          Valores de faturamento não são inferidos a partir do número de alunos ativos. A integração com gateways de pagamento
          e conciliação contábil formal está reservada para a etapa ADM.2.6.
        </p>
      </A26Card>
    </>
  );
}

function ReportsSection({ scope, data, snapshot, onExport, onPrint }) {
  return (
    <>
      <SectionHeader scope={scope} section="reports" actions={<><A26Button onClick={onPrint}>Imprimir</A26Button><A26Button variant="primary" onClick={onExport}>Exportar CSV</A26Button></>} />
      <MetricGrid metrics={[
        { label: "Acessos no relatório", value: number(snapshot.accesses.current), detail: snapshot.label },
        { label: "Minutos observados", value: number(snapshot.studyMinutes.current), detail: snapshot.label },
        { label: "Usuários com atividade", value: number(snapshot.activeUsers.current), detail: snapshot.label },
        { label: "Modelos visíveis", value: number(data?.raw?.models?.length), detail: "Catálogo retornado" }
      ]} />
      <A26Card>
        <h2>Escopo do relatório</h2>
        <p className="admin26-long-copy">A exportação contém somente valores observados na sessão atual, o período selecionado e a identificação da fonte. PDF financeiro, acadêmico ou executivo não é simulado quando o backend correspondente não está conectado.</p>
      </A26Card>
    </>
  );
}

function SettingsSection({ scope, data }) {
  return (
    <>
      <SectionHeader scope={scope} section="settings" />
      <div className="admin26-detail-grid">
        <A26Card><span className="a26-metric__label">Papel efetivo</span><strong className="admin26-detail-value">{scope}</strong></A26Card>
        <A26Card><span className="a26-metric__label">Escopo</span><strong className="admin26-detail-value">{data?.scope || "Não certificado"}</strong></A26Card>
        <A26Card><span className="a26-metric__label">Fonte</span><strong className="admin26-detail-value">{data?.source || "Não certificada"}</strong></A26Card>
        <A26Card><span className="a26-metric__label">Tenant</span><strong className="admin26-detail-value">{data?.institution?.displayName || data?.selectedInstitutionId || "Global permitido"}</strong></A26Card>
      </div>
      <A26EmptyState title="Preferências mutáveis não conectadas" text="Domínios, responsáveis, integrações e políticas não são exibidos como editáveis até existir uma operação persistente e auditável." />
    </>
  );
}

function DigitalTwinsSection({ scope }) {
  return (
    <>
      <SectionHeader scope={scope} section="digital_twins" />
      <A26Card className="admin26-contract-note is-planned">
        <LineIcon name="layers" />
        <div><strong>Planejado · não operacional</strong><p>Nenhum gêmeo digital é apresentado como disponível. O módulo exige proveniência, consentimento, versionamento clínico, armazenamento, vínculo institucional e trilha de auditoria.</p></div>
      </A26Card>
      <div className="admin26-detail-grid">
        {["Proveniência anatômica", "Consentimento e privacidade", "Versionamento clínico", "Política institucional"].map((item) => (
          <A26Card key={item}><span className="a26-metric__label">{item}</span><strong className="admin26-detail-value">Pendente</strong></A26Card>
        ))}
      </div>
    </>
  );
}

export default function AdministrativeOperationsPage({ user, section = "overview", path = window.location.pathname, navigate, notify = () => {} }) {
  const scope = normalizeRole(user?.role, user);
  const isSuper = scope === ROLES.SUPER_ADMIN;
  const current = adminSectionFromPath(path, section === "dashboard" ? "overview" : section);
  const [data, setData] = useState(() => getRestrictedInstitutionDashboardData(null, "Validando sessão administrativa."));
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(30);
  const [query, setQuery] = useState("");
  const [selectedInstitutionId, setSelectedInstitutionId] = useState("");
  const [detail, setDetail] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [mutating, setMutating] = useState(false);
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const request = ++requestRef.current;
    setStatus("loading");
    setError(null);
    try {
      const result = await loadInstitutionDashboardData({
        institutionId: isSuper ? selectedInstitutionId || null : null
      });
      if (request !== requestRef.current) return;
      setData(result);
      setStatus("ready");
    } catch (loadError) {
      console.error("[administration] Falha ao carregar experiência operacional.", loadError);
      if (request !== requestRef.current) return;
      setError(loadError);
      setData(getRestrictedInstitutionDashboardData(null, "Falha ao validar fontes administrativas."));
      setStatus("error");
    }
  }, [isSuper, selectedInstitutionId]);

  useEffect(() => {
    load();
    return () => {
      requestRef.current += 1;
    };
  }, [load]);

  useEffect(() => {
    setQuery("");
    setDetail(null);
  }, [current]);

  const snapshot = useMemo(() => createGovernancePeriodSnapshot(data, period), [data, period]);
  const alerts = useMemo(() => createAdministrationAlerts(scope, data, snapshot), [scope, data, snapshot]);
  const sourceState = administrationSourceState(data, status, error);
  const showSearch = ["overview", "students", "analytics", "heatmap", "models_3d", "viewer_analytics"].includes(current);
  const showPeriod = ["overview", "analytics", "academic_analytics", "heatmap", "viewer_analytics", "reports"].includes(current);

  function exportStudents() {
    const students = data?.students || [];
    downloadCsv("aeternum-alunos-observados.csv", [
      ["Nome", "E-mail", "Curso", "Status", "Acessos", "Minutos de estudo", "Fonte"],
      ...students.map((student) => [student.name, student.email, student.course, student.status, student.totalAccesses, student.totalStudyMinutes, data?.source])
    ]);
    notify("Registros observados exportados.");
  }

  function exportReport() {
    downloadCsv("aeternum-relatorio-operacional.csv", [
      ["Métrica", "Valor", "Período", "Fonte"],
      ["Acessos", snapshot.accesses.current, snapshot.label, data?.source],
      ["Minutos de estudo", snapshot.studyMinutes.current, snapshot.label, data?.source],
      ["Usuários com atividade", snapshot.activeUsers.current, snapshot.label, data?.source],
      ["Eventos", snapshot.events.current, snapshot.label, data?.source]
    ]);
    notify("Relatório operacional exportado.");
  }

  async function confirmRegistrationReview() {
    if (!confirmation?.student || !confirmation?.decision) return;
    if (data?.source !== "supabase") {
      notify("A revisão exige uma sessão Supabase autorizada e não foi executada.");
      setConfirmation(null);
      return;
    }
    setMutating(true);
    try {
      await reviewPendingUserRegistration({
        studentId: confirmation.student.id,
        institutionId: data?.institution?.id || confirmation.student.institutionId,
        decision: confirmation.decision
      });
      notify(confirmation.decision === "approve" ? "Cadastro aprovado." : "Cadastro rejeitado.");
      setConfirmation(null);
      setDetail(null);
      await load();
    } catch (mutationError) {
      notify(mutationError.message || "Não foi possível concluir a revisão.");
    } finally {
      setMutating(false);
    }
  }

  let content;
  if (status === "loading") {
    content = <><SectionHeader scope={scope} section={current} /><A26LoadingState title="Validando a operação" text="Consultando tenant, papel e fontes autorizadas." /></>;
  } else if (status === "error") {
    content = <><SectionHeader scope={scope} section={current} /><A26ErrorState title="Operação indisponível" text="A consulta falhou e nenhum dado anterior foi reapresentado." action={<A26Button onClick={load}>Tentar novamente</A26Button>} /></>;
  } else if (current === "overview") {
    content = <OverviewSection scope={scope} data={data} snapshot={snapshot} alerts={alerts} query={query} onInspect={setDetail} navigate={navigate} />;
  } else if (current === "institution") {
    content = <InstitutionSection scope={scope} data={data} />;
  } else if (current === "students") {
    content = <StudentsSection scope={scope} data={data} query={query} onInspect={setDetail} onReview={(student, decision) => setConfirmation({ student, decision })} onExport={exportStudents} canReview={data?.source === "supabase"} />;
  } else if (current === "analytics" || current === "viewer_analytics") {
    content = <AnalyticsSection scope={scope} section={current} data={data} snapshot={snapshot} query={query} onInspect={setDetail} />;
  } else if (current === "academic_analytics") {
    content = <AcademicSection scope={scope} data={data} snapshot={snapshot} />;
  } else if (current === "roi") {
    content = <ReturnSection scope={scope} data={data} />;
  } else if (current === "heatmap") {
    content = <HeatmapSection scope={scope} data={data} snapshot={snapshot} query={query} onInspect={setDetail} />;
  } else if (current === "models_3d") {
    content = <CatalogGovernanceSection scope={scope} section={current} data={data} query={query} navigate={navigate} onInspect={setDetail} />;
  } else if (current === "billing") {
    content = <BillingSection scope={scope} data={data} />;
  } else if (current === "reports") {
    content = <ReportsSection scope={scope} data={data} snapshot={snapshot} onExport={exportReport} onPrint={() => window.print()} />;
  } else if (current === "settings") {
    content = <SettingsSection scope={scope} data={data} />;
  } else if (current === "digital_twins") {
    content = <DigitalTwinsSection scope={scope} />;
  } else if (current === "import_students") {
    content = <><SectionHeader scope={scope} section={current} /><A26EmptyState title="Importação acadêmica pausada" text="O importador legado dependia de tabelas que não pertencem ao esquema autorizado atual. Nenhum arquivo será processado até a publicação do contrato acadêmico canônico." /></>;
  } else if (current === "announcements") {
    content = <AnnouncementsManagementSection scope={scope} data={data} notify={notify} />;
  } else if (current === "beta_candidates") {
    content = <BetaCandidatesManagementSection />;
  } else if (current === "infrastructure") {
    content = <InfrastructureMonitorSection scope={scope} institutionId={data?.institution?.id} />;
  } else {
    content = <><SectionHeader scope={scope} section={current} /><A26EmptyState title="Módulo sem contrato ativo" text="A rota existe, mas ainda não possui uma operação verificável para este papel." /></>;
  }

  return (
    <section
      className={`admin26-page admin26-page--${isSuper ? "super" : "institution"}`}
      data-testid="a26-administration-experience"
      data-a26-role={scope}
      data-a26-section={current}
      data-a26-source={sourceState.key}
    >
      <A26Toolbar label="Ferramentas administrativas" className="admin26-toolbar">
        {showPeriod ? <A26SegmentedControl label="Período de análise" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} /> : null}
        {showSearch ? <A26Field label="Filtrar registros" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar no módulo" /> : null}
        {isSuper && data?.source === "supabase" ? (
          <A26Field as="select" label="Escopo institucional" value={selectedInstitutionId} onChange={(event) => setSelectedInstitutionId(event.target.value)}>
            <option value="">Todas as instituições permitidas</option>
            {(data?.institutions || []).map((institution) => <option key={institution.id} value={institution.id}>{institution.displayName || institution.name || institution.id}</option>)}
          </A26Field>
        ) : null}
        <A26Button onClick={load} loading={status === "loading"} icon={<LineIcon name="refresh" />}>Atualizar</A26Button>
      </A26Toolbar>

      <SourceNotice state={sourceState} data={data} />
      {content}
      <Coverage quality={data?.quality} source={data?.source} scope={scope} />

      <A26Modal
        open={Boolean(detail)}
        title={detail?.title || "Contexto"}
        description={detail?.subtitle}
        onClose={() => setDetail(null)}
        actions={detail?.actions || <A26Button variant="primary" onClick={() => setDetail(null)}>Concluir leitura</A26Button>}
      >
        <dl className="admin26-modal-fields">
          {(detail?.fields || []).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? "Não informado"}</dd></div>)}
        </dl>
      </A26Modal>

      <A26Modal
        open={Boolean(confirmation)}
        title={confirmation?.decision === "approve" ? "Aprovar cadastro?" : "Rejeitar cadastro?"}
        description="Esta ação altera o estado persistido da conta e exige confirmação explícita."
        onClose={() => !mutating && setConfirmation(null)}
        actions={<>
          <A26Button onClick={() => setConfirmation(null)} disabled={mutating}>Cancelar</A26Button>
          <A26Button variant={confirmation?.decision === "approve" ? "primary" : "danger"} loading={mutating} onClick={confirmRegistrationReview}>
            {confirmation?.decision === "approve" ? "Confirmar aprovação" : "Confirmar rejeição"}
          </A26Button>
        </>}
      >
        <p>Conta: <strong>{confirmation?.student?.name || confirmation?.student?.email}</strong></p>
      </A26Modal>
    </section>
  );
}
