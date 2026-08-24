import React, { useEffect, useState } from "react";

interface JarvisHeaderProps {
  agentName?: string;
  selectedTutorName: string;
  isConnected: boolean;
}

export const JarvisHeader: React.FC<JarvisHeaderProps> = ({
  agentName = "J.A.R.V.I.S. QUANTUM",
  selectedTutorName,
  isConnected,
}) => {
  const [timeString, setTimeString] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="jarvis-header">
      <div className="jarvis-header-brand">
        <div className="jarvis-brand-logo" aria-hidden="true" />
        <div>
          <h1 className="jarvis-title">{agentName.toUpperCase()} // V4.2</h1>
          <div className="jarvis-subtitle">
            STARK AI NEURAL COCKPIT • PERSONAL EDITION
          </div>
        </div>
      </div>

      <div className="jarvis-telemetry-cluster">
        <div className="jarvis-telemetry-item">
          <span className="jarvis-telemetry-label">OPERADOR</span>
          <span className="jarvis-telemetry-val">HALISSON // LVL 5</span>
        </div>

        <div className="jarvis-telemetry-item">
          <span className="jarvis-telemetry-label">PROTOCOLO ATIVO</span>
          <span className="jarvis-telemetry-val">
            {selectedTutorName.toUpperCase()}
          </span>
        </div>

        <div className="jarvis-telemetry-item">
          <span className="jarvis-telemetry-label">HORA DO SISTEMA</span>
          <span className="jarvis-telemetry-val">
            {timeString || "00:00:00"}
          </span>
        </div>

        <div className="jarvis-telemetry-item">
          <span className="jarvis-telemetry-label">UPLINK WEBRTC</span>
          <span className="jarvis-telemetry-val">
            <span
              className="jarvis-live-dot"
              style={{ backgroundColor: isConnected ? "#00f0ff" : "#ffaa00" }}
            />
            {isConnected ? "ONLINE (LATÊNCIA < 280ms)" : "STANDBY"}
          </span>
        </div>
      </div>
    </header>
  );
};
