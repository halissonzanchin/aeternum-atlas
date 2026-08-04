import { useEffect, useRef } from "react";
import { startTrackedLearningSession } from "../services/learningTelemetryService";

export function useAccountLearningSession(user, enabled = true) {
  const trackerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !user?.id) return undefined;

    const tracker = startTrackedLearningSession({
      user,
      scope: "account"
    });
    trackerRef.current = tracker;

    return () => {
      tracker.stop("account_session_changed");
      if (trackerRef.current === tracker) trackerRef.current = null;
    };
  }, [enabled, user?.id, user?.institutionId, user?.institution_id]);

  return trackerRef;
}

