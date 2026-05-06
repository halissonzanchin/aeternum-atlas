import { useEffect, useState } from "react";

export default function useRealtimeGlobalAnalytics(initialSnapshot) {
  const [analytics, setAnalytics] = useState(() => ({
    ...initialSnapshot,
    lastUpdated: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setAnalytics(prev => {
        const statusRoll = Math.random();
        const platformStatus = statusRoll > 0.94 ? "degradado" : "online";
        const responseDelta = Math.floor(Math.random() * 40) - 20;
        const activeDelta = Math.floor(Math.random() * 11) - 5;
        const accessDelta = Math.floor(Math.random() * 5);
        const newErrors = Math.random() > 0.86 ? 1 : 0;

        return {
          ...prev,
          activeUsersNow: Math.max(0, prev.activeUsersNow + activeDelta),
          accessesToday: prev.accessesToday + accessDelta,
          accessesThisMonth: prev.accessesThisMonth + accessDelta,
          totalStudyHoursThisMonth: Number((prev.totalStudyHoursThisMonth + accessDelta * 0.08).toFixed(1)),
          averageResponseTimeMs: Math.max(120, prev.averageResponseTimeMs + responseDelta),
          errorsThisMonth: prev.errorsThisMonth + newErrors,
          platformStatus,
          lastUpdated: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        };
      });
    }, 10000);

    return () => window.clearInterval(interval);
  }, []);

  return analytics;
}
