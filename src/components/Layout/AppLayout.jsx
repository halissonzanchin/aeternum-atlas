/* eslint-disable no-unused-vars -- o parser ESLint atual não contabiliza identificadores usados apenas em JSX */
import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import LanguageSelector from "../LanguageSelector";
import LineIcon from "../icons/LineIcon";
import {
  A26Button,
  A26IconButton,
  A26Modal,
  A26Popover,
  A26Surface,
  A26TabBar
} from "../aeternum-26";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import {
  currentShellRoute,
  roleTranslationKey,
  shellNavigationForRole
} from "./shellNavigation";
import { searchGlobalContent } from "../../services/globalSearchService";

export default function AppLayout({ user, path, navigate, onLogout, children }) {
  const { t } = useLanguage();
  const { theme, toggleTheme, isLight } = useTheme();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);
  const controlsRef = useRef(null);
  const notificationsTriggerRef = useRef(null);
  const profileTriggerRef = useRef(null);

  const items = useMemo(
    () => shellNavigationForRole(user?.role, path, t),
    [path, t, user?.role]
  );
  const currentRoute = useMemo(() => currentShellRoute(items, path, t), [items, path, t]);
  const roleLabel = t(roleTranslationKey(user?.role));
  const profileItem = items.find(item => item.href.includes("profile"));
  const normalizedQuery = query.trim();
  const searchOpen = searchExpanded || Boolean(normalizedQuery);
  
  const searchCategorizedResults = useMemo(
    () => searchGlobalContent(normalizedQuery, items),
    [normalizedQuery, items]
  );

  const hasAnyResults = Boolean(
    searchCategorizedResults.models.length ||
    searchCategorizedResults.structures.length ||
    searchCategorizedResults.questionTopics.length ||
    searchCategorizedResults.navigation.length
  );
  const mobilePrimaryItems = items.slice(0, 3);
  const overlayOpen = mobileNavigationOpen;

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.classList.add("a26-shell-mounted");
    body.classList.add("a26-shell-mounted");

    return () => {
      root.classList.remove("a26-shell-mounted");
      body.classList.remove("a26-shell-mounted");
    };
  }, []);

  useEffect(() => {
    const content = document.getElementById("a26-shell-content");
    content?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [path]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      const isTyping = target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        || target?.isContentEditable;

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        setSearchExpanded(true);
        window.requestAnimationFrame(() => searchRef.current?.focus());
      }

      const focusInsideSearch = document.activeElement === searchRef.current
        || document.activeElement?.closest?.("#a26-shell-search-results");
      if (event.key === "Escape" && focusInsideSearch) {
        setQuery("");
        setSearchExpanded(false);
        searchRef.current?.blur();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!controlsRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
        setProfileOpen(false);
        if (!query.trim()) {
          setSearchExpanded(false);
        }
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [query]);

  function goTo(href) {
    setQuery("");
    setSearchExpanded(false);
    setMobileNavigationOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
    navigate(href);
  }

  return (
    <div
      className={`a26-shell${overlayOpen ? " is-overlay-open" : ""}`}
      data-testid="a26-app-shell"
      data-a26-role={user?.role || "unknown"}
      data-a26-route={path}
    >
      <Sidebar
        items={items}
        user={user}
        path={path}
        navigate={goTo}
        onLogout={onLogout}
      />

      <div className="a26-shell__main">
        <A26Surface
          as="header"
          material="regular"
          className="a26-shell__topbar"
          data-testid="a26-shell-topbar"
        >
          <div className="a26-shell__context">
            <span className="a26-shell__avatar" aria-hidden="true">{user?.name?.[0] || "A"}</span>
            <div>
              <span className="a26-shell__role">{roleLabel}</span>
              <strong>{currentRoute.label}</strong>
              <small>
                {user?.institution
                  || (user?.institutionId || user?.institution_id ? t("settings.tenantLinked", { defaultValue: "Tenant institucional vinculado" }) : t("settings.institutionMissing"))}
              </small>
            </div>
          </div>

          <div className="a26-shell__controls" ref={controlsRef}>
            <div
              className={`a26-shell__search${searchOpen ? " is-expanded" : ""}`}
              role="search"
            >
              {searchOpen ? (
                <>
                  <LineIcon name="search" className="h-4 w-4 a26-shell__search-icon" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={event => {
                      setQuery(event.target.value);
                      setSearchExpanded(true);
                    }}
                    onFocus={() => setSearchExpanded(true)}
                    aria-label={t("common.searchPlaceholder")}
                    aria-expanded={Boolean(normalizedQuery)}
                    aria-controls="a26-shell-search-results"
                    placeholder={t("common.searchPlaceholder")}
                  />
                  <kbd aria-label={t("shell.searchShortcut")}>/</kbd>
                  <A26IconButton
                    label={t("shell.clearSearch")}
                    icon="close"
                    variant="ghost"
                    onClick={() => {
                      setQuery("");
                      setSearchExpanded(false);
                    }}
                  />
                </>
              ) : (
                <A26IconButton
                  label={t("common.searchPlaceholder")}
                  icon="search"
                  className="a26-shell__search-trigger"
                  onClick={() => {
                    setSearchExpanded(true);
                    window.requestAnimationFrame(() => searchRef.current?.focus());
                  }}
                />
              )}

              {normalizedQuery ? (
                <A26Surface
                  id="a26-shell-search-results"
                  material="regular"
                  className="a26-shell__search-results"
                  role="listbox"
                  aria-label={t("shell.searchResults")}
                >
                  {hasAnyResults ? (
                    <>
                      {searchCategorizedResults.models.length ? (
                        <div className="a26-shell__search-group">
                          <div className="a26-shell__search-group-title">
                            <LineIcon name="layers" className="h-3.5 w-3.5" />
                            <span>Modelos 3D Cadavéricos</span>
                          </div>
                          {searchCategorizedResults.models.map(item => (
                            <button
                              key={`model-${item.id}`}
                              type="button"
                              role="option"
                              onClick={() => goTo(item.href)}
                            >
                              <LineIcon name={item.icon} className="h-4 w-4 text-techTeal" />
                              <div className="a26-shell__search-item-info">
                                <span className="a26-shell__search-item-title">{item.title}</span>
                                <span className="a26-shell__search-item-subtitle">{item.subtitle}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {searchCategorizedResults.structures.length ? (
                        <div className="a26-shell__search-group">
                          <div className="a26-shell__search-group-title">
                            <LineIcon name="activity" className="h-3.5 w-3.5" />
                            <span>Estruturas Anatômicas</span>
                          </div>
                          {searchCategorizedResults.structures.map(item => (
                            <button
                              key={`struct-${item.id}`}
                              type="button"
                              role="option"
                              onClick={() => goTo(item.href)}
                            >
                              <LineIcon name={item.icon} className="h-4 w-4 text-a26Gold" />
                              <div className="a26-shell__search-item-info">
                                <span className="a26-shell__search-item-title">{item.title}</span>
                                <span className="a26-shell__search-item-subtitle">{item.subtitle}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {searchCategorizedResults.questionTopics.length ? (
                        <div className="a26-shell__search-group">
                          <div className="a26-shell__search-group-title">
                            <LineIcon name="book" className="h-3.5 w-3.5" />
                            <span>Banco Latarjet & Questões</span>
                          </div>
                          {searchCategorizedResults.questionTopics.map(item => (
                            <button
                              key={`topic-${item.id}`}
                              type="button"
                              role="option"
                              onClick={() => goTo(item.href)}
                            >
                              <LineIcon name={item.icon} className="h-4 w-4 text-techTeal" />
                              <div className="a26-shell__search-item-info">
                                <span className="a26-shell__search-item-title">{item.title}</span>
                                <span className="a26-shell__search-item-subtitle">{item.subtitle}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {searchCategorizedResults.navigation.length ? (
                        <div className="a26-shell__search-group">
                          <div className="a26-shell__search-group-title">
                            <LineIcon name="compass" className="h-3.5 w-3.5" />
                            <span>Ferramentas & Páginas</span>
                          </div>
                          {searchCategorizedResults.navigation.map(item => (
                            <button
                              key={`nav-${item.href}`}
                              type="button"
                              role="option"
                              onClick={() => goTo(item.href)}
                            >
                              <LineIcon name={item.icon} className="h-4 w-4 text-white/70" />
                              <div className="a26-shell__search-item-info">
                                <span className="a26-shell__search-item-title">{item.title}</span>
                                <span className="a26-shell__search-item-subtitle">{item.subtitle}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="a26-shell__search-empty">
                      <LineIcon name="search" className="h-5 w-5" />
                      <span>Nenhum conteúdo anatômico ou página encontrada para &quot;{normalizedQuery}&quot;</span>
                    </div>
                  )}
                </A26Surface>
              ) : null}
            </div>

            <div className="a26-shell__control-anchor">
              <A26IconButton
                ref={notificationsTriggerRef}
                label={t("settings.notificationCenter")}
                icon="note"
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setNotificationsOpen(value => !value);
                  setProfileOpen(false);
                }}
              />
              <A26Popover
                open={notificationsOpen}
                label={t("settings.notificationCenter")}
                onClose={({ reason } = {}) => {
                  setNotificationsOpen(false);
                  if (reason === "escape") window.requestAnimationFrame(() => notificationsTriggerRef.current?.focus());
                }}
                className="a26-shell__popover"
              >
                <span className="a26-kicker">{t("settings.notificationCenter")}</span>
                <h2>{t("settings.noNotifications")}</h2>
                <p>{t("settings.notificationText")}</p>
              </A26Popover>
            </div>

            <A26IconButton
              label={isLight ? "Alternar para Dark Liquid Glass (Modo Escuro)" : "Alternar para Light Liquid Glass (Modo Claro)"}
              icon={isLight ? "moon" : "sun"}
              className="a26-shell__theme-toggle"
              aria-label={isLight ? "Alternar para Dark Liquid Glass (Modo Escuro)" : "Alternar para Light Liquid Glass (Modo Claro)"}
              onClick={toggleTheme}
            />

            <LanguageSelector
              compact
              onOpen={() => {
                setNotificationsOpen(false);
                setProfileOpen(false);
              }}
            />

            <div className="a26-shell__control-anchor">
              <A26IconButton
                ref={profileTriggerRef}
                label={t("settings.account")}
                icon="user"
                aria-expanded={profileOpen}
                onClick={() => {
                  setProfileOpen(value => !value);
                  setNotificationsOpen(false);
                }}
              />
              <A26Popover
                open={profileOpen}
                label={t("settings.account")}
                onClose={({ reason } = {}) => {
                  setProfileOpen(false);
                  if (reason === "escape") window.requestAnimationFrame(() => profileTriggerRef.current?.focus());
                }}
                className="a26-shell__popover a26-shell__profile-popover"
              >
                <span className="a26-kicker">{roleLabel}</span>
                <h2>{user?.name || t("common.appName")}</h2>
                <p>{user?.email}</p>
                <A26Button variant="liquid" onClick={() => goTo(profileItem?.href || "/profile")}>
                  {t("navigation.profile")}
                </A26Button>
                <A26Button variant="ghost" onClick={onLogout}>
                  {t("navigation.logout")}
                </A26Button>
              </A26Popover>
            </div>
          </div>
        </A26Surface>

        <main className="a26-shell__content" id="a26-shell-content" tabIndex="-1">
          {children}
        </main>

        <A26TabBar
          label={t("shell.mobileNavigation")}
          className="a26-shell__bottom-nav"
          data-testid="a26-shell-mobile-navigation"
        >
          {mobilePrimaryItems.map(item => (
            <button
              key={item.href}
              type="button"
              className={item.active ? "is-active" : ""}
              aria-current={item.active ? "page" : undefined}
              onClick={() => goTo(item.href)}
            >
              <LineIcon name={item.icon} className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          ))}
          <button
            type="button"
            aria-expanded={mobileNavigationOpen}
            onClick={() => setMobileNavigationOpen(true)}
          >
            <LineIcon name="menu" className="h-5 w-5" />
            <span>{t("shell.more")}</span>
          </button>
        </A26TabBar>
      </div>

      <A26Modal
        open={mobileNavigationOpen}
        title={t("shell.navigation")}
        description={`${roleLabel} · ${currentRoute.label}`}
        closeLabel={t("actions.close")}
        onClose={() => setMobileNavigationOpen(false)}
        actions={
          <A26Button variant="ghost" onClick={onLogout}>
            {t("navigation.logout")}
          </A26Button>
        }
      >
        <section className="a26-shell__mobile-account" aria-label={t("settings.account")}>
          <span className="a26-shell__avatar" aria-hidden="true">{user?.name?.[0] || "A"}</span>
          <div>
            <strong>{user?.name || t("common.appName")}</strong>
            <small>{roleLabel} · {t("settings.noNotifications")}</small>
          </div>
          {profileItem ? (
            <A26Button variant="liquid" onClick={() => goTo(profileItem.href)}>
              {t("navigation.profile")}
            </A26Button>
          ) : null}
        </section>
        <nav className="a26-shell__mobile-menu" aria-label={t("shell.modules")}>
          {items.map(item => (
            <button
              key={item.href}
              type="button"
              className={item.active ? "is-active" : ""}
              aria-current={item.active ? "page" : undefined}
              onClick={() => goTo(item.href)}
            >
              <LineIcon name={item.icon} className="h-5 w-5" />
              <span>{item.label}</span>
              {item.active ? <small>{t("shell.currentRoute")}</small> : null}
            </button>
          ))}
        </nav>
      </A26Modal>
    </div>
  );
}
