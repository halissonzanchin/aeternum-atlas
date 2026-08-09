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
  import_students: ["Importar alunos", "Operação pausada até a publicação do contrato acadêmico canônico."],
  analytics: ["Analytics operacionais", "Uso, estabilidade e eventos derivados das fontes autorizadas."],
  academic_analytics: ["Analytics acadêmicos", "Sinais de aprendizagem disponíveis sem inferir resultados ausentes."],
  roi: ["Retorno institucional", "Base observável para decisão, sem transformar uso em retorno financeiro ou acadêmico."],
  heatmap: ["Mapa anatômico de uso", "Distribuição do tempo registrado por sistema anatômico."],
  models_3d: ["Atlas CMS", "Inventário do catálogo 3D e estado editorial observável."],
  viewer_analytics: ["Análises do visualizador", "Eventos e sessões observáveis no período selecionado."],
  digital_twins: ["Gêmeos digitais", "Contrato planejado para réplicas anatômicas versionadas e rastreáveis."],
  billing: ["Faturamento", "Capacidade e valores contratuais retornados pela fonte institucional."],
  reports: ["Relatórios", "Exportações construídas somente com os registros atualmente observados."],
  settings: ["Configurações", "Escopo, permissões e integrações administrativas verificáveis."]
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
            <strong>{item.state === "unavailable" ? "Indisponível" : `${number(item.rows)} linha(s)`}</strong>
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

function OverviewSection({ scope, data, snapshot, alerts, query, onInspect }) {
  const isSuper = scope === ROLES.SUPER_ADMIN;
  const institutions = filterRows(data?.institutions || [], query);
  const students = filterRows(data?.students || [], query);
  const metrics = isSuper ? [
    { label: "Instituições visíveis", value: number(institutions.length), detail: "Linhas retornadas pela política", tone: "gold" },
    { label: "Perfis visíveis", value: number(data?.raw?.users?.length), detail: "Escopo global permitido" },
    { label: "Acessos observados", value: number(snapshot.accesses.current), detail: snapshot.label, trend: formatPeriodComparison(snapshot.accesses) },
    { label: "Eventos observados", value: number(snapshot.events.current), detail: snapshot.label, trend: formatPeriodComparison(snapshot.events) },
    { label: "Modelos no catálogo", value: number(data?.raw?.models?.length), detail: "Linhas retornadas por models_3d" }
  ] : [
    { label: "Alunos visíveis", value: number(data?.stats?.registeredStudents), detail: "Perfis retornados pela política", tone: "teal" },
    { label: "Acessos observados", value: number(snapshot.accesses.current), detail: snapshot.label, trend: formatPeriodComparison(snapshot.accesses) },
    { label: "Usuários com atividade", value: number(snapshot.activeUsers.current), detail: snapshot.label, trend: formatPeriodComparison(snapshot.activeUsers) },
    { label: "Tempo de estudo", value: `${number(snapshot.studyMinutes.current)} min`, detail: snapshot.label, trend: formatPeriodComparison(snapshot.studyMinutes) },
    { label: "Capacidade contratada", value: data?.stats?.contractedCapacity ? number(data.stats.contractedCapacity) : "—", detail: data?.stats?.contractedCapacity ? percentage(data?.stats?.occupancyRate) : "Sem base contratual" }
  ];

  return (
    <>
      <SectionHeader scope={scope} section="overview" />
      <MetricGrid metrics={metrics} />
      <div className="admin26-overview-grid">
        <section aria-labelledby="admin26-priority-title">
          <div className="admin26-card-heading">
            <div><p className="a26-kicker">Decisão agora</p><h2 id="admin26-priority-title">Prioridades operacionais</h2></div>
          </div>
          <PriorityStack alerts={alerts} onInspect={onInspect} />
        </section>
        <A26Card className="admin26-brief">
          <p className="a26-kicker">{isSuper ? "Síntese global" : "Síntese do tenant"}</p>
          <h2>{snapshot.currentLogs.length ? "Há atividade observável" : "O período não retornou atividade"}</h2>
          <p>{snapshot.currentLogs.length
            ? `${number(snapshot.accesses.current)} acessos e ${number(snapshot.studyMinutes.current)} minutos foram retornados.`
            : "O zero foi preservado sem inferir inatividade fora do escopo permitido."}</p>
          <dl>
            <div><dt>Período</dt><dd>{snapshot.label}</dd></div>
            <div><dt>Fonte</dt><dd>{data?.source || "Não certificada"}</dd></div>
            <div><dt>Escopo</dt><dd>{isSuper ? "Global permitido" : "Tenant autenticado"}</dd></div>
          </dl>
        </A26Card>
      </div>
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
        <DenseTable
          title="Alunos observados"
          description="Primeiros registros visíveis, ordenados pela fonte administrativa."
          rows={students.slice(0, 8)}
          columns={[
            { key: "name", label: "Aluno" },
            { key: "course", label: "Curso" },
            { key: "status", label: "Status" },
            { key: "lastAccess", label: "Último acesso", render: (row) => dateTime(row.lastAccess) }
          ]}
          emptyTitle="Nenhum aluno visível"
          emptyText="A consulta autorizada retornou zero perfis acadêmicos."
          onInspect={(row) => onInspect({
            title: row.name || "Aluno",
            subtitle: "Registro acadêmico observado",
            fields: [["E-mail", row.email], ["Status", row.status], ["Curso", row.course]]
          })}
        />
      )}
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
          { key: "email", label: "E-mail" },
          { key: "course", label: "Curso" },
          { key: "status", label: "Status" },
          { key: "totalAccesses", label: "Acessos", render: (row) => number(row.totalAccesses) },
          { key: "lastAccess", label: "Último acesso", render: (row) => dateTime(row.lastAccess) }
        ]}
        emptyTitle="Nenhum aluno visível"
        emptyText="A consulta retornou zero cadastros acadêmicos para o tenant atual."
        onInspect={(row) => onInspect({
          title: row.name || "Aluno",
          subtitle: "Contexto institucional",
          fields: [["E-mail", row.email], ["Status", row.status], ["Curso", row.course], ["Acessos", row.totalAccesses], ["Minutos de estudo", row.totalStudyMinutes]],
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
  const active = Number(data?.stats?.activeStudents || 0);
  const financial = capacity > 0 && price > 0;
  return (
    <>
      <SectionHeader scope={scope} section="roi" />
      <MetricGrid metrics={[
        { label: "Capacidade contratada", value: capacity ? number(capacity) : "—", detail: capacity ? "Licenças informadas" : "Sem base contratual" },
        { label: "Receita mensal observável", value: financial ? money(active * price) : "—", detail: financial ? "Ativos visíveis × preço informado" : "Preço ou capacidade ausente" },
        { label: "Receita máxima contratual", value: financial ? money(capacity * price) : "—", detail: financial ? "Capacidade × preço informado" : "Sem base verificável" }
      ]} />
      <A26EmptyState title="ROI não inferido" text="Impacto pedagógico, economia laboratorial, payback e margem exigem custos e resultados confirmados. Nenhuma dessas medidas foi estimada a partir de cliques ou tempo de uso." />
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
  const available = capacity > 0 && price > 0;
  return (
    <>
      <SectionHeader scope={scope} section="billing" />
      <MetricGrid metrics={[
        { label: "Capacidade", value: capacity ? number(capacity) : "—", detail: capacity ? "Licenças informadas" : "Não informada" },
        { label: "Alunos cadastrados visíveis", value: number(registered), detail: "Escopo da política atual" },
        { label: "Alunos ativos visíveis", value: number(active), detail: "Base observada" },
        { label: "Valor unitário", value: price ? money(price) : "—", detail: price ? "Preço informado" : "Não informado" },
        { label: "Estimativa mensal", value: available ? money(active * price) : "—", detail: available ? "Ativos visíveis × preço" : "Base contratual incompleta" }
      ]} />
      {!available ? <A26EmptyState title="Base de faturamento incompleta" text="A plataforma não estimou receita sem capacidade e preço unitário confirmados." /> : null}
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
    content = <OverviewSection scope={scope} data={data} snapshot={snapshot} alerts={alerts} query={query} onInspect={setDetail} />;
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
