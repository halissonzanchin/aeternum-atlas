function numeric(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function modelMap(data) {
  return new Map((data?.raw?.models || []).map((model) => [model.id, model]));
}

export function createAdministrationSystemRows(data, snapshot) {
  const models = modelMap(data);
  const totals = new Map();

  snapshot.currentLogs.forEach((log) => {
    const model = models.get(log.model_id);
    const system = model?.anatomical_system || "Não classificado";
    totals.set(system, (totals.get(system) || 0) + numeric(log.duration_seconds));
  });

  const totalSeconds = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
  return Array.from(totals.entries())
    .map(([system, seconds]) => ({
      id: system,
      system,
      hours: Math.round((seconds / 3600) * 10) / 10,
      percentage: totalSeconds ? Math.round((seconds / totalSeconds) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

export function createAdministrationModelRows(data, snapshot) {
  const models = modelMap(data);
  const totals = new Map();

  snapshot.currentLogs.forEach((log) => {
    if (!log.model_id) return;
    const current = totals.get(log.model_id) || { accesses: 0, seconds: 0 };
    current.accesses += 1;
    current.seconds += numeric(log.duration_seconds);
    totals.set(log.model_id, current);
  });

  return Array.from(totals.entries())
    .map(([id, total]) => {
      const model = models.get(id);
      return {
        id,
        title: model?.title || model?.name || model?.slug || id,
        system: model?.anatomical_system || "Não informado",
        accesses: total.accesses,
        hours: Math.round((total.seconds / 3600) * 10) / 10
      };
    })
    .sort((a, b) => b.accesses - a.accesses || b.hours - a.hours);
}

export function createAdministrationAlerts(scope, data, snapshot) {
  const alerts = [];
  const quality = data?.quality || {};
  const pendingStudents = (data?.students || []).filter((student) => (
    ["pending", "pendente"].includes(String(student.status || "").toLowerCase())
  ));
  const blockedStudents = (data?.students || []).filter((student) => (
    ["blocked", "bloqueado"].includes(String(student.status || "").toLowerCase())
  ));
  const incidents = numeric(data?.platformHealth?.incidentsThisMonth);
  const occupancy = numeric(data?.stats?.occupancyRate);

  if (quality.status === "partial") {
    alerts.push({
      id: "partial-source",
      priority: "critical",
      title: "Leitura operacional parcial",
      text: `${quality.unavailable?.length || quality.viewErrors || 1} fonte(s) não responderam. Nenhuma métrica substituta foi aplicada.`
    });
  }

  if (pendingStudents.length) {
    alerts.push({
      id: "pending-students",
      priority: "high",
      title: "Cadastros aguardam revisão",
      text: `${pendingStudents.length} cadastro(s) visível(is) exigem decisão administrativa.`
    });
  }

  if (blockedStudents.length) {
    alerts.push({
      id: "blocked-students",
      priority: "medium",
      title: "Contas bloqueadas no tenant",
      text: `${blockedStudents.length} conta(s) bloqueada(s) permanecem no escopo observado.`
    });
  }

  if (occupancy >= 90) {
    alerts.push({
      id: "capacity",
      priority: occupancy > 100 ? "critical" : "high",
      title: occupancy > 100 ? "Capacidade contratada excedida" : "Capacidade próxima do limite",
      text: `A ocupação observável está em ${Math.round(occupancy)}%.`
    });
  }

  if (scope === "super_admin" && incidents) {
    alerts.push({
      id: "incidents",
      priority: "critical",
      title: "Incidentes de plataforma observados",
      text: `${incidents} incidente(s) foram retornados pelas fontes permitidas.`
    });
  }

  if (!snapshot.currentLogs.length) {
    alerts.push({
      id: "no-activity",
      priority: "low",
      title: "Sem atividade observada no período",
      text: "Nenhum acesso a modelo foi retornado na janela selecionada; isso não comprova inatividade global."
    });
  }

  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return alerts.sort((a, b) => order[a.priority] - order[b.priority]);
}

export function administrationSourceState(data, status, error) {
  if (error || status === "error") {
    return {
      key: "error",
      label: "Falha de leitura",
      text: "A fonte administrativa não pôde ser consultada. Dados anteriores não foram reutilizados."
    };
  }
  if (status === "loading") {
    return {
      key: "loading",
      label: "Validando fontes",
      text: "Tenant, papel e políticas estão sendo confirmados."
    };
  }
  if (data?.source === "restricted") {
    return {
      key: "restricted",
      label: "Escopo não certificado",
      text: data?.reason || "A sessão não possui um tenant administrativo verificável."
    };
  }
  if (data?.source === "demo_upe") {
    return {
      key: "demo",
      label: "Dados de demonstração",
      text: "Este ambiente usa uma camada de apresentação explicitamente rotulada."
    };
  }
  if (data?.quality?.status === "partial") {
    return {
      key: "partial",
      label: "Leitura administrativa parcial",
      text: "Uma ou mais fontes não responderam; a cobertura permanece disponível para auditoria."
    };
  }
  if (data?.source === "supabase") {
    return {
      key: "observed",
      label: data?.scope === "global" ? "Supabase · escopo global permitido" : "Supabase · tenant observado",
      text: "Contagens representam somente as linhas retornadas pelas políticas do papel autenticado."
    };
  }
  return {
    key: "unverified",
    label: "Fonte não certificada",
    text: "Nenhum dado será apresentado como real sem uma origem verificável."
  };
}
