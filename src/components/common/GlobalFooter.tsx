import React from 'react';
import { Zap, Mail, Phone, MapPin } from 'lucide-react';

export const TEAM_MEMBERS = [
  {
    id: 'tm1',
    name: 'Mrs.C.Annapoorani',
    email: 'cvpoorani@gmail.com',
    phone: '+91 9176380194',
  },
  {
    id: 'tm2',
    name: 'Mr. S.VIGNESH',
    email: 'vicky366vj@gmail.com',
    phone: '+91 6381260699',
  },
  {
    id: 'tm3',
    name: 'Mr.Tarunkumar v',
    email: 'taruntk2008@gmail.com',
    phone: '+91 9025846979',
  },
  {
    id: 'tm4',
    name: 'Mr.YOGGESH N',
    email: 'yoggeshnr@gmail.com',
    phone: '+91 9791155317',
  },
  {
    id: 'tm5',
    name: 'Mr.Tamilselvan D',
    email: 'tamil3634786@gmail.com',
    phone: '+91 6384528015',
  },
];

interface GlobalFooterProps {
  className?: string;
}

export const GlobalFooter: React.FC<GlobalFooterProps> = ({ className = '' }) => {
  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer
      id="welcome-about-section"
      className={`relative z-10 border-t border-purple-500/15 bg-[#060411] pt-14 pb-10 px-4 sm:px-8 lg:px-10 ${className}`}
    >
      <div className="max-w-[1520px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-12">
          {/* Column 1: Brand, About Description & Social Icons */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#9333EA] to-[#6366F1] flex items-center justify-center shadow-[0_0_18px_rgba(147,51,234,0.45)] shrink-0">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                ExamFlow
              </span>
            </div>

            <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed max-w-xl">
              ExamFlow is a comprehensive digital examination and automated
              programming evaluation platform engineered to uphold academic
              integrity and streamline university assessments. Featuring a
              3-strike fullscreen proctoring lockdown, a real-time
              multi-language code execution sandbox (C, C++, Python, Java,
              JavaScript, and SQL), randomized per-candidate question banks,
              and automated merit certificate generation with one-click
              Section A–L single-PDF group downloads, ExamFlow empowers
              faculty and students in one unified arena.
            </p>

            <div className="text-[11px] text-purple-300/90 space-y-1 pt-1">
              <div>
                <strong className="text-white">Created &amp; Designed By:</strong>{' '}
                TarunKumar V &amp; Team
              </div>
              <div>
                <strong className="text-white">Developed By:</strong> 5-Member
                Student Development Team — Department of AI &amp; Data
                Science, Panimalar Engineering College (2025–2026)
              </div>
            </div>

            {/* Social Icon Buttons */}
            <div className="flex items-center gap-3 pt-1">
              {/* GitHub */}
              <button
                type="button"
                aria-label="GitHub"
                onClick={() => scrollToSection('welcome-about-section')}
                className="w-10 h-10 rounded-xl bg-[#160F29] hover:bg-[#21173C] border border-purple-500/20 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                aria-label="LinkedIn"
                onClick={() => scrollToSection('welcome-about-section')}
                className="w-10 h-10 rounded-xl bg-[#160F29] hover:bg-[#21173C] border border-purple-500/20 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <span className="text-xs font-extrabold tracking-tighter leading-none">
                  in
                </span>
              </button>

              {/* Discord */}
              <button
                type="button"
                aria-label="Discord"
                onClick={() => scrollToSection('welcome-about-section')}
                className="w-10 h-10 rounded-xl bg-[#160F29] hover:bg-[#21173C] border border-purple-500/20 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Column 2: CONTACT US (Institution + 5 Team Members' Name, Email, Phone) */}
          <div
            id="welcome-contact-section"
            className="lg:col-span-6 space-y-4"
          >
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              CONTACT US
            </h3>
            <ul className="space-y-3 text-xs sm:text-[13px] text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#A855F7] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Department of AI &amp; Data Science, Panimalar Engineering
                  College, Chennai
                </span>
              </li>
            </ul>

            {/* 5 Team Members Contact Directory (Name, Email, Phone — No Designations) */}
            <div className="space-y-2.5 pt-1">
              {TEAM_MEMBERS.map((member) => (
                <React.Fragment key={member.id}>
                  {member.id === 'tm1' && (
                    <div className="text-xs sm:text-sm font-extrabold text-white pt-1">
                      Mentored By:{' '}
                    </div>
                  )}
                  {member.id === 'tm3' && (
                    <div className="text-xs sm:text-sm font-extrabold text-white pt-2">
                      Developed By:{' '}
                    </div>
                  )}
                  <div className="rounded-xl bg-[#110C22] border border-purple-500/20 px-3.5 py-2.5 space-y-1">
                    <div className="text-xs font-extrabold text-white">
                      {member.name}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#A855F7] shrink-0" />
                        <span>{member.email}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-[#A855F7] shrink-0" />
                        <span>{member.phone}</span>
                      </span>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Legal Links Bar */}
        <div className="border-t border-white/10 pt-7 flex flex-col items-center justify-center text-center gap-3 text-[11px] sm:text-xs text-slate-500">
          <div className="text-center mx-auto">
            © 2026 ExamFlow Technologies Inc. All rights reserved.
          </div>
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => scrollToSection('welcome-about-section')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('welcome-about-section')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('welcome-about-section')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Cookie Settings
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
