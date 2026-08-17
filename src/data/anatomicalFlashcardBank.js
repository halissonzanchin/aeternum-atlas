const CURATED_SOURCE = "Banco editorial Aeternum 26.1 · revisão anatômica recomendada";

export const CURATED_SOURCES = {
  pt: "Banco editorial Aeternum 26.1 · revisão anatômica recomendada",
  es: "Banco editorial Aeternum 26.1 · revisión anatómica recomendada",
  en: "Aeternum 26.1 editorial bank · recommended anatomical review",
  de: "Aeternum 26.1 redaktionelle Datenbank · empfohlene anatomische Wiederholung"
};

function card(id, difficulty, learningObjective, front, back, explanation, translations = {}) {
  return {
    id,
    difficulty,
    learningObjective,
    front,
    back,
    explanation,
    translations,
    sourceCitation: CURATED_SOURCE,
    origin: "curated"
  };
}

function topic(id, title, system, aliases, cards, translations = {}) {
  return { id, title, system, aliases, cards, translations };
}

export const ANATOMICAL_FLASHCARD_TOPICS = [
  topic(
    "clavicula-ombro",
    "Clavícula e Ombro",
    "Membro superior",
    [
      "clavicula", "clavícula", "ombro", "escapula", "escápula",
      "hombro", "clavicle", "shoulder", "scapula", "schlüsselbein", "schulter", "skapula"
    ],
    [
      card(
        "clo-f-01", "Fácil", "Orientação óssea",
        "Quais extremidades da clavícula se articulam com o esterno e com a escápula?",
        "A extremidade esternal articula-se com o manúbrio; a extremidade acromial, com o acrômio.",
        "Essas articulações conectam o membro superior ao esqueleto axial e ao complexo escapular.",
        {
          es: {
            learningObjective: "Orientación ósea",
            front: "¿Qué extremos de la clavícula se articulan con el esternón y con la escápula?",
            back: "El extremo esternal se articula con el manubrio; el extremo acromial, con el acromion.",
            explanation: "Estas articulaciones conectan el miembro superior con el esqueleto axial y el complejo escapular."
          },
          en: {
            learningObjective: "Bony orientation",
            front: "Which ends of the clavicle articulate with the sternum and the scapula?",
            back: "The sternal end articulates with the manubrium; the acromial end, with the acromion.",
            explanation: "These joints connect the upper limb to the axial skeleton and the scapular complex."
          },
          de: {
            learningObjective: "Knöcherne Orientierung",
            front: "Welche Enden des Schlüsselbeins artikulieren mit dem Brustbein und dem Schulterblatt?",
            back: "Die Extremitas sternalis artikuliert mit dem Manubrium; die Extremitas acromialis mit dem Akromion.",
            explanation: "Diese Gelenke verbinden die obere Extremität mit dem Axialskelett und dem Schultergürtel."
          }
        }
      ),
      card(
        "clo-f-02", "Fácil", "Reconhecimento de marco",
        "Em qual face da clavícula se localiza o sulco do músculo subclávio?",
        "Na face inferior do terço médio da clavícula.",
        "O sulco serve de área de fixação para o músculo subclávio.",
        {
          es: {
            learningObjective: "Reconocimiento de puntos óseos",
            front: "¿En qué cara de la clavícula se localiza el surco del músculo subclavio?",
            back: "En la cara inferior del tercio medio de la clavícula.",
            explanation: "El surco sirve de zona de inserción para el músculo subclavio."
          },
          en: {
            learningObjective: "Landmark recognition",
            front: "On which surface of the clavicle is the subclavian groove located?",
            back: "On the inferior surface of the middle third of the clavicle.",
            explanation: "The groove serves as the attachment site for the subclavius muscle."
          },
          de: {
            learningObjective: "Strukturerkennung",
            front: "Auf welcher Fläche des Schlüsselbeins befindet sich der Sulcus musculi subclavii?",
            back: "Auf der Unterfläche des mittleren Drittels der Clavicula.",
            explanation: "Der Sulcus dient als Ansatzfläche für den Musculus subclavius."
          }
        }
      ),
      card(
        "clo-f-03", "Fácil", "Ligamentos",
        "Quais ligamentos formam o ligamento coracoclavicular?",
        "Os ligamentos conoide e trapezoide.",
        "Juntos, eles estabilizam a relação entre a clavícula e o processo coracoide.",
        {
          es: {
            learningObjective: "Ligamentos",
            front: "¿Qué ligamentos forman el ligamento coracoclavicular?",
            back: "Los ligamentos conoideo y trapezoideo.",
            explanation: "Juntos, estabilizan la relación entre la clavícula y la apófisis coracoides."
          },
          en: {
            learningObjective: "Ligaments",
            front: "Which ligaments compose the coracoclavicular ligament?",
            back: "The conoid and trapezoid ligaments.",
            explanation: "Together, they stabilize the relationship between the clavicle and the coracoid process."
          },
          de: {
            learningObjective: "Bänder",
            front: "Welche Bänder bilden das Ligamentum coracoclaviculare?",
            back: "Das Ligamentum conoideum und das Ligamentum trapezoideum.",
            explanation: "Gemeinsam stabilisieren sie die Verbindung zwischen Clavicula und Processus coracoideus."
          }
        }
      ),
      card(
        "clo-f-04", "Fácil", "Movimento",
        "Qual músculo inicia os primeiros graus de abdução do braço?",
        "O músculo supraespinal.",
        "Após o início do movimento, o deltoide assume papel predominante na abdução.",
        {
          es: {
            learningObjective: "Movimiento",
            front: "¿Qué músculo inicia los primeros grados de abducción del brazo?",
            back: "El músculo supraespinoso.",
            explanation: "Tras iniciar el movimiento, el deltoides asume el papel predominante en la abducción."
          },
          en: {
            learningObjective: "Movement",
            front: "Which muscle initiates the first degrees of arm abduction?",
            back: "The supraspinatus muscle.",
            explanation: "After initiation, the deltoid assumes the predominant role in abduction."
          },
          de: {
            learningObjective: "Bewegung",
            front: "Welcher Muskel leitet die ersten Grade der Armabduktion ein?",
            back: "Der Musculus supraspinatus.",
            explanation: "Nach der Einleitung übernimmt der Musculus deltoideus die Hauptrolle bei der Abduktion."
          }
        }
      ),
      card(
        "clo-m-01", "Médio", "Inserção ligamentar",
        "Qual acidente ósseo da clavícula recebe o ligamento conoide?",
        "O tubérculo conoide, na face inferior da extremidade acromial.",
        "A linha trapezoide, situada próxima, recebe o ligamento trapezoide.",
        {
          es: {
            learningObjective: "Inserción ligamentosa",
            front: "¿Qué accidente óseo de la clavícula recibe el ligamento conoideo?",
            back: "El tubérculo conoideo, en la cara inferior del extremo acromial.",
            explanation: "La línea trapezoidea, situada cerca, recibe el ligamento trapezoideo."
          },
          en: {
            learningObjective: "Ligamentous insertion",
            front: "Which bony landmark of the clavicle receives the conoid ligament?",
            back: "The conoid tubercle, on the inferior surface of the acromial end.",
            explanation: "The trapezoid line, located nearby, receives the trapezoid ligament."
          },
          de: {
            learningObjective: "Bandansatz",
            front: "Welche knöcherne Struktur der Clavicula nimmt das Ligamentum conoideum auf?",
            back: "Das Tuberculum conoideum an der Unterfläche der Extremitas acromialis.",
            explanation: "Die nahe gelegene Linea trapezoidea nimmt das Ligamentum trapezoideum auf."
          }
        }
      ),
      card(
        "clo-m-02", "Médio", "Estabilidade articular",
        "Por que a articulação esternoclavicular é decisiva para a mobilidade do membro superior?",
        "Porque é a única articulação sinovial que liga diretamente o membro superior ao esqueleto axial.",
        "Grande parte do posicionamento da cintura escapular depende dessa articulação.",
        {
          es: {
            learningObjective: "Estabilidad articular",
            front: "¿Por qué la articulación esternoclavicular es decisiva para la movilidad del miembro superior?",
            back: "Porque es la única articulación sinovial que une directamente el miembro superior al esqueleto axial.",
            explanation: "Gran parte de la orientación de la cintura escapular depende de esta articulación."
          },
          en: {
            learningObjective: "Joint stability",
            front: "Why is the sternoclavicular joint crucial for upper limb mobility?",
            back: "Because it is the only synovial joint directly connecting the upper limb to the axial skeleton.",
            explanation: "Much of the shoulder girdle positioning depends on this joint."
          },
          de: {
            learningObjective: "Gelenkstabilität",
            front: "Warum ist das Sternoklavikulargelenk entscheidend für die Beweglichkeit der oberen Extremität?",
            back: "Weil es das einzige synoviale Gelenk ist, das die obere Extremität direkt mit dem Axialskelett verbindet.",
            explanation: "Ein Großteil der Beweglichkeit des Schultergürtels hängt von diesem Gelenk ab."
          }
        }
      ),
      card(
        "clo-m-03", "Médio", "Manguito rotador",
        "Quais músculos compõem o manguito rotador?",
        "Supraespinal, infraespinal, redondo menor e subescapular.",
        "Seus tendões reforçam a cápsula glenoumeral e mantêm a cabeça do úmero centrada na glenoide.",
        {
          es: {
            learningObjective: "Manguito rotador",
            front: "¿Qué músculos componen el manguito rotador?",
            back: "Supraespinoso, infraespinoso, redondo menor y subescapular.",
            explanation: "Sus tendones refuerzan la cápsula glenohumeral y mantienen la cabeza humeral centrada en la glenoidea."
          },
          en: {
            learningObjective: "Rotator cuff",
            front: "Which muscles compose the rotator cuff?",
            back: "Supraspinatus, infraspinatus, teres minor, and subscapularis.",
            explanation: "Their tendons reinforce the glenohumeral capsule and keep the humeral head centered in the glenoid."
          },
          de: {
            learningObjective: "Rotatorenmanschette",
            front: "Welche Muskeln bilden die Rotatorenmanschette?",
            back: "Musculus supraspinatus, infraspinatus, teres minor und subscapularis.",
            explanation: "Ihre Sehnen verstärken die Kapsel des Schultergelenks und zentrieren den Humeruskopf im Glenoid."
          }
        }
      ),
      card(
        "clo-m-04", "Médio", "Biomecânica",
        "Quais músculos promovem a rotação superior da escápula durante a elevação completa do braço?",
        "Trapézio e serrátil anterior.",
        "A ação coordenada desses músculos orienta a cavidade glenoidal superiormente.",
        {
          es: {
            learningObjective: "Biomecánica",
            front: "¿Qué músculos promueven la rotación superior de la escápula durante la elevación completa del brazo?",
            back: "Trapecio y serrato anterior.",
            explanation: "La acción coordinada de estos músculos orienta la cavidad glenoidea hacia arriba."
          },
          en: {
            learningObjective: "Biomechanics",
            front: "Which muscles produce upward rotation of the scapula during full arm elevation?",
            back: "Trapezius and serratus anterior.",
            explanation: "The coordinated action of these muscles tilts the glenoid cavity upward."
          },
          de: {
            learningObjective: "Biomechanik",
            front: "Welche Muskeln bewirken die Aufwärtsrotation der Scapula bei vollständiger Armhebung?",
            back: "Musculus trapezius und Musculus serratus anterior.",
            explanation: "Das koordinierte Zusammenspiel dieser Muskeln richtet die Cavitas glenoidalis nach kranial aus."
          }
        }
      ),
      {
        id: "clo-d-01", difficulty: "Difícil", learningObjective: "Trauma",
        front: "Em uma fratura do terço médio da clavícula, quais deslocamentos dos fragmentos são esperados?",
        back: "O fragmento medial tende a elevar-se pela ação do esternocleidomastoideo; o lateral tende a cair pelo peso do membro.",
        explanation: "A configuração muscular e gravitacional explica a deformidade clínica típica.",
        translations: {
          es: {
            learningObjective: "Trauma",
            front: "En una fractura del tercio medio de la clavícula, ¿qué desplazamientos de los fragmentos se esperan?",
            back: "El fragmento medial tiende a elevarse por el esternocleidomastoideo; el lateral tiende a caer por el peso del miembro.",
            explanation: "La configuración muscular y gravitatoria explica la deformidad clínica típica."
          },
          en: {
            learningObjective: "Trauma",
            front: "In a fracture of the middle third of the clavicle, what fragment displacements are expected?",
            back: "The medial fragment tends to elevate due to the sternocleidomastoid; the lateral fragment tends to drop due to limb weight.",
            explanation: "Muscle attachments and gravity explain the typical clinical deformity."
          },
          de: {
            learningObjective: "Trauma",
            front: "Welche Fragmentverschiebungen sind bei einer Fraktur des mittleren Drittels der Clavicula zu erwarten?",
            back: "Das mediale Fragment zieht durch den Zug des Sternocleidomastoideus nach kranial; das laterale sinkt durch das Eigengewicht des Arms ab.",
            explanation: "Muskelzug und Schwerkraft erklären das typische klinische Deformitätsbild."
          }
        }
      },
      card(
        "clo-d-02", "Difícil", "Correlação neurológica",
        "Qual nervo deve ser testado após uma luxação anterior da articulação glenoumeral?",
        "O nervo axilar.",
        "Ele contorna o colo cirúrgico do úmero e pode ser tracionado na luxação anterior.",
        {
          es: {
            learningObjective: "Correlación neurológica",
            front: "¿Qué nervio debe evaluarse tras una luxación anterior de la articulación glenohumeral?",
            back: "El nervio axilar.",
            explanation: "Rodea el cuello quirúrgico del húmero y puede sufrir tracción en la luxación anterior."
          },
          en: {
            learningObjective: "Neurological correlation",
            front: "Which nerve should be tested following an anterior glenohumeral dislocation?",
            back: "The axillary nerve.",
            explanation: "It winds around the surgical neck of the humerus and can be tractioned in anterior dislocations."
          },
          de: {
            learningObjective: "Neurologische Korrelation",
            front: "Welcher Nerv muss nach einer anterioren Schulterluxation überprüft werden?",
            back: "Der Nervus axillaris.",
            explanation: "Er verläuft um das Collum chirurgicum des Humerus und kann bei anteriorer Luxation gedehnt werden."
          }
        }
      ),
      card(
        "clo-d-03", "Difícil", "Estabilização dinâmica",
        "Como o manguito rotador evita a migração superior da cabeça do úmero durante a abdução?",
        "Comprime e centraliza a cabeça umeral na cavidade glenoidal enquanto o deltoide eleva o braço.",
        "Sem essa coaptação, a força superior do deltoide favoreceria impacto subacromial.",
        {
          es: {
            learningObjective: "Estabilización dinámica",
            front: "¿Cómo evita el manguito rotador la migración superior de la cabeza humeral durante la abducción?",
            back: "Comprime y centra la cabeza humeral en la cavidad glenoidea mientras el deltoides eleva el brazo.",
            explanation: "Sin esta coaptación, la fuerza ascendente del deltoides favorecería el pinzamiento subacromial."
          },
          en: {
            learningObjective: "Dynamic stabilization",
            front: "How does the rotator cuff prevent superior migration of the humeral head during abduction?",
            back: "It compresses and centers the humeral head into the glenoid cavity while the deltoid elevates the arm.",
            explanation: "Without this concavity compression, superior deltoid pull would cause subacromial impingement."
          },
          de: {
            learningObjective: "Dynamische Stabilisierung",
            front: "Wie verhindert die Rotatorenmanschette die Kranialwanderung des Humeruskopfes während der Abduktion?",
            back: "Sie komprimiert und zentriert den Humeruskopf in der Gelenkpfanne, während der Deltoideus den Arm anhebt.",
            explanation: "Ohne diese Zentrierung würde der Zug des Deltoideus zu einem subakromialen Impingement führen."
          }
        }
      ),
      card(
        "clo-d-04", "Difícil", "Lesão funcional",
        "Qual lesão nervosa produz escápula alada e dificulta elevar o braço acima da horizontal?",
        "Lesão do nervo torácico longo, com paralisia do serrátil anterior.",
        "A escápula perde sua fixação à parede torácica e sua rotação superior fica prejudicada.",
        {
          es: {
            learningObjective: "Lesión funcional",
            front: "¿Qué lesión nerviosa produce escápula alada y dificulta elevar el brazo por encima de la horizontal?",
            back: "Lesión del nervio torácico largo, con parálisis del serrato anterior.",
            explanation: "La escápula pierde su fijación a la pared torácica y se compromete su rotación superior."
          },
          en: {
            learningObjective: "Functional injury",
            front: "Which nerve injury produces a winged scapula and impairs elevation of the arm above the horizontal?",
            back: "Injury to the long thoracic nerve, causing serratus anterior paralysis.",
            explanation: "The scapula loses its stabilization against the thoracic wall and cannot rotate upward properly."
          },
          de: {
            learningObjective: "Funktionsstörung",
            front: "Welche Nervenläsion verursacht eine Scapula alata und erschwert das Heben des Arms über die Horizontale?",
            back: "Läsion des Nervus thoracicus longus mit Lähmung des Musculus serratus anterior.",
            explanation: "Die Scapula verliert ihre Fixierung am Brustkorb und die Aufwärtsrotation ist beeinträchtigt."
          }
        }
      )
    ],
    {
      es: { title: "Clavícula y Hombro", system: "Miembro superior" },
      en: { title: "Clavicle and Shoulder", system: "Upper limb" },
      de: { title: "Schlüsselbein und Schulter", system: "Obere Extremität" }
    }
  ),
  topic(
    "umero-braco",
    "Úmero e Braço",
    "Membro superior",
    [
      "umero", "úmero", "braco", "braço",
      "humero", "húmero", "brazo", "humerus", "arm", "oberarmknochen"
    ],
    [
      card(
        "ume-f-01", "Fácil", "Articulações",
        "Com quais ossos o úmero se articula proximal e distalmente?",
        "Proximalmente com a escápula; distalmente com rádio e ulna.",
        "A cabeça participa da articulação glenoumeral, enquanto tróclea e capítulo participam do cotovelo.",
        {
          es: {
            learningObjective: "Articulaciones",
            front: "¿Con qué huesos se articula el húmero proximal y distalmente?",
            back: "Proximalmente con la escápula; distalmente con radio y cúbito (ulna).",
            explanation: "La cabeza forma la articulación glenohumeral, mientras que la tróclea y el cóndilo (capítulo) participan en el codo."
          },
          en: {
            learningObjective: "Joints",
            front: "With which bones does the humerus articulate proximally and distally?",
            back: "Proximally with the scapula; distally with the radius and ulna.",
            explanation: "The head forms the glenohumeral joint, while the trochlea and capitulum participate in the elbow."
          },
          de: {
            learningObjective: "Gelenke",
            front: "Mit welchen Knochen artikuliert der Humerus proximal und distal?",
            back: "Proximal mit der Scapula; distal mit Radius und Ulna.",
            explanation: "Das Caput humeri bildet das Schultergelenk, während Trochlea und Capitulum am Ellenbogengelenk beteiligt sind."
          }
        }
      ),
      card(
        "ume-f-02", "Fácil", "Reconhecimento",
        "Qual estrutura do úmero articula-se com a cabeça do rádio?",
        "O capítulo do úmero.",
        "O capítulo ocupa a porção lateral da extremidade distal.",
        {
          es: {
            learningObjective: "Reconocimiento",
            front: "¿Qué estructura del húmero se articula con la cabeza del radio?",
            back: "El capítulo (cóndilo) del húmero.",
            explanation: "El capítulo ocupa la porción lateral del extremo distal."
          },
          en: {
            learningObjective: "Recognition",
            front: "Which structure of the humerus articulates with the head of the radius?",
            back: "The capitulum of the humerus.",
            explanation: "The capitulum occupies the lateral aspect of the distal end."
          },
          de: {
            learningObjective: "Erkennung",
            front: "Welche Struktur des Humerus artikuliert mit dem Radiusköpfchen?",
            back: "Das Capitulum humeri.",
            explanation: "Das Capitulum liegt im lateralen Abschnitt des distalen Humerusendes."
          }
        }
      ),
      card(
        "ume-f-03", "Fácil", "Reconhecimento",
        "Qual estrutura do úmero articula-se com a incisura troclear da ulna?",
        "A tróclea do úmero.",
        "A tróclea é medial ao capítulo.",
        {
          es: {
            learningObjective: "Reconocimiento",
            front: "¿Qué estructura del húmero se articula con la escotadura troclear del cúbito?",
            back: "La tróclea del húmero.",
            explanation: "La tróclea es medial respecto al capítulo."
          },
          en: {
            learningObjective: "Recognition",
            front: "Which structure of the humerus articulates with the trochlear notch of the ulna?",
            back: "The trochlea of the humerus.",
            explanation: "The trochlea lies medial to the capitulum."
          },
          de: {
            learningObjective: "Erkennung",
            front: "Welche Struktur des Humerus artikuliert mit der Incisura trochlearis der Ulna?",
            back: "Die Trochlea humeri.",
            explanation: "Die Trochlea liegt medial des Capitulum humeri."
          }
        }
      ),
      card(
        "ume-f-04", "Fácil", "Inserção muscular",
        "Em qual acidente ósseo do úmero se insere o músculo deltoide?",
        "Na tuberosidade deltoidea.",
        "Ela está localizada na face lateral da diáfise umeral.",
        {
          es: {
            learningObjective: "Inserción muscular",
            front: "¿En qué accidente óseo del húmero se inserta el músculo deltoides?",
            back: "En la tuberosidad deltoidea.",
            explanation: "Se localiza en la cara lateral de la diáfisis humeral."
          },
          en: {
            learningObjective: "Muscular insertion",
            front: "Into which bony landmark of the humerus does the deltoid muscle insert?",
            back: "Into the deltoid tuberosity.",
            explanation: "It is located on the lateral aspect of the humeral shaft."
          },
          de: {
            learningObjective: "Muskelansatz",
            front: "An welcher knöchernen Struktur des Humerus setzt der Musculus deltoideus an?",
            back: "An der Tuberositas deltoidea.",
            explanation: "Sie befindet sich an der lateralen Fläche des Humerusschafts."
          }
        }
      ),
      card(
        "ume-m-01", "Médio", "Relação neurovascular",
        "Qual nervo percorre o sulco do nervo radial na face posterior do úmero?",
        "O nervo radial, acompanhado pela artéria braquial profunda.",
        "Essa relação torna o nervo vulnerável nas fraturas da diáfise.",
        {
          es: {
            learningObjective: "Relación neurovascular",
            front: "¿Qué nervio recorre el surco del nervio radial en la cara posterior del húmero?",
            back: "El nervio radial, acompañado por la arteria braquial profunda.",
            explanation: "Esta estrecha relación hace que el nervio sea vulnerable en fracturas diafisarias."
          },
          en: {
            learningObjective: "Neurovascular relationship",
            front: "Which nerve travels in the radial groove on the posterior aspect of the humerus?",
            back: "The radial nerve, accompanied by the deep brachial artery.",
            explanation: "This intimate relationship makes the nerve vulnerable in midshaft fractures."
          },
          de: {
            learningObjective: "Neurovaskuläre Topografie",
            front: "Welcher Nerv verläuft im Sulcus nervi radialis an der Hinterfläche des Humerus?",
            back: "Der Nervus radialis, begleitet von der Arteria profunda brachii.",
            explanation: "Diese enge Lagebeziehung macht den Nerv bei Schaftfrakturen besonders verletzlich."
          }
        }
      ),
      card(
        "ume-m-02", "Médio", "Relação neurovascular",
        "Qual nervo passa posteriormente ao epicôndilo medial do úmero?",
        "O nervo ulnar.",
        "A posição superficial explica a parestesia provocada por trauma nessa região.",
        {
          es: {
            learningObjective: "Relación neurovascular",
            front: "¿Qué nervio pasa posteriormente al epicóndilo medial del húmero?",
            back: "El nervio cubital (ulnar).",
            explanation: "Su posición superficial explica la parestesia provocada por traumatismos en esa zona."
          },
          en: {
            learningObjective: "Neurovascular relationship",
            front: "Which nerve passes posterior to the medial epicondyle of the humerus?",
            back: "The ulnar nerve.",
            explanation: "Its superficial location explains the transient paresthesia from blunt trauma in this area."
          },
          de: {
            learningObjective: "Neurovaskuläre Topografie",
            front: "Welcher Nerv verläuft dorsal des Epicondylus medialis humeri?",
            back: "Der Nervus ulnaris.",
            explanation: "Die oberflächliche Lage erklärt die Parästhesien bei Traumen in dieser Region."
          }
        }
      ),
      card(
        "ume-m-03", "Médio", "Trauma",
        "Qual nervo está particularmente ameaçado em fraturas do colo cirúrgico do úmero?",
        "O nervo axilar.",
        "A artéria circunflexa umeral posterior também acompanha essa região.",
        {
          es: {
            learningObjective: "Trauma",
            front: "¿Qué nervio está particularmente amenazado en fracturas del cuello quirúrgico del húmero?",
            back: "El nervio axilar.",
            explanation: "La arteria circunfleja humeral posterior también acompaña esta región."
          },
          en: {
            learningObjective: "Trauma",
            front: "Which nerve is particularly at risk in fractures of the surgical neck of the humerus?",
            back: "The axillary nerve.",
            explanation: "The posterior circumflex humeral artery also accompanies this region."
          },
          de: {
            learningObjective: "Trauma",
            front: "Welcher Nerv ist bei Frakturen des Collum chirurgicum humeri besonders gefährdet?",
            back: "Der Nervus axillaris.",
            explanation: "Die Arteria circumflexa humeri posterior verläuft ebenfalls in dieser Region."
          }
        }
      ),
      card(
        "ume-m-04", "Médio", "Trauma",
        "Qual estrutura vascular pode ser lesada em uma fratura supracondilar do úmero?",
        "A artéria braquial.",
        "O nervo mediano também pode ser afetado por sua proximidade anterior ao cotovelo.",
        {
          es: {
            learningObjective: "Trauma",
            front: "¿Qué estructura vascular puede lesionarse en una fractura supracondílea del húmero?",
            back: "La arteria braquial.",
            explanation: "El nervio mediano también puede verse afectado por su proximidad anterior en el codo."
          },
          en: {
            learningObjective: "Trauma",
            front: "Which vascular structure can be injured in a supracondylar fracture of the humerus?",
            back: "The brachial artery.",
            explanation: "The median nerve may also be compromised due to its anterior proximity to the elbow."
          },
          de: {
            learningObjective: "Trauma",
            front: "Welche Gefäßstruktur kann bei einer suprakondylären Humerusfraktur verletzt werden?",
            back: "Die Arteria brachialis.",
            explanation: "Der Nervus medianus kann aufgrund seiner anterioren Lage ebenfalls geschädigt werden."
          }
        }
      ),
      card(
        "ume-d-01", "Difícil", "Déficit motor",
        "Que déficit sugere lesão do nervo radial após fratura da diáfise umeral?",
        "Queda do punho por fraqueza dos extensores, frequentemente com alteração sensitiva dorsal da mão.",
        "O nível da lesão determina quais ramos e músculos permanecem funcionantes.",
        {
          es: {
            learningObjective: "Déficit motor",
            front: "¿Qué déficit clínico sugiere lesión del nervio radial tras fractura de la diáfisis humeral?",
            back: "Mano caída (péndula) por debilidad extensora, con alteración sensitiva en el dorso de la mano.",
            explanation: "El nivel anatómico de la lesión determina los ramos y músculos que preservan su función."
          },
          en: {
            learningObjective: "Motor deficit",
            front: "What clinical deficit suggests radial nerve injury following a humeral shaft fracture?",
            back: "Wrist drop due to extensor weakness, often with sensory loss on the dorsum of the hand.",
            explanation: "The anatomical level of injury determines which distal branches and muscles remain functional."
          },
          de: {
            learningObjective: "Motorisches Defizit",
            front: "Welches Defizit weist auf eine Läsion des Nervus radialis nach Humerusschaftfraktur hin?",
            back: "Fallhand durch Schwäche der Extensoren, oft mit Sensibilitätsstörung am Handrücken.",
            explanation: "Die genaue Höhe der Läsion bestimmt, welche Muskeln und Äste funktionstüchtig bleiben."
          }
        }
      ),
      card(
        "ume-d-02", "Difícil", "Isquemia",
        "Qual síndrome pode resultar de lesão da artéria braquial após fratura supracondilar?",
        "Contratura isquêmica de Volkmann.",
        "A isquemia dos músculos flexores do antebraço pode produzir deformidade permanente se não for tratada.",
        {
          es: {
            learningObjective: "Isquemia",
            front: "¿Qué síndrome puede resultar de una lesión de la arteria braquial tras una fractura supracondílea?",
            back: "Contractura isquémica de Volkmann.",
            explanation: "La isquemia de los músculos flexores del antebrazo puede causar deformidad permanente si no se trata precozmente."
          },
          en: {
            learningObjective: "Ischemia",
            front: "Which syndrome can result from brachial artery injury following a supracondylar fracture?",
            back: "Volkmann ischemic contracture.",
            explanation: "Ischemia of the forearm flexor compartment can produce permanent deformities if untreated."
          },
          de: {
            learningObjective: "Ischämie",
            front: "Welches Syndrom kann aus einer Läsion der Arteria brachialis nach suprakondylärer Fraktur resultieren?",
            back: "Volkmann-Kontraktur.",
            explanation: "Die Ischämie der Unterarmbeuger kann ohne zeitnahe Behandlung zu irreversiblen Kontrakturen führen."
          }
        }
      ),
      card(
        "ume-d-03", "Difícil", "Diferenciação clínica",
        "Como diferenciar uma lesão do nervo axilar de uma lesão isolada do supraespinal pela abdução?",
        "A lesão axilar compromete principalmente a abdução após o início e reduz sensibilidade sobre o deltoide; a lesão do supraespinal prejudica sobretudo o início da abdução.",
        "O exame combina amplitude, força e território sensitivo.",
        {
          es: {
            learningObjective: "Diferenciación clínica",
            front: "¿Cómo diferenciar una lesión del nervio axilar de una lesión aislada del supraespinoso en la abducción?",
            back: "La lesión axilar afecta la abducción tras el inicio y reduce la sensibilidad deltoidea; la lesión del supraespinoso afecta el inicio de la abducción.",
            explanation: "El examen físico combina amplitud de movimiento, fuerza y mapeo sensitivo."
          },
          en: {
            learningObjective: "Clinical differentiation",
            front: "How can axillary nerve injury be distinguished from isolated supraspinatus injury during abduction?",
            back: "Axillary injury impairs abduction beyond the initial degrees and causes deltoid sensory loss; supraspinatus injury impairs the initiation of abduction.",
            explanation: "Clinical examination evaluates motion arc, muscle power, and cutaneus sensory mapping."
          },
          de: {
            learningObjective: "Klinische Differenzierung",
            front: "Wie unterscheidet man eine Läsion des Nervus axillaris von einer isolierten Supraspinatusläsion bei der Abduktion?",
            back: "Die Axillarisläsion beeinträchtigt die Abduktion nach der Einleitung und mindert die Deltoidsensibilität; die Supraspinatusläsion schwächt die Initiierung.",
            explanation: "Die Untersuchung kombiniert Bewegungsumfang, Kraftgrade und Sensibilitätsprüfungen."
          }
        }
      ),
      card(
        "ume-d-04", "Difícil", "Anatomia aplicada",
        "Por que uma fratura do epicôndilo medial pode alterar movimentos finos da mão?",
        "Porque pode lesar o nervo ulnar, que inerva grande parte dos músculos intrínsecos da mão.",
        "A repercussão distal decorre da passagem superficial do nervo junto ao epicôndilo.",
        {
          es: {
            learningObjective: "Anatomía aplicada",
            front: "¿Por qué una fractura del epicóndilo medial puede alterar los movimientos finos de la mano?",
            back: "Porque puede lesionar el nervio cubital, que inerva la mayoría de los músculos intrínsecos de la mano.",
            explanation: "La repercusión distal deriva del paso superficial del nervio junto al epicóndilo medial."
          },
          en: {
            learningObjective: "Applied anatomy",
            front: "Why can a medial epicondyle fracture impair fine motor movements of the hand?",
            back: "Because it can damage the ulnar nerve, which innervates most intrinsic hand muscles.",
            explanation: "The distal deficit results from the superficial passage of the nerve behind the epicondyle."
          },
          de: {
            learningObjective: "Angewandte Anatomie",
            front: "Warum kann eine Fraktur des Epicondylus medialis die Feinmotorik der Hand stören?",
            back: "Weil der Nervus ulnaris geschädigt werden kann, der den Großteil der intrinsischen Handmuskeln innerviert.",
            explanation: "Die distale Auswirkung beruht auf dem oberflächlichen Nervenverlauf am Epicondylus medialis."
          }
        }
      )
    ],
    {
      es: { title: "Húmero y Brazo", system: "Miembro superior" },
      en: { title: "Humerus and Arm", system: "Upper limb" },
      de: { title: "Oberarmknochen und Arm", system: "Obere Extremität" }
    }
  ),
  topic(
    "vertebras-cervicais",
    "Vértebras Cervicais",
    "Coluna vertebral",
    [
      "vertebra", "vértebra", "cervical", "atlas", "axis", "áxis",
      "cervicales", "cervical vertebrae", "wirbel", "halswirbel"
    ],
    [
      card(
        "cer-f-01", "Fácil", "Identificação",
        "Qual vértebra cervical não possui corpo nem processo espinhoso?",
        "O atlas, C1.",
        "O atlas forma um anel com arcos anterior e posterior e massas laterais.",
        {
          es: {
            learningObjective: "Identificación",
            front: "¿Qué vértebra cervical no posee cuerpo vertebral ni apófisis espinosa?",
            back: "El atlas, C1.",
            explanation: "El atlas forma un anillo con arcos anterior y posterior y masas laterales."
          },
          en: {
            learningObjective: "Identification",
            front: "Which cervical vertebra lacks both a vertebral body and a spinous process?",
            back: "The atlas, C1.",
            explanation: "The atlas forms a ring composed of anterior and posterior arches and lateral masses."
          },
          de: {
            learningObjective: "Identifikation",
            front: "Welcher Halswirbel besitzt weder Wirbelkörper noch Dornfortsatz?",
            back: "Der Atlas, C1.",
            explanation: "Der Atlas bildet einen Ring aus vorderem und hinterem Bogen sowie Massae laterales."
          }
        }
      ),
      card(
        "cer-f-02", "Fácil", "Identificação",
        "Qual vértebra apresenta o dente do áxis?",
        "C2, o áxis.",
        "O dente funciona como pivô para a rotação do atlas e da cabeça.",
        {
          es: {
            learningObjective: "Identificación",
            front: "¿Qué vértebra presenta el diente (apófisis odontoides)?",
            back: "C2, el axis.",
            explanation: "El diente funciona como pivote para la rotación del atlas y de la cabeza."
          },
          en: {
            learningObjective: "Identification",
            front: "Which vertebra bears the dens (odontoid process)?",
            back: "C2, the axis.",
            explanation: "The dens serves as a pivot for rotation of the atlas and head."
          },
          de: {
            learningObjective: "Identifikation",
            front: "Welcher Wirbel trägt den Dens axis?",
            back: "C2, der Axis.",
            explanation: "Der Dens dient als Drehachse für die Rotation von Atlas und Kopf."
          }
        }
      ),
      card(
        "cer-f-03", "Fácil", "Marco palpável",
        "Qual vértebra é conhecida como vértebra proeminente?",
        "C7.",
        "Seu processo espinhoso longo costuma ser palpável na base do pescoço.",
        {
          es: {
            learningObjective: "Punto palpable",
            front: "¿Qué vértebra se conoce como vértebra prominente?",
            back: "C7.",
            explanation: "Su apófisis espinosa larga suele ser fácilmente palpable en la base del cuello."
          },
          en: {
            learningObjective: "Palpable landmark",
            front: "Which vertebra is known as the vertebra prominens?",
            back: "C7.",
            explanation: "Its long, non-bifid spinous process is prominently palpable at the base of the neck."
          },
          de: {
            learningObjective: "Tastbare Struktur",
            front: "Welcher Wirbel wird als Vertebra prominens bezeichnet?",
            back: "C7.",
            explanation: "Sein langer Dornfortsatz ist an der Basis des Nackens gut tastbar."
          }
        }
      ),
      card(
        "cer-f-04", "Fácil", "Característica regional",
        "Qual forame caracteriza os processos transversos das vértebras cervicais?",
        "O forame transversário.",
        "Ele distingue a região cervical das demais regiões vertebrais.",
        {
          es: {
            learningObjective: "Característica regional",
            front: "¿Qué agujero (foramen) caracteriza a las apófisis transversas de las vértebras cervicales?",
            back: "El foramen transverso.",
            explanation: "Distingue la región cervical de los demás segmentos vertebrales."
          },
          en: {
            learningObjective: "Regional feature",
            front: "Which foramen characterizes the transverse processes of cervical vertebrae?",
            back: "The transverse foramen (foramen transversarium).",
            explanation: "It definitively distinguishes cervical vertebrae from other vertebral regions."
          },
          de: {
            learningObjective: "Regionales Merkmal",
            front: "Welches Foramen kennzeichnet die Querfortsätze der Halswirbel?",
            back: "Das Foramen transversarium.",
            explanation: "Es unterscheidet die Halswirbel eindeutig von allen anderen Wirbelsäulenabschnitten."
          }
        }
      ),
      card(
        "cer-m-01", "Médio", "Vascularização",
        "Em qual nível a artéria vertebral geralmente entra no forame transversário?",
        "Em C6.",
        "Depois, ascende pelos forames transversários até C1; variações anatómicas podem ocorrer.",
        {
          es: {
            learningObjective: "Vascularización",
            front: "¿A qué nivel entra habitualmente la arteria vertebral en el foramen transverso?",
            back: "En C6.",
            explanation: "Luego asciende por los forámenes transversos hasta C1; pueden existir variantes anatómicas."
          },
          en: {
            learningObjective: "Vascularization",
            front: "At which level does the vertebral artery typically enter the transverse foramen?",
            back: "At C6.",
            explanation: "It then ascends through the transverse foramina up to C1; anatomical variations may occur."
          },
          de: {
            learningObjective: "Gefäßversorgung",
            front: "Auf welcher Höhe tritt die Arteria vertebralis typischerweise in das Foramen transversarium ein?",
            back: "Auf Höhe von C6.",
            explanation: "Danach steigt sie durch die Foramina transversaria bis C1 auf; anatomische Varianten sind möglich."
          }
        }
      ),
      card(
        "cer-m-02", "Médio", "Ligamentos",
        "Qual ligamento mantém o dente do áxis junto ao arco anterior do atlas?",
        "O ligamento transverso do atlas.",
        "Ele impede deslocamento posterior do dente em direção à medula espinal.",
        {
          es: {
            learningObjective: "Ligamentos",
            front: "¿Qué ligamento mantiene el diente del axis unido al arco anterior del atlas?",
            back: "El ligamento transverso del atlas.",
            explanation: "Impide el desplazamiento posterior del diente hacia la médula espinal."
          },
          en: {
            learningObjective: "Ligaments",
            front: "Which ligament holds the dens of the axis against the anterior arch of the atlas?",
            back: "The transverse ligament of the atlas.",
            explanation: "It prevents posterior displacement of the dens toward the spinal cord."
          },
          de: {
            learningObjective: "Bänder",
            front: "Welches Band sichert den Dens axis am vorderen Atlasbogen?",
            back: "Das Ligamentum transversum atlantis.",
            explanation: "Es verhindert ein dorsales Abkippen des Dens in Richtung Rückenmark."
          }
        }
      ),
      card(
        "cer-m-03", "Médio", "Articulação",
        "Qual movimento predomina na articulação atlantoaxial mediana?",
        "Rotação.",
        "O atlas e a cabeça giram em torno do dente do áxis.",
        {
          es: {
            learningObjective: "Articulación",
            front: "¿Qué movimiento predomina en la articulación atlantoaxial media?",
            back: "Rotación.",
            explanation: "El atlas y la cabeza giran en torno al eje formado por el diente del axis."
          },
          en: {
            learningObjective: "Joint mechanics",
            front: "Which motion predominates at the median atlantoaxial joint?",
            back: "Rotation.",
            explanation: "The atlas and cranium rotate around the vertical pivot formed by the dens of the axis."
          },
          de: {
            learningObjective: "Gelenkbewegung",
            front: "Welche Bewegung überwiegt im medianen Atlantoaxialgelenk?",
            back: "Rotation.",
            explanation: "Der Atlas rotiert zusammen mit dem Kopf um den Dens axis."
          }
        }
      ),
      card(
        "cer-m-04", "Médio", "Morfologia",
        "Quais vértebras são consideradas cervicais típicas?",
        "C3 a C6.",
        "Elas compartilham corpo pequeno, forames transversários e processos espinhosos frequentemente bífidos.",
        {
          es: {
            learningObjective: "Morfología",
            front: "¿Qué vértebras se consideran cervicales típicas?",
            back: "De C3 a C6.",
            explanation: "Comparten cuerpo pequeño, forámenes transversos y apófisis espinosas frecuentemente bífidas."
          },
          en: {
            learningObjective: "Morphology",
            front: "Which vertebrae are considered typical cervical vertebrae?",
            back: "C3 through C6.",
            explanation: "They share small vertebral bodies, transverse foramina, and commonly bifid spinous processes."
          },
          de: {
            learningObjective: "Morphologie",
            front: "Welche Wirbel gelten als typische Halswirbel?",
            back: "C3 bis C6.",
            explanation: "Sie teilen kleine Wirbelkörper, Foramina transversaria und oft gegabelte Dornfortsätze."
          }
        }
      ),
      card(
        "cer-d-01", "Difícil", "Trauma",
        "Qual padrão de lesão define a fratura de Jefferson?",
        "Fratura em explosão do atlas, geralmente por carga axial.",
        "As massas laterais podem afastar-se, com risco de lesão do ligamento transverso.",
        {
          es: {
            learningObjective: "Trauma",
            front: "¿Qué patrón lesional define la fractura de Jefferson?",
            back: "Fractura por estallido del atlas, generalmente por carga axial.",
            explanation: "Las masas laterales se desplazan lateralmente con riesgo de rotura del ligamento transverso."
          },
          en: {
            learningObjective: "Trauma",
            front: "Which injury pattern defines a Jefferson fracture?",
            back: "A burst fracture of the atlas ring, typically resulting from axial loading.",
            explanation: "The lateral masses spread apart with potential rupture of the transverse ligament."
          },
          de: {
            learningObjective: "Trauma",
            front: "Welches Verletzungsmuster definiert eine Jefferson-Fraktur?",
            back: "Berstungsfraktur des Atlasrings, typischerweise durch axiale Gewalteinwirkung.",
            explanation: "Die Massae laterales weichen auseinander, oft mit Riss des Ligamentum transversum atlantis."
          }
        }
      ),
      card(
        "cer-d-02", "Difícil", "Trauma",
        "Qual região óssea é tipicamente fraturada na lesão conhecida como fratura do enforcado?",
        "A pars interarticularis do áxis, bilateralmente.",
        "O mecanismo clássico envolve hiperextensão e carga axial.",
        {
          es: {
            learningObjective: "Trauma",
            front: "¿Qué región ósea se fractura típicamente en la fractura del ahorcado (hangman)?",
            back: "La pars interarticularis del axis, bilateralmente.",
            explanation: "El mecanismo clásico combina hiperextensión cervical y carga axial."
          },
          en: {
            learningObjective: "Trauma",
            front: "Which bony region is typically fractured in hangman's fracture?",
            back: "The pars interarticularis of the axis bilaterally.",
            explanation: "The classic trauma mechanism involves cervical hyperextension with axial loading."
          },
          de: {
            learningObjective: "Trauma",
            front: "Welcher Knochenabschnitt bricht typischerweise bei der Hangman-Fraktur?",
            back: "Die Pars interarticularis des Axis beidseits.",
            explanation: "Der klassische Unfallmechanismus umfasst zervikale Hyperextension mit axialer Kompression."
          }
        }
      ),
      card(
        "cer-d-03", "Difícil", "Radiculopatia",
        "Uma hérnia posterolateral do disco C5–C6 costuma comprimir qual raiz nervosa?",
        "A raiz C6.",
        "Em geral, a raiz que sai abaixo do nível cervical do disco é a mais afetada.",
        {
          es: {
            learningObjective: "Radiculopatía",
            front: "¿Qué raíz nerviosa suele comprimir una hernia posterolateral del disco C5–C6?",
            back: "La raíz C6.",
            explanation: "En la columna cervical, la raíz que emerge por el foramen intervertebral a ese nivel es la C6."
          },
          en: {
            learningObjective: "Radiculopathy",
            front: "Which nerve root is typically compressed by a posterolateral C5–C6 disc herniation?",
            back: "The C6 nerve root.",
            explanation: "In the cervical spine, the exiting root corresponding to the lower numbered vertebra is affected."
          },
          de: {
            learningObjective: "Radikulopathie",
            front: "Welche Nervenwurzel wird typischerweise durch einen posterolateralen C5–C6 Bandscheibenvorfall komprimiert?",
            back: "Die C6-Wurzel.",
            explanation: "An der Halswirbelsäule wird die auf diesem Niveau austretende Wurzel (C6) komprimiert."
          }
        }
      ),
      card(
        "cer-d-04", "Difícil", "Instabilidade",
        "Por que a ruptura do ligamento transverso do atlas é potencialmente grave?",
        "Porque permite deslocamento do atlas em relação ao dente, ameaçando a medula cervical alta.",
        "A estabilidade atlantoaxial depende fortemente desse ligamento.",
        {
          es: {
            learningObjective: "Inestabilidad",
            front: "¿Por qué la rotura del ligamento transverso del atlas es potencialmente mortal?",
            back: "Porque permite el desplazamiento del atlas respecto al diente, amenazando la médula espinal cervical alta.",
            explanation: "La estabilidad atlantoaxial depende fundamentalmente de este ligamento."
          },
          en: {
            learningObjective: "Instability",
            front: "Why is rupture of the transverse ligament of the atlas life-threatening?",
            back: "Because it permits posterior atlantoaxial displacement, threatening the upper cervical spinal cord.",
            explanation: "Atlantoaxial stability relies heavily upon the integrity of this primary restraint."
          },
          de: {
            learningObjective: "Instabilität",
            front: "Warum ist ein Riss des Ligamentum transversum atlantis potenziell lebensbedrohlich?",
            back: "Weil der Atlas gegenüber dem Dens nach dorsal abgleiten und das obere Zervikalmark komprimieren kann.",
            explanation: "Die Stabilität des Atlantoaxialgelenks hängt maßgeblich von diesem Band ab."
          }
        }
      )
    ],
    {
      es: { title: "Vértebras Cervicales", system: "Columna vertebral" },
      en: { title: "Cervical Vertebrae", system: "Vertebral column" },
      de: { title: "Halswirbel", system: "Wirbelsäule" }
    }
  ),
  topic(
    "femur-osteologia",
    "Fêmur e Osteologia",
    "Membro inferior",
    [
      "femur", "fêmur", "femoral", "coxa",
      "fémur", "muslo", "thigh", "osteology", "oberschenkelknochen", "osteologie"
    ],
    [
      card(
        "fem-f-01", "Fácil", "Identificação",
        "Qual é o osso mais longo e resistente do corpo humano?",
        "O fêmur.",
        "Ele transmite cargas entre o quadril e o joelho.",
        {
          es: {
            learningObjective: "Identificación",
            front: "¿Cuál es el hueso más largo y resistente del cuerpo humano?",
            back: "El fémur.",
            explanation: "Transmite cargas mecánicas entre la cadera y la rodilla."
          },
          en: {
            learningObjective: "Identification",
            front: "What is the longest and strongest bone in the human body?",
            back: "The femur.",
            explanation: "It transmits mechanical loads between the hip and the knee joint."
          },
          de: {
            learningObjective: "Identifikation",
            front: "Welcher Knochen ist der längste und stärkste des menschlichen Körpers?",
            back: "Das Femur (Oberschenkelknochen).",
            explanation: "Er überträgt Lasten zwischen Hüft- und Kniegelenk."
          }
        }
      ),
      card(
        "fem-f-02", "Fácil", "Articulação",
        "Com qual estrutura do osso do quadril a cabeça do fêmur se articula?",
        "Com o acetábulo.",
        "Essa articulação sinovial esferoide forma a articulação coxofemoral.",
        {
          es: {
            learningObjective: "Articulación",
            front: "¿Con qué estructura del hueso coxal se articula la cabeza del fémur?",
            back: "Con el acetábulo.",
            explanation: "Esta articulación sinovial esferoidea constituye la articulación coxofemoral."
          },
          en: {
            learningObjective: "Joint anatomy",
            front: "With which structure of the hip bone does the femoral head articulate?",
            back: "With the acetabulum.",
            explanation: "This ball-and-socket synovial joint constitutes the coxofemoral (hip) joint."
          },
          de: {
            learningObjective: "Gelenkanatomie",
            front: "Mit welcher Struktur des Hüftbeins artikuliert der Femurkopf?",
            back: "Mit dem Acetabulum.",
            explanation: "Dieses Kugelgelenk bildet das Hüftgelenk (Articulatio coxae)."
          }
        }
      ),
      card(
        "fem-f-03", "Fácil", "Reconhecimento",
        "Quais são as grandes projeções da extremidade proximal do fêmur?",
        "Os trocânteres maior e menor.",
        "Eles funcionam como importantes alavancas e locais de inserção muscular.",
        {
          es: {
            learningObjective: "Reconocimiento",
            front: "¿Cuáles son las grandes proyecciones óseas del extremo proximal del fémur?",
            back: "Los trocánteres mayor y menor.",
            explanation: "Funcionan como potentes palancas mecánicas e inserciones musculares."
          },
          en: {
            learningObjective: "Recognition",
            front: "What are the prominent bony projections on the proximal femur?",
            back: "The greater and lesser trochanters.",
            explanation: "They act as powerful mechanical levers and muscle attachment sites."
          },
          de: {
            learningObjective: "Erkennung",
            front: "Welches sind die großen Knochenvorsprünge am proximalen Femur?",
            back: "Trochanter major und Trochanter minor.",
            explanation: "Sie dienen als wichtige Hebelarme und Muskelansatzstellen."
          }
        }
      ),
      card(
        "fem-f-04", "Fácil", "Reconhecimento",
        "Qual estrutura da extremidade distal do fêmur articula-se com a patela?",
        "A face patelar.",
        "Ela está localizada anteriormente entre os côndilos.",
        {
          es: {
            learningObjective: "Reconocimiento",
            front: "¿Qué estructura del extremo distal del fémur se articula con la rótula (patela)?",
            back: "La cara patelar (tróclea femoral).",
            explanation: "Se localiza anteriormente entre ambos cóndilos femorales."
          },
          en: {
            learningObjective: "Recognition",
            front: "Which structure on the distal femur articulates with the patella?",
            back: "The patellar surface.",
            explanation: "It is located anteriorly between the medial and lateral condyles."
          },
          de: {
            learningObjective: "Erkennung",
            front: "Welche Struktur am distalen Femurende artikuliert mit der Patella?",
            back: "Die Facies patellaris.",
            explanation: "Sie liegt ventral zwischen den beiden Femurkondylen."
          }
        }
      ),
      card(
        "fem-m-01", "Médio", "Inserção muscular",
        "Qual crista posterior da diáfise femoral serve de ampla fixação muscular?",
        "A linha áspera.",
        "Ela recebe inserções de adutores e origens de porções dos vastos.",
        {
          es: {
            learningObjective: "Inserción muscular",
            front: "¿Qué cresta longitudinal posterior de la diáfisis femoral sirve de amplia fijación muscular?",
            back: "La línea áspera.",
            explanation: "Recibe inserciones de los aductores y orígenes de porciones de los vastos."
          },
          en: {
            learningObjective: "Muscle attachment",
            front: "Which prominent posterior ridge on the femoral shaft serves as an extensive muscle attachment site?",
            back: "The linea aspera.",
            explanation: "It provides attachment for adductor muscles and origins for parts of the vasti."
          },
          de: {
            learningObjective: "Muskelansatz",
            front: "Welche Leiste an der Dorsalfläche des Femurschafts dient als breiter Muskelansatz?",
            back: "Die Linea aspera.",
            explanation: "Hier setzen Adduktoren an und Teile der Vasti entspringen."
          }
        }
      ),
      card(
        "fem-m-02", "Médio", "Reconhecimento",
        "Onde se localiza a fossa intercondilar do fêmur?",
        "Na face posterior, entre os côndilos medial e lateral.",
        "Ela se relaciona com os ligamentos cruzados do joelho.",
        {
          es: {
            learningObjective: "Reconocimiento",
            front: "¿Dónde se localiza la fosa intercondílea del fémur?",
            back: "En la cara posterior, entre los cóndilos medial y lateral.",
            explanation: "Alberga los ligamentos cruzados de la rodilla."
          },
          en: {
            learningObjective: "Recognition",
            front: "Where is the intercondylar fossa of the femur located?",
            back: "On the posterior aspect, between the medial and lateral condyles.",
            explanation: "It accommodates the cruciate ligaments of the knee joint."
          },
          de: {
            learningObjective: "Erkennung",
            front: "Wo befindet sich die Fossa intercondylaris des Femurs?",
            back: "Auf der Dorsalfläche, zwischen medialem und lateralem Kondylus.",
            explanation: "Sie beherbergt die Kreuzbänder des Kniegelenks."
          }
        }
      ),
      card(
        "fem-m-03", "Médio", "Inserção muscular",
        "Qual músculo se insere principalmente na tuberosidade glútea do fêmur?",
        "O glúteo máximo.",
        "Parte de suas fibras também se insere no trato iliotibial.",
        {
          es: {
            learningObjective: "Inserción muscular",
            front: "¿Qué músculo se inserta principalmente en la tuberosidad glútea del fémur?",
            back: "El glúteo mayor.",
            explanation: "Parte de sus fibras también se inserta en el tracto iliotibial."
          },
          en: {
            learningObjective: "Muscle insertion",
            front: "Which muscle primarily inserts into the gluteal tuberosity of the femur?",
            back: "The gluteus maximus.",
            explanation: "Part of its deep tendon fibers insert here while superficial fibers join the iliotibial tract."
          },
          de: {
            learningObjective: "Muskelansatz",
            front: "Welcher Muskel setzt hauptsächlich an der Tuberositas glutea des Femurs an?",
            back: "Der Musculus gluteus maximus.",
            explanation: "Ein Teil seiner Sehnenfasern inseriert hier, andere strahlen in den Tractus iliotibialis ein."
          }
        }
      ),
      card(
        "fem-m-04", "Médio", "Ligamentos",
        "O que se fixa à fóvea da cabeça do fêmur?",
        "O ligamento da cabeça do fêmur.",
        "Esse ligamento pode conduzir um pequeno ramo arterial, mais relevante na infância.",
        {
          es: {
            learningObjective: "Ligamentos",
            front: "¿Qué estructura se fija en la fosita (fóvea) de la cabeza del fémur?",
            back: "El ligamento de la cabeza del fémur (ligamento redondo).",
            explanation: "Contiene una pequeña rama arterial, más relevante durante el crecimiento pediátrico."
          },
          en: {
            learningObjective: "Ligaments",
            front: "What structure attaches to the fovea capitis of the femoral head?",
            back: "The ligament of the head of the femur (ligamentum teres).",
            explanation: "It may transmit an acetabular branch artery, primarily important in pediatric vascularization."
          },
          de: {
            learningObjective: "Bänder",
            front: "Was setzt an der Fovea capitis femoris an?",
            back: "Das Ligamentum capitis femoris.",
            explanation: "Dieses Band führt einen kleinen Arterienast, der vor allem im Wachstumsalter bedeutsam ist."
          }
        }
      ),
      card(
        "fem-d-01", "Difícil", "Vascularização",
        "Qual vaso é a principal fonte do suprimento retinacular da cabeça femoral no adulto?",
        "A artéria circunflexa femoral medial.",
        "Seus ramos podem ser comprometidos em fraturas intracapsulares do colo do fêmur.",
        {
          es: {
            learningObjective: "Vascularización",
            front: "¿Cuál es la fuente arterial principal del aporte retinacular a la cabeza femoral en el adulto?",
            back: "La arteria circunfleja femoral medial.",
            explanation: "Sus ramas retinaculares pueden comprometerse gravemente en fracturas intracapsulares del cuello femoral."
          },
          en: {
            learningObjective: "Vascular supply",
            front: "Which vessel is the primary source of retinacular arterial supply to the femoral head in adults?",
            back: "The medial circumflex femoral artery.",
            explanation: "Its ascending retinacular branches are highly vulnerable in intracapsular femoral neck fractures."
          },
          de: {
            learningObjective: "Gefäßversorgung",
            front: "Welches Gefäß ist die Hauptquelle für die retinakuläre Blutversorgung des Femurkopfes beim Erwachsenen?",
            back: "Die Arteria circumflexa femoris medialis.",
            explanation: "Ihre Äste können bei intrakapsulären Schenkelhalsfrakturen zerrissen werden."
          }
        }
      ),
      card(
        "fem-d-02", "Difícil", "Trauma",
        "Por que uma fratura intracapsular do colo do fêmur pode causar necrose avascular?",
        "Porque pode interromper os vasos retinaculares que ascendem pelo colo até a cabeça femoral.",
        "O risco depende do padrão e do grau de desvio da fratura.",
        {
          es: {
            learningObjective: "Trauma",
            front: "¿Por qué una fractura intracapsular del cuello femoral puede causar necrosis avascular?",
            back: "Porque puede seccionar los vasos retinaculares que ascienden por el cuello hacia la cabeza femoral.",
            explanation: "El riesgo depende del patrón de fractura y del grado de desplazamiento."
          },
          en: {
            learningObjective: "Trauma",
            front: "Why can an intracapsular femoral neck fracture cause avascular necrosis of the femoral head?",
            back: "Because it can disrupt the retinacular arteries that ascend along the neck to the femoral head.",
            explanation: "The risk correlates directly with fracture displacement and capsular disruption."
          },
          de: {
            learningObjective: "Trauma",
            front: "Warum kann eine intrakapsuläre Schenkelhalsfraktur zur Femurkopfnekrose führen?",
            back: "Weil sie die am Schenkelhals aufsteigenden Retinakulumgefäße unterbrechen kann.",
            explanation: "Das Nekroserisiko korreliert mit dem Dislokationsgrad der Fraktur."
          }
        }
      ),
      card(
        "fem-d-03", "Difícil", "Biomecânica",
        "Como se denominam a diminuição e o aumento patológicos do ângulo colo-diáfise?",
        "Coxa vara para diminuição; coxa valga para aumento.",
        "Essas alterações modificam a transmissão de forças e a mecânica dos abdutores.",
        {
          es: {
            learningObjective: "Biomecánica",
            front: "¿Cómo se denominan la disminución y el aumento patológicos del ángulo cérvico-diafisario?",
            back: "Coxa vara para la disminución; coxa valga para el aumento.",
            explanation: "Estas anomalías modifican la transmisión de cargas mecánicas y la eficacia de los abductores."
          },
          en: {
            learningObjective: "Biomechanics",
            front: "What are the clinical terms for pathological decrease and increase in the femoral neck-shaft angle?",
            back: "Coxa vara for decrease; coxa valga for increase.",
            explanation: "These structural deviations alter weight-bearing force vectors and abductor lever arm mechanics."
          },
          de: {
            learningObjective: "Biomechanik",
            front: "Wie werden pathologische Verkleinerungen und Vergrößerungen des CCD-Winkels bezeichnet?",
            back: "Coxa vara bei Verkleinerung; Coxa valga bei Vergrößerung.",
            explanation: "Diese Veränderungen beeinflussen die Kraftübertragung und die Hebelverhältnisse der Abduktoren."
          }
        }
      ),
      card(
        "fem-d-04", "Difícil", "Exame funcional",
        "Que achado sugere insuficiência dos abdutores do quadril durante apoio unipodal?",
        "Sinal de Trendelenburg, com queda da pelve contralateral.",
        "Glúteos médio e mínimo estabilizam a pelve no lado de apoio.",
        {
          es: {
            learningObjective: "Exploración funcional",
            front: "¿Qué signo clínico sugiere insuficiencia de los abductores de cadera en apoyo monopodal?",
            back: "Signo de Trendelenburg, caracterizado por la caída de la pelvis contralateral.",
            explanation: "Los glúteos medio y menor deben estabilizar la pelvis en el lado de apoyo."
          },
          en: {
            learningObjective: "Functional exam",
            front: "Which clinical finding indicates hip abductor weakness during single-leg stance?",
            back: "Positive Trendelenburg sign, characterized by pelvic drop on the unsupported contralateral side.",
            explanation: "Gluteus medius and minimus fail to stabilize the pelvis on the weight-bearing side."
          },
          de: {
            learningObjective: "Funktionsprüfung",
            front: "Welcher Befund weist auf eine Schwäche der Hüftabduktoren im Einbeinstand hin?",
            back: "Trendelenburg-Zeichen mit Absinken des Beckens zur Gegenseite.",
            explanation: "Die Glutei medius und minimus stabilisieren das Becken auf der Standbeinseite unzureichend."
          }
        }
      )
    ],
    {
      es: { title: "Fémur y Osteología", system: "Miembro inferior" },
      en: { title: "Femur and Osteology", system: "Lower limb" },
      de: { title: "Femur und Osteologie", system: "Untere Extremität" }
    }
  ),
  topic(
    "vascularizacao-coracao",
    "Vascularização do Coração",
    "Sistema cardiovascular",
    [
      "coracao", "coração", "coronaria", "coronária", "vascularizacao", "vascularização",
      "corazon", "corazón", "vascularizacion", "vascularización", "heart", "coronary", "vascularization", "herz", "koronar", "gefassversorgung"
    ],
    [
      card(
        "cor-f-01", "Fácil", "Origem arterial",
        "Onde se originam as artérias coronárias direita e esquerda?",
        "Nos seios aórticos, logo acima da valva aórtica.",
        "A coronária direita nasce do seio aórtico direito e a esquerda, do seio aórtico esquerdo.",
        {
          es: {
            learningObjective: "Origen arterial",
            front: "¿Dónde se originan las arterias coronarias derecha e izquierda?",
            back: "En los senos aórticos (de Valsalva), justo por encima de la válvula aórtica.",
            explanation: "La coronaria derecha nace del seno aórtico derecho y la izquierda del seno aórtico izquierdo."
          },
          en: {
            learningObjective: "Arterial origin",
            front: "Where do the right and left coronary arteries originate?",
            back: "From the aortic sinuses, immediately superior to the aortic valve cusps.",
            explanation: "The right coronary arises from the right aortic sinus and the left from the left aortic sinus."
          },
          de: {
            learningObjective: "Gefäßursprung",
            front: "Wo entspringen die rechte und linke Koronararterie?",
            back: "Aus den Sinus aortae, unmittelbar oberhalb der Aortenklappe.",
            explanation: "Die rechte Koronararterie entspringt dem rechten Sinus aortae, die linke dem linken."
          }
        }
      ),
      card(
        "cor-f-02", "Fácil", "Identificação",
        "Qual ramo percorre o sulco interventricular anterior?",
        "O ramo interventricular anterior da coronária esquerda.",
        "Ele também é conhecido clinicamente como descendente anterior.",
        {
          es: {
            learningObjective: "Identificación",
            front: "¿Qué rama arterial discurre por el surco interventricular anterior?",
            back: "La rama interventricular anterior de la arteria coronaria izquierda (descendente anterior).",
            explanation: "Es conocida clínicamente como arteria descendente anterior."
          },
          en: {
            learningObjective: "Identification",
            front: "Which arterial branch travels down the anterior interventricular groove?",
            back: "The anterior interventricular branch of the left coronary artery (LAD).",
            explanation: "It is clinically referred to as the left anterior descending artery."
          },
          de: {
            learningObjective: "Identifikation",
            front: "Welcher Ast verläuft im Sulcus interventricularis anterior?",
            back: "Der Ramus interventricularis anterior (RIVA) der linken Koronararterie.",
            explanation: "Klinisch wird er auch als LAD (Left Anterior Descending) bezeichnet."
          }
        }
      ),
      card(
        "cor-f-03", "Fácil", "Identificação",
        "Qual ramo da coronária esquerda percorre o sulco coronário em direção à face esquerda?",
        "O ramo circunflexo.",
        "Ele irriga principalmente territórios laterais e posteriores do ventrículo esquerdo, conforme a dominância.",
        {
          es: {
            learningObjective: "Identificación",
            front: "¿Qué rama de la coronaria izquierda discurre por el surco coronario hacia la cara izquierda?",
            back: "La rama circunfleja.",
            explanation: "Irriga territorios laterales y posteriores del ventrículo izquierdo según la dominancia."
          },
          en: {
            learningObjective: "Identification",
            front: "Which branch of the left coronary artery courses in the coronary sulcus around the left cardiac border?",
            back: "The circumflex branch (LCx).",
            explanation: "It supplies lateral and posterior left ventricular myocardium depending on dominance."
          },
          de: {
            learningObjective: "Identifikation",
            front: "Welcher Ast der linken Koronararterie zieht im Sulcus coronarius nach links?",
            back: "Der Ramus circumflexus (RCX).",
            explanation: "Er versorgt vor allem laterale und dorsale Anteile des linken Ventrikels."
          }
        }
      ),
      card(
        "cor-f-04", "Fácil", "Drenagem venosa",
        "Qual grande vaso venoso desemboca no átrio direito e recebe a maior parte das veias cardíacas?",
        "O seio coronário.",
        "Ele percorre a porção posterior do sulco coronário.",
        {
          es: {
            learningObjective: "Drenaje venoso",
            front: "¿Qué gran conducto venoso desemboca en la aurícula derecha y recibe la mayoría de venas cardíacas?",
            back: "El seno coronario.",
            explanation: "Discurre por la cara posterior del surco coronario."
          },
          en: {
            learningObjective: "Venous drainage",
            front: "Which wide venous channel opens into the right atrium and collects most cardiac veins?",
            back: "The coronary sinus.",
            explanation: "It occupies the posterior part of the coronary sulcus."
          },
          de: {
            learningObjective: "Venöser Abfluss",
            front: "Welcher große venöse Stamm mündet in den rechten Vorhof und nimmt die meisten Herzvenen auf?",
            back: "Der Sinus coronarius.",
            explanation: "Er verläuft im dorsalen Abschnitt des Sulcus coronarius."
          }
        }
      ),
      card(
        "cor-m-01", "Médio", "Território arterial",
        "Quais estruturas são irrigadas pelos ramos septais do ramo interventricular anterior?",
        "Os dois terços anteriores do septo interventricular e partes do sistema de condução.",
        "A extensão do território explica repercussões de uma oclusão proximal.",
        {
          es: {
            learningObjective: "Territorio arterial",
            front: "¿Qué estructuras están irrigadas por las ramas septales de la arteria interventricular anterior?",
            back: "Los dos tercios anteriores del tabique interventricular y parte del sistema de conducción.",
            explanation: "La amplitud de este territorio explica la gravedad de una oclusión proximal."
          },
          en: {
            learningObjective: "Arterial territory",
            front: "Which structures are supplied by the septal branches of the anterior interventricular artery?",
            back: "The anterior two-thirds of the interventricular septum and parts of the cardiac conduction system.",
            explanation: "This extensive territory accounts for the severe hemodynamic and electrical impact of proximal occlusion."
          },
          de: {
            learningObjective: "Versorgungsgebiet",
            front: "Welche Strukturen werden von den Rr. interventriculares septales des RIVA versorgt?",
            back: "Die vorderen zwei Drittel des Kammerseptums und Anteile des Reizleitungssystems.",
            explanation: "Das große Versorgungsgebiet erklärt die Schwere eines proximalen Gefäßverschlusses."
          }
        }
      ),
      card(
        "cor-m-02", "Médio", "Dominância",
        "O que define a dominância coronariana?",
        "A artéria que origina o ramo interventricular posterior.",
        "Na maioria das pessoas, esse ramo provém da coronária direita.",
        {
          es: {
            learningObjective: "Dominancia",
            front: "¿Qué define la dominancia coronaria?",
            back: "La arteria que da origen a la rama interventricular posterior (descendente posterior).",
            explanation: "En la mayoría de las personas, esta rama procede de la arteria coronaria derecha."
          },
          en: {
            learningObjective: "Dominance",
            front: "What anatomical criterion defines coronary artery dominance?",
            back: "The coronary artery that gives rise to the posterior interventricular branch (PDA).",
            explanation: "In the majority of individuals, this branch originates from the right coronary artery."
          },
          de: {
            learningObjective: "Dominanztyp",
            front: "Was definiert den koronaren Dominanztyp?",
            back: "Die Arterie, aus der der Ramus interventricularis posterior (RIVP) entspringt.",
            explanation: "Bei den meisten Menschen entspringt dieser Ast aus der rechten Koronararterie."
          }
        }
      ),
      card(
        "cor-m-03", "Médio", "Nó sinoatrial",
        "De qual coronária se origina mais frequentemente o ramo do nó sinoatrial?",
        "Da artéria coronária direita, embora possa originar-se da circunflexa.",
        "A origem é variável e deve ser descrita probabilisticamente.",
        {
          es: {
            learningObjective: "Nodo sinoauricular",
            front: "¿De qué arteria coronaria se origina más frecuentemente la rama para el nodo sinoauricular?",
            back: "De la arteria coronaria derecha (aprox. 60%), aunque puede originarse de la circunfleja.",
            explanation: "Su origen presenta variabilidad anatómica según la población."
          },
          en: {
            learningObjective: "Sinoatrial node",
            front: "From which coronary artery does the sinuatrial nodal branch most commonly arise?",
            back: "From the right coronary artery (in ~60% of cases), though it may arise from the circumflex.",
            explanation: "Its origin exhibits population variability and should be described probabilistically."
          },
          de: {
            learningObjective: "Sinusknoten",
            front: "Aus welcher Koronararterie entspringt der Ramus nodi sinuatrialis am häufigsten?",
            back: "Aus der rechten Koronararterie (ca. 60 %), alternativ aus dem Ramus circumflexus.",
            explanation: "Der Ursprung variiert anatomisch und sollte probabilistisch beschrieben werden."
          }
        }
      ),
      card(
        "cor-m-04", "Médio", "Nó atrioventricular",
        "De qual vaso se origina mais frequentemente o ramo do nó atrioventricular?",
        "Da artéria dominante, geralmente a coronária direita, próximo à cruz do coração.",
        "A anatomia da dominância influencia o suprimento do sistema de condução.",
        {
          es: {
            learningObjective: "Nodo auriculoventricular",
            front: "¿De qué vaso se origina más frecuentemente la rama para el nodo auriculoventricular?",
            back: "De la arteria coronaria dominante, habitualmente la coronaria derecha en la cruz del corazón.",
            explanation: "La dominancia coronaria determina el aporte vascular a esta porción del sistema de conducción."
          },
          en: {
            learningObjective: "Atrioventricular node",
            front: "From which vessel does the atrioventricular nodal branch typically originate?",
            back: "From the dominant coronary artery (usually the right coronary) near the crux cordis.",
            explanation: "Coronary dominance directly dictates the vascular supply to this junctional conduction structure."
          },
          de: {
            learningObjective: "AV-Knoten",
            front: "Aus welchem Gefäß entspringt der Ramus nodi atrioventricularis meist?",
            back: "Aus der dominanten Koronararterie, meist der RCA nahe dem Crux cordis.",
            explanation: "Der Dominanztyp bestimmt die arterielle Versorgung des AV-Knotens."
          }
        }
      ),
      card(
        "cor-d-01", "Difícil", "Correlação clínica",
        "Qual território fica ameaçado por uma oclusão proximal do ramo interventricular anterior?",
        "Parede anterior do ventrículo esquerdo, ápice e grande parte do septo interventricular.",
        "A extensão anatómica torna essa oclusão potencialmente grave.",
        {
          es: {
            learningObjective: "Correlación clínica",
            front: "¿Qué territorio miocárdico queda en riesgo ante una oclusión proximal de la arteria descendente anterior?",
            back: "Pared anterior del ventrículo izquierdo, ápex y la mayor parte del tabique interventricular.",
            explanation: "La extensa masa miocárdica irrigada convierte esta oclusión en una emergencia crítica."
          },
          en: {
            learningObjective: "Clinical correlation",
            front: "Which myocardial territory is endangered by a proximal occlusion of the left anterior descending artery?",
            back: "The anterior left ventricular wall, apex, and the majority of the interventricular septum.",
            explanation: "The vast myocardial territory at risk renders proximal LAD occlusion catastrophic if unperfused."
          },
          de: {
            learningObjective: "Klinische Korrelation",
            front: "Welches Myokardareal ist bei einem proximalen RIVA-Verschluss bedroht?",
            back: "Vorderwand des linken Ventrikels, Herzspitze und Großteil des Kammerseptums.",
            explanation: "Das ausgedehnte Versorgungsgebiet macht proximale RIVA-Verschlüsse besonders kritisch."
          }
        }
      ),
      card(
        "cor-d-02", "Difícil", "Circulação colateral",
        "Por que anastomoses coronarianas nem sempre evitam isquemia aguda?",
        "Porque costumam ser pequenas e podem não oferecer fluxo suficiente diante de oclusão súbita.",
        "Elas podem ganhar importância quando a obstrução progride lentamente.",
        {
          es: {
            learningObjective: "Circulación colateral",
            front: "¿Por qué las anastomosis coronarias no siempre evitan la isquemia miocárdica aguda?",
            back: "Porque suelen ser de calibre fino y no proporcionan flujo suficiente ante una oclusión súbita.",
            explanation: "Se desarrollan con mayor eficacia compensatoria cuando la estenosis progresa de forma lenta."
          },
          en: {
            learningObjective: "Collateral circulation",
            front: "Why do coronary anastomoses often fail to prevent acute myocardial infarction during sudden occlusion?",
            back: "Because they are small-caliber channels that cannot instantly provide adequate compensatory flow.",
            explanation: "Coronary collaterals require gradual progressive ischemia to enlarge functionally."
          },
          de: {
            learningObjective: "Kollateralkreislauf",
            front: "Warum verhindern Koronaranastomosen bei akutem Verschluss nicht immer eine Ischämie?",
            back: "Weil sie kaliberschwach sind und bei plötzlichem Verschluss nicht ausreichend Blut leiten können.",
            explanation: "Kollateralen gewinnen vor allem bei langsam progredienter Stenose an funktioneller Bedeutung."
          }
        }
      ),
      card(
        "cor-d-03", "Difícil", "Drenagem venosa",
        "Qual veia acompanha o ramo interventricular anterior e onde termina?",
        "A veia cardíaca magna; continua no sulco coronário e termina no seio coronário.",
        "O trajeto venoso acompanha parte do território da coronária esquerda.",
        {
          es: {
            learningObjective: "Drenaje venoso",
            front: "¿Qué vena acompaña a la rama interventricular anterior y dónde drena?",
            back: "La vena cardíaca magna (vena coronaria mayor); continúa en el surco coronario y drena en el seno coronario.",
            explanation: "Su trayecto acompaña en gran parte el territorio irrigado por la coronaria izquierda."
          },
          en: {
            learningObjective: "Venous drainage",
            front: "Which cardiac vein accompanies the anterior interventricular artery, and where does it terminate?",
            back: "The great cardiac vein; it courses around the coronary sulcus and drains into the coronary sinus.",
            explanation: "Its course drains territories predominantly supplied by the left coronary artery."
          },
          de: {
            learningObjective: "Venöser Abfluss",
            front: "Welche Vene begleitet den RIVA und wo mündet sie?",
            back: "Die Vena cardiaca magna; sie zieht im Sulcus coronarius weiter und mündet in den Sinus coronarius.",
            explanation: "Ihr Verlauf entspricht weitgehend dem Versorgungsgebiet der linken Koronararterie."
          }
        }
      ),
      card(
        "cor-d-04", "Difícil", "Integração anatómica",
        "Como uma dominância esquerda altera o suprimento da face diafragmática do coração?",
        "O ramo interventricular posterior deriva da circunflexa, ampliando o território dependente da coronária esquerda.",
        "A dominância descreve a origem do ramo posterior, não o tamanho global de cada coronária.",
        {
          es: {
            learningObjective: "Integración anatómica",
            front: "¿Cómo altera la dominancia izquierda el riego de la cara diafragmática del corazón?",
            back: "La rama interventricular posterior se origina de la arteria circunfleja, expandiendo el territorio dependiente de la coronaria izquierda.",
            explanation: "La dominancia describe el origen de la rama posterior, no el tamaño global de las coronarias."
          },
          en: {
            learningObjective: "Anatomical integration",
            front: "How does left coronary dominance alter myocardial perfusion of the diaphragmatic surface?",
            back: "The posterior interventricular branch arises from the circumflex artery, expanding left coronary dependency.",
            explanation: "Dominance specifies origin of the posterior descending artery rather than overall arterial caliber."
          },
          de: {
            learningObjective: "Anatomische Integration",
            front: "Wie verändert ein Linkstyp die arterielle Versorgung der Zwerchfellfläche des Herzens?",
            back: "Der RIVP entspringt dem Ramus circumflexus, wodurch die Abhängigkeit von der linken Koronararterie zunimmt.",
            explanation: "Die Dominanz beschreibt den Ursprung des RIVP, nicht das Gesamtkaliber der Koronararterien."
          }
        }
      )
    ],
    {
      es: { title: "Vascularización del Corazón", system: "Sistema cardiovascular" },
      en: { title: "Heart Vascularization", system: "Cardiovascular system" },
      de: { title: "Herzgefäßversorgung", system: "Kardiovaskuläres System" }
    }
  ),
  topic(
    "pares-cranianos",
    "Pares Cranianos",
    "Neuroanatomia",
    [
      "pares cranianos", "par craniano", "nervo craniano", "cranianos",
      "pares craneales", "par craneal", "nervio craneal", "craneales",
      "cranial nerves", "cranial nerve", "hirnnerven", "hirnnerv"
    ],
    [
      card(
        "pc-f-01", "Fácil", "Função",
        "Qual par craniano conduz a visão?",
        "O nervo óptico, II par craniano.",
        "Ele transmite informação da retina ao encéfalo.",
        {
          es: {
            learningObjective: "Función",
            front: "¿Qué par craneal conduce la información visual?",
            back: "El nervio óptico, II par craneal.",
            explanation: "Transmite los impulsos sensoriales desde la retina hasta el encéfalo."
          },
          en: {
            learningObjective: "Function",
            front: "Which cranial nerve mediates vision?",
            back: "The optic nerve, cranial nerve II.",
            explanation: "It conducts sensory impulses from the retina to the brain."
          },
          de: {
            learningObjective: "Funktion",
            front: "Welcher Hirnnerv leitet die Sehinformationen weiter?",
            back: "Der Nervus opticus, II. Hirnnerv.",
            explanation: "Er übermittelt die sensorischen Signale von der Netzhaut zum Gehirn."
          }
        }
      ),
      card(
        "pc-f-02", "Fácil", "Função",
        "Qual par craniano inerva os músculos da expressão facial?",
        "O nervo facial, VII par craniano.",
        "Seu componente motor emerge do tronco encefálico e alcança a face pelo forame estilomastoideo.",
        {
          es: {
            learningObjective: "Función",
            front: "¿Qué par craneal inerva los músculos de la mímica facial?",
            back: "El nervio facial, VII par craneal.",
            explanation: "Su componente motor sale del tronco encefálico y emerge hacia la cara por el foramen estilomastoideo."
          },
          en: {
            learningObjective: "Function",
            front: "Which cranial nerve innervates the muscles of facial expression?",
            back: "The facial nerve, cranial nerve VII.",
            explanation: "Its motor component exits the posterior fossa and emerges onto the face via the stylomastoid foramen."
          },
          de: {
            learningObjective: "Funktion",
            front: "Welcher Hirnnerv innerviert die mimische Muskulatur?",
            back: "Der Nervus facialis, VII. Hirnnerv.",
            explanation: "Seine motorischen Fasern treten durch das Foramen stylomastoideum an die Gesichtsmuskulatur."
          }
        }
      ),
      card(
        "pc-f-03", "Fácil", "Função",
        "Qual par craniano é responsável pela principal inervação motora da língua?",
        "O nervo hipoglosso, XII par craniano.",
        "A exceção é o palatoglosso, inervado pelo vago.",
        {
          es: {
            learningObjective: "Función",
            front: "¿Qué par craneal es responsable de la inervación motora principal de la lengua?",
            back: "El nervio hipogloso, XII par craneal.",
            explanation: "La única excepción es el músculo palatogloso, inervado por el nervio vago."
          },
          en: {
            learningObjective: "Function",
            front: "Which cranial nerve provides primary motor innervation to the tongue muscles?",
            back: "The hypoglossal nerve, cranial nerve XII.",
            explanation: "The sole exception is the palatoglossus muscle, which is innervated by the vagus nerve."
          },
          de: {
            learningObjective: "Funktion",
            front: "Welcher Hirnnerv ist für die motorische Innervation der Zunge zuständig?",
            back: "Der Nervus hypoglossus, XII. Hirnnerv.",
            explanation: "Einzige Ausnahme ist der Musculus palatoglossus, der vom Nervus vagus innerviert wird."
          }
        }
      ),
      card(
        "pc-f-04", "Fácil", "Função",
        "Qual par craniano fornece a principal sensibilidade somática da face?",
        "O nervo trigêmeo, V par craniano.",
        "Seus três ramos são oftálmico, maxilar e mandibular.",
        {
          es: {
            learningObjective: "Función",
            front: "¿Qué par craneal proporciona la sensibilidad somática principal del rostro?",
            back: "El nervio trigémino, V par craneal.",
            explanation: "Sus tres divisiones son oftálmica (V1), maxilar (V2) y mandibular (V3)."
          },
          en: {
            learningObjective: "Function",
            front: "Which cranial nerve supplies primary somatic sensation to the face?",
            back: "The trigeminal nerve, cranial nerve V.",
            explanation: "Its three sensory divisions are ophthalmic (V1), maxillary (V2), and mandibular (V3)."
          },
          de: {
            learningObjective: "Funktion",
            front: "Welcher Hirnnerv vermittelt die Hauptsensibilität des Gesichts?",
            back: "Der Nervus trigeminus, V. Hirnnerv.",
            explanation: "Seine drei Hauptäste sind Nervus ophthalmicus (V1), maxillaris (V2) und mandibularis (V3)."
          }
        }
      ),
      card(
        "pc-m-01", "Médio", "Forames",
        "Por qual abertura craniana passam os nervos oculomotor, troclear, oftálmico e abducente?",
        "Pela fissura orbital superior.",
        "Os nervos III, IV, V1 e VI alcançam a órbita por essa fissura.",
        {
          es: {
            learningObjective: "Forámenes",
            front: "¿Por qué abertura craneal pasan los nervios oculomotor, troclear, oftálmico y abducens?",
            back: "Por la fisura orbitaria superior (hendidura esfenoidal).",
            explanation: "Los pares III, IV, V1 y VI ingresan a la órbita a través de esta fisura."
          },
          en: {
            learningObjective: "Cranial foramina",
            front: "Through which cranial opening do the oculomotor, trochlear, ophthalmic, and abducens nerves exit?",
            back: "Through the superior orbital fissure.",
            explanation: "Cranial nerves III, IV, V1, and VI enter the orbit through this sphenoidal cleft."
          },
          de: {
            learningObjective: "Schädelöffnungen",
            front: "Durch welche Schädelöffnung ziehen die Nerven oculomotorius, trochlearis, ophthalmicus und abducens?",
            back: "Durch die Fissura orbitalis superior.",
            explanation: "Die Hirnnerven III, IV, V1 und VI gelangen durch diese Fissur in die Augenhöhle."
          }
        }
      ),
      card(
        "pc-m-02", "Médio", "Forames",
        "Quais pares cranianos atravessam o forame jugular?",
        "Glossofaríngeo, vago e acessório: IX, X e XI.",
        "A veia jugular interna também se inicia nessa região.",
        {
          es: {
            learningObjective: "Forámenes",
            front: "¿Qué pares craneales atraviesan el foramen yugular (agujero rasgado posterior)?",
            back: "Glosofaríngeo, vago y accesorio: IX, X y XI.",
            explanation: "La vena yugular interna también se origina en esta encrucijada ósea."
          },
          en: {
            learningObjective: "Cranial foramina",
            front: "Which cranial nerves traverse the jugular foramen?",
            back: "Glossopharyngeal, vagus, and accessory nerves: IX, X, and XI.",
            explanation: "The internal jugular vein also originates at this critical skull base aperture."
          },
          de: {
            learningObjective: "Schädelöffnungen",
            front: "Welche Hirnnerven ziehen durch das Foramen jugulare?",
            back: "Glossopharyngeus, vagus und accessorius: IX, X und XI.",
            explanation: "Hier entspringt auch die Vena jugularis interna aus dem Sinus sigmoideus."
          }
        }
      ),
      card(
        "pc-m-03", "Médio", "Reflexos",
        "Quais nervos compõem as vias aferente e eferente do reflexo córneo-palpebral?",
        "Aferente: ramo oftálmico do trigêmeo, V1; eferente: nervo facial, VII.",
        "O fechamento palpebral depende do orbicular do olho.",
        {
          es: {
            learningObjective: "Reflejos",
            front: "¿Qué nervios forman las vías aferente y eferente del reflejo corneal?",
            back: "Aferente: ramo oftálmico del trigémino (V1); eferente: nervio facial (VII).",
            explanation: "El cierre protector de los párpados depende del músculo orbicular del ojo."
          },
          en: {
            learningObjective: "Reflexes",
            front: "Which nerves form the afferent and efferent limbs of the corneal reflex?",
            back: "Afferent: ophthalmic branch of the trigeminal nerve (V1); Efferent: facial nerve (VII).",
            explanation: "Bilateral blinking is mediated by the orbicularis oculi muscles."
          },
          de: {
            learningObjective: "Reflexe",
            front: "Welche Nerven bilden den afferenten und efferenten Schenkel des Kornealreflexes?",
            back: "Afferent: N. ophthalmicus (V1); Efferent: N. facialis (VII).",
            explanation: "Der Lidschluss erfolgt durch den Musculus orbicularis oculi."
          }
        }
      ),
      card(
        "pc-m-04", "Médio", "Reflexos",
        "Quais nervos formam as vias aferente e eferente do reflexo fotomotor?",
        "Aferente: nervo óptico, II; eferente: nervo oculomotor, III.",
        "A via parassimpática do III contrai o esfíncter da pupila.",
        {
          es: {
            learningObjective: "Reflejos",
            front: "¿Qué nervios forman las vías aferente y eferente del reflejo fotomotor pupilar?",
            back: "Aferente: nervio óptico (II); eferente: nervio oculomotor (III).",
            explanation: "Las fibras parasimpáticas del III par contraen el músculo esfínter de la pupila."
          },
          en: {
            learningObjective: "Reflexes",
            front: "Which nerves form the afferent and efferent pathways of the pupillary light reflex?",
            back: "Afferent: optic nerve (II); Efferent: oculomotor nerve (III).",
            explanation: "Parasympathetic preganglionic fibers in CN III induce pupillary sphincter constriction."
          },
          de: {
            learningObjective: "Reflexe",
            front: "Welche Nerven bilden die Bahnen des Pupillenlichtreflexes?",
            back: "Afferent: Nervus opticus (II); Efferent: Nervus oculomotorius (III).",
            explanation: "Parasympathische Fasern des III. Hirnnervs verengen den Musculus sphincter pupillae."
          }
        }
      ),
      card(
        "pc-d-01", "Difícil", "Localização de lesão",
        "Ao protruir a língua, para que lado ela desvia em uma lesão periférica unilateral do hipoglosso?",
        "Para o lado da lesão.",
        "A ação não oposta do genioglosso contralateral empurra a língua para o lado fraco.",
        {
          es: {
            learningObjective: "Localización lesional",
            front: "Al protruir la lengua, ¿hacia qué lado se desvía en una lesión periférica unilateral del hipogloso?",
            back: "Hacia el lado de la lesión (lado afectado).",
            explanation: "La acción no antagonizada del músculo geniogloso sano empuja la lengua hacia el lado parético."
          },
          en: {
            learningObjective: "Lesion localization",
            front: "Upon tongue protrusion, toward which side does it deviate in a unilateral peripheral hypoglossal lesion?",
            back: "Toward the side of the lesion (ipsilateral).",
            explanation: "The unopposed action of the intact contralateral genioglossus pushes the tongue toward the weak side."
          },
          de: {
            learningObjective: "Läsionslokalisation",
            front: "Zu welcher Seite weicht die Zunge beim Herausstrecken bei einseitiger Hypoglossusläsion ab?",
            back: "Zur Seite der Läsion (ipsilateral).",
            explanation: "Der intakte kontralaterale Musculus genioglossus schiebt die Zunge zur paretischen Seite."
          }
        }
      ),
      card(
        "pc-d-02", "Difícil", "Localização de lesão",
        "Quais achados oculares são típicos de uma lesão completa do nervo oculomotor?",
        "Ptose, olho desviado inferolateralmente e possível midríase.",
        "A perda dos músculos inervados pelo III deixa sem oposição o reto lateral e o oblíquo superior.",
        {
          es: {
            learningObjective: "Localización lesional",
            front: "¿Qué hallazgos oculares caracterizan una parálisis completa del nervio oculomotor?",
            back: "Ptosis palpebral, globo ocular desviado hacia abajo y afuera (inferolateral) y midriasis fija.",
            explanation: "La parálisis del III par deja sin oposición el recto lateral (VI) y el oblicuo superior (IV)."
          },
          en: {
            learningObjective: "Lesion localization",
            front: "What clinical findings characterize a complete oculomotor nerve palsy?",
            back: "Ptosis, 'down and out' (inferolateral) eye deviation, and a dilated unreactive pupil (mydriasis).",
            explanation: "Loss of CN III muscles leaves unopposed action of lateral rectus (VI) and superior oblique (IV)."
          },
          de: {
            learningObjective: "Läsionslokalisation",
            front: "Welche Befunde sind typisch für eine vollständige Okulomotoriusparese?",
            back: "Ptosis, Bulbusabweichung nach unten-außen (inferolateral) und Mydriasis.",
            explanation: "Der Ausfall der III-Muskeln lässt Musculus rectus lateralis (VI) und obliquus superior (IV) ohne Gegenzug."
          }
        }
      ),
      card(
        "pc-d-03", "Difícil", "Correlação clínica",
        "Por que uma lesão no forame jugular pode causar disfagia e disfonia?",
        "Porque pode comprometer os nervos IX e X, afetando sensibilidade faríngea e motricidade do palato, faringe e laringe.",
        "O nervo XI também pode ser atingido, acrescentando déficit de esternocleidomastoideo e trapézio.",
        {
          es: {
            learningObjective: "Correlación clínica",
            front: "¿Por qué una lesión expansiva en el foramen yugular puede provocar disfagia y disfonía?",
            back: "Porque puede comprometer los nervios glosofaríngeo (IX) y vago (X), afectando la deglución y las cuerdas vocales.",
            explanation: "El nervio accesorio (XI) también puede afectarse, añadiendo debilidad de esternocleidomastoideo y trapecio."
          },
          en: {
            learningObjective: "Clinical correlation",
            front: "Why can a mass lesion in the jugular foramen produce dysphagia and dysphonia?",
            back: "Because it compromises CN IX and X, disrupting pharyngeal sensation and motor innervation to the palate and larynx.",
            explanation: "Involvement of CN XI in Vernet syndrome adds sternocleidomastoid and trapezius paresis."
          },
          de: {
            learningObjective: "Klinische Korrelation",
            front: "Warum kann eine Raumforderung im Foramen jugulare Dysphagie und Dysphonie auslösen?",
            back: "Weil sie die Nerven IX und X schädigt und Sensibilität sowie Motorik von Gaumen, Pharynx und Larynx stört.",
            explanation: "Bei Mitbeteiligung des Nervus accessorius (XI) entsteht zusätzlich eine Parese von Sternocleidomastoideus und Trapezius."
          }
        }
      ),
      card(
        "pc-d-04", "Difícil", "Localização de lesão",
        "Qual déficit sugere lesão do nervo abducente?",
        "Incapacidade de abduzir o olho afetado, com diplopia horizontal.",
        "O nervo VI inerva o músculo reto lateral.",
        {
          es: {
            learningObjective: "Localización lesional",
            front: "¿Qué déficit clínico sugiere lesión del nervio abducens (VI par)?",
            back: "Incapacidad para abducir el ojo afectado, acompañada de diplopía horizontal.",
            explanation: "El nervio abducens inerva de forma exclusiva el músculo recto lateral."
          },
          en: {
            learningObjective: "Lesion localization",
            front: "Which clinical deficit indicates an abducens nerve palsy?",
            back: "Inability to abduct the affected eye, resulting in horizontal diplopia worse on ipsilateral gaze.",
            explanation: "The abducens nerve exclusively innervates the lateral rectus muscle."
          },
          de: {
            learningObjective: "Läsionslokalisation",
            front: "Welches Defizit weist auf eine Abduzensparese hin?",
            back: "Unfähigkeit zur Abduktion des betroffenen Auges mit horizontaler Diplopie.",
            explanation: "Der Nervus abducens innerviert selektiv den Musculus rectus lateralis."
          }
        }
      )
    ],
    {
      es: { title: "Pares Craneales", system: "Neuroanatomía" },
      en: { title: "Cranial Nerves", system: "Neuroanatomy" },
      de: { title: "Hirnnerven", system: "Neuroanatomie" }
    }
  )
];

export const FLASHCARD_DIFFICULTIES = ["Fácil", "Médio", "Difícil"];

export const DIFFICULTY_MAP = {
  "Fácil": "Fácil",
  "Médio": "Médio",
  "Difícil": "Difícil",
  "Medio": "Médio",
  "Easy": "Fácil",
  "Medium": "Médio",
  "Hard": "Difícil",
  "Leicht": "Fácil",
  "Mittel": "Médio",
  "Schwer": "Difícil"
};

export function normalizeFlashcardText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findCuratedFlashcardTopic(searchTerm = "") {
  const normalizedTerm = normalizeFlashcardText(searchTerm);
  if (!normalizedTerm) return null;

  return ANATOMICAL_FLASHCARD_TOPICS.find((entry) => {
    const candidates = [
      entry.title,
      entry.translations?.es?.title,
      entry.translations?.en?.title,
      entry.translations?.de?.title,
      ...entry.aliases
    ].filter(Boolean).map(normalizeFlashcardText);

    return candidates.some((candidate) => (
      normalizedTerm.includes(candidate) || candidate.includes(normalizedTerm)
    ));
  }) || null;
}

export function selectCuratedFlashcards({ topic: searchTerm, difficulty = "Médio", count = 10, language = "pt" }) {
  const matchedTopic = findCuratedFlashcardTopic(searchTerm);
  if (!matchedTopic) return { matchedTopic: null, cards: [] };

  const canonicalDifficulty = DIFFICULTY_MAP[difficulty] || difficulty;
  const langKey = ["pt", "es", "en", "de"].includes(language) ? language : "pt";
  const localizedTitle = matchedTopic.translations?.[langKey]?.title || matchedTopic.title;
  const localizedSystem = matchedTopic.translations?.[langKey]?.system || matchedTopic.system;
  const citation = CURATED_SOURCES[langKey] || CURATED_SOURCES.pt;

  const rawCards = matchedTopic.cards
    .filter((entry) => entry.difficulty === canonicalDifficulty)
    .slice(0, Math.max(0, Number(count) || 0));

  const cards = rawCards.map((entry) => {
    const t = entry.translations?.[langKey];
    return {
      ...entry,
      topic: localizedTitle,
      system: localizedSystem,
      learningObjective: t?.learningObjective || entry.learningObjective,
      front: t?.front || entry.front,
      back: t?.back || entry.back,
      explanation: t?.explanation || entry.explanation,
      sourceCitation: citation
    };
  });

  return {
    matchedTopic: {
      ...matchedTopic,
      title: localizedTitle,
      system: localizedSystem
    },
    cards
  };
}
