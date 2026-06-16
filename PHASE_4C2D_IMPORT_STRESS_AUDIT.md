# IMPORT STRESS & INTEGRITY AUDIT (Fase 4C.2D)
**Auditoria de Estresse, Concorrência e Integridade de Dados**

Este relatório analisa o código do Importador CSV B2B (`academicImportService.js`) para atestar sua resiliência em ambiente de produção contra gargalos sistêmicos, vazamento de dados e falhas lógicas.

---

## 1. VALIDAÇÃO DOS CENÁRIOS DE TESTE

| Cenário | Resultado da Auditoria | Status | Observação |
| :--- | :--- | :--- | :--- |
| **1. 2 Alunos válidos** | Aprovado | 🟢 | Processamento limpo sem erros. |
| **2. Email duplicado na planilha** | Aprovado (bloqueado) | 🟢 | O `Set(seenEmails)` do validador bloqueia e joga a linha para `invalidRows`. |
| **3. Aluno já existente** | Aprovado | 🟢 | O `existingUsersMap` impede recriação e apenas realiza o *Link* com a turma. |
| **4. Turma já existente** | Aprovado | 🟢 | O `findOrCreate` acha pelo nome/ids e adiciona no cache local em memória. |
| **5. Curso já existente** | Aprovado | 🟢 | Idem à Turma. Não há replicação indesejada da estrutura. |
| **6. CSV com 500 alunos** | Aprovado com Ressalvas | 🟡 | O `cache` reduz 80% das requisições. Mas o *Link* faz 1 a 1. |
| **7. Erro em 1 linha isolada** | Aprovado | 🟢 | O `try...catch` por loop resgata o erro, marca no array de falhas e pula para a próxima iteração. Lote não abortado. |
| **8. 1 Aluno em 2 Turmas na Planilha** | **REPROVADO** | 🔴 | O validador trava na regra de "Email duplicado" (`seenEmails.has(email)`) cegamente, sem verificar se a turma é diferente. Ele aborta a 2ª matrícula do aluno. |

---

## 2. ANÁLISE DE SEGURANÇA E MULTI-TENANT

* **Isolamento Institution ID:** ✅ Seguro. A função `findOrCreate` amarra `{ institution_id: institutionId }` em todos os Selects e Inserts. É impossível que um curso "Medicina" do cliente A caia na base do cliente B.
* **Inserts sem filtro:** ✅ Protegido. Não há envio cru (*raw insert*).
* **Race Conditions (Concorrência):** 🟡 Médio. Se o Admin 1 e o Admin 2 da mesma faculdade apertarem "Importar" exatamente no mesmo segundo para um Curso novo, o `findOrCreate` assíncrono de ambos pode dar *miss* e resultar em 2 inserções de "Medicina". Solução ideal (Futura): Uso de `UNIQUE CONSTRAINT` no BD.

---

## 3. ANÁLISE DE PERFORMANCE E GARGALOS (N+1)

A estratégia de "Cache In-Memory" mitigou o massivo problema de N+1 queries. O curso, disciplina e turma são chamados do Supabase apenas 1 vez, não importa se há 500 alunos para eles.

No entanto, o Gargalo persiste no **Vínculo Aluno-Turma (`academic_class_students`)**:
* O script executa: `Select (checa se o link existe)` + `Insert (se não)`.
* Para 500 alunos, serão emitidas até 1.000 requisições HTTP REST sequenciais.
* **Risco para 500 alunos:** Baixo/Médio (O *loop* demorará cerca de 15 a 30 segundos, mas não quebra).
* **Risco para 5.000 alunos:** ALTO. A interface ficaria girando por 5 a 10 minutos. O navegador do cliente pode abortar a operação e a AWS/Supabase pode aplicar *Rate Limit*.

---

## 4. LAUDO EXECUTIVO E PRÓXIMOS PASSOS

* **Aprovado para produção?** 🔴 **NÃO**.
* **Risco atual:** Médio (Riscos não destrutivos de lentidão, mas destrutivos operacionalmente para o "Aluno em 2 Turmas").
* **Gargalos encontrados:** Execução de Inserts 1 a 1 de vínculo; Validação cega de e-mail sem cruzamento com a coluna turma.
* **Necessidade de Refatoração:** **SIM**.
* **Pode Commitar?** **NÃO**.

### Refatorações Recomendadas Imediatas (Antes do Commit):
1. No `academicImportService.js`, alterar o conjunto de verificação de duplicatas de `seenEmails.has(email)` para uma chave composta `seenKeys.has(email + turma)`, permitindo que Joãozinho faça Anatomia e Fisiologia na mesma planilha.
2. (Opcional) Refatorar a criação do Vínculo Aluno-Turma para juntar num *Array* `linksToInsert.push(...)` e executar uma única chamada `supabase.from('...').insert(linksToInsert)` após o loop, matando o gargalo das 1.000 requisições e baixando o tempo de importação de 30 segundos para < 1 segundo.
