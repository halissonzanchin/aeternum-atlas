# Aeternum Sync

Ferramenta Python para sincronizar annotations do Sketchfab com o Supabase do Aeternum Atlas.

Ela foi separada do frontend React/Vite para manter a plataforma leve e permitir manutenção em lote quando muitos modelos 3D forem adicionados.

## O que faz

- Le modelos em `public.models_3d`.
- Extrai o UID do Sketchfab a partir de `embed_url` ou `sketchfab_url`.
- Busca os hotspots/annotations do Sketchfab.
- Normaliza ordem, titulo, descricao, coordenadas e imagens.
- Grava em `public.model_annotations` usando upsert por `model_id + annotation_index`.

## Variaveis de ambiente

Use uma chave segura apenas no ambiente local/servidor. Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` no frontend.

```powershell
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

O script tambem aceita `VITE_SUPABASE_URL` como fallback para a URL, mas a escrita no Supabase deve usar `SUPABASE_SERVICE_ROLE_KEY`.
Em modo dry-run, uma chave anon pode funcionar se as politicas permitirem leitura. Em modo `--apply`, a ferramenta exige chave de servidor.

## Criar tabela no Supabase

Antes do primeiro sync, rode o arquivo abaixo no SQL Editor:

```text
docs/supabase-model-annotations.sql
```

## Testar sem Supabase

Este comando apenas consulta o Sketchfab e imprime as annotations encontradas:

```powershell
python .\tools\aeternum_sync\sync_annotations.py fetch --sketchfab-url "https://sketchfab.com/models/0145e302fd94453c8f7fb2817e45060e/embed"
```

## Simular sync com Supabase

Sem `--apply`, nada e gravado:

```powershell
python .\tools\aeternum_sync\sync_annotations.py sync --env .\.env --model-slug "corte-sagital-cranio-humano-superficial"
```

## Gravar no Supabase

Depois de revisar o dry-run:

```powershell
python .\tools\aeternum_sync\sync_annotations.py sync --env .\.env --model-slug "corte-sagital-cranio-humano-superficial" --apply
```

Para sincronizar uma instituicao inteira:

```powershell
python .\tools\aeternum_sync\sync_annotations.py sync --env .\.env --institution-slug "aeternum-test-university" --apply
```

Por padrao, somente modelos ativos/disponiveis sao sincronizados. Para incluir modelos inativos:

```powershell
python .\tools\aeternum_sync\sync_annotations.py sync --env .\.env --include-inactive
```

## Observacao de seguranca

O modo padrao e dry-run. A ferramenta so escreve no banco quando `--apply` e informado.
