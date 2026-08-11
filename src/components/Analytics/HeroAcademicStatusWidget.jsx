import React from "react";
import "./HeroAcademicStatusWidget.css";

export default function HeroAcademicStatusWidget({
  progressPercent = 0,
  studiedModels = 0,
  totalModels = 3,
  totalStudyMinutes = 0,
  completedQuizzesCount = 0
}) {
  const displayProgress = Math.max(0, Math.min(100, Math.round(Number(progressPercent) || 0)));
  const studyHours = Math.round((totalStudyMinutes / 60) * 10) / 10;
  const modelsRatio = totalModels ? Math.round((studiedModels / totalModels) * 100) : 0;

  return (
    <div className="hero-status-widget-card fade-in-up">
      {/* Live Academic Pulse Badge */}
      <div className="hero-status-badge">
        <span className="pulse-dot" />
        <span className="badge-label">ACADEMIA • ATIVA</span>
      </div>

      {/* Modern Concentric Gauge Visual */}
      <div className="hero-gauge-wrap">
        <svg viewBox="0 0 140 140" className="hero-gauge-svg">
          <defs>
            <linearGradient id="heroOuterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4fd8c9" />
              <stop offset="100%" stopColor="#2bb3a5" />
            </linearGradient>
            <linearGradient id="heroInnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#e8836f" />
            </linearGradient>
            <filter id="heroGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Tracks */}
          <circle cx="70" cy="70" r="54" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="6" fill="none" />
          <circle cx="70" cy="70" r="44" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="4.5" fill="none" fillOpacity="0" />

          {/* Outer Arc: Model Progression */}
          <circle
            cx="70"
            cy="70"
            r="54"
            stroke="url(#heroOuterGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="339.29"
            strokeDashoffset={339.29 - (339.29 * Math.max(5, modelsRatio)) / 100}
            transform="rotate(-90 70 70)"
            filter="url(#heroGlow)"
            style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
          />

          {/* Inner Arc: Overall Academic Performance */}
          <circle
            cx="70"
            cy="70"
            r="44"
            stroke="url(#heroInnerGrad)"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="276.46"
            strokeDashoffset={276.46 - (276.46 * Math.max(5, displayProgress)) / 100}
            transform="rotate(-90 70 70)"
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />

          {/* Center Text (Mathematically Locked) */}
          <text
            x="70"
            y="64"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
            fontSize="21"
            fontWeight="700"
            fontFamily="'Space Grotesk', 'Inter', sans-serif"
          >
            {displayProgress}%
          </text>
          <text
            x="70"
            y="81"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#4fd8c9"
            fontSize="7"
            fontWeight="700"
            letterSpacing="0.8"
            fontFamily="'JetBrains Mono', monospace"
            opacity="0.9"
          >
            DESEMPENHO
          </text>
        </svg>
      </div>

      {/* Mini Coherent Metrics Summary */}
      <div className="hero-status-metrics-row">
        <div className="hero-mini-stat">
          <span className="stat-val">{studiedModels}/{totalModels}</span>
          <span className="stat-lbl">Modelos 3D</span>
        </div>
        <div className="stat-divider" />
        <div className="hero-mini-stat">
          <span className="stat-val">{studyHours}h</span>
          <span className="stat-lbl">Tempo Ativo</span>
        </div>
        <div className="stat-divider" />
        <div className="hero-mini-stat">
          <span className="stat-val">{completedQuizzesCount}</span>
          <span className="stat-lbl">Gabaritos</span>
        </div>
      </div>
    </div>
  );
}
