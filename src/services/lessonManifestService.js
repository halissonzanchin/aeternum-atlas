import { lessonManifests } from "../data/lessonManifests";

export function getAllLessons() {
  return lessonManifests;
}

export function getLessonBySlug(slug) {
  return lessonManifests.find(l => l.slug === slug) || null;
}

export function getLessonsByStatus(status) {
  return lessonManifests.filter(l => l.status === status);
}

export function getLessonsByModelSlug(modelSlug) {
  return lessonManifests.filter(l => l.modelSlug === modelSlug);
}

export function validateLessonManifest(lesson) {
  if (!lesson) return { valid: false, error: "Manifest not provided" };

  if (!lesson.deckUrl || !lesson.deckUrl.startsWith("/lesson-decks/")) {
    return { valid: false, error: "Invalid deckUrl. Must be a local /lesson-decks/ path." };
  }

  if (lesson.deckUrl.includes("http://") || lesson.deckUrl.includes("https://")) {
    return { valid: false, error: "External URLs are prohibited." };
  }

  if (lesson.deckUrl.startsWith("javascript:") || lesson.deckUrl.startsWith("data:") || lesson.deckUrl.startsWith("blob:")) {
    return { valid: false, error: "Dynamic/executable schemas are prohibited." };
  }

  if (lesson.sandboxPolicy !== "allow-scripts") {
    return { valid: false, error: "Sandbox policy must be 'allow-scripts'." };
  }

  return { valid: true };
}

export function getLessonSecurityScore(lesson) {
  let score = 100;
  if (!lesson.security) return 0;
  
  if (lesson.security.allowsSameOrigin) score -= 50;
  if (lesson.security.usesExternalAssets) score -= 20;
  if (lesson.security.usesInlineScripts) score -= 10;
  if (lesson.security.usesGlb && lesson.assetBudgetMb > 25) score -= 30;
  if (!lesson.security.assetBudgetPassed) score -= 20;

  return Math.max(0, score);
}
