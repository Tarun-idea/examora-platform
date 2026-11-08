import React from 'react';

interface InstitutionalHeaderBrandProps {
  logoUrl?: string;
  arenaSubtitle?: string;
  compact?: boolean;
}

export const InstitutionalHeaderBrand: React.FC<InstitutionalHeaderBrandProps> = ({
  logoUrl,
  arenaSubtitle,
  compact = false,
}) => {
  const effectiveLogo =
    logoUrl && logoUrl.trim() ? logoUrl : '/assets/panimalar-crest.png';

  return (
    <div className="flex items-center gap-4 sm:gap-6 shrink-0 select-none">
      {/* Left: Panimalar Crest + Institutional Title & Department (No Box Borders or Middle Lines) */}
      <div className="flex items-center gap-3">
        <img
          src={effectiveLogo}
          alt="Panimalar Engineering College Emblem"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.endsWith('/assets/panimalar-crest.png')) {
              target.src = '/assets/panimalar-crest.png';
            }
          }}
          className={`${
            compact ? 'w-12 h-12' : 'w-13 h-13 sm:w-14 sm:h-14'
          } object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(255,255,255,0.18)]`}
        />

        <div className="flex flex-col justify-center leading-tight">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`${
                compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
              } font-black tracking-wide text-white uppercase leading-none`}
            >
              PANIMALAR
            </span>
            <span
              className={`${
                compact ? 'text-[10px] sm:text-[11px]' : 'text-[11px] sm:text-xs'
              } font-extrabold tracking-wider text-slate-100 uppercase leading-none`}
            >
              ENGINEERING COLLEGE
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="px-1.5 py-0.5 bg-[#D91B24] text-white text-[9px] font-extrabold tracking-wide rounded-xs leading-none">
              An Autonomous Institution
            </span>
            <span className="text-[9px] sm:text-[10px] font-medium text-slate-300 leading-none hidden sm:inline">
              Affiliated to Anna University, Chennai
            </span>
          </div>

          <div className="text-[10px] sm:text-[11px] font-bold text-cyan-300 tracking-wide mt-1 leading-none">
            Department of AI and Data Science
          </div>
        </div>
      </div>

      {/* Right: ExamFlow Brand Wordmark (Clean, No Divider Line) */}
      <div className="flex flex-col justify-center shrink-0 pl-1">
        <div
          className={`${
            compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
          } font-extrabold tracking-tight text-white leading-none`}
        >
          Exam
          <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Flow
          </span>
        </div>
        {arenaSubtitle && (
          <div className="text-[10px] sm:text-[11px] font-medium text-slate-400 mt-1 leading-none">
            {arenaSubtitle}
          </div>
        )}
      </div>
    </div>
  );
};
