const QUIZ_SESSION_KEY = '@aeternum:atlas_quiz_session';

export const getQuizSession = () => {
  try {
    const raw = localStorage.getItem(QUIZ_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const initQuizSession = (modelId) => {
  try {
    const session = {
      modelId,
      startedAt: Date.now(),
      answers: [],
      stats: {
        totalAnswered: 0,
        correct: 0,
        incorrect: 0
      }
    };
    localStorage.setItem(QUIZ_SESSION_KEY, JSON.stringify(session));
    return session;
  } catch (err) {
    console.error('Falha ao criar sessão de Quiz local', err);
    return null;
  }
};

export const recordQuizAnswer = (quizId, isCorrect, timeSpentMs) => {
  try {
    let session = getQuizSession();
    if (!session) {
      session = initQuizSession('unknown');
    }

    session.answers.push({
      quizId,
      isCorrect,
      timeSpentMs,
      timestamp: Date.now()
    });

    session.stats.totalAnswered += 1;
    if (isCorrect) {
      session.stats.correct += 1;
    } else {
      session.stats.incorrect += 1;
    }

    localStorage.setItem(QUIZ_SESSION_KEY, JSON.stringify(session));
    return session;
  } catch (err) {
    console.error('Falha ao gravar resposta de Quiz', err);
    return null;
  }
};
