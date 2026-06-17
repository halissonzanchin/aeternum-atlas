# UPE DEMO ENVIRONMENT ARCHITECTURE (Fase 6.1A)
**Engenharia de Encantamento Institucional B2B**

O objetivo primário deste documento não é tecnológico, mas psicológico. O *UPE Demo Environment* será desenhado para ser uma arma de conversão tática. O foco é fazer com que a reitoria da Universidad Privada del Este enxergue não um software, mas o *futuro digital do seu campus*.

---

## 1. DASHBOARD DA REITORIA (Executive Intelligence)
**Objetivo Comercial:** Comprovar ROI (Retorno sobre o Investimento) e controle global. A Reitoria não se importa com a origem de um nervo, importa-se com eficiência e custo.
* **KPIs de Topo (Big Numbers):**
  * **Adoção Global:** 700 Licenças Contratadas vs 685 Alunos Ativos (97% de Adoção).
  * **Volume Educacional:** +24.500 horas de dissecção 3D acumuladas no semestre.
  * **ROI Equivalente:** Comparativo abstrato mostrando que o uso digital economizou milhares de horas/cadáver no laboratório real.
* **Gráficos de Decisão:** Curva de engajamento mês a mês (provando que os alunos usam fora da sala de aula).

## 2. DASHBOARD DA COORDENAÇÃO (Gestão Pedagógica)
**Objetivo Comercial:** Demonstrar que o Coordenador tem um "Raio-X" da qualidade do curso.
* **Filtros Estratégicos:** Visão macro por Disciplina (Anatomia I, Neuroanatomia) e por Semestre.
* **Indicadores Críticos:**
  * Ranking de Desempenho (Turmas que estão rendendo mais vs Turmas defasadas).
  * *Pain Points* Anatômicos: "45% do curso de Medicina apresentou dificuldade profunda em 'Osteologia do Crânio'". Isso permite ao coordenador intervir no currículo antes do fim do ano.

## 3. DASHBOARD DO PROFESSOR (Gestão Tática)
**Objetivo Comercial:** Vender a ideia de que a plataforma poupa tempo e amplifica o poder do professor em sala.
* **Gatilhos Visuais:**
  * Alertas de Evasão/Risco: "3 alunos da sua turma não abrem o modelo há 15 dias."
  * Heatmap de Erros: O professor vê um mapa de calor anatômico da sua turma específica, sabendo exatamente qual estrutura precisa ser revisada na aula de amanhã.

## 4. BIBLIOTECA ANATÔMICA DEMONSTRATIVA (O Momento UAU)
**Apresentação:** Esta é a "Ferrari". A ordem de apresentação não pode ser aleatória.
1. **Sistema Esquelético (Crânio Completo):** Primeiro impacto. Mostra performance de renderização, rotação fluida e riqueza de texturas (Forames, fissuras).
2. **Sistema Nervoso / Cérebro:** Demonstra isolamento de camadas (descascar o córtex para chegar nos gânglios basais). Mostra que o software faz o que é impossível em um cadáver fixado.
3. **Músculos da Mastigação/Face:** Altíssimo valor prático para Odontologia e Medicina simultaneamente.

## 5. DADOS SIMULADOS (Seed Mock Data)
Para evitar a "síndrome de tela em branco", a base de dados nascerá com vida orgânica simulada:
* **Tenant:** Universidad Privada del Este (Campus Presidente Franco - Medicina).
* **Demografia:** 700 Alunos gerados. 15 Professores. 4 Disciplinas Básicas.
* **Massa Crítica de Uso:**
  * Distribuição normal de notas de simulados (Média 7.8, Desvio 1.2).
  * Pico de estudos fakes perto de uma "data de prova" simulada.

## 6. FLUXO COMERCIAL DA DEMONSTRAÇÃO (Pitch Sequence)
A orquestração da reunião deve seguir um arco narrativo de elevação:
1. **O Gatilho Visual (Professor/Aluno):** Abrir direto no 3D Viewer dissecando um crânio. É o "gancho" que acorda a sala. Nenhuma métrica importa se o produto for feio.
2. **A Perspectiva Tática (Coordenação):** Mudar para o Dashboard do Coordenador. Mostrar como o 3D virou dados. Mostrar o Heatmap de dificuldade da turma de Anatomia.
3. **O Golpe Final (Reitoria):** Abrir o Executive Dashboard. Mostrar adoção total de 97% e o volume massivo de horas estudadas. A mensagem é: *"Seus alunos amam e usam o produto em casa, justificando cada centavo do investimento"*.

## 7. COMPARATIVO COMPETITIVO (Sales Handling)
* **Vs Moodle/Blackboard:** Moodle é arquivo morto (PDFs estáticos). Aeternum é dissecção dinâmica em tempo real.
* **Vs Cadáver Fixo:** O cadáver acaba, resseca, estraga e não se recompõe. O 3D permite cometer erros infinitos e isolar nervos invisíveis a olho nu.
* **Vs Concorrentes 3D Básicos:** Concorrentes entregam o 3D puro. A Aeternum Atlas acopla o 3D a um *Learning Management System* de rastreio contínuo (Executive Intelligence).

---

## 8. PARECER EXECUTIVO OBRIGATÓRIO

**1. O que precisa existir obrigatoriamente na demonstração?**
O 3D Viewer funcionando com alta fluidez e os Dashboards populados com gráficos preenchidos (mesmo que com dados falsos). Um gráfico vazio destrói a demonstração comercial.

**2. O que pode ser simulado?**
A inteligência dos gráficos (Adoção, notas, tempo de estudo, heatmap anatômico de erros). O "Tutor IA" também pode ter sua interface simulada (Hardcoded) nesta fase, se o tempo for escasso, embora a API real traga muito mais impacto ao vivo.

**3. O que deve ser real?**
A experiência de interação do usuário. Login, isolamento por Tenant (logo da UPE no canto da tela), isolamento de estruturas 3D, expansão de hierarquia.

**4. O que ainda falta desenvolver?**
Absolutamente todas as visões executivas (Página de Reitoria, Coordenação e Professor atualizado) não existem no frontend. O banco de dados precisará de um Seed script massivo.

**5. Quais componentes possuem maior impacto comercial?**
1º O Viewer 3D fluindo sem travamentos (Valida o produto).
2º O Dashboard de ROI da Reitoria (Valida o dinheiro investido).

**6. Qual deve ser a próxima fase após a auditoria?**
**Fase 6.1B (Demo Mock Data Architecture).** Desenhar e executar o Seed Script do banco de dados criando os milhares de registros fantasma da UPE para dar vida imediata aos gráficos no frontend, antes mesmo de programar os componentes em React.
