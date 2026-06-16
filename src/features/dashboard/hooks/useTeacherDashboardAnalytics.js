import { useState, useEffect } from "react";
import { fetchTeacherDashboardAnalytics } from "../../../services/academic/teacherDashboardService";

export function useTeacherDashboardAnalytics(user) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const institutionId = user?.institutionId || user?.institution_id;
      if (!institutionId) {
        if (mounted) setLoading(false);
        return;
      }

      setLoading(true);
      const result = await fetchTeacherDashboardAnalytics(institutionId, user?.id);
      
      if (mounted) {
        setData(result);
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [user]);

  return { data, loading };
}
