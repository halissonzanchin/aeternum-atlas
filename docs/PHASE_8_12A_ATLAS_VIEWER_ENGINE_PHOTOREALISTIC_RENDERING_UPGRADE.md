# PHASE 8.12A: ATLAS VIEWER ENGINE PHOTOREALISTIC RENDERING UPGRADE

## Resumo da Fase
Esta fase teve como objetivo melhorar drasticamente a fidelidade visual do **Atlas Viewer Engine**, reduzindo o abismo gráfico entre a renderização nativa em WebGL/Three.js e a experiência anterior do Sketchfab. O foco foi nas cores lavadas do modelo craniano, materiais excessivamente reflexivos/plásticos, e uma iluminação flat que removia a sensação de profundidade e o aspecto anatômico fotorrealista.

## Diagnóstico da Diferença Visual (Sketchfab vs Atlas)
1. **Compressão**: O asset `cranial-encephalon-sagittal-section-color-web.glb` estava excessivamente decimado (para rodar muito bem em celulares antigos), perdendo detalhes texturais e anatômicos finos, o que achatava visualmente o cérebro.
2. **Iluminação**: O setup anterior dependia de luzes bidirecionais puramente brancas/azuladas, que, sem o auxílio de Ambient Occlusion no modelo cru, resultava num aspecto 2D (lavado) nas reentrâncias.
3. **Materiais**: A normalização dos materiais forçava um `roughness=0.85` e `metalness=0.05`, tornando as vertex colors artificiais (aspecto giz) e bloqueando o brilho orgânico (wetness) necessário para peças cadavéricas reais.

## Mudanças Implementadas

### 1. Novo Asset: Balanced Tier
- Geramos com sucesso o `cranial-encephalon-sagittal-section-balanced.glb` (15.47 MB).
- **Resultados**: 
  - Vertex Colors (`COLOR_0`) totalmente preservadas em 10-bits.
  - Posição das normais suavizadas em 14-bits.
  - Detalhe anatômico de altíssima definição preservado, mas compacto o suficiente para rodar tranquilamente na web (redução de 188 MB para 15 MB).
- **Quality Tiers Adicionados (localModels.js)**:
  - `performance`: Asset Web original (~5 MB).
  - `balanced`: Novo Asset Draco Suave (~15 MB).
  - `clinical`: Reservado para futuro HQ.

### 2. Upgrades no Renderer (AtlasViewer.jsx)
- `ACESFilmicToneMapping` e `SRGBColorSpace` mantidos (core fundamental para PBR fidedigno).
- **Iluminação Fotorrealista Anatômica**:
  - `AmbientLight` reduzida para 0.2 para forçar a criação de sombras reais e constraste.
  - `HemisphereLight` introduzida (`skyColor="#fff", groundColor="#444"` intensidade 0.4) para simular rebatimento global difuso de laboratório/estúdio clínico.
  - `Key Light` fortíssima e direcional (1.5) para realçar cristas, giros e sulcos cranianos/encefálicos.
  - `Fill` e `Rim Light` ajustadas para volume sem destruir contraste.
  - Introdução de **`ContactShadows`** sutis no chão do Canvas, para ancorar a gravidade do modelo e dar sensação premium.

### 3. Upgrades de Materiais Orgânicos (AtlasGLBLoader.jsx)
- `roughness` ajustado de `0.85` para `0.7` (o material reage melhor à Key Light dando aspecto de tecido/umidade realista de peça cadavérica).
- `metalness` de `0.05` para `0.02` (evita o indesejado reflexo prateado, focando na refração de tecidos orgânicos).
- Garantia de que meshes com `geometry.attributes.color` **sempre** terão `vertexColors = true` forçado pelo Loader, prevenindo que falhas de exportação tornem modelos cinzas.

## Testes Realizados
- **Crânio Humano**: Detalhes do córtex cerebral perfeitamente nítidos, com sombras cavitárias orgânicas preservando a coloração de tecido. 
- **Coração & Reprodutor**: Não quebraram. Beneficiaram-se das luzes ricas, ganhando mais sensação de profundidade e contraste. 
- **AtlasLODManager**: Agora transita graciosamente pelas chaves nominais (`performance`, `balanced`, `clinical`) sem quebrar, atrelado ao `AtlasQualityToggle`.
- **Performance**: O asset de 15 MB demorou pouquíssimos segundos (Draco decode) e roda liso. Celulares vão puxar o `web` por default.
- **Build**: Finalizado 100% perfeitamente.

## Riscos Remanescentes
- Dispositivos muito fracos ao trocarem para Balanced poderão sofrer um ligeiro pico no decoding Draco (porém o LOD fallback protege usuários no carregamento inicial).
- O HQ Tier foi planejado mas requer um provedor de Storage (Supabase/CDN) para não inchar o repositório Git acima de 100 MB. 

## Decisão Final
**READY_FOR_8_12B_ASSET_QUALITY_TIERS_AND_CDN_STRATEGY**
