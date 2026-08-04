# Diagnóstico do Fallback Local

**Ativação do Fallback**
O fallback é ativado em `src/services/modelService.js`, linha 334 (`mergeCatalogWithLocalModels`).
Ele ocorre sempre que um modelo presente em `src/data/localModels.js` não é retornado pela consulta ao Supabase.
Isso significa que o fallback ocorre **tanto em erros da consulta** (que retornam array vazio) quanto em **retornos vazios legítimos** (usuário sem modelos).

**Comportamento**
- Mistura banco e local? **Sim.** Se o banco retornar modelos, o `merge` adiciona os modelos locais que não causaram colisão de slug.
- Sobrescreve dados reais? **Não.** A função `mergeCatalogWithLocalModels` só adiciona o modelo local se a chave (slug) não estiver presente no Map populado pelos dados do Supabase. Porém, a função `applyOverrides` no nível de UI pode sobrescrever URIs pontuais.
- Modelos locais recebem status institucional? **Sim**. Em `localModels.js`, os modelos possuem a chave `level: "Institucional"`. Isso gera o texto "Disponível pela instituição" no ModelCard.
- De onde vem o número de modelos? Da length do array resultante do merge (3 modelos locais chumbados + os do banco).
- Acessos e progresso vêm de `accessCount: 0` e `progressPercent: 0` chumbados nos mocks, e não são atualizados no dashboard real se a rede falhar.
- Existe distinção demo/produção? **Não.** O fallback opera silenciosamente em produção se o Supabase falhar.
- Existe indicador visual de modo demo? **Não.** O usuário final não tem como diferenciar um dado real de um fallback silencioso inserido por falha, a menos que abra o Network Panel.

**Classificação do Fallback:**
`FALLBACK_ACTIVATED_BY_ERROR`
`FALLBACK_ACTIVATED_BY_EMPTY_RESULT`
`FALLBACK_MERGED_WITH_DATABASE`
`FALLBACK_SILENT_LOCAL`
