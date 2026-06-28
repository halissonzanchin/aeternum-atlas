import React from 'react';

export default function LessonStatusBadge({ status }) {
  let badgeStyle = "bg-gray-500/20 text-gray-300 border-gray-500/30";
  let displayStatus = status;

  switch (status) {
    case 'published':
      badgeStyle = "bg-techTeal/10 text-techTeal border-techTeal/30";
      displayStatus = "Published";
      break;
    case 'draft':
      badgeStyle = "bg-gold/10 text-gold border-gold/30";
      displayStatus = "Draft (Sandbox)";
      break;
    case 'technical_review':
      badgeStyle = "bg-blue-500/10 text-blue-400 border-blue-500/30";
      displayStatus = "Technical Review";
      break;
    case 'anatomical_review':
      badgeStyle = "bg-purple-500/10 text-purple-400 border-purple-500/30";
      displayStatus = "Anatomical Review";
      break;
    case 'security_review':
      badgeStyle = "bg-red-500/10 text-red-400 border-red-500/30";
      displayStatus = "Security Review";
      break;
    case 'archived':
      badgeStyle = "bg-black text-gray-500 border-gray-700";
      displayStatus = "Archived";
      break;
    default:
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeStyle}`}>
      {displayStatus}
    </span>
  );
}
