# FASE 8.18B.3 — SKETCHFAB MODEL SOURCE REPLACEMENT

## Objetivo
Atualizar a vinculação Sketchfab de dois modelos anatômicos existentes na Aeternum Atlas: "Corte Sagital do Sistema Reprodutor Feminino" e "Coração Humano — Edição Morgue 3D", mantendo as regras rigorosas da governança "Sketchfab-first" implementadas anteriormente. Nenhuma permissão, slug interno ou funcionalidade educacional nativa (Tutor IA, Guia, Simulado) deveria ser quebrada ou apagada. O motor "Atlas Native" permanece oculto para os usuários comuns.

## Modelos Atualizados

1. **Corte Sagital do Sistema Reprodutor Feminino**
   - **Título Sketchfab:** Corte Sagital Sistema Reprodutor Femenino
   - **UID Aplicado:** `1c8dbfa7ba8846afa3b4ef058df36753`
   - **Embed URL:** `https://sketchfab.com/models/1c8dbfa7ba8846afa3b4ef058df36753/embed`
   - **Slug Interno:** Preservado (`sistema-reprodutor-feminino-sagital` / mapeado por constante).

2. **Coração Humano — Edição Morgue 3D**
   - **Título Sketchfab:** Coração Edição II - Morgue
   - **UID Aplicado:** `d527b406b0dc430e888d0d016c02528a`
   - **Embed URL:** `https://sketchfab.com/models/d527b406b0dc430e888d0d016c02528a/embed`
   - **Slug Interno:** Preservado (`coracao-humano-edicao-morgue-3d` / mapeado por constante).

## Resumo Técnico e Confirmação de Regras

* **Extração Direta (Sem HTML Embed Sujo):** Apenas os valores absolutos (`sketchfabUid`, `sketchfabEmbedUrl`, `sketchfabUrl`, `sketchfabTitle`, `author`) foram injetados no sistema sem quebrar o componente `SketchfabApiViewer.jsx`.
* **Governança Sketchfab-first:** Ambos os modelos tiveram a declaração `viewerType: "atlas-native"` transmutada globalmente e de forma fixa para `viewerType: "sketchfab"` no front-end, garantindo que usuários finais carreguem diretamente o player 3D Sketchfab (mesmo comportamento anterior validado em 8.18B.2R).
* **Campos Educacionais e Slugs Preservados:** Os objetos locais permaneceram íntegros no `src/data/localModels.js`. Os painéis (Guia, Simulado, Tutor IA) herdam perfeitamente a nova fonte, acionando o API listener via UUID. O Fallback/Default UID interno de coração (no componente) também foi atualizado p/ a v2.
* **Tutor IA:** Como o Tutor lê o `sketchfabUid` do modelo ativo via contexto educacional, ele já absorve organicamente os novos IDs sem hardcode adicional na store do chatbot.
* **Zero Migrations:** O Supabase permaneceu intocado. Nenhuma migration foi criada ou rodada.
* **Validação do Build:** O build ocorreu sem erros (1035 modules transformed em aprox. 8.8s).

## Arquivos Alterados (Seletivo)

- `src/data/localModels.js`
- `src/components/viewer/SketchfabApiViewer.jsx`

## Conclusão
FASE 8.18B.3 finalizada. As vinculações foram trocadas mantendo o ecossistema e a estabilidade visual/pedagógica 100% operacionais.
