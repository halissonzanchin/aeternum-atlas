# Fluxo de Dados do Catálogo

A cadeia de chamadas para listagem do catálogo de modelos 3D segue o seguinte fluxo estrutural:

| Etapa | Arquivo e linha | Entrada | Saída | Possível falha |
|---|---|---|---|---|
| Componente | `src/pages/models/Models.jsx:68` | `user` | Listagem de models | Erros mascarados se o serviço retornar mock silenciosamente |
| Hook/Função | `useDashboardData` ou Direto | `user, options` | `models[]` | Ausência de reload no erro |
| Service | `src/services/modelService.js:326` (`listModelsForUser`) | `user, options` | `finalModels[]` | Captura erro crítico genérico, mas engole erros de banco no `loadModelsQuery` |
| Consulta Supabase | `src/services/modelService.js:298` (`loadModelsQuery`) | `user, options` | `allModels[]` | `resOld.error` ou `resNew.error` é logado e ignorado, retornando `[]` no mapeamento |
| Fallback Local | `src/services/modelService.js:334` | `[]` (se erro) | `merged[]` | `mergeCatalogWithLocalModels` anexa os dados de `src/data/localModels.js` |
| Normalização | `src/services/modelService.js:335` | `merged[]` | `finalModels[]` | `applyOverrides` sobrescreve configurações |
| Filtro Institucional | `src/services/modelService.js:217` | `query` SQL | - | Bloqueio real via RLS ou query condition |
| Card Renderizado | `src/components/ModelCard` | `finalModels[i]` | JSX | Exibição da badge "Institucional" vinda do nível `level` chumbado no fallback local |

### Conclusão do Fluxo
O frontend propositalmente "engole" erros oriundos do `supabase.from('models_3d').select()` ou `atlas_models`. Quando `data` é nulo, o mapeamento `(resOld.data || []).map(...)` resulta em um array vazio.
Na sequência, a função `mergeCatalogWithLocalModels` identifica que o catálogo está vazio e insere os 3 modelos de `LOCAL_MODELS` (`corte-sagital-cranio-humano-superficial`, etc).
Esses modelos locais possuem o atributo `level: "Institucional"`, o que gera a falsa percepção no Dashboard e Catálogo de que são modelos reais fornecidos pela Instituição do usuário, mascarando o erro crítico de infraestrutura.
