"use client";

import React, { useEffect, useId, useRef, useState } from "react";

type LogoVariant = "full" | "symbol" | "horizontal";
type LogoTheme = "dark" | "light" | "transparent";
type LogoSize = "sm" | "md" | "lg" | "xl";

interface AeternumAtlasLogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: LogoSize;
  className?: string;
}

export default function AeternumAtlasLogo({
  variant = "full",
  theme = "dark",
  size = "lg",
  className = ""
}: AeternumAtlasLogoProps) {
  const [active, setActive] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const touchLockRef = useRef(false);
  const rawId = useId();
  const id = rawId.replace(/:/g, "");

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handlePointerDown = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    touchLockRef.current = true;
    setActive(true);
    timeoutRef.current = window.setTimeout(() => {
      touchLockRef.current = false;
      setActive(false);
    }, 1500);
  };

  const handlePointerLeave = () => {
    if (!touchLockRef.current) setActive(false);
  };

  const goldStroke = `${id}-goldStroke`;
  const sphereGlass = `${id}-sphereGlass`;
  const sphereEdge = `${id}-sphereEdge`;
  const bodyGold = `${id}-bodyGold`;
  const muscleDark = `${id}-muscleDark`;
  const boneGradient = `${id}-boneGradient`;
  const atlasGradient = `${id}-atlasGradient`;
  const softGlow = `${id}-softGlow`;
  const pointGlow = `${id}-pointGlow`;
  const sphereClip = `${id}-sphereClip`;

  return (
    <div
      className={`aeternum-logo aeternum-logo--${variant} aeternum-logo--${theme} aeternum-logo--${size} ${active ? "is-active" : ""} ${className}`}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      role="img"
      aria-label="Aeternum Atlas — Biblioteca Anatômica 3D"
    >
      <div className="aeternum-logo__symbol">
        <svg
          viewBox="0 0 520 620"
          xmlns="http://www.w3.org/2000/svg"
          className="aeternum-logo__svg"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <radialGradient id={sphereGlass} cx="48%" cy="34%" r="62%">
              <stop offset="0%" stopColor="#FFF2C4" stopOpacity="0.34" />
              <stop offset="34%" stopColor="#FFD76A" stopOpacity="0.16" />
              <stop offset="68%" stopColor="#111827" stopOpacity="0.44" />
              <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0.18" />
            </radialGradient>

            <radialGradient id={sphereEdge} cx="50%" cy="52%" r="58%">
              <stop offset="0%" stopColor="#FFD76A" stopOpacity="0" />
              <stop offset="72%" stopColor="#F5D98B" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#FFD76A" stopOpacity="0.82" />
            </radialGradient>

            <linearGradient id={goldStroke} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2C4" />
              <stop offset="38%" stopColor="#F5D98B" />
              <stop offset="70%" stopColor="#C6A85C" />
              <stop offset="100%" stopColor="#7A5C22" />
            </linearGradient>

            <linearGradient id={bodyGold} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5D98B" />
              <stop offset="48%" stopColor="#C98632" />
              <stop offset="100%" stopColor="#5A3217" />
            </linearGradient>

            <linearGradient id={muscleDark} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD76A" stopOpacity="0.8" />
              <stop offset="48%" stopColor="#7A3F1B" />
              <stop offset="100%" stopColor="#24110A" />
            </linearGradient>

            <linearGradient id={boneGradient} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5F5F5" />
              <stop offset="56%" stopColor="#D9C7A3" />
              <stop offset="100%" stopColor="#8B7437" />
            </linearGradient>

            <linearGradient id={atlasGradient} x1="18%" y1="0%" x2="82%" y2="100%">
              <stop offset="0%" stopColor="#2A2F36" />
              <stop offset="44%" stopColor="#0A0A0A" />
              <stop offset="100%" stopColor="#C6A85C" stopOpacity="0.5" />
            </linearGradient>

            <filter id={softGlow} x="-45%" y="-45%" width="190%" height="190%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id={pointGlow} x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <clipPath id={sphereClip}>
              <circle cx="260" cy="222" r="156" />
            </clipPath>
          </defs>

          <g className="logo-orbit-group">
            <circle
              className="logo-orbit"
              cx="260"
              cy="222"
              r="204"
              fill="none"
              stroke={`url(#${goldStroke})`}
              strokeWidth="2"
              opacity="0.86"
            />
            <circle cx="260" cy="222" r="200" fill="none" stroke="#FFD76A" strokeOpacity="0.12" strokeWidth="0.8" />
          </g>

          <g className="logo-lights">
            {[
              ["logo-light-1", 260, 18, 5.8],
              ["logo-light-2", 406, 77, 4.8],
              ["logo-light-3", 451, 278, 4.8],
              ["logo-light-4", 114, 77, 4.8],
              ["logo-light-5", 69, 278, 4.8]
            ].map(([classNameValue, cx, cy, r]) => (
              <g key={classNameValue} className={`logo-light ${classNameValue}`} filter={`url(#${pointGlow})`}>
                <circle cx={cx as number} cy={cy as number} r={(r as number) * 2.7} fill="#FFD76A" opacity="0.12" />
                <circle cx={cx as number} cy={cy as number} r={r as number} fill="#FFD76A" />
              </g>
            ))}
          </g>

          <g className="logo-sphere-group">
            <circle
              className="logo-sphere"
              cx="260"
              cy="222"
              r="156"
              fill={`url(#${sphereGlass})`}
              stroke={`url(#${goldStroke})`}
              strokeWidth="2"
              filter={`url(#${softGlow})`}
            />
            <circle className="logo-sphere-edge" cx="260" cy="222" r="156" fill={`url(#${sphereEdge})`} opacity="0.64" />
            <ellipse className="logo-glass-highlight" cx="220" cy="134" rx="92" ry="38" fill="#FFF2C4" opacity="0.12" transform="rotate(-22 220 134)" />
            <path className="logo-glass-rim" d="M112 269 C165 329 353 357 411 274" fill="none" stroke="#FFD76A" strokeOpacity="0.42" strokeWidth="3" />
          </g>

          <g clipPath={`url(#${sphereClip})`}>
            <rect x="98" y="62" width="324" height="326" fill="#0A0A0A" opacity="0.13" />

            <g className="logo-network" opacity="0.5" stroke="#C6A85C" strokeWidth="1" fill="none">
              <path d="M122 202 C174 144, 218 274, 259 165 C310 84, 358 220, 405 153" />
              <path d="M132 287 C185 247, 222 308, 270 258 C321 213, 363 292, 411 246" />
              <path d="M160 113 C208 151, 240 105, 282 135 C326 166, 360 112, 397 150" />
              <path d="M145 339 C208 316, 232 360, 276 330 C322 297, 366 348, 406 318" />
              <path d="M123 246 C184 226, 228 236, 270 218 C328 193, 369 208, 414 188" />
            </g>

            <g className="logo-organ-lines" opacity="0.4" stroke="#F5D98B" strokeWidth="1.2" fill="none">
              <path d="M160 120 C142 104, 144 78, 171 73 C188 52, 226 65, 220 98 C239 120, 204 143, 183 127 C178 138, 166 133, 160 120Z" />
              <path d="M354 120 C336 104, 338 78, 365 73 C382 52, 420 65, 414 98 C433 120, 398 143, 377 127 C372 138, 360 133, 354 120Z" />
              <path d="M380 224 C401 190, 443 211, 431 251 C422 282, 395 302, 382 320 C368 296, 337 282, 329 252 C319 214, 358 191, 380 224Z" />
            </g>

            <g className="logo-human" transform="translate(260 214)">
              <line className="logo-human-axis" x1="0" y1="-136" x2="0" y2="164" stroke="#FFD76A" strokeWidth="3.2" filter={`url(#${softGlow})`} />

              <circle cx="0" cy="-113" r="19" fill={`url(#${boneGradient})`} stroke="#F5D98B" strokeWidth="1.4" />
              <path d="M-8 -117 H8 M-9 -105 C-3 -100 3 -100 9 -105 M-4 -112 V-104" stroke="#0A0A0A" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.72" />

              <path className="logo-human-arm left" d="M-14 -70 C-60 -82 -101 -80 -139 -58" stroke={`url(#${bodyGold})`} strokeWidth="9" strokeLinecap="round" fill="none" />
              <path className="logo-human-arm right" d="M14 -70 C60 -82 101 -80 139 -58" stroke={`url(#${boneGradient})`} strokeWidth="8" strokeLinecap="round" fill="none" />
              <circle cx="-144" cy="-56" r="5" fill="#F5D98B" opacity="0.85" />
              <circle cx="144" cy="-56" r="5" fill="#F5D98B" opacity="0.85" />

              <path
                className="logo-muscle-torso"
                d="M-4 -88 C-39 -61 -48 -17 -43 29 C-39 72 -24 107 -6 131 L-1 131 L-1 -90Z"
                fill={`url(#${muscleDark})`}
                opacity="0.96"
              />
              <path className="logo-muscle-line" d="M-12 -68 C-33 -53 -35 -25 -17 -8 M-16 0 C-37 18 -32 54 -9 79 M-36 -34 C-26 -27 -17 -27 -8 -35 M-34 -10 C-24 -4 -16 -5 -8 -13 M-29 18 C-22 24 -14 24 -7 17" stroke="#FFD76A" strokeOpacity="0.52" strokeWidth="1.7" fill="none" strokeLinecap="round" />

              <g className="logo-skeleton" stroke={`url(#${boneGradient})`} strokeWidth="2.8" fill="none" strokeLinecap="round">
                <path d="M7 -89 C35 -58 41 23 13 130" />
                <path d="M14 -64 C47 -61 56 -47 17 -40" />
                <path d="M15 -45 C53 -42 58 -25 17 -22" />
                <path d="M16 -25 C52 -22 56 -5 16 -4" />
                <path d="M16 -5 C48 -3 50 14 15 16" />
                <path d="M15 17 C43 21 44 38 13 39" />
                <path d="M7 91 C26 112 44 130 60 151" />
                <path d="M60 151 L82 176" />
                <circle cx="41" cy="130" r="7" />
              </g>

              <path d="M-8 126 C-28 153 -39 179 -51 207" stroke="#C98632" strokeWidth="10" strokeLinecap="round" fill="none" />
              <path d="M10 126 C29 151 39 178 52 207" stroke={`url(#${boneGradient})`} strokeWidth="8.5" strokeLinecap="round" fill="none" />
            </g>
          </g>

          <g className="logo-atlas" transform="translate(260 456)">
            <path className="logo-atlas-arm left" d="M-45 -74 C-77 -118 -111 -151 -149 -194" stroke={`url(#${atlasGradient})`} strokeWidth="18" strokeLinecap="round" fill="none" />
            <path className="logo-atlas-arm right" d="M45 -74 C77 -118 111 -151 149 -194" stroke={`url(#${atlasGradient})`} strokeWidth="18" strokeLinecap="round" fill="none" />
            <path d="M-151 -196 C-160 -205 -158 -219 -146 -226" stroke="#C6A85C" strokeWidth="2" fill="none" />
            <path d="M151 -196 C160 -205 158 -219 146 -226" stroke="#C6A85C" strokeWidth="2" fill="none" />

            <circle cx="0" cy="-86" r="23" fill={`url(#${atlasGradient})`} stroke="#C6A85C" strokeWidth="1.8" />
            <path d="M-34 -57 C-62 -31 -78 7 -83 48 C-51 58 -22 42 -7 15 C-4 -12 -10 -38 -34 -57Z" fill={`url(#${atlasGradient})`} stroke="#C6A85C" strokeWidth="1.4" />
            <path d="M34 -57 C62 -31 78 7 83 48 C51 58 22 42 7 15 C4 -12 10 -38 34 -57Z" fill={`url(#${atlasGradient})`} stroke="#C6A85C" strokeWidth="1.4" />
            <path d="M-46 -44 C-17 -27 17 -27 46 -44 M-55 -10 C-22 7 22 7 55 -10 M-34 22 C-12 34 12 34 34 22" stroke="#F5D98B" strokeOpacity="0.28" strokeWidth="2" fill="none" />

            <path d="M-55 44 C-80 84 -93 120 -102 153 L-31 153 C-16 113 3 81 24 51Z" fill={`url(#${atlasGradient})`} stroke="#C6A85C" strokeWidth="1.4" />
            <path d="M24 51 C57 82 79 118 93 153 L27 153 C13 115 -2 88 -22 58Z" fill={`url(#${atlasGradient})`} stroke="#C6A85C" strokeWidth="1.4" />
          </g>

          <ellipse cx="260" cy="601" rx="130" ry="14" fill="#000000" opacity="0.32" />
        </svg>
      </div>

      {variant !== "symbol" && (
        <div className="aeternum-logo__text">
          <h1>AETERNUM ATLAS</h1>
          {variant === "full" && (
            <>
              <p className="aeternum-logo__subtitle">BIBLIOTECA ANATÔMICA 3D</p>
              <span className="aeternum-logo__tagline">O corpo humano, eternizado em conhecimento.</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
