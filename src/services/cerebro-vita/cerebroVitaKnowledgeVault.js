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
  esterno: {
    id: "esterno",
    category: VITA_TOPIC_CATEGORIES.OSTEOLOGY,
    synonyms: ["esterno", "esternon", "sternum", "brustbein", "peito", "torax osseo"],
    spokenAnswers: {
      pt: "O esterno é um osso plano localizado na linha média anterior do tórax, dividido em três partes: manúbrio, corpo e processo xifoide. Deseja analisar o ângulo esternal de Louis ou as fixações das costelas?",
      es: "El esternón es un hueso plano situado en la línea media anterior del tórax, dividido en manubrio, cuerpo y apófisis xifoides. ¿Quieres que veamos el ángulo de Louis o las uniones con las costillas?",
      en: "The sternum is a flat bone in the anterior midline of the thorax, comprising the manubrium, body, and xiphoid process. Shall we review the sternal angle of Louis or rib attachments?",
      de: "Das Sternum ist ein platter Knochen in der vorderen Thoraxwand, bestehend aus Manubrium, Corpus und Processus xiphoideus. Wollen wir den Angulus sterni besprechen?"
    },
    subTopics: [
      {
        id: "partes_anatomicas",
        synonyms: ["partes", "divisao", "divisoes", "manubrio", "corpo", "xifoide", "processo xifoide", "apofise", "quais partes", "tres partes", "quais sao as partes"],
        spokenAnswers: {
          pt: "O esterno é composto por três partes fundamentais: superiormente o manúbrio, no meio o corpo e inferiormente o processo xifoide. Quer ver como o manúbrio se une ao corpo formando o ângulo esternal?",
          es: "El esternón consta de tres porciones: superiormente el manubrio, en el centro el cuerpo y abajo la apófisis xifoides. ¿Deseas analizar la unión manubrioesternal?",
          en: "The sternum consists of three primary parts: the manubrium superiorly, the body in the middle, and the xiphoid process inferiorly. Shall we examine the sternal angle connecting them?",
          de: "Das Sternum gliedert sich in drei Teile: oben das Manubrium, in der Mitte das Corpus und unten den Processus xiphoideus."
        }
      },
      {
        id: "angulo_esternal",
        synonyms: ["angulo esternal", "angulo de louis", "angulo", "louis", "articulacao manubrioesternal", "manubrioesternal", "t4", "t5", "segunda costela", "2 costela"],
        spokenAnswers: {
          pt: "O ângulo esternal, ou ângulo de Louis, é a junção entre o manúbrio e o corpo do esterno. Ele marca exatamente o nível da segunda cartilagem costal e do disco T4-T5, sendo a principal referência clínica para contagem de costelas. Ficou claro esse conceito?",
          es: "El ángulo esternal, o ángulo de Louis, es la unión entre el manubrio y el cuerpo del esternón. Marca el nivel del segundo cartílago costal y de T4-T5, siendo clave para contar costillas. ¿Quedó claro este concepto?",
          en: "The sternal angle, or angle of Louis, is the junction between the manubrium and sternal body. It precisely marks the second costal cartilage and T4-T5 disc, serving as the landmark for counting ribs.",
          de: "Der Angulus sterni (Louis-Winkel) ist die Verbindung zwischen Manubrium und Corpus sterni auf Höhe der 2. Rippe und T4-T5."
        }
      },
      {
        id: "explicacao_analogia",
        synonyms: ["explica de outro jeito", "nao entendi", "ainda nao entendi", "outra forma", "analogia", "como assim", "me perdi", "simplifica"],
        spokenAnswers: {
          pt: "Vamos visualizar de forma bem prática: coloque a ponta dos dedos na base do seu pescoço e desça cerca de quatro centímetros pelo peito. Você vai sentir um relevo ósseo saliente em degrau: esse é o ângulo de Louis! Quer tentar sentir e continuar?",
          es: "Imaginémoslo de forma muy práctica: pon tus dedos en la base del cuello y baja unos cuatro centímetros sobre el pecho. Sentirás un relieve óseo palpable: ese es el ángulo de Louis. ¿Te hace más sentido así?",
          en: "Let us picture it practically: touch the base of your neck and slide your fingers about two inches down your chest. You will feel a distinct bony ridge: that is the sternal angle of Louis.",
          de: "Ganz praktisch: Taste vom Halsansatz etwa fünf Zentimeter nach unten, bis du eine tastbare Kante spürst. Das ist der Angulus sterni."
        }
      },
      {
        id: "correcao_erro_xifoide",
        synonyms: ["corpo e processo xifoide", "corpo e xifoide", "fica entre o corpo e o xifoide", "fica entre o corpo e o processo xifoide", "abaixo do corpo"],
        spokenAnswers: {
          pt: "Quase! Você localizou a extremidade inferior. O ângulo de Louis fica no topo, entre o manúbrio e o corpo. Na parte de baixo, entre o corpo e o xifoide, temos a articulação xifoesternal. Percebeu a diferença entre as duas extremidades?",
          es: "¡Casi! Localizaste el extremo inferior. El ángulo de Louis está arriba, uniendo el manubrio y el cuerpo. Abajo, entre el cuerpo y la xifoides, está la articulación xifoesternal. ¿Notas la diferencia?",
          en: "Almost! You pinpointed the lower end. The sternal angle is at the top, between the manubrium and body. Below, between the body and xiphoid, sits the xiphisternal joint.",
          de: "Fast! Der Angulus sterni liegt oben zwischen Manubrium und Corpus. Unten liegt die Symphysis xiphosternalis."
        }
      },
      {
        id: "articulacoes_costais",
        synonyms: ["costelas", "cartilagens", "incisuras", "clavicula e esterno", "articulacao esternoclavicular"],
        spokenAnswers: {
          pt: "Nas incisuras laterais do esterno articulam-se as sete primeiras cartilagens costais verdadeiras, e no topo do manúbrio ocorre a articulação esternoclavicular. Deseja ver a relação com a caixa torácica?",
          es: "En los bordes laterales del esternón se articulan los primeros siete cartílagos costales, y en el manubrio la articulación esternoclavicular. ¿Quieres relacionarlo con la caja torácica?",
          en: "The lateral borders of the sternum articulate with the first seven true costal cartilages, and the manubrium connects with the clavicle at the sternoclavicular joint.",
          de: "An den Rändern artikulieren die ersten sieben Rippenknorpel, und am Manubrium liegt die Articulatio sternoclavicularis."
        }
      }
    ]
  },

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
        id: "caras_bordas_extremidades",
        synonyms: [
          "cara", "caras", "borde", "bordes", "face", "faces", "borda", "bordas", "boards",
          "quantas caras", "quantos bordes", "quantas faces", "quantas bordas", "quantos lados",
          "extremidade", "extremidades", "extremidad", "esternal", "acromial",
          "sulco subclavio", "tuberculo conoide", "linha trapezoidea", "acidentes", "morfologia"
        ],
        spokenAnswers: {
          pt: "Anatomicamente, a clavícula possui duas faces — superior e inferior —, duas bordas — anterior e posterior — e duas extremidades — esternal e acromial. Na face inferior destacam-se o sulco do músculo subclávio e o tubérculo conoide. Deseja aprofundar nos músculos ou nos ligamentos agora?",
          es: "Anatómicamente, la clavícula presenta dos caras — superior e inferior —, dos bordes — anterior y posterior — y dos extremidades — esternal y acromial. En la cara inferior destacan el surco subclavio y el tubérculo conoideo. ¿Quieres profundizar en los músculos o ligamentos?",
          en: "Anatomically, the clavicle features two surfaces — superior and inferior —, two borders — anterior and posterior —, and two ends — sternal and acromial. The inferior surface features the subclavian groove and conoid tubercle. Shall we explore the muscle attachments or ligaments next?",
          de: "Anatomisch besitzt die Clavicula zwei Flächen — superior und inferior —, zwei Ränder — anterior und posterior — und zwei Enden — sternal und akromial. An der Unterseite liegen der Sulcus subclavius und das Tuberculum conoideum. Möchtest du Muskeln oder Bänder besprechen?"
        }
      },
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
  despedida_encerramento: {
    id: "despedida_encerramento",
    synonyms: [
      "vamos parar por aqui", "parar por aqui", "por hoje e so", "por hoje é só", "tchau", "tchau eduardo", "tchau antonia",
      "ate mais", "até mais", "boa noite", "bom descanso", "vou descansar", "vou dormir", "vamos encerrar",
      "encerrar", "obrigado pelo dialogo", "obrigado pela conversa", "obrigado pela aula", "valeu pelo dialogo",
      "adios", "hasta luego", "hasta pronto", "buenas noches", "descansar", "terminar por hoy", "gracias por la charla",
      "bye", "goodbye", "good night", "lets stop here", "see you later", "take care", "thanks for the chat",
      "tschüss", "gute nacht", "bis bald", "feierabend", "fuer heute reichts"
    ],
    responses: {
      pt: "Combinado! Foi um prazer imenso estudar com você hoje. Descanse bastante e recarregue as energias. Quando quiser continuar, estarei aqui por você!",
      es: "¡Entendido! Fue un verdadero placer acompañarte en tus estudios hoy. Descansa mucho y recarga energías. ¡Hasta la próxima, aquí estaré para ti!",
      en: "Sounds great! You did an amazing job today. Get some well-deserved rest, and I will be right here whenever you want to resume!",
      de: "Alles klar! Es war mir eine große Freude, dich heute zu begleiten. Ruh dich gut aus und bis zum nächsten Mal!"
    }
  },

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

/**
 * Banco de Sabatinas Orais Interativas (OSCE / VIVA Voce)
 * 3 Perguntas progressivas por sistema com validação semântica de palavras-chave.
 */
export const VITA_ORAL_QUIZZES = {
  clavicula: {
    id: "clavicula",
    topicName: "Clavícula e Cíngulo do Membro Superior",
    synonyms: ["clavicula", "clavícula", "ombro", "clavicle", "hombro", "schlüsselbein"],
    questions: [
      {
        index: 1,
        question: {
          pt: "Primeira pergunta: Quais são os dois ligamentos que unem o processo coracoide à clavícula e qual deles tem posição mais medial?",
          es: "Primera pregunta: ¿Cuáles son los dos ligamentos que unen la apófisis coracoides a la clavícula y cuál de ellos es más medial?",
          en: "First question: Which two ligaments bind the coracoid process to the clavicle, and which one is located more medially?",
          de: "Erste Frage: Welche zwei Bänder verbinden den Processus coracoideus mit der Clavicula und welches liegt medialer?"
        },
        expectedKeywords: ["conoide", "trapezoide", "conóide", "conoid", "trapezoid", "medial"],
        correctFeedback: {
          pt: "Excelente precisão anatômica! O ligamento conoide é medial e o trapezoide é lateral.",
          es: "¡Excelente precisión anatómica! El ligamento conoide es medial y el trapezoide es lateral.",
          en: "Spot on! The conoid ligament is medial and triangular, while the trapezoid is lateral.",
          de: "Ausgezeichnet! Das Ligamentum conoideum liegt medial und das trapezoideum lateral."
        },
        constructiveHint: {
          pt: "Lembre-se dos ligamentos coracoclaviculares: o conoide é medial e o trapezoide é lateral.",
          es: "Recuerda los ligamentos coracoclaviculares: el conoide es medial y el trapezoide es lateral.",
          en: "Keep in mind the coracoclavicular ligaments: conoid is medial, trapezoid is lateral.",
          de: "Merke dir: Das Ligamentum conoideum ist medial, das Ligamentum trapezoideum lateral."
        }
      },
      {
        index: 2,
        question: {
          pt: "Segunda pergunta: Em uma fratura do terço médio da clavícula, quais grandes vasos e estruturas nervosas passam logo abaixo do osso e correm risco de lesão?",
          es: "Segunda pregunta: En una fractura del tercio medio de la clavícula, ¿qué grandes vasos y nervios pasan justo debajo del hueso y corren riesgo?",
          en: "Second question: In a middle-third clavicular fracture, which major vessels and nerve trunks run beneath the bone and are at risk?",
          de: "Zweite Frage: Welche großen Gefäße und Nervenstränge verlaufen unter dem mittleren Drittel der Clavicula und sind bei Frakturen gefährdet?"
        },
        expectedKeywords: ["subclavia", "subclávia", "subclavian", "plexo", "braquial", "brachial"],
        correctFeedback: {
          pt: "Perfeito! A artéria e veia subclávias e os troncos do plexo braquial passam no espaço retroclavicular.",
          es: "¡Perfecto! La arteria y vena subclavias y los troncos del plexo braquial pasan por el espacio retroclavicular.",
          en: "Brilliant! The subclavian artery, subclavian vein, and brachial plexus trunks pass directly beneath.",
          de: "Perfekt! Die Vena und Arteria subclavia sowie die Trunci des Plexus brachialis verlaufen direkt darunter."
        },
        constructiveHint: {
          pt: "As estruturas vitais sob o terço médio são os vasos subclávios e os troncos do plexo braquial.",
          es: "Las estructuras clave bajo el tercio medio son los vasos subclavios y el plexo braquial.",
          en: "The critical structures underneath are the subclavian vessels and the brachial plexus trunks.",
          de: "Die entscheidenden Strukturen darunter sind die Subclavia-Gefäße und der Plexus brachialis."
        }
      },
      {
        index: 3,
        question: {
          pt: "Terceira pergunta para fechar: Quais dois músculos principais se inserem no terço lateral da clavícula?",
          es: "Tercera pregunta: ¿Cuáles son los dos músculos principales que se insertan en el tercio lateral de la clavícula?",
          en: "Final question: Which two primary muscles attach to the lateral third of the clavicle?",
          de: "Dritte Frage: Welche zwei Hauptmuskeln inserieren am lateralen Drittel der Clavicula?"
        },
        expectedKeywords: ["deltoide", "deltoides", "trapezio", "trapézio", "trapecio", "deltoid", "trapezius"],
        correctFeedback: {
          pt: "Sensacional! O deltoide se insere na borda anterior e o trapézio na borda posterior do terço lateral.",
          es: "¡Sensacional! El deltoides se inserta en el borde anterior y el trapecio en el posterior.",
          en: "Outstanding! The deltoid attaches anteriorly and the trapezius posteriorly on the lateral third.",
          de: "Hervorragend! Der Musculus deltoideus inseriert ventral und der Trapezius dorsal."
        },
        constructiveHint: {
          pt: "No terço lateral inserem-se o deltoide anteriormente e o trapézio posteriormente.",
          es: "En el tercio lateral se insertan el deltoides adelante y el trapecio atrás.",
          en: "On the lateral third, remember the deltoid anteriorly and the trapezius posteriorly.",
          de: "Am lateralen Drittel sitzen der Deltoideus vorne und der Trapezius hinten."
        }
      }
    ]
  },

  coracao: {
    id: "coracao",
    topicName: "Coração e Vasos Coronários",
    synonyms: ["coracao", "coração", "corazon", "corazón", "heart", "herz", "cardiovascular", "coronaria", "coronárias"],
    questions: [
      {
        index: 1,
        question: {
          pt: "Primeira pergunta: De onde se originam as artérias coronárias direita e esquerda na base da aorta?",
          es: "Primera pregunta: ¿De dónde se originan exactamente las arterias coronarias derecha e izquierda en la base aórtica?",
          en: "First question: From which exact structures at the aortic base do the right and left coronary arteries arise?",
          de: "Erste Frage: Wo genau an der Aortenbasis entspringen die rechte und linke Koronararterie?"
        },
        expectedKeywords: ["seio", "seios", "aortico", "aórtico", "valsalva", "sinus", "aorta"],
        correctFeedback: {
          pt: "Exato! Elas nascem nos seios aórticos direito e esquerdo, logo acima das cúspides da valva aórtica.",
          es: "¡Exacto! Nacen en los senos aórticos derecho e izquierdo, justo sobre las valvas semilunares.",
          en: "Spot on! They arise from the right and left aortic sinuses of Valsalva above the semilunar cusps.",
          de: "Genau! Sie entspringen aus dem Sinus aortae dexter und sinister oberhalb der Aortenklappe."
        },
        constructiveHint: {
          pt: "As coronárias nascem nos seios aórticos de Valsalva na raiz da aorta ascendente.",
          es: "Las coronarias nacen en los senos aórticos de Valsalva en la raíz de la aorta.",
          en: "The coronary arteries branch from the aortic sinuses of Valsalva at the aortic root.",
          de: "Die Koronararterien entspringen aus den Sinus aortae an der Aortenwurzel."
        }
      },
      {
        index: 2,
        question: {
          pt: "Segunda pergunta: Qual o marcapasso fisiológico do coração e onde ele se localiza no átrio direito?",
          es: "Segunda pregunta: ¿Cuál es el marcapasos natural del corazón y dónde se ubica en la aurícula derecha?",
          en: "Second question: What is the physiological pacemaker of the heart, and where is it located in the right atrium?",
          de: "Zweite Frage: Was ist der physiologische Schrittmacher des Herzens und wo im rechten Vorhof liegt er?"
        },
        expectedKeywords: ["sinoatrial", "sinusal", "cava", "superior", "crista", "terminal"],
        correctFeedback: {
          pt: "Perfeito! O nó sinoatrial localiza-se na junção entre a veia cava superior e o átrio direito.",
          es: "¡Perfecto! El nodo sinoauricular está en la unión de la vena cava superior con la aurícula derecha.",
          en: "Brilliant! The sinoatrial node sits at the junction of the superior vena cava and the right atrium.",
          de: "Perfekt! Der Sinusknoten liegt an der Mündung der Vena cava superior in das rechte Atrium."
        },
        constructiveHint: {
          pt: "O marcapasso é o nó sinoatrial, localizado próximo à desembocadura da veia cava superior.",
          es: "El marcapasos es el nodo sinoauricular, junto a la desembocadura de la vena cava superior.",
          en: "The primary pacemaker is the sinoatrial node, located near the superior vena cava opening.",
          de: "Der Schrittmacher ist der Sinusknoten nahe der Einmündung der oberen Hohlvene."
        }
      },
      {
        index: 3,
        question: {
          pt: "Terceira pergunta: Quais são os dois ramos principais originados da bifurcação da artéria coronária esquerda?",
          es: "Tercera pregunta: ¿Cuáles son las dos ramas principales que se originan de la bifurcación de la coronaria izquierda?",
          en: "Final question: What are the two main branches that arise from the bifurcation of the left main coronary artery?",
          de: "Dritte Frage: Welche zwei Hauptäste entspringen aus der Aufzweigung der linken Koronararterie?"
        },
        expectedKeywords: ["interventricular", "anterior", "descendente", "circunflexa", "circunfleja", "circumflex", "lad"],
        correctFeedback: {
          pt: "Sensacional! A coronária esquerda se divide na artéria interventricular anterior e na artéria circunflexa.",
          es: "¡Sensacional! La coronaria izquierda se divide en la interventricular anterior y la arteria circunfleja.",
          en: "Outstanding! The left coronary artery divides into the anterior interventricular and the circumflex artery.",
          de: "Hervorragend! Die linke Koronararterie teilt sich in den Ramus interventricularis anterior und Circumflexus."
        },
        constructiveHint: {
          pt: "Os dois ramos são a artéria interventricular anterior e a artéria circunflexa.",
          es: "Las dos ramas son la interventricular anterior y la circunfleja.",
          en: "The two branches are the anterior interventricular (LAD) and the circumflex branch.",
          de: "Die beiden Äste sind der Ramus interventricularis anterior und der Ramus circumflexus."
        }
      }
    ]
  }
};
