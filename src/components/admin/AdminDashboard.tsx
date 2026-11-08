import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Zap,
  Plus,
  BarChart3,
  ArrowRight,
  Code2,
  Database,
  Calculator,
  PlayCircle,
  Trophy,
  FileCheck2,
  Rocket,
  Target,
  Award,
  Flame,
  Star,
  Crown,
} from 'lucide-react';
import { examStore } from '../../services/examStore.ts';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenCreateExam: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  onOpenCreateExam,
}) => {
  const state = examStore.getState();
  const [timeframe, setTimeframe] = useState<'6m' | '1y'>('6m');

  const totalStudents = state.students.length;
  const totalSubjects = state.subjects.length;
  const totalExams = state.exams.length;
  const totalQuestions = state.questions.length;
  const totalAttempts = state.attempts.length;
  const passedAttempts = state.attempts.filter((a) => a.passed).length;
  const publishedAttemptsCount = state.attempts.filter(
    (a) => a.status === 'published'
  ).length;
  const proctoredExamsCount = state.exams.filter(
    (e) => e.webcamProctoring
  ).length;

  const passRate =
    totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

  const progressPercentage = Math.min(
    100,
    (totalSubjects > 0 ? 25 : 0) +
      (totalStudents > 0 ? 25 : 0) +
      (totalExams > 0 ? 25 : 0) +
      (totalQuestions > 0 ? 25 : 0)
  );

  const subjectsBarPct =
    totalSubjects > 0 ? Math.min(100, totalSubjects * 25) : 0;
  const questionsBarPct =
    totalQuestions > 0 ? Math.min(100, totalQuestions * 10) : 0;
  const proctoringBarPct =
    totalExams > 0 ? Math.round((proctoredExamsCount / totalExams) * 100) : 0;
  const evaluationBarPct =
    totalAttempts > 0
      ? Math.round((publishedAttemptsCount / totalAttempts) * 100)
      : 0;

  // Compute live performance points from attempts (or flat baseline at 0% when no attempts exist yet)
  const recentAttempts = [...state.attempts].slice(0, 6).reverse();
  const chartValues =
    recentAttempts.length > 0
      ? Array.from({ length: 6 }, (_, i) => {
          const item =
            recentAttempts[Math.min(i, recentAttempts.length - 1)];
          return item ? item.percentage : 0;
        })
      : [0, 0, 0, 0, 0, 0];
  const chartX = [20, 110, 205, 300, 395, 485];
  const chartY = chartValues.map((pct) =>
    Math.round(125 - (Math.max(0, Math.min(100, pct)) / 100) * 95)
  );
  const linePath = chartX
    .map((x, idx) => `${idx === 0 ? 'M' : 'L'} ${x} ${chartY[idx]}`)
    .join(' ');
  const areaPath = `${linePath} L 485 135 L 20 135 Z`;

  const getExamIcon = (subjectName: string) => {
    const lower = subjectName.toLowerCase();
    if (lower.includes('python') || lower.includes('algo') || lower.includes('java')) {
      return <Code2 className="w-4 h-4 text-purple-400" />;
    }
    if (lower.includes('math')) {
      return <Calculator className="w-4 h-4 text-cyan-400" />;
    }
    return <Database className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="space-y-6 max-w-[1480px] w-full mx-auto">
      {/* Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {state.currentUser.name || 'Administrator'}!{' '}
            <span aria-hidden="true">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Keep going! Manage examinations, track live progress, and ensure
            proctored excellence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenCreateExam}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white text-xs font-bold shadow-[0_0_20px_rgba(124,58,237,0.45)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Examination
          </button>
          <button
            type="button"
            onClick={() => onNavigate('admin-students')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#131742] hover:bg-[#1C225C] border border-purple-500/35 text-slate-200 text-xs font-bold cursor-pointer"
          >
            <Users className="w-4 h-4 text-purple-400" />
            Manage Students
          </button>
        </div>
      </div>

      {/* 4 Cosmic KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <button
          type="button"
          onClick={() => onNavigate('admin-students')}
          className="rounded-2xl bg-gradient-to-b from-[#131744] to-[#0C0F2D] border border-purple-500/30 hover:border-purple-400/60 p-5 text-left transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Total Students
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400">
              <Rocket className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2">
            {totalStudents}
          </div>
          <div className="text-xs font-bold text-emerald-400 mt-2 flex items-center gap-1 font-mono">
            <span>↑ {totalStudents} Active Roster</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('admin-exams')}
          className="rounded-2xl bg-gradient-to-b from-[#131744] to-[#0C0F2D] border border-purple-500/30 hover:border-purple-400/60 p-5 text-left transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Examinations
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2">
            {totalExams}
          </div>
          <div className="text-xs font-bold text-emerald-400 mt-2 flex items-center gap-1 font-mono">
            <span>↑ {totalSubjects} Subjects</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('admin-evaluations')}
          className="rounded-2xl bg-gradient-to-b from-[#131744] to-[#0C0F2D] border border-purple-500/30 hover:border-purple-400/60 p-5 text-left transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Total Attempts
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2">
            {totalAttempts}
          </div>
          <div className="text-xs font-bold text-emerald-400 mt-2 flex items-center gap-1 font-mono">
            <span>↑ {totalQuestions} Questions</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('admin-leaderboard')}
          className="rounded-2xl bg-gradient-to-b from-[#131744] to-[#0C0F2D] border border-purple-500/30 hover:border-purple-400/60 p-5 text-left transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Accuracy &amp; Pass Rate
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2">
            {passRate}%
          </div>
          <div className="text-xs font-bold text-emerald-400 mt-2 flex items-center gap-1 font-mono">
            <span>↑ {state.certificates.length} Certified</span>
          </div>
        </button>
      </div>

      {/* Middle Row: "Your Progress" Circular Gauge & Bars + "Next Contest / Exam" Trophy Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Platform Readiness & Progress Card */}
        <div className="lg:col-span-8 rounded-3xl bg-gradient-to-b from-[#11153C] to-[#0B0E2A] border border-purple-500/30 p-6 shadow-xl">
          <h2 className="text-base font-extrabold text-white mb-5">
            Your Platform Progress
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Circular Ring Gauge */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="var(--theme-border)"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="url(#adminProgGrad)"
                    strokeWidth="10"
                    strokeDasharray="314"
                    strokeDashoffset={314 - (314 * progressPercentage) / 100}
                    strokeLinecap="round"
                    fill="none"
                  />
                  <defs>
                    <linearGradient id="adminProgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: 'var(--theme-accent)' }} />
                      <stop offset="100%" style={{ stopColor: 'var(--theme-accent-2)' }} />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute text-2xl font-extrabold text-white font-mono">
                  {progressPercentage}%
                </span>
              </div>
              <div className="text-xs font-bold text-slate-300 mt-2">
                Overall Readiness
              </div>
              <div className="text-[11px] font-semibold text-emerald-400 mt-0.5">
                ↑ Live Sync Active
              </div>
            </div>

            {/* 4 Horizontal Progress Bars (100% Live Metrics) */}
            <div className="md:col-span-8 space-y-3.5">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
                  <span>Subjects &amp; Cohorts ({totalSubjects} Active)</span>
                  <span className="font-mono">{subjectsBarPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#1B2054] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all"
                    style={{ width: `${subjectsBarPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
                  <span>
                    MCQ, Descriptive &amp; Coding Bank ({totalQuestions} Items)
                  </span>
                  <span className="font-mono">{questionsBarPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#1B2054] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all"
                    style={{ width: `${questionsBarPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
                  <span>
                    Proctoring &amp; Violation Lockdown ({proctoredExamsCount}/
                    {totalExams} Exams)
                  </span>
                  <span className="font-mono">{proctoringBarPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#1B2054] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all"
                    style={{ width: `${proctoringBarPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
                  <span>
                    Published Evaluations &amp; Certificates (
                    {publishedAttemptsCount}/{totalAttempts})
                  </span>
                  <span className="font-mono">{evaluationBarPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#1B2054] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 transition-all"
                    style={{ width: `${evaluationBarPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Glowing Golden Trophy Card ("Next Examination / Launch") */}
        <div className="lg:col-span-4 rounded-3xl bg-gradient-to-br from-[#2B1B6E] via-[#1C1452] to-[#110E36] border border-purple-400/40 p-6 flex flex-col items-center justify-between text-center shadow-[0_0_35px_rgba(124,58,237,0.3)] relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
            <Trophy className="w-9 h-9" />
          </div>

          <div className="my-3">
            <div className="text-xs font-semibold text-purple-200">
              {state.exams[0] ? state.exams[0].title : 'Next Examination'}
            </div>
            <div className="text-xl font-extrabold text-white font-mono mt-1">
              {state.exams[0]
                ? `${state.exams[0].scheduledDate} · ${state.exams[0].startTime}`
                : 'Ready to Schedule'}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              state.exams.length > 0
                ? onNavigate('admin-exams')
                : onOpenCreateExam()
            }
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:from-[#9333EA] hover:to-[#4F46E5] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
          >
            <span>
              {state.exams.length > 0 ? 'View Details' : 'Schedule Now'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Row 1: "Your Performance" Area Chart + "Achievements & Quick Actions" */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Smooth Neon Line Chart (Driven by Live Attempt Scores) */}
        <div className="lg:col-span-7 rounded-3xl bg-[#0E1132] border border-purple-500/30 p-6 shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-extrabold text-white">
                Platform Performance Trend
              </h2>
              <p className="text-xs text-slate-400">
                Live examination accuracy across {totalAttempts} recorded
                submission(s) ({passRate}% pass rate)
              </p>
            </div>
            <select
              aria-label="Chart Timeframe"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as '6m' | '1y')}
              className="text-xs font-semibold text-slate-200 bg-[#151946] border border-purple-500/35 rounded-xl px-3 py-1.5 focus:outline-none"
            >
              <option value="6m">Live Submissions</option>
              <option value="1y">Full Academic Year</option>
            </select>
          </div>

          <div className="relative h-44 w-full pt-2">
            <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="neonArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: 'var(--theme-accent)' }} stopOpacity="0.42" />
                  <stop offset="100%" style={{ stopColor: 'var(--theme-accent-2)' }} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line x1="0" y1="25" x2="500" y2="25" stroke="var(--theme-divider)" />
              <line x1="0" y1="65" x2="500" y2="65" stroke="var(--theme-divider)" />
              <line x1="0" y1="105" x2="500" y2="105" stroke="var(--theme-divider)" />
              {/* Area Fill */}
              <path d={areaPath} fill="url(#neonArea)" />
              {/* Glowing Accent Line */}
              <path
                d={linePath}
                fill="none"
                stroke="var(--theme-accent)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Data Points */}
              {chartX.map((cx, idx) => (
                <circle
                  key={cx}
                  cx={cx}
                  cy={chartY[idx]}
                  r="4.5"
                  fill="var(--theme-accent)"
                />
              ))}
            </svg>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1 px-2">
              {recentAttempts.length > 0 ? (
                chartValues.map((val, idx) => (
                  <span key={idx}>
                    #{idx + 1} ({val}%)
                  </span>
                ))
              ) : (
                <span className="w-full text-center text-slate-400">
                  Live score trajectory updates automatically as students submit examinations
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Launch & Badges Card */}
        <div className="lg:col-span-5 rounded-3xl bg-[#0E1132] border border-purple-500/30 p-6 flex flex-col justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white">
                Quick Actions &amp; Modules
              </h2>
              <span className="text-xs font-bold text-purple-300 font-mono">
                {totalSubjects + totalExams} Active
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <button
                type="button"
                onClick={onOpenCreateExam}
                className="p-3 rounded-2xl bg-[#151A48] hover:bg-[#1E2563] border border-purple-500/30 flex flex-col items-center gap-1.5 text-center cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white">
                  New Exam
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('admin-questions')}
                className="p-3 rounded-2xl bg-[#151A48] hover:bg-[#1E2563] border border-purple-500/30 flex flex-col items-center gap-1.5 text-center cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                  <Code2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white">
                  Questions
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('admin-subjects')}
                className="p-3 rounded-2xl bg-[#151A48] hover:bg-[#1E2563] border border-purple-500/30 flex flex-col items-center gap-1.5 text-center cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
                  <Star className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white">
                  Subjects
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('admin-students')}
                className="p-3 rounded-2xl bg-[#151A48] hover:bg-[#1E2563] border border-purple-500/30 flex flex-col items-center gap-1.5 text-center cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400">
                  <Flame className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white">
                  Students
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('admin-certificates')}
                className="p-3 rounded-2xl bg-[#151A48] hover:bg-[#1E2563] border border-purple-500/30 flex flex-col items-center gap-1.5 text-center cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Crown className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white">
                  Certificates
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('admin-leaderboard')}
                className="p-3 rounded-2xl bg-[#151A48] hover:bg-[#1E2563] border border-purple-500/30 flex flex-col items-center gap-1.5 text-center cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white">
                  Leaderboard
                </span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('admin-evaluations')}
            className="w-full py-2.5 rounded-xl bg-[#151A48] hover:bg-[#1E2563] border border-purple-500/35 text-xs font-bold text-purple-200 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Open Evaluation Station</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Row 2: Upcoming Examinations Table & Recent Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Examinations */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-extrabold text-slate-900">
                Upcoming Examinations
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('admin-exams')}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-500 bg-slate-50/70">
                  <th className="py-3 px-3 rounded-l-xl">Exam Title</th>
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3">Date &amp; Time</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3 rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {state.exams.length > 0 ? (
                  state.exams.slice(0, 5).map((exam) => (
                    <tr
                      key={exam.id}
                      onClick={() => onNavigate('admin-exams')}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-2.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            {getExamIcon(exam.subjectName)}
                          </div>
                          <span className="truncate max-w-[145px]">{exam.title}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                        {exam.subjectName}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-mono tabular-nums whitespace-nowrap">
                        <div>{exam.scheduledDate}</div>
                        <div className="text-[11px] text-slate-400">{exam.startTime}</div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-700 font-mono tabular-nums whitespace-nowrap">
                        {exam.durationMinutes} mins
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap ${
                            exam.status === 'Published' ||
                            exam.status === 'Results Published'
                              ? 'bg-purple-50 text-purple-700'
                              : exam.status === 'Scheduled'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {exam.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-xs text-slate-400">
                      No examinations created yet. Click{' '}
                      <button
                        type="button"
                        onClick={onOpenCreateExam}
                        className="text-blue-600 font-bold underline cursor-pointer"
                      >
                        Create Examination
                      </button>{' '}
                      to schedule your first live assessment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Live Activity */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-extrabold text-slate-900">
                Recent Live Activity
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('admin-evaluations')}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {state.activities.length > 0 ? (
              state.activities.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  className="py-3 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        act.type === 'student'
                          ? 'bg-emerald-50 text-emerald-600'
                          : act.type === 'exam'
                          ? 'bg-blue-50 text-blue-600'
                          : act.type === 'result'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-purple-50 text-purple-600'
                      }`}
                    >
                      {act.type === 'student' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : act.type === 'exam' ? (
                        <PlayCircle className="w-4 h-4" />
                      ) : act.type === 'result' ? (
                        <Trophy className="w-4 h-4" />
                      ) : (
                        <FileCheck2 className="w-4 h-4" />
                      )}
                    </span>
                    <span className="font-semibold text-slate-800">{act.text}</span>
                  </div>
                  <span className="text-slate-400 font-mono whitespace-nowrap">
                    {act.timeAgo}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No activity recorded yet. Actions you take in the portal will appear here in real time.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
