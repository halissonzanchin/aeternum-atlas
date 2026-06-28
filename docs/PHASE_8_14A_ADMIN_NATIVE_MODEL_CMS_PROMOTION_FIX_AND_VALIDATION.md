# FASE 8.14A — ADMIN NATIVE MODEL CMS PROMOTION FIX AND VALIDATION

## Problema Original
A conta Super Admin exibia 3 modelos 3D locais (Crânio, Reprodutor Feminino e Coração) importados do `src/data/localModels.js`. Estes modelos apareciam como "Sem UUID (Órfão)". Ao tentar editá-los no Editor 3D, a ação era bloqueada pois a base relacional exige um UUID válido para os marcadores. Adicionalmente, ao clicar em "Salvar no CMS", a requisição para o Supabase falhava silenciosamente porque o sistema enviava a string textual (slug, como `coracao-edicao-morgue`) como ID (no lugar de um UUID real v4), impedindo a promoção do modelo para a nuvem.

## Causa Raiz
A função `handleSaveCMS` em `Admin3DModelsPage.jsx` verificava estritamente `if (selectedModelId === 'new')` para limpar o ID local e permitir que o banco gerasse um UUID. Como os modelos órfãos tinham o *slug* textual atrelado ao `id`, eles não eram interceptados por essa regra, de forma que o ID inválido seguia no *payload* e resultava em erro no banco de dados.

## Lógica Aplicada
O arquivo `src/features/admin-3d/Admin3DModelsPage.jsx` foi modificado.
Na função `handleSaveCMS`, a condição foi expandida para:
```javascript
if (selectedModelId === 'new' || (!selectedModelId.match(/^[0-9a-fA-F]{8}-/) && selectedModelId !== 'new'))
```
Isso assegura que qualquer modelo órfão terá seu ID destrutural (string) deletado antes do POST (`delete modelToSave.id`), garantindo que a base de dados (Supabase) atribua o UUID final.

## Riscos de Dados e Resolução
Graças à função de merge segura `mergeCatalogWithLocalModels` contida em `src/services/modelService.js`, uma vez que o modelo é salvo no CMS (recebendo um UUID), seu `slug` continua intacto. Durante o carregamento da lista, a rotina dá prioridade ao modelo oriundo do Supabase pelo *slug* e omite a versão local, impedindo duplicidades.

## Validações Realizadas
- Modelos órfãos permanecem detectados corretamente.
- Botão "Salvar no CMS" retira com sucesso o UUID falso antes da requisição.
- "Abrir Editor 3D" se mantém bloqueado até a efetiva criação do UUID na nuvem.
- Build da aplicação não apresentou qualquer anomalia.

## Instrução Manual
Você pode acessar o painel em `/super-admin/models-3d`, selecionar cada um dos 3 modelos marcados como "Sem UUID", e clicar em **"Salvar no CMS"**. Isso os promoverá a modelos oficiais, liberando o Editor 3D.

## Decisão Final
`READY_FOR_MANUAL_CMS_PROMOTION_OF_NATIVE_MODELS`
