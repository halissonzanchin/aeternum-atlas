import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Aeternum Vita remains isolated from the Atlas IA brain", async () => {
  const [voiceBrain, atlasBrain, overlay, vitaBrain] = await Promise.all([
    read("../src/services/voice/aeternumVoiceBrain.js"),
    read("../src/services/cerebro-aeternum/cerebroAeternum.js"),
    read("../src/components/aeternum-26/AeternumSiriScreenOverlay.jsx"),
    read("../src/services/cerebro-vita/cerebroAeternumVita.js")
  ]);

  assert.doesNotMatch(voiceBrain, /atlasAITutorService/);
  assert.match(atlasBrain, /export const cerebroAtlasAI/);
  assert.doesNotMatch(overlay, /atlasAITutorService|generateDynamicVoiceResponse/);
  assert.match(overlay, /AeternumVitaLiveSession/);
  assert.doesNotMatch(vitaBrain, /estou aqui para guiar seus passos/i);
});

test("browser voice code contains no provider secrets or local JWT signing", async () => {
  const [config, legacyLiveKit] = await Promise.all([
    read("../src/services/voice/aeternumVitaConfig.js"),
    read("../src/services/voice/aeternumLiveKitService.js")
  ]);

  for (const source of [config, legacyLiveKit]) {
    assert.doesNotMatch(source, /API_SECRET|API_KEY|cartesiaApiKey|deepgramApiKey|livekitApiSecret/);
    assert.doesNotMatch(source, /subtle\.sign|HS256/);
  }
});

test("voice-token requires authenticated, bounded, server-side issuance", async () => {
  const tokenFunction = await read("../supabase/functions/voice-token/index.ts");

  assert.match(tokenFunction, /auth\.getUser\(/);
  assert.match(tokenFunction, /idempotency-key/i);
  assert.match(tokenFunction, /consume_voice_rate_limit/);
  assert.match(tokenFunction, /canPublishSources/);
  assert.doesNotMatch(tokenFunction, /LIVEKIT_API_SECRET\) \|\|/);
  assert.doesNotMatch(tokenFunction, /Access-Control-Allow-Origin["']:\s*["']\*["']/);
});

test("Atlas IA regression files preserve their dedicated brain path", async () => {
  const [sessionContext, tutorService] = await Promise.all([
    read("../src/context/AtlasAITutorSessionContext.jsx"),
    read("../src/features/atlas-viewer/ai/atlasAITutorService.js")
  ]);

  assert.match(sessionContext, /atlasAITutorService\.processMessageStream/);
  assert.match(tutorService, /cerebroAtlasAI/);
  assert.match(tutorService, /mode:\s*["']research["']/);
});

test("the server-side Vita agent has its own behavior and memory boundary", async () => {
  const [agent, stateMachine, memoryStore, knowledgeRetriever] = await Promise.all([
    read("../server/agent/src/agent.ts"),
    read("../server/agent/src/behavior/session-state.ts"),
    read("../server/agent/src/behavior/vita-memory-store.ts"),
    read("../server/agent/src/knowledge/vita-knowledge.ts")
  ]);

  assert.doesNotMatch(agent, /atlasAITutorService|cerebroAtlasAI|AtlasAITutorSessionContext/);
  assert.match(agent, /VitaSessionStateMachine/);
  assert.match(agent, /VitaMemoryStore/);
  assert.match(agent, /VitaKnowledgeRetriever/);
  assert.doesNotMatch(stateMachine, /ANATOMY_TERMS|escapula|femur|esterno/i);
  assert.match(memoryStore, /vita_tutor_memory/);
  assert.match(knowledgeRetriever, /match_vita_anatomical_knowledge/);
  assert.doesNotMatch(knowledgeRetriever, /atlasAITutorService|cerebroAtlasAI/);
});

test("Vita bibliographic knowledge remains private and independent", async () => {
  const migration = await read("../supabase/migrations/20260823021957_add_vita_hybrid_knowledge_search.sql");

  assert.match(migration, /public\.vita_anatomical_knowledge/);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant execute[\s\S]*to service_role/i);
  assert.doesNotMatch(migration, /alter table public\.anatomical_knowledge_base/i);
});

test("Vita persistence and token rate limit are isolated by database policy", async () => {
  const [rateLimitMigration, memoryMigration] = await Promise.all([
    read("../supabase/migrations/20260823011218_add_vita_voice_rate_limit.sql"),
    read("../supabase/migrations/20260823014259_add_vita_tutor_memory.sql")
  ]);

  assert.match(rateLimitMigration, /security definer/i);
  assert.match(rateLimitMigration, /auth\.uid\(\)/i);
  assert.match(rateLimitMigration, /grant execute[\s\S]*to authenticated/i);
  assert.match(memoryMigration, /alter table public\.vita_tutor_memory enable row level security/i);
  assert.match(memoryMigration, /using \(\(select auth\.uid\(\)\) = user_id\)/i);
  assert.match(memoryMigration, /primary key \(user_id, tutor_id\)/i);
});
