import { useViewer } from './ViewerContext';
import RightToolbar from '../../components/RightToolbar/RightToolbar';
import SearchOverlay from '../../components/SearchOverlay/SearchOverlay';
import SettingsPanel from '../../components/SettingsPanel/SettingsPanel';
import LineIcon from '../../components/icons/LineIcon';
import { useLanguage } from '../../context/LanguageContext';

function HelpModal({ open, onClose }) {
  const { t } = useLanguage();
  if (!open) return null;

  const items = [t("viewer.supportItems.platformGuide"), t("viewer.supportItems.study3d"), t("viewer.supportItems.customerService"), t("viewer.supportItems.technicalSupport")];

  return (
    <div className="viewer-modal-backdrop" role="dialog" aria-modal="true">
      <div className="viewer-modal">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="viewer-eyebrow">{t("viewer.helpTitle")}</p>
            <h2 className="mt-2 text-2xl font-bold text-clinicalWhite">{t("viewer.supportTitle")}</h2>
          </div>
          <button className="viewer-icon-button" onClick={onClose} aria-label={t("viewer.closeHelp")} data-tooltip={t("viewer.closeHelp")}>
            <LineIcon name="close" />
          </button>
        </div>
        <div className="mt-6 grid gap-3">
          {items.map(item => (
            <button key={item} className="viewer-list-row text-left">
              <span>{item}</span>
              <LineIcon name="chevron" className="h-4 w-4 text-techTeal" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ViewerControls() {
  const {
    navigate,
    user,
    availableModels,
    structures,
    handleSelectStructure,
    setToast,
    onLogout,
    searchOpen,
    setSearchOpen,
    settingsOpen,
    setSettingsOpen,
    helpOpen,
    setHelpOpen,
    handleViewerAction,
    setLeftOpen,
    setMarkerOpen
  } = useViewer();

  function handleRightAction(action) {
    const actions = {
      hub: () => navigate("/dashboard"),
      search: () => setSearchOpen(true),
      library: () => navigate("/models"),
      settings: () => setSettingsOpen(true),
      guide: () => handleViewerAction("Ver guia de estudo"),
      help: () => setHelpOpen(true),
      painel: () => setLeftOpen?.(v => !v) || document.querySelector('.viewer-topbar .viewer-soft-button')?.click(),
      marcadores: () => setMarkerOpen?.(v => !v) || handleViewerAction("Marcadores"),
      simulado: () => handleViewerAction("Simulado Teórico"),
      tutor: () => document.querySelector('.aeternum-ai-orb-root')?.click(),
      camadas: () => {
         // Se não estiver visível (não for segmentado), exibe um aviso
         if (!structures || structures.length === 0) {
            setToast("Camadas nativas disponíveis apenas no Atlas Native Engine.");
         } else {
            setToast("Painel de camadas focado.");
         }
      },
      native: () => {
         setToast("Usar motor nativo para marcadores autorais, Render Studio e camadas completas.");
         setTimeout(() => {
           const url = new URL(window.location.href);
           url.searchParams.set("engine", "native");
           window.location.href = url.toString();
         }, 1500);
      }
    };
    actions[action]?.();
  }

  return (
    <>
      <RightToolbar onAction={handleRightAction} />

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        models={availableModels}
        structures={structures}
        onSelectStructure={handleSelectStructure}
        onOpenModel={modelId => navigate(`/viewer/${modelId}`)}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        notify={setToast}
        onLogout={onLogout}
      />

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
