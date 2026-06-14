# Aeternum Data Worker

Modulo Python para automatizar a manutencao de dados do Aeternum Atlas.

O objetivo e deixar o frontend React/Vite focado na experiencia visual, enquanto o Python cuida de tarefas em lote: sincronizar estruturas anatomicas, validar catalogo, auditar dados multi-tenant e importar novos modelos 3D.

## Variaveis de ambiente

Use `.env` na raiz do projeto:

```powershell
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

Para comandos de leitura, `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` podem funcionar se as policies permitirem. Para comandos com `--apply`, use sempre `SUPABASE_SERVICE_ROLE_KEY`.

Para salvar a chave localmente sem imprimir no terminal:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\aeternum_data_worker\set_service_role_key.ps1
```

Se o Windows nao tiver Python instalado, rode pelo Docker:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\aeternum_data_worker\run_worker_docker.ps1
```

## Comandos principais

Buscar annotations de um modelo Sketchfab:

```powershell
python .\tools\aeternum_data_worker\aeternum_worker.py fetch-annotations --sketchfab-url "https://sketchfab.com/models/0145e302fd94453c8f7fb2817e45060e/embed"
```

Simular sincronizacao das estruturas anatomicas:

```powershell
python .\tools\aeternum_data_worker\aeternum_worker.py sync-annotations --model-slug "corte-sagital-cranio-humano-superficial"
```

Gravar annotations no Supabase:

```powershell
python .\tools\aeternum_data_worker\aeternum_worker.py sync-annotations --model-slug "corte-sagital-cranio-humano-superficial" --apply
```

Validar catalogo:

```powershell
python .\tools\aeternum_data_worker\aeternum_worker.py validate-catalog --save-report
```

Comparar cache do Supabase com Sketchfab ao vivo:

```powershell
python .\tools\aeternum_data_worker\aeternum_worker.py validate-catalog --check-sketchfab --save-report
```

Auditar consistencia multi-tenant:

```powershell
python .\tools\aeternum_data_worker\aeternum_worker.py audit-tenancy --save-report
```

Rodar diagnostico completo:

```powershell
python .\tools\aeternum_data_worker\aeternum_worker.py doctor --check-sketchfab --save-report
```

Gerar cabecalho CSV para importacao:

```powershell
python .\tools\aeternum_data_worker\aeternum_worker.py model-template
```

Importar modelos por CSV ou JSON em modo simulacao:

```powershell
python .\tools\aeternum_data_worker\aeternum_worker.py import-models --input .\imports\models.csv
```

Gravar modelos validos no Supabase:

```powershell
python .\tools\aeternum_data_worker\aeternum_worker.py import-models --input .\imports\models.csv --apply
```

## CSV de importacao

Cabecalho esperado:

```csv
institution_id,institution_slug,slug,title,anatomical_system,anatomical_region,sketchfab_url,embed_url,difficulty_level,tags,status,thumbnail_url
```

Use `institution_slug` quando nao quiser preencher o UUID da instituicao. O worker resolve o ID buscando em `public.institutions`.
Um template inicial esta em:

```text
tools/aeternum_data_worker/templates/models_import_template.csv
```

## Seguranca

- O modo padrao e dry-run.
- Escrita no Supabase so acontece com `--apply`.
- `SUPABASE_SERVICE_ROLE_KEY` nunca deve ser usada no frontend.
- Os relatorios sao salvos localmente em `reports/aeternum-data-worker`.
