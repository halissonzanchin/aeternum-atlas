process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { runSupabaseSql } from "./supabase_admin_helper.mjs";

const USER_ID = "825b2496-ecec-4b67-8343-f8aa3578c224";
const INST_ID = "11111111-1111-1111-1111-111111111111";
const MODEL_ID = "2c57a03b-2c77-4119-b8bb-676ea59e9190";

async function seed() {
  console.log("Seeding telemetry for automation account:", USER_ID);

  // Clean previous test telemetry
  await runSupabaseSql(`DELETE FROM public.viewer_learning_events WHERE user_id = '${USER_ID}';`);
  await runSupabaseSql(`DELETE FROM public.viewer_learning_sessions WHERE user_id = '${USER_ID}';`);
  await runSupabaseSql(`DELETE FROM public.viewer_quiz_results WHERE user_id = '${USER_ID}';`);

  // Insert 2 sessions (today & yesterday)
  const sessionId1 = "a1111111-1111-1111-1111-111111111111";
  const sessionId2 = "a2222222-2222-2222-2222-222222222222";

  await runSupabaseSql(`
    INSERT INTO public.viewer_learning_sessions 
      (id, user_id, institution_id, model_id, session_start, session_end, active_seconds, idle_seconds, duration_seconds, status, ended_reason, scope)
    VALUES
      ('${sessionId1}', '${USER_ID}', '${INST_ID}', '${MODEL_ID}', NOW() - INTERVAL '40 minutes', NOW(), 2400, 0, 2400, 'completed', 'user_close', 'viewer'),
      ('${sessionId2}', '${USER_ID}', '${INST_ID}', '${MODEL_ID}', NOW() - INTERVAL '1 day 30 minutes', NOW() - INTERVAL '1 day', 1800, 0, 1800, 'completed', 'user_close', 'viewer');
  `);

  // Insert learning events
  await runSupabaseSql(`
    INSERT INTO public.viewer_learning_events
      (id, session_id, user_id, institution_id, model_id, event_type, structure_id, created_at)
    VALUES
      (gen_random_uuid(), '${sessionId1}', '${USER_ID}', '${INST_ID}', '${MODEL_ID}', 'annotation_opened', 'struct-osso-frontal', NOW() - INTERVAL '30 minutes'),
      (gen_random_uuid(), '${sessionId1}', '${USER_ID}', '${INST_ID}', '${MODEL_ID}', 'annotation_opened', 'struct-osso-parietal', NOW() - INTERVAL '20 minutes'),
      (gen_random_uuid(), '${sessionId2}', '${USER_ID}', '${INST_ID}', '${MODEL_ID}', 'annotation_opened', 'struct-osso-occipital', NOW() - INTERVAL '1 day 15 minutes');
  `);

  // Insert quiz result
  await runSupabaseSql(`
    INSERT INTO public.viewer_quiz_results
      (id, user_id, institution_id, model_id, quiz_id, quiz_type, status, score, total_questions, percentage, duration_seconds, finished_at)
    VALUES
      (gen_random_uuid(), '${USER_ID}', '${INST_ID}', '${MODEL_ID}', 'quiz-cranio-base', 'anatomical', 'completed', 9, 10, 90, 320, NOW() - INTERVAL '2 hours');
  `);

  console.log("Telemetry seeded successfully for automation test account.");
}

seed().catch(console.error);
