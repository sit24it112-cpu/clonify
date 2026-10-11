import React from 'react';

interface ClonifyLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const ClonifyLogo: React.FC<ClonifyLogoProps> = ({
  size = 'md',
  showText = true,
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12'
  }[size];

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  }[size];

  return (
    <div className={`flex items-center gap-3 shrink-0 ${className}`}>
      {/* Custom Vector Icon for Clonify: Dual Mirror Clone Glyphs + Scan Reticle */}
      <div
        className={`${iconSizes} rounded-xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white flex items-center justify-center shadow-sm relative overflow-hidden border border-indigo-700/30 shrink-0`}
      >
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-radial from-cyan-500/20 to-transparent pointer-events-none" />

        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-cyan-400 relative z-10"
        >
          {/* First Code Document / Bracket */}
          <path
            d="M9 7L5 12L9 17"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Second Cloned Code Bracket (Offset to show duplicate detection) */}
          <path
            d="M23 15L27 20L23 25"
            stroke="#6366F1"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Scanning / Similarity Connection Bridge */}
          <path
            d="M19 7L13 25"
            stroke="#38BDF8"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="opacity-90"
          />
          {/* Matching Anchor Nodes */}
          <circle cx="10" cy="12" r="1.5" fill="#38BDF8" />
          <circle cx="22" cy="20" r="1.5" fill="#818CF8" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`${textSizes} font-bold tracking-tight text-slate-900 leading-none whitespace-nowrap`}>
              Clonify
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.2">
              AI
            </span>
          </div>
          <span className="text-[11px] text-slate-500 whitespace-nowrap mt-0.5 leading-tight">
            Code Similarity & Plagiarism Detector
          </span>
        </div>
      )}
    </div>
  );
};
