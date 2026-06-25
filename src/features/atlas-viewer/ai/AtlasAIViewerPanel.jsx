import React, { useState, useRef, useEffect } from 'react';
import Card from '../../../components/Card/Card';
import LineIcon from '../../../components/icons/LineIcon';
import { atlasViewerCommands } from './atlasViewerCommands';
import { useViewer } from '../../viewer/ViewerContext';
import AtlasTooltip from '../components/ux/AtlasTooltip';
import AtlasAIOrb from './AtlasAIOrb';
import { atlasAITutorService } from './atlasAITutorService';
import { actionDictionary, executeTutorAction } from './atlasAITutorActions';

export default function AtlasAIViewerPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Olá, sou o Aeternum AI Tutor. Posso te ajudar a estudar este modelo, explicar marcadores anatômicos, orientar o uso do viewer e montar um caminho de revisão.'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  
  const viewerContext = useViewer();
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  const handleCommand = (commandType, payload = null) => {
    switch (commandType) {
      case 'focusMarker':
        atlasViewerCommands.focusMarker(payload);
        break;
      case 'focusStructure':
        atlasViewerCommands.focusStructure(payload);
        break;
      case 'resetCamera':
        atlasViewerCommands.resetCamera();
        break;
      case 'openAnnotation':
        atlasViewerCommands.openAnnotation(payload);
        break;
      default:
        console.warn('Unknown AI command:', commandType);
    }
  };

  const handleSendMessage = async (textOverride = null) => {
    const text = textOverride || inputValue;
    if (!text.trim() || isThinking) return;

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

  const handleActionClick = (actionId, payload) => {
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
    <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-3 fade-in-up pointer-events-none">
      {isOpen && (
        <Card className="w-80 sm:w-96 max-h-[70vh] flex flex-col bg-blackDeep/95 backdrop-blur-xl border border-techTeal/30 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(35,210,179,0.1)] animate-in slide-in-from-bottom-5 mb-2 pointer-events-auto rounded-2xl overflow-hidden">
          
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
                      className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-techTeal/20 hover:bg-techTeal/30 border border-techTeal/40 text-techTeal text-xs rounded-lg transition-colors cursor-pointer"
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
                <div className="max-w-[85%] p-3 rounded-2xl rounded-tl-sm bg-techTeal/10 text-techTeal text-xs border border-techTeal/20 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-techTeal animate-ping"></span>
                  Aeternum está analisando...
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
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-techTeal/50 focus:bg-white/10 resize-none transition-all scrollbar-thin"
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
  );
}
