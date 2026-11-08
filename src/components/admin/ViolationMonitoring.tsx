import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Users,
  Search,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { examStore } from '../../services/examStore.ts';
import { classifyViolationRisk } from '../../utils/examLogic.ts';

export const ViolationMonitoring: React.FC = () => {
  const state = examStore.getState();
  const [search, setSearch] = useState<string>('');
  const [examFilter, setExamFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const tabSwitches = state.violations.filter(
    (v) => v.type === 'Tab Switching'
  ).length;
  const fullscreenExits = state.violations.filter(
    (v) => v.type === 'Fullscreen Exit'
  ).length;
  const flaggedCandidates = new Set(state.violations.map((v) => v.studentId))
    .size;

  const filteredViolations = state.violations.filter((v) => {
    const matchesExam = examFilter === 'ALL' || v.examId === examFilter;
    const matchesType = typeFilter === 'ALL' || v.type === typeFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      v.studentName.toLowerCase().includes(q) ||
      v.studentRegId.toLowerCase().includes(q) ||
      v.examTitle.toLowerCase().includes(q) ||
      v.details.toLowerCase().includes(q);
    return matchesExam && matchesType && matchesSearch;
  });

  const handleExportViolationsCsv = () => {
    const header =
      'Timestamp,Student,Student ID,Examination,Violation Type,Details\n';
    const rows = filteredViolations
      .map(
        (v) =>
          `"${v.timestamp}","${v.studentName}","${v.studentRegId}","${v.examTitle}","${v.type}","${v.details}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'examflow_proctoring_violations.csv';
    a.click();
    URL.revokeObjectURL(url);
    setBannerMessage(
      `Exported ${filteredViolations.length} violation incident logs to CSV.`
    );
  };

  const handleClearAllViolations = () => {
    examStore.clearAllViolations();
    setBannerMessage('Cleared all recorded proctoring violation logs.');
  };

  const handleDismissViolation = (id: string, studentName: string) => {
    examStore.deleteViolation(id);
    setBannerMessage(`Cleared violation record for ${studentName}.`);
  };

  return (
    <div className="space-y-6 max-w-[1480px] w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            <h1 className="text-2xl font-extrabold text-slate-900">
              Live Proctoring &amp; Violation Monitoring
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tracks fullscreen exit events, tab switches, window focus changes,
            and camera alerts with real-time risk classification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {state.violations.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllViolations}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}

          <button
            type="button"
            onClick={handleExportViolationsCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#131742] hover:bg-[#1B2158] border border-purple-500/35 text-emerald-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export Violations CSV
          </button>

          <span className="px-4 py-2 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-extrabold">
            {state.violations.length} Incidents Recorded
          </span>
        </div>
      </div>

      {bannerMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{bannerMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-xs font-bold text-emerald-300 hover:text-white underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1A133B] to-[#0E1132] border border-rose-500/40 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-rose-300">
              Tab Switch Incidents
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
            {tabSwitches}
          </div>
          <p className="text-xs text-slate-300">
            Candidate navigated away or changed browser tabs.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1B183B] to-[#0E1132] border border-amber-500/40 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-300">
              Fullscreen Exits
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
            {fullscreenExits}
          </div>
          <p className="text-xs text-slate-300">
            Candidate escaped fullscreen mode during exam.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#131946] to-[#0E1132] border border-cyan-500/40 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-cyan-300">
              Flagged Candidates
            </span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
            {flaggedCandidates}
          </div>
          <p className="text-xs text-slate-300">
            Students with 1 or more logged security incidents.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, ID, examination, or incident..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter by Examination"
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
          >
            <option value="ALL">All Examinations</option>
            {state.exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by Incident Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
          >
            <option value="ALL">All Incident Types</option>
            <option value="Tab Switching">Tab Switching</option>
            <option value="Fullscreen Exit">Fullscreen Exit</option>
            <option value="Window Blur">Window Blur</option>
            <option value="Forbidden Key Blocked">Forbidden Key Blocked</option>
            <option value="Copy/Paste Blocked">Copy/Paste Blocked</option>
            <option value="Camera Alert">Camera Alert</option>
          </select>
        </div>
      </div>

      {/* Violations Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase bg-slate-50/60">
                <th className="py-4 px-5">Timestamp</th>
                <th className="py-4 px-5">Student</th>
                <th className="py-4 px-5">Examination</th>
                <th className="py-4 px-5">Violation Type</th>
                <th className="py-4 px-5">Details</th>
                <th className="py-4 px-5">Risk Level</th>
                <th className="py-4 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredViolations.length > 0 ? (
                filteredViolations.map((v) => {
                  const studentIncidentCount = state.violations.filter(
                    (item) =>
                      item.studentId === v.studentId && item.examId === v.examId
                  ).length;
                  const risk = classifyViolationRisk(studentIncidentCount);

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/70">
                      <td className="py-4 px-5 font-mono text-slate-500">
                        {v.timestamp}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-extrabold text-slate-900">
                          {v.studentName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {v.studentRegId}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-700 font-medium">
                        {v.examTitle}
                      </td>
                      <td className="py-4 px-5 font-extrabold text-red-600">
                        {v.type}
                      </td>
                      <td className="py-4 px-5 text-slate-600">{v.details}</td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-bold ${
                            risk.level === 'High'
                              ? 'bg-red-100 text-red-800'
                              : risk.level === 'Medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {risk.label}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleDismissViolation(v.id, v.studentName)
                          }
                          aria-label={`Dismiss violation for ${v.studentName}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-600 hover:text-red-700 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Dismiss
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 px-5 text-center text-slate-400 text-xs"
                  >
                    No proctoring violations match the current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
