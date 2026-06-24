# MIGRATION SEGURA DO CMS 3D NO SUPABASE (Fase 7.1G)
**Laudo do Draft de Migration (Não executada em Produção)**

## 1. Contexto e Proteção
Em conformidade rigorosa com os procedimentos de CI/CD estabelecidos pela FASE 7.1F, redigimos a Migration física contendo o esquema do CMS 3D e as políticas RLS para blindagem e versionamento do banco de dados, sem disparar as mudanças no ambiente ativo da Aeternum. Este rascunho de engenharia fica anexado para revisão futura e aplicação agendada.

## 2. Compatibilidade Sistêmica Alcançada
A migration foi lapidada com *type casting* explícito visando integração contínua sem quebrar a plataforma atual:
* O campo `created_by` converte `users(id)` mantendo o tipo original do sistema (`TEXT`), dispensando refatorações brutas.
* Todas as políticas de acesso e injeção do Row Level Security (`RLS`) utilizam subqueries na `public.users` via `users.id = auth.uid()::text`, permitindo que os papéis autênticos de autoridade (`admin`) sejam filtrados em tempo real na nuvem, sem dependências opacas ou sobreposição de *claims* arbitrárias.

## 3. Escopo do Script Gerado
Arquivo: `supabase/migrations/20260620000000_create_atlas_3d_cms.sql`

O script engloba os 4 pilares:
1. **Tabelas Proprietárias:** DDL para as recém auditadas `atlas_3d_models` e a *child table* de balística `atlas_3d_markers`. Ambas trazem `id UUID` autogerado via `gen_random_uuid()` para facilitar requisições indexadas no WebGL e JSONB para as malhas tridimensionais de eixos (*Position*, *Target*).
2. **Ativação Segura:** Ambas possuem RLS estritamente habilitados por padrão para conter o tráfego público e injeções acidentais na REST API aberta do Supabase.
3. **Escudo de Operações (RLS):** Total de 4 políticas protegendo as tabelas do PostgreSQL e 2 políticas protegendo o Supabase Storage contra abusos (como uploads discentes indevidos ou downloads de modelos com status `draft`).
4. **Bucket Setup:** `INSERT` automático sem sobrescrita (usando cláusula `ON CONFLICT DO NOTHING`) do contêiner físico global de armazenamento (`atlas-3d-models`), garantindo que o WebGL da interface seja suprido sem obstruções.

## 4. Próximos Passos (Critério de Continuação)
Nenhuma tabela antiga (como `models`) ou colunas de legado foram submetidas ao comando lógico `DROP` e a injeção ao banco principal foi paralisada conforme as ordens da corporação Aeternum. 
Esta entrega permite à corporação realizar o escrutínio e, quando decidir avançar, subir ao banco ativando perfeitamente a FASE 7.1E do frontend sem necessitar de ajustes no código fonte React, liberando o caminho imediato para as intersecções de machine learning e Inteligência Artificial no motor Atlas Native.
