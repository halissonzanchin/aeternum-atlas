export const atlasStructureLayerRegistry = {
  'demo-heart-glb': [
    {
      layerId: 'layer-heart-001',
      modelId: 'demo-heart-glb',
      structureName: 'Miocárdio (Músculo Cardíaco)',
      meshName: 'Mesh_Myocardium',
      anatomicalSystem: 'cardiovascular',
      defaultVisible: true,
      highlightColor: '#ef4444',
      opacityWhenIsolated: 1.0,
      description: 'Músculo espesso do coração, responsável pela contração sistólica.'
    },
    {
      layerId: 'layer-heart-002',
      modelId: 'demo-heart-glb',
      structureName: 'Pericárdio (Membrana)',
      meshName: 'Mesh_Pericardium',
      anatomicalSystem: 'cardiovascular',
      defaultVisible: true,
      highlightColor: '#e5e7eb',
      opacityWhenIsolated: 0.3,
      description: 'Saco fibrosseroso que envolve o coração e as raízes dos grandes vasos.'
    },
    {
      layerId: 'layer-heart-003',
      modelId: 'demo-heart-glb',
      structureName: 'Válvula Mitral',
      meshName: 'Mesh_Mitral_Valve',
      anatomicalSystem: 'cardiovascular',
      defaultVisible: false, // Inicialmente oculta para forçar isolamento ou exploração
      highlightColor: '#2dd4bf',
      opacityWhenIsolated: 1.0,
      description: 'Válvula bicúspide que impede o refluxo de sangue do ventrículo esquerdo para o átrio esquerdo.'
    }
  ]
};
