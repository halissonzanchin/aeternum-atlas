import React, { useState } from "react";
import { createPortal } from "react-dom";
import LineIcon from "../../../components/icons/LineIcon";
import { A26Button } from "../../../components/aeternum-26";
import "./SocraticClinicalCaseModal.css";

const SPECIALTIES = [
  { id: "ortopedia", label: "Ortopedia & Traumatologia", desc: "Fraturas, articulações, tendões e lesões de membros" },
  { id: "neurologia", label: "Neurologia & Neurocirurgia", desc: "Plexos nervosos, nervos cranianos e SNC" },
  { id: "cirurgia", label: "Cirurgia Geral & Anatomia Topográfica", desc: "Parede abdominal, triângulos anatômicos e vísceras" },
  { id: "cardiologia", label: "Cardiologia & Sistema Vascular", desc: "Vascularização cardíaca, aorta e grandes vasos" },
  { id: "ginecologia", label: "Ginecologia & Anatomia Pélvica", desc: "Pelve feminina, assoalho pélvico e retroperitônio" }
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

  if (!isOpen || typeof document === "undefined") return null;

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

  return createPortal(
    <div className="a26-socratic-modal-backdrop" onClick={onClose}>
      <div className="a26-socratic-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="a26-socratic-modal-header">
          <div>
            <span className="a26-socratic-modal-kicker">Simulador de Medicina Socrática</span>
            <h3 className="a26-socratic-modal-title">Gerar Caso Clínico Interativo</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 0, color: '#94a3b8', cursor: 'pointer' }}
          >
            <LineIcon name="close" className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 1. Escolha da Especialidade */}
          <div>
            <span className="a26-socratic-section-title">1. Selecionar Especialidade Médica:</span>
            <div className="a26-socratic-grid">
              {SPECIALTIES.map((spec) => (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => setSpecialty(spec.id)}
                  className={`a26-socratic-choice-btn ${specialty === spec.id ? "is-selected" : ""}`}
                >
                  <div className="a26-socratic-choice-title">{spec.label}</div>
                  <div className="a26-socratic-choice-desc">{spec.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Escolha da Dificuldade */}
          <div>
            <span className="a26-socratic-section-title">2. Nível de Complexidade Acadêmica:</span>
            <div className="a26-socratic-diff-stack">
              {DIFFICULTY_LEVELS.map((diff) => (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => setDifficulty(diff.id)}
                  className={`a26-socratic-diff-btn ${difficulty === diff.id ? "is-selected" : ""}`}
                >
                  <div>
                    <span className="a26-socratic-choice-title">{diff.label}</span>
                    <span className="a26-socratic-choice-desc" style={{ display: 'block' }}>{diff.desc}</span>
                  </div>
                  {difficulty === diff.id ? <span style={{ color: '#5ce8df', fontWeight: 'bold' }}>✓</span> : null}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Vínculo com Modelo 3D se disponível */}
          {currentModelTitle && (
            <div className="a26-socratic-link-card">
              <div>
                <span style={{ fontWeight: 'bold', display: 'block' }}>Vincular ao Modelo 3D Atual</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{currentModelTitle}</span>
              </div>
              <input
                type="checkbox"
                checked={useCurrentModel}
                onChange={(e) => setUseCurrentModel(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="a26-socratic-footer">
          <A26Button variant="ghost" onClick={onClose}>
            Cancelar
          </A26Button>
          <A26Button variant="liquid" onClick={handleGenerate}>
            Iniciar Simulação de Caso Clínico
          </A26Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
