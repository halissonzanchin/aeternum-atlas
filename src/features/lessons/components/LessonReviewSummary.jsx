import React from 'react';

export default function LessonReviewSummary({ review }) {
  if (!review) return null;

  const StatusItem = ({ label, status }) => {
    let colorClass = "text-gray-400";
    let statusText = status;
    
    if (status === 'approved') {
      colorClass = "text-techTeal";
      statusText = "Aprovado";
    } else if (status === 'pending') {
      colorClass = "text-gold";
      statusText = "Pendente";
    } else if (status === 'rejected') {
      colorClass = "text-red-400";
      statusText = "Rejeitado";
    }

    return (
      <div className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
        <span className="text-sm text-gray-300">{label}</span>
        <span className={`text-xs font-bold uppercase ${colorClass}`}>{statusText}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-clinicalWhite uppercase tracking-widest border-b border-white/10 pb-2">
        Status Editorial
      </h4>
      
      <div className="space-y-1 bg-black/20 p-3 rounded-lg border border-white/5">
        <StatusItem label="Análise Técnica (HTML/CSS)" status={review.technicalStatus} />
        <StatusItem label="Rigor Anatômico" status={review.anatomicalStatus} />
        <StatusItem label="Auditoria de Segurança" status={review.securityStatus} />
      </div>
      
      {review.reviewerNotes && (
        <div className="mt-3 p-3 bg-blue-900/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-200/80 font-mono italic">
            " {review.reviewerNotes} "
          </p>
        </div>
      )}
    </div>
  );
}
