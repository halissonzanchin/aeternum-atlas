import { useState, useEffect } from "react";
import { fetchInstitutionRoi } from "../../../services/academic/institutionRoiService";
import { useAuth } from "../../../context/AuthContext";

export function useInstitutionRoi() {
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
      const result = await fetchInstitutionRoi(institutionId);
      
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
