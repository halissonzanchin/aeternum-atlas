# FASE 8.18B.5C — HOTFIX STUDY GUIDE AND CLINICAL CORRELATIONS PANEL REGRESSION

## Objetivo
Corrigir a regressão crítica causada pelas abas "Guia de Estudo" e "Correlações Clínicas" no painel educacional. O problema causava erro no React e impedia o carregamento da página inteira do visualizador de modelos (Viewer), exibindo a mensagem `ReferenceError: annotation is not defined`.

## Causa Raiz Encontrada
1. **Erro de Sintaxe no JSX (`annotation is not defined`)**: O componente auxiliar `ListTab`, responsável por renderizar a lista padrão do Guia de Estudo e Notas Clínicas, havia sido quebrado na injeção da numeração estética. Ele estava usando `{String(annotation.index + 1).padStart(2, "0")}` em um contexto onde apenas existia a variável `index` iterada pelo array (`items.map((item, index) => ...)`). Como `annotation` não existia no escopo de `ListTab`, ao tentar abrir a aba ou renderizá-la no fluxo condicional, o React crachava com tela vermelha.
2. **Duplicação de Lógica Condicional**: A aba Guia de Estudo estava apresentando exatamente o mesmo bloco JSX da aba "Marcações" se o modelo estivesse em `isSketchfabMode`, o que removia totalmente o recurso educacional do Guia de Estudo e exibia um clone da lista de marcadores.
3. **Falta de Blindagem nos Dados (Fallbacks)**: O painel tentava renderizar `map` diretamente de estruturas que poderiam estar indefinidas antes da carga assíncrona da API (ex: `structure.clinicalCorrelations`).

## Resolução

### 1. Blindagem de Fontes de Dados (EducationalPanel.jsx)
Foi injetada uma série de instâncias seguras no topo do componente:
```javascript
const safeStructure = structure || {};
const safeAnnotationsState = annotationsState || {};

const safeClinicalCorrelations = Array.isArray(safeStructure.clinicalCorrelations)
  ? safeStructure.clinicalCorrelations
  : Array.isArray(safeStructure.clinical_correlations)
    ? safeStructure.clinical_correlations
    : Array.isArray(safeStructure.correlations)
      ? safeStructure.correlations
      : [];

const safeStudyGuide = Array.isArray(safeStructure.studyGuide)
  ? safeStructure.studyGuide
  : Array.isArray(safeStructure.study_guide)
    ? safeStructure.study_guide
    : [];

const safeMarkers = Array.isArray(safeAnnotationsState.sketchfabAnnotations)
  ? safeAnnotationsState.sketchfabAnnotations
  : [];
```

### 2. Recuperação da Aba Guia de Estudo
O `Guia de Estudo` foi reestruturado para ser resiliente e escalável com base nos dados seguros.
- Caso haja **marcações reais 3D**, ele lista as marcações e os itens são clicáveis para focar no modelo 3D.
- Se não houver marcações, mas existir texto de `safeStudyGuide`, lista-se o texto da estrutura.
- Se não existir nada, o sistema invoca o estático padrão `studyGuide(model, t)` configurado nos helpers.
- Se mesmo o estático falhar, apresenta a tela vazia polida `"Guia de estudo em preparação para este modelo."`

### 3. Recuperação da Aba Correlações Clínicas
- Protegido com o `safeClinicalCorrelations`.
- Comportamento _fallback waterfall_: Se tiver correlações locais, exibe. Se tiver correlações vindas da API global (`academicClinicalNotes`), exibe.
- Estado Vazio: Renderização elegante e nativa `"Correlações clínicas em preparação para este modelo."` usando a própria `ListTab`.

### 4. Correção do Erro Runtime
No `ListTab`, `annotation.index` foi trocado seguramente por `index`, permitindo que os arrays iterem as listas novamente sem quebrar o Node tree.

### 5. Segurança Opcional nos Dados Injetados
O arquivo `anatomicalMarkerLabels.js` também foi fortificado para evitar lançamentos de erro ou acesso undefined:
```javascript
export function getEnrichedMarker(model, annotation, index) {
  if (!annotation) return null;
  if (!model) return annotation;
...
```

## Validação e Status
- **Build Completo**: NPM run build concluído com sucesso.
- **Visualizador Resiliente**: Rota `/viewer/corte-sagital-cranio-humano-superficial` abre, sem tela vermelha, e todas as 6 abas (Informação, Marcações, Simulado Teórico, Simulado Prático, Guia de Estudo, Correlações Clínicas) rendem corretamente seus componentes ou `EmptyStates` se não tiverem conteúdo.
- Nenhuma base de dados alterada.
- O Tutor IA não sofreu impacto e as Marcações anatômicas reais continuam seguras na interface.
