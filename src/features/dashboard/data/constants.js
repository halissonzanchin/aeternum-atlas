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
    statusKey: "studentHome.status.available",
    statusTone: "available",
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
    id: "theoretical-quizzes",
    titleKey: "studentHome.tools.theoreticalQuizzes.title",
    descriptionKey: "studentHome.tools.theoreticalQuizzes.description",
    statusKey: "studentHome.status.available",
    statusTone: "available",
    icon: "spark",
    path: "/quizzes"
  },
  {
    id: "mind-map",
    titleKey: "studentHome.tools.mindMap.title",
    descriptionKey: "studentHome.tools.mindMap.description",
    statusKey: "studentHome.status.available",
    statusTone: "available",
    icon: "layers",
    path: "/models"
  },
  {
    id: "ai-tutor",
    titleKey: "studentHome.tools.aiTutor.title",
    descriptionKey: "studentHome.tools.aiTutor.description",
    statusKey: "studentHome.status.available",
    statusTone: "available",
    icon: "help",
    path: "/ai-tutor"
  }
];

export const professorCards = [
  ["navigation.models3d", "professorDashboard.modelsText", "/models", "layers"],
  ["navigation.studyLists", "professorDashboard.studyListsText", "/study-lists", "library"],
  ["navigation.classes", "professorDashboard.classesText", "/classes", "check"],
  ["navigation.recommendations", "professorDashboard.recommendationsText", "/recommendations", "spark"],
  ["navigation.academicReports", "professorDashboard.reportsText", "/academic-reports", "reset"],
  ["navigation.profile", "professorDashboard.profileText", "/profile", "favorite"]
];
