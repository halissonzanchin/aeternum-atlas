import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TutorId } from "../agent.ts";
import type { VitaPersistedState } from "./session-state.ts";

const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class VitaMemoryStore {
  #client: SupabaseClient | null;
  #userId: string | null;
  #tutorId: TutorId;

  constructor(userId: string | null, tutorId: TutorId, client?: SupabaseClient | null) {
    this.#userId = userId && USER_ID_PATTERN.test(userId) ? userId : null;
    this.#tutorId = tutorId;

    if (client !== undefined) {
      this.#client = client;
      return;
    }

    const url = process.env.SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    this.#client = url && serviceRoleKey
      ? createClient(url, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false }
        })
      : null;
  }

  get enabled() {
    return Boolean(this.#client && this.#userId);
  }

  async load(): Promise<VitaPersistedState | null> {
    if (!this.#client || !this.#userId) return null;
    const { data, error } = await this.#client
      .from("vita_tutor_memory")
      .select("current_topic, previous_topics, mastery_evidence")
      .eq("user_id", this.#userId)
      .eq("tutor_id", this.#tutorId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      currentTopic: typeof data.current_topic === "string" ? data.current_topic : null,
      previousTopics: Array.isArray(data.previous_topics) ? data.previous_topics : [],
      masteryEvidence: Number(data.mastery_evidence) || 0
    };
  }

  async save(state: VitaPersistedState): Promise<boolean> {
    if (!this.#client || !this.#userId) return false;
    const { error } = await this.#client.from("vita_tutor_memory").upsert({
      user_id: this.#userId,
      tutor_id: this.#tutorId,
      current_topic: state.currentTopic,
      previous_topics: state.previousTopics.slice(0, 5),
      mastery_evidence: Math.max(0, state.masteryEvidence),
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id,tutor_id" });
    return !error;
  }
}
