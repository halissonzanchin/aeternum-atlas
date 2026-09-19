-- Migration: 202608240002_vault_privilege_hardening.sql
-- Description: Hardening de seguranca da funcao get_system_secret com allowlist, search_path fixo e revogacao de EXECUTE para anon/authenticated

CREATE OR REPLACE FUNCTION public.get_system_secret(p_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  v_secret text;
BEGIN
  -- Whitelist estrita de nomes autorizados
  IF p_name NOT IN ('LIVEKIT_PUBLIC_URL', 'LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET') THEN
    RAISE EXCEPTION 'Acesso negado: chave de sistema nao autorizada.' USING ERRCODE = '42501';
  END IF;

  SELECT decrypted_secret INTO v_secret 
  FROM vault.decrypted_secrets 
  WHERE name = p_name 
  LIMIT 1;

  RETURN v_secret;
END;
$$;

-- Revogacao estrita de privilegios de execucao
REVOKE ALL ON FUNCTION public.get_system_secret(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_system_secret(text) FROM anon;
REVOKE ALL ON FUNCTION public.get_system_secret(text) FROM authenticated;

-- Concessao restrita apenas para service_role e postgres (admin)
GRANT EXECUTE ON FUNCTION public.get_system_secret(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_system_secret(text) TO postgres;
