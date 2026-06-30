export const ANATOMICAL_MARKER_LABELS = {
  // O mapeamento utiliza preferencialmente o ID do modelo no Supabase ou Sketchfab UID
  // Adicione mappings para outros modelos conforme necessário.
  
  // Exemplo de mapeamento pelo slug (pode ser ajustado para usar ID ou UID real)
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
      title: "Corpo caloso",
      description: "Comissura cerebral que conecta os hemisférios direito e esquerdo."
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
