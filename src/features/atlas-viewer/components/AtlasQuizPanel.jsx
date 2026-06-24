import React, { useState, useEffect } from 'react';
import LineIcon from '../../../components/icons/LineIcon';
import { useAtlasViewer } from '../context/AtlasViewerContext';
import { getQuizzesForStructure } from '../../../data/atlasQuizRegistry';
import { recordQuizAnswer, getQuizSession } from '../../../utils/AtlasQuizSession';
import { atlasEventBus, ENGINE_EVENTS } from '../engine/atlasEngineEvents';
import { atlasAnalyticsService } from '../../../services/atlasAnalyticsService';
import { getCurrentUser } from '../../../services/auth/authService';

export default function AtlasQuizPanel({ targetId }) {
  const { analytics } = useAtlasViewer();
  const [quizzes, setQuizzes] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [startTime, setStartTime] = useState(0);

  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });

  useEffect(() => {
    if (targetId) {
      const related = getQuizzesForStructure(targetId);
      setQuizzes(related);
      setCurrentQuizIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setSessionStats({ correct: 0, incorrect: 0 });
      
      if (related.length > 0) {
        setStartTime(Date.now());
        analytics.trackQuizStart(related[0].quizId);
        atlasEventBus.emit(ENGINE_EVENTS.QUIZ_STARTED, { quizId: related[0].quizId });
      }
    }
  }, [targetId, analytics]);

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center opacity-50">
        <LineIcon name="check-circle" className="w-12 h-12 text-teal-400 mb-4" />
        <p className="text-sm text-clinicalWhite max-w-xs">
          Não há questões ativas para esta estrutura no momento.
        </p>
      </div>
    );
  }

  const currentQuiz = quizzes[currentQuizIndex];
  const isLastQuestion = currentQuizIndex === quizzes.length - 1;

  const handleSelectOption = (optId) => {
    if (isAnswered) return;
    setSelectedOption(optId);
  };

  const handleSubmit = () => {
    if (!selectedOption || isAnswered) return;

    const timeSpentMs = Date.now() - startTime;
    const isCorrect = selectedOption === currentQuiz.correctAnswer;
    
    setIsAnswered(true);
    
    setSessionStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));

    const finalSession = recordQuizAnswer(currentQuiz.quizId, isCorrect, timeSpentMs);
    analytics.trackQuizAnswer(currentQuiz.quizId, isCorrect, timeSpentMs);
    
    if (isCorrect) atlasEventBus.emit(ENGINE_EVENTS.QUIZ_CORRECT, { quizId: currentQuiz.quizId });
    else atlasEventBus.emit(ENGINE_EVENTS.QUIZ_INCORRECT, { quizId: currentQuiz.quizId });

    if (isLastQuestion && finalSession) {
      const user = getCurrentUser();
      if (user && user.id) {
        atlasAnalyticsService.syncQuizResult({
          quizId: targetId, // O targetId aqui é a estrutura/grupo. Ideal seria syncar o resultado agregado.
          stats: finalSession.stats,
          answers: finalSession.answers
        }, user.id);
      }
    }
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setStartTime(Date.now());
      
      const nextQuizId = quizzes[currentQuizIndex + 1].quizId;
      analytics.trackQuizStart(nextQuizId);
      atlasEventBus.emit(ENGINE_EVENTS.QUIZ_STARTED, { quizId: nextQuizId });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar animate-fade-in flex flex-col">
      
      {/* Indicador de Progresso */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-1">
          {quizzes.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 w-6 rounded-full transition-colors ${
                idx === currentQuizIndex 
                  ? 'bg-teal-400' 
                  : idx < currentQuizIndex 
                    ? 'bg-teal-400/30' 
                    : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-textMuted">
          Questão {currentQuizIndex + 1} de {quizzes.length}
        </div>
      </div>

      <div className="flex-1">
        
        {/* Cabeçalho da Questão */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
              currentQuiz.difficultyLevel === 'Fácil' ? 'bg-green-500/20 text-green-400' :
              currentQuiz.difficultyLevel === 'Difícil' ? 'bg-red-500/20 text-red-400' :
              'bg-amber-500/20 text-amber-400'
            }`}>
              {currentQuiz.difficultyLevel}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white leading-snug">
            {currentQuiz.question}
          </h3>
        </div>

        {/* Alternativas */}
        <div className="space-y-3 mb-8">
          {currentQuiz.options.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isCorrectAnswer = opt.id === currentQuiz.correctAnswer;
            
            let bgClass = 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 text-white cursor-pointer';
            
            if (isAnswered) {
              if (isCorrectAnswer) {
                bgClass = 'bg-green-500/20 border-green-500/50 text-green-100 cursor-default';
              } else if (isSelected && !isCorrectAnswer) {
                bgClass = 'bg-red-500/20 border-red-500/50 text-red-100 cursor-default';
              } else {
                bgClass = 'bg-white/5 border-white/5 text-textMuted cursor-default opacity-50';
              }
            } else if (isSelected) {
              bgClass = 'bg-teal-500/20 border-teal-500/50 text-teal-100 cursor-pointer';
            }

            return (
              <div 
                key={opt.id}
                onClick={() => handleSelectOption(opt.id)}
                className={`p-4 rounded-xl border transition-all duration-300 flex items-start gap-3 ${bgClass}`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  isAnswered && isCorrectAnswer ? 'bg-green-500 border-green-400' :
                  isAnswered && isSelected && !isCorrectAnswer ? 'bg-red-500 border-red-400' :
                  isSelected && !isAnswered ? 'border-teal-400 bg-teal-400/20' : 'border-white/30'
                }`}>
                  {isAnswered && isCorrectAnswer && <LineIcon name="check" className="w-3 h-3 text-black" />}
                  {isAnswered && isSelected && !isCorrectAnswer && <LineIcon name="x" className="w-3 h-3 text-black" />}
                </div>
                <span className="text-sm leading-relaxed">{opt.text}</span>
              </div>
            );
          })}
        </div>

        {/* Feedback / Explicação */}
        {isAnswered && (
          <div className="animate-fade-in-up mb-6">
            <div className={`p-4 rounded-xl border ${selectedOption === currentQuiz.correctAnswer ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${selectedOption === currentQuiz.correctAnswer ? 'text-green-400' : 'text-red-400'}`}>
                <LineIcon name={selectedOption === currentQuiz.correctAnswer ? "check-circle" : "alert-triangle"} className="w-4 h-4" />
                {selectedOption === currentQuiz.correctAnswer ? 'Correto!' : 'Incorreto'}
              </h4>
              <p className="text-sm text-clinicalWhite leading-relaxed">
                {currentQuiz.explanation}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Ações / Footer */}
      <div className="pt-4 border-t border-white/10 shrink-0">
        {!isAnswered ? (
          <button 
            onClick={handleSubmit}
            disabled={!selectedOption}
            className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:bg-white/5 disabled:text-textMuted text-black font-bold rounded-xl transition-colors disabled:cursor-not-allowed"
          >
            Confirmar Resposta
          </button>
        ) : !isLastQuestion ? (
          <button 
            onClick={handleNext}
            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
          >
            Próxima Questão
          </button>
        ) : (
          <div className="p-4 bg-premiumDark rounded-xl border border-white/10 text-center animate-fade-in">
            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-2">Quiz Concluído</h4>
            <div className="flex justify-center gap-6 mb-4">
              <div className="text-center">
                <div className="text-2xl font-black text-green-400">{sessionStats.correct}</div>
                <div className="text-[10px] text-textMuted uppercase">Acertos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-red-400">{sessionStats.incorrect}</div>
                <div className="text-[10px] text-textMuted uppercase">Erros</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-white">
                  {Math.round((sessionStats.correct / quizzes.length) * 100)}%
                </div>
                <div className="text-[10px] text-textMuted uppercase">Precisão</div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
