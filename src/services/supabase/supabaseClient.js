import { supabase } from "../../lib/supabase.ts";

export const supabaseConfig = {
  url: (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== "undefined" && process.env?.VITE_SUPABASE_URL) || "",
  anonKey: (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== "undefined" && process.env?.VITE_SUPABASE_ANON_KEY) || ""
};

let injectedClient = supabase;

export function isSupabaseConfigured() {
  return Boolean(supabaseConfig.url && supabaseConfig.anonKey);
}

export function setSupabaseClient(client) {
  injectedClient = client;
  return injectedClient;
}

export function getSupabaseClient() {
  return injectedClient || supabase;
}

export function requireSupabaseClient() {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error(
      "Supabase ainda não está conectado. Configure VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY e injete o client real."
    );
  }

  return client;
}

export async function runSupabaseQuery(queryFn, fallbackValue = null) {
  const client = getSupabaseClient();
  if (!client) return fallbackValue;
  return queryFn(client);
}

export function createTenantFilter(institutionId) {
  if (!institutionId) {
    console.warn("institution_id ausente. Filtro multi-tenant bloqueado por segurança.");
    return null;
  }

  return {
    institution_id: institutionId
  };
}
