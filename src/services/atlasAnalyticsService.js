import { supabase } from '../lib/supabase';

export const atlasAnalyticsService = {
  
  async syncSession(sessionData, user_id) {
    if (!supabase || !user_id) return null;
    
    try {
      const { data, error } = await supabase
        .from('viewer_learning_sessions')
        .insert([{
          id: sessionData.sessionId, // Se a tabela suportar IDs gerados no client, senao remove
          user_id,
          model_id: sessionData.modelId,
          session_start: new Date(sessionData.startTime).toISOString(),
          session_end: sessionData.endTime ? new Date(sessionData.endTime).toISOString() : null,
          duration_seconds: Math.floor(sessionData.duration / 1000)
        }]);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn("Falha ao sincronizar sessão de aprendizado no Supabase:", err);
      return false;
    }
  },

  async syncEvents(eventsArray, sessionId) {
    if (!supabase || !eventsArray || eventsArray.length === 0) return null;

    try {
      const payload = eventsArray.map(evt => ({
        session_id: sessionId,
        event_type: evt.type,
        structure_id: evt.payload?.layerId || evt.payload?.structure || null,
        annotation_id: evt.payload?.annotationId || null,
        quiz_id: evt.payload?.quizId || null,
        event_data: evt.payload || {},
        created_at: new Date(evt.timestamp).toISOString()
      }));

      const { error } = await supabase
        .from('viewer_learning_events')
        .insert(payload);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn("Falha ao sincronizar eventos de aprendizado no Supabase:", err);
      return false;
    }
  },

  async syncQuizResult(quizData, user_id) {
    if (!supabase || !user_id) return null;

    try {
      const { error } = await supabase
        .from('viewer_quiz_results')
        .insert([{
          user_id,
          quiz_id: quizData.quizId,
          correct_answers: quizData.stats.correct,
          incorrect_answers: quizData.stats.incorrect,
          accuracy: quizData.stats.totalAnswered > 0 
            ? Math.round((quizData.stats.correct / quizData.stats.totalAnswered) * 100) 
            : 0,
          time_spent: quizData.answers.reduce((acc, a) => acc + (a.timeSpentMs || 0), 0)
        }]);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn("Falha ao sincronizar resultado de quiz no Supabase:", err);
      return false;
    }
  }
};
