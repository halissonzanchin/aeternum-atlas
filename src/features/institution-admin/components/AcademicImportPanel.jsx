import React, { useRef } from "react";
import Card from "../../../components/Card/Card";
import LineIcon from "../../../components/icons/LineIcon";
import { useAcademicImport } from "../hooks/useAcademicImport";
import { useAuth } from "../../../context/AuthContext";
import { downloadCsv } from "../../../services/export/csvExportService";
import AdminTitle from "./AdminTitle";

export default function AcademicImportPanel() {
  const { user } = useAuth();
  const institutionId = user?.institutionId || user?.institution_id;
  const {
    file,
    status,
    parsedData,
    importResult,
    error,
    handleFileUpload,
    confirmImport,
    reset
  } = useAcademicImport(institutionId);

  const fileInputRef = useRef(null);

  const onFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) handleFileUpload(selectedFile);
  };

  const downloadErrors = () => {
    if (!importResult?.errors || importResult.errors.length === 0) return;
    downloadCsv(`aeternum-import-errors-${new Date().toISOString().split('T')[0]}.csv`, importResult.errors);
  };

  return (
    <div className="fade-in-up">
      <AdminTitle title="Importar Alunos (CSV)" text="Realize o upload da sua matriz acadêmica para onboarding massivo." />

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <LineIcon name="alert-triangle" className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      )}

      {status === "idle" && (
        <Card className="premium-panel-card mt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-techTeal/10 text-techTeal">
              <LineIcon name="upload" className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-clinicalWhite">Selecione o arquivo CSV</h3>
            <p className="mb-6 max-w-md text-sm text-textMuted">
              O arquivo deve conter cabeçalhos obrigatórios: <strong>Nome, Email, Curso, Disciplina, Turma</strong>.
            </p>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={fileInputRef}
              onChange={onFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-techTeal px-6 py-2.5 text-sm font-bold text-premiumDark transition-colors hover:bg-teal-400"
            >
              Escolher Arquivo
            </button>
          </div>
        </Card>
      )}

      {status === "parsing" && (
        <div className="flex items-center justify-center py-20 text-textMuted">
          <LineIcon name="refresh" className="mr-3 h-5 w-5 animate-spin" />
          <span>Lendo e validando linhas do CSV...</span>
        </div>
      )}

      {status === "preview" && parsedData && (
        <div className="mt-6 flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-premiumDark p-4 shadow-sm ring-1 ring-white/5">
              <span className="text-sm text-textMuted">Total Linhas</span>
              <strong className="block text-2xl font-bold text-white">{parsedData.total}</strong>
            </div>
            <div className="rounded-xl bg-techTeal/10 p-4 shadow-sm ring-1 ring-techTeal/30">
              <span className="text-sm text-techTeal">Válidas</span>
              <strong className="block text-2xl font-bold text-techTeal">{parsedData.validRows.length}</strong>
            </div>
            <div className="rounded-xl bg-red-500/10 p-4 shadow-sm ring-1 ring-red-500/30">
              <span className="text-sm text-red-400">Com Erro</span>
              <strong className="block text-2xl font-bold text-red-400">{parsedData.invalidRows.length}</strong>
            </div>
            <div className="rounded-xl bg-orange-500/10 p-4 shadow-sm ring-1 ring-orange-500/30">
              <span className="text-sm text-orange-400">E-mails Duplicados</span>
              <strong className="block text-2xl font-bold text-orange-400">{parsedData.duplicates}</strong>
            </div>
          </div>

          <Card className="premium-panel-card">
            <h3 className="mb-4 font-bold text-clinicalWhite">Resumo da Estrutura Encontrada</h3>
            <div className="flex gap-6 text-sm text-textMuted">
              <span><strong>{parsedData.detectedCourses}</strong> Cursos</span>
              <span><strong>{parsedData.detectedSubjects}</strong> Disciplinas</span>
              <span><strong>{parsedData.detectedClasses}</strong> Turmas</span>
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <button onClick={reset} className="text-sm font-medium text-textMuted hover:text-white">
              Cancelar
            </button>
            <button
              onClick={confirmImport}
              disabled={parsedData.validRows.length === 0}
              className="flex items-center gap-2 rounded-lg bg-techTeal px-6 py-2.5 text-sm font-bold text-premiumDark transition-colors hover:bg-teal-400 disabled:opacity-50"
            >
              Confirmar Importação
            </button>
          </div>
        </div>
      )}

      {status === "importing" && (
        <div className="flex flex-col items-center justify-center py-20 text-textMuted">
          <LineIcon name="refresh" className="mb-4 h-10 w-10 animate-spin text-techTeal" />
          <strong className="text-white">Criando infraestrutura e vinculando alunos...</strong>
          <span className="text-sm">Isso pode levar alguns segundos dependendo do tamanho da planilha.</span>
        </div>
      )}

      {status === "done" && importResult && (
        <div className="mt-6 flex flex-col gap-6">
          <Card className="premium-panel-card">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-clinicalWhite">Relatório de Importação</h3>
              <button onClick={reset} className="text-sm text-techTeal hover:underline">Importar outro arquivo</button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
               <div className="rounded-xl bg-premiumDark p-4 ring-1 ring-white/5">
                 <small className="text-textMuted">Linhas Processadas</small>
                 <strong className="block text-2xl text-white">{importResult.processed}</strong>
               </div>
               <div className="rounded-xl bg-premiumDark p-4 ring-1 ring-white/5">
                 <small className="text-textMuted">Alunos Vinculados (Sucesso)</small>
                 <strong className="block text-2xl text-techTeal">{importResult.linksCreated}</strong>
               </div>
               <div className="rounded-xl bg-premiumDark p-4 ring-1 ring-white/5">
                 <small className="text-textMuted">Vínculos Já Existentes (Ignorados)</small>
                 <strong className="block text-2xl text-white">{importResult.linksIgnored}</strong>
               </div>
               <div className="rounded-xl bg-red-500/10 p-4 ring-1 ring-red-500/30">
                 <small className="text-red-400">Falhas / Não Cadastrados</small>
                 <strong className="block text-2xl text-red-400">{importResult.errors.length}</strong>
               </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-red-500/10 p-4">
                <span className="text-sm text-red-400">Houve falhas em alguns alunos (não possuem cadastro prévio).</span>
                <button
                  onClick={downloadErrors}
                  className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30"
                >
                  <LineIcon name="download" className="h-4 w-4" /> Baixar Relatório de Erros
                </button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
