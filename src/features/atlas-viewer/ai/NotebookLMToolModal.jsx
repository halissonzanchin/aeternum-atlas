import React, { useState } from "react";
import LineIcon from "../../../components/icons/LineIcon";

export default function NotebookLMToolModal({
  toolType = "report",
  currentStructure = "Modelo Anatômico",
  onClose,
  onGenerate
}) {
  const [source, setSource] = useState("model");
  const [customSourceText, setCustomSourceText] = useState("");
  const [reportFormat, setReportFormat] = useState("study_guide");
  const [questionCount, setQuestionCount] = useState("5");
  const [difficulty, setDifficulty] = useState("medium");
  const [customTopic, setCustomTopic] = useState("");

  const toolTitles = {
    report: "📝 Criar Relatório & Guia de Estudo",
    quiz: "🧪 Teste Personalizado (Simulado)",
    mindmap: "🌳 Mapa Mental Anatômico"
  };

  const handleGenerate = () => {
    let sourceLabel = "";
    if (source === "model") sourceLabel = `Modelo 3D (${currentStructure})`;
    else if (source === "book") sourceLabel = `Capítulo/Livro: "${customSourceText || 'Literatura Anatômica'}"`;
    else if (source === "notes") sourceLabel = "Minhas Anotações & Fichas";
    else sourceLabel = "Visão Geral da Plataforma";

    let prompt = "";

    if (toolType === "report") {
      const formatNames = {
        study_guide: "Guia de Estudo (Perguntas sugeridas + Termos-chave)",
        summary_doc: "Documento de Resumo Geral com Citações",
        clinical_card: "Ficha Clínica & Correlações Cirúrgicas",
        custom: "Relatório Livre Personalizado"
      };
      prompt = `Crie um Relatório no formato "${formatNames[reportFormat]}" utilizando a fonte "${sourceLabel}". ${
        customTopic ? `Foque especificamente no tema: "${customTopic}".` : ""
      }`;
    } else if (toolType === "quiz") {
      const diffNames = { easy: "Fácil (Identificação básica)", medium: "Médio (Topografia descritiva)", hard: "Difícil (Casos clínicos)" };
      prompt = `Crie um Teste Personalizado com ${questionCount} perguntas no nível "${diffNames[difficulty]}" utilizando a fonte "${sourceLabel}". ${
        customTopic ? `Tema específico: "${customTopic}".` : ""
      } Inclua o gabarito comentado ao final.`;
    } else {
      prompt = `Gere um Mapa Mental Anatômico em diagrama Mermaid hierárquico sob a fonte "${sourceLabel}". ${
        customTopic ? `Tópico focal: "${customTopic}".` : ""
      }`;
    }

    onGenerate(prompt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blackDeep/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl p-6 bg-surfaceDark/95 border border-glassBorder rounded-2xl shadow-2xl backdrop-blur-xl text-clinicalWhite">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-glassBorder/40">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-amber-300 font-serif">
              {toolTitles[toolType] || "Ferramenta NotebookLM"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-textMuted hover:text-clinicalWhite hover:bg-white/10 transition-all"
          >
            <LineIcon name="close" className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 space-y-4">
          {/* Seleção de Fonte */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-textMuted mb-2">
              1. Selecionar Fonte de Conteúdo:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSource("model")}
                className={`p-3 text-left rounded-xl border text-xs transition-all ${
                  source === "model"
                    ? "bg-amber-500/20 border-amber-400 text-clinicalWhite font-bold shadow-md"
                    : "bg-blackDeep/40 border-glassBorder/40 text-textMuted hover:border-glassBorder"
                }`}
              >
                🧊 Modelo 3D Atual
                <span className="block text-[10px] text-textMuted/80 font-normal mt-0.5 truncate">
                  {currentStructure}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSource("book")}
                className={`p-3 text-left rounded-xl border text-xs transition-all ${
                  source === "book"
                    ? "bg-amber-500/20 border-amber-400 text-clinicalWhite font-bold shadow-md"
                    : "bg-blackDeep/40 border-glassBorder/40 text-textMuted hover:border-glassBorder"
                }`}
              >
                📚 Livro / Capítulo
                <span className="block text-[10px] text-textMuted/80 font-normal mt-0.5">
                  Especificar obra ou texto
                </span>
              </button>
            </div>
          </div>

          {/* Campo de Capítulo/Livro livre se selecionado */}
          {source === "book" && (
            <div>
              <label className="block text-xs text-textMuted mb-1">
                Nome do Livro, Capítulo ou Texto:
              </label>
              <input
                type="text"
                value={customSourceText}
                onChange={(e) => setCustomSourceText(e.target.value)}
                placeholder="Ex: Gray's Anatomia - Capítulo 4 (Coluna Vertebral)"
                className="w-full px-3 py-2 bg-blackDeep/60 border border-glassBorder rounded-xl text-xs text-clinicalWhite focus:border-amber-400 focus:outline-none"
              />
            </div>
          )}

          {/* Opções específicas para Relatório */}
          {toolType === "report" && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-textMuted mb-2">
                2. Formato do Relatório:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "study_guide", title: "Guia de Estudo", desc: "Perguntas sugeridas + termos-chave" },
                  { id: "summary_doc", title: "Documento Resumo", desc: "Visão geral com citações" },
                  { id: "clinical_card", title: "Ficha Clínica", desc: "Correlações médico-cirúrgicas" },
                  { id: "custom", title: "Crie do Zero", desc: "Relatório personalizado" }
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setReportFormat(fmt.id)}
                    className={`p-3 text-left rounded-xl border text-xs transition-all ${
                      reportFormat === fmt.id
                        ? "bg-amber-500/20 border-amber-400 text-clinicalWhite font-bold"
                        : "bg-blackDeep/40 border-glassBorder/40 text-textMuted hover:border-glassBorder"
                    }`}
                  >
                    {fmt.title}
                    <span className="block text-[10px] text-textMuted/80 font-normal mt-0.5">
                      {fmt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Opções específicas para Quiz */}
          {toolType === "quiz" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-textMuted mb-1">Nº de Questões:</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className="w-full px-3 py-2 bg-blackDeep/60 border border-glassBorder rounded-xl text-xs text-clinicalWhite focus:border-amber-400 focus:outline-none"
                >
                  <option value="3">3 Questões (Rápido)</option>
                  <option value="5">5 Questões (Padrão)</option>
                  <option value="10">10 Questões (Aprofundado)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-textMuted mb-1">Dificuldade:</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 bg-blackDeep/60 border border-glassBorder rounded-xl text-xs text-clinicalWhite focus:border-amber-400 focus:outline-none"
                >
                  <option value="easy">Fácil (Conceitos)</option>
                  <option value="medium">Médio (Topografia)</option>
                  <option value="hard">Difícil (Casos Clínicos)</option>
                </select>
              </div>
            </div>
          )}

          {/* Tema Específico Opcional */}
          <div>
            <label className="block text-xs text-textMuted mb-1">
              Tópico Específico (Opcional):
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Ex: Vascularização, limites anatômicos, inervação..."
              className="w-full px-3 py-2 bg-blackDeep/60 border border-glassBorder rounded-xl text-xs text-clinicalWhite focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-glassBorder/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surfaceDark border border-glassBorder/40 rounded-xl text-xs text-textMuted hover:text-clinicalWhite transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-400/80 rounded-xl text-xs font-bold text-blackDeep shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
          >
            ✨ Gerar Conteúdo
          </button>
        </div>
      </div>
    </div>
  );
}
