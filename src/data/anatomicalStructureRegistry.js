export const anatomicalStructureRegistry = {
  head: {
    regionId: 'head',
    regionName: 'Cabeça / Encéfalo',
    anatomicalSystem: 'Nervoso Central',
    relatedStructures: ['Córtex Cerebral', 'Cerebelo', 'Tronco Encefálico', 'Diencéfalo'],
    linkedModelIds: ['neuro-001-enc', 'neuro-002-cx'],
    academicRiskCategory: 'Alto',
    compatibleViewerEngine: true,
    future3DRoute: '/atlas-viewer/head'
  },
  face: {
    regionId: 'face',
    regionName: 'Face / Base do Crânio',
    anatomicalSystem: 'Esquelético e Muscular Facial',
    relatedStructures: ['Maxila', 'Mandíbula', 'Forames Cranianos', 'Músculos da Expressão'],
    linkedModelIds: ['osteo-001-face', 'osteo-003-forames'],
    academicRiskCategory: 'Crítico',
    compatibleViewerEngine: true,
    future3DRoute: '/atlas-viewer/face'
  },
  neck: {
    regionId: 'neck',
    regionName: 'Região Cervical',
    anatomicalSystem: 'Musculoesquelético e Vascular',
    relatedStructures: ['Vértebras Cervicais', 'Artéria Carótida', 'Plexo Cervical', 'Glândula Tireoide'],
    linkedModelIds: ['musc-cervical-01'],
    academicRiskCategory: 'Alto',
    compatibleViewerEngine: true,
    future3DRoute: '/atlas-viewer/neck'
  },
  chest: {
    regionId: 'chest',
    regionName: 'Tórax',
    anatomicalSystem: 'Cardiorrespiratório',
    relatedStructures: ['Coração', 'Pulmões', 'Mediastino', 'Costelas', 'Diafragma'],
    linkedModelIds: ['resp-pulmao-01', 'cardio-coracao-01'],
    academicRiskCategory: 'Alto',
    compatibleViewerEngine: true,
    future3DRoute: '/atlas-viewer/chest'
  },
  abdomen: {
    regionId: 'abdomen',
    regionName: 'Abdome',
    anatomicalSystem: 'Digestório',
    relatedStructures: ['Fígado', 'Estômago', 'Intestinos', 'Pâncreas', 'Baço'],
    linkedModelIds: ['gastro-figado-01', 'gastro-estomago-01'],
    academicRiskCategory: 'Médio',
    compatibleViewerEngine: true,
    future3DRoute: '/atlas-viewer/abdomen'
  },
  pelvis: {
    regionId: 'pelvis',
    regionName: 'Pelve',
    anatomicalSystem: 'Urogenital',
    relatedStructures: ['Bexiga', 'Útero / Próstata', 'Reto', 'Assoalho Pélvico'],
    linkedModelIds: ['pelv-fem-01', 'pelv-masc-01'],
    academicRiskCategory: 'Crítico',
    compatibleViewerEngine: true,
    future3DRoute: '/atlas-viewer/pelvis'
  },
  upper_limbs: {
    regionId: 'upper_limbs',
    regionName: 'Membros Superiores',
    anatomicalSystem: 'Musculoesquelético Apendicular',
    relatedStructures: ['Articulação Glenoumeral', 'Manguito Rotador', 'Úmero', 'Rádio/Ulna', 'Plexo Braquial'],
    linkedModelIds: ['musc-braco-dir', 'musc-ombro-esq'],
    academicRiskCategory: 'Alto',
    compatibleViewerEngine: false,
    future3DRoute: '/atlas-viewer/upper_limbs'
  },
  lower_limbs: {
    regionId: 'lower_limbs',
    regionName: 'Membros Inferiores',
    anatomicalSystem: 'Musculoesquelético Apendicular',
    relatedStructures: ['Fêmur', 'Tíbia/Fíbula', 'Quadríceps', 'Isquiotibiais', 'Nervo Ciático'],
    linkedModelIds: ['musc-coxa-dir', 'musc-perna-esq'],
    academicRiskCategory: 'Crítico',
    compatibleViewerEngine: true,
    future3DRoute: '/atlas-viewer/lower_limbs'
  }
};
