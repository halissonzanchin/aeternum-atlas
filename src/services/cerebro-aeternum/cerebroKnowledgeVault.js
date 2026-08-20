/**
 * Cérebro Aeternum — Base de Conhecimento Estruturada & Consciência Médica
 * Contém nós de Anatomia (Latarjet/Netter), Fisiologia, Psicologia e Coaching de Estudos
 */

export const CEREBRO_CATEGORIES = {
  OSTEOLOGY: "osteologia",
  ANGIOLOGY: "angiologia",
  NEUROLOGY: "neurologia",
  SPLANCHNOLOGY: "esplancnologia",
  LYMPHATICS: "linfatico",
  PSYCHOLOGY_EMOTIONAL: "psicologia_emocional",
  STUDY_COACHING: "coaching_estudo"
};

export const CEREBRO_KNOWLEDGE_NODES = {
  clavicula: {
    id: "clavicula",
    category: CEREBRO_CATEGORIES.OSTEOLOGY,
    title: {
      pt: "Clavícula e Cíngulo do Membro Superior",
      es: "Clavícula y Cintura Escapular",
      en: "Clavicle and Shoulder Girdle",
      de: "Clavicula und Schultergürtel"
    },
    synonyms: ["clavicula", "clavícula", "clavicle", "schlüsselbein"],
    coreConcept: {
      pt: "Osso longo em formato de 'S' itálico que conecta o membro superior ao esqueleto axial através da articulação esternoclavicular.",
      es: "Hueso largo con forma de 'S' itálica que une el miembro superior al esqueleto axial mediante la articulación esternoclavicular.",
      en: "Long S-shaped bone that anchors the upper limb to the axial skeleton via the sternoclavicular joint.",
      de: "S-förmiger Röhrenknochen, der die obere Extremität über das Sternoklavikulargelenk mit dem Rumpfskelett verbindet."
    },
    vascularSupply: {
      pt: "Irrigação primária por ramos da artéria supraescapular e artéria toracoacromial; drenagem para a veia subclávia.",
      es: "Irrigación por ramas de la arteria supraescapular y toracoacromial; drena hacia la vena subclavia.",
      en: "Supplied by branches of the suprascapular and thoracoacromial arteries; drained by the subclavian vein.",
      de: "Versorgung über Äste der A. suprascapularis und A. thoracoacromialis; Abfluss in die V. subclavia."
    },
    innervationAndMuscles: {
      pt: "Nervos supraclaviculares (C3-C4). Fixações musculares: peitoral maior, deltoide, trapézio e esternocleidomastoideo.",
      es: "Nervios supraclaviculares (C3-C4). Inserciones: pectoral mayor, deltoides, trapecio y esternocleidomastoideo.",
      en: "Supraclavicular nerves (C3-C4). Muscle attachments: pectoralis major, deltoid, trapezius, and sternocleidomastoid.",
      de: "Nn. supraclaviculares (C3-C4). Muskelansätze: M. pectoralis major, M. deltoideus, M. trapezius und M. sternocleidomastoideus."
    },
    clinicalPearls: {
      pt: "Fraturas ocorrem tipicamente no terço médio (80%), com risco anatômico direto para os vasos subclávios e tronco do plexo braquial.",
      es: "Las fracturas ocurren típicamente en el tercio medio (80%), con riesgo de lesión de los vasos subclavios y el plexo braquial.",
      en: "Fractures most frequently involve the middle third (80%), presenting risk to underlying subclavian vessels and brachial plexus.",
      de: "Frakturen betreffen typischerweise das mittlere Drittel (80%), mit Gefährdung der Vasa subclavia und des Plexus brachialis."
    },
    voiceSummary: {
      pt: "A clavícula é a única ponte óssea entre o braço e o tórax, protegendo os grandes vasos subclávios. Deseja aprofundar nos ligamentos ou nos músculos que se inserem nela?",
      es: "La clavícula es el único puente óseo que une el brazo con el tórax, protegiendo los grandes vasos subclavios. ¿Quieres que veamos sus ligamentos coracoclaviculares o los músculos que se insertan en ella?",
      en: "The clavicle is the sole bony bridge connecting the arm to the thorax, shielding the subclavian vessels. Would you like to explore its ligaments or muscular attachments?",
      de: "Die Clavicula ist die einzige knöcherne Verbindung zwischen Arm und Rumpf und schützt die Vasa subclavia. Wollen wir ihre Bänder oder die ansetzenden Muskeln besprechen?"
    },
    subTopics: [
      {
        id: "musculos",
        synonyms: ["musculo", "músculo", "musculos", "músculos", "pectoral", "peitoral", "deltoide", "deltoides", "trapezio", "trapézio", "trapecio"],
        responses: {
          pt: "Na clavícula inserem-se medialmente o peitoral maior e o esternocleidomastoideo, e lateralmente o deltoide e o trapézio. Deseja analisar a biomecânica do deltoide na elevação do braço ou os ligamentos?",
          es: "En la clavícula se insertan medialmente el pectoral mayor y el esternocleidomastoideo, y lateralmente el deltoides y el trapecio. ¿Deseas analizar la acción del deltoides al elevar el brazo o los ligamentos?",
          en: "The clavicle anchors the pectoralis major and sternocleidomastoid medially, and the deltoid and trapezius laterally. Shall we review deltoid biomechanics or the ligaments?",
          de: "An der Clavicula inserieren medial der M. pectoralis major und M. sternocleidomastoideus, lateral der M. deltoideus und M. trapezius. Wollen wir die Biomechanik oder die Bänder vertiefen?"
        }
      },
      {
        id: "ligamentos",
        synonyms: ["ligamento", "ligamentos", "conoide", "conóide", "conoides", "trapezoide", "coracoclavicular", "acromioclavicular"],
        responses: {
          pt: "Os ligamentos conoide e trapezoide unem a clavícula ao processo coracoide da escápula, garantindo a suspensão do ombro. Deseja revisar as luxações acromioclaviculares ou a irrigação?",
          es: "Los ligamentos conoide y trapezoide unen la clavícula a la apófisis coracoides de la escápula, garantizando la suspensión del hombro. ¿Revisamos las luxaciones acromioclaviculares o la irrigación?",
          en: "The conoid and trapezoid ligaments bind the clavicle to the scapular coracoid process, supporting shoulder suspension. Shall we look at acromioclavicular dislocations or vascular supply?",
          de: "Die Ligg. conoideum und trapezoideum sichern die Verbindung zum Processus coracoideus und stabilisieren den Schultergürtel. Wollen wir Luxationen oder Gefäßbeziehungen ansehen?"
        }
      },
      {
        id: "irrigacao_vasos",
        synonyms: ["irrigacao", "irrigação", "irrigacion", "irrigación", "vasos", "arteria", "artéria", "veia", "subclavia", "subclávia", "plexo braquial"],
        responses: {
          pt: "Por baixo da clavícula transitam os vasos subclávios, protegidos pelo músculo subclávio e separados pelo escaleno anterior. Quer ver a relação com o plexo braquial ou fraturas?",
          es: "Por debajo de la clavícula transitan los vasos subclavios, separados por el músculo escaleno anterior. ¿Quieres ver la relación con el plexo braquial o las fracturas óseas?",
          en: "Beneath the clavicle pass the subclavian vessels and brachial plexus, shielded by the subclavius muscle. Shall we review brachial plexus branches or clinical fracture risks?",
          de: "Unterhalb der Clavicula verlaufen die Vasa subclavia und der Plexus brachialis. Möchtest du Gefäßbeziehungen oder klinische Frakturrisiken besprechen?"
        }
      }
    ]
  },

  coracao_sistema_cardiovascular: {
    id: "coracao_sistema_cardiovascular",
    category: CEREBRO_CATEGORIES.ANGIOLOGY,
    title: {
      pt: "Coração e Sistema Cardiovascular Central",
      es: "Corazón y Sistema Cardiovascular Central",
      en: "Heart and Central Cardiovascular System",
      de: "Herz und zentrales Herz-Kreislauf-System"
    },
    synonyms: ["coracao", "coração", "corazon", "corazón", "heart", "herz", "miocardio", "valva", "valvula"],
    coreConcept: {
      pt: "Bomba muscular oca com quatro câmaras (dois átrios e dois ventrículos) localizada no mediastino médio, responsável pelo débito cardíaco sistêmico e pulmonar.",
      es: "Bomba muscular hueca de cuatro cavidades en el mediastino medio que impulsa el gasto cardíaco hacia la circulación sistémica y pulmonar.",
      en: "Hollow muscular four-chambered pump within the middle mediastinum driving systemic and pulmonary circulation.",
      de: "Vierkammrige muskuläre Hohlorganpumpe im mittleren Mediastinum zur Aufrechterhaltung des Körper- und Lungenkreislaufs."
    },
    vascularSupply: {
      pt: "Artérias coronárias direita e esquerda originadas nos seios aórticos de Valsalva; drenagem pelo seio coronário no átrio direito.",
      es: "Arterias coronarias derecha e izquierda originadas en los senos aórticos de Valsalva; drenaje por el seno coronario al atrio derecho.",
      en: "Right and left coronary arteries arising from Valsalva aortic sinuses; venous drainage into the right atrium via coronary sinus.",
      de: "A. coronaria dextra und sinistra aus den Sinus aortae; venöser Rückstrom über den Sinus coronarius in das rechte Atrium."
    },
    innervationAndMuscles: {
      pt: "Plexo cardíaco autonômico (simpático T1-T4 e parassimpático via nervo vago X). Miocárdio ventricular especializado na contração sincronizada.",
      es: "Plexo cardíaco autonómico (simpático T1-T4 y parasimpático por nervio vago X). Miocardio adaptado a la contracción sincrónica.",
      en: "Autonomic cardiac plexus (sympathetic T1-T4 and parasympathetic via vagus nerve CN X). Specialized syncytial myocardium.",
      de: "Plexus cardiacus (Sympathikus T1-T4 und Parasympathikus via N. vagus). Myokard mit synchronisierter Kontraktion."
    },
    clinicalPearls: {
      pt: "Oclusão aguda do ramo interventricular anterior (DA) é a causa mais prevalente de infarto transmural da parede anterior e septo.",
      es: "La oclusión aguda de la arteria descendente anterior es la causa más frecuente de infarto agudo de miocardio en la pared anterior.",
      en: "Acute occlusion of the anterior interventricular (LAD) branch is the most frequent cause of transmural anterior wall infarction.",
      de: "Akuter Verschluss des R. interventricularis anterior (RIVA/LAD) ist die häufigste Ursache eines Vorderwandinfarkts."
    },
    voiceSummary: {
      pt: "O coração bombeia cerca de cinco litros de sangue por minuto através de quatro câmaras sincronizadas. Deseja focar nas artérias coronárias ou no sistema de valvas?",
      es: "El corazón bombea sangre mediante cuatro cavidades reguladas por valvas unidireccionales y el sistema de conducción. ¿Quieres revisar las coronarias o las valvas cardíacas?",
      en: "The heart pumps approximately five liters of blood per minute through four synchronized chambers. Would you like to review coronary arteries or cardiac valves?",
      de: "Das Herz pumpt kontinuierlich Blut durch vier Kammern, gesteuert durch Herzklappen und das Erregungsleitungssystem. Wollen wir Klappen oder Koronargefäße besprechen?"
    },
    subTopics: [
      {
        id: "valvas",
        synonyms: ["valva", "valvas", "valvula", "valvulas", "mitral", "tricuspide", "tricúspide", "aortica", "aórtica", "pulmonar"],
        responses: {
          pt: "As valvas atrioventriculares (mitral e tricúspide) e semilunares (aórtica e pulmonar) garantem o fluxo unidirecional sem regurgitação. Quer que analisemos as cordas tendíneas ou o sopro cardíaco?",
          es: "Las valvas atrioventriculares (mitral y tricúspide) y semilunares (aórtica y pulmonar) impiden el reflujo sanguíneo. ¿Quieres profundizar en las cuerdas tendinosas o en los soplos cardíacos?",
          en: "The atrioventricular (mitral, tricuspid) and semilunar (aortic, pulmonary) valves enforce unidirectional blood flow. Shall we examine chordae tendineae or clinical murmurs?",
          de: "Die Segelklappen (Mitral-, Trikuspidalklappe) und Taschenklappen (Aorten-, Pulmonalklappe) sichern den unidirektionalen Blutfluss. Wollen wir Sehnenfäden oder Herzgeräusche ansehen?"
        }
      },
      {
        id: "conducao",
        synonyms: ["conducao", "condução", "conduccion", "conducción", "eletrica", "elétrica", "sinoatrial", "atrioventricular", "feixe de his", "purkinje"],
        responses: {
          pt: "O estímulo elétrico nasce no nó sinoatrial, passa pelo nó atrioventricular, feixe de His e fibras de Purkinje. Quer ver como isso se reflete nas ondas do eletrocardiograma?",
          es: "El impulso eléctrico nace en el nódulo sinoauricular, transita por el nódulo atrioventricular, haz de His y fibras de Purkinje. ¿Revisamos su correlación con el electrocardiograma?",
          en: "Electrical excitation originates at the SA node, traverses the AV node, bundle of His, and Purkinje fibers. Shall we relate this to ECG waveforms?",
          de: "Die Erregung entsteht im Sinusknoten, zieht über den AV-Knoten, das His-Bündel und die Purkinje-Fasern. Wollen wir den Bezug zum EKG besprechen?"
        }
      },
      {
        id: "coronarias",
        synonyms: ["coronaria", "coronárias", "coronarias", "irrigacao coronariana", "descendente anterior", "circunflexa"],
        responses: {
          pt: "A coronária esquerda se bifurca em descendente anterior e circunflexa, enquanto a direita irriga a parede inferior e nó SA. Deseja revisar a dominância coronariana ou os infartos?",
          es: "La coronaria izquierda se divide en descendente anterior y circunfleja, mientras la derecha nutre la cara inferior. ¿Deseas analizar la dominancia cardíaca o el infarto agudo?",
          en: "The left coronary artery bifurcates into the LAD and circumflex branches, while the right supplies the inferior wall. Shall we discuss coronary dominance or myocardial infarction?",
          de: "Die linke Koronararterie teilt sich in RIVA und RCX, während die rechte den Hinterwandbereich versorgt. Wollen wir Versorgungstypen oder Infarktmuster vertiefen?"
        }
      }
    ]
  },

  femur_membro_inferior: {
    id: "femur_membro_inferior",
    category: CEREBRO_CATEGORIES.OSTEOLOGY,
    title: {
      pt: "Fêmur e Articulação do Quadril",
      es: "Fémur y Articulación Coxofemoral",
      en: "Femur and Hip Joint",
      de: "Femur und Hüftgelenk"
    },
    synonyms: ["femur", "fêmur", "quadril", "trocanter", "coxofemoral", "thigh"],
    coreConcept: {
      pt: "O osso mais longo, volumoso e resistente do corpo humano, projetado para sustentação de carga e locomoção bípede.",
      es: "El hueso más largo, voluminoso y resistente del cuerpo humano, diseñado para soporte de peso y marcha.",
      en: "The longest, heaviest, and strongest bone in the human body, optimized for weight transmission and bipedal gait.",
      de: "Längster, schwerster und stärkster Röhrenknochen des menschlichen Körpers zur Lastübertragung beim aufrechten Gang."
    },
    voiceSummary: {
      pt: "O fêmur transmite o peso da pelve para a tíbia através de um ângulo colo-diáfise de cento e vinte e seis graus. Deseja focar no colo femoral ou nas inserções do trocânter?",
      es: "El fémur transmite el peso corporal hacia la tibia con un ángulo cérvico-diafisario de ciento veintiséis grados. ¿Quieres ver el cuello femoral o las inserciones en los trocánteres?",
      en: "The femur transmits body weight to the tibia with a normal neck-shaft angle of one hundred and twenty-six degrees. Shall we explore the femoral neck or trochanteric attachments?",
      de: "Das Femur leitet das Körpergewicht auf die Tibia weiter mit einem physiologischen Schenkelhalswinkel von einhundertsechsundzwanzig Grad. Wollen wir den Schenkelhals oder die Trochanteren vertiefen?"
    }
  },

  encefalo_sistema_nervoso: {
    id: "encefalo_sistema_nervoso",
    category: CEREBRO_CATEGORIES.NEUROLOGY,
    title: {
      pt: "Encéfalo e Polígono de Willis",
      es: "Encéfalo y Polígono de Willis",
      en: "Brain and Circle of Willis",
      de: "Gehirn und Circulus arteriosus cerebri"
    },
    synonyms: ["cerebro", "cérebro", "encefalo", "encéfalo", "brain", "gehirn", "willis", "meninge"],
    coreConcept: {
      pt: "Centro supremo de integração sensorial, controle motor, homeostase e cognição abrigado na caixa craniana.",
      es: "Centro de integración sensorial, control motor voluntario, homeostasis y cognición superior alojado en el cráneo.",
      en: "Master organ for sensory integration, motor coordination, cognitive processing, and homeostasis inside the cranium.",
      de: "Zentrales Integrationsorgan für Sensorik, Motorik, Kognition und vegetative Regulation im Neurokranium."
    },
    voiceSummary: {
      pt: "O encéfalo consome vinte por cento do oxigênio corporal e é irrigado pelo polígono arterial de Willis. Deseja explorar as artérias cerebrais ou os lobos corticais?",
      es: "El encéfalo consume el veinte por ciento del oxígeno corporal y recibe sangre del círculo arterial de Willis. ¿Quieres ver las arterias cerebrales o los lóbulos corticales?",
      en: "The brain utilizes twenty percent of resting cardiac output and is perfused by the Circle of Willis. Would you like to analyze cerebral arteries or cortical lobes?",
      de: "Das Gehirn verbraucht zwanzig Prozent des Sauerstoffs und wird durch den Circulus arteriosus Willisii versorgt. Wollen wir die Hirnarterien oder die Kortexlappen besprechen?"
    }
  }
};

/**
 * Registros de Mentoria, Psicologia, Coaching de Estudos e Diálogo Humano Natural
 */
export const CEREBRO_MENTORSHIP_NODES = {
  como_funciona: {
    id: "como_funciona",
    category: CEREBRO_CATEGORIES.STUDY_COACHING,
    synonyms: ["como funcionas", "como voce funciona", "como você funciona", "explicame como funcionas", "me explica como você funciona", "como tu funcionas", "como você trabalha", "how do you work", "wie funktionierst du", "que haces tu", "o que voce faz exatamente"],
    responses: {
      pt: "Tudo ótimo, obrigado! Olha, eu sou seu mentor e estou aqui para te orientar de forma simples e direta no Aeternum Vita. Gostaria de saber algo específico sobre o sistema?",
      es: "Todo muy bien, gracias. Mira, soy tu mentora y estoy aquí para orientarte de forma sencilla y directa sobre Aeternum Vita. ¿Te gustaría saber algo específico sobre el sistema?",
      en: "Everything is great, thank you! I am your mentor and I am here to guide you simply and directly through Aeternum Vita. Would you like to know something specific about the system?",
      de: "Alles bestens, danke! Ich bin dein Mentor und begleite dich einfach und direkt durch Aeternum Vita. Möchtest du etwas Bestimmtes über das System wissen?"
    }
  },

  multidisciplinar_escopo: {
    id: "multidisciplinar_escopo",
    category: CEREBRO_CATEGORIES.STUDY_COACHING,
    synonyms: ["anatomia ou psicologia", "anatomia o psicologia", "rutina del dia a dia", "rotina do dia a dia", "resolver isso", "podes resolver eso", "pode resolver isso", "can you solve that", "anatomia e rotina", "psicologia e estudo"],
    responses: {
      pt: "Com certeza! Posso te ajudar a organizar sua rotina e orientar em anatomia, psicologia ou metodologia de estudo. Só me dizer por onde quer começar: o que é mais urgente para você hoje?",
      es: "Claro que sí, puedo ayudarte a organizar tu rutina y darte orientación en anatomía, psicología o estudio. Solo dime por dónde quieres empezar, ¿qué es lo que más te urge resolver hoy?",
      en: "Absolutely! I can help you organize your routine and guide you across anatomy, mindset, and study strategies. Just tell me where you would like to begin: what is most urgent for you today?",
      de: "Selbstverständlich! Ich helfe dir bei deiner Lernorganisation und berate dich in Anatomie, Psychologie und Studienalltag. Womit möchtest du starten?"
    }
  },

  organizar_agenda: {
    id: "organizar_agenda",
    category: CEREBRO_CATEGORIES.STUDY_COACHING,
    synonyms: ["organizar agenda", "organizar mi agenda", "organizar minha agenda", "organizar cronograma", "organizar horario", "organize my schedule", "organizar el tiempo", "organizar o tempo"],
    responses: {
      pt: "Com certeza! O ideal é priorizar suas tarefas mais importantes no início do dia. Você prefere organizar seu tempo por blocos de horários ou por uma lista de pendências?",
      es: "Por supuesto, lo ideal es priorizar tus tareas más importantes al inicio del día. ¿Prefieres organizar tu tiempo por bloques horarios o por una lista de pendientes?",
      en: "Of course! The key is prioritizing your most critical tasks early in the day. Do you prefer time-blocking or a structured to-do checklist?",
      de: "Natürlich! Am besten priorisierst du die wichtigsten Aufgaben zu Beginn des Tages. Bevorzugst du Zeitblöcke oder eine strukturierte Aufgabenliste?"
    }
  },

  lista_pendentes: {
    id: "lista_pendentes",
    category: CEREBRO_CATEGORIES.STUDY_COACHING,
    synonyms: ["lista de pendientes", "lista de pendencias", "lista de pendências", "lista de tarefas", "to-do list", "pendientes", "pendencias", "por uma lista"],
    responses: {
      pt: "Perfeito! Então anote tudo o que tem para fazer e marque com alta prioridade o que for mais urgente. Quer que eu te ajude a estruturar essa lista agora mesmo?",
      es: "Perfecto, entonces anota todo lo que tienes que hacer y marca con una prioridad alta lo más urgente. ¿Quieres que te ayude a redactar esa lista ahora mismo?",
      en: "Perfect! Write down everything you need to do and flag the most urgent tasks with high priority. Would you like me to help you draft that list right now?",
      de: "Perfekt! Notiere alle anstehenden Aufgaben und markiere das Dringendste mit hoher Priorität. Soll ich dir jetzt beim Erstellen dieser Liste helfen?"
    }
  },

  sentido_da_vida: {
    id: "sentido_da_vida",
    category: CEREBRO_CATEGORIES.PSYCHOLOGY_EMOTIONAL,
    synonyms: ["sentido de la vida", "sentido da vida", "proposito", "propósito", "meaning of life", "sinn des lebens", "por que existimos", "qual o sentido"],
    responses: {
      pt: "É um tema profundo, mas geralmente se encontra no equilíbrio entre evoluir pessoalmente e cuidar do próximo. Você sente que tem um propósito claro neste momento?",
      es: "Es un tema profundo, pero generalmente se encuentra en el equilibrio entre crecer personalmente y ayudar a los demás. ¿Tú sientes que tienes algún propósito claro en este momento?",
      en: "That is a profound topic, but it usually lies in the balance between personal growth and helping others. Do you feel you have a clear purpose right now?",
      de: "Das ist ein tiefgründiges Thema. Oft liegt der Sinn im Gleichgewicht zwischen persönlichem Wachstum und dem Dienst an anderen. Hast du derzeit ein klares Ziel vor Augen?"
    }
  },

  elogio_voz: {
    id: "elogio_voz",
    category: CEREBRO_CATEGORIES.PSYCHOLOGY_EMOTIONAL,
    synonyms: ["me encanta tu voz", "adoro sua voz", "gostei da sua voz", "sua voz e incrivel", "sua voz é incrível", "tu voz es increible", "tu voz es increíble", "love your voice", "tolle stimme", "bela voz"],
    responses: {
      pt: "Muito obrigado! Fico muito feliz que tenha gostado. É um grande prazer te acompanhar nessa jornada. Quer continuar conversando sobre algum tema em especial?",
      es: "Muchísimas gracias, me alegra mucho que te guste. Es un placer acompañarte, ¿seguimos charlando sobre algún tema en particular?",
      en: "Thank you so much, I am thrilled to hear that! It is a true pleasure to guide you. Shall we continue exploring a particular topic?",
      de: "Vielen herzlichen Dank, das freut mich sehr! Es ist mir eine Freude, dich zu begleiten. Wollen wir über ein bestimmtes Thema weitersprechen?"
    }
  },

  confirmacao_pronto: {
    id: "confirmacao_pronto",
    category: CEREBRO_CATEGORIES.STUDY_COACHING,
    synonyms: ["perfecto", "perfeito", "genial", "combinado", "otimo", "ótimo", "bueno", "excelente", "tudo bem", "ok", "vale", "fechado"],
    responses: {
      pt: "Excelente! Fico totalmente atento para o que você precisar. Em que mais posso te apoiar agora?",
      es: "Genial, entonces quedo atenta a lo que necesites. ¿En qué más te puedo apoyar ahora?",
      en: "Awesome, I am right here for whatever you need. What else can I support you with right now?",
      de: "Hervorragend, ich stehe dir jederzeit zur Seite. Wobei kann ich dich jetzt noch unterstützen?"
    }
  },

  rotina_organizacao: {
    id: "rotina_organizacao",
    category: CEREBRO_CATEGORIES.STUDY_COACHING,
    synonyms: ["rotina", "rutina", "organizar", "organizo", "organizacion", "organização", "tempo", "cronograma", "como estudar", "como organizar", "planejar", "planificar", "metodo", "pomodoro", "horario", "routine", "schedule", "estudio"],
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
