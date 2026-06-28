# FASE 8.14B — LARGE 3D ASSET UPLOAD ARCHITECTURE WITH SUPABASE STORAGE TUS

## Diagnóstico do Erro de Tamanho
O modelo "Projeto_Cerebro_Humano.glb" exportado do RealityScan possui 184 MB. Durante o upload pelo Super Admin, a operação falhou com a mensagem:
`The object exceeded the maximum allowed size (Bucket: atlas-model-assets)`.
Isso ocorre porque o bucket atual no Supabase e a infraestrutura de upload padrão via `supabase.storage.from(...).upload` possuem um limite global para arquivos em planos padrão (tipicamente 50 MB no Free Tier) e não suportam nativamente o envio robusto de arquivos massivos em uma única requisição. 

## Por que não salvar GLB no banco ou via Vercel
1. **Banco de Dados (Blob)**: Bancos relacionais como o PostgreSQL não foram projetados para stream e chunking de arquivos pesados. O custo de armazenamento, tempo de leitura (I/O) e bloqueio de tabela inviabiliza completamente a escalabilidade e a performance.
2. **Vercel Functions**: A Vercel (plataforma Serverless) possui um limite restrito de *Body Size* no payload (4.5 MB), o que significa que rotas de API na Vercel dropparão sumariamente arquivos anatômicos antes mesmo de processá-los. O tráfego de mídia pesada deve ir diretamente do cliente (browser) para o bucket (Supabase Storage).

## Bucket Atual e Limites Constatados
- **Bucket**: `atlas-model-assets`
- **Tamanho Limite Aparente**: Estourado no arquivo de 184 MB.
- **Detecção Implementada no Frontend**: O frontend agora detecta o tamanho do arquivo localmente antes do upload. Arquivos acima do limite pré-configurado são bloqueados e um alerta nativo bruto foi substituído por um Modal *Glassmorphism Premium* com instruções amigáveis sugerindo TUS ou Pipeline.

## Estratégia de Storage (Matriz de Qualidade)
A Aeternum Atlas deve tratar arquivos 3D como fluxos de mídia, utilizando o `modelLodManifest` no banco para abrigar múltiplas variantes de um único slug:
- **SOURCE**: Preserva o export original (ex: 184 MB) no caminho `models/<uuid>/source/<nome>.glb`. Nunca renderizado no Viewer público.
- **HQ (Clinical)**: Versão exportada para desktop institucional (alta textura).
- **BALANCED**: Versão web premium (15-50 MB). Carregada como padrão no desktop.
- **PERFORMANCE**: Versão web compactada (3-10 MB), carregada compulsoriamente no mobile.

## Estratégia de Metadados (modelLodManifest)
O objeto JSON na coluna `modelLodManifest` será essencial para o Viewer chavear a versão. Estrutura conceitual:
```json
{
  "performance": { "url": "...", "sizeBytes": 5000000 },
  "balanced": { "url": "...", "sizeBytes": 25000000 },
  "hq": { "url": "...", "sizeBytes": 90000000 }
}
```

## Otimização do GLB (Pipeline RealityScan)
O arquivo de 184 MB (`Projeto_Cerebro_Humano.glb`) não entra puro no Viewer. 
A recomendação técnica de otimização em linha de comando usando o `@gltf-transform/cli` (draco, meshopt e compressão webp) é:
- *Balanced*: `npx -y @gltf-transform/cli optimize INPUT.glb OUTPUT.glb --compress draco --texture-compress webp --texture-size 4096`
- *Performance*: Reduzir `--texture-size` para 2048.

## Estratégia TUS / Resumable Upload
Para fazer upload do SOURCE (184MB+), o frontend necessitará de TUS, que divide o arquivo em chunks (ex: 6MB) e envia sequencialmente. Isso impede timeout e permite retomar em caso de queda de rede. O alerta foi incorporado no código (`LARGE_ASSET_THRESHOLD_MB`), mas a implantação da biblioteca cliente (ex: `tus-js-client`) fica reservada para a próxima fase técnica (8.14C).

## O Que Foi Implementado
- Auditoria e documentação arquitetural da gestão de assets 3D pesados.
- Modificação no `atlasAssetStorageService.js` ajustando o `AssetUploadConstants` (`LARGE_ASSET_THRESHOLD_MB = 6`).
- Refatoração total do fluxo de erros em `Admin3DModelForm.jsx`: as mensagens brutas do navegador (`alert()`) viraram um modal Premium com recomendações, barrando uploads massivos antes do post para o Supabase.

## Rotas Testadas (Sem impacto no Supabase)
- `/super-admin/models-3d` (Editor abre e renderiza o novo limitador de upload).
- `/viewer/corte-sagital-cranio-humano-superficial` (Inalterado).
- `/models` (Library inalterada).

## Resultado do Build
O comando `npm run build` confirmou sucesso e a árvore de dependências está íntegra.

## Decisão Final
`READY_FOR_8_14C_TUS_RESUMABLE_UPLOAD_IMPLEMENTATION`
