export const atlasStructure = [
  {
    title: "Anatomia da Cabeça",
    description: "Neuroanatomia, encéfalo, cavidade craniana e estruturas da cabeça.",
    status: "DISPONÍVEL",
    slug: "cabeca",
    subcategories: ["Encéfalo", "Meninges", "Base do Crânio"],
    linkedModelSlugs: ["corte-sagital-cranio-humano-superficial"]
  },
  {
    title: "Anatomia do Pescoço",
    description: "Região cervical, estruturas vasculares, musculares e viscerais.",
    status: "DISPONÍVEL",
    slug: "pescoco",
    subcategories: ["Vértebras Cervicais", "Trígono Carótico", "Tireoide"],
    linkedModelSlugs: []
  },
  {
    title: "Anatomia de Membros Superiores",
    description: "Estruturas do membro superior com foco funcional e clínico.",
    status: "DISPONÍVEL",
    slug: "membro-superior",
    subcategories: ["Ombro", "Braço", "Antebraço", "Mão"],
    linkedModelSlugs: []
  },
  {
    title: "Anatomia do Tronco",
    description: "Coluna vertebral, dorso e musculatura posterior do tronco.",
    status: "DISPONÍVEL",
    slug: "tronco",
    subcategories: ["Coluna Vertebral", "Musculatura Dorsal"],
    linkedModelSlugs: []
  },
  {
    title: "Anatomia do Tórax",
    description: "Estruturas torácicas, sistema respiratório e cardiovascular.",
    status: "DISPONÍVEL",
    slug: "torax",
    subcategories: ["Coração", "Mediastino", "Pulmões"],
    linkedModelSlugs: ["coracao-edicao-morgue"]
  },
  {
    title: "Anatomia de Abdômen",
    description: "Órgãos viscerais e relações anatômicas abdominais.",
    status: "DISPONÍVEL",
    slug: "abdomen",
    subcategories: ["Parede Abdominal", "Visceras Peritoneais"],
    linkedModelSlugs: []
  },
  {
    title: "Anatomia de Pelve e Períneo",
    description: "Relações topográficas da pelve, períneo e sistema reprodutor.",
    status: "DISPONÍVEL",
    slug: "pelve-e-perineo",
    subcategories: ["Sistema Reprodutor Feminino", "Assoalho Pélvico"],
    linkedModelSlugs: ["corte-sagital-sistema-reprodutor-feminino"]
  },
  {
    title: "Anatomia de Membros Inferiores",
    description: "Estudo anatômico da locomoção e sustentação corporal.",
    status: "DISPONÍVEL",
    slug: "membro-inferior",
    subcategories: ["Cintura Pélvica", "Coxa", "Perna", "Pé"],
    linkedModelSlugs: []
  }
];

export function atlasPathForItem(item) {
  return `/atlas/${item.slug}`;
}

export function atlasSubcategoryPath(item, subcategory) {
  return `${atlasPathForItem(item)}/${slugifyAtlasLabel(subcategory)}`;
}

export function findAtlasItemBySlug(slug) {
  return atlasStructure.find((item) => item.slug === slug);
}

export function slugifyAtlasLabel(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
