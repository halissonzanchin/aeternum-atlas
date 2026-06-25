# FASE 8.8D — AI TUTOR MARKER FOCUS AND STUDY PATHS

## 1. Arquitetura de Resolução de Marcadores
Para garantir que a IA não sofra *hallucinations* inventando estruturas que não estão no contexto anatômico da Aeternum, criei o módulo de inteligência local estrutural: `atlasAITutorMarkerResolver.js`. 
Este módulo é responsável por:
- Normalizar o `input` da LLM (removendo acentos, plurais simples e conectivos desnecessários).
- Computar um **Score de Confiança** varrendo o array de `viewerContext.markers`.
- Devolver não só um "*Exact Match*" (`confidence: high`), mas também alternativas de estruturas cadastradas (`confidence: medium`) caso a pergunta não seja exata.
- O Tutor agora pode detectar com precisão quando alguém diz *"focar cerebelo"* ou *"onde fica a hipófise"*, ativando a intent segura sem invenções.

## 2. Ações Guiadas (Focus Marker)
A Ação `FOCUS_MARKER` foi inteiramente habilitada no ecossistema e atua duplamente:
- A IA responde onde fica a estrutura com linguagem médica básica.
- Imediatamente, propõe o botão contextual **"▶ Focar Marcador"**. 
- Ao clicar, o `AtlasAIViewerPanel` se comunica com os controladores base do WebGL (`atlasViewerCommands`) para focar na estrutura. Como fallback, caso o visualizador não consiga voar de câmera perfeitamente, o painel avisa o aluno e ilumina os marcadores via o contexto estático para que não fiquem perdidos.

## 3. Gestão e Sequenciamento de Trilhas (Study Paths)
Criei o núcleo lógico `atlasAIStudyPaths.js`. Este módulo:
- Varre e filtra as bibliotecas do modelo corrente (no nosso caso: Sagital Superficial) isolando alvos lógicos como *Corpo Caloso*, *Quarto Ventrículo* ou *Hipófise*.
- Monta agrupamentos coerentes como "Neuroanatomia Mediana" ou "Visão Geral".
- O gerenciamento de estado ("Qual é o passo 1? Qual é o próximo?") foi alocado no front-end em um *hook state machine* leve e isolado (`activeStudyPath`, `currentStepIndex`) residente no próprio componente do chat (`AtlasAIViewerPanel.jsx`). Isso satisfaz estritamente a exigência de ser *State Local* sem salvar bancos sujos do Supabase nesta fase.

## 4. Atualização da IA Backend
No contexto despachado para a API Edge no Vercel (`api/ai-tutor.js`), além das intenções puras, nós passamos a elencar a lista nativa das novas ações `START_STUDY_PATH` e `NEXT_STUDY_STEP`. A heurística de local *fallback* em `atlasAITutorService` também sofreu os incrementos necessários para emular o sistema offline tranquilamente.

## 5. Limitações Críticas Registradas
- Como o foco real da câmera do Babylon/Three.js dependendo da malha GLB ainda pode não estar "API-ready" ou polido, o Action Handler de *Focus* adota comportamentos *soft*: em vez de bugar a câmera no mesh, ele delega ao Engine que tenta usar o `focusMarker` original. No caso de falha de colisão, ele foca no eixo principal ou acende a UI.
- Progresso Educacional não está sendo salvo; caso o aluno faça `F5`, a Trilha recomeça. (Para fases futuras no Dashboard).

## 6. Testes Manuais Documentados
O ambiente foi validado sob as heurísticas mandatórias ("mostre o cerebelo", "onde fica X", "como devo estudar", "iniciar trilha", "avançar"). Botões dinâmicos rendem precisamente nas posições devidas no balão da IA. Não há encavalamentos ou loops de re-render com o `useViewer()`.

## 7. Decisão Final Obrigatória
`READY_FOR_8_8E_AI_TUTOR_CLINICAL_REASONING_AND_QUIZ_COACH`
