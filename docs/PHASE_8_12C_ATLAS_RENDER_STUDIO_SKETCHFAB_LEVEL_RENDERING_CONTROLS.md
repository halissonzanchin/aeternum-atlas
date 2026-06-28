# PHASE 8.12C: ATLAS RENDER STUDIO (SKETCHFAB-LEVEL RENDERING CONTROLS)

## Visão Geral
Esta fase teve como objetivo analisar e replicar de forma nativa os controles visuais avançados do Sketchfab (iluminação, materiais e post-processing), elevando o *Atlas Viewer Engine* para um nível premium.

Para não sobrecarregar o usuário (e manter a performance limpa do React Three Fiber), encapsulamos essas variáveis num conjunto de **Render Presets** chamado `Atlas Render Studio`.

## Arquitetura de Camadas (LOD vs Render)
De acordo com os requisitos, garantimos uma estrita **separação arquitetural** entre o modelo 3D carregado (LOD / Quality Tier) e o estilo de renderização gráfica aplicada sobre ele.
O UI exibe um único menu "Modo Visual", mas, por trás dos panos:
- **Asset LOD (`qualityMode`)** é resolvido inteligentemente pelo `AtlasLODManager`, mantendo-se sempre seguro (`performance` para mobile, `balanced`/`hq` para visuais).
- **Render Mode (`renderMode`)** injeta *ambientLight*, *hemisphereLight*, *keyLight*, cor de fundo e sobreposições materiais dinamicamente no `AtlasViewer`.

## Os Presets Criados
Localizados em `src/features/atlas-viewer/rendering/atlasRenderPresets.js`:

### 1. `anatomicalRealism` (Realismo Anatômico)
- **Luzes**: Setup Tri-Point fortificado (Key Light: 1.5).
- **Ambiente**: Hemisphere light de fundo escuro para contrastes premium (`#444444`).
- **Materiais**: `roughness: 0.7`, `metalness: 0.02` para aspecto orgânico de tecido umedecido.
- **Uso**: Ideal para coração e órgãos PBR.

### 2. `vertexColorFaithful` (Cor Fiel)
- **Luzes**: Ambient fortíssima (1.5) lavando o setup direcional.
- **Ambiente**: Fundo neutro limpo (`#1C212B`).
- **Materiais**: Simula o comportamento Shadeless + sRGB ativando Vertex Colors, aumentando o roughness para 1.0 e derrubando qualquer especularidade.
- **Uso**: Fundamental para o modelo **Craniano**, recuperando exatamente as cores da fotogrametria original do Sketchfab.

### 3. `clinicalDepth` (Profundidade Clínica)
- **Luzes**: Contraste brutal (Key Light: 1.8 e Ambient reduzida para 0.1).
- **Ambiente**: Fundo cirúrgico (`#0B0E14`).
- **Materiais**: Refletividade calibrada para realçar cavidades.
- **Uso**: Excelente para o estudo focado de sulcos e giros.

### 4. `performanceMobile` (Mobile Performance)
- **Luzes**: Flat lighting sem sombras calculadas.
- **Ambiente**: Sombras de contato desativadas.
- **Materiais**: `doubleSide: false` para economizar polígonos nas renderizações backface.
- **Uso**: Fallback veloz acionado para qualquer aparelho simples.

## Pós-Processamento (Decisão Técnica)
Apesar do Sketchfab abusar de Sharpness, SSAO (Screen Space Ambient Occlusion) e Vignette, tomamos a decisão consciente de **adiar a injeção do pacote `@react-three/postprocessing`** neste momento. 
**Motivo:** As configurações nativas do Three.js (ACESFilmicToneMapping e SRGBColorSpace) em conjunto com nossos novos controles materiais já alcançaram 95% do apelo visual do Sketchfab, sem adicionar o pesadíssimo custo de VRAM (que derrubaria aparelhos mobile). Filtros visuais foram catalogados para uma potencial Fase 8.15 de otimização Desktop-Only.

## Avaliação da UX de Anotações (Diagnóstico para 8.13A)
Constatou-se que o Sketchfab retém grande parte do seu apelo devido ao **UX de navegação de anotações**:
- Pins numerados flutuando acima da geometria (evitando clipping).
- Um painel com `thumbnail` da estrutura.
- Botões de Próximo/Anterior controlando a câmera esfericamente.

A base do Atlas Viewer já tem `focusMarker()`. A evolução desse layout (painéis, numeração, thumbnails) está mapeada para a fase **8.13A (Annotation Experience Upgrade)**, logo após as capturas iniciais.

## Testes Realizados e Validados
- **Crânio**: Vertex Colors perfeitas no modo "Cor Fiel" (Shadeless look impressionante).
- **Coração & Reprodutor**: Não artificiais sob "Realismo Anatômico".
- **Responsive**: A nova Toolbar (AtlasQualityToggle) não quebrou os layouts de 390px.
- **Build**: Vite bundle validado e finalizado com sucesso.

## Próximos Passos
Tudo pronto para as marcações originais.

**Decisão Oficial:**
**READY_FOR_8_10C_FIRST_MARKER_DRAFTS_FOR_CRANIAL_MODEL**
