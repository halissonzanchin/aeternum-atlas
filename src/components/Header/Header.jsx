import AeternumLogo from "../AeternumLogo";
import Button from "../Button/Button";
import LanguageSelector from "../LanguageSelector";
import { useLanguage } from "../../context/LanguageContext";

function Icon({ label, children }) {
  return (
    <button aria-label={label} className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-clinicalWhite transition hover:-translate-y-0.5 hover:border-techTeal/50 hover:text-techTeal hover:shadow-glow">
      {children}
    </button>
  );
}

export default function Header({ navigate }) {
  const { t } = useLanguage();
  return (
    <header className="sticky top-0 z-30 atlas-liquid-glass-toolbar">
      <div className="mx-auto flex min-h-[78px] w-[min(1180px,calc(100%_-_40px))] flex-col items-stretch justify-between gap-4 py-4 sm:flex-row sm:items-center sm:py-0">
        <div className="flex min-w-0 items-center gap-4">
          <button onClick={() => navigate("/")} className="flex min-w-0 items-center gap-3" aria-label="Aeternum Atlas home">
            <AeternumLogo variant="horizontal" size="md" theme="transparent" />
          </button>
          <div className="hidden border-l border-white/10 pl-4 md:flex md:items-center md:gap-2">
            <Icon label={t("publicHome.search")}>⌕</Icon>
            <Icon label={t("publicHome.notifications")}>•</Icon>
            <Icon label={t("publicHome.help")}>?</Icon>
            <LanguageSelector compact />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/login")}>{t("auth.login").toUpperCase()}</Button>
          <Button variant="teal" onClick={() => navigate("/register")}>{t("auth.register").toUpperCase()}</Button>
        </div>
      </div>
    </header>
  );
}
