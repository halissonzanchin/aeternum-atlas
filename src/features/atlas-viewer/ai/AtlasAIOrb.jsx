import React from 'react';
import './AtlasAIOrb.css';

export default function AtlasAIOrb({ onClick, state = 'idle', size = 'md' }) {
  return (
    <div className={`aeternum-ai-orb-root state-${state} size-${size}`} onClick={onClick}>
      <div className="aeternum-ai-orb-siri-container">
        <div className="siri-bg-base"></div>
        <div className="siri-blob siri-blob-1"></div>
        <div className="siri-blob siri-blob-2"></div>
        <div className="siri-blob siri-blob-3"></div>
        <div className="siri-blob siri-blob-4"></div>
        <div className="siri-blob siri-blob-5"></div>
        <div className="siri-blob siri-blob-6"></div>
        <div className="siri-blob siri-blob-7"></div>
        <div className="siri-blob siri-blob-8"></div>
        <div className="siri-highlight"></div>
      </div>
    </div>
  );
}
