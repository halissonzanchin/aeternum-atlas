# IMPORT ARCHITECTURE DESIGN (Fase 4C.2B)
**Planejamento Arquitetural B2B: Motor de Importação Massiva de Alunos**

Este documento arquiteta o fluxo, a infraestrutura e a tolerância a falhas do futuro importador de planilhas da Aeternum Atlas, projetado para absorver grandes volumes de alunos lidando com a complexidade hierárquica das universidades.

---

## 1. FORMATOS E HIGIENIZAÇÃO DE ARQUIVOS

O motor importador (*Client-Side Engine*) será equipado para aceitar **CSV** (via `PapaParse`) e **XLSX** (via `SheetJS`).
* **UTF-8 Nativo:** O motor realizará o *BOM detection* para garantir que arquivos exportados via Excel do Windows ou Mac não quebrem acentuação ou cedilha.
* **Trim e Sanitização:** Todos os *headers* e valores de texto terão seus espaços laterais podados (`trim`) e forçados para *lowercase* em campos sensíveis (como Email) para evitar quebra de comparação.

---

## 2. O MODELO IDEAL DA PLANILHA (TEMPLATE B2B)

A universidade receberá um `.csv` modelo.
**Cabeçalhos:** `Campus`, `Curso`, `Semestre`, `Disciplina`, `Turma`, `Matrícula`, `Nome`, `Email`.

### **Campos Obrigatórios:**
1. `Nome` (Para cadastrar o usuário no painel).
2. `Email` (Chave única primária do aluno).
3. `Turma` (Entidade folha onde o aluno consumirá o 3D/Simulados).

### **Campos Opcionais (Preenchimento Flexível):**
* `Matrícula (RA)`
* `Campus`, `Curso`, `Semestre`, `Disciplina` (Se não informados, o sistema ignora e pendura a Turma como "Solta" ligada apenas à Instituição, garantindo retrocompatibilidade).

---

## 3. ESTRATÉGIA DE *FIND-OR-CREATE* (CASCATA AUTOMÁTICA)

Uma universidade não tem tempo de ir no painel criar os cursos um a um antes de importar. A estratégia do importador é de **Upsert Inteligente**. Para cada linha processada, o motor executa em cascata:

1. O *Campus* "Norte" existe nesta instituição? Não? **Cria-o.** Retorna o ID.
2. O *Curso* "Medicina" existe vinculado a este Campus? Não? **Cria-o.** Retorna o ID.
3. O *Semestre* "2026.1" existe? **Busca/Cria.**
4. A *Disciplina* "Anatomia I" existe neste Curso? **Busca/Cria.**
5. A *Turma* "Anatomia I - A" existe? **Busca/Cria e associa todas as 4 IDs acimas nela.**

*Tudo isso feito em memória cache (Map) durante o loop para evitar bombardeio infinito de requests ao Supabase!*

---

## 4. GESTÃO DE DUPLICIDADES E CONFLITOS

* **Mesmo E-mail / Aluno já existente:** Se `email` já existe na tabela global `users` da instituição, o sistema não cria um novo. Ele aproveita a UUID antiga e apenas cria a ponte na `academic_class_students`.
* **Mesmo aluno na mesma turma (Duplicate Row):** A ponte `academic_class_students` deve usar restrição (CONSTRAINT) no banco com `ON CONFLICT DO NOTHING`, garantindo que se a faculdade mandar a planilha de 2025 de novo junto com a de 2026, a de 2025 é ignorada sem gerar erro 500.

---

## 5. FLUXO DE EXECUÇÃO E TOLERÂNCIA

1. **Validação Frontend (Pre-flight):** O arquivo é lido no browser. A interface avisa: *"Achamos 500 linhas. 10 estão sem e-mail"*. Pede confirmação.
2. **Batch Upload:** As chamadas para criação da árvore (Cursos/Turmas) são feitas e cacheadas.
3. **Rollback Seguro:** Como as entidades acadêmicas são feitas primeiro, se o e-mail do aluno 300 falhar, a turma já foi criada. Não há "quebra fatal", os 299 alunos entraram e o painel emite o relatório: *"1 aluno falhou. Baixe o CSV do erro"*.

---

## 6. ESCALABILIDADE (B2C ATÉ ENTERPRISE)

* **Até 500 alunos (Cenário Imediato / Faculdades):**
  A API via Supabase JS em `Promise.all` ou lotes (chunks) de 50 é suficiente para resolver a operação em 3 a 5 segundos diretamente na aba do navegador.
* **Até 5.000 alunos (Cenário Médio / C.U.):**
  Necessita de fragmentação severa no Frontend. O processamento ocorrerá em blocos de 100 linhas enviadas para uma *Edge Function*, impedindo estouro de timeout do browser.
* **Até 50.000 alunos (Cenário Massivo / Rede Laureate):**
  FrontEnd envia a planilha crua para o Supabase Storage. O Storage aciona um Webhook que empurra o CSV para um Worker assíncrono (pg_cron/BullMQ). O coordenador fecha a aba. O sistema manda e-mail: *"Sua importação de 50.000 alunos finalizou."*

---

## CONCLUSÃO E AVALIAÇÃO

* **Risco Global do Design:** **Baixo**. A arquitetura por Upsert é imutável e defensiva.
* **Complexidade:** **Média-Alta**. A criação do mapeador em tempo real (Find-or-Create em cascata hierárquica) exige algoritmos de grafos / maps complexos no *Frontend* para evitar a exaustão de chamadas RPC no Supabase.
