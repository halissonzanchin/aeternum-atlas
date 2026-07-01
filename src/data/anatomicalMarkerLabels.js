export const ANATOMICAL_MARKER_LABELS = {
  // O mapeamento utiliza preferencialmente o ID do modelo no Supabase ou Sketchfab UID
  // Adicione mappings para outros modelos conforme necessário.
  
  "corte-sagital-cranio-humano-superficial": {
    0: {
      title: "Cerebelo",
      description: "Estrutura localizada na fossa posterior, relacionada à coordenação motora e equilíbrio."
    },
    1: {
      title: "Quarto Ventrículo",
      description: "Cavidade do sistema ventricular situada entre o tronco encefálico e o cerebelo."
    },
    2: {
      title: "Lobo Occipital",
      description: "Centro de processamento visual do encéfalo, localizado na porção posterior do córtex."
    },
    3: {
      title: "Corpo Caloso",
      description: "Maior comissura cerebral, um feixe de fibras nervosas que conecta os hemisférios direito e esquerdo."
    },
    4: {
      title: "Ponte",
      description: "Porção intermediária do tronco encefálico, essencial para funções autonômicas e via de passagem de tratos."
    },
    5: {
      title: "Tálamo",
      description: "Estação retransmissora primária para informações sensoriais direcionadas ao córtex cerebral."
    },
    6: {
      title: "Lobo Frontal",
      description: "Responsável por funções executivas, planejamento, raciocínio e controle motor voluntário."
    },
    7: {
      title: "Bulbo",
      description: "A porção inferior do tronco encefálico (medula oblonga), controlando funções vitais como respiração e batimentos cardíacos."
    },
    8: {
      title: "Mesencéfalo",
      description: "Porção superior do tronco encefálico, envolvida no processamento de informações visuais, auditivas e controle motor."
    },
    9: {
      title: "Giro do Cíngulo",
      description: "Parte do sistema límbico, fundamental para o processamento de emoções, aprendizagem e memória."
    }
  }
};

export function getEnrichedMarker(model, annotation, index) {
  if (!annotation) return null;
  if (!model) return annotation;
  
  // Tentar encontrar o modelo por id, slug ou sketchfabUid
  const identifier = model.slug || model.sketchfabUid || model.id;
  const mapping = identifier ? ANATOMICAL_MARKER_LABELS[identifier] : null;
  
  // Usa o annotation.index se index não for passado
  const targetIndex = Number.isInteger(index) ? index : annotation.index;
  
  if (mapping && Number.isInteger(targetIndex) && mapping[targetIndex]) {
    return {
      ...annotation,
      name: mapping[targetIndex].title || annotation.name,
      description: mapping[targetIndex].description || annotation.description
    };
  }
  
  return annotation;
}
