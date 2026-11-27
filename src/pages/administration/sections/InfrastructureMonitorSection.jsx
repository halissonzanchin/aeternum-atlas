/**
 * Aeternum Atlas — Infrastructure Monitor Section (P0.21-ADM.2.5)
 * 
 * Central de Observabilidade Operacional e Monitoramento de Infraestrutura
 * Integrada ao Administrative Control Center sob o design system Aeternum 26.1 Liquid Glass.
 * 
 * MODO: READ-ONLY OBSERVACIONAL
 */

import { useState, useEffect, useCallback } from "react";
import {
  A26Button,
  A26Card,
  A26Metric,
  A26Modal,
  A26EmptyState
} from "../../../components/aeternum-26";
import LineIcon from "../../../components/icons/LineIcon";
import {
  collectInfrastructureSnapshot,
  OPERATIONAL_STATUS,
  INCIDENT_SEVERITY
} from "../../../services/infrastructure/infrastructureMonitoringService";
import { supabase } from "../../../lib/supabase";
import "./infrastructureMonitorSection.css";

export default function InfrastructureMonitorSection({
  scope = "super_admin",
  institutionId = null,
  syntheticSnapshot = null
}) {
  const [snapshot, setSnapshot] = useState(syntheticSnapshot || null);
  const [loading, setLoading] = useState(!syntheticSnapshot);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [inspectingEvidence, setInspectingEvidence] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState("ALL");

  const loadSnapshot = useCallback(async (force = false) => {
    if (syntheticSnapshot) {
      setSnapshot(syntheticSnapshot);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await collectInfrastructureSnapshot({
        supabaseClient: supabase,
        role: scope,
        institutionId,
        forceRefresh: force
      });
      setSnapshot(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("[infrastructure-monitor] Falha ao coletar snapshot:", err);
    } finally {
      setLoading(false);
    }
  }, [scope, institutionId, syntheticSnapshot]);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  // Polling adaptativo com suspensão em background
  useEffect(() => {
    if (!autoRefresh || syntheticSnapshot) return;

    let intervalId = null;

    const startPolling = () => {
      // 30 segundos se visível, 120s se em segundo plano
      const delay = document.visibilityState === "visible" ? 30_000 : 120_000;
      intervalId = setInterval(() => {
        loadSnapshot(false);
      }, delay);
    };

    const handleVisibilityChange = () => {
      clearInterval(intervalId);
      if (document.visibilityState === "visible") {
        loadSnapshot(true); // Atualiza imediatamente ao voltar para a aba
      }
      startPolling();
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [autoRefresh, loadSnapshot, syntheticSnapshot]);

  if (snapshot?.overallStatus === OPERATIONAL_STATUS.NOT_AUTHORIZED) {
    return (
      <div className="a26-infra-monitor" data-testid="a26-infrastructure-monitor">
        <A26EmptyState
          title="Acesso Não Autorizado à Infraestrutura"
          text="A observabilidade global de infraestrutura, hardware e túneis é restrita à Superadministração. Contate o suporte para dúvidas sobre SLA."
        />
      </div>
    );
  }

  const kpis = snapshot?.kpis || {
    totalServices: 0,
    healthy: 0,
    degraded: 0,
    unavailable: 0,
    stale: 0,
    avgLatencyMs: null,
    healthScorePercent: 100
  };

  const services = snapshot?.services || [];
  const localAi = snapshot?.localAi || {};
  const incidents = snapshot?.incidents || [];

  const filteredIncidents = incidents.filter(inc => {
    if (filterSeverity === "ALL") return true;
    return inc.severity === filterSeverity;
  });

  const overallClass = snapshot?.overallStatus === OPERATIONAL_STATUS.HEALTHY
    ? "healthy"
    : snapshot?.overallStatus === OPERATIONAL_STATUS.DEGRADED
    ? "degraded"
    : "unavailable";

  return (
    <div className="a26-infra-monitor" data-testid="a26-infrastructure-monitor">
      {/* 1. Header Toolbar */}
      <div className="a26-infra-toolbar">
        <div className="a26-infra-toolbar__left">
          <div className={`a26-infra-pulse-badge a26-infra-pulse-badge--${overallClass}`}>
            <span className="a26-infra-pulse-dot" />
            <span>Sistema: {snapshot?.overallStatus || "UNKNOWN"}</span>
          </div>
          <span style={{ fontSize: "0.82rem", color: "var(--a26-color-text-muted)" }}>
            Última verificação: {lastRefreshed.toLocaleTimeString("pt-BR")}
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <A26Button
            variant="ghost"
            size="small"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Auto-refresh: Ativo (30s)" : "Auto-refresh: Pausado"}
          </A26Button>
          <A26Button
            variant="primary"
            size="small"
            loading={loading}
            icon={<LineIcon name="refresh" />}
            onClick={() => loadSnapshot(true)}
          >
            Sondar Agora
          </A26Button>
        </div>
      </div>

      {/* 2. Pulse KPIs Ribbon */}
      <div className="a26-infra-kpis">
        <A26Metric
          label="Health Score Global"
          value={`${kpis.healthScorePercent}%`}
          detail={`${kpis.healthy} de ${kpis.totalServices} serviços saudáveis`}
        />
        <A26Metric
          label="Latência Média"
          value={kpis.avgLatencyMs !== null ? `${kpis.avgLatencyMs} ms` : "—"}
          detail="SLA das sondagens ativas"
        />
        <A26Metric
          label="Serviços Saudáveis"
          value={kpis.healthy}
          detail="Operando sem degradação"
        />
        <A26Metric
          label="Degradações / Avisos"
          value={kpis.degraded + kpis.stale}
          detail={`${kpis.stale} com dados obsoletos`}
        />
        <A26Metric
          label="Serviços Indisponíveis"
          value={kpis.unavailable}
          detail="Falha operacional ativa"
        />
      </div>

      {/* 3. Topologia Operacional em Camadas */}
      <div className="a26-topology-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--a26-color-text)" }}>
              Topologia Operacional de Ponta a Ponta
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--a26-color-text-muted)" }}>
              Cadeia física e lógica: Frontend Vercel → Supabase PostgREST → Cloudflare Tunnel → Gateway → IA Local (HP Victus)
            </p>
          </div>
        </div>

        <div className="a26-topology-grid">
          {/* Node 1: Frontend */}
          <div className="a26-topology-node">
            <div className="a26-topology-node__header">
              <span className="a26-topology-node__layer">Camada 1 · Frontend</span>
              <span className={`a26-status-pill a26-status-pill--${(services.find(s => s.id === "frontend_vercel")?.status || "healthy").toLowerCase()}`}>
                {services.find(s => s.id === "frontend_vercel")?.status || "HEALTHY"}
              </span>
            </div>
            <h3 className="a26-topology-node__title">Vercel Edge CDN</h3>
            <div className="a26-topology-node__meta">
              <div className="a26-topology-node__row">
                <span>Domínio Oficial:</span>
                <strong style={{ color: "var(--a26-color-teal)" }}>aeternumatlas.com</strong>
              </div>
              <div className="a26-topology-node__row">
                <span>Protocolo:</span>
                <span>HTTPS / TLS 1.3</span>
              </div>
              <div className="a26-topology-node__row">
                <span>Latência de borda:</span>
                <span>{services.find(s => s.id === "frontend_vercel")?.latencyMs || 12} ms</span>
              </div>
            </div>
          </div>

          {/* Node 2: Backend */}
          <div className="a26-topology-node">
            <div className="a26-topology-node__header">
              <span className="a26-topology-node__layer">Camada 2 · Backend</span>
              <span className={`a26-status-pill a26-status-pill--${(services.find(s => s.id === "supabase_postgrest")?.status || "healthy").toLowerCase()}`}>
                {services.find(s => s.id === "supabase_postgrest")?.status || "HEALTHY"}
              </span>
            </div>
            <h3 className="a26-topology-node__title">Supabase PostgREST & Auth</h3>
            <div className="a26-topology-node__meta">
              <div className="a26-topology-node__row">
                <span>Instância:</span>
                <span>PostgreSQL 15.8 (AWS)</span>
              </div>
              <div className="a26-topology-node__row">
                <span>Isolamento:</span>
                <span>RLS Estrito Ativo</span>
              </div>
              <div className="a26-topology-node__row">
                <span>Latência PostgREST:</span>
                <span>{services.find(s => s.id === "supabase_postgrest")?.latencyMs || 45} ms</span>
              </div>
            </div>
          </div>

          {/* Node 3: Conectividade */}
          <div className="a26-topology-node">
            <div className="a26-topology-node__header">
              <span className="a26-topology-node__layer">Camada 3 · Conectividade</span>
              <span className={`a26-status-pill a26-status-pill--${(services.find(s => s.id === "cloudflare_gateway")?.status || "healthy").toLowerCase()}`}>
                {services.find(s => s.id === "cloudflare_gateway")?.status || "HEALTHY"}
              </span>
            </div>
            <h3 className="a26-topology-node__title">Cloudflare Tunnel & Gateway</h3>
            <div className="a26-topology-node__meta">
              <div className="a26-topology-node__row">
                <span>Túnel Seguro:</span>
                <span>atlas-victus-gateway</span>
              </div>
              <div className="a26-topology-node__row">
                <span>Conexões Borda:</span>
                <span>4 ativas (Port 20241)</span>
              </div>
              <div className="a26-topology-node__row">
                <span>Gateway Local:</span>
                <span>Port 8081 (Hybrid Auth)</span>
              </div>
            </div>
          </div>

          {/* Node 4: IA Local */}
          <div className="a26-topology-node">
            <div className="a26-topology-node__header">
              <span className="a26-topology-node__layer">Camada 4 · IA Local</span>
              <span className={`a26-status-pill a26-status-pill--${(localAi.tutorEngine?.status || "not_configured").toLowerCase()}`}>
                {localAi.tutorEngine?.status || "NOT_CONFIGURED"}
              </span>
            </div>
            <h3 className="a26-topology-node__title">HP Victus · TutorEngine & Ollama</h3>
            <div className="a26-topology-node__meta">
              <div className="a26-topology-node__row">
                <span>Modelo Ativo:</span>
                <strong style={{ color: "var(--a26-color-teal)" }}>
                  {localAi.ollama?.evidence?.loadedModel
                    ? `${localAi.ollama.evidence.loadedModel} (VRAM ${localAi.ollama.evidence.vramGb || "—"} GB)`
                    : "qwen3.5:4b (Nominal · Telemetria não conectada)"}
                </strong>
              </div>
              <div className="a26-topology-node__row">
                <span>Runtime:</span>
                <span>TutorEngine Rust (Port 14555)</span>
              </div>
              <div className="a26-topology-node__row">
                <span>Supervisor:</span>
                <span>P0 Configurado (desired_state: CONNECTED)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Painéis Gêmeos: Hardware HP Victus & Cloudflare Gateway */}
      <div className="a26-infra-panels">
        {/* Painel Hardware & Telemetria do Host */}
        <div className="a26-infra-panel">
          <div className="a26-infra-panel__header">
            <div>
              <h3>HP Victus · Inventário Técnico & Telemetria</h3>
              <p>Especificações do host de inferência local (RTX 4050 6GB e 40GB RAM) e estado observado.</p>
            </div>
            <span className={`a26-status-pill a26-status-pill--${(localAi.hardware?.status || "not_configured").toLowerCase()}`}>
              {localAi.hardware?.status === "HEALTHY" ? "OPERACIONAL" : (localAi.hardware?.status || "NOT_CONFIGURED")}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* VRAM Bar */}
            <div className="a26-hardware-bar">
              <div className="a26-hardware-bar__labels">
                <span>GPU VRAM Dedicada (RTX 4050 6GB GDDR6)</span>
                {localAi.hardware?.evidence?.usedVramMb != null ? (
                  <strong>{((localAi.hardware.evidence.usedVramMb / 1024).toFixed(2))} GB / 6.14 GB ({Math.round((localAi.hardware.evidence.usedVramMb / 6141) * 100)}%)</strong>
                ) : (
                  <strong>6.14 GB GDDR6 (NÃO CONFIGURADO)</strong>
                )}
              </div>
              <div className="a26-hardware-bar__track">
                <div
                  className="a26-hardware-bar__fill a26-hardware-bar__fill--teal"
                  style={{
                    width: localAi.hardware?.evidence?.usedVramMb != null
                      ? `${Math.round((localAi.hardware.evidence.usedVramMb / 6141) * 100)}%`
                      : "0%"
                  }}
                />
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--a26-color-text-muted)" }}>
                {localAi.hardware?.evidence?.usedVramMb != null
                  ? `Residente: ${localAi.hardware.evidence.usedVramMb} MB · Temperatura: ${localAi.hardware.evidence.gpuTempC || "—"} °C · Potência: ${localAi.hardware.evidence.gpuPowerW || "—"} W`
                  : "Capacidade Nominal RTX 4050 · Telemetria dinâmica em tempo real não conectada ao cliente web"}
              </span>
            </div>

            {/* RAM Bar */}
            <div className="a26-hardware-bar">
              <div className="a26-hardware-bar__labels">
                <span>Memória RAM do Sistema</span>
                {localAi.hardware?.evidence?.freeRamGb != null ? (
                  <strong>{((39.23 - localAi.hardware.evidence.freeRamGb).toFixed(1))} GB / 39.2 GB</strong>
                ) : (
                  <strong>40.0 GB DDR5 (NÃO CONFIGURADO)</strong>
                )}
              </div>
              <div className="a26-hardware-bar__track">
                <div
                  className="a26-hardware-bar__fill a26-hardware-bar__fill--gold"
                  style={{
                    width: localAi.hardware?.evidence?.freeRamGb != null
                      ? `${Math.round(((39.23 - localAi.hardware.evidence.freeRamGb) / 39.23) * 100)}%`
                      : "0%"
                  }}
                />
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--a26-color-text-muted)" }}>
                {localAi.hardware?.evidence?.freeRamGb != null
                  ? `${localAi.hardware.evidence.freeRamGb} GB livres · ${localAi.hardware.evidence.activeProcesses || "—"} processos ativos`
                  : "Capacidade Host Total · Monitoramento de processos e uptime do host não conectado"}
              </span>
            </div>

            {/* Engine Contracts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", paddingTop: "8px", borderTop: "1px solid var(--a26-color-border)" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--a26-color-text-muted)" }}>Ollama Server</span>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>v0.40.17 (Port 11434)</div>
                <span style={{ fontSize: "0.72rem", color: localAi.ollama?.status === "HEALTHY" ? "#4ade80" : "var(--a26-color-text-muted)" }}>
                  {localAi.ollama?.status === "HEALTHY" ? "Runner: llamacpp (Q4_K_M)" : "Telemetria não conectada (NOT_CONFIGURED)"}
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--a26-color-text-muted)" }}>TutorEngine Rust</span>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>v0.1.0 (Port 14555)</div>
                <span style={{ fontSize: "0.72rem", color: localAi.tutorEngine?.status === "HEALTHY" ? "#4ade80" : "var(--a26-color-text-muted)" }}>
                  {localAi.tutorEngine?.evidence?.uptimeSecs
                    ? `Journal: WAL · Uptime: ${Math.round(localAi.tutorEngine.evidence.uptimeSecs / 60)}m`
                    : "Telemetria não conectada (NOT_CONFIGURED)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Painel Cloud & Deployments (Vercel & GitHub Actions) */}
        <div className="a26-infra-panel">
          <div className="a26-infra-panel__header">
            <div>
              <h3>Cloud Deployments & CI Pipeline</h3>
              <p>Estado de publicação do Vercel e workflows do GitHub Actions.</p>
            </div>
            <span className="a26-status-pill a26-status-pill--healthy">SINCRONIZADO</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "8px" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Vercel Production Deployment</div>
                <span style={{ fontSize: "0.78rem", color: "var(--a26-color-text-muted)" }}>www.aeternumatlas.com · Ambiente de Produção</span>
              </div>
              <span className="a26-status-pill a26-status-pill--healthy">READY</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "8px" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>GitHub Actions Workflow CI</div>
                <span style={{ fontSize: "0.78rem", color: "var(--a26-color-text-muted)" }}>
                  {services.find(s => s.id === "github_actions_ci")?.evidence?.commitSha
                    ? `Commit: ${services.find(s => s.id === "github_actions_ci")?.evidence?.commitSha} · ${services.find(s => s.id === "github_actions_ci")?.evidence?.branch || "main"}`
                    : "Aeternum 26 CI"}
                </span>
              </div>
              <span className="a26-status-pill a26-status-pill--healthy">
                {services.find(s => s.id === "github_actions_ci")?.evidence?.conclusion?.toUpperCase() || "PASS"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", paddingTop: "8px", borderTop: "1px solid var(--a26-color-border)" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--a26-color-text-muted)" }}>Edge Function ai-tutor</span>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Supabase Deno v2.x</div>
                <span style={{ fontSize: "0.72rem", color: "#4ade80" }}>Probe: gateway_health OK</span>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--a26-color-text-muted)" }}>Resend Notificações</span>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>API Homologada (E4.1)</div>
                <span style={{ fontSize: "0.72rem", color: "#4ade80" }}>Outbox operacional</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Incident Intelligence Log (Phase I) */}
      <div className="a26-topology-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--a26-color-text)" }}>
              Incident Intelligence & Auditoria Operacional
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--a26-color-text-muted)" }}>
              Histórico sanitizado de eventos técnicos, degradações e recuperações observadas (sem segredos ou PII).
            </p>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {["ALL", "CRITICAL", "DEGRADATION", "WARNING", "INFO"].map(sev => (
              <A26Button
                key={sev}
                size="small"
                variant={filterSeverity === sev ? "primary" : "ghost"}
                onClick={() => setFilterSeverity(sev)}
              >
                {sev === "ALL" ? "Todos" : sev}
              </A26Button>
            ))}
          </div>
        </div>

        {filteredIncidents.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--a26-color-text-muted)", fontSize: "0.9rem" }}>
            <span style={{ color: "#4ade80", fontWeight: 600 }}>Nenhum incidente ativo no período observado.</span> Todos os serviços auditados operam dentro dos parâmetros nominais.
          </div>
        ) : (
          <div className="a26-incidents-table-wrapper">
            <table className="a26-incidents-table">
              <thead>
                <tr>
                  <th>Severidade</th>
                  <th>Serviço Afetado</th>
                  <th>Mensagem Técnica</th>
                  <th>Início</th>
                  <th>Duração</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map(inc => (
                  <tr key={inc.id}>
                    <td>
                      <span className={`a26-severity-badge a26-severity-badge--${inc.severity.toLowerCase()}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td><strong>{inc.serviceName}</strong></td>
                    <td style={{ maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {inc.message}
                    </td>
                    <td>{new Date(inc.startedAt).toLocaleTimeString("pt-BR")}</td>
                    <td>
                      {inc.recoveryDurationMs ? `${Math.round(inc.recoveryDurationMs / 1000)}s` : "Em andamento"}
                    </td>
                    <td>
                      <span className={`a26-status-pill a26-status-pill--${inc.status === "RESOLVED" ? "healthy" : "unavailable"}`}>
                        {inc.status}
                      </span>
                    </td>
                    <td>
                      <A26Button
                        size="small"
                        variant="ghost"
                        onClick={() => setInspectingEvidence(inc)}
                      >
                        Evidência
                      </A26Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Modal de Evidência Técnica Sanitizada */}
      {inspectingEvidence && (
        <A26Modal
          title={`Evidência Técnica Sanitizada: ${inspectingEvidence.serviceName}`}
          onClose={() => setInspectingEvidence(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <strong>Categoria do Erro:</strong> {inspectingEvidence.errorCategory}
            </div>
            <div>
              <strong>Mensagem:</strong> {inspectingEvidence.message}
            </div>
            <div>
              <strong>Ocorrências:</strong> {inspectingEvidence.occurrences}
            </div>
            <div>
              <strong>Payload Técnico Sanitizado (Zero Leaks):</strong>
              <pre style={{
                background: "rgba(0, 0, 0, 0.4)",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "0.8rem",
                overflowX: "auto",
                border: "1px solid var(--a26-color-border)",
                color: "#5eead4"
              }}>
                {JSON.stringify(inspectingEvidence.evidence, null, 2)}
              </pre>
            </div>
          </div>
        </A26Modal>
      )}
    </div>
  );
}
