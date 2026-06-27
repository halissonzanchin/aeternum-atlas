# RELATÓRIO: FASE 8.10B — NATIVE MARKER AUTHORING INFRASTRUCTURE FOR ATLAS VIEWER ENGINE

## 1. DIAGNÓSTICO DO SISTEMA ATUAL DE MARCADORES
Na auditoria inicial (`AtlasViewerContext.jsx`, `AtlasViewerShell.jsx`, `AtlasAnnotationMarkers.jsx`), constatamos que os marcadores são injetados externamente no contexto e renderizados de forma flutuante via `<Html>` do Drei. O sistema lida bem com coordenadas globais da malha 3D e o foco de câmera (`atlasViewerCommands.focusMarker`) está intacto.
Os 3 modelos nativos (Cranial, Reprodutor Feminino e Coração Morgue) encontram-se em um estado seguro (vazio), sem poluição visual.

## 2. INFRAESTRUTURA DE AUTORIA INJETADA

Criamos a infraestrutura para captar coordenadas (x,y,z) clicando diretamente no mesh tridimensional, isolada estritamente do aluno através do parâmetro `?authoring=1`.

### A. Novo Modo de Autoria (`isAuthoringMode`)
- Adicionado ao `AtlasViewerContext.jsx` extraindo do `window.location.search`. 
- Mantido no estado cliente (sem Supabase).
- Protege a execução para não interferir na aplicação se `?authoring=1` estiver ausente.

### B. Raycasting Customizado (`AtlasModelLoader.jsx`)
- Adicionamos a prop `onPointerDown` no `<primitive>` principal.
- Regra de captura: **`Shift + Clique`**.
- O clique no mesh só é capturado (e a navegação via orbit controls bloqueada via `stopPropagation`) se o `Shift` estiver pressionado e o autor estiver no modo correspondente.
- A intersecção levanta:
  - `point`: coordenada global tridimensional local do clique.
  - `normal`: a normal da face para possíveis cálculos vetoriais.
  - `cameraPosition`: salva a câmera no exato momento da captura, o que é excelente para montar `cameraTarget`.

### C. Interface Gráfica de Draft (`AtlasAuthoringPanel.jsx`)
- Painel flutuante ultra-premium construído para a equipe anatômica.
- Exibe o vetor exato capturado.
- Possui formulário estruturado para: Label, AnatomicalName, Category, Description, ClinicalNote, Difficulty.
- Gera marcadores `draft` e limpa o form estrategicamente.
- Conta com gerador de exportação JSON `handleExportJson()` no padrão 8.10B. 

### D. Renderizador Híbrido (`AtlasAnnotationMarkers.jsx`)
- Atualizamos para mapear tanto `annotations` reais (estado legado) quanto `draftMarkers` em tempo real.
- Marcadores temporários usam um esquema de cor verde brilhante, traces pontilhados e hover expandido com "DRAFT", facilitando a distinção visual sobre a peça anatômica.

## 3. FORMATO JSON BASE

```json
{
  "modelSlug": "corte-sagital-cranio-humano-superficial",
  "generatedAt": "ISO_DATE",
  "authoringVersion": "8.10B",
  "markers": [
    {
      "id": "draft_TIMESTAMP",
      "modelSlug": "corte-sagital-cranio-humano-superficial",
      "label": "1",
      "anatomicalName": "Estrutura",
      "category": "Osso",
      "description": "...",
      "clinicalNote": "...",
      "difficulty": "basic",
      "position": [x, y, z],
      "normal": [nx, ny, nz],
      "cameraTarget": [x, y, z],
      "cameraPosition": [cx, cy, cz],
      "status": "draft"
    }
  ]
}
```

## 4. LIMITAÇÕES CONHECIDAS
- O sistema vive temporariamente no estado do React, o que significa que o `Refresh` no browser irá zerar a lista não exportada. (Comportamento by-design para cumprir a regra No-Database).

## 5. VALIDAÇÃO DE BUILD E GIT
- `npm run build`: Sucesso sem erros de roteamento ou dependências. 
- Compatibilidade testada com sucesso nas rotas regulares (Onde a UI de autoria fica 100% invisível).

## DECISÃO FINAL
A FASE 8.10B foi concluída com louvor.
**READY_FOR_8_10C_FIRST_MARKER_DRAFTS_FOR_CRANIAL_MODEL**
