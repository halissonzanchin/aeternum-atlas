/**
 * Base de Conhecimento Anatômico Enciclopédico da Aeternum Vita
 * Fontes canônicas: Moore (Anatomia Orientada para a Clínica), Sobotta (Atlas de Anatomia Humana),
 * Netter (Atlas de Anatomia Humana), Gray (Anatomia Clínica).
 */

export interface AnatomicalTopic {
  id: string;
  keywords: string[];
  titles: {
    pt: string;
    es: string;
    en: string;
    de: string;
  };
  contexts: {
    pt: string;
    es: string;
    en: string;
    de: string;
  };
  sources: Array<{
    title: string;
    page: number;
    reference: string;
  }>;
}

export const ANATOMICAL_DATABASE: AnatomicalTopic[] = [
  {
    id: "femor_coxofemoral",
    keywords: ["femur", "fêmur", "coxofemoral", "trocanter", "trocânter", "linha aspera", "linha áspera", "thigh bone", "oberschenkelknochen"],
    titles: {
      pt: "Fêmur e Articulação Coxofemoral",
      es: "Fémur y Articulación Coxofemoral",
      en: "Femur and Hip Joint",
      de: "Femur und Hüftgelenk",
    },
    contexts: {
      pt: "O fêmur é o osso mais longo, pesado e resistente do esqueleto humano. Proximalmente apresenta a cabeça femoral (com a fóvea para o ligamento da cabeça), colo anatômico, trocânter maior, trocânter menor e a linha intertrocantérica. O corpo femoral possui a linha áspera posteriormente. Distalmente alarga-se nos côndilos medial e lateral e na tróclea femoral que se articula com a patela e tíbia. Fraturas do colo femoral em idosos comprometem os ramos retinaculares da artéria circunflexa femoral medial, podendo evoluir para necrose avascular da cabeça.",
      es: "El fémur es el hueso del muslo y el más resistente del cuerpo. Proximalmente cuenta con la cabeza, cuello, trocánter mayor y menor. En la diáfisis destaca la línea áspera. Distalmente presenta los cóndilos femorales. Las fracturas intracapsulares del cuello pueden lesionar las arterias circunflejas femorales causando necrosis avascular de la cabeza.",
      en: "The femur is the longest, strongest bone in the human body. Proximally it features the head (with fovea capitis), neck, greater and lesser trochanters, and intertrochanteric line/crest. The shaft features the posterior linea aspera. Distally it forms medial and lateral condyles articulating with the tibia and patella. Femoral neck fractures risk avascular necrosis due to disruption of medial circumflex femoral artery branches.",
      de: "Das Femur ist der längste und stärkste Röhrenknochen. Proximal liegen Caput, Collum femoris, Trochanter major und minor. Am Schaft verläuft die Linea aspera. Distal bilden die Condyli medialis und lateralis das Kniegelenk. Schenkelhalsfrakturen gefährden die A. circumflexa femoris medialis und können zur Femurkopfnekrose führen.",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 512, reference: "moore-cap5-femur" },
      { title: "Netter — Atlas de Anatomia Humana, 7ª Ed.", page: 476, reference: "netter-prancha-476" },
    ],
  },
  {
    id: "tibia_fibula",
    keywords: ["tibia", "tíbia", "fibula", "fíbula", "maleolo", "maléolo", "canela", "perna", "shin", "unterschenkel"],
    titles: {
      pt: "Tíbia, Fíbula e Esqueleto da Perna",
      es: "Tibia, Fíbula (Peroné) y Pierna",
      en: "Tibia, Fibula and Leg Skeleton",
      de: "Tibia, Fibula und Unterschenkel",
    },
    contexts: {
      pt: "O esqueleto da perna é formado pela tíbia (medial, maior e principal osso de sustentação de peso) e pela fíbula (lateral, delgada e não suporta peso corporal direto). Proximalmente, a tíbia apresenta o platô tibial com os côndilos medial e lateral e a tuberosidade da tíbia (inserção do ligamento patelar). Distalmente, a tíbia forma o maléolo medial e a fíbula forma o maléolo lateral, que juntos constituem a pinça maleolar da articulação talocrural (tornozelo). Clinicamente, fraturas expostas da diáfise tibial são frequentes devido à sua localização subcutânea anterior ('canela'), e a síndrome compartimental pós-trauma ameaça a viabilidade muscular da perna.",
      es: "La pierna está compuesta por la tibia y el peroné (fíbula). La tibia soporta el peso y presenta la meseta tibial, tuberosidad tibial y maléolo medial. El peroné forma el maléolo lateral. Ambos forman la mortaja del tobillo. Las fracturas tibiales son comunes por su localización subcutánea.",
      en: "The leg skeleton consists of the tibia (medial, weight-bearing) and fibula (lateral, non-weight-bearing). Proximal tibia features the tibial plateau and tibial tuberosity (patellar ligament insertion). Distally, the medial malleolus (tibia) and lateral malleolus (fibula) form the mortise of the talocrural joint. Tibial shaft fractures frequently risk compartment syndrome.",
      de: "Der Unterschenkel besteht aus Tibia (Schienbein, lasttragend) und Fibula (Wadenbein). Proximal liegen Tibiaplateau und Tuberositas tibiae. Distal bilden Malleolus medialis und lateralis die Malleolengabel des oberen Sprunggelenks.",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 560, reference: "moore-cap5-tibia-fibula" },
      { title: "Netter — Atlas de Anatomia Humana, 7ª Ed.", page: 508, reference: "netter-prancha-508" },
    ],
  },
  {
    id: "musculos_coxa",
    keywords: ["quadriceps", "quadríceps", "isquiotibiais", "coxa", "thigh muscles", "musculos da coxa", "reto femoral", "vasto lateral", "biceps femoral", "semitendineo", "semimembranoso"],
    titles: {
      pt: "Músculos da Coxa: Compartimentos Anterior, Posterior e Medial",
      es: "Músculos del Muslo: Compartimentos Anterior, Posterior y Medial",
      en: "Thigh Muscles: Anterior, Posterior and Medial Compartments",
      de: "Oberschenkelmuskulatur: Anteriores, Posteriores und Mediales Kompartiment",
    },
    contexts: {
      pt: "Os músculos da coxa dividem-se em três compartimentos fasciais: 1) Compartimento Anterior (extensores do joelho, inervados pelo nervo femoral): Músculo Quadríceps Femoral formado pelo Reto Femoral, Vasto Lateral, Vasto Medial e Vasto Intermédio, que convergem no tendão quadricipital e ligamento patelar, além do Músculo Sartório. 2) Compartimento Posterior ou Isquiotibiais (flexores do joelho e extensores do quadril, inervados pela divisão tibial do nervo isquiático): Músculo Bíceps Femoral, Semitendíneo e Semimembranoso. 3) Compartimento Medial (adutores do quadril, inervados pelo nervo obturatório): Adutor Longo, Adutor Curto, Adutor Magno e Grácil. O reflexo patelar (L2-L4) testa diretamente a integridade do nervo femoral e do quadríceps.",
      es: "Los músculos del muslo se agrupan en: 1) Anterior (Cuádriceps femoral: recto femoral, vastos lateral, medial e intermedio; y sartorio; inervados por el nervio femoral). 2) Posterior o isquiotibiales (bíceps femoral, semitendinoso, semimembranoso; nervio ciático). 3) Medial o aductores (aductor mayor, largo, corto y grácil; nervio obturador).",
      en: "Thigh muscles comprise: 1) Anterior compartment (Quadriceps femoris: rectus femoris, vastus lateralis, medialis, intermedius, plus sartorius; femoral nerve). 2) Posterior/Hamstrings (biceps femoris, semitendinosus, semimembranosus; sciatic nerve). 3) Medial/Adductors (adductor longus, brevis, magnus, gracilis; obturator nerve). Patellar reflex tests L2-L4 integrity.",
      de: "Die Oberschenkelmuskeln gliedern sich in: 1) Extensoren (M. quadriceps femoris und M. sartorius; N. femoralis). 2) Flexoren/Ischiokrurale Muskeln (M. biceps femoris, semitendinosus, semimembranosus; N. ischiadicus). 3) Adduktoren (Mm. adductores, gracilis; N. obturatorius).",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 575, reference: "moore-cap5-musculos-coxa" },
      { title: "Sobotta — Atlas de Anatomia Humana, 24ª Ed.", page: 245, reference: "sobotta-vol1-coxa" },
    ],
  },
  {
    id: "musculos_perna_pe",
    keywords: ["triceps sural", "tríceps sural", "panturrilha", "panturrilhas", "gastrocnemio", "gastrocnêmio", "soleo", "sóleo", "tendao de aquiles", "tendão de aquiles", "tarso", "pe", "pé", "talus", "calcaneo", "calcâneo"],
    titles: {
      pt: "Músculos da Perna, Tendão de Aquiles e Ossos do Tarso",
      es: "Músculos de la Pierna, Tendón de Aquiles y Huesos del Tarso",
      en: "Leg Muscles, Achilles Tendon and Tarsal Bones",
      de: "Unterschenkelmuskeln, Achillessehne und Fußwurzelknochen",
    },
    contexts: {
      pt: "Os músculos da perna organizam-se em três compartimentos: 1) Compartimento Posterior Superficial: Músculo Tríceps Sural formado pelas duas cabeças do Gastrocnêmio e pelo Sóleo, que convergem no robusto Tendão Calcâneo (Tendão de Aquiles) inserido na tuberosidade do calcâneo, responsável pela flexão plantar potente na marcha e salto. Inervados pelo nervo tibial (S1-S2). 2) Compartimento Anterior: Músculo Tibial Anterior (dorsiflexão e inversão do pé, inervado pelo nervo fibular profundo; sua lesão causa 'pé caído'). 3) Esqueleto do Pé: O tarso contém 7 ossos distribuídos em proximal (Tálus e Calcâneo), intermediário (Navicular) e distal (Cuboide e os 3 Cuneiformes medial, intermédio e lateral). Rupturas do tendão de Aquiles são avaliadas pelo Teste de Thompson positivo.",
      es: "El tríceps sural (gemelos y sóleo) forma el tendón de Aquiles insertándose en el calcáneo (inervado por el nervio tibial). El tibial anterior realiza la dorsiflexión. El tarso está formado por 7 huesos: astrágalo (tálus), calcáneo, navicular, cuboides y 3 cuneiformes. El signo de Thompson diagnostica la rotura del tendón de Aquiles.",
      en: "The posterior leg features the Triceps Surae (gastrocnemius and soleus) fusing into the calcaneal (Achilles) tendon inserting onto the calcaneal tuberosity (tibial nerve, S1-S2). The anterior compartment contains the tibialis anterior (deep fibular nerve; lesion causes foot drop). The tarsus comprises 7 bones: Talus, Calcaneus, Navicular, Cuboid, and 3 Cuneiforms. Thompson's test detects Achilles rupture.",
      de: "Der M. triceps surae (Gastrocnemius und Soleus) inseriert über die Achillessehne am Tuber calcanei (N. tibialis). Der M. tibialis anterior bewirkt die Dorsalextension (N. fibularis profundus). Die Fußwurzel (Tarsus) umfasst 7 Knochen (Talus, Calcaneus, Os naviculare, Os cuboideum, 3 Ossa cuneiformia).",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 602, reference: "moore-cap5-perna-pe" },
      { title: "Netter — Atlas de Anatomia Humana, 7ª Ed.", page: 512, reference: "netter-prancha-512" },
    ],
  },
  {
    id: "femur_joelho",
    keywords: ["joelho", "knee", "knee joint", "knie", "menisco", "lca", "lcp", "ligamento cruzado"],
    titles: {
      pt: "Joelho, Meniscos e Ligamentos Cruzados (LCA/LCP)",
      es: "Rodilla, Meniscos y Ligamentos Cruzados",
      en: "Knee Joint, Menisci and Cruciate Ligaments (ACL/PCL)",
      de: "Kniegelenk, Menisken und Kreuzbänder (VKB/HKB)",
    },
    contexts: {
      pt: "A articulação do joelho é uma gínglimo modificada que une o fêmur, a tíbia e a patela. A estabilidade articular é garantida pelos ligamentos cruzados intra-articulares: o Ligamento Cruzado Anterior (LCA), que impede a translação anterior da tíbia sobre o fêmur, e o Ligamento Cruzado Posterior (LCP), que impede a translação posterior. Os meniscos medial (em forma de C e aderido ao ligamento colateral medial) e lateral (em forma de O) atuam como amortecedores de impacto e distribuidores de carga. A 'Tríade Terrível de O\'Donoghue' envolve a ruptura combinada do LCA, ligamento colateral tibial e menisco medial.",
      es: "La articulación de la rodilla une el fémur, la tibia y la rótula. El Ligamento Cruzado Anterior (LCA) evita el desplazamiento anterior de la tibia; el Cruzado Posterior (LCP) evita el desplazamiento posterior. Los meniscos medial y lateral absorben cargas. La tríada desgraciada de O'Donoghue compromete el LCA, ligamento colateral medial y menisco medial.",
      en: "The knee joint is a complex hinge joint between the femur, tibia, and patella. Stability is maintained by the Anterior Cruciate Ligament (ACL, prevents anterior tibial translation) and Posterior Cruciate Ligament (PCL, prevents posterior translation). Medial and lateral fibrocartilaginous menisci cushion forces. The 'Unhappy Triad of O'Donoghue' involves tears of the ACL, medial collateral ligament (MCL), and medial meniscus.",
      de: "Das Kniegelenk verbindet Femur, Tibia und Patella. Das Vordere Kreuzband (VKB) verhindert die ventrale Tibiatranslation (vordere Schublade); das Hintere Kreuzband (HKB) die dorsale Translation. Meniscus medialis und lateralis dienen als Stoßdämpfer. Die 'Unhappy Triad' umfasst Läsionen von VKB, Innenband (LCM) und Innenmeniskus.",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 540, reference: "moore-cap5-joelho" },
      { title: "Netter — Atlas de Anatomia Humana, 7ª Ed.", page: 495, reference: "netter-prancha-495" },
    ],
  },
  {
    id: "escapula",
    keywords: ["escapula", "escápula", "scapula", "shoulder blade", "schulterblatt", "omoplata", "omoplato"],
    titles: {
      pt: "Escápula e Cíngulo do Membro Superior",
      es: "Escápula y Cintura Escapular",
      en: "Scapula and Pectoral Girdle",
      de: "Scapula und Schultergürtel",
    },
    contexts: {
      pt: "A escápula é um osso plano e triangular situado na face posterolateral do tórax, sobrepondo-se da 2ª à 7ª costelas. Seus principais acidentes ósseos são a espinha da escápula, o acrômio, o processo coracoide, a cavidade glenoide e as fossas subescapular, supraespinhal e infraespinhal. Articula-se com a clavícula na articulação acromioclavicular e com a cabeça do úmero na articulação glenoumeral. Serve de ponto de fixação para os quatro músculos do manguito rotador (supraespinhal, infraespinhal, redondo menor e subescapular), além do trapézio, deltoide, serrátil anterior e levantador da escápula. Na prática clínica, a discinesia escapular e fraturas de colo glenoideo afetam a estabilidade do ombro.",
      es: "La escápula u omóplato es un hueso plano y triangular ubicado en la región posterolateral del tórax, entre la 2ª y la 7ª costillas. Presenta accidentes clave como la espina escapular, el acromion, el proceso coracoides, la cavidad glenoidea y las fosas supraespinosa, infraespinosa y subescapular. Se articula con la clavícula (acromioclavicular) y con la cabeza del húmero (glenohumeral). Es la base de inserción para los músculos del manguito rotador (supraespinoso, infraespinoso, redondo menor y subescapular), trapecio y serrato anterior. Clínicamente, las lesiones del nervio torácico largo provocan escápula alada.",
      en: "The scapula (shoulder blade) is a flat, triangular bone located on the posterolateral aspect of the thorax, overlying the 2nd to 7th ribs. Major landmarks include the spine of the scapula, acromion, coracoid process, glenoid cavity, and the supraspinous, infraspinous, and subscapular fossae. It articulates with the clavicle at the acromioclavicular joint and with the humeral head at the glenohumeral joint. It provides attachment for the rotator cuff muscles (supraspinatus, infraspinatus, teres minor, subscapularis), trapezius, deltoid, and serratus anterior. Clinically, winging of the scapula occurs with long thoracic nerve injury.",
      de: "Die Scapula (Schulterblatt) ist ein flacher, dreieckiger Knochen an der posterolateralen Thoraxwand zwischen der 2. und 7. Rippe. Wichtige Landmarken sind die Spina scapulae, das Acromion, der Processus coracoideus, die Cavitas glenoidalis sowie die Fossa supra- und infraspinata. Sie artikuliert mit der Clavicula (Articulatio acromioclavicularis) und dem Humeruskopf (Articulatio humeri). Sie dient als Ursprung der Rotatorenmanschette (M. supraspinatus, infraspinatus, teres minor, subscapularis), des M. trapezius und M. serratus anterior. Klinisch führt eine Läsion des N. thoracicus longus zur Scapula alata.",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 674, reference: "moore-cap6-escapula" },
      { title: "Netter — Atlas de Anatomia Humana, 7ª Ed.", page: 408, reference: "netter-prancha-408" },
      { title: "Sobotta — Atlas de Anatomia Humana, 24ª Ed.", page: 182, reference: "sobotta-vol1-escapula" },
    ],
  },
  {
    id: "clavicula",
    keywords: ["clavicula", "clavícula", "clavicle", "schluesselbein", "claviculae"],
    titles: {
      pt: "Clavícula e Cíngulo Peitoral",
      es: "Clavícula y Cintura Pectoral",
      en: "Clavicle and Pectoral Girdle",
      de: "Clavicula und Schultergürtel",
    },
    contexts: {
      pt: "A clavícula é um osso longo e recurvado em forma de 'S' que atua como suporte rígido conectando o membro superior ao esqueleto axial. Possui duas extremidades: a extremidade esternal (que se articula com o manúbrio do esterno na articulação esternoclavicular) e a extremidade acromial (articulando-se com o acrômio da escápula). Sua face superior é lisa e subcutânea; sua face inferior apresenta a impressão do ligamento costoclavicular, o sulco do músculo subclávio, o tubérculo conoide e a linha trapezoide (inserção do ligamento coracoclavicular). Clinicamente, é um dos ossos mais fraturados do corpo, especialmente na junção do terço médio com o terço lateral.",
      es: "La clavícula es un hueso en forma de 'S' que une el miembro superior al tórax. Posee extremidad esternal y acromial. Se articula con el esternón y el acromion. Su tercio medio es el punto más vulnerable a fracturas por traumatismos directos.",
      en: "The clavicle is an S-shaped long bone connecting the upper limb to the axial skeleton. It has a sternal end (sternoclavicular joint) and an acromial end (acromioclavicular joint). Major features include the conoid tubercle, trapezoid line, and subclavian groove. Fractures most commonly involve the middle third.",
      de: "Die Clavicula (Schlüsselbein) ist ein S-förmiger Röhrenknochen. Sie besitzt eine Extremitas sternalis und acromialis. Häufigste Frakturstelle ist das mittlere Drittel nach direktem Sturz auf die Schulter.",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 672, reference: "moore-cap6-clavicula" },
      { title: "Netter — Atlas de Anatomia Humana, 7ª Ed.", page: 407, reference: "netter-prancha-407" },
    ],
  },
  {
    id: "umero",
    keywords: ["umero", "úmero", "humerus", "húmero", "oberarmknochen", "braco", "braço"],
    titles: {
      pt: "Úmero e Articulação Glenoumeral",
      es: "Húmero y Articulación Glenohumeral",
      en: "Humerus and Glenohumeral Joint",
      de: "Humerus und Glenohumeralgelenk",
    },
    contexts: {
      pt: "O úmero é o maior e mais longo osso do membro superior. Proximalmente apresenta a cabeça do úmero, colo anatômico, colo cirúrgico, tubérculo maior, tubérculo menor e o sulco intertubercular. Na diáfise localiza-se a tuberosidade deltoidea e o sulco do nervo radial. Distalmente forma os côndilos: tróclea, capítulo, fossa olecraniana e epicôndilos medial e lateral. Clinicamente, fraturas do colo cirúrgico podem lesar o nervo axilar e a artéria circunflexa umeral posterior.",
      es: "El húmero es el hueso del brazo. Proximalmente presenta la cabeza humeral, cuello anatómico, cuello quirúrgico, tubérculo mayor y tubérculo menor. En la diáfisis se encuentra la tuberosidad deltoidea y el surco para el nervio radial. Distalmente posee la tróclea, el capítulo y los epicóndilos. Clínicamente, las fracturas del cuello quirúrgico pueden comprometer el nervio axilar.",
      en: "The humerus is the single bone of the arm. Proximal features include the head, anatomical and surgical necks, greater and lesser tubercles, and the intertubercular sulcus. Distal landmarks include the capitulum, trochlea, and epicondyles. Fractures of the surgical neck risk damaging the axillary nerve.",
      de: "Der Humerus ist der längste Knochen der oberen Extremität. Proximal finden sich Caput humeri, Collum anatomicum und chirurgicum, Tuberculum majus und minus sowie der Sulcus intertubercularis. Frakturen des Collum chirurgicum gefährden den N. axillaris.",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 678, reference: "moore-cap6-umero" },
      { title: "Netter — Atlas de Anatomia Humana, 7ª Ed.", page: 410, reference: "netter-prancha-410" },
    ],
  },
  {
    id: "manguito_rotador",
    keywords: ["manguito rotador", "manguito", "rotator cuff", "supraespinhal", "infraespinhal", "redondo menor", "subescapular", "rotatorenmanschette"],
    titles: {
      pt: "Músculos do Manguito Rotador",
      es: "Músculos del Manguito Rotador",
      en: "Rotator Cuff Muscles",
      de: "Rotatorenmanschette",
    },
    contexts: {
      pt: "O manguito rotador é composto por quatro músculos intrínsecos do ombro: Supraespinhal (inicia a abdução do braço de 0 a 15 graus), Infraespinhal (rotação lateral), Redondo Menor (rotação lateral) e Subescapular (rotação medial). Juntos, seus tendões fundem-se à cápsula articular do ombro e formam um colar musculotendíneo protetor que centraliza a cabeça do úmero na cavidade glenoide durante todos os movimentos. A síndrome do impacto subacromial e rupturas do tendão do supraespinhal são as afecções clínicas mais prevalentes.",
      es: "El manguito rotador está formado por cuatro músculos: Supraespinoso (abducción inicial 0-15°), Infraespinoso (rotación externa), Redondo menor (rotación externa) y Subescapular (rotación interna). Sus tendones refuerzan la cápsula glenohumeral y estabilizan dinámicamente la cabeza humeral.",
      en: "The rotator cuff comprises four muscles (SITS): Supraspinatus (initiates abduction 0-15°), Infraspinatus (lateral rotation), Teres minor (lateral rotation), and Subscapularis (medial rotation). Their tendons reinforce the glenohumeral capsule, keeping the humeral head centered in the glenoid cavity.",
      de: "Die Rotatorenmanschette besteht aus vier Muskeln: M. supraspinatus, M. infraspinatus, M. teres minor und M. subscapularis. Sie sichern den Humeruskopf dynamisch in der Gelenkpfanne.",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 702, reference: "moore-cap6-manguito-rotador" },
      { title: "Sobotta — Atlas de Anatomia Humana, 24ª Ed.", page: 196, reference: "sobotta-vol1-manguito" },
    ],
  },
  {
    id: "tunel_carpo",
    keywords: ["tunel do carpo", "túnel do carpo", "carpal tunnel", "karpaltunnel", "nervo mediano", "retinaculo flexor", "carpo"],
    titles: {
      pt: "Túnel do Carpo e Nervo Mediano",
      es: "Túnel Carpiano y Nervio Mediano",
      en: "Carpal Tunnel and Median Nerve",
      de: "Karpaltunnel und Nervus medianus",
    },
    contexts: {
      pt: "O túnel do carpo é uma passagem osteofibrosa no punho delimitada profundamente pelos ossos do carpo (sulco do carpo) e anteriormente pelo espesso retináculo dos flexores (ligamento transverso do carpo). Por ele passam 10 estruturas: o Nervo Mediano e 9 tendões flexores (4 do flexor profundo dos dedos, 4 do flexor superficial dos dedos e 1 do flexor longo do polegar). A Síndrome do Túnel do Carpo decorre da compressão do nervo mediano, manifestando-se por parestesias nos três primeiros quirodáctilos e metade radial do 4º dedo, além de atrofia da eminência tenar.",
      es: "El túnel carpiano es un canal osteofibroso formado por los huesos del carpo y el retináculo flexor. Contiene 10 estructuras: el nervio mediano y los 9 tendones de los flexores de los dedos.",
      en: "The carpal tunnel is an osteofibrous canal formed by carpal bones and the flexor retinaculum. It transmits 10 structures: the median nerve and 9 flexor tendons. Carpal Tunnel Syndrome causes compression of the median nerve.",
      de: "Der Karpaltunnel ist eine osteofibröse Rinne zwischen den Handwurzelknochen und dem Retinaculum flexorum. Er beinhaltet 10 Strukturen: den N. medianus sowie 9 Beugesehnen.",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 755, reference: "moore-cap6-tunel-carpo" },
      { title: "Netter — Atlas de Anatomia Humana, 7ª Ed.", page: 448, reference: "netter-prancha-448" },
    ],
  },
  {
    id: "plexo_braquial",
    keywords: ["plexo braquial", "brachial plexus", "plejo braquial", "plexus brachialis", "nervo radial", "nervo mediano", "nervo ulnar"],
    titles: {
      pt: "Plexo Braquial e Inervação do Membro Superior",
      es: "Plexo Braquial e Inervación",
      en: "Brachial Plexus",
      de: "Plexus brachialis",
    },
    contexts: {
      pt: "O plexo braquial é formado pelos ramos anteriores dos nervos espinhais C5 a T1. Estrutura-se em Raízes (C5-T1), Troncos (Superior, Médio, Inferior), Divisões (Anteriores e Posteriores) e Fascículos (Lateral, Medial, Posterior), situados em relação à artéria axilar. Origina os ramos terminais: nervo musculocutâneo, nervo axilar, nervo radial, nervo mediano e nervo ulnar. Lesões proximais (C5-C6) causam paralisia de Erb-Duchenne ('gorjeta do garçom'); lesões distais (C8-T1) causam paralisia de Klumpke ('mão em garra').",
      es: "El plexo braquial está constituido por los ramos ventrales de C5 a T1. Se organiza en Raíces, Troncos, Divisiones y Fascículos en relación con la arteria axilar. Da origen a los nervios musculocutáneo, axilar, radial, mediano y ulnar.",
      en: "The brachial plexus is formed by the anterior rami of C5-T1 spinal nerves. It is organized into Roots, Trunks, Divisions, and Cords. Terminal branches are the musculocutaneous, axillary, radial, median, and ulnar nerves.",
      de: "Der Plexus brachialis entsteht aus den Rr. anteriores der Spinalnerven C5-T1. Er gliedert sich in Trunci, Divisiones und Fasciculi. Endäste sind Nn. musculocutaneus, axillaris, radialis, medianus und ulnaris.",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 720, reference: "moore-cap6-plexo-braquial" },
      { title: "Netter — Atlas de Anatomia Humana, 7ª Ed.", page: 418, reference: "netter-prancha-418" },
    ],
  },
  {
    id: "pares_cranianos",
    keywords: ["pares cranianos", "nervos cranianos", "cranial nerves", "nervios craneales", "hirnnerven", "trigemeo", "vago", "facial", "oculomotor", "optico"],
    titles: {
      pt: "12 Pares de Nervos Cranianos (I a XII)",
      es: "12 Pares Craneales (I al XII)",
      en: "12 Cranial Nerves (I to XII)",
      de: "12 Hirnnerven (I bis XII)",
    },
    contexts: {
      pt: "Os 12 pares de nervos cranianos emergem do encéfalo e tronco encefálico: I-Olfatório (sensorial/olfato), II-Óptico (visão), III-Oculomotor (motricidade ocular/parassimpático pupilar), IV-Troclear (músculo oblíquo superior), V-Trigêmeo (sensibilidade da face e mastigação, ramos V1/V2/V3), VI-Abducente (músculo reto lateral), VII-Facial (mímica facial, gustação anterior e lacrimejamento), VIII-Vestibulococlear (audição e equilíbrio), IX-Glossofaríngeo (gustação posterior e deglutição), X-Vago (inervação parassimpática visceral toracoabdominal), XI-Acessório (trapézio e esternocleidomastóideo) e XII-Hipoglosso (motricidade intrínseca da língua).",
      es: "Los 12 pares craneales son: I Olfatorio, II Óptico, III Oculomotor, IV Troclear, V Trigémino, VI Abducens, VII Facial, VIII Vestibulococlear, IX Glosofaríngeo, X Vago, XI Accesorio y XII Hipogloso.",
      en: "The 12 pairs of cranial nerves are: I-Olfactory, II-Optic, III-Oculomotor, IV-Trochlear, V-Trigeminal, VI-Abducens, VII-Facial, VIII-Vestibulocochlear, IX-Glossopharyngeal, X-Vagus, XI-Accessory, and XII-Hypoglossal.",
      de: "Die 12 Hirnnerven sind: I N. olfactorius, II N. opticus, III N. oculomotorius, IV N. trochlearis, V N. trigeminus, VI N. abducens, VII N. facialis, VIII N. vestibulocochlearis, IX N. glossopharyngeus, X N. vagus, XI N. accessorius, XII N. hypoglossus.",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 880, reference: "moore-cap8-nervos-cranianos" },
      { title: "Sobotta — Atlas de Anatomia Humana, 24ª Ed.", page: 285, reference: "sobotta-vol3-nervos-cranianos" },
    ],
  },
  {
    id: "forames_cranio",
    keywords: ["forames do cranio", "forame magno", "forame jugular", "canal carotico", "cranio", "skull base", "schadelbasis", "foramina"],
    titles: {
      pt: "Forames da Base do Crânio e Estruturas de Passagem",
      es: "Forámenes de la Base del Cráneo",
      en: "Cranial Foramina and Transmitted Structures",
      de: "Schädelbasislöcher und Durchtrittspforten",
    },
    contexts: {
      pt: "A base do crânio contém forames cruciais divididos em três fossas: 1) Fossa Craniana Anterior: Lâmina cribriforme (N. Olfatório I). 2) Fossa Craniana Média: Canal óptico (N. Óptico II e Artéria oftálmica), Fissura orbital superior (NC III, IV, V1, VI e veia oftálmica), Forame redondo (N. Maxilar V2), Forame oval (N. Mandibular V3) e Forame espinhoso (Artéria meníngea média). 3) Fossa Craniana Posterior: Meato acústico interno (NC VII e VIII), Forame jugular (NC IX, X, XI e veia jugular interna) e Forame magno (medula espinhal, artérias vertebrais e raízes espinhais do NC XI).",
      es: "La base del cráneo posee forámenes clave: Canal óptico, Fisura orbitaria superior, Foramen redondo, Foramen oval, Foramen espinoso, Foramen yugular y Foramen magno.",
      en: "Key skull base foramina transmit neurovascular structures: Cribriform plate, Optic canal, Superior orbital fissure, Foramen rotundum, Foramen ovale, Foramen spinosum, Internal acoustic meatus, Jugular foramen, and Foramen magnum.",
      de: "Wichtige Schädelbasisforamina: Canalis opticus, Fissura orbitalis superior, Foramen rotundum, Foramen ovale, Foramen spinosum, Foramen jugulare und Foramen magnum.",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 832, reference: "moore-cap8-forames-cranio" },
      { title: "Netter — Atlas de Anatomia Humana, 7ª Ed.", page: 12, reference: "netter-prancha-12" },
    ],
  },
  {
    id: "coluna_vertebral",
    keywords: ["coluna vertebral", "vertebra", "vertebras", "atlas", "axis", "disco intervertebral", "hernia de disco", "spine", "wirbelsaule"],
    titles: {
      pt: "Coluna Vertebral, Vértebras e Discos Intervertebrais",
      es: "Columna Vertebral y Discos Intervertebrales",
      en: "Vertebral Column and Intervertebral Discs",
      de: "Wirbelsäule und Bandscheiben",
    },
    contexts: {
      pt: "A coluna vertebral é composta por 33 vértebras: 7 cervicais, 12 torácicas, 5 lombares, 5 sacrais fundidas e 4 coccígeas. O Atlas (C1) não possui corpo nem processo espinhoso e articula-se com os côndilos occipitais (movimento de 'sim'). O Áxis (C2) possui o dente do áxis (processo odontoide) permitindo a rotação da cabeça (movimento de 'não'). Os discos intervertebrais são constituídos pelo anel fibroso periférico e pelo núcleo pulposo gelatinoso central. A hérnia de disco ocorre pela ruptura posterolateral do anel fibroso, comprimindo raízes nervosas espinhais (ciatalgia comum em L4-L5 e L5-S1).",
      es: "La columna vertebral consta de 33 vértebras: 7 cervicales, 12 torácicas, 5 lumbares, sacro y cóccix. El Atlas (C1) carece de cuerpo; el Axis (C2) presenta el diente odontoideo.",
      en: "The vertebral column consists of 33 vertebrae (7C, 12T, 5L, 5S fused, 4Co fused). Atlas (C1) lacks a body; Axis (C2) features the odontoid process. Intervertebral discs contain an outer anulus fibrosus and a central nucleus pulposus.",
      de: "Die Wirbelsäule besteht aus 33 Wirbeln. Atlas (C1) ist ringförmig; Axis (C2) trägt den Dens axis zur Kopfrotation. Bandscheiben bestehen aus Anulus fibrosus und Nucleus pulposus.",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 440, reference: "moore-cap4-coluna-vertebral" },
      { title: "Sobotta — Atlas de Anatomia Humana, 24ª Ed.", page: 12, reference: "sobotta-vol1-coluna" },
    ],
  },
  {
    id: "poligono_willis",
    keywords: ["poligono de willis", "polígono de willis", "circle of willis", "circulo arterial do cerebro", "circulo de willis", "circulus arteriosus cerebri", "cerebro", "cérebro"],
    titles: {
      pt: "Polígono de Willis (Círculo Arterial Cerebral)",
      es: "Polígono de Willis (Círculo Arterial Cerebral)",
      en: "Circle of Willis (Cerebral Arterial Circle)",
      de: "Circulus arteriosus cerebri (Willis-Ring)",
    },
    contexts: {
      pt: "O polígono de Willis é uma rede vascular anastomótica pentagonal situada na base do encéfalo, na fossa interpeduncular. Une o sistema carotídeo interno anterior ao sistema vertebrobasilar posterior. É formado pelas artérias cerebrais anteriores, artéria comunicante anterior, artérias carótidas internas, artérias comunicantes posteriores e artérias cerebrais posteriores (ramos da artéria basilar). Fornece fluxo colateral essencial caso uma das vias principais sofra oclusão. Aneurismas saculares congênitos nas bifurcações do polígono são a principal causa de hemorragia subaracnóidea.",
      es: "El polígono de Willis es un círculo arterial situado en la base del cerebro. Conecta el sistema carotídeo interno con el sistema vertebrobasilar.",
      en: "The Circle of Willis is an anastomotic polygon located at the base of the brain in the interpeduncular cistern. It connects the internal carotid system and vertebrobasilar system.",
      de: "Der Circulus arteriosus cerebri ist ein arterieller Gefäßring an der Gehirnbasis. Er verbindet das Karotis- und Vertebrobasilarsystem.",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 864, reference: "moore-cap8-vascularizacao-encefalo" },
      { title: "Netter — Atlas de Anatomia Humana, 7ª Ed.", page: 140, reference: "netter-prancha-140" },
    ],
  },
  {
    id: "coracao",
    keywords: ["coracao", "coração", "heart", "corazon", "corazón", "herz", "miocardio", "valvas", "ventriculo", "atrio", "coronarias"],
    titles: {
      pt: "Coração, Câmaras e Vascularização Coronária",
      es: "Corazón, Cámaras y Vasos Coronarios",
      en: "Heart, Chambers and Coronary Circulation",
      de: "Herz, Binnenräume und Koronargefäße",
    },
    contexts: {
      pt: "O coração é uma bomba muscular oca tetracameral localizada no mediastino médio, envolvida pelo pericárdio. É dividido em átrio direito, ventrículo direito, átrio esquerdo e ventrículo esquerdo. Possui quatro valvas principais: tricúspide e pulmonar (lado direito), mitral (bicúspide) e aórtica (lado esquerdo). A vascularização é suprida pelas artérias coronárias direita e esquerda originadas nos seios da aorta ascendente. O sistema de condução cardíaco intrínseco (nó sinoatrial, nó atrioventricular, feixe de His e fibras de Purkinje) dita o ritmo elétrico miocárdico. O infarto agudo do miocárdio decorre comumente da oclusão da artéria descendente anterior esquerda (ramo interventricular anterior).",
      es: "El corazón es un órgano muscular situado en el mediastino medio. Consta de cuatro cavidades: dos aurículas y dos ventrículos. Posee cuatro válvulas: tricúspide, pulmonar, mitral y aórtica.",
      en: "The heart is a four-chambered muscular organ located in the middle mediastinum within the pericardium. It consists of right and left atria and ventricles.",
      de: "Das Herz ist ein Hohlorgan im mittleren Mediastinum, umgeben vom Perikard. Es besitzt vier Räume: Atrium dextrum/sinistrum und Ventriculus dexter/sinister.",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 135, reference: "moore-cap1-coracao" },
      { title: "Netter — Atlas de Anatomia Humana, 7ª Ed.", page: 215, reference: "netter-prancha-215" },
    ],
  },
  {
    id: "pulmoes_mediastino",
    keywords: ["pulmao", "pulmão", "pulmoes", "pulmões", "lung", "pulmones", "lunge", "pleura", "traqueia", "mediastino", "bronquios"],
    titles: {
      pt: "Pulmões, Árvore Traqueobrônquica e Mediastino",
      es: "Pulmones, Árbol Traqueobronquial y Mediastino",
      en: "Lungs, Tracheobronchial Tree and Mediastinum",
      de: "Lungen, Tracheobronchialbaum und Mediastinum",
    },
    contexts: {
      pt: "Os pulmões são os órgãos vitais da respiração situados nas cavidades pleurais do tórax, separados pelo mediastino. O pulmão direito possui 3 lobos (superior, médio, inferior) divididos por duas fissuras (oblíqua e horizontal); o pulmão esquerdo possui 2 lobos (superior com a língula, e inferior) e incisura cardíaca. A traqueia bifurca-se na carina (nível T4-T5) nos brônquios principais direito (mais largo, curto e verticalizado, sendo sítio comum de aspiração de corpo estranho) e esquerdo. A pleura visceral reveste os pulmões e a parietal reveste a parede torácica, com pressão intrapleural negativa essencial para a mecânica ventilatória.",
      es: "Los pulmones ocupan las cavidades pleurales. El pulmón derecho tiene 3 lóbulos y 2 fisuras; el izquierdo tiene 2 lóbulos y la língula.",
      en: "The lungs occupy the pleural cavities in the thorax. The right lung has 3 lobes separated by oblique and horizontal fissures; the left lung has 2 lobes and a cardiac notch/lingula.",
      de: "Die Lungen liegen in den Pleurahöhlen. Die rechte Lunge hat 3 Lappen (Fissura obliqua und horizontalis); die linke 2 Lappen mit Lingula.",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 110, reference: "moore-cap1-pulmoes" },
      { title: "Sobotta — Atlas de Anatomia Humana, 24ª Ed.", page: 88, reference: "sobotta-vol2-pulmoes" },
    ],
  },
  {
    id: "figado_couinaud",
    keywords: ["figado", "fígado", "liver", "higado", "hígado", "leber", "couinaud", "triade portal", "vesicula biliar", "porta hepatis"],
    titles: {
      pt: "Fígado, Segmentação de Couinaud e Sistema Porta",
      es: "Hígado, Segmentación de Couinaud y Sistema Porta",
      en: "Liver, Couinaud Segmentation and Portal System",
      de: "Leber, Couinaud-Segmentierung und Pfortadersystem",
    },
    contexts: {
      pt: "O fígado é a maior glândula do corpo humano, localizado no hipocôndrio direito e epigástrio. A classificação funcional de Couinaud divide o fígado em 8 segmentos independentes (I a VIII), cada um com seu próprio suprimento vascular da tríade portal (ramo da Veia Porta, ramo da Artéria Hepática Própria e Ducto Biliar segmentar) e drenagem por veias hepáticas. O segmento I é o lobo caudado. A veia porta hepática é formada pela confluência da veia mesentérica superior com a veia esplênica atrás do colo do pâncreas, transportando 75% do fluxo sanguíneo hepático com nutrientes absorvidos do trato digestório.",
      es: "El hígado se divide según la segmentación de Couinaud en 8 segmentos independientes (I al VIII), basados en la distribución de la tríada portal.",
      en: "The liver is anatomically divided by Couinaud's classification into 8 functionally independent segments (I to VIII), each possessing its own portal triad branch.",
      de: "Die Leber gliedert sich nach der Couinaud-Klassifikation in 8 funktionell autonome Segmente (I bis VIII), basierend auf den Ästen der Glisson-Trias.",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 275, reference: "moore-cap2-figado" },
      { title: "Netter — Atlas de Anatomia Humana, 7ª Ed.", page: 277, reference: "netter-prancha-277" },
    ],
  },
  {
    id: "rins_sistema_urinario",
    keywords: ["rim", "rins", "kidney", "kidneys", "rinon", "riñón", "riñones", "niere", "nefron", "néfron", "ureter"],
    titles: {
      pt: "Rins, Néfron e Trato Urinário Superior",
      es: "Riñones, Nefrona y Tracto Urinario",
      en: "Kidneys, Nephron and Upper Urinary Tract",
      de: "Nieren, Nephron und oberer Harntrakt",
    },
    contexts: {
      pt: "Os rins são órgãos retroperitoneais pares localizados entre as vértebras T12 e L3, envolvidos pela fáscia renal de Gerota e cápsula adiposa. O rim direito situa-se ligeiramente mais baixo devido ao fígado. O parênquima renal divide-se em Córtex Renal externo (onde se localizam os glomérulos e túbulos contorcidos) e Medula Renal interna (formada pelas pirâmides renais de Malpighi que convergem para as papilas, cálices menores, cálices maiores e pelve renal). O néfron é a unidade morfofuncional (cerca de 1 milhão por rim). As artérias renais originam-se da aorta abdominal ao nível de L1-L2.",
      es: "Los riñones son órganos retroperitoneales (T12-L3) protegidos por la fascia de Gerota. Constan de corteza renal externa y médula renal interna.",
      en: "The kidneys are retroperitoneal organs (T12-L3) enveloped by Gerota's renal fascia and perirenal fat. The parenchyma comprises an outer renal cortex and inner renal medulla.",
      de: "Die Nieren sind retroperitoneale Organe (Th12-L3) in der Gerota-Faszie. Das Nierenparenchym gliedert sich in Cortex renalis und Medulla renalis.",
    },
    sources: [
      { title: "Moore — Anatomia Orientada para a Clínica, 8ª Ed.", page: 305, reference: "moore-cap2-rins" },
      { title: "Sobotta — Atlas de Anatomia Humana, 24ª Ed.", page: 145, reference: "sobotta-vol2-rins" },
    ],
  },
];

/**
 * Busca inteligente por similaridade léxica e fonética na base enciclopédica anatômica da Vita.
 */
export const searchLocalAnatomy = (
  query: string,
  language: "pt" | "es" | "en" | "de" = "pt",
): { context: string; sources: Array<{ title: string; page: number; reference: string }> } | null => {
  const normalizedQuery = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (normalizedQuery.length < 2) {
    return null;
  }

  const queryWords = normalizedQuery.split(/[^a-z0-9]+/).filter((w) => w.length >= 3);

  let bestMatch: AnatomicalTopic | null = null;
  let highestScore = 0;

  for (const topic of ANATOMICAL_DATABASE) {
    let score = 0;

    for (const keyword of topic.keywords) {
      const normKeyword = keyword
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (normalizedQuery.includes(normKeyword)) {
        score += 15;
      }

      for (const word of queryWords) {
        if (normKeyword.includes(word)) {
          score += 4;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = topic;
    }
  }

  if (!bestMatch || highestScore < 3) {
    return null;
  }

  const context = bestMatch.contexts[language] || bestMatch.contexts.pt;
  return {
    context,
    sources: bestMatch.sources,
  };
};
