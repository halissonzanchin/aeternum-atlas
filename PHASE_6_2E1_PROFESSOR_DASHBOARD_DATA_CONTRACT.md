# PROFESSOR DASHBOARD DATA CONTRACT (Fase 6.2E.1)
**Contrato de Dados de Microgestão Pedagógica e Didática**

Este documento detalha as estruturas de dados necessárias para alimentar o Dashboard do Professor. O contrato impõe uma barreira rígida de RBAC (Role-Based Access Control), onde o professor visualiza puramente a telemetria gerada pelas turmas atribuídas à sua responsabilidade, ignorando métricas financeiras ou de departamentos alheios.

---

## 1. Teaching Overview
| Nome Técnico | Tipo de Dado | Origem Provável | Demo UPE | Prioridade | Componente Visual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `active_classes` | Integer | `classes` (onde teacher_id) | Mockado | Alta | Card Resumo Numérico |
| `monitored_students` | Integer | `users` vinculados às turmas | Mockado | Média | Card Resumo Numérico |
| `quizzes_created` | Integer | `quizzes` (onde author_id) | Mockado | Média | Tabela Resumo |
| `activities_created`| Integer | `activities` (onde author_id)| Mockado | Média | Tabela Resumo |
| `average_class_score`| Float (%) | `quiz_results` das turmas alvo | Mockado | Altíssima | Card Destacado (Score) |
| `average_engagement_rate`| Float (%) | Fórmula de Sessões Ativas | Mockado | Alta | Gráfico Radial Circular |

---

## 2. Class Performance
| Nome Técnico | Tipo de Dado | Origem Provável | Demo UPE | Prioridade | Componente Visual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `class_name` | String | `classes.name` | Mockado | Altíssima | Label (Eixo X Gráfico/Tabela) |
| `class_average_score`| Float (%) | `quiz_results` filtrado por turma| Mockado | Alta | Gráfico de Barras |
| `weekly_progress` | Float (%) | Delta semanal de acertos | Mockado | Alta | Mini-Gráfico de Tendência |
| `quiz_completion_rate`| Float (%) | Quizzes Respondidos / Criados | Mockado | Média | Barra de Progresso (Inline) |
| `anatomical_topic_accuracy`| Array(Obj) | Acertos fragmentados por tema| Mockado | Altíssima | Tabela Expandida |

---

## 3. Student Risk Monitor
| Nome Técnico | Tipo de Dado | Origem Provável | Demo UPE | Prioridade | Componente Visual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `at_risk_students_count`| Integer | Aggregation de risco composto | Mockado | Altíssima | Card Vermelho (Alerta) |
| `inactive_students_count`| Integer | `analytics_sessions` (>10d) | Mockado | Alta | Sub-card Numérico |
| `low_performance_students_count`| Integer | `quiz_results` (<50%) | Mockado | Alta | Sub-card Numérico |
| `engagement_drop_students_count`| Integer | Queda de acessos na semana | Mockado | Média | Ícone de Seta para Baixo |
| `risk_students_list` | Array(Obj) | `users` JOIN risco detalhado | Mockado | Altíssima | Tabela Nominal Interativa |

---

## 4. Anatomical Difficulty Map
| Nome Técnico | Tipo de Dado | Origem Provável | Demo UPE | Prioridade | Componente Visual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `anatomical_structure`| String | Log do Viewer 3D | Mockado | Altíssima | Nome na Matriz/Tabela |
| `difficulty_score` | Float | Taxa de erro / Tentativas | Mockado | Alta | Intensidade da Cor (Heatmap) |
| `average_accuracy` | Float (%) | `quiz_results` específico | Mockado | Alta | Label percentual |
| `affected_students_count`| Integer | Total de alunos errando o tema| Mockado | Média | Coluna Secundária |
| `recommended_review_action`| String | Motor de Sugestão IA | Mockado | Altíssima | Texto Destaque / Botão |

---

## 5. Teaching Actions
| Nome Técnico | Tipo de Dado | Origem Provável | Demo UPE | Prioridade | Componente Visual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `action_name` | String | Hardcoded no Frontend | Real | Alta | Título do Botão (Ex: Criar Simulado)|
| `action_type` | Enum | Criação, Exportação, Viewer | Real | Baixa | Ícone adjacente ao Botão |
| `destination_route`| String | Rotas de Navegação (React) | Real | Altíssima | Link (React Router) |
| `usage_frequency` | Integer | Analytics de Clique | Mockado | Opcional | Tag "Mais Usado" |
| `educational_impact`| String | Feedback Descritivo | Mockado | Média | Tooltip Educacional |

---

## Regras de Domínio Aplicadas
* O Escopo isola completamente dados de faturamento (`Billing` e `Revenue Engine` estão inacessíveis).
* O RBAC é estrito. A variável `classes` em `active_classes` pressupõe um filtro absoluto (WHERE `teacher_id` = User Auth ID), o professor nunca deve visualizar a `risk_students_list` de disciplinas de colegas.
