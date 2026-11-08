import React, { useState } from 'react';
import {
  Play,
  ArrowRight,
  Zap,
  TrendingUp,
  Trophy,
  Search,
  BarChart3,
} from 'lucide-react';
import { examStore } from '../../services/examStore.ts';
import { InstitutionalHeaderBrand } from '../common/InstitutionalHeaderBrand.tsx';
import { GlobalFooter } from '../common/GlobalFooter.tsx';

interface WelcomeLandingPageProps {
  onNavigateToLogin: (role?: 'admin' | 'student') => void;
}

export const WelcomeLandingPage: React.FC<WelcomeLandingPageProps> = ({
  onNavigateToLogin,
}) => {
  const state = examStore.getState();
  const collegeLogoUrl = state.settings.collegeLogoUrl || '';
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigateToLogin('student');
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#06071B] text-white selection:bg-purple-600 selection:text-white overflow-x-hidden relative flex flex-col">
      {/* Ambient Cosmic Nebulae */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 left-1/4 w-[520px] h-[520px] rounded-full bg-purple-700/20 blur-[130px]" />
        <div className="absolute top-24 right-10 w-[460px] h-[460px] rounded-full bg-cyan-500/15 blur-[130px]" />
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] rounded-full bg-indigo-700/20 blur-[140px]" />
      </div>

      {/* Sleek Full-Width Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-purple-500/25 bg-[#080A24]/95 backdrop-blur-xl">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-10 py-2.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
          <InstitutionalHeaderBrand logoUrl={collegeLogoUrl} />

          {/* Quick Header Scroll Links */}
          <nav
            aria-label="Welcome Page Navigation"
            className="hidden md:flex items-center gap-1.5 bg-[#12163D]/90 border border-purple-500/30 rounded-full px-3 py-1.5"
          >
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-200 hover:text-white hover:bg-purple-500/20 transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('welcome-about-section')}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-purple-200 hover:text-white hover:bg-purple-500/20 transition-colors cursor-pointer"
            >
              About &amp; Team
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('welcome-contact-section')}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-cyan-200 hover:text-white hover:bg-purple-500/20 transition-colors cursor-pointer"
            >
              Contact Us
            </button>
          </nav>

          {/* Right Search & Portal Login Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <form
              onSubmit={handleSearchSubmit}
              className="relative hidden xl:block w-56"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assessments..."
                className="w-full pl-9 pr-3 py-2 rounded-full bg-[#12163D] border border-purple-500/35 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </form>

            <button
              type="button"
              onClick={() => onNavigateToLogin('student')}
              className="px-4 py-2 rounded-full bg-[#141844] hover:bg-[#1D225E] border border-purple-500/35 text-xs font-bold text-purple-200 transition-all cursor-pointer whitespace-nowrap"
            >
              Student Login
            </button>

            <button
              type="button"
              onClick={() => onNavigateToLogin('admin')}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] hover:from-[#8B5CF6] hover:to-[#6366F1] text-xs font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.45)] transition-all cursor-pointer whitespace-nowrap"
            >
              Admin Login
            </button>
          </div>
        </div>
      </header>

      {/* Main Full-Width Content Container */}
      <main className="relative z-10 flex-1 max-w-[1520px] w-full mx-auto px-4 sm:px-8 lg:px-10 py-8 sm:py-10 space-y-12">
        {/* Hero Section */}
        <section className="w-full rounded-3xl bg-gradient-to-br from-[#0B0E2E]/95 via-[#0E1238]/95 to-[#080A22]/95 border border-purple-500/30 p-8 sm:p-14 shadow-[0_20px_60px_rgba(5,6,24,0.85)] relative overflow-hidden">
          {/* Cosmic Horizon Glow inside Hero */}
          <div className="pointer-events-none absolute -right-20 -top-20 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-blue-600/25 via-purple-600/25 to-transparent blur-3xl" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left Column Copy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#151A4A] border border-purple-500/35 text-xs font-semibold text-purple-200">
                <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                <span>Learn • Practice • Compete</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.06]">
                <span className="block text-white">Dream Big.</span>
                <span className="block mt-1 bg-gradient-to-r from-[#C084FC] via-[#818CF8] to-[#38BDF8] bg-clip-text text-transparent">
                  Crack It.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed">
                Your ultimate platform for university examinations, coding
                competitions, proctored evaluations, and verifiable achievement
                certificates.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigateToLogin('student')}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#4F46E5] hover:from-[#9333EA] hover:to-[#6366F1] text-white font-bold text-sm shadow-[0_0_28px_rgba(124,58,237,0.55)] transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Start Practicing</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToLogin('admin')}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#11153A]/90 hover:bg-[#191F52] border border-purple-400/35 text-white font-bold text-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <span className="w-6 h-6 rounded-full bg-white text-[#0B0E2E] flex items-center justify-center">
                    <Play className="w-3 h-3 fill-[#0B0E2E] ml-0.5" />
                  </span>
                  <span>Admin Control Center</span>
                </button>
              </div>

              {/* 3 Hero Metrics Strip (Live Platform State) */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-purple-500/20 max-w-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-extrabold text-white font-mono tabular-nums">
                      {state.students.length}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Enrolled Students
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-extrabold text-white font-mono tabular-nums">
                      {state.exams.length}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Live Examinations
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-extrabold text-white font-mono tabular-nums">
                      A–L
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Cohort Sections
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column 3D-Styled Holographic Laptop, Trophy & Analytics Visual */}
            <div className="lg:col-span-6 relative flex items-center justify-center min-h-[340px]">
              {/* Glowing Planetary Backdrop Circle */}
              <div className="w-72 h-72 sm:w-88 sm:h-88 rounded-full bg-gradient-to-tr from-[#1D2671] via-[#271766] to-[#0EA5E9]/40 border border-cyan-400/30 shadow-[0_0_90px_rgba(56,189,248,0.28)] flex items-center justify-center relative">
                {/* Floating Left Analytics Card */}
                <div className="absolute -left-4 sm:-left-10 -top-2 z-20 w-36 rounded-2xl bg-[#101642]/95 backdrop-blur-md border border-cyan-400/40 p-3 shadow-[0_10px_28px_rgba(5,6,24,0.8)]">
                  <div className="flex items-center justify-between text-[10px] text-cyan-300 font-bold mb-2">
                    <span>Live Sync</span>
                    <span>Active</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-11">
                    <div className="flex-1 bg-purple-500/50 h-4 rounded-t" />
                    <div className="flex-1 bg-purple-500/70 h-6 rounded-t" />
                    <div className="flex-1 bg-indigo-400 h-8 rounded-t" />
                    <div className="flex-1 bg-cyan-400 h-11 rounded-t" />
                  </div>
                </div>

                {/* Floating Right Golden Trophy Card */}
                <div className="absolute -right-4 sm:-right-8 -top-2 z-20 w-34 rounded-2xl bg-[#161342]/95 backdrop-blur-md border border-amber-400/40 p-3 shadow-[0_10px_28px_rgba(5,6,24,0.8)] flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-lg">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-extrabold text-amber-300 mt-1.5">
                    Merit Certified
                  </span>
                </div>

                {/* Central Neon Laptop with </> Emblem */}
                <div className="relative z-10 flex flex-col items-center mt-14">
                  {/* Laptop Screen */}
                  <div className="w-56 sm:w-64 h-38 sm:h-42 rounded-2xl bg-gradient-to-br from-[#0F174A] via-[#131D5E] to-[#090D30] border-2 border-cyan-400/70 shadow-[0_0_40px_rgba(59,130,246,0.6)] flex flex-col justify-between p-4 relative overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-[10px] font-mono text-cyan-300 ml-2">
                        examflow_sandbox.py
                      </span>
                    </div>
                    <div className="my-auto flex items-center justify-center">
                      <span className="text-4xl sm:text-5xl font-extrabold font-mono bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(56,189,248,0.8)]">
                        &lt;/&gt;
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-purple-500 via-cyan-400 to-indigo-500" />
                  </div>

                  {/* Laptop Base & Neon Rings */}
                  <div className="w-68 sm:w-76 h-4 -mt-1 rounded-b-2xl bg-gradient-to-r from-indigo-500 via-cyan-300 to-purple-500 shadow-[0_8px_30px_rgba(56,189,248,0.85)]" />
                  <div className="w-76 sm:w-84 h-6 mt-2 rounded-full border-2 border-purple-500/60 bg-purple-600/15 shadow-[0_0_35px_rgba(139,92,246,0.7)]" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Shared Global About & Contact Footer Section */}
      <GlobalFooter />
    </div>
  );
};



