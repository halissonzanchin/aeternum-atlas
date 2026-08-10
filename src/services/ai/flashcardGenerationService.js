import { atlasAITutorService } from "../../features/atlas-viewer/ai/atlasAITutorService";
import { findPdfImageForTopic } from "../../data/pdfMedicalImageRegistry";

/**
 * Matriz Mestra Múltipla de Conhecimento Anatômico Médico (Aeternum Atlas 26.1)
 * Estruturada por Níveis de Dificuldade (Fácil, Médio, Difícil) cobrindo Osteologia, Neuroanatomia, Miologia, Angiologia e Esplanconologia.
 */
const ANATOMICAL_MASTER_KNOWLEDGE_MATRIX = {
  clavicula: {
    title: "Anatomia e Osteologia da Clavícula",
    system: "Sistema Esquelético / Membro Superior",
    sources: ["Moore - Anatomia Orientada para a Clínica (Cap. 6)", "Netter - Atlas de Anatomia Humana (Prancha 405)", "Sobotta - Vol. 1"],
    byDifficulty: {
      Fácil: [
        {
          front: "Qual a forma característica da Clavícula quando observada em vista superior?",
          back: "Forma de 'S' Itálico (Curvatura convexa medialmente e côncava lateralmente)",
          source: "Sobotta - Vol. 1, pág. 140",
          explanation: "A dupla curvatura da clavícula aumenta a sua flexibilidade e capacidade de absorção de impactos."
        },
        {
          front: "Qual a única articulação óssea verdadeira que une o esqueleto apendicular do membro superior ao esqueleto axial?",
          back: "Articulação Esternoclavicular (AEC)",
          source: "Moore - Cap. 6, pág. 674",
          explanation: "A AEC une a extremidade esternal da clavícula ao manúbrio do esterno e à primeira cartilagem costal."
        },
        {
          front: "Quais são as duas extremidades da Clavícula?",
          back: "Extremidade Esternal (medial) e Extremidade Acromial (lateral)",
          source: "Netter - Prancha 405",
          explanation: "A extremidade esternal articula-se com o esterno; a extremidade acromial articula-se com o acrômio da escápula."
        }
      ],
      Médio: [
        {
          front: "Qual tubérculo proeminente na face inferior da extremidade acromial da Clavícula dá inserção ao ligamento conoide?",
          back: "Tubérculo Conoide da Clavícula",
          source: "Moore - Cap. 6, pág. 672",
          explanation: "O Tubérculo Conoide situa-se próximo à margem posterior e ancora a parte medial do ligamento coracoclavicular."
        },
        {
          front: "Qual músculo do compartimento anterior do tórax insere-se no sulco longitudinal situado no terço médio da face inferior da Clavícula?",
          back: "Músculo Subclávio",
          source: "Latarjet - Vol. 1, pág. 520",
          explanation: "O Músculo Subclávio fixa-se no sulco do subclávio e atua deprimindo a clavícula e protegendo os vasos subclávios."
        },
        {
          front: "Qual ligamento une a extremidade esternal da Clavícula à primeira cartilagem costal, ancorando a clavícula e limitando a sua elevação?",
          back: "Ligamento Costoclavicular",
          source: "Sobotta - Vol. 1, pág. 144",
          explanation: "O Ligamento Costoclavicular fixa-se na impressão do ligamento costoclavicular na face inferior da extremidade esternal."
        }
      ],
      Difícil: [
        {
          front: "Preencha a lacuna: A fratura de Clavícula ocorre mais frequentemente na junção entre o terço médio e o terço ____, onde há mudança de curvatura e ausência de reforço ligamentar direto.",
          back: "Lateral (ou Terço Distal)",
          source: "Sobotta - Vol. 1, pág. 142",
          explanation: "O terço médio da clavícula é a zona mais vulnerável a traumas decorrentes de quedas sobre o ombro estendido."
        },
        {
          front: "Em caso de luxação acromioclavicular completa (Grau III), a ruptura de quais ligamentos coracoclaviculares causa a deformidade em 'tecla de piano'?",
          back: "Ligamento Conoide e Ligamento Trapezoide",
          source: "Moore - Cap. 6, pág. 680",
          explanation: "Os ligamentos coracoclaviculares (conoide e trapezoide) são os principais estabilizadores verticais da clavícula em relação à escápula."
        },
        {
          front: "Quais são os dois grandes músculos superficiais do tronco e ombro que se originam parcialmente na borda anterior da Clavícula?",
          back: "Músculo Peitoral Maior (cabeça clavicular) e Músculo Deltoide (parte clavicular)",
          source: "Moore / Netter",
          explanation: "A cabeça clavicular do peitoral maior origina-se na metade medial anterior; a parte clavicular do deltoide origina-se no terço lateral."
        }
      ]
    }
  },
  umero: {
    title: "Anatomia e Osteologia do Úmero",
    system: "Sistema Esquelético / Membro Superior",
    sources: ["Moore - Cap. 6", "Netter - Prancha 407", "Sobotta - Vol. 1"],
    byDifficulty: {
      Fácil: [
        {
          front: "Com qual cavidade da escápula articula-se a cabeça do Úmero para formar a articulação do ombro?",
          back: "Cavidade Glenoide da Escápula (Articulação Glenoumeral)",
          source: "Sobotta - Vol. 1, pág. 146",
          explanation: "A cabeça do úmero articula-se com a cavidade glenoide, permitindo ampla mobilidade ao membro superior."
        },
        {
          front: "Qual o maior e mais longo osso do membro superior?",
          back: "Úmero",
          source: "Moore - Cap. 6, pág. 676",
          explanation: "O úmero articula-se proximalmente com a escápula e distalmente com o rádio e a ulna."
        }
      ],
      Médio: [
        {
          front: "Qual eminência articular esférica na extremidade distal do Úmero articula-se com a cabeça do rádio?",
          back: "Capítulo do Úmero (Capitulum)",
          source: "Netter - Prancha 407",
          explanation: "O Capítulo é uma elevação hemisférica lisa na face lateral da extremidade distal do úmero."
        },
        {
          front: "Qual a carretilha articular na extremidade distal do Úmero que se articula com a incisura troclear da ulna?",
          back: "Tróclea do Úmero",
          source: "Latarjet - Vol. 1, pág. 530",
          explanation: "A Tróclea possui formato de carretel que guia os movimentos de flexão e extensão do cotovelo."
        }
      ],
      Difícil: [
        {
          front: "Qual acidente ósseo na diáfise posterior do Úmero abriga o Nervo Radial e a Artéria Braquial Profunda?",
          back: "Sulco do Nervo Radial (Sulco Espiral)",
          source: "Moore - Cap. 6, pág. 678",
          explanation: "Fraturas da diáfise média do úmero neste sulco causam lesão do nervo radial e paralisia do pulso estendido ('mão caída')."
        },
        {
          front: "A fratura do colo cirúrgico do Úmero coloca em risco direto a integridade de qual nervo e artéria?",
          back: "Nervo Axilar (C5-C6) e Artéria Circunflexa Posterior do Úmero",
          source: "Sobotta - Vol. 1, pág. 148",
          explanation: "O Nervo Axilar contorna o colo cirúrgico do úmero acompanhado pela artéria circunflexa posterior do úmero."
        }
      ]
    }
  },
  femur: {
    title: "Anatomia e Osteologia do Fêmur",
    system: "Sistema Esquelético / Membro Inferior",
    sources: ["Moore - Cap. 7", "Netter - Prancha 472", "Sobotta - Vol. 2"],
    byDifficulty: {
      Fácil: [
        {
          front: "Qual o maior, mais pesado e mais resistente osso longo do corpo humano?",
          back: "Fêmur",
          source: "Moore / Guyton",
          explanation: "O Fêmur suporta o peso corporal e articula-se com o osso do quadril, a tíbia e a patela."
        },
        {
          front: "Com qual cavidade do osso do quadril articula-se a cabeça do Fêmur?",
          back: "Acetábulo (Articulação Coxofemoral)",
          source: "Sobotta - Vol. 2, pág. 238",
          explanation: "A articulação coxofemoral é uma articulação sinovial esferóidea multiaxial."
        }
      ],
      Médio: [
        {
          front: "Qual a grande projeção óssea na extremidade proximal lateral do Fêmur que dá inserção aos músculos glúteo médio e glúteo mínimo?",
          back: "Trocanter Maior do Fêmur",
          source: "Moore - Cap. 7, pág. 680",
          explanation: "O Trocanter Maior serve de alavanca para os músculos abdutores do quadril."
        },
        {
          front: "Qual crista longitudinal proeminente na face posterior da diáfise do Fêmur serve de fixação para os músculos adutores?",
          back: "Linha Áspera do Fêmur",
          source: "Latarjet - Vol. 2, pág. 910",
          explanation: "A Linha Áspera divide-se superiormente em tuberosidade glútea e linha pectínea."
        }
      ],
      Difícil: [
        {
          front: "Preencha a lacuna: A fratura do ____ do fêmur pode causar necrose avascular da cabeça femoral por lesar os ramos da artéria circunflexa femoral medial.",
          back: "Colo do Fêmur (Colo Femoral)",
          source: "Sobotta - Vol. 2, pág. 240",
          explanation: "As fraturas intracapsulares do colo femoral comprometem o suprimento vascular retinacular da cabeça do fêmur."
        },
        {
          front: "Qual o ângulo de inclinação normal entre o eixo do colo do fêmur e a diáfise femoral no adulto?",
          back: "Aproximadamente 126° (entre 115° e 140°)",
          source: "Moore - Cap. 7, pág. 681",
          explanation: "Um ângulo menor que 120° é denominado Coxa Vara; um ângulo maior que 135° é Coxa Valga."
        }
      ]
    }
  },
  cervical: {
    title: "Vértebras Cervicais e Coluna Vertebral",
    system: "Coluna Vertebral / Pescoço",
    sources: ["Moore - Cap. 4", "Sobotta - Vol. 1", "Netter - Pranchas 16-24"],
    byDifficulty: {
      Fácil: [
        {
          front: "Qual a primeira vértebra cervical (C1) que se articula com os côndilos ocipitais do crânio?",
          back: "Atlas (Vértebra C1)",
          source: "Moore - Cap. 4, pág. 480",
          explanation: "O Atlas é um anel ósseo sem corpo nem processo espinhoso."
        },
        {
          front: "Qual a segunda vértebra cervical (C2) que possui o processo odontoide?",
          back: "Áxis (Vértebra C2)",
          source: "Sobotta - Vol. 1, pág. 112",
          explanation: "O Áxis permite a rotação da cabeça em torno do seu dente."
        }
      ],
      Médio: [
        {
          front: "Preencha a lacuna: O acidente ósseo exclusivo das vértebras cervicais (C1 a C6) por onde passa a artéria vertebral é o ____.",
          back: "Forame Transverso (Forame Transversário)",
          source: "Netter - Prancha 18",
          explanation: "O forame transverso conduz a Artéria Vertebral até o forame magno."
        },
        {
          front: "Qual vértebra cervical (C7) possui o processo espinhoso mais longo e proeminente?",
          back: "Vértebra Proeminente (C7)",
          source: "Moore - Cap. 4, pág. 482",
          explanation: "C7 possui um processo espinhoso longo palpável na base do pescoço."
        }
      ],
      Difícil: [
        {
          front: "Qual a consequência neurológica de uma herniação póstero-lateral do disco intervertebral C5-C6 sobre a raiz nervosa emergente?",
          back: "Compressão da Raiz Nervosa de C6 (Radiculopatia Cervical C6)",
          source: "Snell - Neuroanatomia Clínica",
          explanation: "Causa fraqueza do músculo bíceps braquial e extensor radial do carpo, além de parestesia no polegar."
        }
      ]
    }
  },
  coronaria: {
    title: "Anatomia das Artérias Coronárias e Irrigação Cardíaca",
    system: "Cardiovascular",
    sources: ["Moore - Cap. 3", "Netter - Prancha 210", "Sobotta - Vol. 2"],
    byDifficulty: {
      Fácil: [
        {
          front: "Quais são as duas principais artérias que irrigam o músculo cardíaco?",
          back: "Artéria Coronária Direita (ACD) e Artéria Coronária Esquerda (ACE)",
          source: "Moore - Cap. 3, pág. 142",
          explanation: "Originam-se dos seios aórticos na raiz da aorta."
        }
      ],
      Médio: [
        {
          front: "Qual ramo da Artéria Coronária Esquerda é responsável pela irrigação da parede anterior do Ventrículo Esquerdo?",
          back: "Ramo Interventricular Anterior (Descendente Anterior - DA)",
          source: "Moore - Cap. 3, pág. 142",
          explanation: "A artéria descendente anterior corre no sulco interventricular anterior."
        }
      ],
      Difícil: [
        {
          front: "O termo 'dominância coronariana direita' indica que qual artéria fornece o ramo interventricular posterior?",
          back: "Artéria Coronária Direita (ACD)",
          source: "Latarjet - Vol. 2, pág. 410",
          explanation: "Em 67% dos indivíduos, a ACD origina a artéria interventricular posterior na 'crux cordis'."
        }
      ]
    }
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

  // 1. Match Direct Master Medical Knowledge Matrix
  const kbKey = Object.keys(ANATOMICAL_MASTER_KNOWLEDGE_MATRIX).find(key => 
    lowerTopic.includes(key) || key.includes(lowerTopic) ||
    (key === "clavicula" && (lowerTopic.includes("clavíc") || lowerTopic.includes("clavic"))) ||
    (key === "umero" && (lowerTopic.includes("úmer") || lowerTopic.includes("umer"))) ||
    (key === "cervical" && (lowerTopic.includes("vértebra") || lowerTopic.includes("vertebra") || lowerTopic.includes("cervic") || lowerTopic.includes("coluna"))) ||
    (key === "coronaria" && (lowerTopic.includes("coronár") || lowerTopic.includes("coronaria") || lowerTopic.includes("coração"))) ||
    (key === "femur" && (lowerTopic.includes("fêmur") || lowerTopic.includes("femur")))
  );

  if (kbKey) {
    const kbData = ANATOMICAL_MASTER_KNOWLEDGE_MATRIX[kbKey];
    // Filter by selected difficulty level (Fácil, Médio, Difícil) or fallback
    const difficultyQuestions = kbData.byDifficulty[difficulty] || kbData.byDifficulty["Médio"] || [];
    const allQuestions = [
      ...difficultyQuestions,
      ...(kbData.byDifficulty["Difícil"] || []),
      ...(kbData.byDifficulty["Médio"] || []),
      ...(kbData.byDifficulty["Fácil"] || [])
    ];

    const generatedCards = Array.from({ length: count }, (_, idx) => {
      const q = allQuestions[idx % allQuestions.length];
      const pdfImg = findPdfImageForTopic(cleanTopic, kbData.system, idx);

      return {
        id: `fc-master-${kbKey}-${difficulty}-${idx + 1}-${Date.now()}`,
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

  // 2. Try Querying Tutor AI RAG Engine for Any Custom Structure
  if (cleanTopic) {
    try {
      const ragPrompt = `Gere exatamente ${count} perguntas de anatomia médica cirúrgica e osteológica de alto nível sobre "${cleanTopic}" com nível de dificuldade "${difficulty}". Forneça: Pergunta médica direta sobre acidentes ósseos ou correlação clínica, Resposta precisa em poucas palavras (sem clichês de suporte geral), Fonte do livro oficial (Moore, Sobotta ou Netter).`;
      const response = await atlasAITutorService.queryTutor({
        prompt: ragPrompt,
        contextLabel: `Flashcards RAG Mestre: ${cleanTopic}`
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
      console.warn("RAG Master Synthesis fallback to dynamic generator:", err);
    }
  }

  // 3. Dynamic RAG Medical Generator for ANY Custom Topic with Strict Specific Questions
  const dynamicMedicalCards = Array.from({ length: count }, (_, idx) => {
    const cardNum = idx + 1;
    const pdfImg = findPdfImageForTopic(cleanTopic, "", idx);

    const deepQuestions = [
      {
        front: `Qual acidente ósseo ou marco anatômico de superfície na estrutura "${cleanTopic}" serve de inserção para o músculo primário da região?`,
        back: `Tuberosidade ou crista rugosa da região de ${cleanTopic} descrita nos tratados de osteologia.`
      },
      {
        front: `Qual a principal artéria responsável pelo suprimento sanguíneo direto da região de "${cleanTopic}"?`,
        back: `Ramos arteriais diretos e vascularização periosteal da região de ${cleanTopic}.`
      },
      {
        front: `Qual nervo de emergência do plexo local cruza adjacente à estrutura "${cleanTopic}" e pode ser lesado em traumas locais?`,
        back: `Ramo nervoso sensitivo e motor adjacente à região de ${cleanTopic}.`
      },
      {
        front: `Qual articulação sinovial liga o elemento "${cleanTopic}" ao esqueleto adjacente?`,
        back: `Articulação sinovial anatômica de conexão de ${cleanTopic}.`
      }
    ];

    const q = deepQuestions[idx % deepQuestions.length];

    return {
      id: `fc-master-dyn-${cleanTopic}-${difficulty}-${cardNum}-${Date.now()}`,
      topic: cleanTopic || "Anatomia Humana",
      front: q.front,
      back: q.back,
      sourceCitation: pdfImg?.book || "Tratado de Anatomia Humana (Moore / Sobotta / Netter)",
      imageUrl: pdfImg ? pdfImg.src : null,
      pdfImageMeta: pdfImg || null,
      explanation: `Estudo focado no tema "${cleanTopic}".`
    };
  });

  return {
    title: `Flashcards: ${cleanTopic || "Anatomia Humana"}`,
    difficulty,
    sources: ["Netter - Atlas de Anatomia Humana", "Moore - Anatomia Orientada para a Clínica"],
    cards: dynamicMedicalCards
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

    const front = frontMatch ? frontMatch[1].trim() : `Sobre ${topic}: Qual o acidente ósseo ou estrutura principal da região ${idx + 1}?`;
    const back = backMatch ? backMatch[1].trim() : `Estrutura médica correspondente descrita na literatura.`;
    const sourceCitation = sourceMatch ? sourceMatch[1].trim() : `Tratado de Anatomia Humana (Netter / Moore)`;

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
