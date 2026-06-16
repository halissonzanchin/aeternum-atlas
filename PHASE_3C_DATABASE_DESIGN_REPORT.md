# Relatório de Design de Banco de Dados - Fase 3C.1 (Simulados Teóricos e Analytics)

Este documento detalha o escopo da modelagem de dados desenhada para suportar a persistência completa dos Simulados Teóricos e o aprimoramento do Analytics Acadêmico da Aeternum Atlas.

---

## 1. Tabelas Propostas

Foram arquitetadas quatro novas tabelas para o ecossistema teórico, e um patch para a tabela anatômica:

* `theoretical_quizzes`: Armazena o cabeçalho do simulado teórico criado pelo professor/instituição, englobando as regras de tempo e vinculação curricular.
* `theoretical_quiz_questions`: Armazena as questões em si.
* `theoretical_quiz_attempts`: Registra o início e o fim da execução do aluno, consolidando o score final e as métricas principais.
* `theoretical_quiz_answers`: Guarda o fluxo exato das respostas de cada pino/questão que o aluno marcou, viabilizando auditoria e feedback do professor.

## 2. Colunas Estratégicas (Highlights)

* **Multi-tenant e Curricular:** Todas as tabelas master (`quizzes` e `attempts`) possuem `institution_id` e agora `class_id`. Isso permite um *join* direto e veloz nas telas do Professor Dashboard (ex: "Qual a média da Turma X no Simulado Y?").
* **JSONB para Flexibilidade Extrema:** A tabela `theoretical_quiz_questions` faz uso pesado de colunas `jsonb` (`options`, `correct_answer`, `accepted_answers`). Isso é mandatório, já que os testes teóricos misturam Múltipla Escolha, V/F, Matching Pairs e Resposta Curta. Uma única coluna relacional não daria conta sem quebrar.
* **Metadata Acadêmica:** Adicionadas colunas nativas de `justification`, `bibliographic_reference`, `difficulty_level` e `anatomical_tags` em cada questão, abrindo espaço para a expansão pedagógica.

## 3. Índices Propostos (Performance)

A criação da malha de relatórios em tempo real exige os seguintes índices (`CREATE INDEX`), já inclusos nos scripts:
* `class_id` nas tabelas `theoretical_quizzes`, `theoretical_quiz_attempts` e `anatomical_quiz_attempts` (O pulo do gato para o Analytics instantâneo).
* `user_id` em `theoretical_quiz_attempts`.
* `institution_id` para segurança RLS global.

## 4. Políticas RLS (Row Level Security)

Foram rascunhadas políticas de segurança básicas, mantendo o paradigma Supabase:
* **Aluno (`auth.uid()`):** Consegue realizar `SELECT` e `INSERT` em suas próprias tentativas (`theoretical_quiz_attempts`) e acessar as questões de sua Instituição.
* **Professor/Admin:** Podem ler as tentativas de todos os alunos pertencentes àquela Instituição/Turma (dependendo da validação final do JWT do Supabase Auth).

## 5. Riscos de Migration

* **Baixíssimo Risco Estrutural:** As 4 tabelas teóricas são completamente novas, ou seja, **Risco Zero** de corromper dados antigos, pois eles não existem.
* **Baixo Risco Analítico:** A adição da coluna `class_id` na tabela já existente `anatomical_quiz_attempts` possui uma instrução segura (`ADD COLUMN IF NOT EXISTS`), sem destruir os dados previamente preenchidos pelos testes anteriores.

## 6. Precisa de Ajuste Manual no Supabase?

**Possivelmente sim**, no que tange ao RLS e Roles. 
Se a infraestrutura Supabase da Aeternum Atlas depende das chaves `JWT Claims` (ex: `jwt()->>'institution_id'` ou custom claims injetados no Auth para definir quem é Professor), a sintaxe exata das policies precisará ser validada com as Custom Claims do projeto antes de rodar o SQL em Produção. Se a autorização for gerenciada no lado do Cliente (Service Role), as RLS podem ser simplificadas. No mais, as execuções de DDL (Criação de Tabelas) rodam de forma fluida pelo SQL Editor.
