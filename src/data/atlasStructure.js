export const atlasStructure = [
  {
    title: "Anatomia de Membro Superior",
    description: "Estruturas do membro superior com foco funcional e clínico.",
    status: "DISPONÍVEL",
    slug: "membro-superior",
    subcategories: ["Braço", "Antebraço", "Mão"]
  },
  {
    title: "Anatomia de Membro Inferior",
    description: "Estudo anatômico da locomoção e sustentação corporal.",
    status: "DISPONÍVEL",
    slug: "membro-inferior",
    subcategories: ["Cintura Pélvica", "Coxa", "Perna", "Pé"]
  },
  {
    title: "Anatomia de Tórax",
    description: "Estruturas torácicas, sistema respiratório e cardiovascular.",
    status: "DISPONÍVEL",
    slug: "torax",
    subcategories: []
  },
  {
    title: "Anatomia de Abdômen",
    description: "Órgãos viscerais e relações anatômicas abdominais.",
    status: "DISPONÍVEL",
    slug: "abdomen",
    subcategories: []
  },
  {
    title: "Anatomia de Pescoço e Cabeça",
    description: "Estruturas neurológicas, musculares e ósseas da região superior.",
    status: "DISPONÍVEL",
    slug: "pescoco-e-cabeca",
    subcategories: []
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
