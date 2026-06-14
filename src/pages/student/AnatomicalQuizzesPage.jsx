import LineIcon from "../../components/icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";

const quizCatalog = [
  {
    id: "sagittal",
    translationKey: "studentHome.quizCatalog.items.sagittal",
    icon: "target",
    accent: "neuro",
    path: "/viewer/corte-sagital-cranio-humano-superficial"
  },
  {
    id: "heart",
    translationKey: "studentHome.quizCatalog.items.heart",
    icon: "clipboardCheck",
    accent: "cardio",
    path: "/viewer/coracao-humano-superficial"
  },
  {
    id: "femaleReproductive",
    translationKey: "studentHome.quizCatalog.items.femaleReproductive",
    icon: "target",
    accent: "pelvis",
    path: "/viewer/corte-sagital-sistema-reprodutor-feminino"
  }
];

export default function AnatomicalQuizzesPage({ navigate }) {
  const { t } = useLanguage();

  return (
    <section className="anatomical-quizzes-page fade-in-up">
      <header className="anatomical-quizzes-header">
        <p className="viewer-eyebrow">{t("studentHome.quizCatalog.eyebrow")}</p>
        <h1>{t("studentHome.quizCatalog.title")}</h1>
        <span>{t("studentHome.quizCatalog.description")}</span>
      </header>

      <div className="anatomical-quiz-catalog-grid">
        {quizCatalog.map((quiz) => {
          const topics = t(`${quiz.translationKey}.topics`);
          const safeTopics = Array.isArray(topics) ? topics : [];

          return (
            <article
              key={quiz.id}
              className={`anatomical-quiz-card anatomical-quiz-card--${quiz.accent}`}
            >
              <div className="anatomical-quiz-card__top">
                <span className="anatomical-quiz-icon">
                  <LineIcon name={quiz.icon} />
                </span>
                <span className="anatomical-quiz-status">
                  {t("studentHome.quizCatalog.available")}
                </span>
              </div>

              <div>
                <p className="anatomical-quiz-category">
                  {t(`${quiz.translationKey}.category`)}
                </p>
                <h2>{t(`${quiz.translationKey}.title`)}</h2>
                <p className="anatomical-quiz-description">
                  {t(`${quiz.translationKey}.description`)}
                </p>
              </div>

              <ul className="anatomical-quiz-topics">
                {safeTopics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>

              <button
                type="button"
                className="viewer-primary-button anatomical-quiz-card__button"
                onClick={() => navigate(quiz.path)}
              >
                <LineIcon name="clipboardCheck" />
                {t("studentHome.quizCatalog.start")}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
