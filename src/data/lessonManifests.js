export const lessonManifests = [
  {
    lessonId: "sandbox-cranial-sagittal-v1",
    title: "Corte Sagital do Crânio Humano",
    slug: "sandbox-cranial-sagittal",
    deckUrl: "/lesson-decks/sandbox-cranial-sagittal/index.html",
    thumbnailUrl: null,
    subject: "Neuroanatomia",
    modelSlug: "corte-sagital-cranio-humano-superficial",
    modelTitle: "Corte Sagital do Crânio Humano Superficial",
    version: "1.0.0",
    checksum: "sha256-abc123xyz...",
    status: "published",
    visibility: "admin",
    sandboxPolicy: "allow-scripts",
    requiresHttp: true,
    usesGlb: false,
    assetBudgetMb: 2,
    estimatedDurationMinutes: 15,
    difficulty: "intermediate",
    tags: ["crânio", "neuroanatomia", "sagital"],
    createdAt: "2026-06-25T10:00:00Z",
    updatedAt: "2026-06-26T14:30:00Z",
    review: {
      technicalStatus: "approved",
      anatomicalStatus: "approved",
      securityStatus: "approved",
      reviewerNotes: "Pronto para deploy experimental isolado."
    },
    security: {
      allowsScripts: true,
      allowsSameOrigin: false,
      usesExternalAssets: false,
      usesInlineScripts: true,
      usesGlb: false,
      assetBudgetPassed: true
    }
  },
  {
    lessonId: "draft-heart-anatomy-v1",
    title: "Anatomia Básica do Coração",
    slug: "sandbox-heart-anatomy",
    deckUrl: "/lesson-decks/sandbox-heart/index.html",
    thumbnailUrl: null,
    subject: "Cardiologia",
    modelSlug: "heart-real-model",
    modelTitle: "Coração Humano Real",
    version: "0.1.0",
    checksum: "sha256-dev-draft...",
    status: "draft",
    visibility: "admin",
    sandboxPolicy: "allow-scripts",
    requiresHttp: true,
    usesGlb: true,
    assetBudgetMb: 12,
    estimatedDurationMinutes: 20,
    difficulty: "beginner",
    tags: ["coração", "cardiologia"],
    createdAt: "2026-06-27T08:00:00Z",
    updatedAt: "2026-06-27T08:00:00Z",
    review: {
      technicalStatus: "pending",
      anatomicalStatus: "pending",
      securityStatus: "pending",
      reviewerNotes: "Em construção. Aguardando revisão de orçamento de assets."
    },
    security: {
      allowsScripts: true,
      allowsSameOrigin: false,
      usesExternalAssets: true,
      usesInlineScripts: true,
      usesGlb: true,
      assetBudgetPassed: false
    }
  }
];
