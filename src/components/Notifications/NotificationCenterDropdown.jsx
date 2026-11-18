import { useState, useMemo } from "react";
import {
  A26Button,
  A26EmptyState,
  A26Modal,
  A26Popover
} from "../aeternum-26";
import LineIcon from "../icons/LineIcon";
import { useInstitutionalNotifications } from "../../context/InstitutionalNotificationContext";
import {
  formatMaintenanceWindow,
  formatNotificationDate,
  formatRelativeTime,
  NOTIFICATION_TYPES
} from "../../services/notifications/institutionalNotificationService";
import { useLanguage } from "../../context/LanguageContext";
import "./notificationCenter.css";

export default function NotificationCenterDropdown({ open, onClose, triggerRef }) {
  const { language } = useLanguage();
  const isEs = language === "es";

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading
  } = useInstitutionalNotifications();

  const [activeTab, setActiveTab] = useState("all"); // "all" | "unread" | "maintenance"
  const [selectedNotification, setSelectedNotification] = useState(null);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeTab === "unread") return !n.isRead;
      if (activeTab === "maintenance") {
        return (
          n.type === NOTIFICATION_TYPES.SCHEDULED_MAINTENANCE ||
          n.type === NOTIFICATION_TYPES.MAINTENANCE_IN_PROGRESS ||
          n.type === NOTIFICATION_TYPES.MAINTENANCE_COMPLETED ||
          n.type === NOTIFICATION_TYPES.MAINTENANCE_POSTPONED ||
          n.type === NOTIFICATION_TYPES.MAINTENANCE_CANCELLED
        );
      }
      return true;
    });
  }, [notifications, activeTab]);

  function getTypeLabel(type) {
    switch (type) {
      case NOTIFICATION_TYPES.SCHEDULED_MAINTENANCE:
        return isEs ? "Actualización programada" : "Atualização programada";
      case NOTIFICATION_TYPES.MAINTENANCE_IN_PROGRESS:
        return isEs ? "En curso" : "Em andamento";
      case NOTIFICATION_TYPES.MAINTENANCE_COMPLETED:
        return isEs ? "Concluida" : "Concluída";
      case NOTIFICATION_TYPES.MAINTENANCE_POSTPONED:
        return isEs ? "Pospuesta" : "Adiada";
      case NOTIFICATION_TYPES.MAINTENANCE_CANCELLED:
        return isEs ? "Cancelada" : "Cancelada";
      case NOTIFICATION_TYPES.PLATFORM_IMPROVEMENT:
        return isEs ? "Mejora" : "Melhoria";
      case NOTIFICATION_TYPES.INSTITUTIONAL_ANNOUNCEMENT:
      default:
        return isEs ? "Comunicado" : "Comunicado";
    }
  }

  function handleCardClick(notification) {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  }

  return (
    <>
      <A26Popover
        open={open}
        label={isEs ? "Centro de notificaciones" : "Central de notificações"}
        onClose={onClose}
        className="a26-shell__popover a26-notifications-popover"
      >
        <header className="a26-notifications-header">
          <div className="flex items-center gap-2">
            <h2>{isEs ? "Notificaciones" : "Notificações"}</h2>
            {unreadCount > 0 ? (
              <span className="a26-notifications-unread-pill">
                {unreadCount} {isEs ? "no leídas" : "não lidas"}
              </span>
            ) : null}
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="a26-notifications-mark-all-btn"
              onClick={markAllAsRead}
              title={isEs ? "Marcar todas como leídas" : "Marcar todas como lidas"}
            >
              {isEs ? "Marcar leídas" : "Marcar lidas"}
            </button>
          ) : null}
        </header>

        <nav className="a26-notifications-tabs" aria-label="Filtros de notificações">
          <button
            type="button"
            className={`a26-notifications-tab ${activeTab === "all" ? "is-active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            {isEs ? "Todas" : "Todas"} ({notifications.length})
          </button>
          <button
            type="button"
            className={`a26-notifications-tab ${activeTab === "unread" ? "is-active" : ""}`}
            onClick={() => setActiveTab("unread")}
          >
            {isEs ? "No leídas" : "Não lidas"} ({unreadCount})
          </button>
          <button
            type="button"
            className={`a26-notifications-tab ${activeTab === "maintenance" ? "is-active" : ""}`}
            onClick={() => setActiveTab("maintenance")}
          >
            {isEs ? "Mantenimiento" : "Manutenções"}
          </button>
        </nav>

        <section className="a26-notifications-list" aria-live="polite">
          {filteredNotifications.length === 0 ? (
            <A26EmptyState
              title={
                activeTab === "unread"
                  ? (isEs ? "Sin notificaciones pendientes" : "Nenhuma notificação não lida")
                  : activeTab === "maintenance"
                  ? (isEs ? "Sin mantenimientos" : "Nenhuma manutenção programada")
                  : (isEs ? "Sin notificaciones" : "Nenhuma notificação")
              }
              text={
                isEs
                  ? "Las novedades y avisos de mantenimiento aparecerán aquí."
                  : "As novidades e avisos de manutenção da plataforma aparecerão aqui."
              }
            />
          ) : (
            filteredNotifications.map(notification => {
              const windowLabel = formatMaintenanceWindow(
                notification.scheduledStartAt,
                notification.scheduledEndAt,
                language,
                notification.timezone
              );

              return (
                <article
                  key={notification.id}
                  className={`a26-notification-card ${!notification.isRead ? "is-unread" : ""}`}
                  onClick={() => handleCardClick(notification)}
                >
                  <div className="a26-notification-card-header">
                    <span className={`a26-notification-type-pill a26-type-${notification.type}`}>
                      {getTypeLabel(notification.type)}
                    </span>
                    <span className="a26-notification-time">
                      {formatRelativeTime(notification.publishedAt || notification.createdAt, language)}
                    </span>
                  </div>

                  <h3 className="a26-notification-title">{notification.title}</h3>

                  {windowLabel ? (
                    <div className="a26-notification-schedule-box">
                      <LineIcon name="clock" className="h-3.5 w-3.5" />
                      <span>{windowLabel}</span>
                    </div>
                  ) : null}

                  {notification.affectedResources && notification.affectedResources.length > 0 ? (
                    <div className="a26-notification-resources">
                      {notification.affectedResources.map(res => (
                        <span key={res} className="a26-resource-tag">{res}</span>
                      ))}
                    </div>
                  ) : null}

                  <p className="a26-notification-snippet">{notification.message}</p>
                </article>
              );
            })
          )}
        </section>
      </A26Popover>

      {/* Modal de Leitura Integral de Comunicado */}
      <A26Modal
        open={Boolean(selectedNotification)}
        title={selectedNotification?.title || (isEs ? "Detalles del comunicado" : "Detalhes do comunicado")}
        description={
          selectedNotification
            ? `${getTypeLabel(selectedNotification.type)} · ${formatNotificationDate(selectedNotification.publishedAt || selectedNotification.createdAt, language, selectedNotification.timezone)}`
            : ""
        }
        onClose={() => setSelectedNotification(null)}
        actions={
          <A26Button variant="primary" onClick={() => setSelectedNotification(null)}>
            {isEs ? "Cerrar" : "Fechar"}
          </A26Button>
        }
      >
        {selectedNotification ? (
          <div className="a26-notification-modal-content">
            {selectedNotification.scheduledStartAt ? (
              <div className="a26-notification-modal-window">
                <strong>{isEs ? "Ventana programada (Horario de Brasilia)" : "Janela programada (Horário de Brasília)"}</strong>
                <span>
                  {formatMaintenanceWindow(
                    selectedNotification.scheduledStartAt,
                    selectedNotification.scheduledEndAt,
                    language,
                    selectedNotification.timezone
                  )}
                </span>
              </div>
            ) : null}

            {selectedNotification.affectedResources && selectedNotification.affectedResources.length > 0 ? (
              <div>
                <small className="block mb-1 text-xs text-white/60">
                  {isEs ? "Recursos afectados:" : "Recursos potencialmente afetados:"}
                </small>
                <div className="a26-notification-resources">
                  {selectedNotification.affectedResources.map(res => (
                    <span key={res} className="a26-resource-tag">{res}</span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="a26-notification-modal-message">
              {selectedNotification.message}
            </div>
          </div>
        ) : null}
      </A26Modal>
    </>
  );
}
