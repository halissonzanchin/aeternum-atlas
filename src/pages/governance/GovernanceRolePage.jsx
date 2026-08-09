/* eslint-disable no-unused-vars -- o parser ESLint atual não contabiliza identificadores usados apenas em JSX */
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { COORDINATOR_SECTIONS, RECTOR_SECTIONS } from "../../config/governanceRoutes";
import { loadInstitutionDashboardData } from "../../services/admin/institutionDashboardService";
import {
  createGovernanceAlerts,
  createGovernancePeriodSnapshot,
  createGovernanceSeries,
  formatPeriodComparison
} from "./governanceDecisionModel";
import "./governanceRolePage.css";

const ROLE_COPY = {
  coordinator: {
    eyebrow: "Coordenação acadêmica",
    description: "Decisões pedagógicas orientadas por evidência, prioridades e contexto institucional.",
    sections: COORDINATOR_SECTIONS
  },
  rector: {
    eyebrow: "Reitoria",
    description: "Leitura executiva de capacidade, engajamento e integridade institucional.",
    sections: RECTOR_SECTIONS
  }
};

const SECTION_COPY = {
  coordinator: {
    dashboard: "Prioridades, evolução recente e cobertura acadêmica em uma única leitura.",
    professors: "Perfis docentes visíveis para o tenant e a política de acesso atuais.",
    classes: "Turmas institucionais e seus vínculos acadêmicos observáveis.",
    disciplines: "Estrutura curricular retornada pela hierarquia acadêmica.",
    heatmaps: "Distribuição real de tempo de estudo entre os sistemas anatômicos.",
    risk: "Alunos sinalizados por status ou indicador de desempenho observado."
  },
  rector: {
    dashboard: "Exceções institucionais, capacidade e comparação temporal resumidas.",
    indicators: "Indicadores institucionais com contexto, período e origem declarados.",
    engagement: "Evolução do uso observada no intervalo selecionado.",
    utilization: "Modelos e recursos utilizados conforme os registros institucionais.",
    roi: "Capacidade e receita observável, sem inferir retorno acadêmico não comprovado."
  }
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

const PERIOD_OPTIONS = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" }
];

function number(value) {
  return Number(value || 0).toLocaleString("pt-BR");
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  });
}

function percentage(value) {
  return `${Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
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

function roleOf(user) {
  if (["rector", "reitor"].includes(user?.role)) return "rector";
  return "coordinator";
}

function sourceState(data, error) {
  if (error) {
    return {
      tone: "error",
      label: "Falha de leitura",
      text: "A fonte institucional não pôde ser consultada. Nenhuma métrica substituta foi exibida."
    };
  }

  if (data?.source === "restricted") {
    return {
      tone: "restricted",
      label: "Acesso institucional incompleto",
      text: data?.reason || "A conta não possui um tenant verificável."
    };
  }

  if (data?.quality?.status === "partial") {
    return {
      tone: "warning",
      label: "Leitura institucional parcial",
      text: "Uma ou mais fontes não responderam. As áreas disponíveis permanecem identificadas na cobertura."
    };
  }

  if (data?.source === "supabase") {
    return {
      tone: "real",
      label: "Supabase institucional · escopo do papel",
      text: "A interface mostra somente as linhas permitidas ao tenant e ao papel autenticados; zero não significa ausência global."
    };
  }

  return {
    tone: "restricted",
    label: "Fonte ainda não certificada",
    text: "Nenhum dado foi apresentado como real sem origem verificável."
  };
}

function detailFor(title, subtitle, record) {
  return {
    title,
    subtitle,
    fields: Object.entries(record)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([label, value]) => ({ label, value: String(value) }))
  };
}

function createPeriodSystemRows(data, snapshot) {
  const modelById = new Map((data?.raw?.models || []).map((model) => [model.id, model]));
  const totals = new Map();

  snapshot.currentLogs.forEach((log) => {
    const model = modelById.get(log.model_id);
    const system = model?.anatomical_system || "Não classificado";
    totals.set(system, (totals.get(system) || 0) + Number(log.duration_seconds || 0));
  });

  const totalSeconds = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);

  return Array.from(totals.entries())
    .map(([system, seconds]) => ({
      id: system,
      system,
      hours: Math.round((seconds / 3600) * 10) / 10,
      percentage: totalSeconds ? (seconds / totalSeconds) * 100 : 0
    }))
    .filter((item) => item.hours > 0 || item.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);
}

function createPeriodModelRows(data, snapshot) {
  const modelById = new Map((data?.raw?.models || []).map((model) => [model.id, model]));
  const totals = new Map();

  snapshot.currentLogs.forEach((log) => {
    if (!log.model_id) return;
    const current = totals.get(log.model_id) || { accesses: 0, seconds: 0 };
    current.accesses += 1;
    current.seconds += Number(log.duration_seconds || 0);
    totals.set(log.model_id, current);
  });

  return Array.from(totals.entries())
    .map(([modelId, total]) => {
      const model = modelById.get(modelId);
      return {
        id: modelId,
        title: model?.title || model?.name || model?.slug || modelId,
        system: model?.anatomical_system || "Não informado",
        accesses: total.accesses,
        studyHours: Math.round((total.seconds / 3600) * 10) / 10
      };
    })
    .sort((a, b) => b.accesses - a.accesses || b.studyHours - a.studyHours);
}

function DataSourceNotice({ state, updatedAt }) {
  return (
    <A26Card
      className={`governance-source governance-source--${state.tone}`}
      role="status"
      data-testid="a26-governance-source"
    >
      <span className="governance-source__dot" aria-hidden="true" />
      <div>
        <strong>{state.label}</strong>
        <p>{state.text}</p>
      </div>
      {updatedAt ? <time dateTime={updatedAt}>Atualizado {dateTime(updatedAt)}</time> : null}
    </A26Card>
  );
}

function CoverageDisclosure({ quality, expanded, onExpandedChange }) {
  const entries = Object.entries(quality?.tables || {});
  const observed = entries.filter(([, item]) => item.state === "observed").length;
  const unavailable = entries.filter(([, item]) => item.state === "unavailable").length;

  return (
    <A26DataDisclosure
      summary="Cobertura e proveniência"
      meta={`${observed} fonte(s) com linhas · ${unavailable} indisponível(is)`}
      className="governance-coverage"
      open={expanded}
      onToggle={(event) => onExpandedChange?.(event.currentTarget.open)}
    >
      <p className="governance-coverage__intro">
        Contagens refletem exclusivamente as linhas visíveis ao papel autenticado. Políticas de acesso podem retornar zero sem
        indicar que a instituição inteira está vazia.
      </p>
      {entries.length ? (
        <div className="governance-coverage__grid">
          {entries.map(([key, item]) => (
            <div key={key} className={`governance-coverage__item is-${item.state}`}>
              <span>{COVERAGE_LABELS[key] || key}</span>
              <strong>{item.state === "unavailable" ? "Indisponível" : `${number(item.rows)} linha(s)`}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p>Nenhuma tabela foi consultada neste estado.</p>
      )}
    </A26DataDisclosure>
  );
}

function MetricGrid({ metrics }) {
  return (
    <div className="governance-metrics" aria-label="Indicadores do período">
      {metrics.map((metric) => (
        <A26Metric
          key={metric.label}
          label={metric.label}
          value={metric.value}
          detail={metric.detail}
          trend={metric.trend}
          tone={metric.tone}
        />
      ))}
    </div>
  );
}

function AlertStack({ alerts, role, onInspect }) {
  if (!alerts.length) {
    return (
      <A26Card className="governance-clear-state" tone="teal">
        <span className="governance-clear-state__icon"><LineIcon name="check" /></span>
        <div>
          <p className="a26-kicker">Leitura priorizada</p>
          <h2>Nenhuma exceção observada</h2>
          <p>As fontes visíveis não retornaram condições que acionem os critérios desta área.</p>
        </div>
      </A26Card>
    );
  }

  return (
    <div className="governance-alerts" aria-label={`Prioridades da ${role === "rector" ? "Reitoria" : "Coordenação"}`}>
      {alerts.map((item, index) => (
        <A26Card key={item.id} className={`governance-alert is-${item.priority}`}>
          <div className="governance-alert__priority">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <small>{item.priority === "critical" ? "Crítica" : item.priority === "high" ? "Alta" : item.priority === "medium" ? "Média" : "Baixa"}</small>
          </div>
          <div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
          <div className="governance-alert__action">
            {item.count !== null ? <strong>{number(item.count)}</strong> : null}
            <A26Button
              variant="ghost"
              onClick={() => onInspect(detailFor(item.title, "Critério institucional observado", {
                Prioridade: item.priority,
                Evidência: item.text,
                Registros: item.count
              }))}
            >
              Ver contexto
            </A26Button>
          </div>
        </A26Card>
      ))}
    </div>
  );
}

function TrendPanel({ snapshot }) {
  const series = createGovernanceSeries(snapshot);
  const max = Math.max(...series.map((item) => item.accesses), 1);

  return (
    <A26Card className="governance-trend">
      <div className="governance-section-heading">
        <div>
          <p className="a26-kicker">Comparação temporal</p>
          <h2>Ritmo de utilização</h2>
          <p>{snapshot.label}, comparado ao intervalo imediatamente anterior.</p>
        </div>
        <span>{formatPeriodComparison(snapshot.accesses)}</span>
      </div>
      <div className="governance-trend__chart" role="img" aria-label={`Acessos observados nos ${snapshot.days} dias selecionados`}>
        {series.map((item) => (
          <div key={item.id} className="governance-trend__column">
            <span className="governance-trend__value">{number(item.accesses)}</span>
            <span className="governance-trend__track">
              <span style={{ height: `${Math.max((item.accesses / max) * 100, item.accesses ? 8 : 2)}%` }} />
            </span>
            <small>{item.label}</small>
          </div>
        ))}
      </div>
    </A26Card>
  );
}

function GovernanceTable({
  title,
  description,
  rows,
  columns,
  emptyTitle,
  emptyText,
  onInspect,
  onViewSource
}) {
  if (!rows.length) {
    return (
      <A26EmptyState
        title={emptyTitle}
        text={emptyText}
        action={<A26Button onClick={onViewSource}>Ver cobertura da fonte</A26Button>}
      />
    );
  }

  return (
    <A26Card className="governance-table-card">
      <div className="governance-section-heading">
        <div>
          <p className="a26-kicker">Dados observados</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span>{rows.length} registro(s)</span>
      </div>
      <div className="governance-table-scroll" tabIndex="0" aria-label={`${title}: tabela com rolagem horizontal`}>
        <table className="governance-table">
          <thead>
            <tr>
              {columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}
              <th scope="col"><span className="a26-visually-hidden">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id || row.name || row.title || index}>
                {columns.map((column) => (
                  <td key={column.key} data-label={column.label}>
                    {column.render ? column.render(row) : row[column.key] || "—"}
                  </td>
                ))}
                <td className="governance-table__action">
                  <A26Button
                    variant="ghost"
                    onClick={() => onInspect?.(row)}
                    aria-label={`Ver contexto de ${row.name || row.title || row.label || "registro"}`}
                  >
                    Detalhes
                  </A26Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </A26Card>
  );
}

function DashboardSection({ role, data, snapshot, alerts, onInspect }) {
  const users = data?.raw?.users || [];
  const professors = users.filter((item) => ["teacher", "professor"].includes(String(item.role || "").toLowerCase())).length;
  const classes = data?.raw?.academicClasses?.length || 0;
  const occupancyAvailable = Number(data?.stats?.contractedCapacity || 0) > 0;
  const coordinatorMetrics = [
    {
      label: "Alunos ativos visíveis",
      value: number(data?.stats?.activeStudents),
      detail: "Perfis ativos retornados",
      trend: `${number(data?.stats?.registeredStudents)} cadastrados visíveis`
    },
    {
      label: "Professores visíveis",
      value: number(professors),
      detail: "Perfis docentes permitidos",
      trend: `${number(classes)} turma(s) visível(is)`
    },
    {
      label: "Usuários com atividade",
      value: number(snapshot.activeUsers.current),
      detail: snapshot.label,
      trend: formatPeriodComparison(snapshot.activeUsers)
    },
    {
      label: "Tempo de estudo",
      value: `${number(snapshot.studyMinutes.current)} min`,
      detail: "Duração registrada no período",
      trend: formatPeriodComparison(snapshot.studyMinutes)
    }
  ];
  const rectorMetrics = [
    {
      label: "Alunos ativos visíveis",
      value: number(data?.stats?.activeStudents),
      detail: "Escopo institucional permitido",
      trend: `${number(data?.stats?.registeredStudents)} cadastrados visíveis`
    },
    {
      label: "Acessos observados",
      value: number(snapshot.accesses.current),
      detail: snapshot.label,
      trend: formatPeriodComparison(snapshot.accesses)
    },
    {
      label: "Ocupação contratual",
      value: occupancyAvailable ? percentage(data?.stats?.occupancyRate) : "—",
      detail: occupancyAvailable ? "Cadastrados ÷ capacidade" : "Capacidade não informada",
      trend: occupancyAvailable ? `${number(data?.stats?.contractedCapacity)} licenças` : "Sem base contratual"
    },
    {
      label: "Tempo de estudo",
      value: `${number(snapshot.studyMinutes.current)} min`,
      detail: snapshot.label,
      trend: formatPeriodComparison(snapshot.studyMinutes)
    }
  ];

  return (
    <>
      <MetricGrid metrics={role === "rector" ? rectorMetrics : coordinatorMetrics} />
      <div className="governance-dashboard-grid">
        <section className="governance-priority-panel" aria-labelledby="governance-priority-title">
          <div className="governance-section-heading">
            <div>
              <p className="a26-kicker">Decisão agora</p>
              <h2 id="governance-priority-title">Prioridades por impacto</h2>
              <p>{role === "rector" ? "Exceções executivas antes dos detalhes." : "Ações pedagógicas antes dos relatórios."}</p>
            </div>
          </div>
          <AlertStack alerts={alerts} role={role} onInspect={onInspect} />
        </section>
        <A26Card className="governance-brief">
          <p className="a26-kicker">{role === "rector" ? "Síntese executiva" : "Síntese acadêmica"}</p>
          <h2>{snapshot.currentLogs.length ? "Há atividade observável no período" : "O período não retornou atividade"}</h2>
          <p>
            {snapshot.currentLogs.length
              ? `${number(snapshot.accesses.current)} acessos e ${number(snapshot.studyMinutes.current)} minutos foram observados dentro do escopo permitido.`
              : "Nenhum acesso a modelo foi retornado. A interface preserva o zero observado sem inferir inatividade global."}
          </p>
          <dl>
            <div><dt>Janela</dt><dd>{snapshot.label}</dd></div>
            <div><dt>Eventos</dt><dd>{number(snapshot.events.current)}</dd></div>
            <div><dt>Fonte</dt><dd>{data?.source === "supabase" ? "Supabase" : data?.source || "Não certificada"}</dd></div>
          </dl>
        </A26Card>
      </div>
      <TrendPanel snapshot={snapshot} />
    </>
  );
}

function CoordinatorSection({
  section,
  data,
  snapshot,
  alerts,
  query,
  onInspect,
  onViewSource
}) {
  if (section === "dashboard") {
    return <DashboardSection role="coordinator" data={data} snapshot={snapshot} alerts={alerts} onInspect={onInspect} />;
  }

  const users = data?.raw?.users || [];
  const professorRows = users
    .filter((item) => ["teacher", "professor"].includes(String(item.role || "").toLowerCase()))
    .map((item) => ({
      ...item,
      displayStatus: item.status || "Não informado",
      lastActivity: item.last_login ? dateTime(item.last_login) : "Não registrada"
    }));
  const teacherById = new Map(users.map((item) => [item.id, item]));
  const memberships = data?.raw?.classStudents || [];
  const classRows = (data?.raw?.academicClasses || []).map((item) => ({
    ...item,
    teacher: teacherById.get(item.teacher_id)?.name || teacherById.get(item.teacher_id)?.email || "Não visível",
    students: memberships.filter((membership) => membership.class_id === item.id).length
  }));
  const subjectRows = (data?.raw?.academicSubjects || []).map((item) => ({
    ...item,
    displayStatus: item.active === true ? "Ativa" : item.active === false ? "Inativa" : "Não informado"
  }));
  const heatmapRows = createPeriodSystemRows(data, snapshot);
  const riskRows = (data?.students || []).filter((item) => item.status !== "ativo" || Number(item.performanceScore || 0) < 60);
  const candidates = {
    professors: professorRows,
    classes: classRows,
    disciplines: subjectRows,
    heatmaps: heatmapRows,
    risk: riskRows
  }[section] || [];
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const rows = normalizedQuery
    ? candidates.filter((item) => JSON.stringify(item).toLocaleLowerCase("pt-BR").includes(normalizedQuery))
    : candidates;

  if (section === "professors") {
    return (
      <GovernanceTable
        title="Professores vinculados"
        description="Perfis docentes retornados pela política institucional."
        rows={rows}
        columns={[
          { key: "name", label: "Professor", render: (row) => row.name || "Nome não informado" },
          { key: "email", label: "E-mail" },
          { key: "displayStatus", label: "Status" },
          { key: "lastActivity", label: "Última atividade" }
        ]}
        emptyTitle="Nenhum professor visível"
        emptyText="A consulta autorizada retornou zero perfis docentes. Isso não é apresentado como ausência global."
        onViewSource={onViewSource}
        onInspect={(row) => onInspect(detailFor(row.name || "Professor", "Perfil docente observado", {
          "E-mail": row.email,
          Status: row.displayStatus,
          "Última atividade": row.lastActivity
        }))}
      />
    );
  }

  if (section === "classes") {
    return (
      <GovernanceTable
        title="Turmas institucionais"
        description="Turmas e vínculos visíveis dentro do tenant autenticado."
        rows={rows}
        columns={[
          { key: "name", label: "Turma" },
          { key: "teacher", label: "Professor" },
          { key: "course", label: "Curso" },
          { key: "semester", label: "Período" },
          { key: "students", label: "Alunos", render: (row) => number(row.students) },
          { key: "status", label: "Status" }
        ]}
        emptyTitle="Nenhuma turma visível"
        emptyText="A fonte acadêmica retornou zero turmas para o papel e a política atuais."
        onViewSource={onViewSource}
        onInspect={(row) => onInspect(detailFor(row.name || "Turma", "Contexto acadêmico preservado", {
          Professor: row.teacher,
          Curso: row.course,
          Período: row.semester,
          Alunos: row.students,
          Status: row.status
        }))}
      />
    );
  }

  if (section === "disciplines") {
    return (
      <GovernanceTable
        title="Disciplinas"
        description="Hierarquia curricular aguardando um contrato acadêmico canônico."
        rows={rows}
        columns={[
          { key: "name", label: "Disciplina" },
          { key: "code", label: "Código" },
          { key: "displayStatus", label: "Status" },
          { key: "created_at", label: "Criada em", render: (row) => dateTime(row.created_at) }
        ]}
        emptyTitle="Fonte de disciplinas não publicada"
        emptyText="public.academic_subjects não integra o esquema autorizado atual; nenhum catálogo fictício foi inserido."
        onViewSource={onViewSource}
        onInspect={(row) => onInspect(detailFor(row.name || "Disciplina", "Registro curricular observado", {
          Código: row.code,
          Status: row.displayStatus,
          "Criada em": dateTime(row.created_at)
        }))}
      />
    );
  }

  if (section === "heatmaps") {
    return (
      <GovernanceTable
        title="Distribuição por sistema"
        description={`Tempo de estudo agregado no recorte institucional disponível. Filtro temporal: ${snapshot.label}.`}
        rows={rows}
        columns={[
          { key: "system", label: "Sistema" },
          { key: "hours", label: "Horas", render: (row) => number(row.hours || row.value) },
          { key: "percentage", label: "Participação", render: (row) => row.percentage ? percentage(row.percentage) : "—" }
        ]}
        emptyTitle="Mapa sem atividade observável"
        emptyText="Nenhum tempo de estudo por sistema foi retornado pela fonte agregada."
        onViewSource={onViewSource}
        onInspect={(row) => onInspect(detailFor(row.system || "Sistema anatômico", "Distribuição de aprendizagem", {
          Horas: row.hours || row.value,
          Participação: row.percentage ? percentage(row.percentage) : "Não calculada"
        }))}
      />
    );
  }

  return (
    <GovernanceTable
      title="Alunos em atenção"
      description="Critério: conta fora do estado ativo ou indicador observado abaixo de 60%."
      rows={rows}
      columns={[
        { key: "name", label: "Aluno" },
        { key: "course", label: "Curso" },
        { key: "status", label: "Status" },
        { key: "performanceScore", label: "Indicador", render: (row) => percentage(row.performanceScore) },
        { key: "lastAccess", label: "Último acesso", render: (row) => dateTime(row.lastAccess) }
      ]}
      emptyTitle="Nenhum aluno sinalizado"
      emptyText="Nenhuma linha visível acionou o critério atual. Isso não substitui avaliação acadêmica humana."
      onViewSource={onViewSource}
      onInspect={(row) => onInspect(detailFor(row.name || "Aluno", "Sinal acadêmico observado", {
        Curso: row.course,
        Status: row.status,
        Indicador: percentage(row.performanceScore),
        "Último acesso": dateTime(row.lastAccess),
        "Minutos de estudo": row.totalStudyMinutes
      }))}
    />
  );
}

function RectorSection({
  section,
  data,
  snapshot,
  alerts,
  query,
  onInspect,
  onViewSource
}) {
  if (section === "dashboard") {
    return <DashboardSection role="rector" data={data} snapshot={snapshot} alerts={alerts} onInspect={onInspect} />;
  }

  if (section === "indicators") {
    const contracted = Number(data?.stats?.contractedCapacity || 0);
    return (
      <>
        <MetricGrid metrics={[
          {
            label: "Alunos cadastrados visíveis",
            value: number(data?.stats?.registeredStudents),
            detail: "Perfis retornados pela política",
            trend: `${number(data?.stats?.activeStudents)} ativos visíveis`
          },
          {
            label: "Capacidade contratada",
            value: contracted ? number(contracted) : "—",
            detail: contracted ? "Licenças informadas" : "Sem base contratual",
            trend: contracted ? percentage(data?.stats?.occupancyRate) : "Ocupação não calculada"
          },
          {
            label: "Acessos observados",
            value: number(snapshot.accesses.current),
            detail: snapshot.label,
            trend: formatPeriodComparison(snapshot.accesses)
          },
          {
            label: "Usuários com atividade",
            value: number(snapshot.activeUsers.current),
            detail: "Identificadores únicos no período",
            trend: formatPeriodComparison(snapshot.activeUsers)
          }
        ]} />
        <TrendPanel snapshot={snapshot} />
      </>
    );
  }

  if (section === "engagement") {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    const rows = createGovernanceSeries(snapshot).filter((item) => (
      !normalizedQuery || JSON.stringify(item).toLocaleLowerCase("pt-BR").includes(normalizedQuery)
    ));
    const hasObservedActivity = rows.some((item) => item.accesses || item.studyMinutes || item.users);

    return (
      <>
        <TrendPanel snapshot={snapshot} />
        <GovernanceTable
          title="Engajamento por intervalo"
          description="Acessos, tempo e usuários derivados dos registros do período."
          rows={hasObservedActivity ? rows : []}
          columns={[
            { key: "label", label: "Início do intervalo" },
            { key: "accesses", label: "Acessos", render: (row) => number(row.accesses) },
            { key: "studyMinutes", label: "Minutos", render: (row) => number(row.studyMinutes) },
            { key: "users", label: "Usuários", render: (row) => number(row.users) }
          ]}
          emptyTitle="Sem engajamento observável"
          emptyText="Nenhum acesso a modelo foi retornado na janela selecionada."
          onViewSource={onViewSource}
          onInspect={(row) => onInspect(detailFor(`Intervalo ${row.label}`, "Engajamento institucional", {
            Acessos: row.accesses,
            Minutos: row.studyMinutes,
            Usuários: row.users
          }))}
        />
      </>
    );
  }

  if (section === "utilization") {
    const candidates = createPeriodModelRows(data, snapshot);
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    const rows = normalizedQuery
      ? candidates.filter((item) => JSON.stringify(item).toLocaleLowerCase("pt-BR").includes(normalizedQuery))
      : candidates;

    return (
      <GovernanceTable
        title="Modelos mais utilizados"
        description="Ranking calculado exclusivamente a partir dos acessos visíveis."
        rows={rows}
        columns={[
          { key: "title", label: "Modelo" },
          { key: "system", label: "Sistema", render: (row) => row.system || row.anatomicalSystem || "Não informado" },
          { key: "accesses", label: "Acessos", render: (row) => number(row.accesses) },
          { key: "studyHours", label: "Horas", render: (row) => number(row.studyHours) }
        ]}
        emptyTitle="Sem utilização observável"
        emptyText="Nenhum acesso a modelo foi retornado pela fonte institucional."
        onViewSource={onViewSource}
        onInspect={(row) => onInspect(detailFor(row.title || "Modelo 3D", "Utilização institucional observada", {
          Sistema: row.system || row.anatomicalSystem,
          Acessos: row.accesses,
          Horas: row.studyHours
        }))}
      />
    );
  }

  const contracted = Number(data?.stats?.contractedCapacity || 0);
  const price = Number(data?.institution?.pricePerStudent || 0);
  const financialAvailable = contracted > 0 && price > 0;

  return (
    <>
      <MetricGrid metrics={[
        {
          label: "Capacidade contratada",
          value: contracted ? number(contracted) : "—",
          detail: contracted ? "Licenças informadas" : "Sem base contratual",
          trend: contracted ? percentage(data?.stats?.occupancyRate) : "Ocupação não calculada"
        },
        {
          label: "Receita mensal observável",
          value: financialAvailable ? money(data?.stats?.estimatedRevenue) : "—",
          detail: financialAvailable ? "Ativos visíveis × preço informado" : "Preço ou capacidade não informados",
          trend: "Não representa ROI acadêmico"
        },
        {
          label: "Receita máxima contratual",
          value: financialAvailable ? money(data?.stats?.maxRevenue) : "—",
          detail: financialAvailable ? "Capacidade × preço informado" : "Sem base financeira verificável",
          trend: "Referência contratual"
        }
      ]} />
      <A26EmptyState
        title="Retorno acadêmico não inferido"
        text="Payback, economia laboratorial e impacto pedagógico exigem custos, contratos e resultados confirmados. A plataforma não transforma atividade de uso em ROI."
        action={<A26Button onClick={onViewSource}>Ver fontes consideradas</A26Button>}
      />
    </>
  );
}

export default function GovernanceRolePage({ user, section = "dashboard", role: explicitRole }) {
  const role = explicitRole || roleOf(user);
  const copy = ROLE_COPY[role];
  const current = copy.sections[section] || copy.sections.dashboard;
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(30);
  const [query, setQuery] = useState("");
  const [sourceExpanded, setSourceExpanded] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const load = useCallback(() => {
    let active = true;
    setStatus("loading");
    setError(null);

    loadInstitutionDashboardData()
      .then((result) => {
        if (!active) return;
        setData(result);
        setStatus("ready");
      })
      .catch((loadError) => {
        console.error("[governance] Falha ao carregar dados institucionais.", loadError);
        if (!active) return;
        setError(loadError);
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => load(), [load, user?.id, user?.institutionId, user?.institution_id]);

  useEffect(() => {
    setQuery("");
    setSelectedDetail(null);
  }, [section]);

  const snapshot = useMemo(() => createGovernancePeriodSnapshot(data, period), [data, period]);
  const alerts = useMemo(() => createGovernanceAlerts(role, data, snapshot), [data, role, snapshot]);
  const source = useMemo(() => sourceState(data, error), [data, error]);
  const sourceLabel = data?.source === "supabase" ? "tenant-observed" : "restricted";

  return (
    <section
      className={`governance-page governance-page--${role}`}
      data-testid="a26-governance-experience"
      data-a26-role={role}
      data-a26-section={section}
      data-a26-source={sourceLabel}
    >
      <header className="governance-heading">
        <div>
          <p className="a26-kicker">{copy.eyebrow}</p>
          <h1>{current.title}</h1>
          <p>{SECTION_COPY[role][section] || copy.description}</p>
        </div>
        <span className="governance-heading__scope">
          <LineIcon name="lock" />
          {data?.institution?.displayName || data?.institution?.name || user?.institution || "Tenant em validação"}
        </span>
      </header>

      <A26Toolbar label="Filtros institucionais" className="governance-toolbar">
        <A26SegmentedControl
          label="Período de análise"
          options={PERIOD_OPTIONS}
          value={period}
          onChange={setPeriod}
        />
        {section !== "dashboard" && section !== "indicators" && section !== "roi" ? (
          <A26Field
            label="Filtrar registros"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome, status ou código"
          />
        ) : null}
        <A26Button icon={<LineIcon name="reset" />} onClick={load}>
          Atualizar
        </A26Button>
      </A26Toolbar>

      <DataSourceNotice state={source} updatedAt={data?.lastUpdated} />

      {status === "loading" ? (
        <A26LoadingState
          title="Validando a fonte institucional"
          text="Consultando tenant, políticas e tabelas autorizadas."
        />
      ) : status === "error" ? (
        <A26ErrorState
          title="Não foi possível ler a fonte"
          text="Nenhum dado substituto foi exibido."
          action={<A26Button onClick={load}>Tentar novamente</A26Button>}
        />
      ) : role === "rector" ? (
        <RectorSection
          section={section}
          data={data || {}}
          snapshot={snapshot}
          alerts={alerts}
          query={query}
          onInspect={setSelectedDetail}
          onViewSource={() => setSourceExpanded(true)}
        />
      ) : (
        <CoordinatorSection
          section={section}
          data={data || {}}
          snapshot={snapshot}
          alerts={alerts}
          query={query}
          onInspect={setSelectedDetail}
          onViewSource={() => setSourceExpanded(true)}
        />
      )}

      {status === "ready" ? (
        <CoverageDisclosure
          quality={data?.quality}
          expanded={sourceExpanded}
          onExpandedChange={setSourceExpanded}
        />
      ) : null}

      <A26Modal
        open={Boolean(selectedDetail)}
        title={selectedDetail?.title || "Contexto institucional"}
        description={selectedDetail?.subtitle}
        onClose={() => setSelectedDetail(null)}
        actions={<A26Button variant="primary" onClick={() => setSelectedDetail(null)}>Concluir leitura</A26Button>}
      >
        <dl className="governance-detail-list">
          {(selectedDetail?.fields || []).map((field) => (
            <div key={field.label}>
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
      </A26Modal>
    </section>
  );
}
