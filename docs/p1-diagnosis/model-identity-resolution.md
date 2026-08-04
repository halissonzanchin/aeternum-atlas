# Resolução de Identidade: UUID vs Slug

**Fluxo de Identificador na URL:**
1. O router passa o `slug` extraído da URL (`/viewer/:slug`) para a página de Viewer.
2. `useViewerModel` chama o serviço usando este slug através do wrapper antigo: `getModelByIdForUser(id, user)`.
3. Em `src/services/modelService.js:544`, `getModelByIdForUser` dispara um *Deprecation Warning* e repassa para `resolveModelIdentity`.
4. `resolveModelIdentity` recebe o slug, normaliza-o, e invoca o Supabase tentando igualar por slug ou id.

**Problemas Sistêmicos (Duplicações e Falhas):**
- Como a tabela `atlas_models` procura UUID, mas o Viewer passa slug, o backend força uma query redundante que falha quando não encontra. A query cai no Fallback local.
- O Fallback devolve o Slug como UUID canônico daquele modelo (`identity.modelUuid = localFallback.id` se ele parecer um uuid, senão apenas um alerta). No caso dos 3 modelos locais, o `id` é igual ao `slug` (ex: `corte-sagital-cranio-humano-superficial` não é UUID).
- Com isso, o Viewer fica manipulando um objeto onde `model.id` = `corte-sagital-cranio...`.
- A telemetria e o progresso enviam esse `slug` gigantesco no lugar do UUID para a tabela `model_access_logs`. (Vide diagnóstico de logs que faremos a seguir).
- *Colisão de slug:* Sim, altíssima possibilidade, especialmente com modelos renomeados, resultando em falsos positivos no fallback local.

**Diagrama de Resolução de Slug:**
```text
URL slug (/viewer/cranio...)
→ ViewerPage extrai "cranio..."
→ getModelByIdForUser("cranio...") (Depreciado)
→ resolveModelIdentity("cranio...")
→ Supabase query slug falha por TLS ou ausência
→ Fallback local (localModels) busca id ou slug = "cranio..."
→ Retorna model.id = "cranio..." (Não é UUID)
→ Viewer consome "cranio..."
→ progressService envia "cranio..." como UUID para logs/favoritos
```
