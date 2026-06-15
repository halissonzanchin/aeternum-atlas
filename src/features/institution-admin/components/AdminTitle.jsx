import { useLanguage } from "../../../context/LanguageContext";

export default function AdminTitle({ title, text }) {
  const { t } = useLanguage();
  return (
    <div className="page-title">
      <p className="eyebrow">{t("institutionAdmin.eyebrow")}</p>
      <h1 className="display-title">{title}</h1>
      <p className="mt-3 max-w-3xl text-textMuted">{text}</p>
    </div>
  );
}
