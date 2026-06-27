import React, { useRef, useEffect } from 'react';
import LineIcon from '../../../components/icons/LineIcon';
import { useAtlasViewer } from '../context/AtlasViewerContext';

export default function AtlasAiChatPanel() {
  const { aiChatHistory, aiIsTyping } = useAtlasViewer();
  const chatEndRef = useRef(null);

  // Auto-scroll sempre que um histórico for atualizado
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiChatHistory, aiIsTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar animate-fade-in-up flex flex-col">
      
      {aiChatHistory.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
          <LineIcon name="message-square" className="w-12 h-12 text-indigo-400 mb-4" />
          <p className="text-sm text-clinicalWhite max-w-xs atlas-text-safe atlas-text-balance">
            Nenhuma conversa ativa. Envie uma pergunta ou selecione uma sugestão do Tutor IA.
          </p>
        </div>
      ) : (
        <div className="space-y-6 flex-1">
          {aiChatHistory.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] rounded-2xl p-4 ${
                  msg.role === 'user' 
                    ? 'bg-techTeal text-black rounded-tr-sm shadow-md' 
                    : 'bg-white/10 text-clinicalWhite rounded-tl-sm border border-white/10 shadow-premium'
                }`}
              >
                {msg.role === 'tutor' && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                    <LineIcon name="cpu" className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                      Aeternum Tutor
                    </span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed atlas-text-safe atlas-fluid-body">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {aiIsTyping && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm p-4 bg-white/5 border border-white/10 flex items-center gap-2 text-textMuted">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="text-xs ml-2 atlas-nowrap-label">Processando contexto local...</span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>
      )}
    </div>
  );
}
