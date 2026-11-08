import React, { useState } from 'react';
import {
  CheckCircle2,
  Trophy,
  Award,
  Play,
  Eye,
  ShieldCheck,
  Calendar,
  BookOpen,
  Clock,
  Save,
  User,
  Phone,
  MapPin,
  GraduationCap,
  Code2,
  Globe,
  Search,
  FileText,
  Download,
} from 'lucide-react';
import {
  UserProfile,
  examStore,
  Exam,
  ALL_SECTIONS,
  normalizeSection,
} from '../../services/examStore.ts';
import { downloadCertificateRecord } from '../../utils/certificateDownload.ts';
import { HallTicketModal } from './HallTicketModal.tsx';

interface StudentDashboardProps {
  currentUser: UserProfile;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onStartExam: (examId: string) => void;
  onViewResults: (attemptId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onStartExam,
  onViewResults,
}) => {
  const state = examStore.getState();
  const [confirmStartExam, setConfirmStartExam] = useState<Exam | null>(null);
  const [hallTicketExam, setHallTicketExam] = useState<Exam | null>(null);
  const [profileSavedBanner, setProfileSavedBanner] = useState<string | null>(
    null
  );

  // Filters for dedicated "My Examinations" tab
  const [examSearch, setExamSearch] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [examStatusFilter, setExamStatusFilter] = useState<
    'ALL' | 'available' | 'completed'
  >('ALL');

  // Student record lookup (matches by internal ID or Student Registration ID across devices)
  const studentRecord = state.students.find(
    (s) =>
      s.id === currentUser.id ||
      (currentUser.studentId &&
        s.studentId.toLowerCase() === currentUser.studentId.toLowerCase())
  );

  // Editable Student Profile Form States (100% Live Student Data)
  const [fullName, setFullName] = useState<string>(currentUser.name || '');
  const [email, setEmail] = useState<string>(currentUser.email || '');
  const [phone, setPhone] = useState<string>(
    currentUser.phone || studentRecord?.phone || ''
  );
  const [dateOfBirth, setDateOfBirth] = useState<string>(
    currentUser.dateOfBirth || studentRecord?.dateOfBirth || ''
  );
  const [gender, setGender] = useState<string>(
    currentUser.gender || studentRecord?.gender || ''
  );
  const [department, setDepartment] = useState<string>(
    currentUser.department ||
      studentRecord?.department ||
      'Computer Science & Engineering'
  );
  const [year, setYear] = useState<string>(
    currentUser.year || studentRecord?.year || 'Year 3'
  );
  const [section, setSection] = useState<string>(
    normalizeSection(currentUser.section || studentRecord?.section || 'A')
  );
  const [cgpa, setCgpa] = useState<string>(
    currentUser.cgpa || studentRecord?.cgpa || ''
  );
  const [address, setAddress] = useState<string>(
    currentUser.address || studentRecord?.address || ''
  );
  const [city, setCity] = useState<string>(
    currentUser.city || studentRecord?.city || ''
  );
  const [guardianName, setGuardianName] = useState<string>(
    currentUser.guardianName || studentRecord?.guardianName || ''
  );
  const [guardianPhone, setGuardianPhone] = useState<string>(
    currentUser.guardianPhone || studentRecord?.guardianPhone || ''
  );
  const [linkedinUrl, setLinkedinUrl] = useState<string>(
    currentUser.linkedinUrl || studentRecord?.linkedinUrl || ''
  );
  const [githubUrl, setGithubUrl] = useState<string>(
    currentUser.githubUrl || studentRecord?.githubUrl || ''
  );
  const [skills, setSkills] = useState<string>(
    currentUser.skills || studentRecord?.skills || ''
  );
  const [bio, setBio] = useState<string>(
    currentUser.bio || studentRecord?.bio || ''
  );

  // Exams assigned to this student or their section (excluding Draft exams)
  const effectiveSection = normalizeSection(
    currentUser.section || studentRecord?.section || 'A'
  );
  const rawAssignedExams = state.exams.filter(
    (e) =>
      e.status !== 'Draft' &&
      (e.assignedStudentIds.includes(currentUser.id) ||
        (studentRecord && e.assignedStudentIds.includes(studentRecord.id)) ||
        e.assignedCohorts.map(normalizeSection).includes(effectiveSection))
  );
  const assignedExams =
    rawAssignedExams.length > 0
      ? rawAssignedExams
      : state.exams.filter((e) => e.status !== 'Draft');

  const myAttempts = state.attempts.filter(
    (a) =>
      a.studentId === currentUser.id ||
      (currentUser.studentId &&
        a.studentRegId?.toLowerCase() === currentUser.studentId.toLowerCase())
  );
  const publishedAttempts = myAttempts.filter((a) => a.status === 'published');

  // Ensure every passed attempt has a certificate available for this student
  const myCertificates = state.certificates.filter(
    (c) =>
      c.studentId === currentUser.id ||
      (currentUser.studentId &&
        c.studentRegId?.toLowerCase() === currentUser.studentId.toLowerCase())
  );

  const upcomingExams = assignedExams.filter(
    (e) =>
      e.status === 'Scheduled' ||
      !myAttempts.some((a) => a.examId === e.id && a.status === 'published')
  );

  const avgPercentage =
    publishedAttempts.length > 0
      ? Math.round(
          publishedAttempts.reduce((acc, a) => acc + a.percentage, 0) /
            publishedAttempts.length
        )
      : 0;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    examStore.updateStudentProfile(currentUser.id, {
      name: fullName.trim() || currentUser.name,
      email: email.trim() || currentUser.email,
      phone: phone.trim(),
      dateOfBirth,
      gender,
      department: department.trim(),
      year: year.trim(),
      section: section.trim(),
      cgpa: cgpa.trim(),
      address: address.trim(),
      city: city.trim(),
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      linkedinUrl: linkedinUrl.trim(),
      githubUrl: githubUrl.trim(),
      skills: skills.trim(),
      bio: bio.trim(),
    });
    setProfileSavedBanner(
      'Your student profile and academic details have been saved!'
    );
  };

  // Pre-Exam Modal Helper
  const renderConfirmStartModal = () =>
    confirmStartExam && (
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
          <div>
            <div className="text-xs font-bold text-blue-600 uppercase">
              Examination Instructions &amp; Proctoring Verification
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              {confirmStartExam.title}
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <div className="text-slate-400">Duration</div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {confirmStartExam.durationMinutes} Minutes
              </div>
            </div>
            <div>
              <div className="text-slate-400">Total Marks</div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {confirmStartExam.totalMarks} Points
              </div>
            </div>
            <div>
              <div className="text-slate-400">Passing Marks</div>
              <div className="font-mono font-bold text-emerald-700 mt-0.5">
                {confirmStartExam.passingMarks} Points
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
            {confirmStartExam.instructions}
          </div>

          <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200 space-y-2 text-xs text-red-900">
            <div className="font-extrabold uppercase tracking-wider text-red-700">
              Strict Proctoring &amp; Key Lockdown Rules
            </div>
            <ul className="list-disc pl-4 space-y-1 font-medium">
              <li>
                <strong>No Tab Shifting or Window Switching:</strong> Switching browser tabs or losing window focus is immediately logged as a violation.
              </li>
              <li>
                <strong>Escape &amp; Shortcut Keys Blocked:</strong> Keys that escape or bypass rules (<code className="font-mono">Esc</code>, <code className="font-mono">F1–F12</code>, <code className="font-mono">Alt+Tab</code>, <code className="font-mono">Ctrl+Tab</code>, <code className="font-mono">Ctrl+C/V/X/R/U/P</code>, <code className="font-mono">Meta/Win</code>) are strictly disobeyed and flagged.
              </li>
              <li>
                <strong>3-Violation Automatic Termination:</strong> Reaching 3 logged proctoring violations automatically locks and submits your examination.
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setConfirmStartExam(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const id = confirmStartExam.id;
                setConfirmStartExam(null);
                try {
                  if (
                    document.fullscreenEnabled &&
                    !document.fullscreenElement
                  ) {
                    document.documentElement
                      .requestFullscreen?.()
                      .catch(() => {});
                  }
                  const nav = navigator as any;
                  if (nav.keyboard && typeof nav.keyboard.lock === 'function') {
                    nav.keyboard
                      .lock([
                        'Escape',
                        'Tab',
                        'F11',
                        'MetaLeft',
                        'MetaRight',
                        'AltLeft',
                        'AltRight',
                      ])
                      .catch(() => {});
                  }
                } catch {
                  // ignore fullscreen error in headless/iframe
                }
                onStartExam(id);
              }}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
            >
              Accept Rules &amp; Launch Fullscreen Exam
            </button>
          </div>
        </div>
      </div>
    );

  const renderHallTicketModal = () =>
    hallTicketExam && (
      <HallTicketModal
        exam={hallTicketExam}
        student={currentUser}
        settings={state.settings}
        onClose={() => setHallTicketExam(null)}
      />
    );

  // 1. DEDICATED "MY EXAMINATIONS" PAGE ('student-exams')
  if (activeTab === 'student-exams') {
    const subjectsList = Array.from(
      new Set(assignedExams.map((e) => e.subjectName))
    );

    const filteredMyExams = assignedExams.filter((ex) => {
      const matchesSub =
        subjectFilter === 'ALL' || ex.subjectName === subjectFilter;
      const q = examSearch.trim().toLowerCase();
      const matchesQuery =
        !q ||
        ex.title.toLowerCase().includes(q) ||
        ex.subjectName.toLowerCase().includes(q) ||
        ex.description.toLowerCase().includes(q);
      const isCompleted = myAttempts.some(
        (a) =>
          a.examId === ex.id &&
          (a.status === 'published' ||
            a.status === 'submitted' ||
            a.status === 'evaluated')
      );
      const matchesStatus =
        examStatusFilter === 'ALL'
          ? true
          : examStatusFilter === 'completed'
          ? Boolean(isCompleted)
          : !isCompleted;
      return matchesSub && matchesQuery && matchesStatus;
    });

    return (
      <div className="max-w-[1480px] w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-extrabold text-slate-900">
                My Assigned Examinations
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              All examinations assigned to {currentUser.name} (Section{' '}
              {effectiveSection}). Questions are randomized independently per
              candidate.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExamStatusFilter('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                examStatusFilter === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              All Exams ({assignedExams.length})
            </button>
            <button
              type="button"
              onClick={() => setExamStatusFilter('available')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                examStatusFilter === 'available'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              Ready to Start
            </button>
            <button
              type="button"
              onClick={() => setExamStatusFilter('completed')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                examStatusFilter === 'completed'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Search & Subject Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={examSearch}
              onChange={(e) => setExamSearch(e.target.value)}
              placeholder="Search examination title or subject..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <label
              htmlFor="stu-exam-subject-filter"
              className="text-xs font-bold text-slate-600"
            >
              Subject:
            </label>
            <select
              id="stu-exam-subject-filter"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
            >
              <option value="ALL">All Subjects</option>
              {subjectsList.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Examinations Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMyExams.map((exam) => {
            const examAttempts = myAttempts.filter((a) => a.examId === exam.id);
            const inProgressAttempt = examAttempts.find(
              (a) => a.status === 'in-progress'
            );
            const publishedAttempt = examAttempts.find(
              (a) => a.status === 'published'
            );
            const submittedAttempt = examAttempts.find(
              (a) => a.status === 'submitted' || a.status === 'evaluated'
            );
            const examQuestions = state.questions.filter(
              (q) => q.examId === exam.id
            );
            const mcqCount = examQuestions.filter(
              (q) => q.type === 'mcq'
            ).length;
            const descCount = examQuestions.filter(
              (q) => q.type === 'descriptive'
            ).length;
            const codeCount = examQuestions.filter(
              (q) => q.type === 'programming'
            ).length;

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                      {exam.subjectName}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        publishedAttempt
                          ? 'bg-emerald-50 text-emerald-700'
                          : submittedAttempt
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {publishedAttempt
                        ? `Completed · ${publishedAttempt.percentage}% (${
                            publishedAttempt.passed ? 'PASSED' : 'FAILED'
                          })`
                        : inProgressAttempt
                        ? 'In Progress'
                        : submittedAttempt
                        ? 'Submitted (Awaiting Release)'
                        : exam.status}
                    </span>
                  </div>

                  <h2 className="text-base font-extrabold text-slate-900 mt-2">
                    {exam.title}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {exam.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-slate-400">Date &amp; Start</div>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {exam.scheduledDate} · {exam.startTime}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Duration</div>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {exam.durationMinutes} mins
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Marks &amp; Pass</div>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {exam.totalMarks} pts (Pass: {exam.passingMarks})
                      </div>
                    </div>
                  </div>

                  {/* Question Composition */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                      Total: {examQuestions.length} Questions
                    </span>
                    {mcqCount > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold">
                        {mcqCount} MCQ
                      </span>
                    )}
                    {descCount > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold">
                        {descCount} Descriptive
                      </span>
                    )}
                    {codeCount > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold">
                        {codeCount} Coding Sandbox
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Proctored Lockdown</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHallTicketExam(exam)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Hall Ticket
                    </button>
                    {publishedAttempt && (
                      <button
                        type="button"
                        onClick={() => onViewResults(publishedAttempt.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Result
                      </button>
                    )}
                    {submittedAttempt && !publishedAttempt && !inProgressAttempt ? (
                      <span className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                        Submitted · Under Evaluation
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmStartExam(exam)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        {inProgressAttempt
                          ? 'Resume Exam'
                          : publishedAttempt
                          ? 'Retake Practice'
                          : 'Start Examination'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredMyExams.length === 0 && (
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-10 text-center text-slate-500 text-sm">
              No assigned examinations match your current filter.
            </div>
          )}
        </div>

        {renderConfirmStartModal()}
        {renderHallTicketModal()}
      </div>
    );
  }

  // 2. STUDENT PROFILE TAB (Rich Editable Student Form)
  if (activeTab === 'student-profile') {
    return (
      <div className="max-w-[1480px] w-full mx-auto space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-3xl font-extrabold flex items-center justify-center shadow-md shrink-0">
              {(fullName || currentUser.name).charAt(0)}
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-blue-600">
                {currentUser.studentId || 'STU-2026-001'} ·{' '}
                {state.settings.institutionName}
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                {fullName || currentUser.name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {department} · {year} ({section}) · CGPA: {cgpa}
              </p>
            </div>
          </div>

          <span className="px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            Verified Student Candidate
          </span>
        </div>

        {profileSavedBanner && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{profileSavedBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setProfileSavedBanner(null)}
              className="text-xs font-bold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-8"
        >
          {/* Personal & Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                1. Personal &amp; Contact Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="stu-full-name"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Full Legal Name
                </label>
                <input
                  id="stu-full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="stu-reg-id"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Registration / Roll Number
                </label>
                <input
                  id="stu-reg-id"
                  type="text"
                  disabled
                  value={currentUser.studentId || 'STU-2026-001'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-500"
                />
              </div>

              <div>
                <label
                  htmlFor="stu-email"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Institutional Email Address
                </label>
                <input
                  id="stu-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="stu-phone"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Mobile Phone Number
                </label>
                <input
                  id="stu-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="stu-dob"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Date of Birth
                </label>
                <input
                  id="stu-dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="stu-gender"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Gender
                </label>
                <select
                  id="stu-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Academic Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                2. Academic &amp; Enrollment Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="stu-department"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Academic Department / Major
                </label>
                <input
                  id="stu-department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="stu-year"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Current Study Year
                </label>
                <select
                  id="stu-year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900"
                >
                  <option value="Year 1">Year 1</option>
                  <option value="Year 2">Year 2</option>
                  <option value="Year 3">Year 3</option>
                  <option value="Year 4">Year 4</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="stu-cgpa"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Current CGPA (4.0 Scale)
                </label>
                <input
                  id="stu-cgpa"
                  type="text"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  placeholder="3.88"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="stu-section"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Assigned Section (A – L)
                </label>
                <select
                  id="stu-section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900"
                >
                  {ALL_SECTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="stu-skills"
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1"
                >
                  <Code2 className="w-3.5 h-3.5 text-blue-600" />
                  Technical Skills &amp; Core Competencies
                </label>
                <input
                  id="stu-skills"
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="TypeScript, Python, SQL, Machine Learning..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Address, Guardian & Portfolio Links */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                3. Residential Address, Emergency Guardian &amp; Portfolio
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="stu-address"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Residential Street Address
                </label>
                <input
                  id="stu-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="stu-city"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  City / State / Postal Code
                </label>
                <input
                  id="stu-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="stu-guardian-name"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Parent / Emergency Guardian Name
                </label>
                <input
                  id="stu-guardian-name"
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="stu-guardian-phone"
                  className="flex items-center gap-1 text-xs font-bold text-slate-700 mb-1"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Guardian Emergency Phone
                </label>
                <input
                  id="stu-guardian-phone"
                  type="text"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="stu-linkedin"
                  className="flex items-center gap-1 text-xs font-bold text-slate-700 mb-1"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  LinkedIn Profile URL
                </label>
                <input
                  id="stu-linkedin"
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="stu-github"
                  className="flex items-center gap-1 text-xs font-bold text-slate-700 mb-1"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-700" />
                  GitHub / Coding Portfolio URL
                </label>
                <input
                  id="stu-github"
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="stu-bio"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Academic Bio &amp; Career Objective
                </label>
                <textarea
                  id="stu-bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Student Profile Details
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 3. STUDENT CERTIFICATES TAB
  if (activeTab === 'student-certificates') {
    return (
      <div className="max-w-[1480px] w-full mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            My Achievement Certificates
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official certificates automatically filled and attached when you
            pass an examination.
          </p>
        </div>

        {myCertificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myCertificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-3xl border-2 border-blue-200 p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {state.settings.collegeLogoUrl && (
                      <img
                        src={state.settings.collegeLogoUrl}
                        alt="College Logo"
                        className="w-6 h-6 rounded-md object-contain"
                      />
                    )}
                    <span className="text-xs font-mono font-bold text-blue-600">
                      {cert.certificateNumber}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">
                    {cert.grade}
                  </span>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase text-slate-400">
                    {state.settings.institutionName}
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {cert.examTitle}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Candidate: <strong>{cert.studentName}</strong> · Score:{' '}
                    {cert.score} / {cert.maxScore} ({cert.percentage}%) · Issued{' '}
                    {cert.issuedAt}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      downloadCertificateRecord(state.certificateTemplate, cert)
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Certificate
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewResults(cert.attemptId)}
                    className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Inspect Full Score Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500 text-sm">
            No published achievement certificates yet. Complete and pass an
            examination to receive your certificate automatically!
          </div>
        )}
      </div>
    );
  }

  // 4. UPCOMING EXAMS TAB
  if (activeTab === 'student-upcoming') {
    return (
      <div className="max-w-[1480px] w-full mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-extrabold text-slate-900">
              Upcoming &amp; Scheduled Examinations
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Examinations scheduled for your cohort ({currentUser.section}) that
            are open or upcoming.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {upcomingExams.map((exam) => {
            const qCount = state.questions.filter(
              (q) => q.examId === exam.id
            ).length;
            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-blue-600">
                      {exam.subjectName}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold">
                      {exam.status}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900 mt-1">
                    {exam.title}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1.5">
                    {exam.description}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-slate-400">Date &amp; Window</div>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {exam.scheduledDate} · {exam.startTime}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Duration</div>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {exam.durationMinutes} mins
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Marks</div>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {exam.totalMarks} pts ({qCount} Qs)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    Starts: {exam.startTime} ({exam.durationMinutes} mins)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHallTicketExam(exam)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Hall Ticket
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmStartExam(exam)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Start Examination
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {upcomingExams.length === 0 && (
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-10 text-center text-slate-500 text-sm">
              You have completed all currently scheduled examinations for Section {effectiveSection}.
            </div>
          )}
        </div>
        {renderConfirmStartModal()}
        {renderHallTicketModal()}
      </div>
    );
  }

  // 5. EXAM HISTORY TAB
  if (activeTab === 'student-history') {
    return (
      <div className="max-w-[1480px] w-full mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Examination Attempt History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete audit log of all your submitted and in-progress examination
            attempts.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase bg-slate-50/60">
                  <th className="py-3.5 px-5">Examination</th>
                  <th className="py-3.5 px-5">Subject</th>
                  <th className="py-3.5 px-5">Submitted At</th>
                  <th className="py-3.5 px-5">Score</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myAttempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/80">
                    <td className="py-4 px-5 font-bold text-slate-900">
                      {att.examTitle}
                    </td>
                    <td className="py-4 px-5 text-slate-600">
                      {att.subjectName}
                    </td>
                    <td className="py-4 px-5 font-mono text-slate-500">
                      {att.submittedAt
                        ? new Date(att.submittedAt).toLocaleString()
                        : 'In Progress'}
                    </td>
                    <td className="py-4 px-5 font-mono font-bold text-slate-900">
                      {att.totalScore} / {att.maxScore} ({att.percentage}%)
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          att.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700'
                            : att.status === 'in-progress'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {att.status === 'published'
                          ? 'Published'
                          : att.status === 'in-progress'
                          ? 'In Progress'
                          : 'Submitted (Under Review)'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      {att.status === 'published' ? (
                        <button
                          type="button"
                          onClick={() => onViewResults(att.id)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          View Report &amp; Certificate →
                        </button>
                      ) : att.status === 'in-progress' ? (
                        <button
                          type="button"
                          onClick={() => onStartExam(att.examId)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          Resume Exam →
                        </button>
                      ) : (
                        <span className="text-slate-400">Pending Release</span>
                      )}
                    </td>
                  </tr>
                ))}
                {myAttempts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No examination attempts recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 6. PUBLISHED RESULTS TAB
  if (activeTab === 'student-results') {
    return (
      <div className="max-w-[1480px] w-full mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Published Examination Results
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Inspect question-by-question grading rubrics and download your
            automatically attached achievement certificates for passed exams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {publishedAttempts.map((att) => {
            return (
              <div
                key={att.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600">
                    {att.subjectName}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                      att.passed
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {att.passed ? 'PASSED' : 'FAILED'} · {att.percentage}%
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {att.examTitle}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Total Score:{' '}
                    <strong className="text-slate-900">
                      {att.totalScore} / {att.maxScore}
                    </strong>{' '}
                    (MCQ: {att.mcqScore}, Descriptive: {att.descriptiveScore},
                    Coding: {att.codingScore})
                  </p>
                </div>

                {att.passed && (
                  <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center gap-2 text-xs font-bold text-emerald-800">
                    <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Official Achievement Certificate Automatically Attached to
                      Result
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onViewResults(att.id)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Open Full Evaluation &amp; Attached Certificate
                </button>
              </div>
            );
          })}
          {publishedAttempts.length === 0 && (
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-10 text-center text-slate-500 text-sm">
              No published examination results yet. Complete an examination to view your detailed score breakdown and certificate.
            </div>
          )}
        </div>
      </div>
    );
  }

  // DEFAULT: STUDENT DASHBOARD ('student-dashboard')
  const studentProgressPct =
    assignedExams.length > 0
      ? Math.min(100, Math.round((myAttempts.length / assignedExams.length) * 100))
      : 0;
  const studentCertRatePct =
    myAttempts.length > 0
      ? Math.min(
          100,
          Math.round((myCertificates.length / myAttempts.length) * 100)
        )
      : 0;

  return (
    <div className="space-y-6 max-w-[1480px] w-full mx-auto">
      {/* Student Greeting Header (Matching "Welcome back, Tamilselvan! 👋" in Template) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-purple-300 font-semibold">
            {currentUser.studentId || 'STU-2026-001'} · Section{' '}
            {effectiveSection} ·{' '}
            {currentUser.department || 'Computer Science'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Welcome back, {currentUser.name}! <span aria-hidden="true">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Keep going! You&apos;re doing great — launch your proctored examinations
            and review your published certificates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onSelectTab('student-profile')}
            className="px-4 py-2.5 rounded-xl bg-[#131742] hover:bg-[#1C225C] border border-purple-500/35 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            Edit Student Profile
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('student-results')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white text-xs font-bold shadow-[0_0_20px_rgba(124,58,237,0.45)] transition-colors cursor-pointer whitespace-nowrap"
          >
            View My Results
          </button>
        </div>
      </div>

      {/* 4 Cosmic KPI Cards (Matching Top-Right Panel of Template) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl bg-gradient-to-b from-[#131744] to-[#0C0F2D] p-5 border border-purple-500/30 shadow-lg">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Total Attempts
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center">
              <Play className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2">
            {myAttempts.length}
          </div>
          <div className="text-xs font-bold text-emerald-400 mt-2 font-mono">
            ↑ {assignedExams.length} Assigned
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-b from-[#131744] to-[#0C0F2D] p-5 border border-purple-500/30 shadow-lg">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Exams Joined
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2">
            {assignedExams.length}
          </div>
          <div className="text-xs font-bold text-emerald-400 mt-2 font-mono">
            ↑ Section {effectiveSection}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-b from-[#131744] to-[#0C0F2D] p-5 border border-purple-500/30 shadow-lg">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Certificates Earned
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2">
            {myCertificates.length}
          </div>
          <div className="text-xs font-bold text-emerald-400 mt-2 font-mono">
            ↑ Auto-Verified
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-b from-[#131744] to-[#0C0F2D] p-5 border border-purple-500/30 shadow-lg">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Accuracy
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums mt-2">
            {avgPercentage}%
          </div>
          <div className="text-xs font-bold text-emerald-400 mt-2 font-mono">
            ↑ Published Score
          </div>
        </div>
      </div>

      {/* Middle Row: "Your Progress" Circular Gauge & Bars + "Next Examination" Glowing Trophy Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-3xl bg-gradient-to-b from-[#11153C] to-[#0B0E2A] border border-purple-500/30 p-6 shadow-xl">
          <h2 className="text-base font-extrabold text-white mb-5">
            Your Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
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
                    stroke="var(--theme-accent)"
                    strokeWidth="10"
                    strokeDasharray="314"
                    strokeDashoffset={314 - (314 * studentProgressPct) / 100}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <span className="absolute text-2xl font-extrabold text-white font-mono">
                  {studentProgressPct}%
                </span>
              </div>
              <div className="text-xs font-bold text-slate-300 mt-2">
                Overall Progress
              </div>
            </div>

            <div className="md:col-span-8 space-y-3.5">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
                  <span>
                    Assigned Examinations Attempted ({myAttempts.length}/
                    {assignedExams.length})
                  </span>
                  <span className="font-mono">{studentProgressPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#1B2054] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all"
                    style={{ width: `${studentProgressPct}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
                  <span>Published Results Accuracy</span>
                  <span className="font-mono">{avgPercentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#1B2054] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all"
                    style={{ width: `${avgPercentage}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
                  <span>
                    Merit Certificates Earned ({myCertificates.length})
                  </span>
                  <span className="font-mono">{studentCertRatePct}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#1B2054] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all"
                    style={{ width: `${studentCertRatePct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-3xl bg-gradient-to-br from-[#2B1B6E] via-[#1C1452] to-[#110E36] border border-purple-400/40 p-6 flex flex-col items-center justify-between text-center shadow-[0_0_35px_rgba(124,58,237,0.3)]">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
            <Trophy className="w-9 h-9" />
          </div>
          <div className="my-3">
            <div className="text-xs font-semibold text-purple-200">
              {upcomingExams[0] ? upcomingExams[0].title : 'Next Examination'}
            </div>
            <div className="text-xl font-extrabold text-white font-mono mt-1">
              {upcomingExams[0]
                ? `${upcomingExams[0].durationMinutes} mins · Sec ${effectiveSection}`
                : 'Ready to Start'}
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              upcomingExams[0]
                ? setConfirmStartExam(upcomingExams[0])
                : onSelectTab('student-exams')
            }
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white text-xs font-bold cursor-pointer"
          >
            View Details →
          </button>
        </div>
      </div>

      {/* Assigned & Available Examinations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">
            Assigned Examinations
          </h2>
          <button
            type="button"
            onClick={() => onSelectTab('student-exams')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            Open My Examinations Page →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {assignedExams.map((exam) => {
            const examAttempts = myAttempts.filter((a) => a.examId === exam.id);
            const inProgressAttempt = examAttempts.find(
              (a) => a.status === 'in-progress'
            );
            const publishedAttempt = examAttempts.find(
              (a) => a.status === 'published'
            );
            const submittedAttempt = examAttempts.find(
              (a) => a.status === 'submitted' || a.status === 'evaluated'
            );
            const qCount = state.questions.filter(
              (q) => q.examId === exam.id
            ).length;

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-blue-600">
                      {exam.subjectName}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        publishedAttempt
                          ? 'bg-emerald-50 text-emerald-700'
                          : submittedAttempt
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {publishedAttempt
                        ? `Completed · ${publishedAttempt.percentage}%`
                        : inProgressAttempt
                        ? 'In Progress'
                        : submittedAttempt
                        ? 'Submitted (Awaiting Release)'
                        : exam.status}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 mt-1">
                    {exam.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {exam.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-slate-400">Schedule</div>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {exam.scheduledDate}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Duration</div>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {exam.durationMinutes} mins
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Total Marks</div>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {exam.totalMarks} pts ({qCount} Qs)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Fullscreen Proctored</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHallTicketExam(exam)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Hall Ticket
                    </button>
                    {publishedAttempt && (
                      <button
                        type="button"
                        onClick={() => onViewResults(publishedAttempt.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Result
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setConfirmStartExam(exam)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      {inProgressAttempt
                        ? 'Resume Exam'
                        : publishedAttempt || submittedAttempt
                        ? 'Retake Practice Attempt'
                        : 'Start Examination'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Published Results History Section */}
      {publishedAttempts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-slate-900">
            Published Examination Results
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4">Examination</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {publishedAttempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {att.examTitle}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {att.subjectName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {att.totalScore} / {att.maxScore}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-blue-600">
                      {att.percentage}%
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          att.passed
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {att.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onViewResults(att.id)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        Inspect Breakdown &amp; Certificate →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {renderConfirmStartModal()}
      {renderHallTicketModal()}
    </div>
  );
};
