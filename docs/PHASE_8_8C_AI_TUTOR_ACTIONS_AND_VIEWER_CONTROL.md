# FASE 8.8C — AI TUTOR ACTIONS AND VIEWER CONTROL

## 1. Módulo de Ações e Segurança (Whitelist)
Criei o núcleo `atlasAITutorActions.js` para agir como a única ponte autorizada entre as intenções da IA e os estados críticos do React (ViewerContext / atlasViewerCommands). 
O sistema baseia-se em uma "Whitelist" (Lista Branca) de constantes seguras, evitando assim que a LLM execute código ou scripts nocivos arbitrários. 
As ações criadas foram:
- `OPEN_GUIDE` (AutoExecute: true)
- `OPEN_MARKERS` (AutoExecute: true)
- `CLOSE_PANELS` (AutoExecute: true)
- `RESET_VIEW` (Requer Confirmação)
- `FOCUS_MARKER` (Requer Confirmação)
- `START_THEORETICAL_QUIZ` (Requer Confirmação)
- `START_PRACTICAL_QUIZ` (Requer Confirmação)
- `SHOW_STUDY_PATH` (Requer Confirmação)

## 2. Ações Automáticas vs Ações com Confirmação
Filtrei o que a IA pode executar invisivelmente versus o que exige que o usuário clique:
- **Ações Leves/Soft:** Abrir Guia, Abrir Marcadores e Fechar Painéis foram configurados como `autoExecute: true`. Quando a IA os invoca, o painel UI automaticamente aciona as transições de estado do contexto, criando a sensação mágica de "assistente ativo".
- **Ações Graves/Hard:** Manipulação de câmera ou encerramento de sessão de estudo para abrir Quiz exigem confirmação (`autoExecute: false`). O `AtlasAIViewerPanel` inteligentemente renderiza botões anexados aos balões de resposta da IA (ex: [▶ Resetar Visão]) para o aluno acionar por conta própria, mantendo a ergonomia médica rigorosa.

## 3. O "Payload de Intents" e a Comunicação com o Backend
O provedor de AI Serverless (`api/ai-tutor.js`) recebeu a injeção explícita no System Prompt sobre *quais ações ele pode disparar*. Atualizei a formatação para retornar um JSON rigoroso contendo `text`, `action` e `payload`.
Paralelo a isso, configurei o *Fallback* da API local heurística para que também construa as mensagens usando essa formatação `{text, action, payload}`. Dessa forma, as intenções primitivas locais ("feche o guia", "resetar visão", "focar cerebelo") geram as ações no visualizador idênticas às intenções de alto nível da OpenAI.

## 4. O Comportamento do Viewer
A integração conectou o AI diretamente ao *estado vital* da Aeternum Atlas:
- Ao receber `OPEN_GUIDE`, a função `viewerContext.setLeftOpen(true)` é chamada, ocultando automaticamente outras instâncias intrusas (como painel central de marcadores).
- Ao receber `RESET_VIEW` ou `FOCUS_MARKER`, o `executeTutorAction` faz a chamada ao Singleton estático de eventos do Atlas (`atlasViewerCommands`). A ponte WebGL interpreta e movimenta o modelo fluidamente sem causar "glitches" ou recarregamentos.

## 5. Arquivos Afetados
- `src/features/atlas-viewer/ai/atlasAITutorActions.js` (NEW)
- `src/features/atlas-viewer/ai/atlasAITutorService.js` (MODIFIED)
- `src/features/atlas-viewer/ai/AtlasAIViewerPanel.jsx` (MODIFIED)
- `api/ai-tutor.js` (MODIFIED)

## 6. Validação e Testes
- Build via `npm run build` atestou total higidez do pacote.
- Validação heurística testada para intenções corriqueiras.
- Segurança garantida: não usamos `eval()` ou comandos dinâmicos, limitando restritamente o acesso do modelo ao DOM e a câmera através da Whitelist local imutável.

## 7. Decisão Final Obrigatória
`READY_FOR_8_8D_AI_TUTOR_MARKER_FOCUS_AND_STUDY_PATHS`
