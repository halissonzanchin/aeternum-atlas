# Auditoria e Plano Técnico - Fase 3C (Simulados Persistidos e Analytics)

## 1. O que já é persistido hoje no Supabase?
Atualmente, apenas os **Simulados Anatômicos que foram criados explicitamente no Supabase** (`source === "supabase"`) persistem dados. 
Quando o aluno responde a esses simulados, o `anatomicalQuizService.js` faz as chamadas de `insert` nas tabelas `anatomical_quiz_attempts` e `anatomical_quiz_answers`.

## 2. O que ainda está restrito à memória/localStorage?
* **Todos os Simulados Teóricos:** O módulo `theoreticalQuizService.js` não possui integração alguma com o backend. O progresso, notas e seções (múltipla escolha, V/F, preenchimento, radar) são salvos exclusivamente no `localStorage` sob a chave `aeternum_theoretical_quiz_progress`.
* **Simulados Anatômicos Dinâmicos:** Quizzes gerados *on-the-fly* a partir das anotações do próprio modelo Sketchfab (`source === "model_annotations"`) caem no fallback de rede do service e são salvos apenas no `localStorage` em `aeternum_anatomical_quiz_attempts`.

## 3. O que falta para o registro pleno de Analytics?
Para um relatório institucional 360º de cada aluno, precisamos que o schema amarre corretamente todas as pontas do fluxo acadêmico:
* **Aluno:** O `user_id` já é coletado.
* **Turma:** A tabela de tentativas (`attempts`) precisa da coluna `class_id` opcional. Hoje ela só registra o aluno e a instituição, exigindo um `JOIN` demorado (`academic_class_students`) para cruzar a nota com a turma do professor.
* **Professor:** Pode ser inferido através da Turma (`academic_classes.teacher_id`).
* **Modelo:** O `model_id` já existe na tabela de tentativas anatômicas, mas precisa existir nas teóricas também.
* **Tempo, Nota e Percentual:** Já existem colunas (`duration_seconds`, `score`, `percentage`) na tabela de tentativas anatômicas; o mesmo formato deve ser replicado para a teórica.

## 4. O schema atual suporta relatórios acadêmicos?
* **Ranking:** Sim, é possível rankear a tabela de `attempts` por `score` ou `percentage` via `ORDER BY`.
* **Histórico:** Sim, mantendo um histórico cronológico através do `started_at` e `finished_at`.
* **Desempenho por Turma:** Funciona, mas de forma **indireta**. Precisaria fazer um JOIN triplo (`attempts` -> `users` -> `academic_class_students`). Adicionar `class_id` direto na tabela de `attempts` (desnormalização leve) faria o Analytics voar de forma muito mais performática.
* **Desempenho por Modelo:** Sim, amplamente suportado pela coluna `model_id` atrelada a cada tentativa.

## 5. Tabelas Adicionais e Migrations Necessárias
Para concluir a Fase 3C, o banco de dados Supabase precisará de expansões cirúrgicas:

**A. Expansão das Tabelas de Simulados Teóricos (Novas):**
Dado que o `theoreticalQuizService.js` possui um motor formidável com variados formatos (Múltipla Escolha, V/F, Matching, Short Answer), a persistência exige um espelhamento das tabelas anatômicas:
1. `theoretical_quizzes`
2. `theoretical_quiz_questions` (Com suporte a JSONB para guardar arrays de opções e respostas aceitas de variados tipos)
3. `theoretical_quiz_attempts`
4. `theoretical_quiz_answers`

**B. Ajuste de Analytics (Migration Tática):**
Adicionar a coluna `class_id` (`uuid references public.academic_classes(id)`) tanto em `anatomical_quiz_attempts` quanto nas novas tabelas teóricas, permitindo que as consultas analíticas de uma turma sejam processadas em milissegundos.

---

### Recomendação de Execução (Fase 3C):
1. Escrever e rodar a *migration* (se autorizada) para as tabelas `theoretical_*`.
2. Conectar os métodos do `theoreticalQuizService.js` (ex: `saveTheoreticalQuizProgress`) ao Supabase, preservando o modelo local de *fallback*.
3. Integrar os gráficos do *Institution Admin* e *Teacher Dashboard* para consumir essas notas permanentemente gravadas, consolidando o valor acadêmico SaaS da plataforma.
