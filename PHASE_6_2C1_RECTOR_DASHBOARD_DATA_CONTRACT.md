# RECTOR DASHBOARD DATA CONTRACT (Fase 6.2C.1)
**Contrato de Dados do Dashboard Executivo da Reitoria**

Este documento estabelece o esquema estrutural de dados que alimentará a interface da Reitoria, convertendo a telemetria bruta dos alunos em inteligência de negócios institucional (B2B). Nenhum dado contábil SaaS real da Aeternum é exibido; o foco é puramente no ROI Acadêmico.

---

## 1. Executive Overview
| Nome Técnico | Tipo de Dado | Origem Provável | Demo UPE | Prioridade | Componente Visual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `total_students` | Integer | `users` (count per tenant) | Mockado | Alta | Big Number Card |
| `active_students` | Integer | `analytics_sessions` (distinct) | Mockado | Alta | Big Number Card |
| `total_professors` | Integer | `users` (where role=teacher) | Mockado | Média | Tabela Resumo |
| `total_courses` | Integer | `courses` (count) | Mockado | Baixa | Label em Gráfico |
| `total_study_hours` | Float | `analytics_events` (sum of duration) | Mockado | Altíssima | Big Number Card |
| `monthly_growth_percentage`| Float | Aggregation (current vs last month) | Mockado | Alta | Badge Verde ao lado do Total |

---

## 2. Academic Adoption
| Nome Técnico | Tipo de Dado | Origem Provável | Demo UPE | Prioridade | Componente Visual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `adoption_by_course` | Array(Object) | `users` JOIN `analytics_events` | Mockado | Média | Gráfico de Barras (BarChart) |
| `adoption_by_semester` | Array(Object) | `users` JOIN `analytics_events` | Mockado | Média | Gráfico de Linha (LineChart) |
| `adoption_by_professor` | Array(Object) | `classes` JOIN `analytics_events`| Mockado | Baixa | Tabela de Ranking |
| `monthly_active_users` | Integer | `analytics_sessions` (30 days) | Mockado | Alta | Gráfico de Área (AreaChart) |
| `weekly_active_users` | Integer | `analytics_sessions` (7 days) | Mockado | Média | Mini-Gráfico de Tendência (Sparkline) |

---

## 3. Anatomical Learning Intelligence
| Nome Técnico | Tipo de Dado | Origem Provável | Demo UPE | Prioridade | Componente Visual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `most_accessed_models` | Array(Object) | `analytics_events` (model_id sum) | Mockado | Alta | Lista com Thumbnails 3D |
| `most_difficult_structures`| Array(Object) | `quiz_results` (lowest accuracy) | Mockado | Altíssima | Tabela de Alerta (Warning Table) |
| `anatomical_heatmap_summary`| JSON | Aggregation (body parts accuracy)| Mockado | Altíssima | Esqueleto Termográfico (Heatmap Overlay)|
| `average_accuracy_by_model`| Float | `quiz_results` | Mockado | Média | Gráfico de Radar (RadarChart) |

---

## 4. Student Success
| Nome Técnico | Tipo de Dado | Origem Provável | Demo UPE | Prioridade | Componente Visual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `at_risk_students_count` | Integer | `users` (accuracy < x OR inactive) | Mockado | Alta | Card de Alerta Vermelho |
| `recovered_students_count` | Integer | Historização de Risco | Mockado | Altíssima | Card Verde de "Evadidos Salvos" |
| `average_score` | Float | `quiz_results` (global average) | Mockado | Média | Medidor Circular (Gauge Chart) |
| `low_engagement_students` | Integer | `analytics_events` (bottom 10%) | Mockado | Alta | Card Numérico Secundário |
| `score_vs_usage_correlation`| Array(Object) | `analytics_events` JOIN `quiz_results`| Mockado | Altíssima | Gráfico de Dispersão (ScatterPlot) |

---

## 5. Institutional ROI (O Trunfo da Reunião)
| Nome Técnico | Tipo de Dado | Origem Provável | Demo UPE | Prioridade | Componente Visual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `digital_study_hours` | Float | Cópia de `total_study_hours` | Mockado | Alta | Gráfico de Comparação |
| `estimated_lab_savings` | Currency | `digital_hours` * `cost_per_hour` | Mockado | Altíssima | Big Number Card de Economia (Verde) |
| `cadaveric_lab_reduction_estimate`| Float (%) | Fórmula empírica / Negócio | Mockado | Alta | Gauge Chart |
| `roi_percentage` | Float (%) | `(savings - license_cost) / license` | Mockado | Altíssima | Badge Verde de Super-Performance |
| `cost_per_active_student` | Currency | `contract_value` / `active_students`| Mockado | Média | Card Informativo Pequeno |

---

## Regras de Domínio Aplicadas
* Nenhum faturamento B2B da Aeternum é injetado no schema.
* Sem *Billing*, faturas ou histórico de pagamento do gateway.
* O foco é justificar valor pedagógico (`score_vs_usage_correlation`) e mitigação de custos físicos da faculdade (`estimated_lab_savings`).
