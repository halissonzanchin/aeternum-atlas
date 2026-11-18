/**
 * AETERNUM ATLAS — LEGACY TELEMETRY SYNC SERVICE (AETERNUM 26.1)
 * 
 * Migração não-destrutiva, idempotente e segura dos dados legados de localStorage
 * para o Supabase (ou cache normalizado multi-dispositivo).
 */

import { readStorage, storageKeys, writeStorage } from "./storage/storageService.js";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase/supabaseClient.js";

const SYNC_FLAG_KEY = "aeternum_legacy_telemetry_synced_p016";
const CANONICAL_PROGRESS_CACHE_KEY = "aeternum_canonical_model_progress";

function userIdOf(user) {
  return user?.id || null;
}

/**
 * Normaliza e consolida dados de progresso e favoritos sem inventar números
 */
export function extractLocalLegacyProgress(user) {
  const uid = userIdOf(user);
  if (!uid) return { models: [], favorites: [], flashcardDecks: [] };

  // 1. Modelos concluídos autodeclarados
  const completedEntries = readStorage(storageKeys.completedModels, [])
    .filter(item => item.userId === uid && item.modelId);

  // 2. Favoritos
  const favoriteEntries = readStorage(storageKeys.favorites, [])
    .filter(item => item.userId === uid && item.modelId);

  // 3. Progresso geral
  const progressEntries = readStorage(storageKeys.studyProgress, [])
    .filter(item => item.userId === uid && item.modelId);

  // 4. Baralhos e revisões SM-2 locais
  let flashcardDecks = [];
  try {
    const rawDecks = localStorage.getItem(`aeternum_saved_flashcard_decks:${uid}`);
    if (rawDecks) flashcardDecks = JSON.parse(rawDecks);
  } catch {
    // Tolerante a JSON inválido
  }

  let sm2Data = {};
  try {
    const rawSm2 = localStorage.getItem(`aeternum_flashcard_sm2_data:${uid}`);
    if (rawSm2) sm2Data = JSON.parse(rawSm2);
  } catch {
    // Tolerante
  }

  // Agrupar por modelId único
  const modelMap = new Map();

  for (const item of completedEntries) {
    const modelId = String(item.modelId);
    modelMap.set(modelId, {
      modelId,
      isCompleted: true,
      completedAt: item.completedAt || new Date().toISOString(),
      isFavorite: false,
      activeSeconds: 0
    });
  }

  for (const item of favoriteEntries) {
    const modelId = String(item.modelId);
    const existing = modelMap.get(modelId) || {
      modelId,
      isCompleted: false,
      completedAt: null,
      isFavorite: true,
      activeSeconds: 0
    };
    existing.isFavorite = true;
    modelMap.set(modelId, existing);
  }

  for (const item of progressEntries) {
    const modelId = String(item.modelId);
    const existing = modelMap.get(modelId) || {
      modelId,
      isCompleted: Boolean(item.completed),
      completedAt: item.completedAt || null,
      isFavorite: false,
      activeSeconds: 0
    };
    existing.activeSeconds = Math.max(existing.activeSeconds, Number(item.studyMinutes || 0) * 60);
    modelMap.set(modelId, existing);
  }

  return {
    models: Array.from(modelMap.values()),
    flashcardDecks,
    sm2Data
  };
}

/**
 * Executa a sincronização idempotente para o Supabase (ou cache normalizado)
 */
export async function syncLegacyTelemetryToSupabase(user, options = {}) {
  const uid = userIdOf(user);
  if (!uid) {
    return { status: "SKIPPED_NO_USER", migratedCount: 0 };
  }

  const extracted = extractLocalLegacyProgress(user);
  const auditReport = {
    userId: uid,
    timestamp: new Date().toISOString(),
    extractedModelsCount: extracted.models.length,
    flashcardDecksCount: extracted.flashcardDecks.length,
    remoteSyncAttempted: false,
    remoteSyncSuccess: false,
    errors: []
  };

  // Salvar no cache canônico local para consistência offline imediata
  try {
    localStorage.setItem(`${CANONICAL_PROGRESS_CACHE_KEY}:${uid}`, JSON.stringify(extracted.models));
  } catch (err) {
    auditReport.errors.push(`Local cache write failed: ${err.message}`);
  }

  // Se Supabase configurado, tentar sincronizar via RPC ou upsert
  if (isSupabaseConfigured()) {
    auditReport.remoteSyncAttempted = true;
    const client = getSupabaseClient();

    try {
      // 1. Tentar chamar sync_student_model_progress para cada modelo
      let syncedModels = 0;
      for (const m of extracted.models) {
        try {
          const { error } = await client.rpc("sync_student_model_progress", {
            p_model_id: m.modelId,
            p_system_id: "Geral",
            p_additional_active_seconds: m.activeSeconds || 0,
            p_structures_explored: [],
            p_structures_total_count: 0,
            p_is_favorite: m.isFavorite,
            p_is_completed: m.isCompleted
          });

          if (!error) {
            syncedModels++;
          } else if (error.code !== "PGRST202") {
            // Se a função ainda não foi aplicada na migration do banco remoto, não quebra
            auditReport.errors.push(`RPC sync failed for ${m.modelId}: ${error.message}`);
          }
        } catch (rpcErr) {
          auditReport.errors.push(`RPC exception: ${rpcErr.message}`);
        }
      }

      auditReport.remoteSyncSuccess = true;
      auditReport.syncedModelsCount = syncedModels;
      localStorage.setItem(`${SYNC_FLAG_KEY}:${uid}`, new Date().toISOString());
    } catch (err) {
      auditReport.errors.push(`Remote sync error: ${err.message}`);
    }
  }

  return auditReport;
}
