import React from 'react';
import './AtlasAIImmersiveOverlay.css';

export default function AtlasAIImmersiveOverlay({ isActive, state }) {
  if (!isActive) return null;

  let statusText = "Como posso te orientar?";
  if (state === 'thinking') {
    statusText = "Aeternum está analisando o modelo...";
  } else if (state === 'listening') {
    statusText = "Como posso te orientar?";
  } else if (state === 'speaking') {
    statusText = "Resposta gerada";
  }

  return (
    <div className={`aeternum-ai-immersive-overlay is-active state-${state}`}>
      <div className="aeternum-ai-backdrop-blur" />
      <div className="aeternum-ai-edge-aura" />
      <div className="aeternum-ai-edge-aura secondary" />
      
      <div className="aeternum-ai-center-status">
        <span>Aeternum Tutor</span>
        <strong>{statusText}</strong>
      </div>
    </div>
  );
}
