import React, { useState } from "react";
import { createPortal } from "react-dom";
import LineIcon from "../../../components/icons/LineIcon";
import { A26Button } from "../../../components/aeternum-26";
import { useLanguage } from "../../../context/LanguageContext";
import "./SocraticClinicalCaseModal.css";

const SPECIALTY_KEYS = ["ortopedia", "neurologia", "cirurgia", "cardiologia", "ginecologia"];
const DIFFICULTY_KEYS = ["basico", "clinico", "avancado"];

export default function SocraticClinicalCaseModal({
  isOpen,
  onClose,
  onStartCase,
  currentModelTitle = null
}) {
  const { t } = useLanguage();
  const [specialty, setSpecialty] = useState("ortopedia");
  const [difficulty, setDifficulty] = useState("clinico");
  const [useCurrentModel, setUseCurrentModel] = useState(Boolean(currentModelTitle));

  if (!isOpen || typeof document === "undefined") return null;

  const handleGenerate = () => {
    const specLabel = t(`socraticModal.specialties.${specialty}.label`);
    const diffLabel = t(`socraticModal.difficulties.${difficulty}.label`);

    let promptText = `Atue como um Preceptor Médico Socrático de Anatomia Humana. Gere 1 CASO CLÍNICO MÉDICO SOCRÁTICO focado em ${specLabel} no nível "${diffLabel}".\n\n`;

    if (useCurrentModel && currentModelTitle) {
      promptText += `O caso DEVE ser estritamente relacionado à estrutura anatômica do modelo 3D atual: "${currentModelTitle}".\n\n`;
    }

    promptText += `ESTRUTURA OBRIGATÓRIA DA SUA RESPOSTA EM FASE 1:\n` +
      `1. 👤 **HISTÓRIA CLÍNICA & HMA**: Apresente a idade, sexo, queixa principal, mecanismo do problema e achados do exame físico / imagem.\n` +
      `2. ❓ **PERGUNTA SOCRÁTICA DE DIAGNÓSTICO**: Faça 1 pergunta desafiadora para EU responder no chat antes de revelar a resposta. Pergunte qual estrutura anatômica (nervo, vaso, músculo, osso ou forame) está envolvida.\n` +
      `3. ⚠️ **IMPORTANTE**: NÃO DÊ A RESPOSTA OU GABARITO AINDA! Aguarde minha resposta no próximo turno para avaliar meu raciocínio e fornecer o gabarito comentado com referências do Latarjet/Gray's.`;

    onStartCase({
      prompt: promptText,
      specialtyLabel: specLabel,
      difficultyLabel: diffLabel
    });
    onClose();
  };

  return createPortal(
    <div className="a26-socratic-modal-backdrop" onClick={onClose}>
      <div className="a26-socratic-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="a26-socratic-modal-header">
          <div>
            <span className="a26-socratic-modal-kicker">{t("socraticModal.kicker")}</span>
            <h3 className="a26-socratic-modal-title">{t("socraticModal.title")}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("actions.close")}
            style={{ background: 'transparent', border: 0, color: '#94a3b8', cursor: 'pointer' }}
          >
            <LineIcon name="close" className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 1. Escolha da Especialidade */}
          <div>
            <span className="a26-socratic-section-title">{t("socraticModal.selectSpecialty")}</span>
            <div className="a26-socratic-grid">
              {SPECIALTY_KEYS.map((specKey) => (
                <button
                  key={specKey}
                  type="button"
                  onClick={() => setSpecialty(specKey)}
                  className={`a26-socratic-choice-btn ${specialty === specKey ? "is-selected" : ""}`}
                >
                  <div className="a26-socratic-choice-title">{t(`socraticModal.specialties.${specKey}.label`)}</div>
                  <div className="a26-socratic-choice-desc">{t(`socraticModal.specialties.${specKey}.desc`)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Escolha da Dificuldade */}
          <div>
            <span className="a26-socratic-section-title">{t("socraticModal.selectDifficulty")}</span>
            <div className="a26-socratic-diff-stack">
              {DIFFICULTY_KEYS.map((diffKey) => (
                <button
                  key={diffKey}
                  type="button"
                  onClick={() => setDifficulty(diffKey)}
                  className={`a26-socratic-diff-btn ${difficulty === diffKey ? "is-selected" : ""}`}
                >
                  <div>
                    <span className="a26-socratic-choice-title">{t(`socraticModal.difficulties.${diffKey}.label`)}</span>
                    <span className="a26-socratic-choice-desc" style={{ display: 'block' }}>
                      {t(`socraticModal.difficulties.${diffKey}.desc`)}
                    </span>
                  </div>
                  {difficulty === diffKey ? <span style={{ color: '#5ce8df', fontWeight: 'bold' }}>✓</span> : null}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Vínculo com Modelo 3D se disponível */}
          {currentModelTitle && (
            <div className="a26-socratic-link-card">
              <div>
                <span style={{ fontWeight: 'bold', display: 'block' }}>{t("socraticModal.linkModel")}</span>
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
            {t("socraticModal.cancel")}
          </A26Button>
          <A26Button variant="liquid" onClick={handleGenerate}>
            {t("socraticModal.start")}
          </A26Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
