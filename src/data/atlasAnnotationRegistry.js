export const atlasAnnotationRegistry = {
  'demo-heart-glb': [
    {
      annotationId: 'ant-heart-001',
      modelId: 'demo-heart-glb',
      title: 'Ventrículo Esquerdo',
      anatomicalStructure: 'left_ventricle',
      description: 'Câmara principal de bombeamento do coração, responsável por enviar sangue oxigenado para todo o corpo através da aorta.',
      position: [0.5, -0.2, 0.5], // x, y, z relativos ao modelo
      cameraTarget: [0.5, -0.2, 0.5],
      cameraPosition: [2, 0, 3],
      academicFocus: 'Anatomia Macroscópica',
      difficultyLevel: 'Básico',
      linkedQuizId: 'quiz-heart-lv',
      active: true
    },
    {
      annotationId: 'ant-heart-002',
      modelId: 'demo-heart-glb',
      title: 'Artéria Aorta',
      anatomicalStructure: 'aorta',
      description: 'Maior artéria do corpo humano. Origina-se do ventrículo esquerdo do coração e se estende até o abdome.',
      position: [0, 1.2, 0],
      cameraTarget: [0, 1.2, 0],
      cameraPosition: [0, 3, 3],
      academicFocus: 'Sistema Cardiovascular',
      difficultyLevel: 'Intermediário',
      linkedQuizId: 'quiz-heart-aorta',
      active: true
    },
    {
      annotationId: 'ant-heart-003',
      modelId: 'demo-heart-glb',
      title: 'Átrio Direito',
      anatomicalStructure: 'right_atrium',
      description: 'Câmara receptora superior direita do coração. Recebe sangue desoxigenado do corpo através das veias cavas.',
      position: [-0.6, 0.5, 0.2],
      cameraTarget: [-0.6, 0.5, 0.2],
      cameraPosition: [-3, 1, 2],
      academicFocus: 'Fisiologia Cardíaca',
      difficultyLevel: 'Básico',
      linkedQuizId: 'quiz-heart-ra',
      active: true
    }
  ]
};
