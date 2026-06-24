# FASE 5.6 — DEMO DATA GOVERNANCE & EXECUTIVE DATA LAYER

Esta fase reestruturou a governança de dados institucionais para a demonstração da UPE, substituindo um conjunto monolítico de dados visuais por uma verdadeira **Data Layer B2B SaaS**, preparada para escalabilidade e validação executiva.

## Relatório de Arquitetura

| Camada | Arquivo | Finalidade | Dados Criados | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Institucional** | `institutionalLayer.js` | Definir a hierarquia e as métricas absolutas da universidade. | Campus, Cursos, Roles, Contratos, e Totais Base. | **Concluído** |
| **Acadêmica** | `academicLayer.js` | Gerenciar séries temporais, progressão e análises pedagógicas. | Gerador de séries de 12, 24 e 36 meses (retenção, acesso, simulados). Saúde da Plataforma. | **Concluído** |
| **Financeira** | `financialLayer.js` | Gerenciar o modelo de negócios B2B e as métricas SaaS. | MRR (120k), ARR (1.4M), CAC, LTV, Churn simulado, ROI e Economia. | **Concluído** |
| **Executiva** | `executiveLayer.js` | Orquestrar Views específicas para cada perfil hierárquico. | `getSuperAdminView`, `getRectorView`, `getCoordinatorView`, `getProfessorView`, `getInvestorView`. | **Concluído** |
| **Integração** | `dataset.js` | Atuar como ponto central de retrocompatibilidade com componentes React atuais. | Importação das Layers e reconstrução do payload `buildDatasetDemoUpePayload`. | **Concluído** |

## Pontos de Destaque

1. **Fonte Única de Verdade (SSOT)**: Todos os painéis que demandam receita, horas de estudo, quantidade de alunos ou contratos de licença agora puxam dos mesmos objetos no `institutionalLayer.js` e `financialLayer.js`. Sem duplicações.
2. **Tempo Histórico Algorítmico**: A camada acadêmica pode simular progressões dinâmicas usando a função genérica de Time Series para criar oscilações naturais e percentuais de crescimento para demonstrações de longo prazo (1, 2 ou 3 anos).
3. **Métricas de Pitch**: Adicionados cálculos como LTV/CAC ratio e MRR break-down para visões voltadas a investidores comerciais (`getInvestorView`).

## Validação Técnica

- O comando `npm run build` confirmou a ausência de quebras de compilação ou de importações.
- As integrações com o Supabase (`isRealSource`) permanecem blindadas e isoladas da lógica do `demo_upe`.
- O modo produção e o Atlas Viewer permanecem operando sem interrupções.
