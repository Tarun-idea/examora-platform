import React, { useState } from 'react';
import {
  Trophy,
  Download,
  Medal,
  CheckCircle2,
  XCircle,
  Crown,
  TrendingUp,
} from 'lucide-react';
import { examStore } from '../../services/examStore.ts';

export const LeaderboardPage: React.FC = () => {
  const state = examStore.getState();
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [categoryTab, setCategoryTab] = useState<
    'overall' | 'contests' | 'exams' | 'college'
  >('overall');

  const rankedAttempts = [...state.attempts]
    .filter((a) => (selectedExamId === 'ALL' ? true : a.examId === selectedExamId))
    .filter((a) => {
      if (categoryTab === 'contests') return a.codingScore > 0;
      if (categoryTab === 'college') return a.passed;
      return true;
    })
    .sort((a, b) => b.percentage - a.percentage || b.totalScore - a.totalScore);

  const handleExportLeaderboard = () => {
    const header =
      'Rank,Student ID,Full Name,Examination,Score,Max Score,Percentage,Status,Violations\n';
    const rows = rankedAttempts
      .map(
        (a, idx) =>
          `${idx + 1},"${a.studentRegId}","${a.studentName}","${a.examTitle}",${
            a.totalScore
          },${a.maxScore},${a.percentage}%,"${a.passed ? 'PASS' : 'FAIL'}",${
            a.violationCount
          }`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'examflow_results_leaderboard.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-[1480px] w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/35 flex items-center justify-center text-cyan-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              Global Leaderboard &amp; Merit Results
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              See how candidates rank across examinations, coding assessments, and cohorts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            aria-label="Filter Leaderboard by Exam"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-purple-500/35 bg-[#12163E] text-xs font-bold text-white"
          >
            <option value="ALL">All Examinations</option>
            {state.exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExportLeaderboard}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white text-xs font-bold shadow-[0_0_20px_rgba(124,58,237,0.45)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            Export Results CSV
          </button>
        </div>
      </div>

      {/* Global Leaderboard Split Showcase (Matching Bottom-Left of Template) */}
      <div className="rounded-3xl bg-[#0D102D] border border-purple-500/30 p-6 sm:p-8 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            {/* Category Filter Pill Tabs */}
            <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-[#141946] border border-purple-500/30">
              {(
                [
                  { id: 'overall', label: 'Overall' },
                  { id: 'contests', label: 'Coding' },
                  { id: 'exams', label: 'Exams' },
                  { id: 'college', label: 'Passed' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryTab(tab.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    categoryTab === tab.id
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Leaderboard Table */}
            <div className="rounded-2xl bg-[#11153A] border border-purple-500/25 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-purple-500/20 text-[11px] font-extrabold text-slate-400 uppercase bg-[#151A48]">
                      <th className="py-3.5 px-4">#</th>
                      <th className="py-3.5 px-4">Candidate</th>
                      <th className="py-3.5 px-4">Examination</th>
                      <th className="py-3.5 px-4">MCQ / Desc / Code</th>
                      <th className="py-3.5 px-4">Total Score</th>
                      <th className="py-3.5 px-4">Accuracy</th>
                      <th className="py-3.5 px-4">Outcome</th>
                      <th className="py-3.5 px-4">Publication</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/15 text-xs">
                    {rankedAttempts.length > 0 ? (
                      rankedAttempts.map((att, idx) => (
                        <tr key={att.id} className="hover:bg-white/5">
                          <td className="py-4 px-4 font-mono font-extrabold text-white">
                            <span className="inline-flex items-center gap-1">
                              {idx < 3 && (
                                <Medal className="w-4 h-4 text-amber-400" />
                              )}
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {idx < 3 && (
                                <Crown
                                  className={`w-4 h-4 ${
                                    idx === 0
                                      ? 'text-amber-400'
                                      : idx === 1
                                      ? 'text-slate-300'
                                      : 'text-orange-400'
                                  }`}
                                />
                              )}
                              <span>{att.studentName}</span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {att.studentRegId}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-200 font-medium">
                            {att.examTitle}
                          </td>
                          <td className="py-4 px-4 font-mono text-slate-300 tabular-nums">
                            {att.mcqScore} / {att.descriptiveScore} /{' '}
                            {att.codingScore}
                          </td>
                          <td className="py-4 px-4 font-mono font-extrabold text-white tabular-nums">
                            {att.totalScore} / {att.maxScore}
                          </td>
                          <td className="py-4 px-4 font-mono font-extrabold text-cyan-400 tabular-nums">
                            {att.percentage}%
                          </td>
                          <td className="py-4 px-4">
                            {att.passed ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                                <XCircle className="w-3.5 h-3.5" /> FAIL
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {att.status === 'published' ? (
                              <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-[11px] font-bold">
                                Published
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  examStore.publishAttemptResult(att.id)
                                }
                                className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white text-[11px] font-bold cursor-pointer"
                              >
                                Publish Now
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-10 text-center text-xs text-slate-400"
                        >
                          No examination attempts recorded yet. Rankings populate
                          automatically as candidates complete assessments.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Glowing Golden Trophy Podium */}
          <div className="lg:col-span-4 rounded-3xl bg-gradient-to-b from-[#1E1654] via-[#13113C] to-[#0C0F2C] border border-purple-400/35 p-6 flex flex-col items-center justify-center text-center shadow-[0_0_40px_rgba(124,58,237,0.3)]">
            <div className="w-24 h-24 rounded-full bg-amber-400/20 border-2 border-amber-400/60 flex items-center justify-center text-amber-300 shadow-[0_0_45px_rgba(245,158,11,0.55)]">
              <Trophy className="w-12 h-12" />
            </div>
            <h2 className="text-base font-extrabold text-white mt-4">
              Champions Podium
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Every candidate who passes an examination automatically receives an
              official achievement certificate attached to their result.
            </p>
            <div className="mt-5 w-44 h-3 rounded-full bg-gradient-to-r from-purple-500 via-amber-400 to-cyan-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
          </div>
        </div>
      </div>
    </div>
  );
};
