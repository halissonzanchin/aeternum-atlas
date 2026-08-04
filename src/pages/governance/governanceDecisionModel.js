function numeric(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function dateOf(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function periodRows(rows, start, end) {
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const date = dateOf(row.created_at || row.createdAt);
    return date && date >= start && date < end;
  });
}

function comparison(current, previous) {
  const delta = current - previous;
  return {
    current,
    previous,
    delta,
    comparable: previous > 0,
    percent: previous > 0 ? Math.round((delta / previous) * 100) : null
  };
}

function sumDuration(rows) {
  return rows.reduce((sum, row) => sum + numeric(row.duration_seconds), 0);
}

function uniqueUsers(rows) {
  return new Set(rows.map((row) => row.user_id).filter(Boolean)).size;
}

export function createGovernancePeriodSnapshot(data, days = 30, reference = new Date()) {
  const safeDays = [7, 30, 90].includes(Number(days)) ? Number(days) : 30;
  const end = new Date(reference);
  const currentStart = new Date(end.getTime() - safeDays * 24 * 60 * 60 * 1000);
  const previousStart = new Date(currentStart.getTime() - safeDays * 24 * 60 * 60 * 1000);
  const logs = data?.raw?.logs || [];
  const events = data?.raw?.events || [];
  const currentLogs = periodRows(logs, currentStart, end);
  const previousLogs = periodRows(logs, previousStart, currentStart);
  const currentEvents = periodRows(events, currentStart, end);
  const previousEvents = periodRows(events, previousStart, currentStart);

  return {
    days: safeDays,
    label: `Últimos ${safeDays} dias`,
    range: {
      start: currentStart.toISOString(),
      end: end.toISOString()
    },
    accesses: comparison(currentLogs.length, previousLogs.length),
    studyMinutes: comparison(
      Math.round(sumDuration(currentLogs) / 60),
      Math.round(sumDuration(previousLogs) / 60)
    ),
    activeUsers: comparison(uniqueUsers(currentLogs), uniqueUsers(previousLogs)),
    events: comparison(currentEvents.length, previousEvents.length),
    currentLogs,
    previousLogs,
    currentEvents,
    previousEvents
  };
}

export function formatPeriodComparison(metric, suffix = "") {
  if (!metric?.comparable) {
    return metric?.current
      ? `${metric.current.toLocaleString("pt-BR")}${suffix} · sem base anterior`
      : "Sem atividade observada no período";
  }

  const signal = metric.percent > 0 ? "+" : "";
  return `${signal}${metric.percent}% versus o período anterior`;
}

export function createGovernanceSeries(snapshot) {
  const bucketCount = snapshot.days <= 7 ? 7 : snapshot.days <= 30 ? 6 : 9;
  const bucketDays = Math.ceil(snapshot.days / bucketCount);
  const start = dateOf(snapshot.range.start);
  const end = dateOf(snapshot.range.end);

  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = new Date(start.getTime() + index * bucketDays * 24 * 60 * 60 * 1000);
    const bucketEnd = new Date(Math.min(
      bucketStart.getTime() + bucketDays * 24 * 60 * 60 * 1000,
      end.getTime()
    ));
    const logs = periodRows(snapshot.currentLogs, bucketStart, bucketEnd);

    return {
      id: bucketStart.toISOString(),
      label: bucketStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      accesses: logs.length,
      studyMinutes: Math.round(sumDuration(logs) / 60),
      users: uniqueUsers(logs)
    };
  });
}

function alert(id, priority, title, text, count = null) {
  return { id, priority, title, text, count };
}

export function createGovernanceAlerts(role, data, snapshot) {
  const alerts = [];
  const quality = data?.quality || {};
  const students = data?.students || [];
  const classes = data?.raw?.academicClasses || [];
  const subjects = data?.raw?.academicSubjects || [];
  const professors = (data?.raw?.users || []).filter((user) => (
    ["teacher", "professor"].includes(String(user.role || "").toLowerCase())
  ));

  if (quality.status === "partial") {
    alerts.push(alert(
      "partial-source",
      "critical",
      "Leitura institucional parcial",
      `${quality.unavailable?.length || quality.viewErrors || 1} fonte(s) não responderam. Decisões devem considerar esta limitação.`,
      quality.unavailable?.length || quality.viewErrors || 1
    ));
  }

  if (role === "coordinator") {
    const riskStudents = students.filter((student) => (
      student.status !== "ativo" || numeric(student.performanceScore) < 60
    ));

    if (riskStudents.length) {
      alerts.push(alert(
        "students-risk",
        "high",
        "Alunos exigem atenção",
        "Status da conta ou indicador observado abaixo do limiar acadêmico de acompanhamento.",
        riskStudents.length
      ));
    }
    if (!professors.length) {
      alerts.push(alert(
        "faculty-empty",
        "medium",
        "Nenhum professor visível",
        "A consulta permitida ao papel de Coordenação retornou zero perfis docentes."
      ));
    }
    if (!classes.length) {
      alerts.push(alert(
        "classes-empty",
        "medium",
        "Nenhuma turma visível",
        "A fonte de turmas retornou zero linhas para o tenant e a política atuais."
      ));
    }
    if (!subjects.length) {
      alerts.push(alert(
        "subjects-empty",
        "low",
        "Estrutura de disciplinas sem registros visíveis",
        "Nenhuma disciplina foi retornada pela hierarquia acadêmica."
      ));
    }
  } else {
    const incidents = numeric(data?.platformHealth?.incidentsThisMonth);
    const occupancy = numeric(data?.stats?.occupancyRate);

    if (incidents) {
      alerts.push(alert(
        "platform-incidents",
        "critical",
        "Incidentes institucionais registrados",
        "Eventos classificados como erro ou falha foram observados no mês corrente.",
        incidents
      ));
    }
    if (occupancy > 100) {
      alerts.push(alert(
        "capacity-exceeded",
        "critical",
        "Capacidade contratada excedida",
        "O número de alunos cadastrados é superior à capacidade institucional informada."
      ));
    } else if (occupancy >= 85) {
      alerts.push(alert(
        "capacity-near-limit",
        "high",
        "Capacidade próxima do limite",
        "A ocupação observada atingiu pelo menos 85% da capacidade contratada."
      ));
    }
    if (!snapshot.currentLogs.length) {
      alerts.push(alert(
        "engagement-empty",
        "medium",
        "Sem atividade observada no período",
        "Nenhum acesso a modelo foi retornado no intervalo selecionado."
      ));
    }
  }

  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return alerts.sort((a, b) => order[a.priority] - order[b.priority]);
}

