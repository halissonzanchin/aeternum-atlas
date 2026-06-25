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
    <button 
      onClick={onClick}
      className={`atlas-ai-orb-container state-${state} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      aria-label="Tutor IA"
      title={label}
    >
      <div className="orb-halo" />
      <div className="orb-glass-shell absolute inset-0">
        <div className="orb-gradient orb-gradient-three" />
        <div className="orb-gradient orb-gradient-two" />
        <div className="orb-gradient orb-gradient-one" />
        <div className="orb-core" />
        <div className="orb-highlight" />
      </div>
      {label && <span className={`orb-label ${labelSizes[size] || labelSizes.md}`}>{label}</span>}
    </button>
  );
}
