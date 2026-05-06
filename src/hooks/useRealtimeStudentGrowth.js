import { useEffect, useMemo, useState } from "react";

export default function useRealtimeStudentGrowth(initialStats, growthData) {
  const [stats, setStats] = useState(() => ({
    ...initialStats,
    lastUpdated: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }));
  const [chartData, setChartData] = useState(growthData);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const increment = Math.floor(Math.random() * 3);

      setStats(prev => {
        const nextRegistered = Math.min(prev.registeredStudents + increment, prev.contractedCapacity);
        const activeIncrement = increment > 0 ? Math.floor(Math.random() * 2) : 0;
        const nextActive = Math.min(prev.activeStudents + activeIncrement, nextRegistered);
        return {
          ...prev,
          registeredStudents: nextRegistered,
          activeStudents: nextActive,
          inactiveStudents: Math.max(nextRegistered - nextActive, 0),
          currentMonthStudents: nextRegistered,
          newStudentsThisMonth: prev.newStudentsThisMonth + increment,
          lastUpdated: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        };
      });

      if (increment > 0) {
        setChartData(prev => prev.map((item, index) => {
          if (index !== prev.length - 1) return item;
          return {
            ...item,
            newStudents: item.newStudents + increment,
            accumulated: Math.min(item.accumulated + increment, initialStats.contractedCapacity)
          };
        }));
      }
    }, 10000);

    return () => window.clearInterval(interval);
  }, [initialStats.contractedCapacity]);

  const derived = useMemo(() => {
    const remainingSlots = Math.max(stats.contractedCapacity - stats.registeredStudents, 0);
    const occupancyRate = (stats.registeredStudents / stats.contractedCapacity) * 100;
    const monthlyGrowthPercent = ((stats.currentMonthStudents - stats.previousMonthStudents) / stats.previousMonthStudents) * 100;

    return {
      ...stats,
      remainingSlots,
      occupancyRate,
      monthlyGrowthPercent,
      chartData
    };
  }, [chartData, stats]);

  return derived;
}
