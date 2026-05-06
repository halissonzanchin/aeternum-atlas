export const mockPlans = [
  {
    id: "institution-active-student",
    name: "Licença institucional por aluno ativo",
    price: "R$ 50/aluno ativo",
    interval: "monthly",
    recommended: true,
    checkoutEnabled: false,
    benefits: [
      "Acesso completo aos modelos 3D",
      "Atlas anatômico, radiologia, vídeos e cursos",
      "Painel administrativo da faculdade",
      "Métricas de uso por aluno e por modelo",
      "Relatórios mensais para gestão acadêmica"
    ]
  },
  {
    id: "institution-registered-student",
    name: "Licença por aluno cadastrado",
    price: "Sob contrato",
    interval: "monthly",
    recommended: false,
    checkoutEnabled: false,
    benefits: [
      "Previsibilidade de cobrança",
      "Base completa de alunos inscritos",
      "Relatórios para direção acadêmica",
      "Suporte institucional"
    ]
  },
  {
    id: "institution-range",
    name: "Licença por faixa de alunos",
    price: "Sob consulta",
    interval: "custom",
    recommended: false,
    checkoutEnabled: false,
    benefits: [
      "Faixas customizadas por instituição",
      "Implantação orientada",
      "Gestão de turmas e coordenação",
      "Licenciamento de acervo acadêmico privado"
    ]
  }
];
