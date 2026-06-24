export const anatomyRelations = [
  // Relacionamentos do Útero
  {
    source: "uterus",
    target: "uterine_artery",
    type: "arterial_supply",
    label: "Recebe irrigação da artéria uterina"
  },
  {
    source: "uterus",
    target: "uterine_vein",
    type: "venous_drainage",
    label: "Drenado pela veia uterina"
  },
  {
    source: "uterus",
    target: "cervix",
    type: "part_of",
    label: "Continua-se inferiormente como colo uterino"
  },
  {
    source: "uterus",
    target: "endometrium",
    type: "histology",
    label: "Revestido internamente pelo endométrio"
  },
  {
    source: "uterus",
    target: "myometrium",
    type: "histology",
    label: "Sua camada muscular espessa é o miométrio"
  },
  {
    source: "uterus",
    target: "fallopian_tube",
    type: "adjacent_to",
    label: "Conectado superior e lateralmente à tuba uterina"
  },

  // Relacionamentos do Ovário
  {
    source: "ovary",
    target: "fallopian_tube",
    type: "adjacent_to",
    label: "Posicionado próximo às fimbrias da tuba uterina"
  },
  
  // Relacionamentos do Colo Uterino
  {
    source: "cervix",
    target: "uterus",
    type: "part_of",
    label: "Porção inferior do útero"
  },

  // Relacionamentos Patológicos
  {
    source: "uterus",
    target: "miomatose",
    type: "pathology_related",
    label: "Sítio comum de desenvolvimento de miomas (Miomatose)"
  },
  {
    source: "cervix",
    target: "hpv",
    type: "pathology_related",
    label: "Sítio alvo do Papilomavírus Humano (HPV)"
  }
];
