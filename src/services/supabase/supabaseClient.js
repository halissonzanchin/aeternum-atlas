import { supabase } from "../../lib/supabase";

export const supabaseConfig = {
  url: import.meta.env?.VITE_SUPABASE_URL || "",
  anonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY || ""
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
  return {
    institution_id: institutionId || "upe-presidente-franco"
  };
}
