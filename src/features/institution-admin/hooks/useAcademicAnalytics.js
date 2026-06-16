import { useState, useEffect } from "react";
import { fetchAcademicAnalytics } from "../../../services/academic/academicAnalyticsService";
import { useAuth } from "../../../context/AuthContext";

export function useAcademicAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    async function loadData() {
      const institutionId = user?.institutionId || user?.institution_id;
      if (!institutionId) {
        if (mounted) {
          setLoading(false);
          setError("Institution ID not found");
        }
        return;
      }

      setLoading(true);
      const result = await fetchAcademicAnalytics(institutionId);
      
      if (mounted) {
        if (result.error && result.totalAttempts === 0) {
           // We might still want to show the empty state even if error, but track error
           setError(result.error);
        } else {
           setError(null);
        }
        setData(result);
        setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [user]);

  return { data, loading, error };
}
