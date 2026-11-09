import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Users,
  HelpCircle,
  Trash2,
  Edit3,
  CheckCircle2,
  X,
  UserCheck,
  ShieldCheck,
  Printer,
  FileSpreadsheet,
  Search,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  examStore,
  Exam,
  ExamStatus,
  ALL_SECTIONS,
  normalizeAndDedupeSections,
} from '../../services/examStore.ts';
import { PrintablePaperModal } from './PrintablePaperModal.tsx';
import { GoogleSheetsExportModal } from './GoogleSheetsExportModal.tsx';
import { HallTicketModal } from '../student/HallTicketModal.tsx';

interface ExamManagementProps {
  viewMode: 'exams' | 'assignments';
  showCreateModalInit?: boolean;
  onNavigateToQuestions: (examId: string) => void;
}

const COHORT_SECTIONS = ALL_SECTIONS;

export const ExamManagement: React.FC<ExamManagementProps> = ({
  viewMode,
  showCreateModalInit = false,
  onNavigateToQuestions,
}) => {
  const state = examStore.getState();
  const [activeMode, setActiveMode] = useState<'exams' | 'assignments'>(viewMode);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(showCreateModalInit);
  const [selectedExamForAssign, setSelectedExamForAssign] = useState<string>(
    state.exams[0]?.id || ''
  );
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [printableExam, setPrintableExam] = useState<Exam | null>(null);
  const [hallTicketExam, setHallTicketExam] = useState<Exam | null>(null);
  const [exportExamId, setExportExamId] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Create / Edit Form State
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>(state.subjects[0]?.id || '');
  const [description, setDescription] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('2026-11-10');
  const [startTime, setStartTime] = useState<string>('10:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(90);
  const [totalMarks, setTotalMarks] = useState<number>(60);
  const [passingMarks, setPassingMarks] = useState<number>(30);
  const [instructions, setInstructions] = useState<string>(
    '1. Fullscreen proctoring is enabled.\n2. Questions are randomized per student.\n3. All answers autosave automatically.'
  );
  const [status, setStatus] = useState<ExamStatus>('Published');
  const [assignedCohorts, setAssignedCohorts] = useState<string[]>([
    ...ALL_SECTIONS,
  ]);
  const [webcamProctoring, setWebcamProctoring] = useState<boolean>(true);
  const [autoPublishAt, setAutoPublishAt] = useState<string>('');

  useEffect(() => {
    setActiveMode(viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (showCreateModalInit) {
      openNewExamModal();
    }
  }, [showCreateModalInit]);

  const showBannerMessage = (msg: string) => {
    setStatusBanner(msg);
    window.setTimeout(() => {
      setStatusBanner((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const openNewExamModal = () => {
    const defaultSub = state.subjects[0];
    const defaultCohorts =
      defaultSub && defaultSub.cohorts.length > 0
        ? normalizeAndDedupeSections(defaultSub.cohorts)
        : [...ALL_SECTIONS];

    setEditingExamId(null);
    setFormError(null);
    setTitle('');
    setSubjectId(defaultSub?.id || '');
    setDescription('');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setStartTime('10:00');
    setDurationMinutes(90);
    setTotalMarks(60);
    setPassingMarks(30);
    setInstructions(
      '1. Fullscreen proctoring is enabled.\n2. Questions are randomized per student.\n3. All answers autosave automatically.'
    );
    setStatus('Published');
    setAssignedCohorts(defaultCohorts);
    setWebcamProctoring(defaultSub ? defaultSub.webcamProctoring : true);
    setAutoPublishAt('');
    setShowCreateModal(true);
  };

  const openEditExamModal = (exam: Exam) => {
    setEditingExamId(exam.id);
    setFormError(null);
    setTitle(exam.title);
    setSubjectId(exam.subjectId);
    setDescription(exam.description);
    setScheduledDate(exam.scheduledDate);
    setStartTime(exam.startTime);
    setDurationMinutes(exam.durationMinutes);
    setTotalMarks(exam.totalMarks);
    setPassingMarks(exam.passingMarks);
    setInstructions(
      exam.instructions ||
        '1. Fullscreen proctoring is enabled.\n2. Questions are randomized per student.\n3. All answers autosave automatically.'
    );
    setStatus(exam.status);
    setAssignedCohorts(normalizeAndDedupeSections(exam.assignedCohorts));
    setWebcamProctoring(exam.webcamProctoring);
    setAutoPublishAt(exam.autoPublishAt || '');
    setShowCreateModal(true);
  };

  const handleSubjectChange = (nextSubId: string) => {
    setSubjectId(nextSubId);
    if (!editingExamId) {
      const sub = state.subjects.find((s) => s.id === nextSubId);
      if (sub && sub.cohorts.length > 0) {
        setAssignedCohorts(normalizeAndDedupeSections(sub.cohorts));
        setWebcamProctoring(sub.webcamProctoring);
      }
    }
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError('Please enter an examination title.');
      return;
    }

    const cleanCohorts =
      assignedCohorts.length > 0
        ? normalizeAndDedupeSections(assignedCohorts)
        : [...ALL_SECTIONS];
    const validTotal = Math.max(1, Number(totalMarks) || 60);
    const validPassing = Math.min(
      validTotal,
      Math.max(1, Number(passingMarks) || Math.ceil(validTotal * 0.5))
    );

    const sub = state.subjects.find((s) => s.id === subjectId);
    const matchingStudentIds = state.students
      .filter((s) => cleanCohorts.includes(s.section))
      .map((s) => s.id);

    if (editingExamId) {
      examStore.updateExam(editingExamId, {
        title: title.trim(),
        subjectId,
        subjectName: sub?.name || 'General',
        description:
          description.trim() ||
          'Proctored online examination with randomized question order.',
        scheduledDate,
        startTime,
        durationMinutes: Math.max(5, Number(durationMinutes) || 60),
        totalMarks: validTotal,
        passingMarks: validPassing,
        instructions: instructions.trim(),
        status,
        assignedCohorts: cleanCohorts,
        webcamProctoring,
        autoPublishAt: autoPublishAt || undefined,
      });
      showBannerMessage(`Updated examination "${title.trim()}" successfully.`);
    } else {
      const created = examStore.addExam({
        title: title.trim(),
        subjectId,
        subjectName: sub?.name || 'General',
        description:
          description.trim() ||
          'Proctored online examination with randomized question order.',
        scheduledDate,
        startTime,
        durationMinutes: Math.max(5, Number(durationMinutes) || 60),
        totalMarks: validTotal,
        passingMarks: validPassing,
        instructions: instructions.trim(),
        status,
        assignedStudentIds:
          matchingStudentIds.length > 0
            ? matchingStudentIds
            : state.students.map((s) => s.id),
        assignedCohorts: cleanCohorts,
        webcamProctoring,
        autoPublishAt: autoPublishAt || undefined,
      });
      setSelectedExamForAssign(created.id);
      showBannerMessage(
        `Created examination "${created.title}" for Sections ${cleanCohorts.join(', ')}.`
      );
    }
    setShowCreateModal(false);
  };

  const toggleCohortInModal = (cohort: string) => {
    setAssignedCohorts((prev) =>
      prev.includes(cohort)
        ? prev.filter((c) => c !== cohort)
        : normalizeAndDedupeSections([...prev, cohort])
    );
  };

  const filteredExams = state.exams.filter((e) => {
    const matchesStatus = statusFilter === 'ALL' ? true : e.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      e.title.toLowerCase().includes(q) ||
      e.subjectName.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // Assignment view helpers
  const activeAssignExam =
    state.exams.find((e) => e.id === selectedExamForAssign) || state.exams[0];

  const handleToggleStudentAssignment = (studentId: string) => {
    if (!activeAssignExam) return;
    const exists = activeAssignExam.assignedStudentIds.includes(studentId);
    const nextIds = exists
      ? activeAssignExam.assignedStudentIds.filter((id) => id !== studentId)
      : [...activeAssignExam.assignedStudentIds, studentId];
    examStore.assignStudentsToExam(
      activeAssignExam.id,
      nextIds,
      activeAssignExam.assignedCohorts
    );
  };

  const handleToggleCohortAssignment = (cohort: string) => {
    if (!activeAssignExam) return;
    const cleanCurrent = normalizeAndDedupeSections(activeAssignExam.assignedCohorts);
    const exists = cleanCurrent.includes(cohort);
    const nextCohorts = exists
      ? cleanCurrent.filter((c) => c !== cohort)
      : normalizeAndDedupeSections([...cleanCurrent, cohort]);

    // Also include or remove students from that section
    const cohortStudentIds = state.students
      .filter((s) => s.section === cohort)
      .map((s) => s.id);
    const nextStudentIds = exists
      ? activeAssignExam.assignedStudentIds.filter(
          (id) => !cohortStudentIds.includes(id)
        )
      : Array.from(
          new Set([...activeAssignExam.assignedStudentIds, ...cohortStudentIds])
        );

    examStore.assignStudentsToExam(activeAssignExam.id, nextStudentIds, nextCohorts);
  };

  return (
    <div className="space-y-6 max-w-[1480px] w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            {activeMode === 'assignments' ? (
              <UserCheck className="w-6 h-6 text-blue-600" />
            ) : (
              <FileText className="w-6 h-6 text-blue-600" />
            )}
            <h1 className="text-2xl font-extrabold text-slate-900">
              {activeMode === 'assignments'
                ? 'Examination Candidate & Section Assignments'
                : 'Examination Management & Scheduling'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {activeMode === 'assignments'
              ? 'Assign specific student sections (A–L) or individual candidates to scheduled examinations.'
              : 'Configure independent examination durations, passing criteria, proctoring locks, and question banks.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Mode Switcher */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveMode('exams')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeMode === 'exams'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Examinations ({state.exams.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('assignments')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeMode === 'assignments'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Section & Student Matrix
            </button>
          </div>

          <button
            type="button"
            onClick={() => setExportExamId('ALL')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Sheets / CSV
          </button>

          <button
            type="button"
            onClick={openNewExamModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create Examination
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs font-bold text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeMode === 'assignments' && activeAssignExam ? (
        /* STUDENT & COHORT ASSIGNMENT MATRIX */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <label
                htmlFor="assign-exam-select"
                className="block text-xs font-bold text-slate-500 uppercase mb-1"
              >
                Select Target Examination
              </label>
              <select
                id="assign-exam-select"
                value={activeAssignExam.id}
                onChange={(e) => setSelectedExamForAssign(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600"
              >
                {state.exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} ({ex.subjectName} · {ex.durationMinutes} mins)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="px-4 py-2.5 rounded-xl bg-blue-50 text-blue-800 font-semibold">
                Assigned Students:{' '}
                <span className="font-mono font-bold">
                  {activeAssignExam.assignedStudentIds.length}
                </span>{' '}
                / {state.students.length}
              </div>
              <button
                type="button"
                onClick={() => {
                  examStore.assignStudentsToExam(
                    activeAssignExam.id,
                    state.students.map((s) => s.id),
                    [...COHORT_SECTIONS]
                  );
                  showBannerMessage(
                    `Assigned all Sections (A–L) and ${state.students.length} students to "${activeAssignExam.title}".`
                  );
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors"
              >
                Assign All Sections & Students
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-700 uppercase">
                Assigned Student Sections (A – L)
              </h2>
              <span className="text-xs text-slate-500">
                Click a section badge to toggle eligibility for all students in that section
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
              {COHORT_SECTIONS.map((cohort) => {
                const cleanCohorts = normalizeAndDedupeSections(
                  activeAssignExam.assignedCohorts
                );
                const active = cleanCohorts.includes(cohort);
                return (
                  <button
                    key={cohort}
                    type="button"
                    onClick={() => handleToggleCohortAssignment(cohort)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      active
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Sec {cohort}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold text-slate-700 uppercase mb-3">
              Individual Candidate Roster Eligibility
            </h2>
            <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4">Assigned</th>
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4">Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.students.map((stu) => {
                    const checked =
                      activeAssignExam.assignedStudentIds.includes(stu.id) ||
                      normalizeAndDedupeSections(
                        activeAssignExam.assignedCohorts
                      ).includes(stu.section);
                    return (
                      <tr
                        key={stu.id}
                        onClick={() => handleToggleStudentAssignment(stu.id)}
                        className="hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            aria-label={`Assign ${stu.name}`}
                            checked={checked}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-blue-600"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">
                          {stu.studentId}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {stu.name}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-700">
                          Section {stu.section}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{stu.department}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* EXAMINATIONS LIST & LIFECYCLE CONTROLS */
        <>
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                'ALL',
                'Published',
                'Scheduled',
                'Draft',
                'Results Published',
              ].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All Exams' : st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search exams or subjects..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
                Showing{' '}
                <span className="font-bold text-slate-900">
                  {filteredExams.length}
                </span>{' '}
                exams
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredExams.map((exam) => {
              const examQuestions = state.questions.filter(
                (q) => q.examId === exam.id
              );
              const qCount = examQuestions.length;
              const mcqCount = examQuestions.filter((q) => q.type === 'mcq').length;
              const descCount = examQuestions.filter(
                (q) => q.type === 'descriptive'
              ).length;
              const codeCount = examQuestions.filter(
                (q) => q.type === 'programming'
              ).length;
              const cleanCohorts = normalizeAndDedupeSections(exam.assignedCohorts);
              const eligibleStudentsCount = state.students.filter(
                (s) =>
                  exam.assignedStudentIds.includes(s.id) ||
                  cleanCohorts.includes(s.section)
              ).length;

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between gap-5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-blue-600 truncate">
                          {exam.subjectName} · Sections:{' '}
                          {cleanCohorts.length === 12
                            ? 'All (A–L)'
                            : cleanCohorts.join(', ')}
                        </div>
                        <h2 className="text-lg font-extrabold text-slate-900 mt-0.5 truncate">
                          {exam.title}
                        </h2>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                            exam.status === 'Draft'
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          }`}
                        >
                          {exam.status === 'Draft'
                            ? 'Draft · Hidden from Students'
                            : 'Live · Visible to Students'}
                        </span>

                        {exam.status === 'Draft' ? (
                          <button
                            type="button"
                            onClick={() => {
                              examStore.updateExam(exam.id, {
                                status: 'Published',
                              });
                              showBannerMessage(
                                `Published "${exam.title}" — now visible in Student Login.`
                              );
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                            title="Publish immediately so students can view and take this examination"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Publish to Students
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              examStore.updateExam(exam.id, {
                                status: 'Draft',
                              });
                              showBannerMessage(
                                `Moved "${exam.title}" to Draft — now hidden from Student Login.`
                              );
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                            title="Move to Draft mode to hide this examination from Student Login"
                          >
                            Set as Draft (Hide)
                          </button>
                        )}

                        <select
                          aria-label={`Status for ${exam.title}`}
                          value={exam.status}
                          onChange={(e) => {
                            const nextStatus = e.target.value as ExamStatus;
                            examStore.updateExam(exam.id, {
                              status: nextStatus,
                            });
                            showBannerMessage(
                              `Updated "${exam.title}" status to ${nextStatus} (${
                                nextStatus === 'Draft'
                                  ? 'Hidden from Student Login'
                                  : 'Visible to Students'
                              }).`
                            );
                          }}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none cursor-pointer"
                        >
                          <option value="Draft">Draft (Hidden from Students)</option>
                          <option value="Scheduled">Scheduled (Visible)</option>
                          <option value="Published">Published (Live for Students)</option>
                          <option value="Ongoing">Ongoing (Live)</option>
                          <option value="Completed">Completed</option>
                          <option value="Results Published">Results Published</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-2">
                      {exam.description}
                    </p>

                    {/* Question Breakdown & Warnings */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                      {qCount === 0 ? (
                        <button
                          type="button"
                          onClick={() => onNavigateToQuestions(exam.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          No questions added yet — Click to add questions
                        </button>
                      ) : (
                        <>
                          {mcqCount > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold">
                              {mcqCount} MCQ
                            </span>
                          )}
                          {descCount > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold">
                              {descCount} Theory
                            </span>
                          )}
                          {codeCount > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">
                              {codeCount} Coding
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <div className="text-slate-400">Schedule</div>
                        <div className="font-bold text-slate-800 font-mono mt-0.5">
                          {exam.scheduledDate}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Duration</div>
                        <div className="font-bold text-slate-800 font-mono mt-0.5">
                          {exam.durationMinutes} mins
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Marks (Pass)</div>
                        <div className="font-bold text-slate-800 font-mono mt-0.5">
                          {exam.totalMarks} ({exam.passingMarks})
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Questions</div>
                        <div className="font-bold text-blue-600 font-mono mt-0.5">
                          {qCount} items
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExamForAssign(exam.id);
                          setActiveMode('assignments');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                        title="Manage assigned sections and student eligibility"
                      >
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span>{eligibleStudentsCount} students eligible</span>
                      </button>
                      {exam.webcamProctoring && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" /> Proctored
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setHallTicketExam(exam)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                        title="Preview Candidate Hall Ticket / Admit Card"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Hall Ticket
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintableExam(exam)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        title="Preview Printable Question Paper (PDF) & Post-Publish Student View"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Preview &amp; Print Paper
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateToQuestions(exam.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        Questions ({qCount})
                      </button>
                      <button
                        type="button"
                        aria-label={`Edit ${exam.title}`}
                        onClick={() => openEditExamModal(exam)}
                        className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${exam.title}`}
                        onClick={() => {
                          examStore.deleteExam(exam.id);
                          showBannerMessage(`Deleted examination "${exam.title}".`);
                        }}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredExams.length === 0 && (
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-10 text-center space-y-3">
                <div className="text-sm font-extrabold text-slate-900">
                  No matching examinations found
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click <strong>Create Examination</strong> above to configure a live assessment, duration, passing criteria, and assigned student sections (A–L).
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create / Edit Examination Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-xl font-extrabold text-slate-900">
                {editingExamId ? 'Edit Examination' : 'Create New Examination'}
              </h2>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="mt-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Examination Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Technical Skill Assessment - 1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subject *
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {state.subjects.length === 0 && (
                      <option value="">General Assessment</option>
                    )}
                    {state.subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief overview of examination topics..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duration (Mins)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={360}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={totalMarks}
                    onChange={(e) => {
                      const nextTotal = Math.max(1, Number(e.target.value) || 60);
                      setTotalMarks(nextTotal);
                      if (passingMarks > nextTotal) {
                        setPassingMarks(Math.ceil(nextTotal * 0.5));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Passing Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={totalMarks}
                    value={passingMarks}
                    onChange={(e) =>
                      setPassingMarks(
                        Math.min(totalMarks, Math.max(1, Number(e.target.value) || 1))
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Assigned Student Sections (A – L)
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAssignedCohorts([...COHORT_SECTIONS])}
                      className="font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Select All (A–L)
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setAssignedCohorts(['A'])}
                      className="font-bold text-slate-500 hover:underline cursor-pointer"
                    >
                      Reset to Sec A
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                  {COHORT_SECTIONS.map((sec) => {
                    const selected = assignedCohorts.includes(sec);
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => toggleCohortInModal(sec)}
                        className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
                          selected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {sec}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ExamStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="Published">Published (Available to Students)</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Draft">Draft (Hidden from Students)</option>
                    <option value="Results Published">Results Published</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Timed Auto-Publish Results (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={autoPublishAt}
                    onChange={(e) => setAutoPublishAt(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Fullscreen & AI Webcam Proctoring Lock
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Enforces fullscreen mode, tab-switch violation alerts, and live webcam feed
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={webcamProctoring}
                  onChange={(e) => setWebcamProctoring(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Candidate Examination Instructions
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Enter candidate instructions displayed before and during the examination..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  {editingExamId ? 'Update Examination' : 'Create Examination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printableExam && (
        <PrintablePaperModal
          exam={printableExam}
          questions={state.questions.filter((q) => q.examId === printableExam.id)}
          onClose={() => setPrintableExam(null)}
        />
      )}

      {hallTicketExam && (
        <HallTicketModal
          exam={hallTicketExam}
          student={{
            id: state.students[0]?.id || 'candidate-preview',
            name: state.students[0]?.name || '[Registered Candidate Name]',
            email: state.students[0]?.email || 'candidate@institution.edu',
            role: 'student',
            studentId: state.students[0]?.studentId || 'REG-ID',
            department:
              state.students[0]?.department || 'Academic Department',
            year: state.students[0]?.year || 'Current Year',
            section: state.students[0]?.section || 'A',
          }}
          settings={state.settings}
          onClose={() => setHallTicketExam(null)}
        />
      )}

      {exportExamId !== null && (
        <GoogleSheetsExportModal
          initialExamId={exportExamId}
          onClose={() => setExportExamId(null)}
        />
      )}
    </div>
  );
};
