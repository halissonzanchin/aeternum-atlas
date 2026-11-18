import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  fetchStudentNotifications,
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUSES
} from "../services/notifications/institutionalNotificationService.js";

const InstitutionalNotificationContext = createContext(null);

const POLLING_INTERVAL_MS = 180000; // 3 minutos (baixo consumo e sem sobrecarga)

export function InstitutionalNotificationProvider({ children, user }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dismissedBannerIds, setDismissedBannerIds] = useState(() => new Set());
  const timerRef = useRef(null);

  const loadNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const { data, error: fetchErr } = await fetchStudentNotifications({ limit: 50 });
      if (fetchErr) {
        setError(fetchErr);
      } else {
        setNotifications(data || []);
        setError(null);
      }
    } catch (err) {
      setError(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Polling leve e atualização ao focar a aba
  useEffect(() => {
    loadNotifications(false);

    timerRef.current = setInterval(() => {
      loadNotifications(true);
    }, POLLING_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadNotifications(true);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadNotifications, user?.id]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Alerta discreto para manutenções em andamento ou iniciando nas próximas 2 horas
  const activeMaintenance = useMemo(() => {
    const now = Date.now();
    const twoHoursMs = 2 * 60 * 60 * 1000;

    return notifications.find(n => {
      if (dismissedBannerIds.has(n.id)) return false;

      // Se estiver em andamento
      if (n.status === NOTIFICATION_STATUSES.IN_PROGRESS || n.type === NOTIFICATION_TYPES.MAINTENANCE_IN_PROGRESS) {
        return true;
      }

      // Se for manutenção programada com início próximo (<= 2h)
      if (
        (n.type === NOTIFICATION_TYPES.SCHEDULED_MAINTENANCE || n.status === NOTIFICATION_STATUSES.SCHEDULED) &&
        n.scheduledStartAt
      ) {
        const startTime = new Date(n.scheduledStartAt).getTime();
        const diff = startTime - now;
        return diff > 0 && diff <= twoHoursMs;
      }

      return false;
    }) || null;
  }, [notifications, dismissedBannerIds]);

  const markAsRead = useCallback(async (notificationId) => {
    // Atualização otimista
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
    );
    await apiMarkAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(async () => {
    // Atualização otimista
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    await apiMarkAllAsRead();
  }, []);

  const dismissBanner = useCallback((notificationId) => {
    setDismissedBannerIds(prev => new Set([...prev, notificationId]));
  }, []);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    activeMaintenance,
    loading,
    error,
    refreshNotifications: () => loadNotifications(false),
    markAsRead,
    markAllAsRead,
    dismissBanner
  }), [notifications, unreadCount, activeMaintenance, loading, error, loadNotifications, markAsRead, markAllAsRead, dismissBanner]);

  return (
    <InstitutionalNotificationContext.Provider value={value}>
      {children}
    </InstitutionalNotificationContext.Provider>
  );
}

export function useInstitutionalNotifications() {
  const context = useContext(InstitutionalNotificationContext);
  if (!context) {
    // Fallback gracioso caso um componente renderize fora do Provider
    return {
      notifications: [],
      unreadCount: 0,
      activeMaintenance: null,
      loading: false,
      error: null,
      refreshNotifications: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      dismissBanner: () => {}
    };
  }
  return context;
}
