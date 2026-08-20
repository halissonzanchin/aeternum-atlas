import React from "react";
import LineIcon from "../../components/icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";

const THEORETICAL_QUIZ_CATALOG = [
  {
    id: "sagittal-skull",
    title: "Simulado Teórico: Corte Sagital do Crânio",
    category: "NEUROANATOMIA & CRÂNIO",
    description: "Prueba de Anatomía Topográfica y Descriptiva sobre telencéfalo, tronco encefálico, cavidade craniana e pares de nervos cranianos.",
    topics: [
      "Córtex Cerebral & Sulcos Principais",
      "Mesencéfalo, Ponte e Bulbo",
      "Vascularização Encefálica & Meninges",
      "Neuralgia do Trigêmeo & Casos Clínicos"
    ],
    icon: "target",
    accent: "neuro",
    image: "/images/models/cranial-sagittal-3d.svg",
    path: "/viewer/corte-sagital-cranio-humano-superficial?mode=theoretical-quiz"
  },
  {
    id: "heart-morgue",
    title: "Simulado Teórico: Coração Humano Morgue",
    category: "SISTEMA CARDIOVASCULAR",
    description: "Exame teórico abrangendo miocárdio, válvulas atrioventriculares, arco aórtico, ramos coronários e infarto agudo do miocárdio.",
    topics: [
      "Ventrículo Esquerdo & Miocárdio",
      "Válvulas Mitral e Tricúspide",
      "Arco Aórtico & Sistema Coronário",
      "IAM, Angina & Estenose Válvular"
    ],
    icon: "clipboardCheck",
    accent: "cardio",
    image: "/images/models/heart-morgue-3d.svg",
    path: "/viewer/coracao-edicao-morgue?mode=theoretical-quiz"
  },
  {
    id: "female-reproductive",
    title: "Simulado Teórico: Sistema Reprodutor Feminino",
    category: "ANATOMIA PÉLVICA",
    description: "Avaliação teórica e estudo de caso sobre estruturas pélvicas, miométrio, ovários, tubas uterinas e vascularização ilíaca.",
    topics: [
      "Corpo & Colo Uterino",
      "Fundo de Saco de Douglas",
      "Vasos Ilíacos Internos & Inervação",
      "Patologias Pélvicas & Ginecologia"
    ],
    icon: "target",
    accent: "pelvis",
    image: "/images/models/female-reproductive-3d.svg",
    path: "/viewer/corte-sagital-sistema-reprodutor-feminino?mode=theoretical-quiz"
  }
];

export default function AnatomicalQuizzesPage({ navigate }) {
  const { t } = useLanguage();

  return (
    <section
      className="anatomical-quizzes-page fade-in-up"
      data-testid="a26-student-quizzes"
      data-a26-source="institutional-catalog"
    >
      <header className="anatomical-quizzes-header">
        <p className="viewer-eyebrow">AVALIAÇÕES TEÓRICAS E EXAMES VINCULADOS AOS MODELOS 3D</p>
        <h1>Simulado Teórico Anatômico</h1>
        <span>Pratique questões teóricas estruturadas de múltipla escolha e exames anatômicos de caso clínico diretamente nos 3 modelos 3D do Atlas.</span>
      </header>

      <div className="anatomical-quiz-catalog-grid">
        {THEORETICAL_QUIZ_CATALOG.map((quiz) => (
          <article
            key={quiz.id}
            className={`anatomical-quiz-card anatomical-quiz-card--${quiz.accent}`}
          >
            {quiz.image && (
              <div className="anatomical-quiz-card__media-wrap">
                <img
                  src={quiz.image}
                  alt={quiz.title}
                  className="anatomical-quiz-card__img"
                  loading="lazy"
                />
                <span className="anatomical-quiz-3d-badge">
                  <LineIcon name="cube" className="w-3.5 h-3.5 inline mr-1" />
                  3D INTERATIVO
                </span>
              </div>
            )}

            <div className="anatomical-quiz-card__top">
              <span className="anatomical-quiz-icon">
                <LineIcon name={quiz.icon} />
              </span>
              <span className="anatomical-quiz-status">
                {t("studentHome.quizCatalog.available") || "DISPONÍVEL"}
              </span>
            </div>

            <div>
              <p className="anatomical-quiz-category">{quiz.category}</p>
              <h2>{quiz.title}</h2>
              <p className="anatomical-quiz-description">{quiz.description}</p>
            </div>

            <ul className="anatomical-quiz-topics">
              {quiz.topics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>

            <button
              type="button"
              className="viewer-primary-button anatomical-quiz-card__button"
              onClick={() => navigate(quiz.path)}
            >
              <LineIcon name="clipboardCheck" />
              Iniciar Simulado Teórico
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
