/* eslint-disable no-unused-vars -- identificadores usados no escopo JSX */
import { useEffect, useMemo, useState } from "react";
import {
  A26Button,
  A26Card,
  A26Field,
  A26LoadingState,
  A26Metric,
  A26Modal,
  A26Toolbar
} from "../../../components/aeternum-26";
import LineIcon from "../../../components/icons/LineIcon";
import {
  exportBetaApplicationsCsv,
  fetchAllBetaApplicationsForExport,
  getBetaCapacitySummary,
  listBetaApplications,
  reviewBetaApplication
} from "../../../services/beta/betaRegistrationService";

const STATUS_LABELS = {
  all: "Todos",
  pending: "Pendentes",
  under_review: "Em Análise",
  approved: "Aprovados",
  waitlisted: "Lista de Espera",
  invited: "Convidados",
  activated: "Ativados",
  rejected: "Rejeitados"
};

const STATUS_BADGES = {
  pending: { label: "Pendente", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  under_review: { label: "Em Análise", color: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
  approved: { label: "Aprovado", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  waitlisted: { label: "Lista de Espera", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  invited: { label: "Convidado", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  activated: { label: "Ativado", color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
  rejected: { label: "Rejeitado", color: "bg-red-500/20 text-red-300 border-red-500/30" }
};

export default function BetaCandidatesManagementSection() {
  const [applications, setApplications] = useState([]);
  const [capacity, setCapacity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSynthetic, setShowSynthetic] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState("approved");
  const [reviewBatch, setReviewBatch] = useState("batch_1_30");
  const [reviewNotes, setReviewNotes] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Paginação Funcional (EL-DORADO-R1-04)
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [totalCount, setTotalCount] = useState(0);

  async function loadData() {
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      const [listRes, capRes] = await Promise.all([
        listBetaApplications({
          status: statusFilter,
          search: searchTerm,
          limit: pageSize,
          offset,
          includeSynthetic: showSynthetic
        }),
        getBetaCapacitySummary()
      ]);

      if (listRes.success) {
        setApplications(listRes.data || []);
        setTotalCount(listRes.count || 0);
      }
      if (capRes.success) setCapacity(capRes.summary);
    } catch (err) {
      console.error("Erro ao carregar dados do programa beta:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [page, statusFilter, showSynthetic]);

  function handleFilterChange(newFilter) {
    setStatusFilter(newFilter);
    setPage(1);
  }

  function handleToggleSynthetic() {
    setShowSynthetic(prev => !prev);
    setPage(1);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    loadData();
  }

  function openReview(app) {
    setSelectedApp(app);
    setReviewStatus(app.status === "pending" ? "approved" : app.status);
    setReviewBatch(app.batch || "batch_1_30");
    setReviewNotes(app.review_notes || "");
    setReviewModalOpen(true);
    setFeedbackMessage("");
  }

  async function handleSaveReview() {
    if (!selectedApp) return;
    setSavingReview(true);
    try {
      const res = await reviewBetaApplication(
        selectedApp.id,
        reviewStatus,
        reviewNotes,
        reviewBatch
      );

      if (res.success) {
        setFeedbackMessage("Avaliação salva com sucesso!");
        setTimeout(() => {
          setReviewModalOpen(false);
          loadData();
        }, 800);
      } else {
        setFeedbackMessage(res.message || "Falha ao registrar avaliação.");
      }
    } catch (err) {
      setFeedbackMessage(err.message || "Erro inesperado.");
    } finally {
      setSavingReview(false);
    }
  }

  async function handleExportCsv() {
    setExporting(true);
    setExportError(null);
    try {
      const fullList = await fetchAllBetaApplicationsForExport({
        status: statusFilter,
        search: searchTerm,
        includeSynthetic: showSynthetic
      });

      if (!fullList || fullList.length === 0) {
        setExportError("Nenhum registro encontrado para exportação com os filtros atuais.");
        return;
      }

      const exported = exportBetaApplicationsCsv(fullList, { excludeSynthetic: !showSynthetic });
      if (!exported) {
        setExportError("Não foi possível gerar o arquivo CSV com os registros obtidos.");
      }
    } catch (err) {
      console.error("Erro ao exportar candidaturas completas:", err);
      // EL-DORADO-R1-04: Proibição estrita de exportação parcial silenciosa
      setExportError("Falha na exportação integral dos dados. A exportação parcial da tela foi bloqueada por conformidade executiva.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="space-y-6" data-testid="a26-beta-candidates-section">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow" style={{ color: "#38bdf8" }}>OPERAÇÃO EL DORADO</span>
          <h2 className="text-2xl font-bold tracking-tight text-text">Gestão do Programa de Teste Beta</h2>
          <p className="text-sm text-textMuted mt-1">
            Triagem, avaliação acadêmica e controle de capacidade dos candidatos (Meta: 30 estudantes na 1ª turma).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <A26Button
            variant="secondary"
            onClick={handleToggleSynthetic}
            icon={<LineIcon name={showSynthetic ? "eyeOff" : "eye"} />}
          >
            {showSynthetic ? "Ocultar Auditoria" : "Registros de Auditoria"}
          </A26Button>
          <A26Button
            variant="secondary"
            onClick={handleExportCsv}
            icon={<LineIcon name="download" />}
            loading={exporting}
            disabled={applications.length === 0 && !exporting}
          >
            Exportar para Excel (CSV)
          </A26Button>
          <A26Button variant="liquid" onClick={loadData} icon={<LineIcon name="refresh" />}>
            Atualizar Lista
          </A26Button>
        </div>
      </div>

      {/* Métricas de Capacidade e Lotes (7 Indicadores Canônicos) */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <A26Metric
            label="Total de Candidaturas"
            value={capacity?.isUnavailable || capacity?.total == null ? "—" : capacity.total}
            icon={<LineIcon name="layers" />}
          />
          <A26Metric
            label="Candidaturas Pendentes"
            value={capacity?.isUnavailable || capacity?.pending == null ? "—" : capacity.pending}
            icon={<LineIcon name="clipboardCheck" />}
          />
          <A26Metric
            label="Em Análise"
            value={capacity?.isUnavailable || capacity?.under_review == null ? "—" : capacity.under_review}
            icon={<LineIcon name="eye" />}
          />
          <A26Metric
            label="Vagas Aprovadas (1ª Turma)"
            value={capacity?.isUnavailable || capacity?.batch1Approved == null ? "—" : `${capacity.batch1Approved} / 30`}
            trend={
              capacity?.isUnavailable || capacity?.batch1Approved == null
                ? "Capacidade não verificada"
                : capacity.batch1Approved >= 30
                  ? "Capacidade Esgotada"
                  : `${capacity.batch1Remaining ?? 30} vagas restantes`
            }
            icon={<LineIcon name="target" />}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <A26Metric
            label="Lista de Espera"
            value={capacity?.isUnavailable || capacity?.waitlisted == null ? "—" : capacity.waitlisted}
            icon={<LineIcon name="clock" />}
          />
          <A26Metric
            label="Convites Enviados"
            value={capacity?.isUnavailable || capacity?.invited == null ? "—" : capacity.invited}
            icon={<LineIcon name="send" />}
          />
          <A26Metric
            label="Contas Ativadas"
            value={capacity?.isUnavailable || capacity?.activated == null ? "—" : capacity.activated}
            trend="Provisionamento formal"
            icon={<LineIcon name="user" />}
          />
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <A26Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-textMuted uppercase tracking-wider">Status:</span>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleFilterChange(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === key
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white/5 text-textMuted hover:bg-white/10 hover:text-text"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar por nome, email ou universidade..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-text placeholder-textMuted focus:outline-none focus:border-primary w-full sm:w-64"
            />
            <A26Button variant="primary" type="submit">
              Buscar
            </A26Button>
          </div>
        </form>
      </A26Card>

      {/* Alerta de Erro na Exportação (EL-DORADO-R1-04) */}
      {exportError && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-200 flex items-center justify-between shadow-lg" role="alert">
          <div className="flex items-center gap-2">
            <span className="font-bold text-red-400">⚠️ Erro na Exportação:</span>
            <span>{exportError}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportError(null)}
            className="text-red-300 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-xs font-semibold"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Tabela de Candidatos */}
      <A26Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <A26LoadingState message="Carregando candidaturas do Programa Beta..." />
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-textMuted">
            <p className="text-base font-semibold">Nenhuma candidatura encontrada</p>
            <p className="text-xs mt-1">Ajuste os filtros ou aguarde novas inscrições de estudantes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/10 text-textMuted uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Candidato</th>
                  <th className="py-3 px-4">Instituição / Curso</th>
                  <th className="py-3 px-4">Turma / Matrícula</th>
                  <th className="py-3 px-4">Dispositivo</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Lote</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {applications.map(app => {
                  const badge = STATUS_BADGES[app.status] || STATUS_BADGES.pending;
                  return (
                    <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-text">{app.full_name}</div>
                        <div className="text-[11px] text-textMuted">{app.email}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-mono text-[10px] font-semibold text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                            {app.protocol_number || "BETA-2026-N/A"}
                          </span>
                          <span className="text-[10px] text-textMuted/70">
                            {new Date(app.created_at).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-text">{app.institution_name}</div>
                        <div className="text-[11px] text-textMuted">{app.course} · {app.academic_term}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-text">{app.student_group || "—"}</div>
                        <div className="text-[11px] text-textMuted">{app.student_id_number || "Sem matrícula"}</div>
                      </td>
                      <td className="py-3 px-4 text-textMuted">
                        {app.primary_device}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          app.batch === "synthetic_test"
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                            : badge.color
                        }`}>
                          {app.batch === "synthetic_test" ? "Auditoria Sintética" : badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-textMuted font-mono text-[11px]">
                        {app.batch === "batch_1_30" ? "1ª Turma (30)" : app.batch === "synthetic_test" ? "Isolado (Auditoria)" : app.batch}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <A26Button variant="secondary" onClick={() => openReview(app)}>
                          Avaliar
                        </A26Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação Funcional (EL-DORADO-R1-04) */}
        {!loading && totalCount > 0 && (
          <div className="p-3.5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-textMuted bg-white/[0.01]">
            <div>
              Mostrando <span className="text-text font-semibold">{(page - 1) * pageSize + 1}</span> a{" "}
              <span className="text-text font-semibold">{Math.min(totalCount, page * pageSize)}</span> de{" "}
              <span className="text-text font-semibold">{totalCount}</span> candidaturas autorizadas
            </div>
            <div className="flex items-center gap-2">
              <A26Button
                variant="secondary"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Página Anterior
              </A26Button>
              <span className="px-2 text-xs font-medium text-text">
                Página {page} de {Math.max(1, Math.ceil(totalCount / pageSize))}
              </span>
              <A26Button
                variant="secondary"
                onClick={() => setPage(p => Math.min(Math.max(1, Math.ceil(totalCount / pageSize)), p + 1))}
                disabled={page >= Math.ceil(totalCount / pageSize)}
              >
                Próxima Página
              </A26Button>
            </div>
          </div>
        )}
      </A26Card>

      {/* Modal de Avaliação Administrativa */}
      {reviewModalOpen && selectedApp && (
        <A26Modal
          open={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title={`Avaliação: ${selectedApp.full_name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-textMuted block">Número de Protocolo:</span>
                  <span className="text-cyan-300 font-mono font-bold text-xs">{selectedApp.protocol_number || "BETA-2026-N/A"}</span>
                </div>
                <div>
                  <span className="text-textMuted block">E-mail:</span>
                  <span className="text-text font-medium">{selectedApp.email}</span>
                </div>
                <div>
                  <span className="text-textMuted block">Instituição:</span>
                  <span className="text-text font-medium">{selectedApp.institution_name}</span>
                </div>
                <div>
                  <span className="text-textMuted block">Curso / Termo:</span>
                  <span className="text-text font-medium">{selectedApp.course} ({selectedApp.academic_term})</span>
                </div>
                <div>
                  <span className="text-textMuted block">Dispositivo:</span>
                  <span className="text-text font-medium">{selectedApp.primary_device}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-white/5">
                <span className="text-textMuted block font-semibold mb-1">Motivação Declarada:</span>
                <p className="text-text/90 italic bg-black/20 p-2 rounded leading-relaxed">
                  "{selectedApp.motivation}"
                </p>
              </div>
            </div>

            {/* Seleção de Status */}
            <div>
              <label className="text-xs font-semibold text-text block mb-1">Novo Status da Candidatura:</label>
              <select
                value={reviewStatus}
                onChange={e => setReviewStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-text focus:outline-none focus:border-primary"
              >
                <option value="pending">Pendente (pending)</option>
                <option value="under_review">Em Análise (under_review)</option>
                <option value="approved">Aprovado (approved)</option>
                <option value="waitlisted">Lista de Espera (waitlisted)</option>
                <option value="invited" disabled>Convidado Oficial (Bloqueado no Pré-Lançamento · Gate E7.3)</option>
                <option value="activated" disabled>Ativado Oficial (Requer Provisionamento Homologado · Gate E7.3)</option>
                <option value="rejected">Rejeitado (rejected)</option>
              </select>
            </div>

            {/* Lote */}
            <div>
              <label className="text-xs font-semibold text-text block mb-1">Lote de Capacidade:</label>
              <select
                value={reviewBatch}
                onChange={e => setReviewBatch(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-text focus:outline-none focus:border-primary"
              >
                <option value="batch_1_30">Primeira Turma (30 Vagas - Dezembro 2026)</option>
                <option value="batch_2_50">Segunda Etapa (Até 50 Participantes)</option>
                <option value="batch_3_100">Expansão Experimental (Até 100 Participantes)</option>
              </select>
            </div>

            {/* Parecer / Notas de Avaliação */}
            <div>
              <label className="text-xs font-semibold text-text block mb-1">Parecer Administrativo / Notas:</label>
              <textarea
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                rows={3}
                placeholder="Insira observações acadêmicas sobre o perfil do estudante..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-text placeholder-textMuted focus:outline-none focus:border-primary"
              />
            </div>

            {/* Aviso de Segurança */}
            <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
              ⚠️ <strong>Diretriz de Segurança:</strong> A aprovação altera o status da candidatura no banco de dados, mas <u>não cria sessão de usuário nem credenciais de acesso automaticamente</u>. O provisionamento e envio de convites ocorrerá em momento autorizado.
            </div>

            {feedbackMessage && (
              <p className="text-xs font-semibold text-emerald-400">{feedbackMessage}</p>
            )}

            {/* Botões do Modal */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <A26Button variant="liquid" onClick={() => setReviewModalOpen(false)}>
                Cancelar
              </A26Button>
              <A26Button variant="primary" loading={savingReview} onClick={handleSaveReview}>
                Salvar Avaliação
              </A26Button>
            </div>
          </div>
        </A26Modal>
      )}
    </section>
  );
}
