# EXPORT USABILITY AUDIT (Fase 4C.1C)
**Auditoria de Usabilidade Acadêmica em Produção**

Este relatório avalia criticamente o valor institucional e a usabilidade real no "chão de fábrica" das universidades para os recém-criados arquivos de exportação CSV da plataforma Aeternum Atlas.

---

## 1. EXPORTAÇÃO GRADEBOOK (Dashboard Pedagógico)

**Status de Qualidade:** 🔴 INSUFICIENTE / CRÍTICO

* **Colunas Exportadas:** Aluno (UUID truncado), User ID, Turma ("N/A"), Nota Média, Simulados, Tempo, Status.
* **Legibilidade para Excel (Professor):** Péssima. O professor não avalia UUIDs. Quando ele abrir o arquivo e vir `a8f9b2 (ID)`, ele não saberá se a nota pertence a "João Silva" ou "Maria Souza". Isso exige um cruzamento manual exaustivo que anula o ganho de produtividade da automação.
* **Legibilidade Moodle / Canvas / Blackboard:** Inutilizável. Os sistemas LMS (Learning Management Systems) exigem identificadores precisos para integração de notas (ex: `email`, `idnumber` (matrícula) ou `username`). O CSV atual gerará falha de sincronização.
* **Identificação de Turma:** Como o *payload* do serviço atual agrupa todas as tentativas da instituição sem agrupar o nome da turma (ex: "Anatomia Básica - Manhã"), o professor de múltiplas turmas não conseguirá dividir o arquivo.

---

## 2. EXPORTAÇÃO HEATMAP ANATÔMICO

**Status de Qualidade:** 🟢 ALTA QUALIDADE

* **Colunas:** Estrutura, Modelo, Acertos, Erros, Taxa de Erro.
* **Estrutura e Valor Pedagógico:** Excelente. Como os modelos 3D e as estruturas são entidades universais, o coordenador consegue facilmente ler o CSV, ordenar pela maior Taxa de Erro no Excel e imprimir para entregar à coordenação do curso de Fisioterapia, justificando uma revisão sobre "Artéria Aorta".

---

## 3. EXPORTAÇÃO ROI INSTITUCIONAL

**Status de Qualidade:** 🟡 ACEITÁVEL (RESUMO EXECUTIVO)

* **Clareza Institucional:** O arquivo CSV atual gera uma tabela exata de uma linha contendo as grandes métricas globais (Total de Horas, Visualizações, etc).
* **Usabilidade para Gestores:** É excelente para copiar e colar na prestação de contas mensal para a Reitoria (comprovando economia vs cadáver real). Contudo, no futuro B2B corporativo, o reitor desejaria ver isso diluído num CSV com 12 linhas (uma para cada mês), o que exige evoluções no backend. Para a versão 1.0, é satisfatório.

---

## 4. ANÁLISE DE LACUNAS E RISCOS (GAP ANALYSIS)

**A) O CSV atual é suficiente para uso real?**
Não. O arquivo do Gradebook no estado atual causará frustração pesada, pois terceiriza o problema da Aeternum (cruzamento de dados) para o Professor no Excel.

**B) Quais colunas estão faltando?**
* Nome Completo do Aluno
* E-mail do Aluno
* Número de Matrícula (R.A.)
* Nome da Turma (Ex: Turma A - 2026)

**C) Quais colunas são obrigatórias?**
Para qualquer uso acadêmico real: `Nome do Aluno` e `Email/Matrícula`.

**D) Quais colunas seriam desejáveis?**
* Data do Último Acesso.
* Nome do Curso.

**E) O formato permite integração com Moodle, Blackboard e Canvas?**
No momento, **não**. O padrão desses sistemas é rigoroso. Por exemplo, o Moodle pede um header `Email address`. Se adaptarmos nosso *header* para `Email` e garantirmos o envio deste dado, a integração CSV de notas passa a ser quase nativa.

**F) Existe risco de exportarmos dados insuficientes?**
O risco é enorme. Um MVP que exporta `N/A` em Turma e "UUID" em vez do nome do aluno passa uma percepção de "Software Beta" para uma universidade que está pagando alto por uma ferramenta Enterprise.

---

## 5. CONCLUSÃO DE USABILIDADE E RECOMENDAÇÃO

Auditoria concluída. A inteligência de *blob* e *CSV Engine* está 100% perfeita, porém o *Payload* de dados abastecido precisa ser refinado. O serviço `teacherDashboardService.js` deve ser melhorado para extrair o `name`, `email` e `academic_classes(name)` do Supabase durante sua execução.
