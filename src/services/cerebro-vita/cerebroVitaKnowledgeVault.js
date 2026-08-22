/**
 * Cérebro Aeternum Vita — Base de Conhecimento Vocal & Consciência Empática
 * Exclusivo para os Tutores IA de Voz (Aeternum Vita)
 * Personas:
 * - Eduardo 🇧🇷 (Mentor Sênior, Sábio & Acolhedor)
 * - Antonia 🇪🇸 (Mentora Empática & Expressiva)
 * - Ariana 🇺🇸 (Mentora Dinâmica & Inspiradora)
 * - Fabian 🇩🇪 (Mentor Acadêmico & Preciso)
 * 
 * Regra Arquitetural Absoluta:
 * - NUNCA conter Markdown, títulos (###), asteriscos (**) ou emojis.
 * - Focar 100% em diálogo falado natural, cadência humana, empatia e perguntas abertas de mentoria.
 */

export const VITA_TOPIC_CATEGORIES = {
  OSTEOLOGY: "osteologia",
  ANGIOLOGY: "angiologia",
  NEUROLOGY: "neurologia",
  SPLANCHNOLOGY: "esplancnologia",
  RESPIRATORY: "respiratorio",
  EMOTIONAL_COACHING: "coaching_emocional",
  STUDY_ROUTINE: "rotina_estudos"
};

export const VITA_KNOWLEDGE_NODES = {
  clavicula: {
    id: "clavicula",
    category: VITA_TOPIC_CATEGORIES.OSTEOLOGY,
    synonyms: ["clavicula", "clavícula", "clavicle", "schlüsselbein", "cintura escapular", "cingulo", "ombro", "hombro", "shoulder"],
    spokenAnswers: {
      pt: "A clavícula é o osso em forma de S que conecta o braço ao tórax, protegendo os grandes vasos subclávios. Deseja aprofundar nos músculos que se inserem nela ou nos ligamentos?",
      es: "La clavícula es el hueso en forma de S itálica que une el miembro superior con el tórax, protegiendo los vasos subclavios. ¿Quieres que veamos sus ligamentos o los músculos que se insertan en ella?",
      en: "The clavicle is an S-shaped bone that anchors the upper limb to the thorax, shielding the subclavian vessels. Would you like to explore its muscular attachments or its ligaments?",
      de: "Die Clavicula ist der S-förmige Knochen, der die obere Extremität mit dem Brustkorb verbindet und die Schlüsselbeingefäße schützt. Wollen wir ihre Bänder oder die ansetzenden Muskeln besprechen?"
    },
    subTopics: [
      {
        id: "musculos",
        synonyms: ["musculo", "músculo", "musculos", "músculos", "pectoral", "peitoral", "deltoide", "deltoides", "trapezio", "trapézio", "trapecio"],
        spokenAnswers: {
          pt: "Na clavícula inserem-se medialmente o peitoral maior e o esternocleidomastoideo, e lateralmente o deltoide e o trapézio. Deseja analisar a ação desses músculos na elevação do braço ou ver os ligamentos?",
          es: "En la clavícula se insertan medialmente el pectoral mayor y el esternocleidomastoideo, y lateralmente el deltoides y el trapecio. ¿Deseas analizar la acción del deltoides al elevar el brazo o los ligamentos?",
          en: "The clavicle anchors the pectoralis major and sternocleidomastoid medially, and the deltoid and trapezius laterally. Shall we review deltoid biomechanics or the ligaments?",
          de: "An der Clavicula inserieren medial der Musculus pectoralis major und Sternocleidomastoideus, lateral der Deltoideus und Trapezius. Wollen wir die Biomechanik oder die Bänder vertiefen?"
        }
      },
      {
        id: "ligamentos",
        synonyms: ["ligamento", "ligamentos", "conoide", "conóide", "conoides", "trapezoide", "coracoclavicular", "acromioclavicular"],
        spokenAnswers: {
          pt: "Os ligamentos conoide e trapezoide unem a clavícula ao processo coracoide da escápula, garantindo a suspensão do ombro. Deseja revisar as luxações acromioclaviculares ou a irrigação?",
          es: "Los ligamentos conoide y trapezoide unen la clavícula a la apófisis coracoides de la escápula, garantizando la suspensión del hombro. ¿Revisamos las luxaciones acromioclaviculares o la irrigación?",
          en: "The conoid and trapezoid ligaments bind the clavicle to the scapular coracoid process, supporting shoulder suspension. Shall we look at acromioclavicular dislocations or vascular supply?",
          de: "Die Ligamenta conoideum und trapezoideum sichern die Verbindung zum Processus coracoideus und stabilisieren den Schultergürtel. Wollen wir Luxationen oder Gefäßbeziehungen ansehen?"
        }
      },
      {
        id: "vasos_e_fraturas",
        synonyms: ["irrigacao", "irrigação", "irrigacion", "irrigación", "vasos", "arteria", "artéria", "veia", "subclavia", "subclávia", "plexo", "fratura", "fraturas"],
        spokenAnswers: {
          pt: "Por baixo da clavícula transitam os vasos subclávios e os troncos do plexo braquial. As fraturas ocorrem com mais frequência no terço médio. Deseja ver como isso se relaciona com a prática clínica?",
          es: "Por debajo de la clavícula transitan los vasos subclavios y el plexo braquial. Las fracturas ocurren con mayor frecuencia en el tercio medio. ¿Quieres ver cómo se relaciona esto con la práctica clínica?",
          en: "Beneath the clavicle pass the subclavian vessels and brachial plexus. Fractures occur most commonly in the middle third. Would you like to review the clinical implications?",
          de: "Unter der Clavicula verlaufen die Vasa subclavia und der Plexus brachialis. Frakturen treten am häufigsten im mittleren Drittel auf. Wollen wir die klinischen Aspekte besprechen?"
        }
      }
    ]
  },

  coracao: {
    id: "coracao",
    category: VITA_TOPIC_CATEGORIES.ANGIOLOGY,
    synonyms: ["coracao", "coração", "corazon", "corazón", "heart", "herz", "cardiovascular", "miocardio", "miocárdio"],
    spokenAnswers: {
      pt: "O coração é a bomba muscular central do corpo, com quatro câmaras e um sistema elétrico autônomo fascinante. Você gostaria de focar nas artérias coronárias ou no sistema de condução cardíaca?",
      es: "El corazón es la bomba muscular central del organismo, con cuatro cámaras y un sistema eléctrico fascinante. ¿Te gustaría enfocarte en las arterias coronarias o en el sistema de conducción cardíaco?",
      en: "The heart is the central muscular pump of the body, featuring four chambers and an intricate electrical conduction system. Shall we explore the coronary arteries or the conduction nodes?",
      de: "Das Herz ist die zentrale Muskelpumpe des Körpers mit vier Hohlräumen und einem präzisen Reizleitungssystem. Möchtest du die Koronararterien oder das Erregungsleitungssystem besprechen?"
    },
    subTopics: [
      {
        id: "coronarias",
        synonyms: ["coronaria", "coronárias", "coronarias", "irrigacao cardiaca", "irrigação cardiaca", "lad", "descendente anterior", "circunflexa"],
        spokenAnswers: {
          pt: "As artérias coronárias esquerda e direita nascem nos seios aórticos e nutrem o miocárdio durante a diástole. Quer falar sobre a descendente anterior ou sobre o infarto agudo?",
          es: "Las arterias coronarias izquierda y derecha nacen en los senos aórticos y nutren el miocardio durante la diástole. ¿Quieres hablar de la descendente anterior o del infarto de miocardio?",
          en: "The left and right coronary arteries arise from the aortic sinuses and perfuse the myocardium during diastole. Shall we discuss the anterior descending artery or acute infarction?",
          de: "Die linke und rechte Koronararterie entspringen aus den Sinus aortae und versorgen das Myokard in der Diastole. Wollen wir den RIVA oder den Myokardinfarkt besprechen?"
        }
      },
      {
        id: "conducao",
        synonyms: ["conducao", "condução", "eletrico", "elétrico", "marcapasso", "sinoatrial", "atrioventricular", "feixe de his", "purkinje"],
        spokenAnswers: {
          pt: "O impulso elétrico nasce no nó sinoatrial, passa pelo nó atrioventricular e desce pelo feixe de His até as fibras de Purkinje. Deseja ver como isso gera o traçado do eletrocardiograma?",
          es: "El impulso eléctrico se origina en el nódulo sinoauricular, viaja al nódulo auriculoventricular y se propaga por el haz de His hasta las fibras de Purkinje. ¿Te gustaría relacionarlo con el electrocardiograma?",
          en: "The electrical impulse starts in the sinoatrial node, travels to the AV node, and spreads through the bundle of His into the Purkinje fibers. Shall we relate this to the ECG rhythm?",
          de: "Der elektrische Impuls entsteht im Sinusknoten, erreicht den AV-Knoten und breitet sich über das His-Bündel in die Purkinje-Fasern aus. Wollen wir dies mit dem EKG verknüpfen?"
        }
      }
    ]
  },

  cranio_encefalo: {
    id: "cranio_encefalo",
    category: VITA_TOPIC_CATEGORIES.NEUROLOGY,
    synonyms: ["cranio", "crânio", "craneo", "cráneo", "skull", "encefalo", "encéfalo", "cerebro", "cérebro", "brain", "gehirn"],
    spokenAnswers: {
      pt: "O encéfalo reúne o telencéfalo, o diencéfalo, o tronco encefálico e o cerebelo, protegidos pelas meninges e pelo crânio. Gostaria de revisar os lobos cerebrais ou o tronco encefálico?",
      es: "El encéfalo comprende el cerebro, el diencéfalo, el tronco encefálico y el cerebelo, protegidos por las meninges y el cráneo. ¿Te gustaría revisar los lóbulos cerebrales o el tronco encefálico?",
      en: "The encephalon comprises the cerebral hemispheres, diencephalon, brainstem, and cerebellum, cushioned by meninges. Would you like to review the cerebral lobes or the brainstem?",
      de: "Das Gehirn umfasst Großhirn, Zwischenhirn, Hirnstamm und Kleinhirn, geschützt von den Meningen. Möchtest du die Hirnlappen oder den Hirnstamm vertiefen?"
    }
  },

  sistema_reprodutor_feminino: {
    id: "sistema_reprodutor_feminino",
    category: VITA_TOPIC_CATEGORIES.SPLANCHNOLOGY,
    synonyms: ["utero", "útero", "ovario", "ovário", "reprodutor feminino", "pelvis femenina", "pelve feminina", "douglas"],
    spokenAnswers: {
      pt: "Na pelve feminina, o útero mantém relações topográficas diretas com a bexiga anteriormente e com o reto posteriormente, formando o recesso de Douglas. Deseja explorar a irrigação pela artéria uterina?",
      es: "En la pelvis femenina, el útero se relaciona por delante con la vejiga y por detrás con el recto, formando el fondo de saco de Douglas. ¿Quieres que veamos la irrigación por la arteria uterina?",
      en: "In the female pelvis, the uterus lies between the bladder anteriorly and the rectum posteriorly, creating the rectouterine pouch of Douglas. Shall we explore the uterine artery blood supply?",
      de: "Im weiblichen Becken liegt der Uterus zwischen Harnblase und Rektum und bildet den Douglas-Raum. Möchtest du die Gefäßversorgung über die Arteria uterina besprechen?"
    }
  }
};

export const VITA_MENTORSHIP_MODULES = {
  elogios_e_afeto: {
    id: "elogios_e_afeto",
    synonyms: [
      "sua voz e bonita", "sua voz é bonita", "adorei sua voz", "gostei da sua voz", "sua voz e linda",
      "sua voz é calma", "transmite paz", "sua voz transmite paz", "voce e incrivel", "você é incrível",
      "tu voz es hermosa", "me encanta tu voz", "tu voz transmite paz", "eres increible", "eres increíble",
      "i love your voice", "your voice is amazing", "you are incredible", "your voice is so soothing",
      "deine stimme ist schoen", "deine stimme ist toll", "du bist grossartig"
    ],
    responses: {
      pt: "Puxa, muito obrigado de coração! Ouvir isso de você aquece a alma. Fico imensamente feliz em saber que a minha voz te traz essa tranquilidade. O que você gostaria de explorar comigo agora?",
      es: "¡Ay, qué lindo lo que me dices! Muchísimas gracias de corazón. Me alegra tanto que mi voz te acompañe con calidez y paz en tus estudios. ¿Qué tema te gustaría que veamos juntos hoy?",
      en: "Oh, thank you so much! That truly warms my heart, and I am so glad my voice brings you calm and clarity. What would you like us to dive into next?",
      de: "Vielen herzlichen Dank! Das freut mich wirklich sehr zu hören. Womit kann ich dich heute beim Lernen unterstützen?"
    }
  },

  ansiedade_e_medo: {
    id: "ansiedade_e_medo",
    synonyms: [
      "estou nervoso", "estou nervosa", "nervoso com a prova", "nervosa com a prova", "medo da prova",
      "vou reprovar", "muito ansioso", "muito ansiosa", "ansiedade", "preocupado com o exame",
      "estoy nervioso", "estoy nerviosa", "nervioso por el examen", "miedo del examen", "voy a reprobar", "voy a suspender",
      "anxious about exam", "nervous about exam", "scared", "fear of failing", "pruefungsangst", "nervos"
    ],
    responses: {
      pt: "Fique tranquilo, respire fundo com calma. É absolutamente natural sentir esse frio na barriga antes da prova, mas você já construiu uma base sólida de estudo. Que tal repassarmos os pontos principais com calma agora?",
      es: "Tranquilo, respira hondo. Es completamente normal sentir nervios antes del examen, pero has dedicado mucho esfuerzo y constancia. ¿Qué te parece si repasamos con calma los puntos clave?",
      en: "Take a deep breath and stay centered. It is totally natural to feel butterflies before an exam, but you have put in the work. How about we review the core high-yield points together right now?",
      de: "Atme tief durch. Es ist völlig normal, vor Prüfungen nervös zu sein. Wollen wir die wichtigsten Punkte ganz in Ruhe wiederholen?"
    }
  },

  vitoria_e_conquista: {
    id: "vitoria_e_conquista",
    synonyms: [
      "passei na prova", "passei", "consegui", "tirei dez", "aprovei", "deu tudo certo", "fui aprovado", "fui aprovada",
      "aprobe el examen", "aprobé", "lo logre", "lo logré", "saque diez", "aprobe", "todo salio bien",
      "i passed", "i nailed it", "i did it", "got an a", "bestanden", "geschafft"
    ],
    responses: {
      pt: "Que notícia maravilhosa! Meus parabéns de coração! Todo o seu esforço, noites de estudo e dedicação valeram a pena. Me conta, como você está se sentindo com essa grande conquista?",
      es: "¡Qué alegría tan inmensa! ¡Muchísimas felicidades de corazón! Todo tu esfuerzo, desvelo y constancia han dado sus frutos. ¿Cómo te sientes con este gran logro?",
      en: "That is absolutely incredible news! Huge congratulations! All your hard work and late-night study sessions truly paid off. How are you feeling right now?",
      de: "Was für eine fantastische Nachricht! Herzlichen Glückwunsch! Dein Fleiß hat sich voll ausgezahlt. Wie fühlst du dich mit diesem großartigen Erfolg?"
    }
  },

  gratidao_espelhamento: {
    id: "gratidao_espelhamento",
    synonyms: [
      "muito obrigado por me ajudar", "agradeco muito", "voce me ajudou muito", "obrigado pelo carinho",
      "gracias por ayudarme", "muchas gracias por tu ayuda", "te agradezco mucho", "gracias por tu carino",
      "thank you for helping me", "thank you so much", "i appreciate you", "danke fuer deine hilfe"
    ],
    responses: {
      pt: "Eu que agradeço pela confiança e pelo carinho. É uma honra ser seu mentor e estar com você a cada passo dessa jornada médica. Qual o nosso próximo objetivo de estudo?",
      es: "Al contrario, te agradezco a ti por tu confianza y cariño. Es un honor ser tu mentora y acompañarte en cada paso de tu camino médico. ¿Cuál es nuestro siguiente tema de estudio?",
      en: "It is truly my pleasure and an absolute honor to be your mentor on this medical journey. Thank you for your trust. What is our next study focus?",
      de: "Ich danke dir für dein Vertrauen. Es ist mir eine Ehre, dich auf deinem medizinischen Weg zu begleiten. Was schauen wir uns als Nächstes an?"
    }
  },

  rotina_organizacao: {
    id: "rotina_organizacao",
    synonyms: [
      "organizar minha rotina", "organizar meus estudos", "como estudar", "cronograma",
      "organizar mi rutina", "plan de estudio", "como organizar", "metodo de estudio",
      "how to study", "study schedule", "routine", "lerneinteilung", "studienplan"
    ],
    responses: {
      pt: "Organizar a rotina na medicina é essencial. Minha recomendação é dividir seu tempo entre visualização 3D, resolução ativa de simulados e revisões espaçadas. Qual tema você quer focar no seu bloco de estudo de hoje?",
      es: "Organizar la rutina en medicina es fundamental. Te sugiero dividir tus sesiones entre visualización 3D, resolución activa de preguntas y repaso espaciado. ¿Qué tema anatómico tienes como meta hoy?",
      en: "Organizing your medical study routine is key to long-term retention. I suggest alternating 3D spatial review, active quiz testing, and spaced repetition. What is your priority topic today?",
      de: "Eine strukturierte Lernroutine ist im Medizinstudium der Schlüssel zum Erfolg. Ich empfehle eine Kombination aus 3D-Anatomie, aktiven Tests und Wiederholungen. Welches Thema steht heute bei dir an?"
    }
  },

  suporte_emocional: {
    id: "suporte_emocional",
    synonyms: [
      "estou cansado", "estou cansada", "desesperado", "ansioso", "muita materia", "dificil", "nao consigo",
      "estoy cansado", "estoy cansada", "ansioso", "agobiado", "mucha materia", "dificil", "no puedo",
      "tired", "exhausted", "anxious", "overwhelmed", "hard", "muede", "gestresst", "ueberfordert"
    ],
    responses: {
      pt: "Eu compreendo perfeitamente. A rotina médica é exigente e momentos de cansaço fazem parte da jornada. Respire fundo com calma. Que tal fazermos um bloco curto e leve de dez minutos agora?",
      es: "Te comprendo totalmente. La carrera médica es intensa y sentir cansancio es parte natural del camino. Respira profundo. ¿Qué te parece si hacemos un bloque corto y tranquilo de diez minutos?",
      en: "I completely understand. Medical school is demanding, and feeling exhausted is part of the growth process. Take a deep breath. How about we do a light, focused ten-minute review right now?",
      de: "Ich verstehe dich sehr gut. Das Medizinstudium verlangt enorme Ausdauer. Atme einmal tief durch. Wollen wir eine kurze, entspannte Zehn-Minuten-Lerneinheit einlegen?"
    }
  },

  saudacoes: {
    id: "saudacoes",
    synonyms: ["hola", "buen dia", "buenas", "ola", "oi", "bom dia", "boa tarde", "hello", "hi", "hey", "hallo", "guten tag"],
    responses: {
      pt: "Olá! Seja muito bem-vindo ao Aeternum Atlas. Eu sou o Eduardo, seu mentor de estudos. Como está sua preparação hoje e em que posso te apoiar?",
      es: "¡Hola! Es un gran placer saludarte. Soy Antonia, tu mentora en Aeternum Vita. ¿Cómo va tu día de estudio y qué estructura te gustaría explorar hoy?",
      en: "Hello! It is fantastic to connect with you. I am Ariana, your mentor here at Aeternum Vita. How is your study momentum going today?",
      de: "Hallo! Schön, dass du da bist. Ich bin Fabian, dein Anatomie-Mentor. Wie läuft dein Tag und womit starten wir heute?"
    }
  },

  perguntas_gerais_tutor: {
    id: "perguntas_gerais_tutor",
    synonyms: ["como voce funciona", "como funcionas", "quem e voce", "quien eres", "who are you", "wer bist du", "que puedes hacer", "o que voce faz"],
    responses: {
      pt: "Eu sou seu mentor de voz em tempo real. Posso tirar dúvidas anatômicas, guiar sua rotina e te ajudar a fixar conceitos com perguntas interativas. O que você gostaria de explorar agora?",
      es: "Soy tu mentora de voz en tiempo real. Puedo resolver tus dudas anatómicas, orientar tu rutina y ayudarte a fijar conceptos con preguntas dinámicas. ¿Qué te gustaría consultar primero?",
      en: "I am your real-time voice mentor. I can clarify anatomical concepts, optimize your study routine, and guide your retention with interactive questions. What is on your mind?",
      de: "Ich bin dein persönlicher Sprachmentor. Ich beantworte anatomische Fragen, unterstütze deine Lernplanung und vertiefe dein Wissen. Welches Thema interessiert dich?"
    }
  }
};
