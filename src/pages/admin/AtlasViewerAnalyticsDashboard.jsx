import React, { useEffect, useState } from 'react';
import Card from "../../components/Card/Card";
import { supabase } from '../../lib/supabase';
import { formatNumber } from '../../utils/formatLocale';

export default function AtlasViewerAnalyticsDashboard() {
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalEvents: 0,
    avgDurationSecs: 0,
    avgAccuracy: 0,
    totalQuizzes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        if (!supabase) return;

        // Total Sessões e Duração Média
        const { data: sessions, error: err1 } = await supabase
          .from('viewer_learning_sessions')
          .select('duration_seconds');
        
        // Total Eventos
        const { count: eventsCount, error: err2 } = await supabase
          .from('viewer_learning_events')
          .select('*', { count: 'exact', head: true });

        // Resultados Quizzes
        const { data: quizzes, error: err3 } = await supabase
          .from('viewer_quiz_results')
          .select('accuracy');

        if (err1 || err2 || err3) {
          console.warn('Erro ao carregar analytics', {err1, err2, err3});
        }

        let avgDur = 0;
        if (sessions && sessions.length > 0) {
          const totalDur = sessions.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
          avgDur = Math.round(totalDur / sessions.length);
        }

        let avgAcc = 0;
        if (quizzes && quizzes.length > 0) {
          const totalAcc = quizzes.reduce((acc, curr) => acc + (curr.accuracy || 0), 0);
          avgAcc = Math.round(totalAcc / quizzes.length);
        }

        setStats({
          totalSessions: sessions?.length || 0,
          totalEvents: eventsCount || 0,
          avgDurationSecs: avgDur,
          avgAccuracy: avgAcc,
          totalQuizzes: quizzes?.length || 0
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="animate-fade-in-up">
      <div className="admin-section-header">
        <div>
          <p className="eyebrow">Aeternum Atlas Engine</p>
          <h1 className="display-title">Viewer Analytics</h1>
          <p className="mt-3 max-w-4xl text-textMuted">
            Métricas educacionais coletadas em tempo real do motor 3D.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-textMuted">Carregando métricas da nuvem...</div>
      ) : (
        <div className="admin-kpi-grid mt-6">
          <Card className="admin-kpi-card admin-kpi-card--teal">
            <span className="text-sm font-medium">Sessões de Estudo</span>
            <strong className="text-3xl font-bold">{formatNumber(stats.totalSessions)}</strong>
            <small className="text-xs text-textMuted mt-1">Acessos únicos ao motor 3D</small>
          </Card>
          
          <Card className="admin-kpi-card admin-kpi-card--gold">
            <span className="text-sm font-medium">Eventos Capturados</span>
            <strong className="text-3xl font-bold">{formatNumber(stats.totalEvents)}</strong>
            <small className="text-xs text-textMuted mt-1">Cliques, rotações e isolamentos</small>
          </Card>

          <Card className="admin-kpi-card admin-kpi-card--blue">
            <span className="text-sm font-medium">Tempo Médio</span>
            <strong className="text-3xl font-bold">{Math.round(stats.avgDurationSecs / 60)} min</strong>
            <small className="text-xs text-textMuted mt-1">Duração por sessão</small>
          </Card>

          <Card className="admin-kpi-card admin-kpi-card--green">
            <span className="text-sm font-medium">Precisão Média (Quizzes)</span>
            <strong className="text-3xl font-bold">{stats.avgAccuracy}%</strong>
            <small className="text-xs text-textMuted mt-1">Baseado em {stats.totalQuizzes} testes</small>
          </Card>
        </div>
      )}
    </div>
  );
}
