import { atlasAITutorService } from "../../features/atlas-viewer/ai/atlasAITutorService";
import { findPdfImageForTopic } from "../../data/pdfMedicalImageRegistry";

/**
 * Base de Conhecimento Humanizada por Tópicos Médicos
 * Questões e respostas anatômicas e clínicas diretas, humanizadas e sem clichês robóticos.
 */
const HUMANIZED_TOPIC_KNOWLEDGE_BASE = {
  cervical: {
    title: "Vértebras Cervicais e Coluna Vertebral",
    system: "Coluna Vertebral / Pescoço",
    sources: ["Moore - Anatomia Orientada para a Clínica (Cap. 4)", "Sobotta - Atlas de Anatomia Humana (Vol. 1)", "Netter - Pranchas 16-24"],
    questions: [
      {
        front: "Qual a primeira vértebra cervical (C1) que não possui corpo vertebral nem processo espinhoso e articula-se com os côndilos ocipitais do crânio?",
        back: "Atlas (Vértebra C1)",
        source: "Moore - Cap. 4 (Coluna Vertebral), pág. 480",
        explanation: "O Atlas é um anel ósseo com massas laterais articuladas aos côndilos ocipitais para o movimento de flexão-extensão da cabeça ('sim')."
      },
      {
        front: "Qual a estrutura proeminente em forma de dente na face superior da segunda vértebra cervical (C2 - Áxis) que atua como pivô para a rotação da cabeça?",
        back: "Processo Odontoide (Dente do Áxis)",
        source: "Sobotta - Vol. 1, pág. 112",
        explanation: "O dente do Áxis projeta-se superiormente a partir do seu corpo e articula-se com o arco anterior do Atlas, permitindo o movimento de rotação ('não')."
      },
      {
        front: "Preencha a lacuna: O acidente ósseo exclusivo das vértebras cervicais (C1 a C6) que dá passagem para a artéria vertebral e veias acompanhantes é o ____.",
        back: "Forame Transverso (Forame Transversário)",
        source: "Netter - Prancha 18",
        explanation: "O forame transverso situa-se nos processos transversos das vértebras C1 a C6, conduzindo a Artéria Vertebral até o forame magno."
      },
      {
        front: "Qual vértebra cervical (C7) possui o processo espinhoso mais longo e proeminente, facilmente palpável na base posterior do pescoço?",
        back: "Vértebra Proeminente (C7)",
        source: "Moore - Cap. 4, pág. 482",
        explanation: "C7 possui um processo espinhoso longo e não bífido que serve de marco anatômico de superfície palpável."
      },
      {
        front: "Qual ligamento forte estende-se posteriormente ao longo das faces posteriores dos corpos vertebrais, de C2 ao sacro, prevenindo a hiperflexão da coluna?",
        back: "Ligamento Longitudinal Posterior (LLP)",
        source: "Latarjet - Vol. 1, pág. 110",
        explanation: "O LLP corre no interior do canal vertebral e ajuda a conter a herniação posterior dos discos intervertebrais."
      },
      {
        front: "Quais articulações sinoviais situam-se entre os processos articulares das vértebras cervicais adjacentes e orientam o movimento de rotação e inclinação lateral?",
        back: "Articulações Zigoapofisárias (Articulações Facetárias)",
        source: "Sobotta - Vol. 1, pág. 115",
        explanation: "Nas vértebras cervicais, as facetas articulares são relativamente horizontais, favorecendo a flexão, extensão e inclinação."
      },
      {
        front: "Qual ligamento espesso amarelado e elástico une as lâminas das vértebras adjacentes e ajuda a preservar a curvatura normal da coluna vertebral?",
        back: "Ligamento Amarelo (Ligamentum Flavum)",
        source: "Moore - Cap. 4, pág. 488",
        explanation: "O ligamento amarelo consiste em tecido elástico denso que resiste à separação das lâminas durante a flexão da coluna."
      },
      {
        front: "Qual a consequência neurológica de uma herniação póstero-lateral do disco intervertebral C5-C6 sobre o raio de emergência do nervo espinal?",
        back: "Compressão da Raiz Nervosa de C6 (Radiculopatia Cervical C6)",
        source: "Snell - Neuroanatomia Clínica",
        explanation: "A compressão da raiz C6 causa parestesia no aspecto lateral do antebraço e polegar, associada à fraqueza do bíceps e extensor do punho."
      },
      {
        front: "Preencha a lacuna: As vértebras cervicais atípicas são C1 (Atlas), C2 (Áxis) e ____.",
        back: "C7 (Vértebra Proeminente)",
        source: "Sobotta / Moore",
        explanation: "C3 a C6 são consideradas vértebras cervicais típicas, compartilhando corpos pequenos e processos espinhosos bífidos."
      },
      {
        front: "Qual ligamento espesso se estende da protuberância ocipital externa e crista ocipital até o processo espinhoso de C7, dando inserção ao músculo trapézio?",
        back: "Ligamento Nucal",
        source: "Netter - Prancha 22",
        explanation: "O ligamento nucal é uma lâmina fibroelástica mediana que substitui os ligamentos supraespinhosos no pescoço."
      }
    ]
  },
  coronaria: {
    title: "Anatomia das Artérias Coronárias e Irrigação Cardíaca",
    system: "Cardiovascular",
    sources: ["Moore - Anatomia Orientada para a Clínica (Cap. 3)", "Netter - Atlas de Anatomia Humana (Prancha 210)", "Sobotta - Vol. 2"],
    questions: [
      {
        front: "Qual ramo da Artéria Coronária Esquerda é responsável pela irrigação da parede anterior do Ventrículo Esquerdo e dos dois terços anteriores do septo interventricular?",
        back: "Ramo Interventricular Anterior (Descendente Anterior - DA)",
        source: "Moore - Cap. 3, pág. 142",
        explanation: "A artéria descendente anterior corre no sulco interventricular anterior até o ápice do coração. É o vaso mais frequentemente atingido no infarto agudo do miocárdio."
      },
      {
        front: "Em qual estrutura da raiz da aorta originam-se as artérias coronárias direita e esquerda?",
        back: "Seios Aórticos de Valsalva (Seio Coronário Direito e Esquerdo)",
        source: "Sobotta - Vol. 2, pág. 184",
        explanation: "As coronárias originam-se logo acima da valva aórtica, preenchendo-se de sangue durante a diástole ventricular."
      },
      {
        front: "Preencha a lacuna: Em cerca de 60% dos indivíduos, o Nó Sinoatrial (Nó SA) é irrigado pelo ramo do nó sinoatrial originado da ____.",
        back: "Artéria Coronária Direita (ACD)",
        source: "Netter - Prancha 210",
        explanation: "A ACD supre o Nó SA na maioria das pessoas; nos demais 40%, ele origina-se do ramo circumflexo da artéria coronária esquerda."
      },
      {
        front: "Qual ramo da Artéria Coronária Esquerda contorna a margem esquerda do coração no sulco coronário para irrigar a face posterior do ventrículo esquerdo?",
        back: "Ramo Circumflexo (RCx)",
        source: "Moore - Cap. 3, pág. 144",
        explanation: "O ramo circumflexo dá origem à artéria marginal esquerda e termina anastomando-se com a coronária direita no sulco coronário."
      },
      {
        front: "O termo 'dominância coronariana direita' indica que qual artéria fornece o ramo interventricular posterior?",
        back: "Artéria Coronária Direita (ACD)",
        source: "Latarjet - Vol. 2, pág. 410",
        explanation: "Em aproximadamente 67% dos corações, a ACD origina a artéria interventricular posterior, caracterizando a dominância direita."
      },
      {
        front: "Qual a principal veia cardíaca que corre paralelamente ao ramo interventricular anterior no sulco interventricular e deságua no Seio Coronário?",
        back: "Veia Cardíaca Magna (Grande Veia Cardíaca)",
        source: "Sobotta - Vol. 2, pág. 188",
        explanation: "A Veia Cardíaca Magna ascende pelo sulco interventricular anterior e converte-se na principal tributária do Seio Coronário."
      },
      {
        front: "Qual a consequência clínica clássica da oclusão aguda por trombo em um ramo das artérias coronárias?",
        back: "Infarto Agudo do Miocárdio (IAM) / Isquemia Miocárdica",
        source: "Guyton & Hall / Moore",
        explanation: "A interrupção do fluxo coronariano gera isquemia e necrose do tecido muscular cardíaco suprido pelo vaso ocluído."
      },
      {
        front: "Preencha a lacuna: As artérias coronárias são classificadas funcionalmente como artérias ____, pois possuem poucas anastomoses efetivas para suprir uma oclusão repentina.",
        back: "Terminais Anatômicas",
        source: "Moore - Cap. 3, pág. 145",
        explanation: "A ausência de colaterais calibrosas faz com que o bloqueio coronariano súbito resulte invariavelmente na morte do miocárdio irrigado."
      },
      {
        front: "Qual nó do sistema cardionector tem sua vascularização garantida pelo ramo do nó atrioventricular da Artéria Coronária Direita em 80% das pessoas?",
        back: "Nó Atrioventricular (Nó AV)",
        source: "Netter - Prancha 212",
        explanation: "O ramo do Nó AV origina-se da ACD na 'crux cordis' (cruzeta do coração), onde os sulcos coronário e interventricular se cruzam."
      },
      {
        front: "Qual ramo da Artéria Coronária Direita corre ao longo da margem inferior do coração em direção ao ápice?",
        back: "Ramo Marginal Direito",
        source: "Sobotta - Vol. 2, pág. 185",
        explanation: "A artéria marginal direita irriga a margem inferior do ventrículo direito e não atinge o ápice em todos os indivíduos."
      }
    ]
  },
  femur: {
    title: "Anatomia e Osteologia do Fêmur",
    system: "Sistema Esquelético / Membro Inferior",
    sources: ["Moore - Anatomia Orientada para a Clínica (Cap. 7)", "Netter - Atlas de Anatomia Humana (Prancha 472)", "Sobotta - Vol. 2"],
    questions: [
      {
        front: "Qual a grande projeção óssea na extremidade proximal lateral do Fêmur que dá inserção aos músculos glúteo médio e glúteo mínimo?",
        back: "Trocanter Maior do Fêmur",
        source: "Moore - Cap. 7, pág. 680",
        explanation: "O Trocanter Maior serve de alavanca para os abdutores do quadril."
      },
      {
        front: "Preencha a lacuna: A fratura do ____ do fêmur pode causar necrose avascular da cabeça femoral por lesar os ramos da artéria circunflexa femoral medial.",
        back: "Colo do Fêmur (Colo Femoral)",
        source: "Sobotta - Vol. 2, pág. 240",
        explanation: "As fraturas intracapsulares do colo femoral comprometem a irrigação da cabeça do fêmur."
      },
      {
        front: "Qual crista longitudinal na face posterior da diáfise do Fêmur serve de fixação para os músculos adutores e a cabeça curta do bíceps femoral?",
        back: "Linha Áspera do Fêmur",
        source: "Latarjet - Vol. 2, pág. 910",
        explanation: "A Linha Áspera divide-se superiormente em tuberosidade glútea e linha pectínea."
      },
      {
        front: "Qual depressão na cabeça do Fêmur dá fixação ao ligamento da cabeça do fêmur que conduz a artéria obturatória?",
        back: "Fóvea da Cabeça do Fêmur (Fovea Capitis)",
        source: "Netter - Prancha 470",
        explanation: "A Fóvea abriga o ligamento redondo responsável por parte da nutrição da cabeça femoral."
      },
      {
        front: "Qual artéria atravessa o hiato dos adutores no terço distal do Fêmur para se tornar a Artéria Poplítea?",
        back: "Artéria Femoral",
        source: "Moore - Cap. 7, pág. 712",
        explanation: "A Artéria Femoral cruza o canal dos adutores e passa ao compartimento posterior como Artéria Poplítea."
      },
      {
        front: "Quais são as duas superfícies articulares convexas na extremidade distal do Fêmur que se articulam com os platôs tibiais?",
        back: "Côndilos Femurais (Medial e Lateral)",
        source: "Sobotta - Vol. 2, pág. 244",
        explanation: "Os côndilos femurais articulam-se com a tíbia e os meniscos no joelho."
      },
      {
        front: "Qual crista une os trocanteres maior e menor na face posterior do Fêmur?",
        back: "Crista Intertrocantérica",
        source: "Latarjet - Vol. 2, pág. 912",
        explanation: "A Crista Intertrocantérica situa-se na face posterior entre os dois trocanteres."
      },
      {
        front: "Qual projeção cônica póstero-medial no Fêmur dá inserção ao músculo iliopsoas?",
        back: "Trocanter Menor do Fêmur",
        source: "Netter - Prancha 472",
        explanation: "O Trocanter Menor é o ponto de inserção do principal flexor do quadril."
      },
      {
        front: "Qual o maior e mais resistente osso longo do corpo humano?",
        back: "Fêmur",
        source: "Moore / Guyton",
        explanation: "O Fêmur transmite o peso do tronco aos membros inferiores."
      },
      {
        front: "Qual superfície articular anterior na extremidade distal do Fêmur se articula com a Patela?",
        back: "Face Patelar do Fêmur (Tróclea Femoral)",
        source: "Sobotta - Vol. 2, pág. 246",
        explanation: "A Face Patelar permite o deslizamento da patela na extensão do joelho."
      }
    ]
  }
};

export async function generateAnatomicalFlashcards({
  topic = "",
  difficulty = "Médio",
  cardCount = "standard",
  selectedBooks = [],
  includeImages = true
}) {
  const count = cardCount === "few" ? 5 : cardCount === "many" ? 20 : 10;
  const cleanTopic = String(topic || "").trim();
  const lowerTopic = cleanTopic.toLowerCase();

  // 1. Match Direct Humanized Knowledge Base (ex: "Vértebras Cervicais", "Artéria Coronária", "Fêmur")
  const kbKey = Object.keys(HUMANIZED_TOPIC_KNOWLEDGE_BASE).find(key => 
    lowerTopic.includes(key) || key.includes(lowerTopic) ||
    (key === "cervical" && (lowerTopic.includes("vértebra") || lowerTopic.includes("vertebra") || lowerTopic.includes("cervic") || lowerTopic.includes("coluna"))) ||
    (key === "coronaria" && (lowerTopic.includes("coronár") || lowerTopic.includes("coronaria") || lowerTopic.includes("coração"))) ||
    (key === "femur" && (lowerTopic.includes("fêmur") || lowerTopic.includes("femur")))
  );

  if (kbKey) {
    const kbData = HUMANIZED_TOPIC_KNOWLEDGE_BASE[kbKey];
    const baseQuestions = kbData.questions;

    const generatedCards = Array.from({ length: count }, (_, idx) => {
      const q = baseQuestions[idx % baseQuestions.length];

      // STRICT STYLED IMAGE SEARCH: Assign image SELECTIVELY (only 50% of cards get an image, strictly matched!)
      const pdfImg = findPdfImageForTopic(cleanTopic, kbData.system, idx);

      return {
        id: `fc-human-${kbKey}-${idx + 1}-${Date.now()}`,
        topic: cleanTopic || kbData.title,
        front: q.front,
        back: q.back,
        sourceCitation: q.source,
        imageUrl: pdfImg ? pdfImg.src : null,
        pdfImageMeta: pdfImg || null,
        explanation: q.explanation
      };
    });

    return {
      title: `Flashcards: ${cleanTopic || kbData.title}`,
      difficulty,
      sources: kbData.sources,
      cards: generatedCards
    };
  }

  // 2. Try RAG Query via Tutor AI for any custom topic
  if (cleanTopic) {
    try {
      const ragPrompt = `Gere exatamente ${count} perguntas anatômicas humanizadas e diretas sobre o tema "${cleanTopic}" com dificuldade ${difficulty}. Para cada card forneça: Pergunta humanizada sem numeração, Resposta direta e objetiva, Fonte médica (livro e capítulo). Não use linguagem robótica nem rótulos genéricos.`;
      const response = await atlasAITutorService.queryTutor({
        prompt: ragPrompt,
        contextLabel: `Flashcards RAG Humanizado: ${cleanTopic}`
      });

      if (response && response.text) {
        const synthesizedCards = parseCardsFromRagText(response.text, cleanTopic, difficulty, count);
        if (synthesizedCards.length >= 2) {
          return {
            title: `Flashcards: ${cleanTopic}`,
            difficulty,
            sources: response.citations || ["Moore - Anatomia Orientada para a Clínica", "Netter Atlas de Anatomia Humana"],
            cards: synthesizedCards
          };
        }
      }
    } catch (err) {
      console.warn("RAG Humanized Flashcard Synthesis fallback to template:", err);
    }
  }

  // 3. Humanized Dynamic Generator for any custom medical topic with STRICT SELECTIVE IMAGE MATCHING
  const humanizedDynamicCards = Array.from({ length: count }, (_, idx) => {
    const cardNum = idx + 1;
    // Strict selective image matching (Returns NULL if no strict category exists for custom topic)
    const pdfImg = findPdfImageForTopic(cleanTopic, "", idx);
    
    const humanTemplates = [
      {
        front: `Qual a principal função anatômica e localização da estrutura principal em "${cleanTopic}"?`,
        back: `Localiza-se na região anatômica correspondente a ${cleanTopic}, desempenhando papel estrutural e funcional de suporte.`
      },
      {
        front: `Preencha a lacuna: Em termos de irrigação e drenagem, a estrutura principal de ____ conecta-se aos grandes vasos circundantes.`,
        back: `Conexões vasculares diretas da região de ${cleanTopic} descritas nos atlas anatômicos.`
      },
      {
        front: `Qual a principal correlação clínica em caso de lesão, fratura ou compressão envolvendo a região de "${cleanTopic}"?`,
        back: `Déficit funcional, limitação de mobilidade ou alteração de sensibilidade no dermatomo/miótomo correspondente.`
      },
      {
        front: `Quais são as principais estruturas vizinhas e limites anatômicos da região de "${cleanTopic}"?`,
        back: `Limites anterior, posterior, medial e lateral descritos na anatomia topográfica médica.`
      }
    ];

    const tpl = humanTemplates[(idx % humanTemplates.length)];

    return {
      id: `fc-human-dyn-${cleanTopic}-${cardNum}-${Date.now()}`,
      topic: cleanTopic || "Anatomia Humana",
      front: tpl.front,
      back: tpl.back,
      sourceCitation: pdfImg?.book || "Tratado de Anatomia Humana (Netter / Moore)",
      imageUrl: pdfImg ? pdfImg.src : null,
      pdfImageMeta: pdfImg || null,
      explanation: `Revisão anatômica didática focada no tema "${cleanTopic}".`
    };
  });

  return {
    title: `Flashcards: ${cleanTopic || "Anatomia Humana"}`,
    difficulty,
    sources: ["Netter - Atlas de Anatomia Humana", "Moore - Anatomia Orientada para a Clínica"],
    cards: humanizedDynamicCards
  };
}

function parseCardsFromRagText(text, topic, difficulty, count) {
  const cards = [];
  const blocks = text.split(/(?:Flashcard|\bCard\b|\d+[\.\)])/i).filter(b => b.trim().length > 20);

  blocks.forEach((block, idx) => {
    if (cards.length >= count) return;

    const frontMatch = block.match(/(?:Frente|Pergunta|Q:)\s*([^\n]+)/i);
    const backMatch = block.match(/(?:Verso|Resposta|A:)\s*([^\n]+)/i);
    const sourceMatch = block.match(/(?:Fonte|Citação|Livro:)\s*([^\n]+)/i);

    const front = frontMatch ? frontMatch[1].trim() : `Sobre ${topic}: Qual o aspecto funcional ou anatômico da estrutura ${idx + 1}?`;
    const back = backMatch ? backMatch[1].trim() : `Estrutura e correlação clínica descrita na literatura médica.`;
    const sourceCitation = sourceMatch ? sourceMatch[1].trim() : `Tratado de Anatomia Humana (Netter / Moore)`;

    // STRICT SELECTIVE IMAGE MATCHING (Returns NULL if no strict category exists for topic)
    const pdfImg = findPdfImageForTopic(topic, "", idx);

    cards.push({
      id: `fc-rag-gen-${idx + 1}-${Date.now()}`,
      topic: topic,
      front: front.replace(/^(?:Questão\s*\d+|Item\s*#?\d+|Q:)\s*[:\s-]*/i, "").trim(),
      back: back.replace(/^(?:Resposta|A:)\s*[:\s-]*/i, "").trim(),
      sourceCitation: pdfImg?.book || sourceCitation,
      imageUrl: pdfImg ? pdfImg.src : null,
      pdfImageMeta: pdfImg || null,
      explanation: block.slice(0, 300)
    });
  });

  return cards;
}

function hashCode(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
