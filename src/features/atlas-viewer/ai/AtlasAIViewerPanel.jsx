import React, { useState, useRef, useEffect } from 'react';
import Card from '../../../components/Card/Card';
import LineIcon from '../../../components/icons/LineIcon';
import { atlasViewerCommands } from './atlasViewerCommands';
import { useViewer } from '../../viewer/ViewerContext';
import AtlasTooltip from '../components/ux/AtlasTooltip';
import AtlasAIOrb from './AtlasAIOrb';
import AtlasAIImmersiveOverlay from './AtlasAIImmersiveOverlay';
import { atlasAITutorService } from './atlasAITutorService';
import { actionDictionary, executeTutorAction } from './atlasAITutorActions';

export default function AtlasAIViewerPanel({ isSketchfabMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: isSketchfabMode 
        ? 'Este modelo está sendo exibido via Sketchfab Embed temporário. O Tutor IA permanece disponível para orientação anatômica e estudo.' 
        : 'Olá, sou o Aeternum AI Tutor. Posso te ajudar a estudar este modelo, explicar marcadores anatômicos, orientar o uso do viewer e montar um caminho de revisão.'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [inputError, setInputError] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Study path state
  const [activeStudyPath, setActiveStudyPath] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const viewerContext = useViewer();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  // Handle global immersive state classes on body
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('tutor-immersive-active');
      if (isThinking) {
        document.body.classList.add('tutor-immersive-thinking');
      } else {
        document.body.classList.remove('tutor-immersive-thinking');
      }
    } else {
      document.body.classList.remove('tutor-immersive-active');
      document.body.classList.remove('tutor-immersive-thinking');
    }

    return () => {
      document.body.classList.remove('tutor-immersive-active');
      document.body.classList.remove('tutor-immersive-thinking');
    };
  }, [isOpen, isThinking]);

  const handleSendMessage = async (textOverride = null) => {
    const text = textOverride || inputValue;
    if (!text.trim()) {
      if (!textOverride) {
        setInputError(true);
        setTimeout(() => setInputError(false), 400);
      }
      return;
    }
    if (isThinking) return;

    // Add user message
    const userMsg = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);

    // Call local AI service
    try {
      const response = await atlasAITutorService.processMessage(text, viewerContext, messages);
      const aiMsg = { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        text: response.text,
        action: response.action,
        payload: response.payload
      };
      setMessages(prev => [...prev, aiMsg]);
      
      // Auto-execute check
      if (response.action) {
        const actionConfig = actionDictionary[response.action];
        if (actionConfig && actionConfig.autoExecute) {
          executeTutorAction(response.action, response.payload, viewerContext);
        }
      }
    } catch (error) {
      console.error("AI Tutor Error:", error);
      const errorMsg = { id: (Date.now() + 1).toString(), sender: 'ai', text: "Desculpe, ocorreu um erro ao processar sua solicitação." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleActionClick = async (actionId, payload) => {
    // Intercept Study Path Logic
    if (actionId === 'START_STUDY_PATH' || actionId === 'SHOW_STUDY_PATH') {
      const { generateStudyPaths } = await import('./atlasAIStudyPaths');
      const paths = generateStudyPaths(viewerContext.markers);
      
      if (!paths.length) {
         setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: "Não há trilhas configuradas ou marcadores suficientes neste modelo." }]);
         return;
      }
      
      if (actionId === 'SHOW_STUDY_PATH') {
         // User requested to see paths
         const pathText = paths.map((p, i) => `**${i+1}. ${p.title}**\n${p.description}`).join('\n\n');
         setMessages(prev => [...prev, { 
           id: Date.now().toString(), 
           sender: 'ai', 
           text: `Encontrei as seguintes trilhas:\n\n${pathText}`,
           action: 'START_STUDY_PATH',
           payload: paths[0].id // Suggest the first one by default
         }]);
         return;
      }

      // START_STUDY_PATH
      const chosenPath = paths.find(p => p.id === payload) || paths[0];
      setActiveStudyPath(chosenPath);
      setCurrentStepIndex(0);
      
      const firstStep = chosenPath.steps[0];
      
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        sender: 'ai', 
        text: `Iniciando a trilha **${chosenPath.title}**.\n\nPasso 1: **${firstStep.title || firstStep.name}**\n${firstStep.description || ''}`,
        action: 'NEXT_STUDY_STEP'
      }]);
      
      // Auto-focus on first step if possible
      executeTutorAction('FOCUS_MARKER', firstStep.id || `marker-${firstStep.title}`, viewerContext);
      return;
    }

    if (actionId === 'NEXT_STUDY_STEP') {
       if (!activeStudyPath) return;
       
       const nextIndex = currentStepIndex + 1;
       if (nextIndex >= activeStudyPath.steps.length) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3500);
          
          setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            sender: 'ai', 
            text: `Parabéns! Você completou a trilha **${activeStudyPath.title}**.`,
            action: 'START_PRACTICAL_QUIZ'
          }]);
          setActiveStudyPath(null);
          setCurrentStepIndex(0);
          return;
       }
       
       setCurrentStepIndex(nextIndex);
       const step = activeStudyPath.steps[nextIndex];
       
       setMessages(prev => [...prev, { 
         id: Date.now().toString(), 
         sender: 'ai', 
         text: `Passo ${nextIndex + 1}: **${step.title || step.name}**\n${step.description || ''}`,
         action: 'NEXT_STUDY_STEP'
       }]);
       
       executeTutorAction('FOCUS_MARKER', step.id || `marker-${step.title}`, viewerContext);
       return;
    }

    const success = executeTutorAction(actionId, payload, viewerContext);
    
    if (!success) {
      const errorMsg = { 
        id: Date.now().toString(), 
        sender: 'ai', 
        text: "Essa ação ainda não está disponível neste visualizador." 
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "Explique este modelo",
    "Como devo estudar?",
    "Como usar o viewer?"
  ];

  // Determine Orb State
  let orbState = 'idle';
  if (isOpen) orbState = 'listening';
  if (isThinking) orbState = 'thinking';

  return (
    <>
      <AtlasAIImmersiveOverlay isActive={isOpen} state={orbState} />
      
      {showConfetti && (
        <div className="celebration-container">
          {[...Array(50)].map((_, i) => (
            <div 
              key={i} 
              className={`aeternum-confetti ${Math.random() > 0.5 ? 'gold' : ''} ${Math.random() > 0.7 ? 'blue' : ''} ${Math.random() > 0.5 ? 'circle' : ''}`}
              style={{
                left: `${Math.random() * 100}vw`,
                animationDelay: `${Math.random() * 0.5}s`,
                transform: `scale(${Math.random() * 0.5 + 0.5})`
              }}
            />
          ))}
        </div>
      )}

      <div className={`fixed z-[60] transition-all duration-500 ease-in-out pointer-events-none flex flex-col items-end gap-3 ${
        isOpen ? 'bottom-36 right-6 sm:bottom-36 sm:right-10' : 'bottom-32 right-6 sm:bottom-32 sm:right-6'
      }`}>
        {isOpen && (
          <Card className="w-[calc(100vw-16px)] sm:w-96 h-[75dvh] sm:h-auto sm:max-h-[70dvh] flex flex-col bg-blackDeep/95 backdrop-blur-xl border border-techTeal/30 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(35,210,179,0.1)] animate-in slide-in-from-bottom-5 mb-1 sm:mb-2 pointer-events-auto rounded-2xl overflow-hidden shrink-0">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-techTeal/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-techTeal/20 flex items-center justify-center border border-techTeal/40 shadow-[0_0_10px_rgba(35,210,179,0.2)]">
                  <span className="text-techTeal font-bold text-sm">AI</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-clinicalWhite">Atlas AI Tutor</h3>
                  <p className="text-[10px] uppercase tracking-wider text-techTeal">
                    {isThinking ? "Analisando..." : "Pronto para orientar"}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors" aria-label="Fechar Tutor IA">
                <LineIcon name="close" className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.map((msg) => {
                const hasAction = msg.action && actionDictionary[msg.action];
                const isAuto = hasAction && actionDictionary[msg.action].autoExecute;
                const shouldRenderButton = hasAction && !isAuto;

                return (
                  <div key={msg.id} className={`flex flex-col gap-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div 
                      className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-white/10 text-white rounded-tr-sm border border-white/5' 
                          : 'bg-techTeal/10 text-clinicalWhite rounded-tl-sm border border-techTeal/20 shadow-[0_4px_15px_rgba(35,210,179,0.05)]'
                      }`}
                    >
                      <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                    </div>
                    
                    {shouldRenderButton && (
                      <button 
                        onClick={() => handleActionClick(msg.action, msg.payload)}
                        className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-techTeal/20 hover:bg-techTeal/30 border border-techTeal/40 text-techTeal text-xs rounded-lg transition-colors cursor-pointer invitation-to-act"
                      >
                        <LineIcon name="play" className="w-3 h-3" />
                        {actionDictionary[msg.action].label}
                      </button>
                    )}
                  </div>
                );
              })}
              
              {isThinking && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-sm bg-techTeal/10 text-techTeal text-xs border border-techTeal/20 flex items-center gap-1.5 shadow-[0_4px_15px_rgba(35,210,179,0.05)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-techTeal typing-dot"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-techTeal typing-dot"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-techTeal typing-dot"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions (only if no messages beyond welcome or if idle) */}
            {!isThinking && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-white/10 bg-white/5 hover:bg-techTeal/20 hover:border-techTeal/40 hover:text-techTeal transition-all text-slate-300"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 border-t border-white/10 bg-blackDeep/50 flex gap-2 items-end">
              <textarea
                className={`flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-techTeal/50 focus:bg-white/10 resize-none transition-all scrollbar-thin ${inputError ? 'error-shake border-red-500/50' : ''}`}
                rows={1}
                placeholder="Pergunte ao AI Tutor..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ minHeight: '40px', maxHeight: '100px' }}
              />
              <button 
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isThinking}
                className="w-10 h-10 rounded-xl bg-techTeal text-blackDeep flex items-center justify-center hover:bg-techTeal/90 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                <LineIcon name="send" className="w-5 h-5 ml-0.5" />
              </button>
            </div>
          </Card>
        )}

        <div className="pointer-events-auto">
          <AtlasTooltip content={isOpen ? "Fechar AI Tutor" : "Atlas AI Tutor"} position="top">
            <AtlasAIOrb 
              onClick={() => setIsOpen(!isOpen)} 
              state={orbState}
              size={isOpen ? "sm" : "md"}
            />
          </AtlasTooltip>
        </div>
      </div>
    </>
  );
}
