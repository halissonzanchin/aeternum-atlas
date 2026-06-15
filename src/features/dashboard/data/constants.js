export const studyTools = [
  {
    id: "agenda",
    titleKey: "studentHome.tools.agenda.title",
    descriptionKey: "studentHome.tools.agenda.description",
    statusKey: "studentHome.status.available",
    statusTone: "available",
    icon: "clock",
    path: "/study-agenda"
  },
  {
    id: "flashcards",
    titleKey: "studentHome.tools.flashcards.title",
    descriptionKey: "studentHome.tools.flashcards.description",
    statusKey: "studentHome.status.inDevelopment",
    statusTone: "development",
    icon: "library",
    path: "/flashcards"
  },
  {
    id: "quizzes",
    titleKey: "studentHome.tools.quizzes.title",
    descriptionKey: "studentHome.tools.quizzes.description",
    statusKey: "studentHome.status.available",
    statusTone: "available",
    icon: "check",
    path: "/quizzes"
  },
  {
    id: "summaries",
    titleKey: "studentHome.tools.summaries.title",
    descriptionKey: "studentHome.tools.summaries.description",
    statusKey: "studentHome.status.soon",
    statusTone: "soon",
    icon: "spark",
    path: "/summaries"
  },
  {
    id: "guided-study",
    titleKey: "studentHome.tools.guidedStudy.title",
    descriptionKey: "studentHome.tools.guidedStudy.description",
    statusKey: "studentHome.status.inDevelopment",
    statusTone: "development",
    icon: "layers",
    path: "/guided-study"
  },
  {
    id: "ai-tutor",
    titleKey: "studentHome.tools.aiTutor.title",
    descriptionKey: "studentHome.tools.aiTutor.description",
    statusKey: "studentHome.status.inDevelopment",
    statusTone: "development",
    icon: "help",
    path: "/ai-tutor"
  },
  {
    id: "quick-review",
    titleKey: "studentHome.tools.quickReview.title",
    descriptionKey: "studentHome.tools.quickReview.description",
    statusKey: "studentHome.status.soon",
    statusTone: "soon",
    icon: "reset",
    path: "/review"
  },
  {
    id: "anatomical-map",
    titleKey: "studentHome.tools.anatomicalMap.title",
    descriptionKey: "studentHome.tools.anatomicalMap.description",
    statusKey: "studentHome.status.available",
    statusTone: "available",
    icon: "search",
    path: "/atlas"
  }
];

export const recommendationCards = [
  {
    id: "review-most-accessed",
    titleKey: "studentHome.recommendations.reviewMostAccessed",
    descriptionKey: "studentHome.recommendationDescriptions.reviewMostAccessed",
    icon: "reset"
  },
  {
    id: "complete-started",
    titleKey: "studentHome.recommendations.completeStarted",
    descriptionKey: "studentHome.recommendationDescriptions.completeStarted",
    icon: "check"
  },
  {
    id: "quick-quiz",
    titleKey: "studentHome.recommendations.quickQuiz",
    descriptionKey: "studentHome.recommendationDescriptions.quickQuiz",
    icon: "spark",
    path: "/quizzes"
  },
  {
    id: "generate-flashcards",
    titleKey: "studentHome.recommendations.generateFlashcards",
    descriptionKey: "studentHome.recommendationDescriptions.generateFlashcards",
    icon: "library",
    path: "/flashcards"
  }
];

export const weeklyStudyData = [
  { dayKey: "studentHome.days.mon", minutes: 38 },
  { dayKey: "studentHome.days.tue", minutes: 52 },
  { dayKey: "studentHome.days.wed", minutes: 44 },
  { dayKey: "studentHome.days.thu", minutes: 71 },
  { dayKey: "studentHome.days.fri", minutes: 58 },
  { dayKey: "studentHome.days.sat", minutes: 36 },
  { dayKey: "studentHome.days.sun", minutes: 21 }
];

export const evolutionSystems = [
  ["taxonomy.systems.cardiovascular", 82],
  ["taxonomy.systems.skeletal", 68],
  ["taxonomy.systems.digestive", 54],
  ["taxonomy.systems.respiratory", 61],
  ["taxonomy.systems.nervous", 46]
];

export const professorCards = [
  ["navigation.models3d", "professorDashboard.modelsText", "/models", "layers"],
  ["navigation.studyLists", "professorDashboard.studyListsText", "/study-lists", "library"],
  ["navigation.classes", "professorDashboard.classesText", "/classes", "check"],
  ["navigation.recommendations", "professorDashboard.recommendationsText", "/recommendations", "spark"],
  ["navigation.academicReports", "professorDashboard.reportsText", "/academic-reports", "reset"],
  ["navigation.profile", "professorDashboard.profileText", "/profile", "favorite"]
];
