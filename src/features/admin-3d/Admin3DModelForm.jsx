import { A26Card, A26Field, A26Surface } from "../../components/aeternum-26";
import {
  canonicalSketchfabEmbedUrl,
  sketchfabUidFromModel
} from "../../services/viewerEngineService";

function updateModel(model, onChange, field, value) {
  const next = {
    ...model,
    [field]: value,
    provider: "sketchfab",
    viewerType: "sketchfab",
    viewer_type: "sketchfab",
    viewerEngine: "sketchfab",
    viewer_engine: "sketchfab",
    defaultViewerEngine: "sketchfab",
    embedProvider: "sketchfab"
  };

  if (field === "embedUrl" || field === "sketchfabUrl") {
    const embedUrl = canonicalSketchfabEmbedUrl(next);
    next.sketchfabUid = sketchfabUidFromModel(next);
    next.sketchfabEmbedUrl = embedUrl || "";
    if (embedUrl) next.embedUrl = embedUrl;
  }

  onChange(next);
}

export default function Admin3DModelForm({ model, onChange, disabled = false }) {
  const embedUrl = canonicalSketchfabEmbedUrl(model);
  const hasValidViewer = Boolean(embedUrl);

  return (
    <A26Surface material="regular" className="admin3d-sketchfab-form">
      <header>
        <span className="a26-kicker">Contrato único de visualização</span>
        <h2>Modelo Sketchfab</h2>
        <p>O catálogo público utiliza somente o embed oficial do Sketchfab. Uploads GLB e fallback nativo não fazem parte deste fluxo.</p>
      </header>

      <div className="admin3d-sketchfab-form__grid">
        <A26Field label="Título" value={model.title || ""} disabled={disabled} onChange={(event) => updateModel(model, onChange, "title", event.target.value)} />
        <A26Field label="Sistema anatômico" value={model.system || model.anatomical_system || ""} disabled={disabled} onChange={(event) => updateModel(model, onChange, "system", event.target.value)} />
        <A26Field label="Região anatômica" value={model.region || model.anatomical_region || ""} disabled={disabled} onChange={(event) => updateModel(model, onChange, "region", event.target.value)} />
        <A26Field as="select" label="Estado editorial" value={model.status || "draft"} disabled={disabled} onChange={(event) => updateModel(model, onChange, "status", event.target.value)}>
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
          <option value="archived">Arquivado</option>
        </A26Field>
        <A26Field className="admin3d-sketchfab-form__wide" as="textarea" label="Descrição" value={model.description || ""} disabled={disabled} onChange={(event) => updateModel(model, onChange, "description", event.target.value)} />
        <A26Field
          className="admin3d-sketchfab-form__wide"
          label="URL pública ou embed do Sketchfab"
          value={model.embedUrl || model.sketchfabEmbedUrl || model.sketchfabUrl || ""}
          error={!hasValidViewer ? "Informe uma URL Sketchfab com UID válido antes de publicar." : undefined}
          hint={hasValidViewer ? `Embed canônico: ${embedUrl}` : "Exemplo: https://sketchfab.com/models/UID/embed"}
          disabled={disabled}
          onChange={(event) => updateModel(model, onChange, "embedUrl", event.target.value)}
        />
      </div>

      <A26Card tone={hasValidViewer ? "teal" : "gold"} className="admin3d-sketchfab-form__status">
        <span className="a26-kicker">Motor oficial</span>
        <strong>{hasValidViewer ? "Sketchfab conectado" : "Configuração incompleta"}</strong>
        <p>{hasValidViewer ? "O modelo está apto a abrir no Viewer unificado." : "O modelo permanecerá indisponível ao estudante até receber um embed válido."}</p>
      </A26Card>
    </A26Surface>
  );
}
