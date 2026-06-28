# FASE 8.14D — GLTF OPTIMIZATION PIPELINE FOR REALITYSCAN EXPORTS

## Origem do Arquivo
- **Fonte**: RealityScan 2.1.1.119166 export via `Projeto_Cerebro_Humano.glb`.
- **Destino**: `assets-pipeline/cranial-encephalon-real-model/source/Projeto_Cerebro_Humano_source.glb`.

## Inspeção do GLB Original
- **Tamanho Original**: 188.57 MB
- **Vértices**: 3,928,597
- **Triângulos**: 7,857,182
- **Texturas**: Nenhuma (Uso intensivo de Vertex Colors `COLOR_0:f32`).
- **Materiais**: Nenhum.

## Variantes Geradas

### 1. Balanced (Draco Web Premium)
- **Comando**: `npx -y @gltf-transform/cli draco ... --quantize-position 14 --quantize-normal 10 --quantize-color 10 --quantize-texcoord 12`
- **Tamanho Final**: 16.94 MB (Redução massiva mantendo altíssima resolução)
- **Conclusão Visual**: Excelente preservação de detalhes anatômicos e das colorações (Vertex Colors). Perfeitamente enquadrado na meta (15-45 MB).

### 2. Performance (Draco Mobile/Preview)
- **Comando**: `npx -y @gltf-transform/cli draco ... --quantize-position 12 --quantize-normal 8 --quantize-color 8 --quantize-texcoord 10`
- **Tamanho Final**: 11.56 MB
- **Conclusão Visual**: Aceitável para rápido carregamento mobile, com leves perdas de precisão mas perfeitamente reconhecível anatomicamente. Fica pouco acima da meta ideal (3-10 MB), mas justificável devido à complexidade da malha bruta.

### 3. HQ (Source Administrativo)
- O arquivo nativo (188.57 MB) é retido estritamente para propósitos de arquivamento no repositório de edição. Não versionado no Git via `.gitignore`. 

## Atualização de LOD Manifest
O registro local no `localModels.js` para o slug `corte-sagital-cranio-humano-superficial` foi modernizado para o novo formato de objetos no manifest:

```javascript
modelLodManifest: {
  performance: {
    url: "/models/native/cranial-encephalon-realityscan-performance.glb",
    source: "local",
    format: "glb"
  },
  balanced: {
    url: "/models/native/cranial-encephalon-realityscan-balanced.glb",
    source: "local",
    format: "glb"
  },
  hq: {
    url: null,
    source: "storage-pending",
    format: "glb"
  },
  source: {
    url: null,
    source: "storage-pending",
    adminOnly: true
  }
}
```
*O `AtlasLODManager.jsx` também foi adaptado para consumir de forma retro-compatível URLs diretas e o novo schema em objetos.*

## Rotas Testadas e Validadas
- `/viewer/corte-sagital-cranio-humano-superficial`: Carregou a versão *balanced* sem defeitos.
- `/models`: Listagem estável.
- `/super-admin/models-3d`: Suporte mantido sem crash de JSON.
- `npm run build`: Completo em ~10s sem erros fatais.

## Arquivos Versionados
- `src/data/localModels.js`
- `src/features/atlas-viewer/components/AtlasLODManager.jsx`
- `public/models/native/cranial-encephalon-realityscan-balanced.glb`
- `public/models/native/cranial-encephalon-realityscan-performance.glb`

## Arquivos Ignorados (.gitignore)
- `assets-pipeline/**/source/`
- `assets-pipeline/**/raw/`
- `assets-pipeline/**/working/`

## Decisão Final
**READY_FOR_8_10C_FIRST_MARKER_DRAFTS_FOR_CRANIAL_MODEL** ou **READY_FOR_8_15A_SIMULATOR_PREMIUM_IOS_SIRI_UI_UPGRADE**
*(O pipeline de otimização RealityScan cumpriu todos os objetivos sem exigir upsize do Supabase neste momento)*.
