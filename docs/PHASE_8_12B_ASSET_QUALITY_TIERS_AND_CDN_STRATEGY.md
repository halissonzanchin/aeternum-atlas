# PHASE 8.12B: ASSET QUALITY TIERS AND CDN STRATEGY

## Contexto e Auditoria Inicial
Dando continuidade ao upgrade fotorrealista (FASE 8.12A), era essencial definir a estratégia arquitetural de como os assets seriam distribuídos sem explodir a banda do Vercel e o peso do repositório no GitHub (limitado a 100 MB).

### Tabela de Assets e Matriz de Qualidade
A arquitetura consolidada via metadado `modelLodManifest` suporta 3 Tiers:

| Modelo | Performance | Balanced | HQ (Institucional) |
| :--- | :--- | :--- | :--- |
| **Crânio Humano** | `cranial-...-color-web.glb` (5 MB) | `cranial-...-balanced.glb` (15 MB) | Planejado para CDN |
| **Coração** | `heart-morgue-edition-hq.glb` (24 MB) | `heart-morgue-edition-hq.glb` (24 MB) | Planejado para CDN |
| **Reprodutor Fem.** | `female-reproductive-...-hq.glb` (25 MB) | `female-reproductive-...-hq.glb` (25 MB) | Planejado para CDN |

*Nota: Para o Coração e Reprodutor, utilizamos os assets atuais (~24 MB) tanto para Performance quanto Balanced, dado que o tamanho é seguro para a web.*

## Lógica do Quality Toggle & Fallback
O `AtlasLODManager` foi reescrito (na FASE 8.12A e complementado nesta) para suportar mapping direto, com fallback infalível:
1. Se o preset solicitado (ex: `clinical` / HQ) não estiver no manifesto local, o sistema detecta a ausência.
2. Em vez de quebrar ou dar tela branca, o motor silenciosamente faz o **fallback para o primeiro asset viável** (no caso, `performance`).
3. O `AtlasQualityToggle` no UI envia o evento normalmente, provendo a melhor experiência disponível no device sem crashs.

## Estratégia de CDN / Supabase Storage (Design)
Para abrigar os modelos **HQ** (acima de 100MB, como o crânio raw de 188MB), delineamos a seguinte estratégia de cloud a ser implementada na fase comercial:

**Bucket Recomendado:** `atlas-models`
```text
atlas-models/
  native/
    cranial/
      performance/ (cache-control agressivo)
      balanced/    (cache-control agressivo)
      hq/          (uso estrito para laboratório desktop)
```

**Opções de Disponibilidade:**
- **MVP Inicial:** Bucket **público** para facilitar a homologação via CDN sem complexidade de auth headers no loader 3D.
- **Produção/Comercial:** Bucket **privado** e geração de URLs assinadas (Signed URLs). O `modelService.js` buscaria as chaves de acesso curtas diretamente na Supabase Edge Function e injetaria no Three.js.

## Testes Realizados e Validados
- **Viewer**: O toggle entre qualidades não quebra os modelos.
- **Crânio**: Vertex Colors perfeitas no `balanced`.
- **Coração & Reprodutor**: Renderizam maravilhosamente com os PBR materials aprimorados.
- **Biblioteca (/models)**: Rota validada. Sem duplicações, UI premium responsiva funcional.
- **Build**: `npm run build` completou com êxito.

## Recomendação Final
A engine 3D fotorrealista e a gestão de qualidade dos LODs (Level of Detail) estão absolutas. O terreno está perfeito para, finalmente, iniciarmos a marcação anatômica do nosso carro-chefe (crânio).

**Decisão:**
**READY_FOR_8_10C_FIRST_MARKER_DRAFTS_FOR_CRANIAL_MODEL**
