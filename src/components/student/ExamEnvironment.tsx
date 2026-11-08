import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock,
  ShieldAlert,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Maximize2,
  Code2,
  Lock,
  Ban,
} from 'lucide-react';
import { examStore, ViolationEvent } from '../../services/examStore.ts';
import {
  calculateRemainingSeconds,
  formatCountdownTimer,
  evaluateProgrammingSubmission,
  TestCaseResult,
  ProgrammingLanguage,
  PROGRAMMING_LANGUAGES,
  STARTER_CODE_TEMPLATES,
} from '../../utils/examLogic.ts';

interface ExamEnvironmentProps {
  examId: string;
  studentId: string;
  onExit: () => void;
  onViewResults: (attemptId: string) => void;
}

const MAX_ALLOWED_VIOLATIONS = 3;

export const ExamEnvironment: React.FC<ExamEnvironmentProps> = ({
  examId,
  studentId,
  onExit,
  onViewResults,
}) => {
  const [attempt, setAttempt] = useState(() =>
    examStore.startOrResumeAttempt(examId, studentId, true)
  );
  const state = examStore.getState();
  const exam = state.exams.find((e) => e.id === examId);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [warningBanner, setWarningBanner] = useState<string | null>(null);
  const [lockdownViolationModal, setLockdownViolationModal] = useState<{
    type: ViolationEvent['type'];
    message: string;
    count: number;
  } | null>(null);
  const [lastAutosavedAt, setLastAutosavedAt] = useState<string>('Just now');
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // Cooldown ref to avoid duplicate simultaneous blur + visibilitychange events within 800ms
  const lastViolationTsRef = useRef<number>(0);

  // Coding editor execution state
  const [codeResults, setCodeResults] = useState<TestCaseResult[] | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    calculateRemainingSeconds(
      attempt.startedAt,
      exam?.durationMinutes || 90,
      Date.now()
    )
  );

  // Subscribe to store updates & ensure attempt is synced after mount
  useEffect(() => {
    const synced = examStore.startOrResumeAttempt(examId, studentId, true);
    setAttempt({ ...synced });
    const unsub = examStore.subscribe(() => {
      const updated = examStore
        .getState()
        .attempts.find((a) => a.id === synced.id);
      if (updated) {
        setAttempt({ ...updated });
      }
    });
    return unsub;
  }, [examId, studentId, attempt.id]);

  const engageFullscreenAndKeyboardLock = useCallback(() => {
    try {
      if (document.fullscreenEnabled && !document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
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
      // ignore browser permission restrictions
    }
  }, []);

  const releaseFullscreenAndKeyboardLock = useCallback(() => {
    try {
      const nav = navigator as any;
      if (nav.keyboard && typeof nav.keyboard.unlock === 'function') {
        nav.keyboard.unlock();
      }
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveAndExit = useCallback(() => {
    releaseFullscreenAndKeyboardLock();
    onExit();
  }, [releaseFullscreenAndKeyboardLock, onExit]);

  const handleFinalSubmit = useCallback(() => {
    releaseFullscreenAndKeyboardLock();
    const submitted = examStore.submitAttempt(attempt.id);
    if (submitted) {
      onViewResults(submitted.id);
    } else {
      onExit();
    }
  }, [attempt.id, onViewResults, onExit, releaseFullscreenAndKeyboardLock]);

  // Trigger a strict violation record + modal + 3-strike check
  const triggerStrictViolation = useCallback(
    (
      type: ViolationEvent['type'],
      details: string,
      userFacingWarning: string
    ) => {
      // Do not stack violations while a modal is already open or if exam has 0 questions
      if (
        lockdownViolationModal ||
        showSubmitModal ||
        attempt.questionOrder.length === 0
      ) {
        return;
      }
      const now = Date.now();
      if (now - lastViolationTsRef.current < 800) {
        return;
      }
      lastViolationTsRef.current = now;

      examStore.recordViolation(attempt.id, type, details);
      const updatedAttempt = examStore
        .getState()
        .attempts.find((a) => a.id === attempt.id);
      const nextCount = updatedAttempt
        ? updatedAttempt.violationCount
        : attempt.violationCount + 1;

      setWarningBanner(userFacingWarning);
      setLockdownViolationModal({
        type,
        message: userFacingWarning,
        count: nextCount,
      });

      if (nextCount >= MAX_ALLOWED_VIOLATIONS) {
        setTimeout(() => {
          handleFinalSubmit();
        }, 2500);
      }
    },
    [
      attempt.id,
      attempt.violationCount,
      attempt.questionOrder.length,
      lockdownViolationModal,
      showSubmitModal,
      handleFinalSubmit,
    ]
  );

  // Countdown Timer & Automatic Submission on Expiration
  useEffect(() => {
    const timer = setInterval(() => {
      const rem = calculateRemainingSeconds(
        attempt.startedAt,
        exam?.durationMinutes || 90,
        Date.now()
      );
      setRemainingSeconds(rem);
      if (rem <= 0) {
        clearInterval(timer);
        handleFinalSubmit();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [attempt.startedAt, exam?.durationMinutes, handleFinalSubmit]);

  // Strict Proctoring Rules:
  // 1. No Tab Shift (visibilitychange)
  // 2. No Window Switch / Focus Loss (window blur)
  // 3. No Fullscreen Exit (fullscreenchange)
  // 4. Disobey Escape, Function keys (F1-F12), Tab, Alt, Meta/Win, Ctrl+C/V/X/R/W/T/N/U/P/S/F/I/J
  // 5. Block Right-Click (contextmenu), Copy, Cut, Paste, Drag
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerStrictViolation(
          'Tab Switching',
          'Candidate shifted away from the active examination tab.',
          'STRICT PROCTORING ALERT: Tab shifting is strictly prohibited during the examination!'
        );
      }
    };

    const handleWindowBlur = () => {
      if (document.hidden) return; // already handled by visibilitychange
      triggerStrictViolation(
        'Window Blur',
        'Examination window lost focus (Alt+Tab or external application switch detected).',
        'STRICT PROCTORING ALERT: Leaving or unfocusing the examination window is prohibited!'
      );
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        triggerStrictViolation(
          'Fullscreen Exit',
          'Candidate exited mandatory fullscreen lockdown mode.',
          'STRICT PROCTORING ALERT: Exiting fullscreen mode is not permitted. Re-enter fullscreen immediately!'
        );
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const lowerKey = key.toLowerCase();
      const target = e.target as HTMLElement | null;
      const isCodeTextarea =
        target?.tagName === 'TEXTAREA' &&
        target?.getAttribute('aria-label') === 'Source Code Editor';

      // Handle Tab inside code editor by inserting 2 spaces instead of shifting focus
      if (key === 'Tab' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        if (isCodeTextarea && target instanceof HTMLTextAreaElement) {
          const start = target.selectionStart ?? 0;
          const end = target.selectionEnd ?? 0;
          const val = target.value;
          const nextVal = val.substring(0, start) + '  ' + val.substring(end);
          const q = examStore
            .getState()
            .questions.find(
              (item) => item.id === attempt.questionOrder[currentIndex]
            );
          if (q) {
            examStore.saveStudentAnswer(attempt.id, q.id, {
              codeText: nextVal,
            });
          }
          requestAnimationFrame(() => {
            target.selectionStart = target.selectionEnd = start + 2;
          });
          return;
        }
        triggerStrictViolation(
          'Forbidden Key Blocked',
          'Blocked Tab key focus shift attempt during examination.',
          'KEY DISOBEYED: Tab focus shifting is locked during the examination.'
        );
        return;
      }

      // Check for Escape, Function keys F1-F12, Meta/OS key, Alt combinations, PrintScreen, or restricted Ctrl/Cmd keys
      const isFunctionKey = /^F([1-9]|1[0-2])$/i.test(key);
      const isEscapeKey = key === 'Escape' || key === 'Esc';
      const isMetaOrOsKey =
        key === 'Meta' || key === 'OS' || key === 'ContextMenu' || e.metaKey;
      const isAltCombo = e.altKey || key === 'Alt';
      const isPrintScreen = key === 'PrintScreen';
      const isRestrictedCtrlCombo =
        e.ctrlKey &&
        [
          'c',
          'v',
          'x',
          'r',
          'w',
          't',
          'n',
          'u',
          'p',
          's',
          'f',
          'g',
          'h',
          'i',
          'j',
          'k',
          'tab',
        ].includes(lowerKey);

      if (
        isEscapeKey ||
        isFunctionKey ||
        isMetaOrOsKey ||
        isAltCombo ||
        isPrintScreen ||
        isRestrictedCtrlCombo
      ) {
        e.preventDefault();
        e.stopPropagation();

        const keyLabel = [
          e.ctrlKey ? 'Ctrl' : '',
          e.altKey ? 'Alt' : '',
          e.shiftKey ? 'Shift' : '',
          e.metaKey ? 'Meta' : '',
          key,
        ]
          .filter(Boolean)
          .join('+');

        triggerStrictViolation(
          'Forbidden Key Blocked',
          `Disobeyed restricted key/shortcut (${keyLabel}) during active exam lockdown.`,
          `KEY DISOBEYED (${keyLabel}): Escape and system shortcut keys are strictly blocked during the exam!`
        );
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' ||
        e.key === 'PrintScreen' ||
        e.key === 'Meta' ||
        e.key === 'Alt'
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      triggerStrictViolation(
        'Copy/Paste Blocked',
        'Blocked right-click context menu attempt on examination screen.',
        'ACTION BLOCKED: Right-click context menu is disabled during the examination.'
      );
    };

    const handleClipboardEvent = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      triggerStrictViolation(
        'Copy/Paste Blocked',
        `Blocked unauthorized ${e.type.toUpperCase()} clipboard operation during examination.`,
        `ACTION BLOCKED: Copy, Cut, and Paste (${e.type.toUpperCase()}) are strictly disabled during the examination!`
      );
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    document.addEventListener('contextmenu', handleContextMenu, {
      capture: true,
    });
    document.addEventListener('copy', handleClipboardEvent, { capture: true });
    document.addEventListener('cut', handleClipboardEvent, { capture: true });
    document.addEventListener('paste', handleClipboardEvent, { capture: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      document.removeEventListener('contextmenu', handleContextMenu, {
        capture: true,
      });
      document.removeEventListener('copy', handleClipboardEvent, {
        capture: true,
      });
      document.removeEventListener('cut', handleClipboardEvent, {
        capture: true,
      });
      document.removeEventListener('paste', handleClipboardEvent, {
        capture: true,
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [attempt.id, attempt.questionOrder, currentIndex, triggerStrictViolation]);

  // Retrieve questions in the student's saved randomized order
  const orderedQuestions = attempt.questionOrder
    .map((qId) => state.questions.find((q) => q.id === qId))
    .filter((q): q is NonNullable<typeof q> => Boolean(q));

  const safeIndex =
    orderedQuestions.length > 0
      ? Math.min(currentIndex, orderedQuestions.length - 1)
      : 0;
  const currentQuestion = orderedQuestions[safeIndex];
  const currentAnswer = currentQuestion
    ? attempt.answers[currentQuestion.id]
    : undefined;

  const updateAnswer = (patch: Record<string, any>) => {
    if (!currentQuestion) return;
    examStore.saveStudentAnswer(attempt.id, currentQuestion.id, patch);
    setLastAutosavedAt(
      new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  };

  const handleRunCodeSandbox = () => {
    if (!currentQuestion || currentQuestion.type !== 'programming') return;
    const code =
      currentAnswer?.codeText ?? currentQuestion.starterCode ?? '';
    const lang =
      currentAnswer?.codeLanguage ??
      currentQuestion.programmingLanguage ??
      'python';
    const res = evaluateProgrammingSubmission(
      code,
      lang,
      currentQuestion.testCases || [],
      currentQuestion.marks
    );
    setCodeResults(res.results);
    setCodeError(res.compilationError || null);
    updateAnswer({
      codeText: code,
      codeLanguage: lang,
      testCaseResults: res.results,
      awardedMarks: res.awardedMarks,
    });
  };

  const isQuestionAnswered = (qId: string) => {
    const ans = attempt.answers[qId];
    if (!ans) return false;
    const q = state.questions.find((item) => item.id === qId);
    if (q?.type === 'programming') {
      if (ans.testCaseResults && ans.testCaseResults.length > 0) {
        return true;
      }
      const code = (ans.codeText || '').trim();
      if (!code) return false;
      const starter = (q.starterCode || '').trim();
      const langStarter = (
        STARTER_CODE_TEMPLATES[ans.codeLanguage || q.programmingLanguage || 'python'] ||
        ''
      ).trim();
      return code !== starter && code !== langStarter;
    }
    return Boolean(
      ans.selectedOptionId ||
        (ans.descriptiveText && ans.descriptiveText.trim().length > 0) ||
        (ans.codeText && ans.codeText.trim().length > 0)
    );
  };

  const answeredCount = orderedQuestions.filter((q) =>
    isQuestionAnswered(q.id)
  ).length;

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      className="min-h-screen bg-[#0B1426] text-white flex flex-col select-none"
    >
      {/* Top Proctored Lockdown Header */}
      <header className="min-h-18 bg-[#080B24]/95 border-b border-purple-500/30 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 pr-3 border-r border-purple-500/25">
            <img
              src={state.settings.collegeLogoUrl || '/assets/panimalar-crest.png'}
              alt="Panimalar Crest"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/assets/panimalar-crest.png')) {
                  target.src = '/assets/panimalar-crest.png';
                }
              }}
              className="w-10 h-10 object-contain shrink-0"
            />
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-extrabold text-white tracking-tight">
                Exam
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Flow
                </span>
              </div>
              <div className="text-[10px] font-bold text-cyan-300">
                Dept. of AI &amp; Data Science
              </div>
            </div>
          </div>

          <div className="px-3 py-1 rounded-lg bg-red-600/20 border border-red-400/40 text-red-300 text-xs font-mono font-bold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            STRICT LOCKDOWN ACTIVE
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-white leading-none">
              {exam?.title || attempt.examTitle}
            </h1>
            <p className="text-[11px] text-slate-400 mt-1">
              Candidate: {attempt.studentName} ({attempt.studentRegId}) ·
              Autosaved: {lastAutosavedAt}
            </p>
          </div>
        </div>

        {/* Center Server-Controlled Countdown Timer & Violations Counter */}
        <div className="flex items-center gap-4">
          <div
            className={`hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-mono font-extrabold ${
              attempt.violationCount > 0
                ? 'bg-red-500/20 border-red-500/50 text-red-300'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>
              Violations: {attempt.violationCount} / {MAX_ALLOWED_VIOLATIONS}
            </span>
          </div>

          <div
            className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 font-mono text-lg font-extrabold tabular-nums ${
              remainingSeconds < 300
                ? 'bg-red-500/20 border-red-500 text-red-300'
                : 'bg-slate-900 border-slate-700 text-sky-300'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>{formatCountdownTimer(remainingSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={engageFullscreenAndKeyboardLock}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Lock Fullscreen
          </button>

          <button
            type="button"
            onClick={handleSaveAndExit}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
            title="Save your progress and return to the dashboard"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Save &amp; Exit
          </button>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/25 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Submit Exam
          </button>
        </div>
      </header>

      {/* Proctoring Violation Warning Banner */}
      {warningBanner && (
        <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between gap-4 text-xs font-bold">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{warningBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setWarningBanner(null)}
            className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs cursor-pointer"
          >
            Dismiss Banner
          </button>
        </div>
      )}

      {/* Main Split Interface: Left Question & Editor, Right Question Navigation Palette */}
      <div className="flex-1 max-w-[1520px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Question Workspace */}
        <div className="lg:col-span-9 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between">
          {currentQuestion ? (
            <div className="space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-blue-600 text-white text-xs font-extrabold font-mono">
                    Question {currentIndex + 1} of {orderedQuestions.length}
                  </span>
                  <span className="text-xs font-bold uppercase text-slate-500">
                    {currentQuestion.type} · {currentQuestion.difficulty}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-extrabold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl">
                    {currentQuestion.marks} Marks
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      examStore.toggleMarkForReview(
                        attempt.id,
                        currentQuestion.id
                      )
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      attempt.markedForReview.includes(currentQuestion.id)
                        ? 'bg-amber-50 border-amber-400 text-amber-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    {attempt.markedForReview.includes(currentQuestion.id)
                      ? 'Marked for Review'
                      : 'Mark for Review'}
                  </button>
                </div>
              </div>

              {/* Question Prompt */}
              <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                {currentQuestion.text}
              </div>

              {/* A. MCQ Answer Area */}
              {currentQuestion.type === 'mcq' && currentQuestion.options && (
                <div className="space-y-3 pt-2">
                  {currentQuestion.options.map((opt) => {
                    const selected =
                      currentAnswer?.selectedOptionId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          updateAnswer({ selectedOptionId: opt.id })
                        }
                        className={`w-full text-left p-4 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                          selected
                            ? 'bg-blue-50/70 border-blue-600 text-blue-950 font-bold shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold ${
                              selected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {opt.label}
                          </span>
                          <span className="text-sm">{opt.text}</span>
                        </div>
                        {selected && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* B. Descriptive Answer Editor */}
              {currentQuestion.type === 'descriptive' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Guidance:{' '}
                      {currentQuestion.answerLengthGuidance ||
                        'Write a clear, structured technical explanation.'}
                    </span>
                    <span className="font-mono">
                      {
                        (currentAnswer?.descriptiveText || '')
                          .trim()
                          .split(/\s+/)
                          .filter(Boolean).length
                      }{' '}
                      words
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={currentAnswer?.descriptiveText || ''}
                    onChange={(e) =>
                      updateAnswer({ descriptiveText: e.target.value })
                    }
                    placeholder="Type your comprehensive response here (autosaved immediately)..."
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none leading-relaxed"
                  />
                </div>
              )}

              {/* C. Integrated Programming Sandbox Editor */}
              {currentQuestion.type === 'programming' && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">
                        Input Format
                      </span>
                      <span className="font-medium text-slate-800">
                        {currentQuestion.inputFormat || 'Standard Input (stdin)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">
                        Output Format
                      </span>
                      <span className="font-medium text-slate-800">
                        {currentQuestion.outputFormat ||
                          'Standard Output (stdout)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">
                        Constraints
                      </span>
                      <span className="font-mono text-slate-800">
                        {currentQuestion.constraints || 'Time Limit: 1.0s'}
                      </span>
                    </div>
                  </div>

                  {/* Sample Test Cases Reference Card */}
                  {currentQuestion.testCases &&
                    currentQuestion.testCases.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-extrabold uppercase tracking-wider text-slate-600">
                            Sample Test Cases (I/O Reference)
                          </span>
                          <span className="font-mono text-slate-500">
                            {
                              currentQuestion.testCases.filter((t) => !t.isHidden)
                                .length
                            }{' '}
                            Sample ·{' '}
                            {
                              currentQuestion.testCases.filter((t) => t.isHidden)
                                .length
                            }{' '}
                            Hidden Evaluation Case(s)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {currentQuestion.testCases
                            .filter((tc) => !tc.isHidden)
                            .slice(0, 2)
                            .map((tc, idx) => (
                              <div
                                key={tc.id}
                                className="p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-xs grid grid-cols-2 gap-2"
                              >
                                <div>
                                  <span className="text-[10px] font-sans font-bold uppercase text-slate-400 block">
                                    Sample Input #{idx + 1}
                                  </span>
                                  <pre className="text-slate-800 whitespace-pre-wrap break-words mt-0.5">
                                    {tc.input}
                                  </pre>
                                </div>
                                <div>
                                  <span className="text-[10px] font-sans font-bold uppercase text-slate-400 block">
                                    Expected Output #{idx + 1}
                                  </span>
                                  <pre className="text-emerald-700 font-bold whitespace-pre-wrap break-words mt-0.5">
                                    {tc.expectedOutput}
                                  </pre>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* Code Editor Toolbar */}
                  <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#070E22]">
                    <div className="px-4 py-2.5 bg-[#0F1B38] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-sky-400" />
                        <select
                          aria-label="Select Programming Language"
                          value={
                            currentAnswer?.codeLanguage ||
                            currentQuestion.programmingLanguage ||
                            'python'
                          }
                          onChange={(e) => {
                            const nextLang = e.target
                              .value as ProgrammingLanguage;
                            const existingCode = (
                              currentAnswer?.codeText ??
                              currentQuestion.starterCode ??
                              ''
                            ).trim();
                            const isDefaultTemplate =
                              !existingCode ||
                              existingCode ===
                                (currentQuestion.starterCode || '').trim() ||
                              Object.values(STARTER_CODE_TEMPLATES).some(
                                (tpl) => tpl.trim() === existingCode
                              );
                            setCodeError(null);
                            updateAnswer({
                              codeLanguage: nextLang,
                              ...(isDefaultTemplate
                                ? {
                                    codeText:
                                      nextLang ===
                                        currentQuestion.programmingLanguage &&
                                      currentQuestion.starterCode
                                        ? currentQuestion.starterCode
                                        : STARTER_CODE_TEMPLATES[nextLang],
                                  }
                                : {}),
                            });
                          }}
                          className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700"
                        >
                          {PROGRAMMING_LANGUAGES.map((lang) => (
                            <option key={lang.id} value={lang.id}>
                              {lang.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const activeLang =
                              currentAnswer?.codeLanguage ||
                              currentQuestion.programmingLanguage ||
                              'python';
                            setCodeError(null);
                            updateAnswer({
                              codeText:
                                activeLang ===
                                  currentQuestion.programmingLanguage &&
                                currentQuestion.starterCode
                                  ? currentQuestion.starterCode
                                  : STARTER_CODE_TEMPLATES[activeLang],
                            });
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={handleRunCodeSandbox}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          Run Code &amp; Test Cases
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={10}
                      aria-label="Source Code Editor"
                      value={
                        currentAnswer?.codeText ??
                        currentQuestion.starterCode ??
                        ''
                      }
                      onChange={(e) => {
                        if (codeError) setCodeError(null);
                        updateAnswer({ codeText: e.target.value });
                      }}
                      className="w-full p-4 bg-[#070E22] text-emerald-400 font-mono text-xs sm:text-sm focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Test Case Execution Output Panel */}
                  {(codeResults || currentAnswer?.testCaseResults) && (
                    <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-sky-300">
                          Sandbox Test Case Execution Results
                        </span>
                        {codeError && (
                          <span className="text-red-400 font-mono">
                            {codeError}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {(codeResults || currentAnswer?.testCaseResults || []).map(
                          (tc, idx) => (
                            <div
                              key={tc.testCaseId}
                              className={`p-3 rounded-xl border font-mono text-xs ${
                                tc.passed
                                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                                  : 'bg-red-950/50 border-red-500/40 text-red-200'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold mb-1">
                                <span>
                                  {tc.isHidden
                                    ? `Hidden Case #${idx + 1}`
                                    : `Sample Case #${idx + 1}`}
                                </span>
                                <span>{tc.passed ? 'PASSED' : 'FAILED'}</span>
                              </div>
                              {!tc.isHidden && (
                                <>
                                  <div className="text-[11px] opacity-80 whitespace-pre-wrap">
                                    Input: {tc.input}
                                  </div>
                                  <div className="text-[11px] whitespace-pre-wrap">
                                    Expected: {tc.expectedOutput} | Actual:{' '}
                                    {tc.actualOutput || '(empty)'}
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="my-auto py-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-slate-900">
                  No Questions Configured for This Examination Yet
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  The examination administrator has not added questions to{' '}
                  <strong>{exam?.title || attempt.examTitle}</strong> yet. Please save and return to your dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveAndExit}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Return to Student Dashboard
              </button>
            </div>
          )}

          {/* Bottom Question Navigation Controls */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => {
                setCodeResults(null);
                setCurrentIndex((i) => Math.max(0, i - 1));
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="text-xs text-slate-400 font-medium">
              Randomized Order Locked for {attempt.studentRegId}
            </div>

            {currentIndex < orderedQuestions.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  setCodeResults(null);
                  setCurrentIndex((i) =>
                    Math.min(orderedQuestions.length - 1, i + 1)
                  );
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Next Question
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Finish &amp; Submit
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Question Navigation Palette & Strict Proctoring Rules */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-[#0F1D3A] rounded-3xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                Question Palette
              </span>
              <span className="text-xs font-mono text-sky-400 font-bold">
                {answeredCount} / {orderedQuestions.length} Answered
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {orderedQuestions.map((q, idx) => {
                const active = idx === currentIndex;
                const answered = isQuestionAnswered(q.id);
                const review = attempt.markedForReview.includes(q.id);

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setCodeResults(null);
                      setCurrentIndex(idx);
                    }}
                    className={`h-11 rounded-xl font-mono text-xs font-extrabold transition-all cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white ring-2 ring-white'
                        : review
                        ? 'bg-amber-500 text-slate-950'
                        : answered
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
                Current
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
                Answered
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                For Review
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-800 inline-block" />
                Unanswered
              </div>
            </div>
          </div>

          {/* Strict Proctoring Rules & Key Lock Status Card */}
          <div className="bg-[#0F1D3A] rounded-3xl border border-slate-800 p-5 space-y-3.5">
            <div className="flex items-center justify-between text-xs font-extrabold text-white">
              <span>Strict Proctoring Rules</span>
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Logged Violations:</span>
                <span
                  className={`font-mono font-extrabold ${
                    attempt.violationCount > 0
                      ? 'text-red-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {attempt.violationCount} / {MAX_ALLOWED_VIOLATIONS} Max
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Key Escape Lock:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  ENFORCED
                </span>
              </div>
            </div>

            <ul className="space-y-2 text-[11px] text-slate-300">
              <li className="flex items-start gap-2">
                <Ban className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">No Tab Shift:</strong> Switching tabs or minimizing window logs an immediate violation.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Ban className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Escape Keys Disobeyed:</strong>{' '}
                  <code className="font-mono text-sky-300">Esc</code>,{' '}
                  <code className="font-mono text-sky-300">F1–F12</code>,{' '}
                  <code className="font-mono text-sky-300">Alt+Tab</code>,{' '}
                  <code className="font-mono text-sky-300">Ctrl+Tab</code>, and{' '}
                  <code className="font-mono text-sky-300">Win/Meta</code> are blocked.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Ban className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Clipboard Locked:</strong> Copy, Cut, Paste, and Right-Click are disabled.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-amber-300">3-Strike Auto-Submit:</strong> Reaching {MAX_ALLOWED_VIOLATIONS} violations terminates the exam automatically.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Strict Proctoring Lockdown Violation Modal */}
      {lockdownViolationModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-red-500 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-extrabold uppercase tracking-wider">
                  Violation {lockdownViolationModal.count} of{' '}
                  {MAX_ALLOWED_VIOLATIONS} · {lockdownViolationModal.type}
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                  {lockdownViolationModal.count >= MAX_ALLOWED_VIOLATIONS
                    ? 'Maximum Violations Reached — Terminating Exam'
                    : 'Proctoring Rule Breach Detected'}
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-red-50 p-4 rounded-2xl border border-red-200 font-medium">
              {lockdownViolationModal.message}
            </p>

            {lockdownViolationModal.count >= MAX_ALLOWED_VIOLATIONS ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-red-700">
                  You have reached {MAX_ALLOWED_VIOLATIONS} recorded security violations. Your examination is being automatically locked and submitted.
                </p>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold cursor-pointer"
                >
                  Submit Terminated Examination Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Remaining warnings before automatic termination:{' '}
                  <strong className="text-red-600">
                    {MAX_ALLOWED_VIOLATIONS - lockdownViolationModal.count}
                  </strong>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLockdownViolationModal(null);
                    engageFullscreenAndKeyboardLock();
                  }}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md cursor-pointer"
                >
                  Acknowledge Rule &amp; Re-Lock Fullscreen
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <h2 className="text-xl font-extrabold">
              Submit Final Examination?
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              You have answered{' '}
              <strong className="text-slate-900">{answeredCount}</strong> out of{' '}
              <strong className="text-slate-900">
                {orderedQuestions.length}
              </strong>{' '}
              questions. Once submitted, your MCQ and programming test cases
              will be graded immediately.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
              >
                Return to Questions
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Confirm &amp; Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
