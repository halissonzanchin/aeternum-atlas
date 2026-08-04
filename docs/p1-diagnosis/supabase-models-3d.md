# Erro Real da Consulta a `models_3d`

**Sintoma no Frontend:**
```javascript
[models] Falha ao carregar models_3d. Object
```

**Diagnóstico Técnico (Erro Real):**
Ao executarmos a chamada direta via cliente Supabase simulando o payload consumido pelo dashboard:

```json
{
  "message": "TypeError: fetch failed",
  "details": "TypeError: fetch failed\n\nCaused by: Error: unable to verify the first certificate... (UNABLE_TO_VERIFY_LEAF_SIGNATURE)",
  "hint": "",
  "code": ""
}
```

**Causa Direta:**
O servidor local do Supabase está servindo a API sobre HTTPS com um certificado autoassinado (self-signed).
1. No Node.js (ou no navegador sem a flag de segurança desativada), o fetch falha com `UNABLE_TO_VERIFY_LEAF_SIGNATURE` ou `net::ERR_CERT_AUTHORITY_INVALID`.
2. Como a requisição não chega ao backend (é barrada na camada TLS), não há `code` de erro do Postgres (ex: colunas ausentes, erro de syntax). O erro é de rede.
3. No arquivo `src/services/modelService.js`, a linha `if (resOld.error)` captura esse erro de rede, imprime no console e **não lança exceção (throw)**. 
4. Consequentemente, o fluxo continua com os dados vazios `[]`, engatilhando o fallback local silencioso.

**Conclusão:** 
Não há falha estrutural no schema da tabela `models_3d` ou nas policies (RLS) para este incidente específico. A RLS e a query estão saudáveis (testado localmente desativando o `NODE_TLS_REJECT_UNAUTHORIZED`, a query retorna `[]` normalmente para usuários não autorizados sem estourar `Failed to fetch`). O bloqueio é exclusivamente de Certificado/Rede no client HTTP.
