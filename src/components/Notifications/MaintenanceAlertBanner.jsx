import { useState } from "react";
import LineIcon from "../icons/LineIcon";
import { useInstitutionalNotifications } from "../../context/InstitutionalNotificationContext";
import { formatMaintenanceWindow, NOTIFICATION_TYPES } from "../../services/notifications/institutionalNotificationService";
import { useLanguage } from "../../context/LanguageContext";
import { A26Modal, A26Button } from "../aeternum-26";
import "./notificationCenter.css";

export default function MaintenanceAlertBanner() {
  const { activeMaintenance, dismissBanner } = useInstitutionalNotifications();
  const { language } = useLanguage();
  const isEs = language === "es";
  const [modalOpen, setModalOpen] = useState(false);

  if (!activeMaintenance) return null;

  const isInProgress =
    activeMaintenance.type === NOTIFICATION_TYPES.MAINTENANCE_IN_PROGRESS ||
    activeMaintenance.status === "in_progress";

  const windowLabel = formatMaintenanceWindow(
    activeMaintenance.scheduledStartAt,
    activeMaintenance.scheduledEndAt,
    language,
    activeMaintenance.timezone
  );

  return (
    <>
      <aside
        className={`a26-maintenance-banner ${isInProgress ? "is-in-progress" : ""}`}
        role="alert"
        aria-live="polite"
      >
        <div className="a26-maintenance-banner-content">
          <LineIcon name="clock" className="h-4 w-4 shrink-0 text-amber-300" />
          <div className="truncate">
            <strong>{activeMaintenance.title}:</strong>{" "}
            <span>
              {isInProgress
                ? (isEs ? "Actualización en curso en la plataforma." : "Atualização em andamento na plataforma.")
                : windowLabel
                ? `${isEs ? "Prevista para" : "Prevista para"} ${windowLabel}.`
                : (isEs ? "Actualización programada en breve." : "Atualização programada em breve.")}
            </span>
          </div>
        </div>

        <div className="a26-maintenance-banner-actions">
          <button
            type="button"
            className="text-xs font-semibold underline hover:text-white"
            onClick={() => setModalOpen(true)}
          >
            {isEs ? "Ver detalles" : "Ver detalhes"}
          </button>
          <button
            type="button"
            className="p-1 hover:text-white rounded"
            onClick={() => dismissBanner(activeMaintenance.id)}
            title={isEs ? "Ocultar aviso" : "Ocultar aviso"}
            aria-label={isEs ? "Ocultar aviso" : "Ocultar aviso"}
          >
            <LineIcon name="close" className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      <A26Modal
        open={modalOpen}
        title={activeMaintenance.title}
        description={windowLabel || (isEs ? "Aviso de mantenimiento" : "Aviso de manutenção")}
        onClose={() => setModalOpen(false)}
        actions={
          <A26Button variant="primary" onClick={() => setModalOpen(false)}>
            {isEs ? "Entendido" : "Entendido"}
          </A26Button>
        }
      >
        <div className="a26-notification-modal-content">
          {windowLabel ? (
            <div className="a26-notification-modal-window">
              <strong>{isEs ? "Horario previsto" : "Horário previsto"}</strong>
              <span>{windowLabel}</span>
            </div>
          ) : null}

          {activeMaintenance.affectedResources && activeMaintenance.affectedResources.length > 0 ? (
            <div>
              <small className="block mb-1 text-xs text-white/60">
                {isEs ? "Recursos afectados:" : "Recursos potencialmente afetados:"}
              </small>
              <div className="a26-notification-resources">
                {activeMaintenance.affectedResources.map(res => (
                  <span key={res} className="a26-resource-tag">{res}</span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="a26-notification-modal-message">
            {activeMaintenance.message}
          </div>
        </div>
      </A26Modal>
    </>
  );
}
