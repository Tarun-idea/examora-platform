import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Send,
  Code2,
  FileCheck2,
  Sparkles,
  Clock,
  XCircle,
  Filter,
  Users,
} from 'lucide-react';
import {
  examStore,
  ExamAttempt,
  ALL_SECTIONS,
  normalizeSection,
} from '../../services/examStore.ts';

interface EvaluationStationProps {
  viewMode?: 'evaluations' | 'submissions';
}

type OutcomeFilter =
  | 'ALL'
  | 'passed'
  | 'failed'
  | 'not-completed'
  | 'pending'
  | 'published';

interface NotCompletedEntry {
  kind: 'not-completed';
  id: string;
  studentId: string;
  studentName: string;
  studentRegId: string;
  studentEmail: string;
  section: string;
  department: string;
  examId: string;
  examTitle: string;
  subjectName: string;
  scheduledDate: string;
  durationMinutes: number;
  totalMarks: number;
}

type EvaluationListItem =
  | {
      kind: 'attempt';
      attempt: ExamAttempt;
      section: string;
      department: string;
    }
  | NotCompletedEntry;

export const EvaluationStation: React.FC<EvaluationStationProps> = () => {
  const state = examStore.getState();
  const [examFilter, setExamFilter] = useState<string>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('ALL');
  const [selectedItemId, setSelectedItemId] = useState<string>(
    state.attempts[0]?.id || ''
  );
  const [feedbackDraft, setFeedbackDraft] = useState<string>('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // All 26 sections A - Z
  const availableSections = ALL_SECTIONS;

  const getStudentSection = (studentId: string): string => {
    const stu = state.students.find((s) => s.id === studentId);
    return normalizeSection(stu?.section || 'A');
  };

  const getStudentDept = (studentId: string): string => {
    const stu = state.students.find((s) => s.id === studentId);
    return stu?.department || 'Computer Science & Engineering';
  };

  // 1. Completed / Submitted / In-Progress Attempt Items
  const attemptItems: EvaluationListItem[] = state.attempts.map((attempt) => ({
    kind: 'attempt',
    attempt,
    section: getStudentSection(attempt.studentId),
    department: getStudentDept(attempt.studentId),
  }));

  // 2. "Not Completed" entries: students assigned to exams who have not completed them yet
  const notCompletedItems: NotCompletedEntry[] = [];
  const seenNotCompletedIds = new Set<string>();
  for (const exam of state.exams) {
    const normalizedExamCohorts = exam.assignedCohorts.map(normalizeSection);
    const assignedStudents = state.students.filter(
      (stu) =>
        exam.assignedStudentIds.includes(stu.id) ||
        normalizedExamCohorts.includes(normalizeSection(stu.section || 'A'))
    );
    for (const stu of assignedStudents) {
      const ncId = `nc-${exam.id}-${stu.id}`;
      if (seenNotCompletedIds.has(ncId)) continue;
      const hasCompletedAttempt = state.attempts.some(
        (a) =>
          a.examId === exam.id &&
          a.studentId === stu.id &&
          a.status !== 'in-progress'
      );
      if (!hasCompletedAttempt) {
        seenNotCompletedIds.add(ncId);
        notCompletedItems.push({
          kind: 'not-completed',
          id: ncId,
          studentId: stu.id,
          studentName: stu.name,
          studentRegId: stu.studentId,
          studentEmail: stu.email,
          section: normalizeSection(stu.section || 'A'),
          department: stu.department,
          examId: exam.id,
          examTitle: exam.title,
          subjectName: exam.subjectName,
          scheduledDate: exam.scheduledDate,
          durationMinutes: exam.durationMinutes,
          totalMarks: exam.totalMarks,
        });
      }
    }
  }

  // Combine and filter according to Exam, Section, and Outcome filters
  const allCombinedItems: EvaluationListItem[] =
    outcomeFilter === 'not-completed'
      ? [
          ...attemptItems.filter(
            (i) => i.kind === 'attempt' && i.attempt.status === 'in-progress'
          ),
          ...notCompletedItems,
        ]
      : outcomeFilter === 'ALL'
      ? [...attemptItems, ...notCompletedItems]
      : attemptItems;

  const filteredItems = allCombinedItems.filter((item) => {
    const itemExamId =
      item.kind === 'attempt' ? item.attempt.examId : item.examId;
    const matchesExam = examFilter === 'ALL' || itemExamId === examFilter;
    const matchesSection =
      sectionFilter === 'ALL' || item.section === sectionFilter;

    if (!matchesExam || !matchesSection) return false;

    if (outcomeFilter === 'ALL') return true;
    if (outcomeFilter === 'not-completed') {
      return (
        item.kind === 'not-completed' ||
        (item.kind === 'attempt' && item.attempt.status === 'in-progress')
      );
    }
    if (item.kind !== 'attempt') return false;

    const att = item.attempt;
    if (outcomeFilter === 'passed') {
      return att.status !== 'in-progress' && att.passed === true;
    }
    if (outcomeFilter === 'failed') {
      return att.status !== 'in-progress' && att.passed === false;
    }
    if (outcomeFilter === 'pending') {
      return att.status !== 'published';
    }
    if (outcomeFilter === 'published') {
      return att.status === 'published';
    }
    return true;
  });

  // Counts for filter pills (respecting current Exam & Section filter)
  const baseMatchingAttempts = attemptItems.filter(
    (i) =>
      i.kind === 'attempt' &&
      (examFilter === 'ALL' || i.attempt.examId === examFilter) &&
      (sectionFilter === 'ALL' || i.section === sectionFilter)
  ) as Extract<EvaluationListItem, { kind: 'attempt' }>[];

  const baseMatchingNotCompleted = notCompletedItems.filter(
    (nc) =>
      (examFilter === 'ALL' || nc.examId === examFilter) &&
      (sectionFilter === 'ALL' || nc.section === sectionFilter)
  );

  const passedCount = baseMatchingAttempts.filter(
    (i) => i.attempt.status !== 'in-progress' && i.attempt.passed
  ).length;
  const failedCount = baseMatchingAttempts.filter(
    (i) => i.attempt.status !== 'in-progress' && !i.attempt.passed
  ).length;
  const notCompletedCount =
    baseMatchingNotCompleted.length +
    baseMatchingAttempts.filter((i) => i.attempt.status === 'in-progress')
      .length;
  const pendingCount = baseMatchingAttempts.filter(
    (i) => i.attempt.status !== 'published'
  ).length;
  const publishedCount = baseMatchingAttempts.filter(
    (i) => i.attempt.status === 'published'
  ).length;

  const selectedItem =
    filteredItems.find((item) =>
      item.kind === 'attempt'
        ? item.attempt.id === selectedItemId
        : item.id === selectedItemId
    ) || filteredItems[0];

  const activeAttempt =
    selectedItem?.kind === 'attempt' ? selectedItem.attempt : undefined;

  const attemptQuestions = activeAttempt
    ? state.questions.filter((q) => q.examId === activeAttempt.examId)
    : [];

  const attachedCert = activeAttempt
    ? state.certificates.find((c) => c.attemptId === activeAttempt.id)
    : undefined;

  const handleAwardMarksChange = (
    questionId: string,
    marks: number,
    feedback?: string
  ) => {
    if (!activeAttempt) return;
    examStore.gradeAttemptQuestion(
      activeAttempt.id,
      questionId,
      marks,
      feedback
    );
    setSavedNotice(
      'Score updated in rubric. Passing candidates automatically receive an attached certificate.'
    );
  };

  const handlePublishSelected = () => {
    if (!activeAttempt) return;
    examStore.publishAttemptResult(
      activeAttempt.id,
      feedbackDraft || activeAttempt.overallFeedback
    );
    const updatedAttempt = examStore
      .getState()
      .attempts.find((a) => a.id === activeAttempt.id);
    if (updatedAttempt?.passed) {
      setSavedNotice(
        `Published official result for ${activeAttempt.studentName}! Achievement certificate has been automatically filled and attached to the student's result.`
      );
    } else {
      setSavedNotice(
        `Published official result for ${activeAttempt.studentName}.`
      );
    }
  };

  return (
    <div className="space-y-6 max-w-[1480px] w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Award className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-extrabold text-slate-900">
              Submissions &amp; Evaluation Station
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Filter candidates by section, passed, failed, or not completed;
            grade answers and publish results with automatic pass certificate
            attachment.
          </p>
        </div>

        {activeAttempt && (
          <button
            type="button"
            onClick={handlePublishSelected}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Send className="w-4 h-4" />
            {activeAttempt.status === 'published'
              ? 'Update Published Result'
              : 'Publish Verified Result'}
          </button>
        )}
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{savedNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSavedNotice(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Enhanced Filter Bar: Exam + Student Section + Passed / Failed / Not Completed */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <label
                htmlFor="eval-exam-filter"
                className="text-xs font-bold text-slate-700"
              >
                Examination:
              </label>
              <select
                id="eval-exam-filter"
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="ALL">
                  All Examinations ({state.attempts.length} submissions)
                </option>
                {state.exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <label
                htmlFor="eval-section-filter"
                className="text-xs font-bold text-slate-700"
              >
                Student Section:
              </label>
              <select
                id="eval-section-filter"
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="ALL">All Sections</option>
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {examFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => {
                examStore.publishAllExamResults(examFilter);
                setSavedNotice(
                  'All attempts for this examination have been published and passing certificates attached.'
                );
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              Publish All Results for Selected Exam
            </button>
          )}
        </div>

        {/* Status & Outcome Filter Pills: All, Passed, Failed, Not Completed, Needs Review, Published */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-purple-500/20">
          <span className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mr-1">
            Filter Status:
          </span>

          <button
            type="button"
            onClick={() => setOutcomeFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              outcomeFilter === 'ALL'
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white border-purple-400 shadow-[0_0_16px_rgba(124,58,237,0.45)]'
                : 'bg-[#141946] text-slate-200 border-purple-500/35 hover:bg-[#1C225C] hover:text-white'
            }`}
          >
            All ({baseMatchingAttempts.length + baseMatchingNotCompleted.length})
          </button>

          <button
            type="button"
            onClick={() => setOutcomeFilter('passed')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              outcomeFilter === 'passed'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.45)]'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Passed ({passedCount})
          </button>

          <button
            type="button"
            onClick={() => setOutcomeFilter('failed')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              outcomeFilter === 'failed'
                ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_16px_rgba(244,63,94,0.45)]'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 hover:text-white'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Failed ({failedCount})
          </button>

          <button
            type="button"
            onClick={() => setOutcomeFilter('not-completed')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              outcomeFilter === 'not-completed'
                ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.45)]'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Not Completed ({notCompletedCount})
          </button>

          <button
            type="button"
            onClick={() => setOutcomeFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              outcomeFilter === 'pending'
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_16px_rgba(8,145,178,0.45)]'
                : 'bg-[#141946] text-cyan-300 border-cyan-500/35 hover:bg-[#1C225C] hover:text-white'
            }`}
          >
            Needs Review ({pendingCount})
          </button>

          <button
            type="button"
            onClick={() => setOutcomeFilter('published')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              outcomeFilter === 'published'
                ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_16px_rgba(147,51,234,0.45)]'
                : 'bg-[#141946] text-purple-300 border-purple-500/35 hover:bg-[#1C225C] hover:text-white'
            }`}
          >
            Published ({publishedCount})
          </button>
        </div>
      </div>

      {/* Split Layout: Left Submissions & Candidates List, Right Detailed Rubric */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: STUDENT SUBMISSIONS & CANDIDATES */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-extrabold text-slate-300 uppercase tracking-wider px-1">
            Matching Candidates ({filteredItems.length})
          </div>

          {filteredItems.map((item) => {
            if (item.kind === 'attempt') {
              const att = item.attempt;
              const selected =
                selectedItem?.kind === 'attempt' &&
                selectedItem.attempt.id === att.id;
              return (
                <button
                  key={att.id}
                  type="button"
                  onClick={() => {
                    setSelectedItemId(att.id);
                    setFeedbackDraft(att.overallFeedback || '');
                  }}
                  className={`w-full text-left p-5 rounded-2xl border transition-all cursor-pointer ${
                    selected
                      ? 'bg-blue-50/50 border-blue-500 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-extrabold text-slate-900">
                        {att.studentName}
                      </span>
                      <span className="ml-2 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {item.section}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                        att.status === 'published'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {att.status === 'published'
                        ? 'Published'
                        : 'Needs Review'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 mt-1 truncate">
                    {att.examTitle}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      Marks:{' '}
                      <strong className="font-mono font-extrabold text-slate-900">
                        {att.totalScore}
                      </strong>{' '}
                      / {att.maxScore} ({att.percentage}%)
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] ${
                        att.passed
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {att.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                </button>
              );
            }

            // Not Completed Item Card
            const selected =
              selectedItem?.kind === 'not-completed' &&
              selectedItem.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItemId(item.id)}
                className={`w-full text-left p-5 rounded-2xl border transition-all cursor-pointer ${
                  selected
                    ? 'bg-amber-50/60 border-amber-500 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-extrabold text-slate-900">
                      {item.studentName}
                    </span>
                    <span className="ml-2 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {item.section}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-800 text-[11px] font-bold">
                    Not Completed
                  </span>
                </div>

                <div className="text-xs text-slate-500 mt-1 truncate">
                  {item.examTitle}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono">{item.studentRegId}</span>
                  <span className="text-amber-700 font-bold">
                    Awaiting Attempt
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Grading Rubric OR Not-Completed Candidate Details */}
        {activeAttempt ? (
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {activeAttempt.studentName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                    {getStudentSection(activeAttempt.studentId)}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {activeAttempt.studentRegId} · {activeAttempt.studentEmail}
                  </span>
                </div>
                <div className="text-xs font-semibold text-blue-600 mt-1">
                  {activeAttempt.examTitle} · Started:{' '}
                  {new Date(activeAttempt.startedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400 font-medium">
                  Current Score ({activeAttempt.percentage}% ·{' '}
                  {activeAttempt.passed ? 'PASSED' : 'FAILED'})
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {activeAttempt.totalScore}{' '}
                  <span className="text-base font-normal text-slate-400">
                    / {activeAttempt.maxScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Automatic Certificate Attachment Status Banner */}
            {activeAttempt.passed ? (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-emerald-950">
                      Candidate Passed — Certificate Automatically Attached (
                      {attachedCert?.certificateNumber || 'Issued'})
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      This passing candidate’s official certificate is
                      automatically filled and attached to their result report.
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-700 text-[11px] font-bold shrink-0">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  {attachedCert?.grade || 'Pass'}
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 flex items-center gap-3 text-xs text-red-900">
                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <strong>Below Passing Threshold:</strong> Candidate scored{' '}
                  {activeAttempt.totalScore}/{activeAttempt.maxScore} (
                  {activeAttempt.percentage}%). Certificates are only attached
                  automatically for candidates who pass.
                </div>
              </div>
            )}

            {/* 3 Score Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-center">
                <div className="text-xs text-slate-500 font-medium">
                  MCQ Auto-Score
                </div>
                <div className="text-lg font-extrabold text-blue-600 font-mono mt-1">
                  {activeAttempt.mcqScore} pts
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-center">
                <div className="text-xs text-slate-500 font-medium">
                  Descriptive Graded
                </div>
                <div className="text-lg font-extrabold text-amber-600 font-mono mt-1">
                  {activeAttempt.descriptiveScore} pts
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-center">
                <div className="text-xs text-slate-500 font-medium">
                  Coding Sandbox
                </div>
                <div className="text-lg font-extrabold text-emerald-600 font-mono mt-1">
                  {activeAttempt.codingScore} pts
                </div>
              </div>
            </div>

            {/* Overall Instructor Feedback Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="overall-feedback-input"
                className="block text-xs font-bold text-slate-700"
              >
                Overall Evaluator Remarks (Included on Student Result Report)
              </label>
              <input
                id="overall-feedback-input"
                type="text"
                value={feedbackDraft || activeAttempt.overallFeedback || ''}
                onChange={(e) => setFeedbackDraft(e.target.value)}
                placeholder="Enter overall assessment feedback for the student..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Question-by-Question Responses & Manual Grading Controls */}
            <div className="space-y-4">
              <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Question Responses &amp; Rubric
              </div>

              {attemptQuestions.map((q, idx) => {
                const ans = activeAttempt.answers[q.id];
                const awarded = ans?.awardedMarks ?? 0;

                return (
                  <div
                    key={q.id}
                    className="p-5 rounded-2xl border border-slate-200/90 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-bold uppercase text-blue-600">
                          {q.type} · Max {q.marks} pts
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                          Q{idx + 1}: {q.text}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <label
                          htmlFor={`grade-${q.id}`}
                          className="text-xs font-semibold text-slate-500"
                        >
                          Awarded:
                        </label>
                        <input
                          id={`grade-${q.id}`}
                          type="number"
                          min={0}
                          max={q.marks}
                          value={awarded}
                          onChange={(e) =>
                            handleAwardMarksChange(
                              q.id,
                              Number(e.target.value),
                              ans?.instructorFeedback
                            )
                          }
                          className="w-16 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-center text-slate-900"
                        />
                        <span className="text-xs text-slate-400 font-mono">
                          / {q.marks}
                        </span>
                      </div>
                    </div>

                    {q.type === 'mcq' && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {q.options.map((opt) => {
                          const picked = ans?.selectedOptionId === opt.id;
                          const correct = q.correctOptionId === opt.id;
                          return (
                            <div
                              key={opt.id}
                              className={`px-3.5 py-2 rounded-xl border flex items-center justify-between ${
                                picked && correct
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                                  : picked && !correct
                                  ? 'bg-red-50 border-red-300 text-red-900 font-bold'
                                  : correct
                                  ? 'bg-emerald-50/40 border-emerald-200 text-emerald-800'
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              <span>
                                {opt.label}. {opt.text}
                              </span>
                              {picked && (
                                <span className="text-[10px] uppercase font-extrabold">
                                  Selected
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'descriptive' && (
                      <div className="space-y-2 pt-1">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed">
                          {ans?.descriptiveText || (
                            <span className="italic text-slate-400">
                              No descriptive answer submitted.
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={ans?.instructorFeedback || ''}
                          onChange={(e) =>
                            handleAwardMarksChange(q.id, awarded, e.target.value)
                          }
                          placeholder="Add instructor rubric feedback for this response..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                        />
                      </div>
                    )}

                    {q.type === 'programming' && (
                      <div className="space-y-2 pt-1">
                        <pre className="p-3.5 rounded-xl bg-[#070E22] text-emerald-400 font-mono text-xs overflow-x-auto">
                          {ans?.codeText || '// No code submitted'}
                        </pre>
                        {ans?.testCaseResults && (
                          <div className="flex flex-wrap gap-2">
                            {ans.testCaseResults.map((tr, i) => (
                              <span
                                key={tr.testCaseId}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold ${
                                  tr.passed
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-red-50 text-red-700'
                                }`}
                              >
                                <Code2 className="w-3 h-3" />
                                Test #{i + 1}: {tr.passed ? 'PASSED' : 'FAILED'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : selectedItem?.kind === 'not-completed' ? (
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold">
                  Not Completed Yet
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                  {selectedItem.studentName} ({selectedItem.studentRegId})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedItem.department} · {selectedItem.section} ·{' '}
                  {selectedItem.studentEmail}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-slate-400">Assigned Examination</div>
                <div className="font-bold text-slate-900 mt-1">
                  {selectedItem.examTitle}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Subject &amp; Schedule</div>
                <div className="font-mono font-bold text-slate-800 mt-1">
                  {selectedItem.subjectName} · {selectedItem.scheduledDate}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Duration &amp; Marks</div>
                <div className="font-mono font-bold text-slate-800 mt-1">
                  {selectedItem.durationMinutes} mins ·{' '}
                  {selectedItem.totalMarks} pts
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-950">
              <span>
                This candidate has not submitted an attempt for{' '}
                <strong>{selectedItem.examTitle}</strong> yet. You can switch to
                their student portal to take the exam.
              </span>
              <button
                type="button"
                onClick={() =>
                  examStore.switchRoleQuick('student', selectedItem.studentId)
                }
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold whitespace-nowrap cursor-pointer ml-3"
              >
                Open Student Portal →
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500 text-sm">
            No candidate records match the selected section and status filters.
          </div>
        )}
      </div>
    </div>
  );
};
