import React from "react";
import AcademicEvolutionDashboard from "./AcademicEvolutionDashboard";

export default function EvolutionPanel({
  user,
  models = [],
  navigate,
  stats,
  systemProgress = [],
  studySeriesByPeriod,
  weeklyStudyData,
  telemetry,
  t,
  flashcardsReviewed = 0,
  completedQuizzesCount = 0,
  totalQuizzesTarget = 6,
  tutorQuestionsCount = 0,
  className = ""
}) {
  return (
    <div className={`evolution-panel-container ${className}`}>
      <AcademicEvolutionDashboard
        user={user}
        models={models}
        sessions={telemetry?.sessions || []}
        events={telemetry?.events || []}
        quizResults={telemetry?.quizResults || []}
        syncStatus={telemetry?.synchronized ? "verified" : "local"}
        syncError={telemetry?.syncError}
        navigate={navigate}
        t={t}
      />
    </div>
  );
}
