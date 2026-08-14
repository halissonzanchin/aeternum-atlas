function clean(value, fallback = "Não informado") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

export function buildAgendaTutorPrompt(event = {}) {
  const resources = [
    event.linkedModel ? `modelo 3D: ${event.linkedModel}` : null,
    event.linkedFlashcardDeck ? `baralho: ${event.linkedFlashcardDeck}` : null
  ].filter(Boolean);

  return [
    "Ajude-me a preparar esta atividade da minha agenda de estudo.",
    `Atividade: ${clean(event.title)}.`,
    `Data e horário: ${clean(event.date)} das ${clean(event.startTime)} às ${clean(event.endTime)}.`,
    `Sistema anatômico: ${clean(event.anatomicalSystem, "Anatomia geral")}.`,
    resources.length ? `Recursos vinculados: ${resources.join("; ")}.` : "Ainda não vinculei um recurso de estudo.",
    event.description ? `Objetivo ou observação: ${clean(event.description)}.` : null,
    "Monte um plano objetivo para esta sessão, proponha uma sequência de estudo e indique como verificar a aprendizagem ao final."
  ].filter(Boolean).join("\n");
}

export function openAgendaEventInTutor(event) {
  if (typeof window === "undefined" || !event) return false;

  window.dispatchEvent(new CustomEvent("aeternum:open-tutor", {
    detail: {
      prompt: buildAgendaTutorPrompt(event),
      contextLabel: `Agenda · ${clean(event.title, "Atividade de estudo")}`,
      context: {
        source: "study-agenda",
        activityId: event.id || null,
        activityTitle: event.title || null,
        activityDate: event.date || null,
        anatomicalSystem: event.anatomicalSystem || null,
        linkedModel: event.linkedModel || null,
        linkedFlashcardDeck: event.linkedFlashcardDeck || null
      }
    }
  }));

  return true;
}
