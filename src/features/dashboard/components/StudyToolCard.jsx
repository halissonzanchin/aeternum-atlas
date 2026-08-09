import LineIcon from "../../../components/icons/LineIcon";
import { A26Surface } from "../../../components/aeternum-26";

export default function StudyToolCard({ tool, navigate, t }) {
  return (
    <A26Surface as="button" type="button" material="regular" interactive tone="teal" className="study-tool-card" onClick={() => navigate(tool.path)}>
      <span className="study-tool-icon">
        <LineIcon name={tool.icon} />
      </span>
      <span className={`study-tool-status study-tool-status--${tool.statusTone}`}>{t(tool.statusKey)}</span>
      <strong>{t(tool.titleKey)}</strong>
      <p>{t(tool.descriptionKey)}</p>
    </A26Surface>
  );
}
