# STUDENT DASHBOARD SKELETON ARCHITECTURE (Fase 6.2F.1)
**Design de Interface e Engenharia de Retenção do Aluno**

## 1. Mapeamento de Zonas Visuais (Student Workspace)

### 1.1 Student Home
* **Hero Section (Ação Primária):** "Continuar Dissecação: Plexo Braquial". Um *card* gigante chamando para a última atividade interrompida.
* **Mural de Autonomia:** "Trilhas em Destaque", geradas dinamicamente com base na semana letiva da faculdade.
* **Status Bar:** Nível de maestria atual (Ex: "Level 4 - Dissecador Avançado").

### 1.2 Meu Progresso (Painel de Métricas Pessoais)
* **Horas em Voo (WebGL):** Gráfico circular marcando horas de dissecação 3D acumuladas no semestre.
* **Taxa de Sobrevivência:** Média geral dos simulados.
* **Radar de Domínio:** Gráfico aranha cruzando as disciplinas (Neuroanatomia, Histologia, Embriologia).
* **Ranking Gamificado:** "Você está no Top 15% da sua turma."

### 1.3 Alvo Tático (Estruturas Críticas)
* Fila de Polígonos de Risco. Mostra um *ranking* pessoal invertido: *As 3 estruturas anatômicas onde o aluno mais errou.*
* Ação vinculada a cada item: botão de "Iniciar Intervenção 3D".

### 1.4 Biblioteca e Trilhas (O "Netflix" da Anatomia)
* **Playlists Anatômicas:** Em vez de listar modelos 3D aleatórios, eles são empacotados ("Tudo sobre o Sistema Ventricular", "Aulão de Nervos Cranianos").
* **Trending na Faculdade:** "Os modelos mais visualizados pela UPE nesta semana."

### 1.5 Caixa de Comunicação Acadêmica (Push Didático)
* Notificações de Intervenção. Quando o Reitor/Professor gera um alerta (como visto na Fase 6.2E), o aluno recebe aqui: *"Prof. Mendes recomendou a Trilha de Revisão Óssea para você."*

## 2. A Mágica da Retenção: "Próximo Passo Inteligente"
A arquitetura abandona menus mortos. Todo fim de interação sugere a próxima:
1. Aluno termina Simulado tirando 30% em *Artérias Cerebrais*.
2. A tela final não mostra apenas "Nota: 30%".
3. A tela final exibe: **"Recomendação Urgente: Abrir Cena 3D das Artérias Cerebrais com Atlas AI."**
4. A jornada é circular e não tem becos sem saída.

---

## 3. Estratégia de Demonstração UPE (Efeito WOW)

**1. O que o aluno precisa enxergar nos primeiros 15 segundos?**
O "Botão de Ignição" (Resumo da última atividade 3D) e as Notificações de Tutoria do Professor. O reitor da UPE precisa ver que o aluno não está solto no sistema, mas sendo ativamente guiado.

**2. O que gera maior efeito WOW?**
A transição sem atrito entre um *Erro no Simulado* e a *Abertura Imediata do Modelo 3D Interativo* focado no exato osso/nervo que ele errou.

**3. O que deve ser mostrado antes do Viewer 3D?**
A justificativa de *por que* ele deve abrir o Viewer. Mostrar a ele a sua "Taxa de Falha de 65% em Base do Crânio" cria a dor; o Viewer 3D é o analgésico.

**4. Como integrar o Dashboard com a Biblioteca?**
Botões *Deep-Link*. Cada recomendação e cada alerta de professor é um link direto que renderiza o canvas WebGL com as coordenadas de câmera (X, Y, Z) já focadas na estrutura específica.

**5. Como integrar com futuros recursos Atlas AI?**
Na base do Dashboard haverá a "Atlas AI Companion Bar" (um input persistente de texto/voz). *"Dúvida no que estudar? Pergunte ao Atlas."*

**6. O que deve ser real na Demo?**
O layout responsivo do Dashboard, as animações de *hover* e a fluidez do roteamento React. A transição visual para o painel WebGL deve ocorrer sem recarregar a página (Single Page Application).

**7. O que pode ser simulado (Mock Layer)?**
Todo o progresso individual. O aluno que demonstramos será fictício (Ex: "Lucas Almeida", o aluno em risco identificado na Fase 6.2E.2), para gerar uma conexão narrativa perfeita entre os dashboards da diretoria e do estudante.
