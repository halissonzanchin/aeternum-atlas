# STUDENT EXPERIENCE AUDIT (Fase 6.2F)
**Projeto de Arquitetura da Jornada do Aluno — Demo UPE**

## 1. Visão Arquitetural: O Aluno no Centro
Enquanto o Reitor, Coordenador e Professor visualizam *dados analíticos macro*, o Dashboard do Aluno (*Student Home*) é focado na **micropedagogia visual e autonomia**. O aluno precisa sentir que possui a mesa de dissecação mais avançada do mundo na palma da mão, conectada aos seus deveres curriculares.

### 1.1 Student Home
* **Métrica Principal:** "Horas de Dissecação Virtual" e "Progresso Semanal".
* **Atalho Rápido (Top Section):** Botão imenso "Retomar Último Estudo" (ex: *Coração Anatômico 3D*).
* **Painel de Autonomia:** "Simulados Pendentes" com prazo regressivo e "Trilhas Recomendadas" pela IA com base nas suas notas mais baixas.

### 1.2 Biblioteca 3D (A "Mesa Anatômica")
* **Catalogação Visual:** Categorizado por Sistemas (Osteologia, Miologia, Sistema Nervoso, Cardiovascular).
* **Foco Demo UPE:** Destacar as estruturas que a coordenação mapeou como "Dificuldade Crítica" (Base do Crânio, Tronco Encefálico).

### 1.3 Meu Progresso
* **Espelho do Risco:** Se o Professor vê o aluno como "Em Risco", o aluno vê essa zona vermelha traduzida como "Foco de Estudo: Alerta Anatômico".
* **Gametificação:** Gráfico aranha (Radar) mostrando o domínio (ex: Neuro 80%, Osteologia 40%).

### 1.4 Simulados & Trilhas
* **Feedback Imediato:** Ao errar uma pergunta no simulado ("Qual o trajeto da artéria vertebral?"), o sistema oferece um botão: *[Revisar na Cena 3D]*, abrindo o WebGL exatamente no polígono correspondente.
* As trilhas são "Playlists" de modelos 3D agrupados (ex: Trilha "Preparação para Prova Prática M3").

### 1.5 Atlas AI (Integração Futura)
* Um assistente persistente flutuante no canto. Capaz de realizar *Quiz Dinâmico* via voz/texto apontando diretamente para o polígono no Canvas 3D.

---

## 2. Resoluções Estratégicas para a Reunião UPE

**1. O que o aluno precisa enxergar nos primeiros 30 segundos?**
O modelo 3D de alta fidelidade como atalho primário. O impacto comercial não vem de ver planilhas de nota, mas de ver um cérebro 3D ultra-realista pronto para interação imediata, cercado por um ecossistema gamificado de "Trilhas de Estudo".

**2. Como mostrar autonomia de estudo?**
Recomendações algorítmicas. Em vez de uma lista estática, a interface deve exibir: *"Baseado no seu último erro em Neuroanatomia, recomendamos este modelo 3D isolado do Tronco Encefálico."*

**3. Como conectar Biblioteca 3D com Simulados?**
Bidirecionalidade. Ao terminar um simulado com nota 40% em Osteologia, o botão de fechar não leva à Home, mas sugere a *Cena 3D* dos Ossos do Crânio. Se ele está no visualizador 3D, um botão sugere: *"Testar conhecimento nesta estrutura?"*.

**4. Como conectar aluno com professor?**
O Professor envia um "Push Pedagógico". Na Home do Aluno aparece um alerta: *"Seu professor Dr. Roberto Mendes recomendou a revisão do Plexo Braquial."*

**5. Qual parte da experiência gera maior impacto na reunião?**
O **Loop de Recuperação**. Mostrar à mesa da UPE que um aluno com baixo desempenho é automaticamente abraçado pela plataforma com recomendações hiper-específicas de imersão 3D. O Reitor compra a resolução do problema da evasão.

**6. O que deve ser real na Demo?**
A navegação, o Viewer 3D WebGL (fluidez, rotação, zoom) e a interface responsiva.

**7. O que pode ser simulado?**
O histórico de acertos/erros nos quizzes passados, o tempo de estudo cumulativo, o Atlas AI (como wireframe) e a comunicação com o professor.

---

## 3. Requisitos para a Próxima Fase (Fase 6.2F.1)
Para tangibilizar a *Student Experience* estaticamente para a UPE, precisaremos codificar a casca JSX do Dashboard do Aluno, conectada a um novo arquivo em `src/demo/upe/studentMock.js` garantindo o mesmo *Air-Gap* do Supabase que os painéis institucionais.
