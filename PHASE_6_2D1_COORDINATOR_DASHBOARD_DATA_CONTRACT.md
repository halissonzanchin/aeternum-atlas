# COORDINATOR DASHBOARD DATA CONTRACT (Fase 6.2D.1)
**Contrato de Dados de Inteligência Acadêmica e Intervenção Pedagógica**

Este documento detalha as estruturas de dados necessárias para alimentar o Dashboard do Coordenador. A ênfase é estritamente no desempenho das turmas, dos professores e na retenção cognitiva. Finanças e licenças foram isoladas da view.

---

## 1. Academic Health Overview
| Nome Técnico | Tipo de Dado | Origem Provável | Demo UPE | Prioridade | Componente Visual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `active_disciplines` | Integer | `courses` (where active) | Mockado | Alta | Card Resumo Numérico |
| `active_professors` | Integer | `users` (where role=teacher) | Mockado | Alta | Card Resumo Numérico |
| `active_students` | Integer | `analytics_sessions` | Mockado | Média | Card Resumo Numérico |
| `classes_at_risk` | Integer | Aggregation (avg_score < 6) | Mockado | Altíssima | Alerta Vermelho / Card Piscante |
| `average_approval_rate`| Float (%) | `quiz_results` global | Mockado | Alta | Gráfico Radial Circular (Gauge) |
| `average_engagement_rate`| Float (%) | Fórmula empírica interna | Mockado | Média | Card Secundário |

---

## 2. Curriculum Heatmap (Matriz Crítica)
| Nome Técnico | Tipo de Dado | Origem Provável | Demo UPE | Prioridade | Componente Visual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `discipline_name` | String | `courses.title` | Mockado | Altíssima | Linha Y da Tabela (Matriz) |
| `semester` | String / Int | `classes.semester` | Mockado | Baixa | Coluna X / Filtro |
| `difficulty_score` | Float | Média ponderada reversa | Mockado | Alta | Intensidade da Cor no Heatmap |
| `average_accuracy` | Float (%) | `quiz_results` por matéria | Mockado | Alta | Label interno da Matriz |
| `most_failed_structure`| String | `quiz_results.details` | Mockado | Altíssima | Tooltip ao passar o mouse |
| `affected_students_count`| Integer | Aggregation de Evasão | Mockado | Média | Tabela Estendida Lateral |
| `intervention_priority`| Enum (High, Med) | Calculado em tempo real | Mockado | Altíssima | Ícone de Cuidado (Triângulo Amarelo) |

---

## 3. Student Risk Center
| Nome Técnico | Tipo de Dado | Origem Provável | Demo UPE | Prioridade | Componente Visual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `at_risk_students_count` | Integer | Telemetria de Engajamento| Mockado | Altíssima | Card Vermelho Principal |
| `inactive_students_count`| Integer | `analytics` (>15 dias) | Mockado | Alta | Subtítulo do Alerta |
| `low_performance_students_count`| Integer | `quiz_results` (<40%) | Mockado | Alta | Gráfico de Rosca (Doughnut Chart) |
| `recovered_students_count`| Integer | Histórico de IA | Mockado | Média | Card de Sucesso (Verde) |
| `critical_students_list` | Array(Object)| `users` JOIN telecom | Mockado | Altíssima | Lista Dinâmica Expansível |

---

## 4. Faculty Performance
| Nome Técnico | Tipo de Dado | Origem Provável | Demo UPE | Prioridade | Componente Visual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `professor_name` | String | `users.name` | Mockado | Média | Tabela Nominal |
| `discipline_name` | String | `courses` | Mockado | Baixa | Coluna da Tabela |
| `classes_count` | Integer | Relacionamento Professor/Turma| Mockado | Baixa | Coluna da Tabela |
| `student_engagement_rate`| Float (%) | Log de Turma | Mockado | Alta | Gráfico de Barra Inline |
| `quiz_completion_rate`| Float (%) | `quiz_results` enviados | Mockado | Alta | Coluna da Tabela |
| `average_class_score` | Float (%) | Média Global da Turma | Mockado | Altíssima | Label Colorido (Rank) |
| `library_usage_rate` | Float | `analytics` (views/aluno) | Mockado | Baixa | Coluna Secundária |

---

## 5. Intervention Center (O Coração da Inteligência)
| Nome Técnico | Tipo de Dado | Origem Provável | Demo UPE | Prioridade | Componente Visual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `alert_id` | UUID/String | Gerado logicamente | Mockado | Baixa | Oculto (Internal Key) |
| `alert_type` | Enum | Falta, Nota Baixa, Evasão | Mockado | Alta | Ícone (Sino, Triângulo, Fogo) |
| `severity` | Enum(Critical, Warn)| Algoritmo Preditivo | Mockado | Altíssima | Cor da Linha (Vermelho/Laranja) |
| `target` | String | Turma ou Aluno X | Mockado | Alta | Título do Alerta |
| `recommended_action` | String | IA de Sugestão Educacional | Mockado | Altíssima | Texto Dinâmico de Sugestão |
| `affected_students` | Integer | Total atingido | Mockado | Média | Badge Numérico Lateral |
| `deadline` | Date | Prazo para ação | Mockado | Baixa | Label de Data Menor |
| `status` | Enum (Open, Resolved)| Status interno do alerta | Mockado | Média | Checkbox de Finalização |

---

## Regras de Domínio Aplicadas
* 100% de separação da Base Financeira. O Coordenador é o "médico do campus".
* O foco narrativo é a transição reativa ("aluno reprovou") para a preventiva ("`intervention_priority`: Turma vai reprovar se o professor não agir amanhã").
