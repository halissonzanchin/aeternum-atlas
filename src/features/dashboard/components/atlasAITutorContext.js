import { atlasAITutorMock } from "../../../demo/upe/aiMock";

const ROUTE_CONTEXTS = [
  {
    matches: (path) => path.startsWith("/atlas-viewer/"),
    structure: "Modelo Atlas 3D",
    question: "Oriente minha exploração deste modelo anatômico.",
    description: "O visualizador conecta geometria, marcadores e anotações em uma experiência de estudo espacial. Posso indicar uma sequência de exploração e esclarecer as relações apresentadas.",
    clinicalImportance: "Explorar o modelo por objetivos e relações anatômicas evita navegação aleatória e fortalece a memória espacial.",
    relatedStructures: ["Marcadores", "Camadas", "Anotações"],
    quickActions: ["Explicar modelo", "Criar sequência", "Revisar marcadores"]
  },
  {
    matches: (path) => path === "/models",
    structure: "Biblioteca de Modelos 3D",
    question: "Ajude-me a escolher o próximo modelo para estudar.",
    description: "A biblioteca reúne modelos anatômicos interativos organizados por sistema, região e objetivo de aprendizagem. Posso indicar a melhor opção a partir do seu histórico e das suas dificuldades.",
    clinicalImportance: "Alternar exploração tridimensional, identificação de marcos e revisão ativa melhora a retenção espacial e prepara o estudo para aplicações clínicas.",
    relatedStructures: ["Neuroanatomia", "Osteologia", "Sistema cardiovascular"],
    quickActions: ["Indicar modelo", "Montar revisão", "Ver dificuldades"]
  },
  {
    matches: (path) => path.startsWith("/models/"),
    structure: "Detalhes do Modelo 3D",
    question: "Resuma o objetivo deste modelo antes de iniciar a exploração.",
    description: "Este espaço reúne a descrição, os sistemas relacionados e os recursos disponíveis para o modelo selecionado. Posso transformar esses dados em um roteiro curto de exploração.",
    clinicalImportance: "Definir um objetivo antes de abrir o visualizador evita exploração passiva e direciona a atenção para relações anatômicas relevantes.",
    relatedStructures: ["Objetivos de estudo", "Marcos anatômicos", "Simulado prático"],
    quickActions: ["Criar roteiro", "Revisar pré-requisitos", "Abrir simulado"]
  },
  {
    matches: (path) => path === "/atlas" || path.startsWith("/atlas/"),
    structure: "Atlas Anatômico",
    question: "Oriente minha navegação por sistemas e regiões.",
    description: "O Atlas Anatômico conecta sistemas, regiões e estruturas em uma hierarquia de estudo. Posso localizar relações, sugerir uma sequência e explicar a nomenclatura apresentada.",
    clinicalImportance: "Navegar por relações anatômicas, e não apenas por nomes isolados, fortalece o raciocínio topográfico usado em exame físico, imagem e cirurgia.",
    relatedStructures: ["Sistemas", "Regiões", "Relações topográficas"],
    quickActions: ["Localizar estrutura", "Comparar sistemas", "Criar revisão"]
  },
  {
    matches: (path) => path === "/videos" || path.startsWith("/lessons"),
    structure: "Conteúdo Audiovisual",
    question: "Selecione uma aula adequada ao meu momento de estudo.",
    description: "Os conteúdos em vídeo complementam a exploração do atlas com explicações orientadas. Posso sugerir uma aula e converter os pontos principais em uma revisão ativa.",
    clinicalImportance: "Associar explicação visual a uma tarefa prática no atlas reduz a carga cognitiva e melhora a transferência do conteúdo.",
    relatedStructures: ["Aulas guiadas", "Demonstrações", "Revisão ativa"],
    quickActions: ["Indicar aula", "Gerar resumo", "Criar perguntas"]
  },
  {
    matches: (path) => path === "/courses" || path === "/classes",
    structure: "Cursos e Trilhas",
    question: "Qual trilha devo continuar agora?",
    description: "As trilhas organizam conteúdos, modelos e simulados em uma sequência progressiva. Posso priorizar o próximo passo com base em avanço, desempenho e tempo disponível.",
    clinicalImportance: "Uma sequência de estudo coerente diminui lacunas entre anatomia básica, correlação clínica e avaliação prática.",
    relatedStructures: ["Trilhas", "Progresso", "Avaliações"],
    quickActions: ["Continuar trilha", "Planejar sessão", "Revisar lacunas"]
  },
  {
    matches: (path) => path === "/history" || path === "/progress" || path === "/academic-reports",
    structure: "Desempenho Acadêmico",
    question: "Interprete meu histórico e indique a prioridade de revisão.",
    description: "Seu histórico registra sessões, acertos e estruturas estudadas. Posso transformar esses dados em prioridades claras e uma sequência objetiva de recuperação.",
    clinicalImportance: "Revisões guiadas por evidência concentram esforço nas estruturas com maior impacto e menor domínio.",
    relatedStructures: ["Tempo de estudo", "Taxa de acerto", "Foco crítico"],
    quickActions: ["Analisar desempenho", "Criar plano", "Revisar erros"]
  },
  {
    matches: (path) => path === "/favorites" || path === "/study-lists",
    structure: "Coleção de Estudo",
    question: "Organize meus itens salvos em uma revisão curta.",
    description: "Favoritos e listas mantêm modelos e conteúdos relevantes em uma coleção pessoal. Posso agrupá-los por sistema, dificuldade ou objetivo.",
    clinicalImportance: "Coleções pequenas e intencionais tornam a revisão mais rápida e evitam acúmulo de conteúdo sem prioridade.",
    relatedStructures: ["Favoritos", "Listas", "Revisões"],
    quickActions: ["Organizar coleção", "Criar sequência", "Remover redundâncias"]
  },
  {
    matches: (path) => path === "/quizzes" || path === "/review" || path === "/flashcards" || path === "/summaries",
    structure: "Revisão e Simulados",
    question: "Prepare uma atividade adequada ao meu nível atual.",
    description: "As ferramentas de revisão combinam recuperação ativa, questões e sínteses curtas. Posso escolher o formato mais eficiente para o objetivo desta sessão.",
    clinicalImportance: "Testar a recuperação antes de reler o conteúdo revela lacunas reais e aumenta a retenção de longo prazo.",
    relatedStructures: ["Flashcards", "Simulados", "Revisão rápida"],
    quickActions: ["Mini simulado", "Criar flashcards", "Revisar erros"]
  },
  {
    matches: (path) => path === "/profile" || path === "/settings",
    structure: "Preferências Acadêmicas",
    question: "Ajuste a plataforma ao meu ritmo e objetivo de estudo.",
    description: "As preferências organizam perfil, idioma e experiência de uso. Posso explicar cada ajuste e sugerir uma configuração adequada ao seu contexto.",
    clinicalImportance: "Uma interface previsível e ajustada ao usuário reduz distrações e preserva foco durante sessões longas de estudo.",
    relatedStructures: ["Perfil", "Idioma", "Acessibilidade"],
    quickActions: ["Revisar preferências", "Ajustar experiência", "Abrir ajuda"]
  },
  {
    matches: (path) => path.startsWith("/teacher") || path.startsWith("/professor"),
    structure: "Ambiente Docente",
    question: "Ajude-me a estruturar a próxima atividade da turma.",
    description: "O ambiente docente reúne modelos, aulas e dados de acompanhamento. Posso apoiar a seleção de recursos e a criação de uma sequência didática.",
    clinicalImportance: "Objetivos explícitos e recursos alinhados tornam a prática anatômica mais consistente entre diferentes turmas.",
    relatedStructures: ["Turmas", "Modelos", "Avaliações"],
    quickActions: ["Planejar atividade", "Selecionar modelo", "Analisar turma"]
  },
  {
    matches: (path) => path.startsWith("/admin") || path.startsWith("/super-admin") || path.startsWith("/institution"),
    structure: "Gestão da Plataforma",
    question: "Oriente a próxima ação administrativa com segurança.",
    description: "Este ambiente reúne configurações, conteúdos e indicadores institucionais. Posso contextualizar cada módulo e apontar dependências antes de uma alteração.",
    clinicalImportance: "Fluxos administrativos claros preservam a qualidade do conteúdo e reduzem mudanças acidentais que afetam estudantes e docentes.",
    relatedStructures: ["Conteúdo", "Usuários", "Indicadores"],
    quickActions: ["Explicar módulo", "Revisar impacto", "Abrir relatório"]
  }
];

export function getAtlasTutorContext(path = "/student/home") {
  const routeContext = ROUTE_CONTEXTS.find((item) => item.matches(path));
  if (!routeContext) {
    return {
      ...atlasAITutorMock,
      quickActions: ["Explicar contexto", "Criar revisão", "Próximo passo"]
    };
  }

  return {
    structure: routeContext.structure,
    question: routeContext.question,
    answer: {
      description: routeContext.description,
      clinicalImportance: routeContext.clinicalImportance,
      relatedStructures: routeContext.relatedStructures
    },
    quickActions: routeContext.quickActions
  };
}
