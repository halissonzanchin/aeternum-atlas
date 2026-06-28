# FASE 8.14C — TUS RESUMABLE UPLOAD IMPLEMENTATION FOR LARGE 3D ASSETS

## Diagnóstico da FASE 8.14B
A arquitetura anterior (Fase 8.14B) identificou que o upload nativo (multipart) para o Supabase Storage via Vercel ou cliente padrão causava *timeouts* em arquivos muito pesados, como o "Projeto_Cerebro_Humano.glb" (184 MB). Estabelecemos que arquivos acima de 6MB necessitavam de *Resumable Upload* e que o limite do bucket seria rigorosamente respeitado.

## Implementação TUS (tus-js-client)
A biblioteca `tus-js-client` foi introduzida no ecossistema (`package.json`) para realizar o stream de upload diretamente em chunks de 6MB ao invés de depender de uma requisição HTTP única, burlando limitações de infraestrutura do Next/Vercel (limitados a corpos de 4.5 MB). 

### Limites de Storage e Segurança
Implementamos um bloqueio preventivo rígido no `Admin3DModelForm.jsx`:
- **Se `file.size` <= 6MB**: Usa o fluxo de upload nativo do Supabase.
- **Se `file.size` > 6MB e <= 50MB**: Inicia automaticamente o *Resumable Upload* (TUS) monitorando progresso, com feedback visual Premium.
- **Se `file.size` > 50MB (Limite atual free tier configurado)**: O sistema não tenta subir o arquivo para economizar banda, acionando o bloqueio seguro `BLOCKED_BY_SUPABASE_STORAGE_LIMIT` com aviso claro no painel.

Como o arquivo alvo possui 184MB, o sistema **bloqueia** corretamente o upload com a interface Glassmorphism para não travar a aplicação indefinidamente, indicando ao Super Admin que ele precisa aumentar o Global File Size Limit da instância do Supabase.

## Variante e Metadados (modelLodManifest)
Na conclusão do upload de arquivos densos via TUS, o pipeline agora atualiza o `modelLodManifest` no registro de banco de dados (`atlas_models`) apontando o GLB gigantesco exclusivamente como `source` com `adminOnly: true`. Isso preserva o arquivo físico, mas impede que o Viewer público sobrecarregue computadores de alunos baixando 184MB instintivamente, repassando o trabalho pesado de redução para a próxima fase.

## Rotas Testadas e Validadas
- `/super-admin/models-3d`
- `/super-admin/models-3d/<uuid>/editor`
- `/models`
- `/viewer/corte-sagital-cranio-humano-superficial`
*(Nenhum Viewer quebrou ou importou acidentalmente o modelo de 184 MB)*

## Arquivos Alterados
1. `package.json` (Dependência: tus-js-client)
2. `src/services/atlasAssetStorageService.js` (Lógica TUS Supabase endpoint via import.meta.env)
3. `src/features/admin-3d/Admin3DModelForm.jsx` (Gestão de estado, progresso e limits)

## Resultado do Build
O `vite build` transpilou a biblioteca TUS corretamente junto da aplicação React sem erros de chunk.

## Decisão Final
`BLOCKED_BY_SUPABASE_STORAGE_LIMIT`
*(O código TUS está pronto e blindado, mas o payload de 184MB foi corretamente bloqueado pelo teto atual do projeto [50MB]. O upload real ocorrerá assim que a cota do Supabase for relaxada pela equipe, ou na fase 8.14D após compactação)*.
