import { useEffect, useRef } from "react";
import LineIcon from "../icons/LineIcon";
import {
  A26Button,
  A26Card,
  A26Field,
  A26SegmentedControl,
  A26Surface
} from "../aeternum-26";

const COPY_BY_LANG = {
  pt: {
    initialKicker: "Configurador Acadêmico · Aeternum 26.4",
    initialTitle: "Configurar Baralho de Estudo",
    initialSubtitle: "Selecione o tema anatômico, defina o volume e escolha entre síntese via Qwen 3.5 4B ou acervo editorial curado.",
    adjustTitle: "Ajustar Parâmetros do Baralho",
    adjustSubtitle: "Edite os parâmetros abaixo e confirme para aplicar sem deslocar o cartão.",
    serviceCuratedReady: "Banco Curado Disponível",
    serviceAiOnline: "Tutor IA Online (Qwen 3.5 4B)",
    serviceAiBusy: "Tutor IA em Processamento (Qwen 3.5 4B)",
    serviceAiOffline: "Tutor IA Offline · Acervo Curado Ativo",
    topicPromptLabel: "Tema Anatômico de Estudo",
    topicFieldLabel: "Estrutura, região ou sistema anatômico",
    topicPlaceholder: "Ex: Clavícula e Ombro, Plexo Braquial, Ramificações da Artéria Maxilar...",
    suggestionsLabel: "Temas sugeridos (clique para selecionar):",
    cardCountLabel: "Quantidade de Cartões",
    fewCards: "Até 5",
    standardCards: "Até 10",
    manyCards: "Até 20",
    difficultyLabel: "Nível de Dificuldade",
    defaultDifficultyHint: "Padrão: Médio",
    easy: "Fácil",
    medium: "Médio",
    hard: "Difícil",
    generateAiBtn: "Gerar com Tutor IA",
    generatingAiBtn: "Gerando com Qwen 3.5 4B...",
    useCuratedBtn: "Usar Banco Curado",
    applyAiBtn: "Aplicar com Tutor IA",
    applyCuratedBtn: "Aplicar Banco Curado",
    cancelGenerationBtn: "Cancelar Geração",
    closeBtn: "Fechar",
    retryBtn: "Tentar Novamente",
    destructiveWarning: "Confirmar novos parâmetros substituirá o baralho atual somente após a conclusão. Se a geração falhar ou for cancelada, seu baralho e progresso SM-2 atuais serão preservados.",
    operationalBannerTitle: "Disponibilidade do Serviço de Inferência Local",
    savedDecksKicker: "Coleção Pessoal",
    savedDecksTitle: "Baralhos Salvos",
    deleteDeckTitle: "Excluir baralho da coleção",
    stages: {
      preparing_evidence: "Preparando evidências anatômicas no acervo soberano...",
      generating_batch: (b, t) => `Gerando cartões com Qwen 3.5 4B (Lote ${b} de ${t})...`,
      validating_content: "Validando rigor anatômico e deduplicando cartões...",
      batch_completed: (c, r) => `${c} de até ${r} cartões validados — preparando próximo lote...`,
      partial_complete: (c, r) => `Geração parcial concluída: ${c} de até ${r} cartões validados.`,
      completed: (c) => `Concluído: ${c} cartões anatômicos validados.`
    }
  },
  es: {
    initialKicker: "Configurador Académico · Aeternum 26.4",
    initialTitle: "Configurar Baraja de Estudio",
    initialSubtitle: "Selecciona el tema anatómico, define la cantidad y elige entre síntesis con Qwen 3.5 4B o banco curado.",
    adjustTitle: "Ajustar Parámetros de la Baraja",
    adjustSubtitle: "Edita los parámetros y confirma para aplicar sin desplazar la tarjeta.",
    serviceCuratedReady: "Banco Curado Disponible",
    serviceAiOnline: "Tutor IA Online (Qwen 3.5 4B)",
    serviceAiBusy: "Tutor IA Procesando (Qwen 3.5 4B)",
    serviceAiOffline: "Tutor IA Offline · Banco Curado Activo",
    topicPromptLabel: "Tema Anatómico de Estudio",
    topicFieldLabel: "Estructura, región o sistema anatómico",
    topicPlaceholder: "Ej: Clavícula y Hombro, Plexo Braquial, Ramas de la Arteria Maxilar...",
    suggestionsLabel: "Temas sugeridos (clic para seleccionar):",
    cardCountLabel: "Cantidad de Tarjetas",
    fewCards: "Hasta 5",
    standardCards: "Hasta 10",
    manyCards: "Hasta 20",
    difficultyLabel: "Nivel de Dificultad",
    defaultDifficultyHint: "Estándar: Medio",
    easy: "Fácil",
    medium: "Medio",
    hard: "Difícil",
    generateAiBtn: "Generar con Tutor IA",
    generatingAiBtn: "Generando con Qwen 3.5 4B...",
    useCuratedBtn: "Usar Banco Curado",
    applyAiBtn: "Aplicar con Tutor IA",
    applyCuratedBtn: "Aplicar Banco Curado",
    cancelGenerationBtn: "Cancelar Generación",
    closeBtn: "Cerrar",
    retryBtn: "Intentar Nuevamente",
    destructiveWarning: "Confirmar nuevos parámetros reemplazará la baraja actual solo tras completarse. Si falla o se cancela, tu progreso SM-2 actual se conservará.",
    operationalBannerTitle: "Disponibilidad del Servicio de Inferencia Local",
    savedDecksKicker: "Colección Personal",
    savedDecksTitle: "Barajas Guardadas",
    deleteDeckTitle: "Eliminar baraja de la colección",
    stages: {
      preparing_evidence: "Preparando evidencias anatómicas...",
      generating_batch: (b, t) => `Generando tarjetas con Qwen 3.5 4B (Lote ${b} de ${t})...`,
      validating_content: "Validando rigor anatómico y deduplicando...",
      batch_completed: (c, r) => `${c} de hasta ${r} tarjetas validadas — siguiente lote...`,
      partial_complete: (c, r) => `Generación parcial: ${c} de hasta ${r} tarjetas validadas.`,
      completed: (c) => `Completado: ${c} tarjetas validadas.`
    }
  },
  en: {
    initialKicker: "Academic Configurator · Aeternum 26.4",
    initialTitle: "Configure Study Deck",
    initialSubtitle: "Select an anatomical topic, set the deck size, and choose between Qwen 3.5 4B synthesis or the curated bank.",
    adjustTitle: "Adjust Deck Parameters",
    adjustSubtitle: "Edit parameters below and confirm to apply without shifting the study card.",
    serviceCuratedReady: "Curated Bank Available",
    serviceAiOnline: "AI Tutor Online (Qwen 3.5 4B)",
    serviceAiBusy: "AI Tutor Processing (Qwen 3.5 4B)",
    serviceAiOffline: "AI Tutor Offline · Curated Bank Active",
    topicPromptLabel: "Anatomical Study Topic",
    topicFieldLabel: "Anatomical structure, region, or system",
    topicPlaceholder: "E.g., Clavicle and Shoulder, Brachial Plexus, Maxillary Artery Branches...",
    suggestionsLabel: "Suggested topics (click to select):",
    cardCountLabel: "Number of Cards",
    fewCards: "Up to 5",
    standardCards: "Up to 10",
    manyCards: "Up to 20",
    difficultyLabel: "Difficulty Level",
    defaultDifficultyHint: "Default: Medium",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    generateAiBtn: "Generate with AI Tutor",
    generatingAiBtn: "Generating with Qwen 3.5 4B...",
    useCuratedBtn: "Use Curated Bank",
    applyAiBtn: "Apply with AI Tutor",
    applyCuratedBtn: "Apply Curated Bank",
    cancelGenerationBtn: "Cancel Generation",
    closeBtn: "Close",
    retryBtn: "Try Again",
    destructiveWarning: "Applying new parameters replaces the current deck only upon completion. If generation fails or is cancelled, your current deck and SM-2 progress remain intact.",
    operationalBannerTitle: "Local Inference Service Availability",
    savedDecksKicker: "Personal Collection",
    savedDecksTitle: "Saved Decks",
    deleteDeckTitle: "Delete deck from collection",
    stages: {
      preparing_evidence: "Preparing anatomical evidence from sovereign corpus...",
      generating_batch: (b, t) => `Generating cards with Qwen 3.5 4B (Batch ${b} of ${t})...`,
      validating_content: "Validating anatomical accuracy and deduplicating...",
      batch_completed: (c, r) => `${c} of up to ${r} cards validated — preparing next batch...`,
      partial_complete: (c, r) => `Partial generation complete: ${c} of up to ${r} cards validated.`,
      completed: (c) => `Completed: ${c} validated anatomical cards.`
    }
  },
  de: {
    initialKicker: "Akademischer Konfigurator · Aeternum 26.4",
    initialTitle: "Lerndeck Konfigurieren",
    initialSubtitle: "Wählen Sie ein anatomisches Thema, legen Sie den Umfang fest und nutzen Sie Qwen 3.5 4B oder die kuratierte Datenbank.",
    adjustTitle: "Deck-Parameter Anpassen",
    adjustSubtitle: "Bearbeiten Sie die Parameter und bestätigen Sie, ohne die Lernkarte zu verschieben.",
    serviceCuratedReady: "Kuratierte Datenbank Verfügbar",
    serviceAiOnline: "KI-Tutor Online (Qwen 3.5 4B)",
    serviceAiBusy: "KI-Tutor Arbeitet (Qwen 3.5 4B)",
    serviceAiOffline: "KI-Tutor Offline · Kuratierte Datenbank Aktiv",
    topicPromptLabel: "Anatomisches Lernthema",
    topicFieldLabel: "Anatomische Struktur, Region oder System",
    topicPlaceholder: "Z. B. Schlüsselbein und Schulter, Plexus brachialis, A. maxillaris...",
    suggestionsLabel: "Themenvorschläge (zum Auswählen klicken):",
    cardCountLabel: "Kartenanzahl",
    fewCards: "Bis 5",
    standardCards: "Bis 10",
    manyCards: "Bis 20",
    difficultyLabel: "Schwierigkeitsgrad",
    defaultDifficultyHint: "Standard: Mittel",
    easy: "Leicht",
    medium: "Mittel",
    hard: "Schwer",
    generateAiBtn: "Mit KI-Tutor Generieren",
    generatingAiBtn: "Generiere mit Qwen 3.5 4B...",
    useCuratedBtn: "Kuratierte Datenbank Nutzen",
    applyAiBtn: "Mit KI-Tutor Anwenden",
    applyCuratedBtn: "Kuratierte Datenbank Anwenden",
    cancelGenerationBtn: "Generierung Abbrechen",
    closeBtn: "Schließen",
    retryBtn: "Erneut Versuchen",
    destructiveWarning: "Neue Parameter ersetzen das aktuelle Deck erst nach erfolgreichem Abschluss. Bei Fehler oder Abbruch bleibt Ihr aktueller SM-2-Fortschritt erhalten.",
    operationalBannerTitle: "Verfügbarkeit des Lokalen Inferenzdienstes",
    savedDecksKicker: "Persönliche Sammlung",
    savedDecksTitle: "Gespeicherte Decks",
    deleteDeckTitle: "Deck aus Sammlung löschen",
    stages: {
      preparing_evidence: "Anatomische Evidenz wird vorbereitet...",
      generating_batch: (b, t) => `Generiere Karten mit Qwen 3.5 4B (Stapel ${b} von ${t})...`,
      validating_content: "Anatomische Validierung und Deduplizierung...",
      batch_completed: (c, r) => `${c} von bis zu ${r} Karten validiert — nächster Stapel...`,
      partial_complete: (c, r) => `Teilgenerierung: ${c} von bis zu ${r} Karten validiert.`,
      completed: (c) => `Abgeschlossen: ${c} validierte Karten.`
    }
  }
};

export default function FlashcardDeckConfigurator({
  mode = "initial", // "initial" | "popover"
  open = true,
  langKey = "pt",
  connectionMode = "online",
  topicValue = "",
  onTopicChange,
  cardCountValue = "few",
  onCardCountChange,
  difficultyValue = "Médio",
  onDifficultyChange,
  quickTopicChips = [],
  isGenerating = false,
  generationProgress = null,
  validationError = "",
  operationalError = "",
  generationNotice = "",
  hasActiveStudyProgress = false,
  hasPendingChanges = false,
  onGenerateAI,
  onUseCurated,
  onCancelGeneration,
  onClose,
  savedDecks = [],
  onLoadSavedDeck,
  onDeleteSavedDeck
}) {
  const panelRef = useRef(null);
  const copy = COPY_BY_LANG[langKey] || COPY_BY_LANG.pt;
  const isOnline = connectionMode === "online" || connectionMode === "live" || connectionMode === "idle";

  // Close popover on Escape key
  useEffect(() => {
    if (mode !== "popover" || !open) return undefined;
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      }
    }
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [mode, open, onClose]);

  if (mode === "popover" && !open) {
    return null;
  }

  function renderProgressText() {
    if (!generationProgress) return copy.stages.preparing_evidence;
    const { stage, batchIndex = 1, totalBatches = 1, completedCount = 0, requestedCount = 5 } = generationProgress;
    if (stage === "generating_batch") return copy.stages.generating_batch(batchIndex, totalBatches);
    if (stage === "validating_content") return copy.stages.validating_content;
    if (stage === "batch_completed") return copy.stages.batch_completed(completedCount, requestedCount);
    if (stage === "partial_complete") return copy.stages.partial_complete(completedCount, requestedCount);
    if (stage === "completed") return copy.stages.completed(completedCount);
    return copy.stages.preparing_evidence;
  }

  const progressPercent = generationProgress
    ? Math.min(96, Math.max(14, Math.round(((generationProgress.completedCount || 0) / Math.max(1, generationProgress.requestedCount || 5)) * 85) + (generationProgress.stage === "validating_content" ? 10 : 5)))
    : 18;

  const content = (
    <A26Surface
      ref={panelRef}
      material="regular"
      className={`a26-configurator-surface ${mode === "popover" ? "a26-configurator-surface--popover a26-deck-config-drawer" : "a26-configurator-surface--initial a26-generator-surface"}`}
      role={mode === "popover" ? "dialog" : "region"}
      aria-modal={mode === "popover" ? "false" : undefined}
      aria-label={mode === "popover" ? copy.adjustTitle : copy.initialTitle}
    >
      {/* 1. Compact Header & Service Availability Status */}
      <div className="a26-configurator-header">
        <div className="a26-configurator-title-group">
          {mode !== "popover" && (
            <span className="a26-kicker">
              {copy.initialKicker}
            </span>
          )}
          <h2 className="a26-configurator-heading">
            {mode === "popover" ? copy.adjustTitle : copy.initialTitle}
          </h2>
          <p className="a26-configurator-subtitle">
            {mode === "popover" ? copy.adjustSubtitle : copy.initialSubtitle}
          </p>
        </div>

        <div className="a26-configurator-header-right">
          <div className="a26-flashcard-trustline" aria-live="polite">
            <span
              className={`a26-flashcard-status-dot ${isGenerating ? "is-busy" : isOnline ? "is-online" : "is-offline"}`}
              aria-hidden="true"
            />
            <span className="a26-trustline-primary">
              {isGenerating ? copy.serviceAiBusy : isOnline ? copy.serviceAiOnline : copy.serviceAiOffline}
            </span>
            <span className="a26-trustline-divider" aria-hidden="true">·</span>
            <strong className="a26-trustline-curated">{copy.serviceCuratedReady}</strong>
          </div>

          {mode === "popover" && (
            <button
              type="button"
              className="a26-configurator-close-btn"
              onClick={onClose}
              aria-label={copy.closeBtn}
              title={`${copy.closeBtn} (Esc)`}
            >
              ✕ <span>{copy.closeBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Anatomical Topic Input */}
      <div className="a26-configurator-topic-section">
        <A26Field
          label={copy.topicFieldLabel}
          value={topicValue}
          onChange={(e) => onTopicChange?.(e.target.value)}
          placeholder={copy.topicPlaceholder}
          error={validationError || undefined}
          className="a26-configurator-topic-field"
        />

        {/* 3. Topic Suggestions (Selection Only — Never Auto-Generates) */}
        <div className="a26-configurator-suggestions">
          <span className="a26-suggestions-caption">{copy.suggestionsLabel}</span>
          <div className="a26-chips-wrapper" role="group" aria-label={copy.suggestionsLabel}>
            {quickTopicChips.map((chip) => {
              const isSelected = String(topicValue || "").trim().toLowerCase() === chip.toLowerCase();
              return (
                <A26Button
                  key={chip}
                  type="button"
                  variant={isSelected ? "liquid" : "ghost"}
                  className={`a26-quick-chip ${isSelected ? "is-selected" : ""}`}
                  aria-pressed={isSelected}
                  onClick={() => onTopicChange?.(chip)}
                >
                  {isSelected ? "✓ " : "+ "}{chip}
                </A26Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 & 5. Card Count & Difficulty Controls (Clean Segmented Layout without Collision) */}
      <div className="a26-configurator-controls-grid">
        <div className="a26-configurator-control-block">
          <div className="a26-control-label-row">
            <label className="a26-control-label">{copy.cardCountLabel}</label>
          </div>
          <A26SegmentedControl
            label={copy.cardCountLabel}
            options={[
              { label: copy.fewCards, value: "few" },
              { label: copy.standardCards, value: "standard" },
              { label: copy.manyCards, value: "many" }
            ]}
            value={cardCountValue}
            onChange={onCardCountChange}
            className="a26-configurator-segmented"
          />
        </div>

        <div className="a26-configurator-control-block">
          <div className="a26-control-label-row">
            <label className="a26-control-label">{copy.difficultyLabel}</label>
            <span className="a26-control-default-badge">{copy.defaultDifficultyHint}</span>
          </div>
          <A26SegmentedControl
            label={copy.difficultyLabel}
            options={[
              { label: copy.easy, value: "Fácil" },
              { label: copy.medium, value: "Médio" },
              { label: copy.hard, value: "Difícil" }
            ]}
            value={difficultyValue}
            onChange={onDifficultyChange}
            className="a26-configurator-segmented"
          />
        </div>
      </div>

      {/* Study Progress Preservation Notice in Popover Mode */}
      {mode === "popover" && hasActiveStudyProgress && hasPendingChanges && (
        <div className="a26-study-preservation-notice" role="status">
          <span aria-hidden="true">🛡️</span>
          <p>{copy.destructiveWarning}</p>
        </div>
      )}

      {/* Progressive Generation Telemetry Bar */}
      {isGenerating && (
        <div className="a26-progressive-status-box" role="status" aria-live="polite">
          <div className="a26-progressive-status-header">
            <span className="a26-spinner" aria-hidden="true" />
            <span className="a26-progressive-stage-text">{renderProgressText()}</span>
            {generationProgress?.completedCount > 0 && (
              <strong className="a26-progressive-count-badge">
                {generationProgress.completedCount}/{generationProgress.requestedCount}
              </strong>
            )}
          </div>
          <div className="a26-progressive-bar-track">
            <div
              className="a26-progressive-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Discreet Operational Availability State (Separated from Topic Field Validation) */}
      {operationalError && !isGenerating && (
        <div className="a26-operational-status-banner a26-generation-error-box" role="alert">
          <div className="a26-operational-banner-content">
            <span className="a26-operational-icon" aria-hidden="true">⚠️</span>
            <div className="a26-operational-text">
              <h4>{copy.operationalBannerTitle}</h4>
              <p>{operationalError}</p>
            </div>
          </div>
          <div className="a26-operational-banner-actions">
            <A26Button
              variant="primary"
              size="sm"
              onClick={() => onGenerateAI?.()}
              icon={<LineIcon name="reset" />}
            >
              {copy.retryBtn}
            </A26Button>
            <A26Button
              variant="ghost"
              size="sm"
              onClick={() => onUseCurated?.()}
            >
              📚 {copy.useCuratedBtn}
            </A26Button>
          </div>
        </div>
      )}

      {generationNotice && !operationalError && (
        <p className="a26-generation-message" aria-live="polite">
          {generationNotice}
        </p>
      )}

      {/* 7 & 8. Primary AI Generation & Curated Bank Actions */}
      <div className="a26-generator-actions">
        <A26Button
          variant="primary"
          onClick={() => onGenerateAI?.()}
          loading={isGenerating}
          icon={<LineIcon name="spark" />}
          className="a26-action-generate-ai"
        >
          {isGenerating
            ? copy.generatingAiBtn
            : mode === "popover"
              ? copy.applyAiBtn
              : copy.generateAiBtn}
        </A26Button>

        <A26Button
          variant="liquid"
          onClick={() => onUseCurated?.()}
          disabled={isGenerating}
          className="a26-action-use-curated"
        >
          📚 {mode === "popover" ? copy.applyCuratedBtn : copy.useCuratedBtn}
        </A26Button>

        {isGenerating && (
          <A26Button
            variant="danger"
            size="sm"
            onClick={() => onCancelGeneration?.()}
            className="a26-action-cancel-gen"
          >
            ✕ {copy.cancelGenerationBtn}
          </A26Button>
        )}
      </div>

      {/* Saved Decks Section (Initial Mode Only) */}
      {mode === "initial" && savedDecks.length > 0 && (
        <div className="a26-saved-decks-section">
          <div className="a26-saved-decks-header">
            <span className="a26-kicker">{copy.savedDecksKicker}</span>
            <h3 className="a26-saved-decks-title">
              {copy.savedDecksTitle} ({savedDecks.length})
            </h3>
          </div>
          <div className="a26-saved-decks-grid">
            {savedDecks.map((deck) => (
              <A26Card
                key={deck.id || deck.title}
                material="clear"
                interactive
                className="a26-saved-deck"
                onClick={() => onLoadSavedDeck?.(deck)}
              >
                <div className="a26-saved-deck-info">
                  <h4 className="a26-saved-deck-name">{deck.title}</h4>
                  <span className="a26-saved-deck-meta">
                    {deck.cards?.length} cards · {deck.difficulty}
                  </span>
                </div>
                <button
                  type="button"
                  title={copy.deleteDeckTitle}
                  aria-label={copy.deleteDeckTitle}
                  className="a26-saved-deck-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSavedDeck?.(deck);
                  }}
                >
                  <LineIcon name="trash" />
                </button>
              </A26Card>
            ))}
          </div>
        </div>
      )}
    </A26Surface>
  );

  if (mode === "popover") {
    return (
      <div className="a26-configurator-popover-layer" data-testid="flashcard-adjust-popover">
        <div
          className="a26-configurator-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="a26-configurator-popover-anchor">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
