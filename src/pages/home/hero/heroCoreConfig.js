export const HERO_CORE_CONFIG = {
  desktop: {
    mainCells: 200,
    highlightCells: 15,
    connections: 110,
    dpr: [1, 1.5],
  },

  tablet: {
    mainCells: 120,
    highlightCells: 10,
    connections: 60,
    dpr: [1, 1.25],
  },

  colors: {
    baseDark: "#062a32",
    baseMid: "#0b4350",
    cyanAccent: "#18c7d4",
    goldAccent: "#c9a44c",
    softHighlight: "#d8eee9",
  },

  geometry: {
    coreRadius: 2.3,
    cellCount: 200, // We'll distribute these in 3 layers
    baseSize: 0.08,
    sizeVariance: 0.1,
  },

  motion: {
    rotationSpeedY: 0.035,
    rotationSpeedX: 0.005,
    pulseAmount: 0.015,
    cursorRotationX: 0.12,
    cursorRotationY: 0.18,
    damping: 0.03,
  },

  connections: {
    maxDistance: 0.9,
    maxConnectionsPerCell: 3,
    opacity: 0.16,
    maxTotalLines: 120,
  },

  interaction: {
    enabled: true,
    radius: 4.5,
    strength: 0.04,
    returnStrength: 0.06,
    friction: 0.88,
    maxDisplacement: 0.5,
    activeOnlyInsideHero: true,
  },

  camera: {
    position: [0, 0, 7.5], // move camera slightly back
    fov: 38,
  },
  
  materials: {
    mainRoughness: 0.45,
    mainMetalness: 0.25,
    highlightRoughness: 0.2,
    highlightMetalness: 0.5,
    highlightEmissiveIntensity: 0.5
  }
};
