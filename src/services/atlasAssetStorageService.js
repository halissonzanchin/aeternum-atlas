import { supabase } from "../lib/supabase";

const LEGACY_BUCKET_NAME = "atlas-model-assets";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Persistência editorial do catálogo Sketchfab.
 *
 * O nome histórico do serviço foi mantido para não quebrar importações
 * administrativas, mas uploads e anotações do antigo motor não fazem mais
 * parte da API pública.
 */
export const atlasAssetStorageService = {
  async saveModelAndAssetMetadata(modelData) {
    if (!supabase) return null;

    const payload = {
      title: modelData.title,
      slug: modelData.slug || modelData.id,
      description: modelData.description || "",
      anatomical_system: modelData.system || modelData.anatomical_system || null,
      anatomical_region: modelData.region || modelData.anatomical_region || null,
      status: modelData.status || "draft",
      viewer_type: "sketchfab",
      sketchfab_url: modelData.sketchfabUrl || modelData.sketchfab_url || null,
      embed_url: modelData.embedUrl || modelData.sketchfabEmbedUrl || modelData.embed_url || null
    };

    try {
      const query = UUID_PATTERN.test(String(modelData.id || ""))
        ? supabase.from("atlas_models").upsert({ ...payload, id: modelData.id }, { onConflict: "id" })
        : supabase.from("atlas_models").insert(payload);
      const { data, error } = await query.select().single();
      if (error) throw error;

      supabase.from("atlas_model_audit_logs").insert({
        model_id: data.id,
        action: UUID_PATTERN.test(String(modelData.id || "")) ? "UPDATE" : "CREATE",
        changes: payload
      }).then();

      return data;
    } catch (error) {
      console.error("[catalogSketchfabService] Falha ao salvar o modelo.", error);
      throw error;
    }
  },

  async deleteAssetFile(filePath) {
    if (!supabase || !filePath) return false;
    const { error } = await supabase.storage.from(LEGACY_BUCKET_NAME).remove([filePath]);
    if (error) throw error;
    return true;
  }
};
