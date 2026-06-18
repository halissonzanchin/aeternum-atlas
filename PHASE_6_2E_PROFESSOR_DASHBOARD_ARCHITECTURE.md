# PROFESSOR DASHBOARD ARCHITECTURE (Fase 6.2E)
**Projeto de Microgestão Pedagógica e Didática Direcionada**

Diferente do Reitor (focado em finanças) e do Coordenador (focado em macro-gestão do currículo), o Professor atua na "frente de batalha". O Dashboard do Professor precisa ser uma ferramenta de ação rápida, focada nas suas turmas específicas e em como usar o 3D para salvar seus alunos da reprovação.

---

## 1. Teaching Overview
**Objetivo:** Uma leitura instantânea da carga horária e engajamento da própria disciplina do professor.

* **Turmas Ativas:** Ex: Turma A (Manhã) e Turma B (Noite).
* **Alunos Acompanhados:** O pool total de alunos sob a asa deste docente.
* **Simulados Aplicados:** Quantos quizzes ele gerou e disparou na plataforma.
* **Média Geral e Engajamento:** Termômetro indicando a saúde global de suas próprias turmas.

## 2. Class Performance
**Objetivo:** Comparação de turmas para calibrar o esforço didático.

* **Desempenho por Turma:** Turma A (85% de média) vs Turma B (60% de média).
* **Evolução Semanal:** Gráfico de linha mostrando se o uso do Atlas no fim de semana refletiu nas notas da segunda-feira.
* **Taxa de Conclusão:** "Quantos alunos terminaram o Simulado de Crânio?".
* **Acertos por Conteúdo:** A granularidade das notas (Osteo, Mio, Neuro).

## 3. Student Risk Monitor
**Objetivo:** Micro-gerenciamento de alunos individuais para evitar que virem um número na mesa do Coordenador.

* **Alunos em Risco Iminente:** Os que estão falhando agora.
* **Alunos sem Acesso Recente:** "Fantasmas" digitais.
* **Baixo Desempenho Isolado:** O aluno acessa muito, mas tira notas baixas (dificuldade de retenção).
* **Queda de Engajamento:** Aluno era bom, mas sumiu (problema externo / desmotivação).

## 4. Anatomical Difficulty Map
**Objetivo:** Definir o conteúdo da próxima aula prática/teórica com base em dados, e não em adivinhação.

* **Estruturas Mais Erradas:** "80% da Turma B errou o Forame Magno".
* **Modelos 3D Mais Estudados:** O que eles estão olhando por conta própria de madrugada.
* **Tópicos com Necessidade de Revisão:** Sugeridos automaticamente pela plataforma.
* **Sugestões de Aula de Reforço:** "Recomendamos que sua próxima aula utilize o modelo *Base do Crânio 3D* com foco nos nervos cranianos".

## 5. Teaching Actions
**Objetivo:** Prover os botões de controle para mudar a realidade vista nos dados.

* **Criar Simulado:** Disparar um quiz focado na deficiência detectada.
* **Criar Atividade:** Tarefas domiciliares.
* **Criar Trilha (Study Path):** Roteiros de visão 3D anatômica.
* **Abrir Modelo 3D:** Link direto (Deep link) para jogar a estrutura defeituosa no projetor da sala de aula.
* **Exportar Relatório:** Levar os dados para o conselho de classe.

---

## 6. CLASSIFICAÇÃO DE COMPONENTES VISUAIS

### 🔴 OBRIGATÓRIOS (Para o "Wow Factor" da Demo)
* **Anatomical Difficulty Map:** Mostra que o professor tem raio-x do cérebro da turma.
* **Student Risk Monitor (Nominal):** Mostra que a ferramenta individualiza o ensino.
* **Teaching Actions (Botões de Ação):** Prova que a ferramenta não é passiva.

### 🟡 DESEJÁVEIS
* Class Performance comparando "Turma da Manhã" vs "Turma da Noite".
* Gráfico de Evolução Semanal.

### 🟢 OPCIONAIS
* Lista exaustiva de notas de alunos (não vende a plataforma em 10 minutos).

---

## 7. ESTRATÉGIA PARA A DEMO UPE

**1. O que o professor precisa enxergar nos primeiros 30 segundos:**
Ele precisa ver, logo de cara, que *Turma A* está excelente, mas a *Turma B* precisa da ajuda dele. A resposta visual deve ser gritante, focando a atenção dele na Turma B.

**2. Qual métrica gera ação imediata:**
"O aluno Joãozinho acessou 0 horas na última semana e tirou nota 4". Isso gera compaixão e ação imediata do educador de intervir antes da prova final.

**3. Qual componente mostra maior valor pedagógico:**
A "Sugestão de Aula de Reforço" derivada do *Anatomical Difficulty Map*. A ideia de que o software poupa horas de planejamento pedagógico indicando: "Mestre, foca sua aula de amanhã na Artéria Basilar porque eles não entenderam".

**4. Como conectar o dashboard do professor ao coordenador:**
A narrativa flui: O Coordenador olha a macro e vê "Neuroanatomia em crise" (vermelha no heatmap dele). O Professor de Neuro acessa o dele, confirma que a Turma B causou o dado, localiza o Joãozinho e envia uma trilha de estudos corretiva, invertendo a matriz. O fluxo da informação é descendente e a ação reparadora é ascendente.

**5. Como encerrar a demonstração do professor:**
Encerrar a demonstração clicando no botão `Abrir Modelo 3D` direto de dentro de uma recomendação de dificuldade ("Plexo Braquial"), e a tela transitar suavemente do Dashboard de dados 2D para o *Viewer 3D Aeternum*, mostrando o modelo desmembrado, provando a integração entre Teoria (Dados) e Prática (Dissecação Digital).
