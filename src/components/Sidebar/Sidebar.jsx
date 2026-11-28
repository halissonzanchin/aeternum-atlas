/* eslint-disable no-unused-vars -- o parser ESLint atual não contabiliza identificadores usados apenas em JSX */
import { useMemo, useState } from "react";
import AeternumLogo from "../AeternumLogo";
import LineIcon from "../icons/LineIcon";
import { A26Sidebar } from "../aeternum-26";
import { useLanguage } from "../../context/LanguageContext";
import { homePathForRole } from "../../config/roleNavigation";
import { roleTranslationKey } from "../Layout/shellNavigation";

const ADMIN_GROUPS = [
  {
    id: "command",
    title: "1. Centro Operacional",
    match: (href) => href === "/admin" || href === "/admin/dashboard" || href === "/super-admin" || href === "/super-admin/dashboard" || href.includes("overview")
  },
  {
    id: "operations",
    title: "2. Operações & Comunidade",
    match: (href) => href.includes("candidatos-beta") || href.includes("beta") || href.includes("comunicados") || href.includes("announcement")
  },
  {
    id: "analytics",
    title: "3. Analytics & Inteligência",
    match: (href) => href.includes("analytics") || href.includes("heatmap") || href.includes("model")
  },
  {
    id: "institution",
    title: "4. Gestão Institucional",
    match: (href) => href.includes("instituic") || href.includes("institutions") || href.includes("student") || href.includes("aluno") || href.includes("import")
  },
  {
    id: "finance",
    title: "5. Inteligência Financeira",
    match: (href) => href.includes("billing") || href.includes("faturamento") || href.includes("roi")
  },
  {
    id: "governance",
    title: "6. Governança & Sistema",
    match: (href) => href.includes("report") || href.includes("relatorio") || href.includes("setting") || href.includes("config") || href.includes("digital-twin") || href.includes("audit")
  }
];

export default function Sidebar({ items, path, user, navigate, onLogout }) {
  const { t } = useLanguage();
  const roleLabel = t(roleTranslationKey(user?.role));
  const isAdmin = ["super_admin", "admin", "institution_admin"].includes(String(user?.role || "").toLowerCase());
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());

  const groupedAdminItems = useMemo(() => {
    if (!isAdmin) return null;
    const groups = ADMIN_GROUPS.map(g => ({ ...g, items: [] }));
    const fallbackGroup = groups[0];

    for (const item of items) {
      const targetGroup = groups.find(g => g.match(item.href)) || fallbackGroup;
      targetGroup.items.push(item);
    }

    return groups.filter(g => g.items.length > 0);
  }, [isAdmin, items]);

  function toggleGroup(groupId) {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

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
        <AeternumLogo variant="symbol" size="sm" theme="dark" />
        <span className="a26-shell__brand-copy">
          <strong>AETERNUM ATLAS</strong>
          <small>{roleLabel}</small>
        </span>
      </button>

      <nav className="a26-shell__sidebar-nav" aria-label={t("shell.modules")}>
        {isAdmin && groupedAdminItems ? (
          groupedAdminItems.map(group => {
            const isCollapsed = collapsedGroups.has(group.id);
            return (
              <div key={group.id} className="a26-shell__nav-group" data-testid={`a26-nav-group-${group.id}`}>
                <button
                  type="button"
                  className="a26-shell__nav-group-toggle"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={!isCollapsed}
                  title={isCollapsed ? `Expandir ${group.title}` : `Recolher ${group.title}`}
                >
                  <span>{group.title}</span>
                  <span className="a26-shell__nav-group-chevron" aria-hidden="true">
                    {isCollapsed ? "▸" : "▾"}
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="a26-shell__nav-group-items">
                    {group.items.map(item => (
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
                  </div>
                )}
              </div>
            );
          })
        ) : (
          items.map(item => (
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
          ))
        )}
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
