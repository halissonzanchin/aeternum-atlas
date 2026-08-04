import React from 'react';

export default function HeroCoreFallback() {
  return (
    <div 
      className="hero-core-fallback" 
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        opacity: 0.85
      }}
    >
      <svg 
        width="300" 
        height="300" 
        viewBox="0 0 300 300" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0px 0px 20px rgba(0, 240, 255, 0.12))' }}
      >
        {/* Conexões (Sinapses discretas) */}
        <path d="M150 50 L100 120 L200 130 Z" stroke="#00f0ff" strokeOpacity="0.14" strokeWidth="1"/>
        <path d="M100 120 L120 220 L200 130" stroke="#00f0ff" strokeOpacity="0.14" strokeWidth="1"/>
        <path d="M150 50 L250 100 L200 130" stroke="#00f0ff" strokeOpacity="0.14" strokeWidth="1"/>
        <path d="M50 150 L100 120 L120 220" stroke="#00f0ff" strokeOpacity="0.14" strokeWidth="1"/>
        <path d="M120 220 L220 200 L200 130" stroke="#00f0ff" strokeOpacity="0.14" strokeWidth="1"/>
        <path d="M150 260 L120 220 L220 200 Z" stroke="#00f0ff" strokeOpacity="0.14" strokeWidth="1"/>

        {/* Células base (Anatomical Teal / Graphite) */}
        <circle cx="150" cy="50" r="14" fill="#041d24" />
        <circle cx="250" cy="100" r="10" fill="#2d3748" />
        <circle cx="200" cy="130" r="16" fill="#041d24" />
        <circle cx="100" cy="120" r="12" fill="#2d3748" />
        <circle cx="50" cy="150" r="9" fill="#041d24" />
        <circle cx="120" cy="220" r="15" fill="#041d24" />
        <circle cx="220" cy="200" r="11" fill="#2d3748" />
        <circle cx="150" cy="260" r="10" fill="#041d24" />

        {/* Destaques (Highlights: Cyan / Gold) */}
        <circle cx="150" cy="50" r="3" fill="#00f0ff" />
        <circle cx="200" cy="130" r="3" fill="#ffc107" />
        <circle cx="120" cy="220" r="3" fill="#00f0ff" />
        <circle cx="250" cy="100" r="2" fill="#00f0ff" />
      </svg>
    </div>
  );
}
