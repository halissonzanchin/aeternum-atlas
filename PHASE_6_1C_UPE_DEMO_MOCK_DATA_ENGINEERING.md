# UPE DEMO MOCK DATA ENGINEERING (Fase 6.1C)
**Projeto de Arquitetura de Dados Sintéticos e Isolamento Comercial**

Para a Demonstração Institucional da Universidad Privada del Este (UPE), a plataforma precisa simular um semestre inteiro de uso de 700 alunos de medicina sem inflar o faturamento real da Aeternum Atlas ou contaminar as métricas de investidores no Supabase.

---

## 1. Estrutura da População Sintética (UPE)
* **Usuários:**
  * 1 Super Admin / Reitor (Visualização macro).
  * 1 Coordenador de Medicina.
  * 15 Professores fictícios (nomes regionais/contextualizados).
  * 700 Alunos (massa de dados gerada parametricamente).
* **Organização Acadêmica (14 Turmas):**
  * Anatomia Humana I, II, Neuroanatomia, Anatomia Topográfica, Embriologia e Histologia.
  * Distribuição: ~50 alunos por turma em múltiplos semestres.
* **Perfis de Engajamento:**
  * 85% Ativos e evoluindo.
  * 15% Em Risco (Baixo Desempenho, Queda de Engajamento, Inatividade).
  * "Alunos Recuperados" para provar o valor do Intervention Center.

## 2. Motor Analítico Sintético
* **Simulados:** Milhares de registros simulando acertos e erros progressivos. O aluno começa o semestre errando 60% e termina errando 20% (demonstrando evolução guiada pelo Atlas).
* **Heatmaps e Dificuldade:**
  * Foco de reprovação em: Base do Crânio, Plexo Braquial, Sistema Ventricular, Osso Temporal e Tronco Encefálico.
* **ROI Institucional (O "Coração" do Reitor):**
  * Geração de +14.000 horas digitais de estudo.
  * Equivalência matemática para Economia de Laboratório Físico (Peças cadavéricas, formol, manutenção).
  * Gráfico de "Correlação Uso vs Desempenho" (quem acessa mais o Atlas 3D tira notas maiores).

---

## 3. Resoluções Estratégicas (Perguntas Oficiais)

**1. Onde os dados mockados devem viver?**
* **Decisão:** Em uma **Camada de Serviço Local no Frontend (Mock Provider via JSON)**.
* **Motivo:** Injetar milhares de usuários e eventos sintéticos no Supabase de Produção destruiria a métrica global da empresa. Criar um projeto Supabase separado gera custos dobrados e manutenção de infra. Uma flag no frontend (`VITE_DEMO_MODE=upe`) que intercepta chamadas de API e devolve JSONs estáticos perfeitamente formatados é seguro, custa zero, e roda até offline na UPE.

**2. Como evitar contaminação do banco real?**
* Utilizando a arquitetura de **Mock Service Worker (MSW)** ou uma abstração no `apiService.js` do React. Quando `DEMO_MODE` estiver ativo, o aplicativo jamais realiza o *fetch* para o Supabase, resolvendo as *Promises* localmente com a árvore de dados da UPE. Risco zero de contaminação cruzada.

**3. Como limpar todos os dados da demo depois?**
* Se a abordagem for 100% *Frontend Local Mocks*, não há o que limpar no Supabase. O banco de dados estará imaculado. Apenas desativar a variável de ambiente (Environment Variable) ou remover a pasta `src/mocks` reverte a plataforma para o estado puro.

**4. Como manter a Demo UPE consistente até novembro?**
* Os JSONs de mock não devem usar datas absolutas (ex: `2026-05-10`), mas sim datas relativas (`hoje - 5 dias`, `hoje - 1 mês`). Isso garante que, quer a UPE abra o dashboard em junho ou novembro, os "15 alunos sem acesso nos últimos 7 dias" continuarão fazendo sentido temporal.

---

## 4. Veredito Arquitetural

A engenharia de dados da UPE deve ser construída na forma de um pacote de arquivos `.json` estruturados e injetados diretamente nas páginas via React Context ou Mock Provider. A separação é *Air-Gapped* (fisicamente impossível de poluir a produção).
