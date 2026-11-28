/**
 * Aeternum Atlas — Financial Intelligence & Business Sustainability Section
 * Module: P0.21-ADM.2.6
 *
 * Implements the Financial Intelligence Center for administrative governance:
 * - Executive Financial Dashboard with strict canonical taxonomy (REALIZADO vs CONTRATADO vs PROJETADO)
 * - Institutional B2B Contracts Management with certification tracking
 * - Individual B2C Subscriptions (Read-only simulation & governance)
 * - 14-Line Managerial DRE (Realized vs Projected)
 * - Cash Flow Tracking (Entradas vs Saídas)
 * - OPEX & CAPEX Segregation (Host IA Local, Datacenter, Pró-labore, Contabilidade, Marketing)
 * - Profitability & BI (Contribution Margin, Net Margin, Break-even, Payback, ROI, Runway)
 * - Interactive Business Simulator with historical scenarios (UPE, B2C, 5 Sócios)
 *
 * Design System: Aeternum 26.1 Liquid Glass (0 direct backdrop-filter)
 */

import React, { useState, useEffect, useMemo } from "react";
import { A26Card, A26Button, A26EmptyState } from "../../../components/aeternum-26";
import {
  formatMoney,
  convertCurrency,
  buildManagerialDRE,
  generateDRECsv,
  simulateFinancialScenario,
  getRealizedFinancialMetrics,
  PRESET_SCENARIOS,
  FISCAL_PARAMETERS,
  REVENUE_NATURE,
  CONTRACT_STATUS,
  OPEX_CATEGORIES,
  CAPEX_CATEGORIES,
  CURRENCY
} from "../../../services/financial/financialIntelligenceService";
import "./financialIntelligenceSection.css";

/**
 * FINAL-03: Helper de formatação de KPIs com segregação estrita de estados.
 * Elimina falsos zeros para estados UNAVAILABLE, NOT_AUTHORIZED, NOT_CONFIGURED e NOT_CERTIFIED.
 */
function formatKpiValue(value, status, emptyText = "—") {
  if (status === "UNAVAILABLE") return "INDISPONÍVEL";
  if (status === "NOT_AUTHORIZED") return "NÃO AUTORIZADO";
  if (status === "NOT_CONFIGURED") return "NÃO CONFIGURADO";
  if (status === "NOT_CERTIFIED" && (value === null || value === undefined || value === 0)) {
    return "NÃO CERTIFICADO";
  }
  if (value === null || value === undefined) return emptyText;
  if (typeof value === "number") {
    if (value === 0 && status === "EMPTY") return "R$ 0,00";
    return formatMoney(value);
  }
  return String(value);
}

export default function FinancialIntelligenceSection({ scope = "global", institutionId = null }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [realizedData, setRealizedData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulator state with UPE preset by default
  const [simPreset, setSimPreset] = useState("UPE_INSTITUTIONAL");
  const [simParams, setSimParams] = useState(PRESET_SCENARIOS.UPE_INSTITUTIONAL.parameters);

  // Load Realized Financial Metrics
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      const metrics = await getRealizedFinancialMetrics({
        userRole: scope === "global" ? "super_admin" : "institution_admin",
        institutionId
      });
      if (isMounted) {
        setRealizedData(metrics);
        setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [scope, institutionId]);

  // Handle Preset change
  const handleSelectPreset = (presetKey) => {
    setSimPreset(presetKey);
    setSimParams(PRESET_SCENARIOS[presetKey].parameters);
  };

  // Run simulation reactively
  const simulation = useMemo(() => {
    return simulateFinancialScenario(simParams);
  }, [simParams]);

  // Export DRE to CSV (Single source of truth via generateDRECsv)
  const handleExportDRE = () => {
    const csvContent = generateDRECsv(simulation.dre);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DRE_Gerencial_Aeternum_Atlas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="financial26-container">
      {/* 1. Header & Financial Taxonomy Banner */}
      <div className="financial26-header-card">
        <div className="financial26-header-top">
          <div className="financial26-title-group">
            <h2>
              <span>🏛️</span>
              <span>Financial Intelligence Center</span>
            </h2>
            <p>
              Gestão de contratos, sustentabilidade empresarial, DRE gerencial, fluxo de caixa e simulação econômica.
            </p>
          </div>
          <div className="financial26-status-badges">
            <span className="financial26-badge financial26-badge-realized">
              ● REALIZADO (CONCILIADO)
            </span>
            <span className="financial26-badge financial26-badge-contracted">
              ● CONTRATADO (CERTIFICADO)
            </span>
            <span className="financial26-badge financial26-badge-projected">
              ● PROJETADO (SIMULADOR)
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="financial26-tabs-bar" role="tablist">
          <button
            className={`financial26-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
            role="tab"
            aria-selected={activeTab === "overview"}
          >
            📊 Dashboard Executivo
          </button>
          <button
            className={`financial26-tab-btn ${activeTab === "contracts" ? "active" : ""}`}
            onClick={() => setActiveTab("contracts")}
            role="tab"
            aria-selected={activeTab === "contracts"}
          >
            📝 Contratos B2B
          </button>
          <button
            className={`financial26-tab-btn ${activeTab === "subscriptions" ? "active" : ""}`}
            onClick={() => setActiveTab("subscriptions")}
            role="tab"
            aria-selected={activeTab === "subscriptions"}
          >
            💳 Assinaturas B2C
          </button>
          <button
            className={`financial26-tab-btn ${activeTab === "dre" ? "active" : ""}`}
            onClick={() => setActiveTab("dre")}
            role="tab"
            aria-selected={activeTab === "dre"}
          >
            📑 DRE Gerencial
          </button>
          <button
            className={`financial26-tab-btn ${activeTab === "cash_flow" ? "active" : ""}`}
            onClick={() => setActiveTab("cash_flow")}
            role="tab"
            aria-selected={activeTab === "cash_flow"}
          >
            💵 Fluxo de Caixa
          </button>
          <button
            className={`financial26-tab-btn ${activeTab === "opex_capex" ? "active" : ""}`}
            onClick={() => setActiveTab("opex_capex")}
            role="tab"
            aria-selected={activeTab === "opex_capex"}
          >
            🏢 OPEX & CAPEX
          </button>
          <button
            className={`financial26-tab-btn ${activeTab === "profitability" ? "active" : ""}`}
            onClick={() => setActiveTab("profitability")}
            role="tab"
            aria-selected={activeTab === "profitability"}
          >
            📈 Rentabilidade & BI
          </button>
          <button
            className={`financial26-tab-btn ${activeTab === "simulator" ? "active" : ""}`}
            onClick={() => setActiveTab("simulator")}
            role="tab"
            aria-selected={activeTab === "simulator"}
          >
            🧪 Business Simulator
          </button>
        </div>
      </div>

      {/* 2. TAB: OVERVIEW (DASHBOARD EXECUTIVO) */}
      {activeTab === "overview" && (
        <>
          <div className="financial26-kpi-grid">
            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">MRR Contratado (B2B)</span>
              <span className="financial26-kpi-value">
                {formatKpiValue(realizedData?.mrrContracted, realizedData?.status, "R$ 0,00")}
              </span>
              <span className="financial26-kpi-detail">
                {realizedData?.certified ? "Homologado em contrato" : (realizedData?.status === "NOT_CERTIFIED" ? "Contrato não certificado" : "Sem contratos ativos")}
              </span>
            </div>

            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">ARR Contratado</span>
              <span className="financial26-kpi-value">
                {formatKpiValue(realizedData?.arrContracted, realizedData?.status, "R$ 0,00")}
              </span>
              <span className="financial26-kpi-detail">12 × MRR Contratual certificado</span>
            </div>

            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">Receita Faturada (Ciclo)</span>
              <span className="financial26-kpi-value">
                {formatKpiValue(realizedData?.billedInCycle, realizedData?.status, "NÃO CONFIGURADO")}
              </span>
              <span className="financial26-kpi-detail">Faturas emitidas via gateway/NFS-e</span>
            </div>

            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">Receita Recebida</span>
              <span className="financial26-kpi-value">
                {formatKpiValue(realizedData?.receivedInCycle, realizedData?.status, "NÃO CONFIGURADO")}
              </span>
              <span className="financial26-kpi-detail">Liquidação bancária confirmada</span>
            </div>

            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">ARPU Contratual</span>
              <span className="financial26-kpi-value">
                {realizedData?.arpu != null
                  ? formatMoney(realizedData.arpu)
                  : (realizedData?.status === "NOT_CERTIFIED" ? "NÃO CERTIFICADO" : "—")}
              </span>
              <span className="financial26-kpi-detail">Receita média por licença faturável</span>
            </div>

            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">MRR Projetado (Simulação)</span>
              <span className="financial26-kpi-value" style={{ color: "#f59e0b" }}>
                {formatMoney(simulation.mrr)}
              </span>
              <span className="financial26-kpi-detail">Cenário ativo: {PRESET_SCENARIOS[simPreset]?.name}</span>
            </div>
          </div>

          <div className="financial26-notice-card">
            <strong>Princípio de Rigor Financeiro (P0.21-ADM.2.6):</strong> O Administrative Control Center
            não calcula receita a partir de quantidade de estudantes acadêmicos cadastrados, não assume
            preços de tabela sem contrato assinado e não antecipa faturamento sem documento fiscal emitido.
            Métricas de faturamento derivam estritamente de contratos ou assinaturas formais comprovadas.
          </div>
        </>
      )}

      {/* 3. TAB: CONTRATOS B2B */}
      {activeTab === "contracts" && (
        <A26Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--a26-space-3)" }}>
            <div>
              <h3 style={{ margin: 0, color: "var(--a26-color-text-primary)" }}>Contratos Institucionais (B2B)</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "var(--a26-font-xs)", color: "var(--a26-color-text-secondary)" }}>
                Registro e certificação de acordos comerciais com universidades e faculdades de medicina.
              </p>
            </div>
          </div>

          <div className="financial26-table-wrap">
            <table className="financial26-table">
              <thead>
                <tr>
                  <th>Instituição</th>
                  <th>Nº Contrato</th>
                  <th>Status</th>
                  <th>Capacidade</th>
                  <th>Licenças Faturáveis</th>
                  <th>Valor Unitário</th>
                  <th>Moeda</th>
                  <th>Certificação</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Universidad Privada del Este (UPE)</strong></td>
                  <td>PROP-UPE-2026/01</td>
                  <td><span className="financial26-badge financial26-badge-projected">EM NEGOCIAÇÃO</span></td>
                  <td>500 licenças</td>
                  <td>450 alunos</td>
                  <td>US$ 15,00 / mês</td>
                  <td>USD</td>
                  <td><span style={{ color: "var(--a26-color-text-subtle)" }}>PENDENTE (PROPOSTA)</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: "var(--a26-font-xs)", color: "var(--a26-color-text-subtle)", marginTop: "var(--a26-space-2)" }}>
            * Governança Contratual (FIN-01): Status ACTIVE isolado não comprova vigência jurídica. Exige-se certificação documental homologada (documentRef/URL) e segregação estrita entre capacidade total, licenças faturáveis e gratuidades docentes. Contratos sem comprovação são registrados como <strong>NOT_CERTIFIED</strong>.
          </p>
        </A26Card>
      )}

      {/* 4. TAB: ASSINATURAS B2C */}
      {activeTab === "subscriptions" && (
        <A26Card>
          <div style={{ marginBottom: "var(--a26-space-3)" }}>
            <h3 style={{ margin: 0, color: "var(--a26-color-text-primary)" }}>Assinaturas Individuais (B2C)</h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "var(--a26-font-xs)", color: "var(--a26-color-text-secondary)" }}>
              Estrutura para planos individuais de estudantes e médicos residentes.
            </p>
          </div>

          <div className="financial26-kpi-grid" style={{ marginBottom: "var(--a26-space-4)" }}>
            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">Plano Mensal Individual</span>
              <span className="financial26-kpi-value">{formatMoney(120.00)}</span>
              <span className="financial26-kpi-detail">Preço de referência de planejamento</span>
            </div>
            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">Assinantes B2C Ativos</span>
              <span className="financial26-kpi-value">0</span>
              <span className="financial26-kpi-detail">Gateway de pagamento em homologação</span>
            </div>
            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">Taxa de Churn B2C</span>
              <span className="financial26-kpi-value">NÃO DISPONÍVEL</span>
              <span className="financial26-kpi-detail">Sem série histórica de cancelamento</span>
            </div>
          </div>

          <div className="financial26-notice-card">
            <strong>Segurança e Isolamento B2C:</strong> O sistema não coleta dados de cartão de crédito no navegador,
            não envia links de cobrança não solicitados e não altera o acesso acadêmico de alunos a partir de dados
            financeiros não certificados.
          </div>
        </A26Card>
      )}

      {/* 5. TAB: DRE GERENCIAL (14 LINHAS CANÔNICAS) */}
      {activeTab === "dre" && (
        <A26Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--a26-space-3)", flexWrap: "wrap", gap: "var(--a26-space-2)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ margin: 0, color: "var(--a26-color-text-primary)" }}>DRE Gerencial (14 Linhas Canônicas)</h3>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                  SIMULATION_ONLY · CENÁRIO PROJETADO
                </span>
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "var(--a26-font-xs)", color: "var(--a26-color-text-secondary)" }}>
                Demonstração de Resultados por regime de competência (Simulação Projetada: {PRESET_SCENARIOS[simPreset]?.name}).
              </p>
            </div>
            <A26Button variant="secondary" onClick={handleExportDRE}>
              📥 Exportar DRE (CSV)
            </A26Button>
          </div>

          <div style={{ marginBottom: "16px", padding: "10px 14px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "8px", border: "1px solid var(--a26-color-border)", fontSize: "0.78rem", color: "var(--a26-color-text-muted)" }}>
            <strong>DRE Realizada:</strong> <span style={{ color: "var(--a26-color-gold)" }}>NÃO CONFIGURADO</span> — Demonstrativo contábil realizado indisponível na ausência de ERP ou livro razão homologado. Os valores abaixo representam estritamente o cenário de simulação gerencial.
          </div>

          <div className="financial26-table-wrap">
            <table className="financial26-table">
              <thead>
                <tr>
                  <th>Linha Contábil</th>
                  <th>Código</th>
                  <th style={{ textAlign: "right" }}>Projetado Mensal (BRL)</th>
                  <th style={{ textAlign: "right" }}>Projetado Anualizado (BRL)</th>
                  <th>Classificação</th>
                </tr>
              </thead>
              <tbody>
                {simulation.dre.lines.map(line => (
                  <tr
                    key={line.id}
                    className={`${line.isTotal ? "dre-total" : ""} ${line.isNegative ? "dre-negative" : ""}`}
                  >
                    <td>{line.name}</td>
                    <td><code>{line.code}</code></td>
                    <td style={{ textAlign: "right" }} className="value">
                      {line.isNegative && line.value > 0 ? `(${formatMoney(line.value)})` : formatMoney(line.value)}
                      {line.percent != null && ` (${line.percent}%)`}
                    </td>
                    <td style={{ textAlign: "right" }} className="value">
                      {line.isNegative && line.value > 0 ? `(${formatMoney(line.value * 12)})` : formatMoney(line.value * 12)}
                    </td>
                    <td>
                      {line.isTotal ? "Subtotal / Totalizador" : line.isNegative ? "Dedução / Custo" : "Receita Bruta"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: "var(--a26-font-xs)", color: "var(--a26-color-text-subtle)", marginTop: "var(--a26-space-2)" }}>
            * Regime contábil de competência. Valores em moeda corrente nacional (BRL), calculados sob a premissa de {FISCAL_PARAMETERS.regime}.
          </p>
        </A26Card>
      )}

      {/* 6. TAB: FLUXO DE CAIXA */}
      {activeTab === "cash_flow" && (
        <A26Card>
          <div style={{ marginBottom: "var(--a26-space-3)" }}>
            <h3 style={{ margin: 0, color: "var(--a26-color-text-primary)" }}>Fluxo de Caixa Operacional (Regime de Caixa)</h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "var(--a26-font-xs)", color: "var(--a26-color-text-secondary)" }}>
              Entradas líquidas e saídas de caixa projetadas vs realizadas.
            </p>
          </div>

          <div className="financial26-kpi-grid">
            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">Entradas Projetadas (Mensal)</span>
              <span className="financial26-kpi-value" style={{ color: "#10b981" }}>
                {formatMoney(simulation.monthlyNetRevenue)}
              </span>
              <span className="financial26-kpi-detail">Receita líquida após tributos</span>
            </div>
            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">Saídas Operacionais (OPEX)</span>
              <span className="financial26-kpi-value" style={{ color: "#ef4444" }}>
                ({formatMoney(simulation.monthlyFixedOpex + simulation.monthlyDirectCosts)})
              </span>
              <span className="financial26-kpi-detail">Custos diretos + Pró-labore + Despesas</span>
            </div>
            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">Saldo Líquido de Caixa</span>
              <span className="financial26-kpi-value" style={{ color: simulation.monthlyOperatingResult >= 0 ? "#10b981" : "#ef4444" }}>
                {formatMoney(simulation.monthlyOperatingResult)}
              </span>
              <span className="financial26-kpi-detail">Geração operacional de caixa</span>
            </div>
          </div>
        </A26Card>
      )}

      {/* 7. TAB: OPEX & CAPEX */}
      {activeTab === "opex_capex" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--a26-space-4)" }}>
          <A26Card>
            <h3 style={{ margin: "0 0 var(--a26-space-3) 0", color: "var(--a26-color-text-primary)" }}>
              Despesas Operacionais Recorrentes (OPEX)
            </h3>
            <div className="financial26-table-wrap">
              <table className="financial26-table">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Descrição</th>
                    <th>Periodicidade</th>
                    <th style={{ textAlign: "right" }}>Valor Base Mensal</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>{OPEX_CATEGORIES.PRO_LABORE}</strong></td>
                    <td>Remuneração dos 5 sócios fundadores (R$ 2.500 cada)</td>
                    <td>Mensal</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(12500.00)}</td>
                    <td>Fixa</td>
                  </tr>
                  <tr>
                    <td><strong>{OPEX_CATEGORIES.ACCOUNTING}</strong></td>
                    <td>Honorários contábeis especializados e assessoria fiscal</td>
                    <td>Mensal</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(350.00)}</td>
                    <td>Fixa</td>
                  </tr>
                  <tr>
                    <td><strong>{OPEX_CATEGORIES.MARKETING}</strong></td>
                    <td>Comunicação médica institucional, divulgação científica e SEO</td>
                    <td>Mensal</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(1200.00)}</td>
                    <td>Fixa</td>
                  </tr>
                  <tr>
                    <td><strong>{OPEX_CATEGORIES.CLOUD_VERCEL}</strong></td>
                    <td>Hospedagem de borda, Edge Functions e CDN</td>
                    <td>Mensal</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(120.00)}</td>
                    <td>Variável</td>
                  </tr>
                  <tr>
                    <td><strong>{OPEX_CATEGORIES.CLOUD_SUPABASE}</strong></td>
                    <td>Banco de dados PostgreSQL gerenciado, Auth e Storage</td>
                    <td>Mensal</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(150.00)}</td>
                    <td>Fixa</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </A26Card>

          <A26Card>
            <h3 style={{ margin: "0 0 var(--a26-space-3) 0", color: "var(--a26-color-text-primary)" }}>
              Investimentos em Ativos & Infraestrutura (CAPEX)
            </h3>
            <div className="financial26-table-wrap">
              <table className="financial26-table">
                <thead>
                  <tr>
                    <th>Ativo Tecnológico</th>
                    <th>Especificação</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Valor Investido</th>
                    <th>Depreciação Mensal (36m)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>{CAPEX_CATEGORIES.AI_SERVERS}</strong></td>
                    <td>Host HP Victus (RTX 4050 6GB / 40GB RAM / i5-13420H) + Servidor local</td>
                    <td><span className="financial26-badge financial26-badge-realized">OPERACIONAL</span></td>
                    <td style={{ textAlign: "right" }}>{formatMoney(70000.00)}</td>
                    <td>{formatMoney(70000.00 / 36)} / mês</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </A26Card>
        </div>
      )}

      {/* 8. TAB: RENTABILIDADE & BI */}
      {activeTab === "profitability" && (
        <A26Card>
          <div style={{ marginBottom: "var(--a26-space-3)" }}>
            <h3 style={{ margin: 0, color: "var(--a26-color-text-primary)" }}>Métricas de Rentabilidade & Sustentabilidade</h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "var(--a26-font-xs)", color: "var(--a26-color-text-secondary)" }}>
              Indicadores de retorno financeiro e viabilidade operacional do cenário ativo.
            </p>
          </div>

          <div className="financial26-kpi-grid">
            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">Ponto de Equilíbrio (Break-Even)</span>
              <span className="financial26-kpi-value" style={{ color: "var(--a26-color-accent)" }}>
                {simulation.breakEvenStudents != null ? `${simulation.breakEvenStudents} alunos` : "—"}
              </span>
              <span className="financial26-kpi-detail">Para cobrir custos fixos e gratuidades</span>
            </div>

            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">Payback Antes de Tributos</span>
              <span className="financial26-kpi-value">
                {simulation.paybackMonthsBeforeTax != null ? `${simulation.paybackMonthsBeforeTax} meses` : "—"}
              </span>
              <span className="financial26-kpi-detail">Base: EBITDA operacional s/ tributos</span>
            </div>

            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">Payback Após Tributos</span>
              <span className="financial26-kpi-value" style={{ color: "#10b981" }}>
                {simulation.paybackMonthsAfterTax != null ? `${simulation.paybackMonthsAfterTax} meses` : "—"}
              </span>
              <span className="financial26-kpi-detail">Base: Caixa líquido c/ IRPJ/CSLL</span>
            </div>

            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">ROI Anualizado sobre CAPEX</span>
              <span className="financial26-kpi-value" style={{ color: "#10b981" }}>
                {simulation.annualROI != null ? `${simulation.annualROI}%` : "—"}
              </span>
              <span className="financial26-kpi-detail">Retorno anual / investimento inicial</span>
            </div>

            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">Margem de Contribuição</span>
              <span className="financial26-kpi-value">
                {simulation.contributionMarginPercent}%
              </span>
              <span className="financial26-kpi-detail">Após deduções fiscais e custos diretos</span>
            </div>

            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">Lucro Líquido Anualizado</span>
              <span className="financial26-kpi-value" style={{ color: simulation.annualNetResult >= 0 ? "#10b981" : "#ef4444" }}>
                {formatMoney(simulation.annualNetResult)}
              </span>
              <span className="financial26-kpi-detail">Após pró-labore, custos e depreciação</span>
            </div>

            <div className="financial26-kpi-card">
              <span className="financial26-kpi-label">Runway Financeiro</span>
              <span className="financial26-kpi-value" style={{ fontSize: "var(--a26-font-xs)" }}>
                {simulation.runway?.label || (typeof simulation.runwayMonths === "number" ? `${simulation.runwayMonths} meses` : "POSITIVO")}
              </span>
              <span className="financial26-kpi-detail">
                {simulation.runway?.isPositive ? "Geração de caixa líquida positiva" : "Sobrevivência da reserva (R$ 30k)"}
              </span>
            </div>
          </div>
        </A26Card>
      )}

      {/* 9. TAB: BUSINESS SIMULATOR (INTERATIVO) */}
      {activeTab === "simulator" && (
        <div className="financial26-sim-grid">
          <div className="financial26-sim-card">
            <div>
              <h3 style={{ margin: "0 0 4px 0", color: "var(--a26-color-text-primary)" }}>Cenários Pré-configurados</h3>
              <p style={{ margin: 0, fontSize: "var(--a26-font-xs)", color: "var(--a26-color-text-secondary)" }}>
                Selecione uma modelagem econômica validada para análise rápida:
              </p>
            </div>

            <div className="financial26-sim-presets">
              {Object.keys(PRESET_SCENARIOS).map(key => (
                <button
                  key={key}
                  className={`financial26-preset-pill ${simPreset === key ? "active" : ""}`}
                  onClick={() => handleSelectPreset(key)}
                >
                  {PRESET_SCENARIOS[key].name}
                </button>
              ))}
            </div>

            <div className="financial26-form-group">
              <label>Estudantes Pagantes (Licenças Faturáveis)</label>
              <input
                type="number"
                className="financial26-input"
                value={simParams.billableStudents || ""}
                onChange={(e) => setSimParams(prev => ({ ...prev, billableStudents: Number(e.target.value) }))}
              />
            </div>

            <div className="financial26-form-group">
              <label>Professores com Acesso Gratuito</label>
              <input
                type="number"
                className="financial26-input"
                value={simParams.freeTeachers || 0}
                onChange={(e) => setSimParams(prev => ({ ...prev, freeTeachers: Number(e.target.value) }))}
              />
            </div>

            {simParams.unitPriceUSD != null ? (
              <div className="financial26-form-group">
                <label>Preço Unitário (USD / mês)</label>
                <input
                  type="number"
                  step="0.5"
                  className="financial26-input"
                  value={simParams.unitPriceUSD}
                  onChange={(e) => setSimParams(prev => ({ ...prev, unitPriceUSD: Number(e.target.value) }))}
                />
              </div>
            ) : (
              <div className="financial26-form-group">
                <label>Preço Unitário (BRL / mês)</label>
                <input
                  type="number"
                  step="1"
                  className="financial26-input"
                  value={simParams.unitPriceBRL || 0}
                  onChange={(e) => setSimParams(prev => ({ ...prev, unitPriceBRL: Number(e.target.value) }))}
                />
              </div>
            )}

            {simParams.unitPriceUSD != null && (
              <div className="financial26-form-group">
                <label>Taxa de Câmbio USD/BRL (Referência)</label>
                <input
                  type="number"
                  step="0.05"
                  className="financial26-input"
                  value={simParams.exchangeRateUSD || 5.75}
                  onChange={(e) => setSimParams(prev => ({ ...prev, exchangeRateUSD: Number(e.target.value) }))}
                />
              </div>
            )}

            <div className="financial26-form-group">
              <label>Despesas Fixas Mensais (Pró-labore + Adm + Marketing)</label>
              <input
                type="number"
                step="100"
                className="financial26-input"
                value={simParams.fixedOpexBRL || 14050}
                onChange={(e) => setSimParams(prev => ({ ...prev, fixedOpexBRL: Number(e.target.value) }))}
              />
            </div>

            <div className="financial26-form-group">
              <label>Investimento em Ativo / CAPEX IA Local (BRL)</label>
              <input
                type="number"
                step="1000"
                className="financial26-input"
                value={simParams.capexInvestmentBRL || 70000}
                onChange={(e) => setSimParams(prev => ({ ...prev, capexInvestmentBRL: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="financial26-sim-card">
            <h3 style={{ margin: "0 0 var(--a26-space-2) 0", color: "var(--a26-color-text-primary)" }}>
              Resultados da Simulação Econômica
            </h3>

            <div className="financial26-kpi-grid">
              <div className="financial26-kpi-card">
                <span className="financial26-kpi-label">MRR Simulado</span>
                <span className="financial26-kpi-value" style={{ color: "#f59e0b" }}>
                  {formatMoney(simulation.mrr)}
                </span>
                <span className="financial26-kpi-detail">Receita bruta mensal</span>
              </div>

              <div className="financial26-kpi-card">
                <span className="financial26-kpi-label">ARR Simulado</span>
                <span className="financial26-kpi-value" style={{ color: "#f59e0b" }}>
                  {formatMoney(simulation.arr)}
                </span>
                <span className="financial26-kpi-detail">12 meses normalizados</span>
              </div>

              <div className="financial26-kpi-card">
                <span className="financial26-kpi-label">Lucro Líquido Mensal</span>
                <span className="financial26-kpi-value" style={{ color: simulation.monthlyNetResult >= 0 ? "#10b981" : "#ef4444" }}>
                  {formatMoney(simulation.monthlyNetResult)}
                </span>
                <span className="financial26-kpi-detail">Após todas as deduções</span>
              </div>

              <div className="financial26-kpi-card">
                <span className="financial26-kpi-label">Alunos para Break-Even</span>
                <span className="financial26-kpi-value" style={{ color: "var(--a26-color-accent)" }}>
                  {simulation.breakEvenStudents != null ? `${simulation.breakEvenStudents} alunos` : "—"}
                </span>
                <span className="financial26-kpi-detail">Para zerar o custo fixo</span>
              </div>
            </div>

            <div className="financial26-notice-card" style={{ marginTop: "var(--a26-space-3)" }}>
              <strong>Isolamento de Simulação:</strong> Este simulador opera em memória com dados sintéticos e
              premissas de planejamento. As estimativas geradas aqui jamais afetam os registros contábeis
              nem o banco de dados oficial da plataforma.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
