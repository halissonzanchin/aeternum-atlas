# ATLAS KNOWLEDGE GRAPH FOUNDATION (Fase 8.0A)
**Laudo de Arquitetura: Ontologia Anatômica e Painel Clínico**

## 1. Mapeamento Ontológico Isolado
Na Fase 8.0A, estabelecemos os alicerces de dados do Atlas AI. Dois pilares de mock foram fundados dentro de `src/features/atlas-knowledge-graph`:
* `anatomyEntities.mock.js`: Uma base densa contendo dicionários clínicos profundos (latim, histologia, embriologia, irrigação vascular, patologias) voltados, neste draft, ao **Sistema Reprodutor Feminino**.
* `anatomyRelations.mock.js`: O motor formador das arestas do grafo. É aqui que estabelecemos ligações diretas (ex: O *Uterus* é adjacente a *Fallopian Tube*, e recebe suprimento da *Uterine Artery*).

## 2. O Motor de Busca (Graph Service)
Criamos o `anatomyGraphService.js` para agir como um "cérebro" consultor. Ele extrai de forma performática a árvore genealógica de um determinado pino interativo (Marker 3D). Quando o pino espacial `marker-1` é focado no WebGL, o Graph Service cruza essa geometria 3D com a entidade semântica `uterus`, destrinchando suas patologias e vizinhança.

## 3. O Painel Clínico (Knowledge Panel)
A representação física deste grafo tomou forma através do novo componente `AnatomyKnowledgePanel.jsx`. Diferente dos cards primários simples (que mostram apenas um título de uma estrutura), este painel atua como uma ficha ontológica interativa. 
Seus dados englobam:
* **Vascularização**: Separada visualmente por estirpes Arteriais (Vermelho) e Venosas (Azul).
* **Conexões Anatômicas**: Varre recursivamente as `anatomyRelations` para mostrar as continuidades de tecido e proximidades espaciais.
* **Patologias Associadas**: Exibe *tags* de risco patológico (Ex: Miomatose, HPV, Endometriose) conectadas matematicamente a esse fragmento 3D.

## 4. Integração Segura e Passiva
Seguindo o protocolo rigoroso, o Painel Clínico foi emparelhado lado a lado com o `AtlasAIViewerPanel` na tela principal `ViewerPage.jsx`.
O acoplamento se dá apenas via inferência reativa (`activeMarkerId`), alimentado por *callback* a cada novo clique na estrutura. Se a cena ativa no Viewer for originária do motor legado do *Sketchfab*, a lógica previne re-renders desnecessários e omite os painéis de inteligência, preservando as funcionalidades correntes do Aeternum.

A infraestrutura semântica está operacional e compilou sem fricções estruturais no build local. A plataforma agora é capaz de transitar de uma "observação visual" para um "tutor ontológico".
