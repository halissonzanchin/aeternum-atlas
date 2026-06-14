import { useEffect, useRef } from "react";
import LineIcon from "../icons/LineIcon";
import ModelAnalyticsCard from "../viewer/ModelAnalyticsCard";
import SketchfabApiViewer from "../viewer/SketchfabApiViewer";
import SecureContentGuard from "../security/SecureContentGuard";
import { useLanguage } from "../../context/LanguageContext";
import { getCurrentUserForModelAccess, logModelAccess } from "../../services/logModelAccess";

function sketchfabEmbedUrl(model) {
  const raw =
    model?.sketchfabEmbedUrl ||
    model?.embedUrl ||
    model?.sketchfab_embed_url ||
    model?.sketchfabUrl ||
    model?.sketchfab_url ||
    "";

  if (!raw) return "";
  if (raw.includes("/embed")) return raw;

  const sketchfabModelId = raw.match(/([a-f0-9]{32})/i)?.[1];

  if (raw.includes("sketchfab.com") && sketchfabModelId) {
    return `https://sketchfab.com/models/${sketchfabModelId}/embed`;
  }

  return raw;
}

function sketchfabModelUid(model, embedUrl) {
  return (
    model?.sketchfabUid ||
    model?.sketchfab_uid ||
    embedUrl?.match(/([a-f0-9]{32})/i)?.[1] ||
    ""
  );
}

function databaseModelId(model) {
  return (
    model?.supabaseModelId ||
    model?.supabase_model_id ||
    model?.modelUuid ||
    model?.model_uuid ||
    model?.model_id ||
    model?.sketchfabUid ||
    model?.sketchfab_uid ||
    model?.id ||
    ""
  );
}

function AnatomyPlaceholder({ structure, activePart, structures, onSelectStructure }) {
  const { t } = useLanguage();

  return (
    <div className="viewer-placeholder" aria-label={t("viewer.anatomicalViewer")}>
      <div className="anatomy-orbit orbit-one" />
      <div className="anatomy-orbit orbit-two" />

      <div className="anatomy-model">
        <div className="anatomy-head" />
        <div className="anatomy-spine" />
        <div className="anatomy-ribs" />
        <div className="anatomy-pelvis" />
        <div className="anatomy-arm left" />
        <div className="anatomy-arm right" />
        <div className="anatomy-leg left" />
        <div className="anatomy-leg right" />
      </div>

      {structures.slice(0, 5).map((item, index) => (
        <button
          key={item.id}
          className={`structure-marker marker-${index + 1} ${
            item.name === structure.name ? "is-selected" : ""
          }`}
          onClick={() => onSelectStructure(item)}
        >
          <span />
          <strong>{item.name}</strong>
        </button>
      ))}

      {activePart ? (
        <div className="active-part-callout">
          <span>{t("viewer.partHighlighted")}</span>
          <strong>{activePart.name}</strong>
        </div>
      ) : null}
    </div>
  );
}

export default function ModelViewer({
  model,
  structure,
  structures = [],
  activePart,
  accessLocked,
  onSelectStructure,
  onViewerAction,
  onViewerEvent,
  onAnnotationsLoad,
  onAnnotationSelect,
  annotationNavigationRequest,
  annotationTooltipsHidden = false,
  isFavorite = false,
  isStudied = false,
  isAccessRegistered = false,
  onRequestAccess,
  currentUser
}) {
  const { t } = useLanguage();
  const initialAccessLoggedRef = useRef(null);

  const embedUrl = sketchfabEmbedUrl(model);
  const modelUid = sketchfabModelUid(model, embedUrl);
  const externalUrl = model?.sketchfabModelUrl || model?.externalUrl || model?.shortUrl;

  useEffect(() => {
    if (!model?.id || accessLocked) return;
    const accessKey = `${currentUser?.id || "supabase-auth"}:${model.id}`;
    if (initialAccessLoggedRef.current === accessKey) return;

    registerSupabaseModelAccess("initial_view").then(result => {
      if (!result.error) initialAccessLoggedRef.current = accessKey;
    });
  }, [accessLocked, currentUser?.id, currentUser?.institution_id, currentUser?.institutionId, model?.id]);

  async function registerSupabaseModelAccess(source = "manual_button") {
    if (!model?.id) {
      console.warn("[model_access_logs] model_id ausente.");
      return { data: null, error: new Error("model_id ausente") };
    }

    const accessUser = await getCurrentUserForModelAccess(currentUser);

    if (!accessUser?.id) {
      console.warn("[model_access_logs] Usuário não autenticado; insert cancelado.");
      return { data: null, error: new Error("Usuário não autenticado") };
    }

    if (!accessUser.institution_id) {
      console.warn("[model_access_logs] institution_id ausente; insert cancelado.");
      return { data: null, error: new Error("institution_id ausente") };
    }

    return logModelAccess({
      institution_id: accessUser.institution_id,
      user_id: accessUser.id,
      model_id: databaseModelId(model),
      action: "view_model",
      duration_seconds: 0
    }).then(result => {
      if (result.error) {
        console.error(`[model_access_logs] Falha ao registrar acesso (${source}).`, result.error);
      }
      return result;
    });
  }

  const actions = [
    ...(embedUrl ? [["Abrir no Sketchfab", "viewer.openSketchfab", "fullscreen"]] : []),
    ["Favoritar", "viewer.favorite", "favorite"],
    ["Marcar como estudado", "viewer.markAsStudied", "check"],
    ["Copiar link do modelo", "viewer.copyModelLink", "layers"],
    ["Registrar acesso", "viewer.registerAccess", "check"],
    ["Anotações", "viewer.notes", "note"],
    ["Simulado Anatômico", "viewer.anatomicalQuiz", "clipboardCheck"],
    ["Simulado Teórico", "viewer.theoreticalQuiz", "fileQuestion"],
    ["Voltar para biblioteca", "viewer.backToLibrary", "library"],
    ["Reportar problema", "viewer.reportProblem", "help"]
  ];

  function actionStateClass(action) {
    if (action === "Favoritar" && isFavorite) return "is-favorite-active";
    if (action === "Marcar como estudado" && isStudied) return "is-studied-active";
    if (action === "Registrar acesso" && isAccessRegistered) return "is-access-active";
    return "";
  }

  function isActionPressed(action) {
    if (action === "Favoritar") return isFavorite;
    if (action === "Marcar como estudado") return isStudied;
    if (action === "Registrar acesso") return isAccessRegistered;
    return undefined;
  }

  function isActionIconFilled(action) {
    return (
      (action === "Favoritar" && isFavorite) ||
      (action === "Marcar como estudado" && isStudied) ||
      (action === "Registrar acesso" && isAccessRegistered)
    );
  }

  return (
    <section className={`viewer-canvas-panel ${embedUrl ? "is-sketchfab-mode" : ""}`}>
      {!embedUrl ? (
        <div className="viewer-canvas-header">
          <div>
            <p className="viewer-eyebrow">{t("viewer.academicViewerEyebrow")}</p>
            <h2>{model.title}</h2>
          </div>

          <div className="viewer-status-cluster">
            <span className="viewer-status-chip">{t("viewer.integratedSketchfab")}</span>
            <span className="viewer-status-chip gold">{t("viewer.academicContext")}</span>
          </div>
        </div>
      ) : null}

      <div className={`viewer-canvas ${embedUrl ? "viewer-canvas--sketchfab" : ""}`}>
        {accessLocked ? (
          <div className="viewer-locked-card">
            <LineIcon name="lock" className="h-10 w-10 text-techTeal" />
            <h3>{t("viewer.moduleNotContracted")}</h3>
            <p>{t("viewer.moduleNotContractedText")}</p>
            <button className="viewer-primary-button" onClick={onRequestAccess}>
              {t("viewer.requestAdmin")}
            </button>
          </div>
        ) : embedUrl ? (
          <SecureContentGuard user={currentUser} model={model}>
            <SketchfabApiViewer
              title={model.shortTitle || model.title}
              modelUid={modelUid}
              embedUrl={embedUrl}
              externalUrl={externalUrl}
              onEvent={onViewerEvent}
              onAnnotationsLoad={onAnnotationsLoad}
              onAnnotationSelect={onAnnotationSelect}
              annotationNavigationRequest={annotationNavigationRequest}
              annotationTooltipsHidden={annotationTooltipsHidden}
            />
          </SecureContentGuard>
        ) : (
          <AnatomyPlaceholder
            structure={structure}
            activePart={activePart}
            structures={structures}
            onSelectStructure={onSelectStructure}
          />
        )}
      </div>

      <div className={`viewer-control-strip ${embedUrl ? "aa-viewer-actions" : ""}`}>
        {actions.map(([action, labelKey, icon]) => (
          <button
            key={action}
            className={actionStateClass(action)}
            data-viewer-action={action}
            aria-pressed={isActionPressed(action)}
            onClick={async () => {
              if (action === "Registrar acesso") {
                await registerSupabaseModelAccess("manual_button");
              }
              onViewerAction(action);
            }}
            aria-label={t(labelKey)}
            data-tooltip={t(labelKey)}
          >
            <LineIcon name={icon} className="h-4 w-4" filled={isActionIconFilled(action)} />
            <span>{t(labelKey)}</span>
          </button>
        ))}
      </div>

      {embedUrl ? (
        <div className="mt-4">
          <ModelAnalyticsCard modelId={model.id} />
        </div>
      ) : null}
    </section>
  );
}
