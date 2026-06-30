# FASE 8.18B.5A — HOTFIX EDUCATIONAL PANEL ANNOTATIONS STATE RUNTIME ERROR

## Causa Raiz Encontrada
O componente `EducationalPanel.jsx` foi refatorado na fase 8.18B.5 para consumir `annotationsState`, mas essa variável foi injetada no componente diretamente pelo escopo implícito ao invés de ser declarada como `prop`. Isso causou o erro `ReferenceError: annotationsState is not defined` no runtime. Além disso, quando o painel era montado sem as anotações estarem prontas, ocorria a quebra ao tentar acessar propriedades de objetos não definidos.

## Arquivos Alterados
- `src/features/viewer/components/EducationalPanel.jsx`

## Como o Estado foi Protegido
1. Adicionada a propriedade `annotationsState = {}` na declaração de parâmetros do componente `EducationalPanel`.
2. Criada uma variável `safeAnnotationsState = annotationsState || {}` para servir de fallback seguro.
3. Propriedades fundamentais foram protegidas:
   - `sketchfabAnnotations` usa `Array.isArray()` para garantir fallback de `[]`.
   - `activeSketchfabAnnotationIndex` usa `Number.isInteger()` com fallback de `-1`.
   - `sketchfabReady` foi envelopado com `Boolean()`.
   - `handleSketchfabAnnotationClick` verifica se `safeAnnotationsState.handleSketchfabAnnotationSelect` é função antes de chamá-la.

## Resultados da Validação
- **Build**: Vite build ocorreu sem erros em ~11.9 segundos (`1035 modules transformed`).
- **Comportamento 3D**: O modelo (`corte-sagital-cranio-humano-superficial`, `sistema-reprodutor-feminino-sagital`, etc) abre corretamente.
- **Painel Educacional**: O painel lateral e aba "Anotações" abrem, exibindo o estado de carregamento e as marcações, sem gerar a tela vermelha, mesmo em caso de atraso na rede para buscar as annotations na API.
- **Integrações e Persistências**: O Tutor IA, Simulado e as integrações Sketchfab permanecem operacionais, e nenhuma tabela de DB ou migration precisou ser tocada.
