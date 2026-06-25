import React from 'react';
import './AtlasAIOrb.css';

export default function AtlasAIOrb({ 
  state = 'idle', 
  size = 'md', 
  label = 'AI', 
  onClick,
  className = ''
}) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20'
  };

  const labelSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg'
  };

  return (
    <div className={`aeternum-ai-orb-root state-${state} ${sizeClasses[size] || sizeClasses.md} ${className}`}>
      <button 
        onClick={onClick}
        className="aeternum-ai-orb-button"
        aria-label="Tutor IA"
        title={label}
      >
        <span className="aeternum-ai-orb-halo" />
        <span className="aeternum-ai-orb-sphere">
          <span className="aeternum-ai-orb-plasma plasma-one" />
          <span className="aeternum-ai-orb-plasma plasma-two" />
          <span className="aeternum-ai-orb-plasma plasma-three" />
          <span className="aeternum-ai-orb-core" />
          <span className="aeternum-ai-orb-highlight" />
          <span className="aeternum-ai-orb-rim" />
          {label && <span className={`aeternum-ai-orb-label ${labelSizes[size] || labelSizes.md}`}>{label}</span>}
        </span>
      </button>
    </div>
  );
}
