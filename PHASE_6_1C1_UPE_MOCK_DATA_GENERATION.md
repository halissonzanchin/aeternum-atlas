# UPE MOCK DATA GENERATION (Fase 6.1C.1)
**Camada Local de Ilusão de Dados**

## 1. Arquivos de Domínio Sintético
A pasta `src/demo/upe/` foi instanciada com sucesso com a arquitetura completa do ecossistema fictício da universidade:
* `index.js` (Root e Helper Environment Checker)
* `students.js`
* `professors.js`
* `classes.js`
* `courses.js`
* `engagement.js`
* `heatmaps.js`
* `quizzes.js`
* `roi.js`
* `alerts.js`

## 2. Conteúdo Gerado
* **Helper:** `isUpeDemoMode()` lê estritamente `VITE_DEMO_MODE`.
* **Alunos:** Função programática `generateUpeStudents()` gera instantaneamente 700 alunos (`upe-std-1` a `700`) balanceados entre estados (`active`, `atRisk`, `inactive`, `highPerformance`). Lista nominal `upeRiskStudentsList` instanciada.
* **Professores:** Lista de 15 docentes gerada estaticamente com `adoption` balanceada.
* **Turmas e Disciplinas:** 14 turmas de medicina (`Anatomia Humana I`, `Neuroanatomia`, etc.) criadas na lista.
* **Engajamento e ROI:** O "Coração do Reitor" está preparado (`14.000` horas de estudo, economia de R$ `250.000`, engajamento `76%`).
* **Heatmaps:** Variáveis das 7 zonas de dificuldade ("Base do Crânio" puxando os `42%` críticos).

## 3. Isolamento e Segurança
O código da Fase 6.1C.1 cumpre as diretrizes de governança tática:
* **Supabase:** Absolutamente inalterado.
* **Dashboards:** Não foram integrados ainda. A camada permanece autônoma até que os *imports* sejam solicitados na próxima fase.
* **Banco de Dados Real:** As informações vivem 100% no cliente em JavaScript plano local.

## 4. Validação de Build
O Vite interpretou perfeitamente as funções puras de JS (`✓ 212 modules transformed` em 3.27s). Nenhuma quebra de lint e zero *overhead* de peso, mantendo a performance excelente para apresentação web. O Git reflete apenas a inserção silenciosa da pasta `src/demo/`.
