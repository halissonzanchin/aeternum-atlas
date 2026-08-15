import React, { useState } from "react";
import LineIcon from "../../../components/icons/LineIcon";
import { A26Button } from "../../../components/aeternum-26";

const SPECIALTIES = [
  { id: "ortopedia", label: "Ortopedia & Traumatologia", icon: "activity", desc: "Fraturas, articulações, tendões e lesões de membros" },
  { id: "neurologia", label: "Neurologia & Neurocirurgia", icon: "spark", desc: "Plexos nervosos, nervos cranianos e SNC" },
  { id: "cirurgia", label: "Cirurgia Geral & Anatomia Topográfica", icon: "layers", desc: "Parede abdominal, triângulos anatômicos e vísceras" },
  { id: "cardiologia", label: "Cardiologia & Sistema Vascular", icon: "heart", desc: "Vascularização cardíaca, aorta e grandes vasos" },
  { id: "ginecologia", label: "Ginecologia & Anatomia Pélvica", icon: "compass", desc: "Pelve feminina, assoalho pélvico e retroperitônio" }
];

const DIFFICULTY_LEVELS = [
  { id: "basico", label: "Ciclo Básico (1º - 4º Semestre)", desc: "Identificação anatômica, marcos e relações diretas" },
  { id: "clinico", label: "Ciclo Clínico (5º - 8º Semestre)", desc: "Fisiopatologia, exames físicos e achados de imagem" },
  { id: "avancado", label: "Internato & Residência", desc: "Diagnóstico diferencial complexo e variações anatômicas" }
];

export default function SocraticClinicalCaseModal({
  isOpen,
  onClose,
  onStartCase,
  currentModelTitle = null
}) {
  const [specialty, setSpecialty] = useState("ortopedia");
  const [difficulty, setDifficulty] = useState("clinico");
  const [useCurrentModel, setUseCurrentModel] = useState(Boolean(currentModelTitle));

  if (!isOpen) return null;

  const handleGenerate = () => {
    const specObj = SPECIALTIES.find(s => s.id === specialty);
    const diffObj = DIFFICULTY_LEVELS.find(d => d.id === difficulty);

    let promptText = `Atue como um Preceptor Médico Socrático de Anatomia Humana. Gere 1 CASO CLÍNICO MÉDICO SOCRÁTICO focado em ${specObj.label} no nível "${diffObj.label}".\n\n`;

    if (useCurrentModel && currentModelTitle) {
      promptText += `O caso DEVE ser estritamente relacionado à estrutura anatômica do modelo 3D atual: "${currentModelTitle}".\n\n`;
    }

    promptText += `ESTRUTURA OBRIGATÓRIA DA SUA RESPOSTA EM FASE 1:\n` +
      `1. 👤 **HISTÓRIA CLÍNICA & HMA**: Apresente a idade, sexo, queixa principal, mecanismo do problema e achados do exame físico / imagem.\n` +
      `2. ❓ **PERGUNTA SOCRÁTICA DE DIAGNÓSTICO**: Faça 1 pergunta desafiadora para EU responder no chat antes de revelar a resposta. Pergunte qual estrutura anatômica (nervo, vaso, músculo, osso ou forame) está envolvida.\n` +
      `3. ⚠️ **IMPORTANTE**: NÃO DÊ A RESPOSTA OU GABARITO AINDA! Aguarde minha resposta no próximo turno para avaliar meu raciocínio e fornecer o gabarito comentado com referências do Latarjet/Gray's.`;

    onStartCase({
      prompt: promptText,
      specialtyLabel: specObj.label,
      difficultyLabel: diffObj.label
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blackDeep/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl p-6 bg-surfaceDark/95 border border-glassBorder rounded-2xl shadow-2xl backdrop-blur-xl text-clinicalWhite space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-glassBorder/40">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Simulador de Medicina Socrática</span>
            <h3 className="text-lg font-bold text-agedGold font-serif">Gerar Caso Clínico Interativo</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-textMuted hover:text-white hover:bg-white/10 transition-all"
          >
            <LineIcon name="close" className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4">
          {/* 1. Escolha da Especialidade */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-amber-300 font-semibold mb-2">
              1. Selecionar Especialidade Médica:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SPECIALTIES.map((spec) => (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => setSpecialty(spec.id)}
                  className={`p-3 text-left rounded-xl border text-xs transition-all ${
                    specialty === spec.id
                      ? "bg-amber-500/20 border-amber-400 text-white font-bold shadow-glowGold"
                      : "bg-blackDeep/40 border-glassBorder/40 text-textMuted hover:border-glassBorder hover:text-white"
                  }`}
                >
                  <div className="font-semibold text-clinicalWhite">{spec.label}</div>
                  <div className="text-[10px] text-textMuted mt-0.5">{spec.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Escolha da Dificuldade */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-amber-300 font-semibold mb-2">
              2. Nível de Complexidade Acadêmica:
            </label>
            <div className="space-y-2">
              {DIFFICULTY_LEVELS.map((diff) => (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => setDifficulty(diff.id)}
                  className={`w-full p-2.5 text-left rounded-xl border text-xs transition-all flex items-center justify-between ${
                    difficulty === diff.id
                      ? "bg-teal-500/20 border-teal-400 text-white font-bold shadow-glowTeal"
                      : "bg-blackDeep/40 border-glassBorder/40 text-textMuted hover:border-glassBorder hover:text-white"
                  }`}
                >
                  <div>
                    <span className="font-semibold text-clinicalWhite block">{diff.label}</span>
                    <span className="text-[10px] text-textMuted">{diff.desc}</span>
                  </div>
                  {difficulty === diff.id ? <span className="text-teal-300 text-sm font-bold">✓</span> : null}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Vínculo com Modelo 3D se disponível */}
          {currentModelTitle && (
            <div className="p-3 bg-teal-950/40 border border-teal-500/40 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-teal-300 block">Vincular ao Modelo 3D Atual</span>
                <span className="text-[11px] text-textMuted">{currentModelTitle}</span>
              </div>
              <input
                type="checkbox"
                checked={useCurrentModel}
                onChange={(e) => setUseCurrentModel(e.target.checked)}
                className="w-4 h-4 accent-teal-400 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-glassBorder/40">
          <A26Button variant="ghost" onClick={onClose}>
            Cancelar
          </A26Button>
          <A26Button variant="liquid" onClick={handleGenerate}>
            Iniciar Simulação de Caso Clínico
          </A26Button>
        </div>
      </div>
    </div>
  );
}
