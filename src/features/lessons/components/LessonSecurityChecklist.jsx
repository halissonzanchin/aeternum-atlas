import React from 'react';

export default function LessonSecurityChecklist({ security }) {
  if (!security) return null;

  const CheckItem = ({ label, passed, critical = false }) => (
    <div className="flex items-start gap-3 py-1">
      <span className={`shrink-0 mt-0.5 font-bold ${passed ? (critical ? 'text-techTeal' : 'text-gray-400') : 'text-red-500'}`}>
        {passed ? '✓' : '✗'}
      </span>
      <span className={`text-sm ${passed ? 'text-gray-300' : 'text-red-400'}`}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-clinicalWhite mb-3 uppercase tracking-widest border-b border-white/10 pb-2">
        Security Audit
      </h4>
      <CheckItem 
        label="Sandbox uses 'allow-scripts' only" 
        passed={security.allowsScripts && !security.allowsSameOrigin} 
        critical={true}
      />
      <CheckItem 
        label="No 'allow-same-origin' leakage" 
        passed={!security.allowsSameOrigin} 
        critical={true}
      />
      <CheckItem 
        label="No external assets fetched" 
        passed={!security.usesExternalAssets} 
      />
      <CheckItem 
        label="Asset budget approved (<25MB)" 
        passed={security.assetBudgetPassed} 
      />
      <CheckItem 
        label="3D GLB Optimized" 
        passed={!security.usesGlb || (security.usesGlb && security.assetBudgetPassed)} 
      />
    </div>
  );
}
