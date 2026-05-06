import { useEffect, useState } from "react";
import { getModelAnalytics } from "../../services/analyticsService";

export default function ModelAnalyticsCard({ modelId }) {
  const [analytics, setAnalytics] = useState(() => getModelAnalytics(modelId));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setAnalytics(getModelAnalytics(modelId));
    }, 1500);

    return () => window.clearInterval(interval);
  }, [modelId]);

  return (
    <section className="analytics-card aa-model-usage">
      <h3>Uso do modelo</h3>

      <div className="analytics-card__grid">
        <div>
          <strong>{analytics.totalEvents}</strong>
          <span>interações registradas</span>
        </div>

        <div>
          <strong>{analytics.annotationClicks}</strong>
          <span>pontos anatômicos acessados</span>
        </div>

        <div>
          <strong>{analytics.cameraResets}</strong>
          <span>resets de câmera</span>
        </div>
      </div>
    </section>
  );
}
