import LineIcon from "../../icons/LineIcon";
import { useLanguage } from "../../../context/LanguageContext";

function formatDate(date, language) {
  const localeMap = {
    pt: "pt-BR",
    es: "es-ES",
    en: "en-US",
    de: "de-DE"
  };
  return new Intl.DateTimeFormat(localeMap[language] || "pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(`${date}T12:00:00`));
}

export default function UpcomingReviews({ reviews, navigate }) {
  const { language, t } = useLanguage();

  return (
    <section className="agenda-side-card upcoming-reviews">
      <div className="agenda-side-card__title">
        <h3>{t("studyAgenda.upcomingReviews")}</h3>
      </div>
      <div className="upcoming-review-list">
        {reviews.length ? reviews.map(review => (
          <button key={review.id} className="upcoming-review-item" onClick={() => review.linkedModelRoute && navigate(review.linkedModelRoute)}>
            <span>{formatDate(review.date, language)}</span>
            <div>
              <strong>{review.title}</strong>
              <small>{review.anatomicalSystem} · {t(`studyAgenda.priorities.${review.priority}`)}</small>
              {review.linkedModel ? <small>{review.linkedModel}</small> : null}
            </div>
            <LineIcon name="chevron" />
          </button>
        )) : (
          <p className="agenda-empty-text">{t("studyAgenda.noUpcomingReviews")}</p>
        )}
      </div>
    </section>
  );
}
