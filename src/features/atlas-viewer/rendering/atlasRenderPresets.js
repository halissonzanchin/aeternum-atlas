export const ATLAS_RENDER_PRESETS = {
  anatomicalRealism: {
    id: 'anatomicalRealism',
    label: 'Realismo Anatômico',
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    lighting: {
      ambientIntensity: 0.2,
      hemisphereIntensity: 0.4,
      hemisphereSky: '#ffffff',
      hemisphereGround: '#444444',
      keyLightIntensity: 1.5,
      fillLightIntensity: 0.5,
      rimLightIntensity: 0.3,
      contactShadows: true
    },
    material: {
      roughness: 0.7, // Wet, organic tissue
      metalness: 0.02,
      envMapIntensity: 1.0,
      flatShading: false,
      doubleSide: true
    },
    camera: {
      fov: 45,
      toneMappingExposure: 1.2
    },
    background: '#15181E' // Dark Studio
  },

  vertexColorFaithful: {
    id: 'vertexColorFaithful',
    label: 'Cor Fiel',
    icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
    lighting: {
      // Simulating a "Shadeless" environment without completely losing form
      ambientIntensity: 1.5, // High ambient to wash out directional shadows
      hemisphereIntensity: 0.5,
      hemisphereSky: '#ffffff',
      hemisphereGround: '#ffffff',
      keyLightIntensity: 0.1, // Near zero directional
      fillLightIntensity: 0.0,
      rimLightIntensity: 0.0,
      contactShadows: false
    },
    material: {
      roughness: 1.0, // Matte, no specular highlights disrupting colors
      metalness: 0.0,
      envMapIntensity: 0.2, // Avoid environment reflections changing the hue
      flatShading: false,
      doubleSide: true
    },
    camera: {
      fov: 45,
      toneMappingExposure: 1.0
    },
    background: '#1C212B' // Clean neutral dark
  },

  clinicalDepth: {
    id: 'clinicalDepth',
    label: 'Profundidade Clínica',
    icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    lighting: {
      ambientIntensity: 0.1, // Very low ambient to force high contrast in cavities
      hemisphereIntensity: 0.2,
      hemisphereSky: '#e0e8ff',
      hemisphereGround: '#111111',
      keyLightIntensity: 1.8, // Strong directional for deep shadows
      fillLightIntensity: 0.2,
      rimLightIntensity: 0.5,
      contactShadows: true
    },
    material: {
      roughness: 0.85,
      metalness: 0.05,
      envMapIntensity: 0.8,
      flatShading: false,
      doubleSide: true
    },
    camera: {
      fov: 45,
      toneMappingExposure: 1.0
    },
    background: '#0B0E14' // Deep surgical black
  },

  performanceMobile: {
    id: 'performanceMobile',
    label: 'Performance',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    lighting: {
      ambientIntensity: 0.8,
      hemisphereIntensity: 0.0,
      hemisphereSky: '#ffffff',
      hemisphereGround: '#ffffff',
      keyLightIntensity: 0.5, // Single simple light
      fillLightIntensity: 0.0,
      rimLightIntensity: 0.0,
      contactShadows: false
    },
    material: {
      roughness: 0.9,
      metalness: 0.0,
      envMapIntensity: 0.5,
      flatShading: false,
      doubleSide: false // Single sided for performance
    },
    camera: {
      fov: 45,
      toneMappingExposure: 1.0
    },
    background: '#15181E'
  }
};
