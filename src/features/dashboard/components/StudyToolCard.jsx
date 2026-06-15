import LineIcon from "../../../components/icons/LineIcon";

export default function StudyToolCard({ tool, navigate, t }) {
  return (
    <button className="study-tool-card" onClick={() => navigate(tool.path)}>
      <span className="study-tool-icon">
        <LineIcon name={tool.icon} />
      </span>
      <span className={`study-tool-status study-tool-status--${tool.statusTone}`}>{t(tool.statusKey)}</span>
      <strong>{t(tool.titleKey)}</strong>
      <p>{t(tool.descriptionKey)}</p>
    </button>
  );
}
