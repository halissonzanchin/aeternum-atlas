/**
 * Cérebro Aeternum — Cofre de Conhecimento Dinâmico & Ingestão Contínua
 * Base de Conhecimento Multidimensional (Anatomia, Semiologia, Cirurgia, Fisiologia, Psicologia e Coaching)
 */

export const CEREBRO_CATEGORIES = {
  OSTEOLOGY: "osteologia_artrologia",
  ANGIOLOGY: "angiologia_vascular",
  MYOLOGY: "miologia_biomecanica",
  NEUROLOGY: "neuroanatomia_pares_cranianos",
  SPLANCHNOLOGY: "esplancnologia_visceras",
  LYMPHATIC: "sistema_linfatico_imunologia",
  CLINICAL_SURGERY: "clinica_cirurgia",
  PSYCHOLOGY_EMOTIONAL: "psicologia_apoio_emocional",
  STUDY_COACHING: "coaching_metodologia_estudo"
};

/**
 * Registro de Nós de Conhecimento do Cérebro Aeternum
 * Pode ser alimentado dinamicamente em tempo de execução ou via banco de dados
 */
export const CEREBRO_KNOWLEDGE_NODES = {
  clavicula: {
    id: "clavicula",
    category: CEREBRO_CATEGORIES.OSTEOLOGY,
    title: {
      pt: "Clavícula e Cíngulo do Membro Superior",
      es: "Clavícula y Cintura Escapular",
      en: "Clavicle and Pectoral Girdle",
      de: "Clavicula und Schultergürtel"
    },
    synonyms: ["clavicula", "clavícula", "clavicle", "collarbone", "acromion", "omoplata", "escapula", "hombro", "ombro", "shoulder"],
    coreConcept: {
      pt: "Única união óssea real entre o membro superior e o esqueleto axial, com formato em 'S' itálico.",
      es: "Única unión ósea real entre el miembro superior y el esqueleto axial, con forma de 'S' itálica.",
      en: "The only bony attachment between the upper limb and the axial skeleton, forming an italic 'S' shape.",
      de: "Einzige knöcherne Verbindung zwischen der oberen Extremität und dem Rumpfskelett in S-Form."
    },
    vascularSupply: {
      pt: "Artérias supraescapular e toracoacromial, com íntima relação inferior aos grandes vasos subclávios.",
      es: "Arterias supraescapular y toracoacromial, con íntima relación inferior a los grandes vasos subclavios.",
      en: "Suprascapular and thoracoacromial arteries, in close proximity to subclavian vessels.",
      de: "Arteria suprascapularis und thoracoacromialis mit direkter Lage über den Subclavia-Gefäßen."
    },
    innervationAndMuscles: {
      pt: "Nervos supraclaviculares; inserções do músculo peitoral maior, deltoide, trapézio e subclávio.",
      es: "Nervios supraclaviculares; inserciones de pectoral mayor, deltoides, trapecio y subclavio.",
      en: "Supraclavicular nerves; attachments for pectoralis major, deltoid, trapezius, and subclavius.",
      de: "Nervi supraclaviculares; Ansätze für M. pectoralis major, M. deltoideus, M. trapezius und M. subclavius."
    },
    clinicalPearls: {
      pt: "Fraturas ocorrem mais comumente no terço médio (80%), com risco de compressão do plexo braquial e artéria subclávia.",
      es: "Las fracturas ocurren principalmente en el tercio medio (80%), con riesgo de compresión del plexo braquial y vasos subclavios.",
      en: "Fractures most frequently occur at the middle third (80%), risking brachial plexus and subclavian compression.",
      de: "Frakturen treten meist im mittleren Drittel auf (80%), mit Risiko für Plexus brachialis und Gefäßkompression."
    },
    voiceSummary: {
      pt: "A clavícula funciona como uma haste de sustentação mecânica que projeta o ombro lateralmente e protege os vasos subclávios. Deseja analisar os ligamentos coracoclaviculares ou os músculos peitoral e deltoide?",
      es: "La clavícula es el único puente óseo que une el brazo con el tórax, protegiendo los grandes vasos subclavios. ¿Quieres que veamos sus ligamentos coracoclaviculares o los músculos que se insertan en ella?",
      en: "The clavicle acts as a mechanical strut transmitting upper limb forces to the axial skeleton while protecting the subclavian vessels. Would you like to review its ligaments or muscular attachments?",
      de: "Die Clavicula stabilisiert den Schultergürtel als einzige knöcherne Verbindung zum Rumpf und schützt die großen Subclavia-Gefäße. Möchtest du die Bandstrukturen oder die Muskelansätze vertiefen?"
    }
  },

  coracao: {
    id: "coracao",
    category: CEREBRO_CATEGORIES.ANGIOLOGY,
    title: {
      pt: "Coração e Circulação Coronariana",
      es: "Corazón y Circulación Coronaria",
      en: "Heart and Coronary Circulation",
      de: "Herz und Koronarkreislauf"
    },
    synonyms: ["coracao", "coração", "corazon", "corazón", "heart", "herz", "miocardio", "cardiaco", "valva", "valvula", "aorta"],
    coreConcept: {
      pt: "Bomba muscular oca de quatro cavidades situada no mediastino médio, envolvida pelo pericárdio fibroseroso.",
      es: "Bomba muscular hueca de cuatro cavidades en el mediastino medio, envuelta por el pericardio.",
      en: "Four-chambered muscular organ located in the middle mediastinum, enclosed by the pericardium.",
      de: "Vierkammrige muskuläre Hohlorganpumpe im mittleren Mediastinum, umgeben vom Perikard."
    },
    vascularSupply: {
      pt: "Irrigação pelas artérias coronárias direita e esquerda durante a diástole ventricular.",
      es: "Irrigación por arterias coronarias derecha e izquierda durante la diástole ventricular.",
      en: "Perfusion through right and left coronary arteries arising from aortic sinuses during diastole.",
      de: "Versorgung über die rechte und linke Koronararterie während der Diastole."
    },
    clinicalPearls: {
      pt: "A artéria descendente anterior (ramo interventricular anterior) é o vaso mais frequentemente ocluído no infarto agudo do miocárdio.",
      es: "La arteria descendente anterior es el vaso que se ocluye con mayor frecuencia en el infarto agudo de miocardio.",
      en: "The left anterior descending (LAD) artery is the most commonly occluded vessel in myocardial infarction.",
      de: "Der Ramus interventricularis anterior (RIVA) ist das am häufigsten verschlossene Gefäß beim Myokardinfarkt."
    },
    voiceSummary: {
      pt: "O coração bombeia o débito cardíaco para todo o corpo e se nutre em diástole pelas artérias coronárias direita e esquerda. Faz sentido para você revermos a irrigação coronariana ou o ciclo cardíaco?",
      es: "El corazón bombea sangre a todo el organismo y sus propias paredes se irrigan en diástole por las arterias coronarias. ¿Te gustaría profundizar en el ciclo cardíaco o en las ramas coronarias?",
      en: "The heart functions as a synchronized four-chambered pump perfused during diastole by coronary branches. Would you like to explore coronary anatomy or the cardiac cycle?",
      de: "Das Herz arbeitet als muskuläre Pumpe, deren Myokard in der Diastole über die Koronararterien versorgt wird. Sollen wir die Herzkranzgefäße oder das Reizleitungssystem besprechen?"
    }
  },

  sistema_linfatico: {
    id: "sistema_linfatico",
    category: CEREBRO_CATEGORIES.LYMPHATIC,
    title: {
      pt: "Sistema Linfático e Cadeias Ganglionares",
      es: "Sistema Linfático y Cadenas Ganglionares",
      en: "Lymphatic System and Lymph Node Chains",
      de: "Lymphatisches System und Lymphknotenstationen"
    },
    synonyms: ["linfatico", "linfático", "ganglio", "gânglio", "linfonodo", "linfa", "ducto toracico", "baco", "bazo", "spleen"],
    coreConcept: {
      pt: "Rede de capilares, vasos e linfonodos responsável pela drenagem do líquido intersticial e vigilância imunológica.",
      es: "Red de vasos y ganglios encargada del drenaje del líquido intersticial y la vigilancia inmunitaria.",
      en: "Network of vessels and nodes responsible for interstitial fluid drainage and immune surveillance.",
      de: "Gefäß- und Knotensystem zur Drainage der interstitiellen Flüssigkeit und Immunabwehr."
    },
    voiceSummary: {
      pt: "A irrigação arterial conduz oxigênio sob alta pressão, enquanto a rede de gânglios linfáticos filtra impurezas e atua na defesa imunológica. Quer explorar as cadeias de linfonodos ou os troncos arteriais?",
      es: "La irrigación nutre los tejidos bajo alta presión, mientras los vasos y ganglios linfáticos filtran la linfa y defienden el organismo. ¿Deseas repasar las cadenas ganglionares axilares o las arterias principales?",
      en: "Arterial circulation delivers oxygen under pressure, while lymph nodes filter pathogens and immune cells. Shall we examine axillary lymph node groups or main arterial trunks?",
      de: "Arterien versorgen das Gewebe unter Druck, während Lymphknoten als biologische Filterstationen der Immunabwehr dienen. Wollen wir die axillären Lymphknoten oder die Hauptarterien besprechen?"
    }
  },

  encefalo_willis: {
    id: "encefalo_willis",
    category: CEREBRO_CATEGORIES.NEUROLOGY,
    title: {
      pt: "Encéfalo e Polígono Arterial de Willis",
      es: "Encéfalo y Polígono Arterial de Willis",
      en: "Brain and Arterial Circle of Willis",
      de: "Gehirn und Circulus arteriosus cerebri (Willis)"
    },
    synonyms: ["encefalo", "encéfalo", "cerebro", "cérebro", "brain", "willis", "carotida", "carótida", "pares cranianos", "nervios craneales"],
    coreConcept: {
      pt: "Anel anastomótico arterial na base do cérebro unindo os sistemas carotídeo interno e vertebrobasilar.",
      es: "Anillo anastomótico arterial en la base del cerebro que une los sistemas carotídeo y vertebrobasilar.",
      en: "Arterial anastomotic ring at the skull base uniting carotid and vertebrobasilar circulations.",
      de: "Arterieller Anastomosenring an der Schädelbasis zwischen Karotis- und Vertebrobasilarissystem."
    },
    voiceSummary: {
      pt: "O encéfalo coordena todas as funções vitais e motoras, nutrido pelo polígono de Willis com anastomoses carótido-basilares. O que você gostaria de explorar: os doze pares cranianos ou as áreas do córtex?",
      es: "El encéfalo centraliza nuestras funciones y se nutre a través del polígono arterial de Willis. ¿Quieres explorar los doce pares craneales o la irrigación cerebral?",
      en: "The brain coordinates cognitive and motor systems, perfused by the Circle of Willis anastomoses. Would you like to explore the twelve cranial nerves or cerebral arterial branches?",
      de: "Das Gehirn wird über den Circulus arteriosus Willisii aus Karotis- und Vertebralisstromgebieten versorgt. Wollen wir die zwölf Hirnnerven oder die kortikalen Areale vertiefen?"
    }
  },

  femur_quadril: {
    id: "femur_quadril",
    category: CEREBRO_CATEGORIES.OSTEOLOGY,
    title: {
      pt: "Fêmur e Articulação Coxofemoral",
      es: "Fémur y Articulación Coxofemoral",
      en: "Femur and Hip Joint",
      de: "Femur und Hüftgelenk"
    },
    synonyms: ["femur", "fêmur", "quadril", "cadera", "hip", "acetabulo", "joelho", "rodilla", "trocanter"],
    coreConcept: {
      pt: "Maior e mais resistente osso do corpo humano, transmitindo carga do quadril para a tíbia.",
      es: "Hueso más largo y resistente del cuerpo humano, transmitiendo carga de la cadera a la tibia.",
      en: "Longest and strongest bone in the human body, bearing weight between pelvis and tibia.",
      de: "Längster und stärkster Röhrenknochen des menschlichen Körpers, Kraftüberträger vom Becken zur Tibia."
    },
    voiceSummary: {
      pt: "O fêmur é a principal viga de carga do membro inferior, nutrido pelas artérias circunflexas femorais e apoiado no acetábulo. Gostaria de rever a articulação coxofemoral ou os ligamentos do joelho?",
      es: "El fémur soporta todo el peso corporal transmitiéndolo a la tibia, irrigado por las arterias circunflejas femorales. ¿Revisamos la articulación de la cadera o los ligamentos de la rodilla?",
      en: "The femur serves as the primary weight-bearing column of the lower limb, supplied by femoral circumflex branches. Shall we review the hip joint or knee ligaments?",
      de: "Das Femur überträgt die Last vom Becken auf die Tibia, versorgt über die Arteriae circumflexae femoris. Wollen wir das Hüftgelenk oder die Kniebänder ansehen?"
    }
  },

  visceras_abdominais: {
    id: "visceras_abdominais",
    category: CEREBRO_CATEGORIES.SPLANCHNOLOGY,
    title: {
      pt: "Vísceras Abdominais e Tronco Celíaco",
      es: "Vísceras Abdominales y Tronco Celíaco",
      en: "Abdominal Viscera and Celiac Trunk",
      de: "Bauchorgane und Truncus coeliacus"
    },
    synonyms: ["viscera", "víscera", "figado", "fígado", "higado", "hígado", "pancreas", "pâncreas", "estomago", "estômago", "veia porta", "peritonio"],
    coreConcept: {
      pt: "Órgãos do trato digestivo e glândulas anexas organizados nas cavidades peritoneal e retroperitoneal.",
      es: "Órganos del tracto digestivo y glándulas anexas organizados en las cavidades peritoneal y retroperitoneal.",
      en: "Digestive organs and glands arranged within peritoneal and retroperitoneal compartments.",
      de: "Verdauungsorgane und Drüsen im Peritoneal- und Retroperitonealraum."
    },
    voiceSummary: {
      pt: "Os órgãos abdominais recebem sangue do tronco celíaco e convergem seu fluxo venoso para a veia porta hepática. Deseja analisar a segmentação do fígado ou a topografia das vísceras?",
      es: "Los órganos abdominales se nutren del tronco celíaco y drenan hacia la vena porta hepática. ¿Quieres analizar la segmentación hepática o la disposición de las vísceras?",
      en: "Abdominal organs are perfused by the celiac trunk and drain into the hepatic portal system. Would you like to analyze liver segmentation or visceral topography?",
      de: "Die Bauchorgane werden über den Truncus coeliacus versorgt und drainieren in die Pfortader. Wollen wir die Lebersegmente oder die Organlage besprechen?"
    }
  },

  pulmao_respiratorio: {
    id: "pulmao_respiratorio",
    category: CEREBRO_CATEGORIES.SPLANCHNOLOGY,
    title: {
      pt: "Pulmões e Árvore Traqueobrônquica",
      es: "Pulmones y Árbol Traqueobronquial",
      en: "Lungs and Tracheobronchial Tree",
      de: "Lungen und Tracheobronchialbaum"
    },
    synonyms: ["pulmao", "pulmão", "pulmon", "pulmón", "lung", "lunge", "bronquio", "diafragma", "pleura", "alveolo"],
    coreConcept: {
      pt: "Órgãos essenciais da respiração localizados na cavidade torácica, divididos em lobos e segmentos broncopulmonares.",
      es: "Órganos de la respiración en la cavidad torácica, divididos en lóbulos y segmentos broncopulmonares.",
      en: "Essential respiratory organs in the thoracic cavity divided into lobes and bronchopulmonary segments.",
      de: "Atmungsorgane in der Pleurahöhle, gegliedert in Lappen und bronchopulmonale Segmente."
    },
    voiceSummary: {
      pt: "Os pulmões realizam a hematose nos alvéolos com o auxílio do músculo diafragma, divididos em três lobos à direita e dois à esquerda. Deseja focar na árvore brônquica ou na mecânica ventilatória?",
      es: "Los pulmones realizan el intercambio gaseoso alveolar gracias al diafragma, con tres lóbulos a la derecha y dos a la izquierda. ¿Deseas enfocarte en el árbol bronquial o en la ventilación?",
      en: "The lungs carry out alveolar gas exchange driven by the diaphragm, with three lobes on the right and two on the left. Shall we focus on the bronchial tree or mechanics of breathing?",
      de: "Die Lunge ermöglicht den Gasaustausch in den Alveolen mithilfe des Zwerchfells, dreilappig rechts und zweilappig links. Wollen wir den Bronchialbaum oder die Atemmechanik vertiefen?"
    }
  }
};

/**
 * Registros de Psicologia, Mentoria e Coaching de Estudos
 */
export const CEREBRO_MENTORSHIP_NODES = {
  rotina_organizacao: {
    id: "rotina_organizacao",
    category: CEREBRO_CATEGORIES.STUDY_COACHING,
    synonyms: ["rotina", "organizar", "tempo", "cronograma", "como estudar", "planejar", "metodo", "pomodoro", "horario", "planificar", "routine", "schedule"],
    responses: {
      pt: "Veja bem, a melhor estratégia é estudar em blocos focados de vinte e cinco minutos, alternando teoria e visualização 3D. Quer que montemos um cronograma semanal ou prefere definir a meta de hoje?",
      es: "¡Te comprendo muy bien! La clave es estudiar en bloques de veinticinco minutos con pausas cortas para consolidar la memoria. ¿Prefieres que organicemos un plan semanal o que elijamos el tema de hoy?",
      en: "I love that initiative! Structuring twenty-five minute focused study intervals will dramatically boost your retention. Would you like to map out a weekly plan or tackle today's topic?",
      de: "Das ist ein hervorragender Ansatz. Kurze Lerneinheiten von fünfundzwanzig Minuten fördern die langfristige Behaltensleistung. Wollen wir einen Lernplan erstellen oder das heutige Thema wählen?"
    }
  },

  apoio_emocional_ansiedade: {
    id: "apoio_emocional_ansiedade",
    category: CEREBRO_CATEGORIES.PSYCHOLOGY_EMOTIONAL,
    synonyms: ["cansado", "perdido", "dificil", "medo", "estresse", "ansiedade", "desmotivado", "sobrecarregado", "nao consigo", "agobiado", "abrumado", "tired", "stressed"],
    responses: {
      pt: "Fique tranquilo, a jornada na medicina é intensa e esse sentimento faz parte do crescimento. Estou aqui para caminhar ao seu lado com calma. Que tal vermos um ponto simples e prático agora?",
      es: "Respira hondo, es completamente normal sentirse así en medicina. Estoy aquí para acompañarte paso a paso sin prisas. ¿Te gustaría que hagamos una pausa o que veamos un ejemplo sencillo juntos?",
      en: "Take a deep breath, medical studies are a marathon and you are doing great. I am here to guide you step by step. Shall we take it slow and break down one simple concept together?",
      de: "Atme erst einmal tief durch, das Medizinstudium ist anspruchsvoll und du machst das gut. Ich begleite dich Schritt für Schritt. Wollen wir ein einfaches Beispiel gemeinsam durchgehen?"
    }
  },

  direcionamento_temas: {
    id: "direcionamento_temas",
    category: CEREBRO_CATEGORIES.STUDY_COACHING,
    synonyms: ["por onde comeco", "por onde começo", "o que estudar", "sugestao", "sugestão", "conselho", "que estudio", "por donde empiezo", "what to study", "where to start"],
    responses: {
      pt: "Recomendo iniciarmos pelo esqueleto apendicular ou pela vascularização cardíaca, que conectam muito bem a teoria com a prática clínica. O que desperta mais sua curiosidade hoje?",
      es: "Te sugiero comenzar por las bases de osteología o el sistema cardiovascular, que son muy visuales y motivadores. ¿Te inclinas más por el miembro superior o por el corazón?",
      en: "I recommend starting with appendicular osteology or coronary vasculature, which bridge theory with clinical reasoning. Which of those sparks your curiosity today?",
      de: "Ich empfehle, mit der Osteologie der Extremitäten oder dem Koronargefäßsystem zu beginnen. Welcher Bereich weckt heute dein größtes Interesse?"
    }
  }
};
