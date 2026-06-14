import { supabase } from "../lib/supabase";
import { getLocalModelAnnotations } from "../data/localModels";
import { isSupabaseConfigured } from "./supabase/supabaseClient";

function normalizeAnnotation(row = {}) {
  return {
    id: row.id || row.annotation_uid || `annotation-${row.annotation_index}`,
    uid: row.annotation_uid || "",
    index: Number.isInteger(row.annotation_index) ? row.annotation_index : 0,
    name: row.title || "Annotation",
    description: row.description || "",
    eye: row.eye || null,
    target: row.target || null,
    position: row.position || null,
    images: Array.isArray(row.images) ? row.images : []
  };
}

export async function listModelAnnotations(modelId) {
  if (!modelId) return [];

  const localAnnotations = getLocalModelAnnotations(modelId);

  if (!isSupabaseConfigured()) return localAnnotations;

  const { data, error } = await supabase
    .from("model_annotations")
    .select("id, annotation_uid, annotation_index, title, description, eye, target, position, images")
    .eq("model_id", modelId)
    .order("annotation_index", { ascending: true });

  if (error) {
    console.warn("[model_annotations] Cache de annotations indisponível.", error);
    return localAnnotations;
  }

  const annotations = (data || []).map(normalizeAnnotation);
  return annotations.length ? annotations : localAnnotations;
}
