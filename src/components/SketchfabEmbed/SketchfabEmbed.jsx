import { useEffect, useState } from "react";
import "./SketchfabEmbed.css";

const HEART_EMBED_URL = "https://sketchfab.com/models/fd61a9605f4148a9b5274463f7adbcb5/embed";

export default function SketchfabEmbed({ title, embedUrl, modelUrl }) {
  const [showFallback, setShowFallback] = useState(false);
  const safeEmbedUrl = embedUrl || HEART_EMBED_URL;

  useEffect(() => {
    setShowFallback(false);
    const timer = window.setTimeout(() => setShowFallback(true), 6500);
    return () => window.clearTimeout(timer);
  }, [safeEmbedUrl]);

  return (
    <div>
      <div className="sketchfab-viewer">
        <iframe
          title={title || "Corazon Humano - 3D Modelo"}
          src={safeEmbedUrl}
          frameBorder="0"
          allowFullScreen
          mozallowfullscreen="true"
          webkitallowfullscreen="true"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          xr-spatial-tracking="true"
          execution-while-out-of-viewport="true"
          execution-while-not-rendered="true"
          web-share="true"
          className="sketchfab-viewer__iframe"
        />
      </div>

      {showFallback && modelUrl ? (
        <a
          href={modelUrl}
          target="_blank"
          rel="noreferrer"
          className="viewer-external-link"
        >
          Abrir modelo diretamente no Sketchfab
        </a>
      ) : null}
    </div>
  );
}
