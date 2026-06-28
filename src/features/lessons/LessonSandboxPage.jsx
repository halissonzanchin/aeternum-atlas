import React from 'react';
import { useLanguage } from "../../context/LanguageContext";
import { lessonManifests } from "../../data/lessonManifests";
import LessonIframeSandbox from "./components/LessonIframeSandbox";
export default function LessonSandboxPage() {
  const { t } = useLanguage();
  
  // Para fins de protótipo, carregaremos o primeiro manifesto que é o draft sandbox
  const manifest = lessonManifests[0];

  return (
    <div className="flex flex-col h-full space-y-6 w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8 animate-fade-in-up">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold uppercase tracking-widest mb-3">
            ⚠️ Protótipo Interno / Conteúdo Isolado
          </span>
          <h1 className="text-3xl md:text-4xl font-light text-clinicalWhite tracking-tight">
            Aeternum Lesson Player
          </h1>
          <p className="text-textMuted mt-2 text-lg">
            Sandbox seguro para embed de aulas HTML estáticas
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[600px]">
        
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="atlas-liquid-glass-card p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-clinicalWhite font-semibold text-lg border-b border-white/10 pb-2">
              Checklist de Segurança
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-textMuted">
                <span className="text-techTeal shrink-0 mt-0.5">✓</span>
                <span>Iframe sandbox ativo ({manifest.sandboxPolicy})</span>
              </li>
              <li className="flex items-start gap-3 text-textMuted">
                <span className="text-techTeal shrink-0 mt-0.5">✓</span>
                <span>Sem `allow-same-origin` (origem nula)</span>
              </li>
              <li className="flex items-start gap-3 text-textMuted">
                <span className="text-techTeal shrink-0 mt-0.5">✓</span>
                <span>Sem `dangerouslySetInnerHTML`</span>
              </li>
              <li className="flex items-start gap-3 text-textMuted">
                <span className="text-techTeal shrink-0 mt-0.5">✓</span>
                <span>Deck URL restrita ao bucket local</span>
              </li>
              <li className="flex items-start gap-3 text-textMuted">
                <span className="text-techTeal shrink-0 mt-0.5">✓</span>
                <span>Status da Lesson: <span className="uppercase text-gold font-bold">{manifest.status}</span></span>
              </li>
            </ul>
          </div>

          <div className="atlas-liquid-glass-card p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-clinicalWhite font-semibold text-lg border-b border-white/10 pb-2">
              Detalhes da Aula
            </h3>
            <div className="space-y-2 text-sm text-textMuted">
              <p><strong className="text-gray-300">ID:</strong> {manifest.lessonId}</p>
              <p><strong className="text-gray-300">Tópico:</strong> {manifest.subject}</p>
              <p><strong className="text-gray-300">Versão:</strong> {manifest.version}</p>
              <p><strong className="text-gray-300">Budget (MB):</strong> {manifest.assetBudgetMb}</p>
              <p><strong className="text-gray-300">GLB Embed:</strong> {manifest.usesGlb ? "Sim" : "Não"}</p>
            </div>
          </div>
        </div>

        {/* Player Iframe */}
        <div className="lg:col-span-3 h-[600px] lg:h-full min-h-[600px] flex">
          <LessonIframeSandbox manifest={manifest} />
        </div>

      </div>
    </div>
  );
}
