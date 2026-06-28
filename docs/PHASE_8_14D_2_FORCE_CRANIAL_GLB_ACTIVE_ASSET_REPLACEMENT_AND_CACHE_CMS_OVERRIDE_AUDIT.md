# FASE 8.14D.2 — FORCE CRANIAL GLB ACTIVE ASSET REPLACEMENT AND CACHE/CMS OVERRIDE AUDIT

## 1. Identificação do Problema
O Viewer estava aparentemente ignorando a configuração local do `modelLodManifest` e carregando o arquivo legado `cranial-encephalon-sagittal-section-color-web.glb`. 
A análise revelou duas causas raiz ocorrendo no `src/services/modelService.js`:
- O método `mapSupabaseModelToUIModel` não recuperava a propriedade `modelLodManifest` do mock local, resultando na devolução de um `modelLodManifest: undefined`.
- Na ausência do manifest, o `useViewerModel` fazia o fallback direto para o `modelUrl`.
- A função `normalizeViewerModelAsset` continha um override estrito que sobreescrevia qualquer URL legada da base de dados e forçava explicitamente a exibição do modelo `/models/native/cranial-encephalon-sagittal-section-color-web.glb`, descartando tentativas normais de exibição de outros formatos não registrados lá.

## 2. Estratégia Aplicada (Opção A)
Aplicamos a priorização recomendada (Opção A) garantindo que o `modelLodManifest` não se perca no processo de modelagem de UI a partir do Supabase:
- O método `mapSupabaseModelToUIModel` e `normalizeSupabaseModel` (legado) foram atualizados para recuperar e mesclar dinamicamente o `modelLodManifest` vindo de `findLocalModel(record.slug || record.id)`. Isso garante que as instâncias locais enriquecidas com manifests (o LOD complexo) sejam passadas com sucesso ao `AtlasViewer.jsx`.
- Modificou-se também o fallback estrito dentro de `normalizeViewerModelAsset`. Ao detectar um slug legado da anatomia cranial, em vez de forçar o apontamento para o `color-web.glb`, o sistema agora obriga de maneira hardcoded que ele faça fallback para `/models/native/cranial-encephalon-realityscan-balanced.glb`.
- Essas mudanças simultaneamente habilitam os *quality tiers* (performance vs balanced) e corrigem o fallback para uma experiência melhor.

## 3. Substituições e Remoções
- Foram modificadas as funções principais no `src/services/modelService.js` para gerir o override corretamente.
- Não removemos arquivos via `git rm` (como o `cranial-encephalon-sagittal-section-color-web.glb`) por precaução, documentando-os como legados por agora, caso existam dependências ocultas em componentes passivos não identificadas durante as buscas de regex (mantendo a segurança e estabilidade).
- O arquivo fonte bruto de 188 MB (D:\Aeternum Modelos 3D\...) nunca foi copiado nem comitado para a branch.

## 4. Testes e Validação
- **Viewer**: A rota do Viewer carregará a variante correspondente do manifest de LOD do RealityScan em resoluções altas (ou a balanced by default, através do LODManager). O override secundário de fallback assegura que a textura nova prevalecerá sempre, bloqueando reversões ao modelo cinza desbotado original.
- **Build**: O build finalizado com Sucesso (apenas com avisos de chunks grandes). Nenhuma quebra.

## 5. Decisão Final
READY_FOR_8_10C_FIRST_MARKER_DRAFTS_FOR_CRANIAL_MODEL
