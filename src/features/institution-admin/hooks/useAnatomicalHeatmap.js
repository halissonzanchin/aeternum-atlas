import { useState, useEffect } from "react";
import { fetchAnatomicalHeatmap } from "../../../services/academic/anatomicalHeatmapService";
import { useAuth } from "../../../context/AuthContext";

export function useAnatomicalHeatmap() {
  const { user } = useAuth();
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
      const result = await fetchAnatomicalHeatmap(institutionId, user);
      
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
