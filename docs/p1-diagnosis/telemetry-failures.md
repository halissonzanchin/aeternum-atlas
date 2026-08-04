# Falhas de Telemetria (Acessos e Eventos de Segurança)

**1. `model_access_logs`**
- **Fluxo:** `ModelViewer` chama `registerSupabaseModelAccess`, que delega para `logModelAccess.ts`.
- **Validador:** A função `normalizeModelId` exige um formato UUID (ou conversível a UUID via Sketchfab UID).
- **Problema:** O Viewer repassa o ID resolvido do fallback local, que é o slug (ex: `corte-sagital-cranio-humano-superficial`).
- **Falha:** A regex de UUID e Sketchfab rejeitam a string. A função retorna `null`, gerando `missingFields = ['model_id_uuid']`. A inserção é **abortada antes de chegar na rede**.
- **Evidência no Console:** `[model_access_logs] Log não enviado. Campos obrigatórios ausentes: model_id_uuid`

**2. `security_events`**
- **Fluxo:** Funções do guardião chamam `logSecurityEvent` em `securityEventService.js`.
- **Validador:** Usa a função interna `resolveModelId` baseada em `UUID_PATTERN`.
- **Problema:** Retorna `null` para os slugs. No entanto, o `insert` tenta submeter `model_id: null`.
- **Falha:** No Supabase, se `model_id` tiver constraint (FK ou NOT NULL), a rede estourará um erro. Mesmo se aceitar nulo, o log fica "órfão" sem vincular ao modelo acessado.
- **Evidência:** `model_id_raw` salva o slug em metadata local, mas o envio remoto manda `model_id: null`.

**Causa Raiz Comum:**
A ausência de UUIDs nos modelos de Fallback e o uso de Slugs no frontend colidem violentamente com os validadores defensivos (e constraints de banco de dados) que esperam UUID v4.
