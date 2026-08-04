# Aeternum 26 — implantação P0

## Proteções

- O tenant `Aeternum Atlas Oficial` é preservado e validado antes da limpeza.
- Os dois modelos 3D, anotações e simulados do tenant de teste são transferidos ao tenant oficial antes da remoção.
- Perfis legados só são removidos quando não existe identidade correspondente em `auth.users`.
- Cada registro material afetado é copiado para `legacy_cleanup_archive` dentro da mesma transação.

## Segredos do Supabase

Configurar no projeto, nunca em variáveis `VITE_*`:

```powershell
supabase secrets set GEMINI_API_KEY="<chave Gemini AI Studio>" --project-ref "<project-ref>"
supabase secrets set AETERNUM_ALLOWED_ORIGINS="https://<dominio-producao>,http://localhost:5173" --project-ref "<project-ref>"
```

A função rejeita uma `GEMINI_API_KEY` ausente ou que não tenha o formato de uma chave Google `AIza...`. A autenticação real da chave também é validada pela chamada ao Gemini. O modelo fixado é `gemini-2.5-flash`, versão estável, sem alias `latest`.

## Segredos do GitHub Actions

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_REF`

O workflow `Supabase Release` aplica as migrações em ordem e só depois implanta a Edge Function autenticada.

O release de produção é manual e exige confirmação explícita. Antes de aplicar qualquer SQL, o workflow compara o histórico remoto e executa `db push --dry-run`; ele não usa `--include-all`, evitando a reaplicação silenciosa de migrações históricas fora de ordem.

## Execução verificada em 2026-08-04

- `Aeternum Atlas Oficial` preservada com 6 perfis ativos.
- 4 perfis públicos sem identidade Auth removidos.
- `UPE - Presidente Franco` e `Aeternum Test University` removidas.
- 2 modelos, 20 anotações e 2 simulados transferidos ao tenant oficial.
- 36 linhas arquivadas em `legacy_cleanup_archive` antes das mutações.
- Sessões antigas reconciliadas; nenhuma sessão permaneceu aberta além do limite de inatividade no fechamento da operação.
- Edge Function `ai-tutor` publicada com JWT obrigatório.

O tenant `Aeternum Atlas Oficial` não foi removido porque contém as seis contas válidas e o acervo ativo. Excluí-lo contrariaria a preservação do modelo Aeternum 26.
