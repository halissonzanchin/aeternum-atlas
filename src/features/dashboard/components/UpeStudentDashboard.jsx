import React from "react";
import Card from "../../../components/Card/Card";
import LineIcon from "../../../components/icons/LineIcon";
import { useLanguage } from "../../../context/LanguageContext";
import { 
  upeStudentProfile, 
  upeStudentProgress, 
  upeCriticalStructures, 
  upeRecommendedLibrary, 
  upePendingQuizzes, 
  upeStudyPathways, 
  upeAcademicMessages, 
  upeIntelligentNextStep 
} from "../../../demo/upe/studentMock";

export default function UpeStudentDashboard({ navigate }) {
  const { t } = useLanguage();

  return (
    <section className="premium-dashboard fade-in-up pb-12">
      {/* 1. Hero / Continue Studying */}
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blackDeep border border-techTeal/20 p-8 shadow-lg shadow-techTeal/5">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <p className="text-techTeal font-medium uppercase tracking-wider text-xs mb-2">
              {upeStudentProfile.course} • {upeStudentProfile.semester}
            </p>
            <h1 className="text-3xl font-bold text-clinicalWhite mb-2">
              Olá, {upeStudentProfile.name.split(' ')[0]}
            </h1>
            <p className="text-textMuted max-w-lg mb-6">
              Sua última atividade foi há {upeStudentProfile.lastActivityAt.replace('há ', '')}.
              Vamos retomar a dissecação de {upeStudentProfile.lastModelAccessed}?
            </p>
            <button 
              onClick={() => navigate("/viewer/skull_base")}
              className="bg-techTeal hover:bg-techTeal/80 text-blackDeep font-bold px-6 py-3 rounded flex items-center space-x-2 transition shadow-[0_0_15px_rgba(45,212,191,0.3)]">
              <LineIcon name="play-circle" className="w-5 h-5" />
              <span>{upeStudentProfile.nextRecommendedAction}</span>
            </button>
          </div>
          <div className="mt-6 md:mt-0 relative flex justify-center items-center">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="351" strokeDashoffset={351 - (351 * upeStudentProfile.currentProgress) / 100} className="text-techTeal" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-clinicalWhite">{upeStudentProfile.currentProgress}%</span>
              <span className="text-[10px] text-textMuted uppercase tracking-wider">Mestre</span>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-1/3 h-full bg-techTeal/5 opacity-50 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      </div>

      {/* 7. Academic Messages (Push Didático) */}
      {upeAcademicMessages.length > 0 && (
        <div className="mb-10 bg-alertWarning/10 border border-alertWarning/30 rounded-xl p-4 flex items-start space-x-4">
          <div className="w-10 h-10 rounded-full bg-alertWarning/20 flex items-center justify-center flex-shrink-0 mt-1">
            <LineIcon name="bell" className="w-5 h-5 text-alertWarning" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-alertWarning flex items-center">
              Mensagem de {upeAcademicMessages[0].sender}
              <span className="ml-2 text-xs font-normal opacity-70">• {upeAcademicMessages[0].date}</span>
            </h3>
            <p className="text-clinicalWhite text-sm mt-1">{upeAcademicMessages[0].message}</p>
          </div>
        </div>
      )}

      {/* 2. Progress Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        <Card className="bg-blackDeep/60 border-slate-800 p-4 text-center hover:border-techTeal/30 transition">
          <p className="text-textMuted text-xs font-medium mb-1">Horas Acumuladas</p>
          <div className="text-2xl font-bold text-clinicalWhite">{upeStudentProgress.totalStudyHours}h</div>
        </Card>
        <Card className="bg-blackDeep/60 border-slate-800 p-4 text-center hover:border-techTeal/30 transition">
          <p className="text-textMuted text-xs font-medium mb-1">Média Geral</p>
          <div className="text-2xl font-bold text-techTeal">{upeStudentProgress.averageScore}%</div>
        </Card>
        <Card className="bg-blackDeep/60 border-slate-800 p-4 text-center hover:border-techTeal/30 transition">
          <p className="text-textMuted text-xs font-medium mb-1">Simulados</p>
          <div className="text-2xl font-bold text-clinicalWhite">{upeStudentProgress.completedQuizzes}</div>
        </Card>
        <Card className="bg-alertSuccess/5 border-alertSuccess/20 p-4 text-center transition">
          <p className="text-alertSuccess/80 text-xs font-medium mb-1">Dominadas</p>
          <div className="text-2xl font-bold text-alertSuccess">{upeStudentProgress.masteredStructures}</div>
        </Card>
        <Card className="bg-alertWarning/5 border-alertWarning/20 p-4 text-center transition">
          <p className="text-alertWarning/80 text-xs font-medium mb-1">Foco Crítico</p>
          <div className="text-2xl font-bold text-alertWarning">{upeStudentProgress.criticalStructures}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* 3. Critical Structures */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-bold text-clinicalWhite mb-4 flex items-center">
            <LineIcon name="target" className="w-5 h-5 mr-2 text-alertWarning" />
            Suas Dificuldades
          </h2>
          <Card className="bg-blackDeep/40 border-slate-800 p-0 overflow-hidden">
            <div className="divide-y divide-slate-800">
              {upeCriticalStructures.map((struct, idx) => (
                <div key={idx} className="p-3 hover:bg-slate-900/50 transition">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-clinicalWhite">{struct.name}</span>
                    <span className="text-xs font-bold text-alertWarning">{struct.score}% acerto</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className="bg-alertWarning h-1.5 rounded-full" style={{ width: `${struct.score}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 8. Intelligent Next Step */}
          <div className="mt-6">
            <h2 className="text-lg font-bold text-clinicalWhite mb-4 flex items-center">
              <LineIcon name="cpu" className="w-5 h-5 mr-2 text-techTeal" />
              Plano de Resgate AI
            </h2>
            <Card className="bg-techTeal/5 border-techTeal/20 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-techTeal/10"><LineIcon name="cpu" className="w-24 h-24" /></div>
              <p className="text-sm text-clinicalWhite mb-4 relative z-10">
                Você teve baixo rendimento em <strong>{upeIntelligentNextStep.error}</strong>. Siga este roteiro:
              </p>
              <div className="space-y-3 relative z-10">
                {upeIntelligentNextStep.steps.map((step, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => idx === 0 ? navigate("/viewer/skull_base") : navigate("/quizzes")}
                    className="flex items-center space-x-3 text-sm text-slate-300 w-full text-left hover:text-techTeal transition">
                    <div className="w-5 h-5 rounded-full border border-techTeal flex items-center justify-center text-[10px] text-techTeal flex-shrink-0">
                      {idx + 1}
                    </div>
                    <span>{step}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* 4 & 6. Library & Pathways */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-lg font-bold text-clinicalWhite mb-4 flex items-center">
              <LineIcon name="layers" className="w-5 h-5 mr-2 text-techTeal" />
              Biblioteca Recomendada
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upeRecommendedLibrary.slice(0, 4).map((model, idx) => (
                <button 
                  key={idx} 
                  onClick={() => navigate(`/viewer/${model.id}`)}
                  className="text-left bg-slate-900/50 border border-slate-800 p-4 rounded-xl hover:border-techTeal/40 hover:bg-slate-900 transition group flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-clinicalWhite group-hover:text-techTeal transition">{model.name}</h3>
                    <p className="text-xs text-textMuted mt-1">{model.system}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-techTeal/20 transition">
                    <LineIcon name="play" className="w-4 h-4 text-slate-400 group-hover:text-techTeal" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-clinicalWhite mb-4 flex items-center">
              <LineIcon name="map" className="w-5 h-5 mr-2 text-techTeal" />
              Trilhas de Estudo
            </h2>
            <Card className="bg-blackDeep/40 border-slate-800 p-0 overflow-hidden">
              <div className="divide-y divide-slate-800">
                {upeStudyPathways.map((path, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-900/50 transition">
                    <div className="w-1/2">
                      <h3 className="text-sm font-bold text-clinicalWhite">{path.name}</h3>
                    </div>
                    <div className="w-1/3 px-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-textMuted">Progresso</span>
                        <span className="text-techTeal">{path.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div className="bg-techTeal h-1.5 rounded-full" style={{ width: `${path.progress}%` }}></div>
                      </div>
                    </div>
                    <div className="w-auto">
                      <button 
                        onClick={() => navigate("/models")}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-clinicalWhite px-3 py-1.5 rounded transition">
                        Continuar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 5. Pending Quizzes */}
          <div>
            <h2 className="text-lg font-bold text-clinicalWhite mb-4 flex items-center">
              <LineIcon name="edit-3" className="w-5 h-5 mr-2 text-techTeal" />
              Simulados Pendentes
            </h2>
            <div className="space-y-3">
              {upePendingQuizzes.map((quiz, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">
                      <LineIcon name="file-text" className="w-4 h-4 text-techTeal" />
                    </div>
                    <span className="text-sm font-medium text-clinicalWhite">{quiz.name}</span>
                  </div>
                  <button 
                    onClick={() => navigate("/quizzes")}
                    className="text-xs font-bold text-techTeal border border-techTeal/30 px-3 py-1.5 rounded hover:bg-techTeal/10 transition">
                    Iniciar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
