import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Trash2,
  Code2,
  FileText,
  CheckSquare,
  CheckCircle2,
  EyeOff,
  Eye,
  Edit3,
  Play,
  AlertCircle,
  RotateCcw,
  X,
  Upload,
  Monitor,
  Send,
  Sparkles,
} from 'lucide-react';
import { examStore, Question, QuestionType } from '../../services/examStore.ts';
import {
  TestCase,
  TestCaseResult,
  ProgrammingLanguage,
  PROGRAMMING_LANGUAGES,
  STARTER_CODE_TEMPLATES,
  evaluateProgrammingSubmission,
} from '../../utils/examLogic.ts';
import { QuestionPaperImportModal } from './QuestionPaperImportModal.tsx';
import { PrintablePaperModal } from './PrintablePaperModal.tsx';
import { analyzeProgrammingQuestionSpec } from '../../utils/questionPaperParser.ts';

interface QuestionBankProps {
  initialExamId?: string;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({ initialExamId }) => {
  const state = examStore.getState();
  const [selectedExamId, setSelectedExamId] = useState<string>(
    initialExamId || state.exams[0]?.id || 'ALL'
  );
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [previewPaperMode, setPreviewPaperMode] = useState<
    'paper' | 'student-view' | null
  >(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Question builder state
  const [builderExamId, setBuilderExamId] = useState<string>(
    initialExamId && initialExamId !== 'ALL'
      ? initialExamId
      : state.exams[0]?.id || ''
  );
  const [qType, setQType] = useState<QuestionType>('mcq');
  const [qText, setQText] = useState<string>('');
  const [marks, setMarks] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(
    'Medium'
  );
  const [explanation, setExplanation] = useState<string>('');

  // MCQ Options
  const [optA, setOptA] = useState<string>('');
  const [optB, setOptB] = useState<string>('');
  const [optC, setOptC] = useState<string>('');
  const [optD, setOptD] = useState<string>('');
  const [correctOpt, setCorrectOpt] = useState<string>('opt-b');

  // Descriptive
  const [lengthGuidance, setLengthGuidance] = useState<string>(
    '100 - 250 words recommended'
  );
  const [sampleRubric, setSampleRubric] = useState<string>('');

  // Programming (Supports Python, C, C++, Java, JS, TS, C#, Go, Rust, SQL)
  const [progLang, setProgLang] = useState<ProgrammingLanguage>('python');
  const [starterCode, setStarterCode] = useState<string>(
    STARTER_CODE_TEMPLATES.python
  );
  const [inputFormat, setInputFormat] = useState<string>(
    'Space-separated integers on standard input (stdin)'
  );
  const [outputFormat, setOutputFormat] = useState<string>(
    'Print the computed result to standard output (stdout)'
  );
  const [constraints, setConstraints] = useState<string>(
    'Time Limit: 1.0s | Memory Limit: 64MB'
  );
  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: 'tc-1', input: '10 20', expectedOutput: '30', isHidden: false },
    { id: 'tc-2', input: '100 250', expectedOutput: '350', isHidden: true },
  ]);
  const [builderTestResults, setBuilderTestResults] = useState<
    TestCaseResult[] | null
  >(null);

  useEffect(() => {
    if (initialExamId) {
      setSelectedExamId(initialExamId);
      if (initialExamId !== 'ALL') {
        setBuilderExamId(initialExamId);
      }
    }
  }, [initialExamId]);

  const handleLanguageChange = (nextLang: ProgrammingLanguage) => {
    const isUsingDefaultTemplate = Object.values(
      STARTER_CODE_TEMPLATES
    ).some((tpl) => tpl.trim() === starterCode.trim());
    setProgLang(nextLang);
    if (!starterCode.trim() || isUsingDefaultTemplate) {
      setStarterCode(STARTER_CODE_TEMPLATES[nextLang]);
    }
    setBuilderTestResults(null);
  };

  const openNewQuestionBuilder = () => {
    setEditingQuestionId(null);
    setBuilderExamId(
      selectedExamId !== 'ALL' ? selectedExamId : state.exams[0]?.id || ''
    );
    setQType('mcq');
    setQText('');
    setMarks(10);
    setDifficulty('Medium');
    setExplanation('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectOpt('opt-b');
    setLengthGuidance('100 - 250 words recommended');
    setSampleRubric('');
    setProgLang('python');
    setStarterCode(STARTER_CODE_TEMPLATES.python);
    setInputFormat('Space-separated integers on standard input (stdin)');
    setOutputFormat('Print the computed result to standard output (stdout)');
    setConstraints('Time Limit: 1.0s | Memory Limit: 64MB');
    setTestCases([
      { id: 'tc-1', input: '10 20', expectedOutput: '30', isHidden: false },
      { id: 'tc-2', input: '100 250', expectedOutput: '350', isHidden: true },
    ]);
    setBuilderTestResults(null);
    setStatusBanner(null);
    setShowAddForm(true);
  };

  const openEditQuestionBuilder = (q: Question) => {
    setEditingQuestionId(q.id);
    setBuilderExamId(q.examId || state.exams[0]?.id || '');
    setQType(q.type);
    setQText(q.text);
    setMarks(q.marks);
    setDifficulty(q.difficulty);
    setExplanation(q.explanation || '');

    if (q.type === 'mcq') {
      const a = q.options?.find((o) => o.id === 'opt-a')?.text || '';
      const b = q.options?.find((o) => o.id === 'opt-b')?.text || '';
      const c = q.options?.find((o) => o.id === 'opt-c')?.text || '';
      const d = q.options?.find((o) => o.id === 'opt-d')?.text || '';
      setOptA(a);
      setOptB(b);
      setOptC(c);
      setOptD(d);
      setCorrectOpt(q.correctOptionId || 'opt-b');
    } else if (q.type === 'descriptive') {
      setLengthGuidance(q.answerLengthGuidance || '100 - 250 words recommended');
      setSampleRubric(q.sampleRubric || '');
    } else if (q.type === 'programming') {
      const lang = q.programmingLanguage || 'python';
      setProgLang(lang);
      setStarterCode(q.starterCode || STARTER_CODE_TEMPLATES[lang]);
      setInputFormat(
        q.inputFormat || 'Space-separated integers on standard input (stdin)'
      );
      setOutputFormat(
        q.outputFormat || 'Print the computed result to standard output (stdout)'
      );
      setConstraints(
        q.constraints || 'Time Limit: 1.0s | Memory Limit: 64MB'
      );
      setTestCases(
        q.testCases && q.testCases.length > 0
          ? q.testCases.map((tc) => ({ ...tc }))
          : [
              {
                id: 'tc-1',
                input: '10 20',
                expectedOutput: '30',
                isHidden: false,
              },
            ]
      );
    }
    setBuilderTestResults(null);
    setStatusBanner(null);
    setShowAddForm(true);
  };

  const handleAddTestCase = () => {
    setTestCases((prev) => [
      ...prev,
      {
        id: `tc-${Date.now()}-${prev.length + 1}`,
        input: '',
        expectedOutput: '',
        isHidden: false,
      },
    ]);
  };

  const handleUpdateTestCase = (
    id: string,
    field: keyof TestCase,
    val: string | boolean
  ) => {
    setTestCases((prev) =>
      prev.map((tc) => (tc.id === id ? { ...tc, [field]: val } : tc))
    );
  };

  const handleRemoveTestCase = (id: string) => {
    if (testCases.length <= 1) {
      setStatusBanner({
        type: 'error',
        text: 'At least one test case is required for a programming question.',
      });
      return;
    }
    setTestCases((prev) => prev.filter((tc) => tc.id !== id));
  };

  const handleVerifyStarterCode = () => {
    const validCases = testCases.filter(
      (tc) => tc.input.trim() !== '' || tc.expectedOutput.trim() !== ''
    );
    if (validCases.length === 0) {
      setStatusBanner({
        type: 'error',
        text: 'Please provide input and expected output for at least one test case before testing.',
      });
      return;
    }
    const evalOut = evaluateProgrammingSubmission(
      starterCode,
      progLang,
      validCases,
      Number(marks) || 10
    );
    setBuilderTestResults(evalOut.results);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) {
      setStatusBanner({
        type: 'error',
        text: 'Please enter a valid question or problem statement.',
      });
      return;
    }

    const targetExam =
      state.exams.find((ex) => ex.id === builderExamId) ||
      state.exams.find((ex) => ex.id === selectedExamId) ||
      state.exams[0];

    if (!targetExam) {
      setStatusBanner({
        type: 'error',
        text: 'No examination found. Please create an examination first.',
      });
      return;
    }

    const sanitizedTestCases =
      qType === 'programming'
        ? testCases.map((tc, i) => ({
            id: tc.id || `tc-${Date.now()}-${i}`,
            input: tc.input.trim() || (tc.expectedOutput.trim() ? '-' : '10 20'),
            expectedOutput: tc.expectedOutput.trim() || '30',
            isHidden: Boolean(tc.isHidden),
          }))
        : undefined;

    const payload: Omit<Question, 'id'> = {
      examId: targetExam.id,
      subjectId: targetExam.subjectId,
      type: qType,
      text: qText.trim(),
      marks: Math.max(1, Number(marks) || 10),
      difficulty,
      explanation: explanation.trim() || undefined,
      ...(qType === 'mcq'
        ? {
            options: [
              { id: 'opt-a', label: 'A', text: optA.trim() || 'Option A' },
              { id: 'opt-b', label: 'B', text: optB.trim() || 'Option B' },
              { id: 'opt-c', label: 'C', text: optC.trim() || 'Option C' },
              { id: 'opt-d', label: 'D', text: optD.trim() || 'Option D' },
            ],
            correctOptionId: correctOpt,
          }
        : {}),
      ...(qType === 'descriptive'
        ? {
            answerLengthGuidance: lengthGuidance,
            sampleRubric,
          }
        : {}),
      ...(qType === 'programming'
        ? {
            programmingLanguage: progLang,
            starterCode: starterCode || STARTER_CODE_TEMPLATES[progLang],
            inputFormat,
            outputFormat,
            constraints,
            testCases: sanitizedTestCases,
          }
        : {}),
    };

    if (editingQuestionId) {
      examStore.updateQuestion(editingQuestionId, payload);
      setStatusBanner({
        type: 'success',
        text: `Updated ${qType.toUpperCase()} question in "${targetExam.title}".`,
      });
    } else {
      examStore.addQuestion(payload);
      setStatusBanner({
        type: 'success',
        text: `Added new ${qType.toUpperCase()} question to "${targetExam.title}".`,
      });
    }

    setEditingQuestionId(null);
    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setBuilderTestResults(null);
    setShowAddForm(false);
  };

  const filteredQuestions = state.questions.filter((q) =>
    selectedExamId === 'ALL' ? true : q.examId === selectedExamId
  );

  const activePreviewExam =
    state.exams.find((e) => e.id === selectedExamId) || state.exams[0];

  return (
    <div className="space-y-6 max-w-[1480px] w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-extrabold text-slate-900">
              Question Bank &amp; Question Paper Import Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Import question papers from <strong>PDF, CSV, TXT, or JSON</strong>, author MCQ, Descriptive &amp; Coding items, and preview both the <strong>Official Printable Paper</strong> and <strong>Post-Publish Student Exam Screen</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-md shadow-purple-600/25 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            Import Paper (PDF / CSV / JSON)
          </button>

          {activePreviewExam && (
            <button
              type="button"
              onClick={() => setPreviewPaperMode('paper')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Monitor className="w-4 h-4" />
              Preview Paper &amp; Post-Publish View
            </button>
          )}

          <button
            type="button"
            onClick={openNewQuestionBuilder}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>
      </div>

      {statusBanner && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label
            htmlFor="qb-exam-filter"
            className="text-xs font-bold text-slate-600 whitespace-nowrap"
          >
            Filter by Examination:
          </label>
          <select
            id="qb-exam-filter"
            value={selectedExamId}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              if (e.target.value !== 'ALL') {
                setBuilderExamId(e.target.value);
              }
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">
              All Examinations ({state.questions.length})
            </option>
            {state.exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title} (
                {state.questions.filter((q) => q.examId === ex.id).length} items) —{' '}
                {ex.status === 'Draft'
                  ? 'Draft (Hidden from Students)'
                  : `${ex.status} (Visible to Students)`}
              </option>
            ))}
          </select>

          {activePreviewExam && (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  activePreviewExam.status === 'Draft'
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                }`}
              >
                {activePreviewExam.status === 'Draft'
                  ? 'Draft · Hidden from Student Login'
                  : 'Published · Live in Student Login'}
              </span>

              <button
                type="button"
                onClick={() => setPreviewPaperMode('paper')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Printable Paper (PDF)
              </button>
              <button
                type="button"
                onClick={() => setPreviewPaperMode('student-view')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-xs font-bold text-purple-700 cursor-pointer"
              >
                <Monitor className="w-3.5 h-3.5 text-purple-600" />
                What Displays After Publish
              </button>
              {activePreviewExam.status === 'Draft' ? (
                <button
                  type="button"
                  onClick={() => {
                    examStore.updateExam(activePreviewExam.id, {
                      status: 'Published',
                    });
                    setStatusBanner({
                      type: 'success',
                      text: `Published "${activePreviewExam.title}"! It is now visible in Student Login.`,
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publish Exam to Students
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    examStore.updateExam(activePreviewExam.id, {
                      status: 'Draft',
                    });
                    setStatusBanner({
                      type: 'success',
                      text: `Moved "${activePreviewExam.title}" to Draft mode — it is now hidden from Student Login.`,
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Set as Draft (Hide from Students)
                </button>
              )}
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500">
          Note: All questions in an exam are{' '}
          <strong className="text-slate-800">randomly shuffled</strong>{' '}
          independently for each student attempt.
        </div>
      </div>

      {/* Centered Floating Add / Edit Question Modal (Matching Create New Examination Modal) */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {editingQuestionId
                    ? 'Edit Assessment Question'
                    : 'Create New Question'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure question type, target examination, marks weightage, and
                  grading rules.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingQuestionId(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Question Type *
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl">
                  {(['mcq', 'descriptive', 'programming'] as QuestionType[]).map(
                    (t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setQType(t)}
                        className={`py-2 px-3 rounded-lg text-xs font-extrabold uppercase transition-colors cursor-pointer ${
                          qType === t
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {t}
                      </button>
                    )
                  )}
                </div>
              </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-3">
              <div>
                <label
                  htmlFor="qb-target-exam"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Target Examination *
                </label>
                <select
                  id="qb-target-exam"
                  value={builderExamId}
                  onChange={(e) => setBuilderExamId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                >
                  {state.exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.subjectName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Question / Problem Prompt *
                </label>
                <textarea
                  rows={3}
                  required
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Enter question statement or programming problem specification..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Marks Weightage
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>
          </div>

          {qType === 'mcq' && (
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700">
                Multiple-Choice Options &amp; Official Correct Answer Key
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'opt-a', label: 'A', val: optA, set: setOptA },
                  { id: 'opt-b', label: 'B', val: optB, set: setOptB },
                  { id: 'opt-c', label: 'C', val: optC, set: setOptC },
                  { id: 'opt-d', label: 'D', val: optD, set: setOptD },
                ].map((o) => (
                  <div
                    key={o.id}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                      correctOpt === o.id
                        ? 'border-blue-600 bg-blue-50/40'
                        : 'border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="correctOpt"
                      checked={correctOpt === o.id}
                      onChange={() => setCorrectOpt(o.id)}
                      className="text-blue-600"
                    />
                    <span className="text-xs font-bold text-slate-700 w-5">
                      {o.label}.
                    </span>
                    <input
                      type="text"
                      value={o.val}
                      onChange={(e) => o.set(e.target.value)}
                      placeholder={`Option ${o.label} text`}
                      className="flex-1 bg-transparent text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {qType === 'descriptive' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Answer Length Guidance
                </label>
                <input
                  type="text"
                  value={lengthGuidance}
                  onChange={(e) => setLengthGuidance(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Faculty Grading Rubric Notes
                </label>
                <input
                  type="text"
                  value={sampleRubric}
                  onChange={(e) => setSampleRubric(e.target.value)}
                  placeholder="Key points required for full credit..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>
          )}

          {qType === 'programming' && (
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block">
                    Programming Language &amp; Execution Sandbox
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Supports C, C++, Python, Java, JavaScript, TypeScript, C#,
                    Go, Rust, and SQL
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Programming Language"
                    value={progLang}
                    onChange={(e) =>
                      handleLanguageChange(
                        e.target.value as ProgrammingLanguage
                      )
                    }
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900"
                  >
                    {PROGRAMMING_LANGUAGES.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      const spec = analyzeProgrammingQuestionSpec(
                        qText,
                        '',
                        progLang,
                        [],
                        '',
                        '',
                        0
                      );
                      setQText(spec.cleanPrompt);
                      setInputFormat(spec.inputFormat);
                      setOutputFormat(spec.outputFormat);
                      setConstraints(spec.constraints);
                      setStarterCode(spec.starterCode);
                      setTestCases(spec.testCases);
                      setBuilderTestResults(null);
                      setStatusBanner({
                        type: 'success',
                        text: `Analyzed problem statement: Set Input/Output format, generated ${spec.testCases.length} test cases, and populated starter code skeleton.`,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-Analyze I/O, Test Cases &amp; Starter Skeleton
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setStarterCode(STARTER_CODE_TEMPLATES[progLang])
                    }
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Template
                  </button>
                </div>
              </div>

              {/* Quick Language Selector Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {PROGRAMMING_LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => handleLanguageChange(lang.id)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                      progLang === lang.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lang.shortLabel}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Input Format
                  </label>
                  <input
                    type="text"
                    value={inputFormat}
                    onChange={(e) => setInputFormat(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Output Format
                  </label>
                  <input
                    type="text"
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Constraints
                  </label>
                  <input
                    type="text"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Starter Code Template ({progLang.toUpperCase()})
                  </label>
                  <button
                    type="button"
                    onClick={handleVerifyStarterCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    Test Code Against Test Cases
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={starterCode}
                  onChange={(e) => setStarterCode(e.target.value)}
                  className="w-full p-4 rounded-xl bg-[#070E22] text-emerald-400 font-mono text-xs focus:outline-none leading-relaxed"
                />
              </div>

              {builderTestResults && (
                <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2">
                  <div className="text-xs font-bold text-sky-300">
                    Builder Sandbox Verification Results:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {builderTestResults.map((r, idx) => (
                      <div
                        key={r.testCaseId}
                        className={`p-2.5 rounded-lg border font-mono text-[11px] ${
                          r.passed
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                            : 'bg-red-950/60 border-red-500/40 text-red-200'
                        }`}
                      >
                        <div className="flex justify-between font-bold">
                          <span>Case #{idx + 1}</span>
                          <span>{r.passed ? 'PASSED' : 'FAILED'}</span>
                        </div>
                        <div>
                          In: {r.input} → Out: {r.actualOutput} (Expected:{' '}
                          {r.expectedOutput})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900">
                    Test Cases (Sample &amp; Hidden)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddTestCase}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Test Case
                  </button>
                </div>

                {testCases.map((tc, idx) => (
                  <div
                    key={tc.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-3 rounded-xl border border-slate-200"
                  >
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={tc.input}
                        onChange={(e) =>
                          handleUpdateTestCase(tc.id, 'input', e.target.value)
                        }
                        placeholder={`Test #${idx + 1} Standard Input (e.g. 10 20)`}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={tc.expectedOutput}
                        onChange={(e) =>
                          handleUpdateTestCase(
                            tc.id,
                            'expectedOutput',
                            e.target.value
                          )
                        }
                        placeholder="Expected Output (e.g. 30)"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-end gap-2">
                      <label className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tc.isHidden}
                          onChange={(e) =>
                            handleUpdateTestCase(
                              tc.id,
                              'isHidden',
                              e.target.checked
                            )
                          }
                        />
                        Hidden
                      </label>
                      <button
                        type="button"
                        aria-label="Remove test case"
                        onClick={() => handleRemoveTestCase(tc.id)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingQuestionId(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  {editingQuestionId
                    ? 'Update Question in Bank'
                    : 'Save Question to Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((q, index) => {
          const exam = state.exams.find((e) => e.id === q.examId);
          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-semibold">
                    <span className="inline-flex items-center gap-1 text-blue-600 font-bold uppercase">
                      {q.type === 'mcq' ? (
                        <CheckSquare className="w-3.5 h-3.5" />
                      ) : q.type === 'programming' ? (
                        <Code2 className="w-3.5 h-3.5" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                      {q.type}
                    </span>
                    <span>·</span>
                    <span>{exam?.title || 'General Bank'}</span>
                    <span>·</span>
                    <span>{q.difficulty}</span>
                    <span>·</span>
                    <span className="font-mono font-bold text-slate-900">
                      {q.marks} Marks
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Q{index + 1}: {q.text}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    aria-label={`Edit question ${index + 1}`}
                    onClick={() => openEditQuestionBuilder(q)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete question ${index + 1}`}
                    onClick={() => {
                      examStore.deleteQuestion(q.id);
                      setStatusBanner({
                        type: 'success',
                        text: `Deleted question Q${index + 1} from question bank.`,
                      });
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {q.type === 'mcq' && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {q.options.map((opt) => {
                    const isCorrect = opt.id === q.correctOptionId;
                    return (
                      <div
                        key={opt.id}
                        className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between ${
                          isCorrect
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold'
                            : 'bg-slate-50/60 border-slate-200/80 text-slate-700'
                        }`}
                      >
                        <span>
                          {opt.label}. {opt.text}
                        </span>
                        {isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.type === 'programming' && (
                <div className="space-y-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2 text-slate-500">
                    <span>
                      Default Language:{' '}
                      <strong className="text-slate-800 uppercase">
                        {q.programmingLanguage}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      Test Cases:{' '}
                      <strong className="text-slate-800 font-mono">
                        {q.testCases?.length || 0}
                      </strong>
                    </span>
                    {q.constraints && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-slate-600">
                          {q.constraints}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div>
                      <span className="font-extrabold text-slate-700 block">
                        Input Format:
                      </span>
                      <span className="text-slate-600">
                        {q.inputFormat || 'Standard Input (stdin)'}
                      </span>
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-700 block">
                        Output Format:
                      </span>
                      <span className="text-slate-600">
                        {q.outputFormat || 'Standard Output (stdout)'}
                      </span>
                    </div>
                  </div>

                  {q.testCases && q.testCases.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                      {q.testCases.map((tc, i) => (
                        <div
                          key={tc.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-[11px]"
                        >
                          <div className="flex items-center justify-between text-slate-500 mb-1">
                            <span>Case #{i + 1}</span>
                            <span className="inline-flex items-center gap-1">
                              {tc.isHidden ? (
                                <>
                                  <EyeOff className="w-3 h-3" /> Hidden
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" /> Sample
                                </>
                              )}
                            </span>
                          </div>
                          <div className="text-slate-800">
                            In: {tc.input.replace(/\n/g, ' ')}
                          </div>
                          <div className="text-emerald-700 font-bold">
                            Out: {tc.expectedOutput}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.starterCode && (
                    <div className="p-3 rounded-xl bg-[#070E22] text-emerald-400 font-mono text-[11px]">
                      <div className="text-slate-400 mb-1">
                        // Student Starter Code Template (
                        {(q.programmingLanguage || 'c').toUpperCase()})
                      </div>
                      <pre className="whitespace-pre-wrap">{q.starterCode}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredQuestions.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center space-y-4">
            <div className="text-sm font-extrabold text-slate-900">
              No questions authored for this examination yet
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Import an entire question paper from a <strong>PDF, CSV, TXT, or JSON</strong> file, or click <strong>Add First Question</strong> to author items manually.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-md shadow-purple-600/20 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Import Question Paper (PDF / CSV / JSON)
              </button>
              <button
                type="button"
                onClick={openNewQuestionBuilder}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add First Question
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Question Paper Import Modal (PDF / CSV / TXT / JSON) */}
      {showImportModal && (
        <QuestionPaperImportModal
          initialExamId={selectedExamId}
          onClose={() => setShowImportModal(false)}
          onImported={(examId, count, published, openPreviewAfter) => {
            setShowImportModal(false);
            setSelectedExamId(examId);
            setBuilderExamId(examId);
            const ex = examStore.getState().exams.find((e) => e.id === examId);
            setStatusBanner({
              type: 'success',
              text: `Imported ${count} question(s) into "${
                ex?.title || 'Examination'
              }"${
                published
                  ? ' and published the examination live for Student Login!'
                  : ' as a Draft (hidden from Student Login until published).'
              }`,
            });
            if (openPreviewAfter) {
              setPreviewPaperMode('student-view');
            }
          }}
        />
      )}

      {/* Dual-Mode Question Paper & Student Post-Publish View Modal */}
      {previewPaperMode && activePreviewExam && (
        <PrintablePaperModal
          exam={activePreviewExam}
          questions={state.questions.filter(
            (q) => q.examId === activePreviewExam.id
          )}
          initialMode={previewPaperMode}
          onClose={() => setPreviewPaperMode(null)}
        />
      )}
    </div>
  );
};
