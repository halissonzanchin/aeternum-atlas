/* eslint-disable no-unused-vars -- o parser ESLint atual não contabiliza identificadores usados apenas em JSX */
import AeternumLogo from "../AeternumLogo";
import LineIcon from "../icons/LineIcon";
import { A26Sidebar } from "../aeternum-26";
import { useLanguage } from "../../context/LanguageContext";
import { homePathForRole } from "../../config/roleNavigation";
import { roleTranslationKey } from "../Layout/shellNavigation";

export default function Sidebar({ items, path, user, navigate, onLogout }) {
  const { t } = useLanguage();
  const roleLabel = t(roleTranslationKey(user?.role));

  return (
    <A26Sidebar
      label={t("shell.primaryNavigation")}
      className="a26-shell__sidebar"
      data-testid="a26-shell-sidebar"
    >
      <button
        type="button"
        onClick={() => navigate(homePathForRole(user?.role))}
        className="a26-shell__brand"
        aria-label={`${t("common.appName")} dashboard`}
      >
        <AeternumLogo variant="symbol" size="md" theme="dark" />
        <span className="a26-shell__brand-copy">
          <strong>AETERNUM ATLAS</strong>
          <small>{roleLabel}</small>
        </span>
      </button>

      <nav className="a26-shell__sidebar-nav" aria-label={t("shell.modules")}>
        {items.map(item => (
          <button
            key={item.href}
            type="button"
            onClick={() => navigate(item.href)}
            className={`a26-shell__nav-item${item.active ? " is-active" : ""}`}
            aria-current={item.active ? "page" : undefined}
          >
            <LineIcon name={item.icon} className="h-[18px] w-[18px]" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <footer className="a26-shell__sidebar-footer">
        <div className="a26-shell__sidebar-identity">
          <span aria-hidden="true">{user?.name?.[0] || "A"}</span>
          <div>
            <strong>{user?.name || t("common.appName")}</strong>
            <small>{roleLabel}</small>
          </div>
        </div>
        <button type="button" className="a26-shell__logout" onClick={onLogout}>
          <LineIcon name="lock" className="h-4 w-4" />
          {t("navigation.logout")}
        </button>
      </footer>
    </A26Sidebar>
  );
}
