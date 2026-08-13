const CURATED_SOURCE = "Banco editorial Aeternum 26.1 · revisão anatômica recomendada";

function card(id, difficulty, learningObjective, front, back, explanation) {
  return {
    id,
    difficulty,
    learningObjective,
    front,
    back,
    explanation,
    sourceCitation: CURATED_SOURCE,
    origin: "curated"
  };
}

function topic(id, title, system, aliases, cards) {
  return { id, title, system, aliases, cards };
}

export const ANATOMICAL_FLASHCARD_TOPICS = [
  topic("clavicula-ombro", "Clavícula e Ombro", "Membro superior", ["clavicula", "clavícula", "ombro", "escapula", "escápula"], [
    card("clo-f-01", "Fácil", "Orientação óssea", "Quais extremidades da clavícula se articulam com o esterno e com a escápula?", "A extremidade esternal articula-se com o manúbrio; a extremidade acromial, com o acrômio.", "Essas articulações conectam o membro superior ao esqueleto axial e ao complexo escapular."),
    card("clo-f-02", "Fácil", "Reconhecimento de marco", "Em qual face da clavícula se localiza o sulco do músculo subclávio?", "Na face inferior do terço médio da clavícula.", "O sulco serve de área de fixação para o músculo subclávio."),
    card("clo-f-03", "Fácil", "Ligamentos", "Quais ligamentos formam o ligamento coracoclavicular?", "Os ligamentos conoide e trapezoide.", "Juntos, eles estabilizam a relação entre a clavícula e o processo coracoide."),
    card("clo-f-04", "Fácil", "Movimento", "Qual músculo inicia os primeiros graus de abdução do braço?", "O músculo supraespinal.", "Após o início do movimento, o deltoide assume papel predominante na abdução."),
    card("clo-m-01", "Médio", "Inserção ligamentar", "Qual acidente ósseo da clavícula recebe o ligamento conoide?", "O tubérculo conoide, na face inferior da extremidade acromial.", "A linha trapezoide, situada próxima, recebe o ligamento trapezoide."),
    card("clo-m-02", "Médio", "Estabilidade articular", "Por que a articulação esternoclavicular é decisiva para a mobilidade do membro superior?", "Porque é a única articulação sinovial que liga diretamente o membro superior ao esqueleto axial.", "Grande parte do posicionamento da cintura escapular depende dessa articulação."),
    card("clo-m-03", "Médio", "Manguito rotador", "Quais músculos compõem o manguito rotador?", "Supraespinal, infraespinal, redondo menor e subescapular.", "Seus tendões reforçam a cápsula glenoumeral e mantêm a cabeça do úmero centrada na glenoide."),
    card("clo-m-04", "Médio", "Biomecânica", "Quais músculos promovem a rotação superior da escápula durante a elevação completa do braço?", "Trapézio e serrátil anterior.", "A ação coordenada desses músculos orienta a cavidade glenoidal superiormente."),
    card("clo-d-01", "Difícil", "Trauma", "Em uma fratura do terço médio da clavícula, quais deslocamentos dos fragmentos são esperados?", "O fragmento medial tende a elevar-se pela ação do esternocleidomastoideo; o lateral tende a cair pelo peso do membro.", "A configuração muscular e gravitacional explica a deformidade clínica típica."),
    card("clo-d-02", "Difícil", "Correlação neurológica", "Qual nervo deve ser testado após uma luxação anterior da articulação glenoumeral?", "O nervo axilar.", "Ele contorna o colo cirúrgico do úmero e pode ser tracionado na luxação anterior."),
    card("clo-d-03", "Difícil", "Estabilização dinâmica", "Como o manguito rotador evita a migração superior da cabeça do úmero durante a abdução?", "Comprime e centraliza a cabeça umeral na cavidade glenoidal enquanto o deltoide eleva o braço.", "Sem essa coaptação, a força superior do deltoide favoreceria impacto subacromial."),
    card("clo-d-04", "Difícil", "Lesão funcional", "Qual lesão nervosa produz escápula alada e dificulta elevar o braço acima da horizontal?", "Lesão do nervo torácico longo, com paralisia do serrátil anterior.", "A escápula perde sua fixação à parede torácica e sua rotação superior fica prejudicada.")
  ]),
  topic("umero-braco", "Úmero e Braço", "Membro superior", ["umero", "úmero", "braco", "braço"], [
    card("ume-f-01", "Fácil", "Articulações", "Com quais ossos o úmero se articula proximal e distalmente?", "Proximalmente com a escápula; distalmente com rádio e ulna.", "A cabeça participa da articulação glenoumeral, enquanto tróclea e capítulo participam do cotovelo."),
    card("ume-f-02", "Fácil", "Reconhecimento", "Qual estrutura do úmero articula-se com a cabeça do rádio?", "O capítulo do úmero.", "O capítulo ocupa a porção lateral da extremidade distal."),
    card("ume-f-03", "Fácil", "Reconhecimento", "Qual estrutura do úmero articula-se com a incisura troclear da ulna?", "A tróclea do úmero.", "A tróclea é medial ao capítulo."),
    card("ume-f-04", "Fácil", "Inserção muscular", "Em qual acidente ósseo do úmero se insere o músculo deltoide?", "Na tuberosidade deltoidea.", "Ela está localizada na face lateral da diáfise umeral."),
    card("ume-m-01", "Médio", "Relação neurovascular", "Qual nervo percorre o sulco do nervo radial na face posterior do úmero?", "O nervo radial, acompanhado pela artéria braquial profunda.", "Essa relação torna o nervo vulnerável nas fraturas da diáfise."),
    card("ume-m-02", "Médio", "Relação neurovascular", "Qual nervo passa posteriormente ao epicôndilo medial do úmero?", "O nervo ulnar.", "A posição superficial explica a parestesia provocada por trauma nessa região."),
    card("ume-m-03", "Médio", "Trauma", "Qual nervo está particularmente ameaçado em fraturas do colo cirúrgico do úmero?", "O nervo axilar.", "A artéria circunflexa umeral posterior também acompanha essa região."),
    card("ume-m-04", "Médio", "Trauma", "Qual estrutura vascular pode ser lesada em uma fratura supracondilar do úmero?", "A artéria braquial.", "O nervo mediano também pode ser afetado por sua proximidade anterior ao cotovelo."),
    card("ume-d-01", "Difícil", "Déficit motor", "Que déficit sugere lesão do nervo radial após fratura da diáfise umeral?", "Queda do punho por fraqueza dos extensores, frequentemente com alteração sensitiva dorsal da mão.", "O nível da lesão determina quais ramos e músculos permanecem funcionantes."),
    card("ume-d-02", "Difícil", "Isquemia", "Qual síndrome pode resultar de lesão da artéria braquial após fratura supracondilar?", "Contratura isquêmica de Volkmann.", "A isquemia dos músculos flexores do antebraço pode produzir deformidade permanente se não for tratada."),
    card("ume-d-03", "Difícil", "Diferenciação clínica", "Como diferenciar uma lesão do nervo axilar de uma lesão isolada do supraespinal pela abdução?", "A lesão axilar compromete principalmente a abdução após o início e reduz sensibilidade sobre o deltoide; a lesão do supraespinal prejudica sobretudo o início da abdução.", "O exame combina amplitude, força e território sensitivo."),
    card("ume-d-04", "Difícil", "Anatomia aplicada", "Por que uma fratura do epicôndilo medial pode alterar movimentos finos da mão?", "Porque pode lesar o nervo ulnar, que inerva grande parte dos músculos intrínsecos da mão.", "A repercussão distal decorre da passagem superficial do nervo junto ao epicôndilo.")
  ]),
  topic("vertebras-cervicais", "Vértebras Cervicais", "Coluna vertebral", ["vertebra", "vértebra", "cervical", "atlas", "axis", "áxis"], [
    card("cer-f-01", "Fácil", "Identificação", "Qual vértebra cervical não possui corpo nem processo espinhoso?", "O atlas, C1.", "O atlas forma um anel com arcos anterior e posterior e massas laterais."),
    card("cer-f-02", "Fácil", "Identificação", "Qual vértebra apresenta o dente do áxis?", "C2, o áxis.", "O dente funciona como pivô para a rotação do atlas e da cabeça."),
    card("cer-f-03", "Fácil", "Marco palpável", "Qual vértebra é conhecida como vértebra proeminente?", "C7.", "Seu processo espinhoso longo costuma ser palpável na base do pescoço."),
    card("cer-f-04", "Fácil", "Característica regional", "Qual forame caracteriza os processos transversos das vértebras cervicais?", "O forame transversário.", "Ele distingue a região cervical das demais regiões vertebrais."),
    card("cer-m-01", "Médio", "Vascularização", "Em qual nível a artéria vertebral geralmente entra no forame transversário?", "Em C6.", "Depois, ascende pelos forames transversários até C1; variações anatómicas podem ocorrer."),
    card("cer-m-02", "Médio", "Ligamentos", "Qual ligamento mantém o dente do áxis junto ao arco anterior do atlas?", "O ligamento transverso do atlas.", "Ele impede deslocamento posterior do dente em direção à medula espinal."),
    card("cer-m-03", "Médio", "Articulação", "Qual movimento predomina na articulação atlantoaxial mediana?", "Rotação.", "O atlas e a cabeça giram em torno do dente do áxis."),
    card("cer-m-04", "Médio", "Morfologia", "Quais vértebras são consideradas cervicais típicas?", "C3 a C6.", "Elas compartilham corpo pequeno, forames transversários e processos espinhosos frequentemente bífidos."),
    card("cer-d-01", "Difícil", "Trauma", "Qual padrão de lesão define a fratura de Jefferson?", "Fratura em explosão do atlas, geralmente por carga axial.", "As massas laterais podem afastar-se, com risco de lesão do ligamento transverso."),
    card("cer-d-02", "Difícil", "Trauma", "Qual região óssea é tipicamente fraturada na lesão conhecida como fratura do enforcado?", "A pars interarticularis do áxis, bilateralmente.", "O mecanismo clássico envolve hiperextensão e carga axial."),
    card("cer-d-03", "Difícil", "Radiculopatia", "Uma hérnia posterolateral do disco C5–C6 costuma comprimir qual raiz nervosa?", "A raiz C6.", "Em geral, a raiz que sai abaixo do nível cervical do disco é a mais afetada."),
    card("cer-d-04", "Difícil", "Instabilidade", "Por que a ruptura do ligamento transverso do atlas é potencialmente grave?", "Porque permite deslocamento do atlas em relação ao dente, ameaçando a medula cervical alta.", "A estabilidade atlantoaxial depende fortemente desse ligamento.")
  ]),
  topic("femur-osteologia", "Fêmur e Osteologia", "Membro inferior", ["femur", "fêmur", "femoral", "coxa"], [
    card("fem-f-01", "Fácil", "Identificação", "Qual é o osso mais longo e resistente do corpo humano?", "O fêmur.", "Ele transmite cargas entre o quadril e o joelho."),
    card("fem-f-02", "Fácil", "Articulação", "Com qual estrutura do osso do quadril a cabeça do fêmur se articula?", "Com o acetábulo.", "Essa articulação sinovial esferoide forma a articulação coxofemoral."),
    card("fem-f-03", "Fácil", "Reconhecimento", "Quais são as grandes projeções da extremidade proximal do fêmur?", "Os trocânteres maior e menor.", "Eles funcionam como importantes alavancas e locais de inserção muscular."),
    card("fem-f-04", "Fácil", "Reconhecimento", "Qual estrutura da extremidade distal do fêmur articula-se com a patela?", "A face patelar.", "Ela está localizada anteriormente entre os côndilos."),
    card("fem-m-01", "Médio", "Inserção muscular", "Qual crista posterior da diáfise femoral serve de ampla fixação muscular?", "A linha áspera.", "Ela recebe inserções de adutores e origens de porções dos vastos."),
    card("fem-m-02", "Médio", "Reconhecimento", "Onde se localiza a fossa intercondilar do fêmur?", "Na face posterior, entre os côndilos medial e lateral.", "Ela se relaciona com os ligamentos cruzados do joelho."),
    card("fem-m-03", "Médio", "Inserção muscular", "Qual músculo se insere principalmente na tuberosidade glútea do fêmur?", "O glúteo máximo.", "Parte de suas fibras também se insere no trato iliotibial."),
    card("fem-m-04", "Médio", "Ligamentos", "O que se fixa à fóvea da cabeça do fêmur?", "O ligamento da cabeça do fêmur.", "Esse ligamento pode conduzir um pequeno ramo arterial, mais relevante na infância."),
    card("fem-d-01", "Difícil", "Vascularização", "Qual vaso é a principal fonte do suprimento retinacular da cabeça femoral no adulto?", "A artéria circunflexa femoral medial.", "Seus ramos podem ser comprometidos em fraturas intracapsulares do colo do fêmur."),
    card("fem-d-02", "Difícil", "Trauma", "Por que uma fratura intracapsular do colo do fêmur pode causar necrose avascular?", "Porque pode interromper os vasos retinaculares que ascendem pelo colo até a cabeça femoral.", "O risco depende do padrão e do grau de desvio da fratura."),
    card("fem-d-03", "Difícil", "Biomecânica", "Como se denominam a diminuição e o aumento patológicos do ângulo colo-diáfise?", "Coxa vara para diminuição; coxa valga para aumento.", "Essas alterações modificam a transmissão de forças e a mecânica dos abdutores."),
    card("fem-d-04", "Difícil", "Exame funcional", "Que achado sugere insuficiência dos abdutores do quadril durante apoio unipodal?", "Sinal de Trendelenburg, com queda da pelve contralateral.", "Glúteos médio e mínimo estabilizam a pelve no lado de apoio.")
  ]),
  topic("vascularizacao-coracao", "Vascularização do Coração", "Sistema cardiovascular", ["coracao", "coração", "coronaria", "coronária", "vascularizacao", "vascularização"], [
    card("cor-f-01", "Fácil", "Origem arterial", "Onde se originam as artérias coronárias direita e esquerda?", "Nos seios aórticos, logo acima da valva aórtica.", "A coronária direita nasce do seio aórtico direito e a esquerda, do seio aórtico esquerdo."),
    card("cor-f-02", "Fácil", "Identificação", "Qual ramo percorre o sulco interventricular anterior?", "O ramo interventricular anterior da coronária esquerda.", "Ele também é conhecido clinicamente como descendente anterior."),
    card("cor-f-03", "Fácil", "Identificação", "Qual ramo da coronária esquerda percorre o sulco coronário em direção à face esquerda?", "O ramo circunflexo.", "Ele irriga principalmente territórios laterais e posteriores do ventrículo esquerdo, conforme a dominância."),
    card("cor-f-04", "Fácil", "Drenagem venosa", "Qual grande vaso venoso desemboca no átrio direito e recebe a maior parte das veias cardíacas?", "O seio coronário.", "Ele percorre a porção posterior do sulco coronário."),
    card("cor-m-01", "Médio", "Território arterial", "Quais estruturas são irrigadas pelos ramos septais do ramo interventricular anterior?", "Os dois terços anteriores do septo interventricular e partes do sistema de condução.", "A extensão do território explica repercussões de uma oclusão proximal."),
    card("cor-m-02", "Médio", "Dominância", "O que define a dominância coronariana?", "A artéria que origina o ramo interventricular posterior.", "Na maioria das pessoas, esse ramo provém da coronária direita."),
    card("cor-m-03", "Médio", "Nó sinoatrial", "De qual coronária se origina mais frequentemente o ramo do nó sinoatrial?", "Da artéria coronária direita, embora possa originar-se da circunflexa.", "A origem é variável e deve ser descrita probabilisticamente."),
    card("cor-m-04", "Médio", "Nó atrioventricular", "De qual vaso se origina mais frequentemente o ramo do nó atrioventricular?", "Da artéria dominante, geralmente a coronária direita, próximo à cruz do coração.", "A anatomia da dominância influencia o suprimento do sistema de condução."),
    card("cor-d-01", "Difícil", "Correlação clínica", "Qual território fica ameaçado por uma oclusão proximal do ramo interventricular anterior?", "Parede anterior do ventrículo esquerdo, ápice e grande parte do septo interventricular.", "A extensão anatómica torna essa oclusão potencialmente grave."),
    card("cor-d-02", "Difícil", "Circulação colateral", "Por que anastomoses coronarianas nem sempre evitam isquemia aguda?", "Porque costumam ser pequenas e podem não oferecer fluxo suficiente diante de oclusão súbita.", "Elas podem ganhar importância quando a obstrução progride lentamente."),
    card("cor-d-03", "Difícil", "Drenagem venosa", "Qual veia acompanha o ramo interventricular anterior e onde termina?", "A veia cardíaca magna; continua no sulco coronário e termina no seio coronário.", "O trajeto venoso acompanha parte do território da coronária esquerda."),
    card("cor-d-04", "Difícil", "Integração anatómica", "Como uma dominância esquerda altera o suprimento da face diafragmática do coração?", "O ramo interventricular posterior deriva da circunflexa, ampliando o território dependente da coronária esquerda.", "A dominância descreve a origem do ramo posterior, não o tamanho global de cada coronária.")
  ]),
  topic("pares-cranianos", "Pares Cranianos", "Neuroanatomia", ["pares cranianos", "par craniano", "nervo craniano", "cranianos"], [
    card("pc-f-01", "Fácil", "Função", "Qual par craniano conduz a visão?", "O nervo óptico, II par craniano.", "Ele transmite informação da retina ao encéfalo."),
    card("pc-f-02", "Fácil", "Função", "Qual par craniano inerva os músculos da expressão facial?", "O nervo facial, VII par craniano.", "Seu componente motor emerge do tronco encefálico e alcança a face pelo forame estilomastoideo."),
    card("pc-f-03", "Fácil", "Função", "Qual par craniano é responsável pela principal inervação motora da língua?", "O nervo hipoglosso, XII par craniano.", "A exceção é o palatoglosso, inervado pelo vago."),
    card("pc-f-04", "Fácil", "Função", "Qual par craniano fornece a principal sensibilidade somática da face?", "O nervo trigêmeo, V par craniano.", "Seus três ramos são oftálmico, maxilar e mandibular."),
    card("pc-m-01", "Médio", "Forames", "Por qual abertura craniana passam os nervos oculomotor, troclear, oftálmico e abducente?", "Pela fissura orbital superior.", "Os nervos III, IV, V1 e VI alcançam a órbita por essa fissura."),
    card("pc-m-02", "Médio", "Forames", "Quais pares cranianos atravessam o forame jugular?", "Glossofaríngeo, vago e acessório: IX, X e XI.", "A veia jugular interna também se inicia nessa região."),
    card("pc-m-03", "Médio", "Reflexos", "Quais nervos compõem as vias aferente e eferente do reflexo córneo-palpebral?", "Aferente: ramo oftálmico do trigêmeo, V1; eferente: nervo facial, VII.", "O fechamento palpebral depende do orbicular do olho."),
    card("pc-m-04", "Médio", "Reflexos", "Quais nervos formam as vias aferente e eferente do reflexo fotomotor?", "Aferente: nervo óptico, II; eferente: nervo oculomotor, III.", "A via parassimpática do III contrai o esfíncter da pupila."),
    card("pc-d-01", "Difícil", "Localização de lesão", "Ao protruir a língua, para que lado ela desvia em uma lesão periférica unilateral do hipoglosso?", "Para o lado da lesão.", "A ação não oposta do genioglosso contralateral empurra a língua para o lado fraco."),
    card("pc-d-02", "Difícil", "Localização de lesão", "Quais achados oculares são típicos de uma lesão completa do nervo oculomotor?", "Ptose, olho desviado inferolateralmente e possível midríase.", "A perda dos músculos inervados pelo III deixa sem oposição o reto lateral e o oblíquo superior."),
    card("pc-d-03", "Difícil", "Correlação clínica", "Por que uma lesão no forame jugular pode causar disfagia e disfonia?", "Porque pode comprometer os nervos IX e X, afetando sensibilidade faríngea e motricidade do palato, faringe e laringe.", "O nervo XI também pode ser atingido, acrescentando déficit de esternocleidomastoideo e trapézio."),
    card("pc-d-04", "Difícil", "Localização de lesão", "Qual déficit sugere lesão do nervo abducente?", "Incapacidade de abduzir o olho afetado, com diplopia horizontal.", "O nervo VI inerva o músculo reto lateral.")
  ])
];

export const FLASHCARD_DIFFICULTIES = ["Fácil", "Médio", "Difícil"];

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
    const candidates = [entry.title, ...entry.aliases].map(normalizeFlashcardText);
    return candidates.some((candidate) => (
      normalizedTerm.includes(candidate) || candidate.includes(normalizedTerm)
    ));
  }) || null;
}

export function selectCuratedFlashcards({ topic: searchTerm, difficulty = "Médio", count = 10 }) {
  const matchedTopic = findCuratedFlashcardTopic(searchTerm);
  if (!matchedTopic) return { matchedTopic: null, cards: [] };

  const cards = matchedTopic.cards
    .filter((entry) => entry.difficulty === difficulty)
    .slice(0, Math.max(0, Number(count) || 0))
    .map((entry) => ({
      ...entry,
      topic: matchedTopic.title,
      system: matchedTopic.system
    }));

  return { matchedTopic, cards };
}
