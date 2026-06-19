# STUDENT DASHBOARD DATA CONTRACT (Fase 6.2F.2)
**Arquitetura de Dados: A Jornada de Lucas Almeida**

## Protagonista da Demo (Contexto Narrativo)
* **Aluno:** Lucas Almeida.
* **Diagnóstico Sistêmico:** Aluno sinalizado como "Risco Moderado" pelo Professor devido a múltiplas faltas e erro superior a 50% em Base do Crânio e Plexo Braquial.
* **Gatilho de Retenção:** O dashboard atuará como uma "UTI Pedagógica", oferecendo a ele um caminho hiper-personalizado de volta à excelência via imersão WebGL.

---

## 1. Student Home
* **`student_name`** (String): Origem: Auth Context. Demo: Mock ("Lucas Almeida"). Visual: Greeting Banner.
* **`course_name`** (String): Origem: Instituição. Demo: Mock ("Medicina"). Visual: Profile Header.
* **`semester`** (Number): Origem: Grade Curricular. Demo: Mock (3). Visual: Profile Header.
* **`current_progress_percentage`** (Number): Origem: Motor Quizzes. Demo: Mock (42%). Visual: Circular Progress Bar.
* **`last_3d_model_accessed`** (String): Origem: Telemetria WebGL. Demo: Mock ("Nervo Olfatório"). Visual: Hero Action Card.
* **`next_recommended_action`** (String): Origem: Atlas AI / Motor de Sugestão. Demo: Mock ("Continuar Dissecação"). Visual: Hero Button.
* **`last_activity_at`** (Date/String): Origem: Telemetria. Demo: Mock ("Hoje, 14:30"). Visual: Activity Log.

## 2. Meu Progresso
* **`total_study_hours`** (Number): Origem: Sessão WebGL. Demo: Mock (24). Visual: Estatísticas Pessoais.
* **`weekly_study_hours`** (Number): Origem: Sessão WebGL. Demo: Mock (1.5). Visual: Gráfico de Barras.
* **`completed_quizzes`** (Number): Origem: Supabase Quizzes. Demo: Mock (12). Visual: Estatísticas Pessoais.
* **`average_score`** (Number): Origem: Supabase Quizzes. Demo: Mock (58). Visual: Radar Chart.
* **`mastered_structures_count`** (Number): Origem: Supabase Quizzes. Demo: Mock (45). Visual: Painel de Conquistas.
* **`critical_structures_count`** (Number): Origem: Supabase Quizzes. Demo: Mock (3). Visual: Alerta de Atenção.
* **`weekly_progress_trend`** (String): Origem: Cálculo Analítico. Demo: Mock ("-5%"). Visual: Indicador de Tendência.

## 3. Estruturas Críticas
* **`structure_name`** (String): Origem: Ontologia Atlas. Demo: Mock ("Base do Crânio"). Visual: Tabela de Alerta.
* **`system`** (String): Origem: Ontologia Atlas. Demo: Mock ("Sistema Esquelético"). Visual: Tag Categoria.
* **`difficulty_score`** (Number): Origem: Histórico do Aluno. Demo: Mock (88). Visual: Barra de Risco.
* **`current_accuracy`** (Number): Origem: Quizzes do Aluno. Demo: Mock (30%). Visual: Badge Numérico.
* **`priority_level`** (String): Origem: Motor de Sugestão. Demo: Mock ("Urgente"). Visual: Cor do Card (Vermelho).
* **`recommended_model_id`** (String): Origem: Banco de Modelos 3D. Demo: Mock ("skull_base_01"). Visual: Hidden (Usado no roteamento).
* **`recommended_action`** (String): Origem: Motor de Sugestão. Demo: Mock ("Revisar Fóveas Articulares"). Visual: Botão de Ação Primária.

## 4. Biblioteca Recomendada
* **`model_id`** (String): Origem: Banco 3D. Demo: Mock ("brachial_plexus"). Visual: Link Roteamento.
* **`model_name`** (String): Origem: Banco 3D. Demo: Mock ("Plexo Braquial Completo"). Visual: Título do Card.
* **`anatomical_system`** (String): Origem: Banco 3D. Demo: Mock ("Sistema Nervoso Periférico"). Visual: Subtítulo.
* **`reason_for_recommendation`** (String): Origem: Algoritmo de Risco. Demo: Mock ("Baseado nos seus erros no Simulado 4"). Visual: Label Explicativo.
* **`priority`** (String): Origem: Algoritmo de Risco. Demo: Mock ("high"). Visual: Badge Icon.
* **`estimated_review_time`** (Number): Origem: Média Global. Demo: Mock (15 mins). Visual: Meta-data.
* **`route`** (String): Origem: Rotas Frontend. Demo: Mock ("/viewer?model=brachial_plexus"). Visual: Roteador.

## 5. Simulados
* **`quiz_id`** (String): Origem: Supabase. Demo: Mock ("q_104"). Visual: Hidden.
* **`quiz_name`** (String): Origem: Supabase. Demo: Mock ("Simulado: Inervação do Membro Superior"). Visual: Título da Linha.
* **`discipline`** (String): Origem: Supabase. Demo: Mock ("Neuroanatomia"). Visual: Tag.
* **`status`** (String): Origem: Supabase. Demo: Mock ("Pendente"). Visual: Status Badge.
* **`score`** (Number | null): Origem: Supabase. Demo: Mock (null). Visual: Texto Condicional.
* **`due_date`** (String): Origem: Professor. Demo: Mock ("Amanhã"). Visual: Prazo.
* **`recommended_after_model`** (String): Origem: IA. Demo: Mock ("Plexo Braquial"). Visual: Dica Didática.

## 6. Trilhas de Estudo
* **`pathway_id`** (String): Origem: Supabase. Demo: Mock ("path_neuro_01"). Visual: Hidden.
* **`pathway_name`** (String): Origem: Supabase. Demo: Mock ("Missão: Nervos Cranianos"). Visual: Título da Trilha.
* **`discipline`** (String): Origem: Supabase. Demo: Mock ("Neuroanatomia"). Visual: Categoria.
* **`progress_percentage`** (Number): Origem: Telemetria. Demo: Mock (25%). Visual: Barra de Progresso Circular.
* **`next_step`** (String): Origem: Motor Trilhas. Demo: Mock ("Visualizar Nervo Óptico"). Visual: Passo Atual.
* **`estimated_time`** (Number): Origem: Motor Trilhas. Demo: Mock (45 mins). Visual: Meta-data.
* **`difficulty_level`** (String): Origem: Ontologia. Demo: Mock ("Avançado"). Visual: Badge de Dificuldade.

## 7. Comunicação Acadêmica
* **`message_id`** (String): Origem: Supabase. Demo: Mock ("msg_881"). Visual: Hidden.
* **`sender_role`** (String): Origem: RBAC. Demo: Mock ("professor"). Visual: Ícone (Coruja/Livro).
* **`sender_name`** (String): Origem: Auth. Demo: Mock ("Dr. Roberto Mendes"). Visual: Remetente.
* **`message_type`** (String): Origem: Sistema. Demo: Mock ("Alerta de Risco"). Visual: Cor da Mensagem.
* **`message`** (String): Origem: Professor. Demo: Mock ("Lucas, notei sua dificuldade em Base do Crânio. Reforço a importância de acessar o modelo sugerido antes do próximo quiz."). Visual: Corpo de Texto.
* **`related_structure`** (String): Origem: Sistema. Demo: Mock ("Base do Crânio"). Visual: Tag Relacional.
* **`action_route`** (String): Origem: Sistema. Demo: Mock ("/viewer?model=skull_base"). Visual: Botão de Ação Rápida.
* **`created_at`** (String): Origem: Supabase. Demo: Mock ("Há 2 horas"). Visual: Timestamp.

## 8. Próximo Passo Inteligente (A Joia da Coroa)
* **`trigger_type`** (String): Origem: Motor de Eventos. Demo: Mock ("Baixa Nota em Simulado"). Visual: Justificativa Oculta.
* **`trigger_source`** (String): Origem: Analytics. Demo: Mock ("Simulado 4"). Visual: Contexto de Falha.
* **`detected_gap`** (String): Origem: Atlas AI. Demo: Mock ("Base do Crânio"). Visual: Alvo.
* **`recommended_sequence`** (Array): Origem: Atlas AI. Demo: Mock `["Revisar Cena 3D", "Fazer Quiz Express", "Ler Resumo"]`. Visual: Timeline Horizontal.
* **`first_action_label`** (String): Origem: Sistema. Demo: Mock ("Iniciar Imersão de Resgate"). Visual: Texto do Mega Botão.
* **`first_action_route`** (String): Origem: Sistema. Demo: Mock ("/viewer?model=skull_base&mode=guided"). Visual: Call to Action de Alta Conversão.
