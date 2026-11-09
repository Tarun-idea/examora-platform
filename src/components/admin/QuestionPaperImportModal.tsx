import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Plus,
  Download,
  Sparkles,
  Eye,
  EyeOff,
  Send,
  X,
  ArrowRight,
  ArrowLeft,
  Monitor,
  BookOpen,
  Clock,
  Award,
  Lock,
  Code2,
  RotateCcw,
} from 'lucide-react';
import {
  examStore,
  Question,
  QuestionType,
} from '../../services/examStore.ts';
import {
  ParsedQuestionDraft,
  parseUploadedQuestionFile,
  parseQuestionsFromText,
  createSampleDraftQuestions,
  createHardCProgramsDrafts,
  createMediumCProgramsDrafts,
  analyzeProgrammingQuestionSpec,
  generateSampleQuestionPaperPdfBlob,
  generateSampleQuestionPaperCsv,
  SAMPLE_QUESTION_PAPER_TEXT,
} from '../../utils/questionPaperParser.ts';
import {
  PROGRAMMING_LANGUAGES,
  ProgrammingLanguage,
  STARTER_CODE_TEMPLATES,
} from '../../utils/examLogic.ts';

interface QuestionPaperImportModalProps {
  initialExamId?: string;
  onClose: () => void;
  onImported: (
    examId: string,
    count: number,
    published: boolean,
    openPreviewAfter?: boolean
  ) => void;
}

export const QuestionPaperImportModal: React.FC<
  QuestionPaperImportModalProps
> = ({ initialExamId, onClose, onImported }) => {
  const state = examStore.getState();
  const [targetExamId, setTargetExamId] = useState<string>(
    initialExamId && initialExamId !== 'ALL'
      ? initialExamId
      : state.exams[0]?.id || ''
  );
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [drafts, setDrafts] = useState<ParsedQuestionDraft[]>([]);
  const [rawPasteText, setRawPasteText] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'paper' | 'student-view'>(
    'paper'
  );
  const [previewStudentIdx, setPreviewStudentIdx] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const targetExam = state.exams.find((e) => e.id === targetExamId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      const parsed = await parseUploadedQuestionFile(file);
      if (parsed.length === 0) {
        setErrorMsg(
          'No structured questions were detected in the uploaded file. Please check the template format or paste the text below.'
        );
        return;
      }
      setUploadedFileName(file.name);
      setDrafts(parsed);
      setStep(2);
      const codingDetected = parsed.filter((d) => d.type === 'programming').length;
      setNoticeMsg(
        codingDetected > 0
          ? `Extracted ${parsed.length} question(s) (${codingDetected} Programming) from "${file.name}". Automatically analyzed Input/Output formats, synthesized test cases, and generated starter code skeletons (solution code excluded).`
          : `Extracted ${parsed.length} question(s) from "${file.name}". Review and edit below before saving.`
      );
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Failed to parse the uploaded question paper file.'
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadSamplePaper = () => {
    setErrorMsg(null);
    const sample = createSampleDraftQuestions();
    setUploadedFileName('Panimalar_Sample_Question_Paper.pdf');
    setDrafts(sample);
    setStep(2);
    setNoticeMsg(
      `Loaded ${sample.length} sample questions (2 MCQ, 1 Descriptive, 1 C Programming with analyzed Input/Output format, test cases, and starter code skeleton).`
    );
  };

  const handleLoadHardCPrograms = () => {
    setErrorMsg(null);
    const cDrafts = createHardCProgramsDrafts();
    setUploadedFileName('Hard C-programs.pdf');
    setDrafts(cDrafts);
    setStep(2);
    setNoticeMsg(
      `Extracted ${cDrafts.length} Hard C Programming questions from "Hard C-programs.pdf" with analyzed Input/Output formats, Sample & Hidden test cases, and student starter code skeletons (without solution code).`
    );
  };

  const handleLoadMediumCPrograms = () => {
    setErrorMsg(null);
    const mDrafts = createMediumCProgramsDrafts();
    setUploadedFileName('medium_c_programs.pdf');
    setDrafts(mDrafts);
    setStep(2);
    setNoticeMsg(
      `Extracted ${mDrafts.length} Medium C Programming questions (Set 1, Set 2 & Set 3) from "medium_c_programs.pdf" with analyzed Input/Output formats, verified test cases, and student starter code skeletons.`
    );
  };

  const handleParsePastedText = () => {
    setErrorMsg(null);
    if (!rawPasteText.trim()) {
      setErrorMsg('Please paste question paper text first or upload a file.');
      return;
    }
    const parsed = parseQuestionsFromText(rawPasteText);
    if (parsed.length === 0) {
      setErrorMsg('Could not detect questions in the pasted text.');
      return;
    }
    setUploadedFileName('Pasted Question Paper Text');
    setDrafts(parsed);
    setStep(2);
    setNoticeMsg(
      `Parsed ${parsed.length} question(s) with automatic Input/Output format analysis, test case synthesis, and starter code templates.`
    );
  };

  const handleDownloadSamplePdf = () => {
    const blob = generateSampleQuestionPaperPdfBlob(
      targetExam?.title || 'Technical Skill Assessment'
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'panimalar_sample_question_paper.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setNoticeMsg(
      'Downloaded panimalar_sample_question_paper.pdf! You can upload this PDF right here to test the PDF import flow.'
    );
  };

  const handleDownloadSampleCsv = () => {
    const csv = generateSampleQuestionPaperCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'panimalar_sample_questions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setNoticeMsg('Downloaded panimalar_sample_questions.csv template!');
  };

  const handleDownloadSampleJson = () => {
    const sample = createSampleDraftQuestions().map((d) => ({
      type: d.type,
      marks: d.marks,
      difficulty: d.difficulty,
      text: d.text,
      optA: d.optA,
      optB: d.optB,
      optC: d.optC,
      optD: d.optD,
      correctOptionId: d.correctOpt,
      explanation: d.explanation,
      answerLengthGuidance: d.answerLengthGuidance,
      sampleRubric: d.sampleRubric,
      programmingLanguage: d.programmingLanguage,
      inputFormat: d.inputFormat,
      outputFormat: d.outputFormat,
      constraints: d.constraints,
      starterCode: d.starterCode,
      testCases: d.testCases,
    }));
    const blob = new Blob([JSON.stringify(sample, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'panimalar_sample_questions.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setNoticeMsg('Downloaded panimalar_sample_questions.json template!');
  };

  const updateDraft = (
    tempId: string,
    patch: Partial<ParsedQuestionDraft>
  ) => {
    setDrafts((prev) =>
      prev.map((d) => (d.tempId === tempId ? { ...d, ...patch } : d))
    );
  };

  const handleReanalyzeProgrammingDraft = (d: ParsedQuestionDraft, idx: number) => {
    const spec = analyzeProgrammingQuestionSpec(
      d.text,
      '',
      d.programmingLanguage,
      [],
      '',
      '',
      idx
    );
    updateDraft(d.tempId, {
      text: spec.cleanPrompt,
      inputFormat: spec.inputFormat,
      outputFormat: spec.outputFormat,
      constraints: spec.constraints,
      starterCode: spec.starterCode,
      testCases: spec.testCases,
    });
    setNoticeMsg(
      `Re-analyzed Question Q${idx + 1}: Updated Input/Output format, synthesized ${spec.testCases.length} test cases, and refreshed starter code skeleton.`
    );
  };

  const removeDraft = (tempId: string) => {
    setDrafts((prev) => prev.filter((d) => d.tempId !== tempId));
  };

  const addBlankDraft = () => {
    setDrafts((prev) => [
      ...prev,
      {
        tempId: `imp-manual-${Date.now()}`,
        type: 'programming',
        text: 'Write a C program that reads two space-separated integers A and B from standard input and prints their sum (A + B).',
        marks: 20,
        difficulty: 'Medium',
        explanation: '',
        optA: 'Option A',
        optB: 'Option B',
        optC: 'Option C',
        optD: 'Option D',
        correctOpt: 'opt-a',
        answerLengthGuidance: '150 - 250 words recommended',
        sampleRubric: '',
        programmingLanguage: 'c',
        starterCode: STARTER_CODE_TEMPLATES.c,
        inputFormat: 'Two space-separated integers A and B on standard input',
        outputFormat: 'Single integer representing the sum A + B',
        constraints: 'Time Limit: 1.0s | Memory Limit: 64MB',
        testCases: [
          {
            id: `tc-${Date.now()}-1`,
            input: '10 20',
            expectedOutput: '30',
            isHidden: false,
          },
          {
            id: `tc-${Date.now()}-2`,
            input: '25 75',
            expectedOutput: '100',
            isHidden: true,
          },
        ],
      },
    ]);
  };

  const handleCommitImport = (publishExam: boolean, openPreviewAfter = false) => {
    if (!targetExamId) {
      setErrorMsg('Please select a target examination.');
      return;
    }
    if (drafts.length === 0) {
      setErrorMsg('Please include at least one question to import.');
      return;
    }

    const payloads: Array<Omit<Question, 'id' | 'examId' | 'subjectId'>> =
      drafts.map((d) => ({
        type: d.type,
        text: d.text.trim() || 'Untitled Question',
        marks: Math.max(1, Number(d.marks) || 10),
        difficulty: d.difficulty,
        explanation: d.explanation?.trim() || undefined,
        ...(d.type === 'mcq'
          ? {
              options: [
                { id: 'opt-a', label: 'A', text: d.optA.trim() || 'Option A' },
                { id: 'opt-b', label: 'B', text: d.optB.trim() || 'Option B' },
                { id: 'opt-c', label: 'C', text: d.optC.trim() || 'Option C' },
                { id: 'opt-d', label: 'D', text: d.optD.trim() || 'Option D' },
              ],
              correctOptionId: d.correctOpt,
            }
          : {}),
        ...(d.type === 'descriptive'
          ? {
              answerLengthGuidance: d.answerLengthGuidance,
              sampleRubric: d.sampleRubric,
            }
          : {}),
        ...(d.type === 'programming'
          ? {
              programmingLanguage: d.programmingLanguage,
              starterCode:
                d.starterCode || STARTER_CODE_TEMPLATES[d.programmingLanguage],
              inputFormat: d.inputFormat,
              outputFormat: d.outputFormat,
              constraints: d.constraints,
              testCases: d.testCases,
            }
          : {}),
      }));

    const created = examStore.addQuestionsBulk(
      targetExamId,
      payloads,
      publishExam
    );
    onImported(targetExamId, created.length, publishExam, openPreviewAfter);
  };

  const totalDraftMarks = drafts.reduce(
    (acc, d) => acc + (Number(d.marks) || 0),
    0
  );
  const mcqCount = drafts.filter((d) => d.type === 'mcq').length;
  const descCount = drafts.filter((d) => d.type === 'descriptive').length;
  const progCount = drafts.filter((d) => d.type === 'programming').length;

  const safePreviewIdx =
    drafts.length > 0 ? Math.min(previewStudentIdx, drafts.length - 1) : 0;
  const activeDraftQ = drafts[safePreviewIdx];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[93vh] flex flex-col p-5 sm:p-7 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-extrabold text-slate-900">
                Import Question Paper (PDF / CSV / TXT / JSON) &amp; Preview Flow
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload a PDF or structured question paper. Programming questions are automatically analyzed for Input/Output formats, verified Test Cases, and Example Starter Code skeletons (without giving away the solution).
            </p>
          </div>

          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer self-end sm:self-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Step Progress Bar & Target Exam Selector */}
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 1 as const, label: '1. Upload PDF / File' },
              {
                id: 2 as const,
                label: `2. Review & Edit (${drafts.length})`,
              },
              {
                id: 3 as const,
                label: '3. Preview Paper & Student View',
              },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={s.id > 1 && drafts.length === 0}
                onClick={() => setStep(s.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer disabled:opacity-40 ${
                  step === s.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="import-target-exam"
              className="text-xs font-bold text-slate-600 whitespace-nowrap"
            >
              Target Exam:
            </label>
            <select
              id="import-target-exam"
              value={targetExamId}
              onChange={(e) => setTargetExamId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
            >
              {state.exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} —{' '}
                  {ex.status === 'Draft'
                    ? 'Draft (Hidden from Students)'
                    : `${ex.status} (Visible to Students)`}
                </option>
              ))}
            </select>
            {targetExam && (
              <span
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  targetExam.status === 'Draft'
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                }`}
              >
                {targetExam.status === 'Draft'
                  ? 'Draft · Hidden from Student Login'
                  : 'Published · Live in Student Login'}
              </span>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {noticeMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{noticeMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setNoticeMsg(null)}
              className="text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 1: UPLOAD FILE OR LOAD TEMPLATE                      */}
        {/* ========================================================= */}
        {step === 1 && (
          <div className="mt-4 flex-1 overflow-y-auto space-y-5 pr-1">
            {/* File Dropzone */}
            <div className="border-2 border-dashed border-blue-400/60 bg-blue-50/20 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/15 text-blue-600 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Upload Question Paper File (.PDF, .CSV, .TXT, or .JSON)
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto">
                  Automatically detects MCQ options &amp; answer keys, Descriptive rubrics, and Programming questions — analyzing Input/Output formats, generating Sample &amp; Hidden test cases, and providing student Starter Code skeletons instead of the full solution.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Select PDF / CSV / TXT / JSON File</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.csv,.txt,.json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleLoadHardCPrograms}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  <Code2 className="w-4 h-4" />
                  Load Hard C-Programs Set (3 Programs)
                </button>

                <button
                  type="button"
                  onClick={handleLoadMediumCPrograms}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  <Code2 className="w-4 h-4" />
                  Load Medium C-Programs Set (12 Programs)
                </button>

                <button
                  type="button"
                  onClick={handleLoadSamplePaper}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Load Sample Panimalar Paper
                </button>
              </div>
            </div>

            {/* Downloadable Sample Format Templates */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold text-slate-900">
                  Need a Ready-to-Use Question Paper Template?
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Download a formatted sample PDF, CSV, or JSON question paper to see the exact structure.
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSamplePdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-purple-600" />
                  Sample PDF (.pdf)
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  Sample CSV (.csv)
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSampleJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  Sample JSON (.json)
                </button>
              </div>
            </div>

            {/* Direct Paste Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800">
                  Or Paste Question Paper / C Programs Directly:
                </label>
                <button
                  type="button"
                  onClick={() => setRawPasteText(SAMPLE_QUESTION_PAPER_TEXT)}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Fill Sample Format Text
                </button>
              </div>
              <textarea
                rows={7}
                value={rawPasteText}
                onChange={(e) => setRawPasteText(e.target.value)}
                placeholder={`Paste numbered or lettered C/Python/Java programs or MCQ questions here...\nExample:\n1. Move All Zeros to the End\n#include <stdio.h>\nint main() { ... }`}
                className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Parse &amp; Analyze Pasted Questions
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: INTERACTIVE REVIEW & EDIT STAGING TABLE           */}
        {/* ========================================================= */}
        {step === 2 && (
          <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Summary Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="font-extrabold text-slate-900">
                  Source: {uploadedFileName || 'Imported Questions'}
                </span>
                <span>·</span>
                <span className="font-mono font-bold text-blue-600">
                  {drafts.length} Questions
                </span>
                <span>·</span>
                <span>
                  {mcqCount} MCQ / {descCount} Descriptive / {progCount} Coding
                </span>
                <span>·</span>
                <span className="font-mono font-extrabold text-emerald-600">
                  Total: {totalDraftMarks} Marks
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={addBlankDraft}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Question Row
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview Paper &amp; Student View →
                </button>
              </div>
            </div>

            {/* Editable Question Cards */}
            <div className="space-y-4">
              {drafts.map((d, idx) => (
                <div
                  key={d.tempId}
                  className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono text-xs font-extrabold">
                        Q{idx + 1}
                      </span>
                      <select
                        aria-label={`Question ${idx + 1} Type`}
                        value={d.type}
                        onChange={(e) => {
                          const nextType = e.target.value as QuestionType;
                          if (nextType === 'programming') {
                            const spec = analyzeProgrammingQuestionSpec(
                              d.text,
                              '',
                              d.programmingLanguage || 'c',
                              d.testCases,
                              d.inputFormat,
                              d.outputFormat,
                              idx
                            );
                            updateDraft(d.tempId, {
                              type: nextType,
                              inputFormat: spec.inputFormat,
                              outputFormat: spec.outputFormat,
                              starterCode: spec.starterCode,
                              testCases: spec.testCases,
                            });
                          } else {
                            updateDraft(d.tempId, { type: nextType });
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold uppercase text-slate-900"
                      >
                        <option value="mcq">MCQ</option>
                        <option value="descriptive">Descriptive</option>
                        <option value="programming">Programming</option>
                      </select>

                      <select
                        aria-label={`Question ${idx + 1} Difficulty`}
                        value={d.difficulty}
                        onChange={(e) =>
                          updateDraft(d.tempId, {
                            difficulty: e.target.value as
                              | 'Easy'
                              | 'Medium'
                              | 'Hard',
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>

                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-500 font-semibold">
                          Marks:
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={d.marks}
                          onChange={(e) =>
                            updateDraft(d.tempId, {
                              marks: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          className="w-16 px-2 py-1 rounded-lg border border-slate-200 font-mono text-xs font-bold"
                        />
                      </div>

                      {d.type === 'programming' && (
                        <button
                          type="button"
                          onClick={() => handleReanalyzeProgrammingDraft(d, idx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold cursor-pointer"
                          title="Re-analyze problem statement to auto-generate Input/Output format, Test Cases, and Starter Code skeleton"
                        >
                          <Sparkles className="w-3 h-3" />
                          Auto-Analyze I/O &amp; Test Cases
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeDraft(d.tempId)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                      title="Remove question from import list"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Prompt */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Question Problem Statement:
                    </label>
                    <textarea
                      rows={2}
                      value={d.text}
                      onChange={(e) =>
                        updateDraft(d.tempId, { text: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  {/* MCQ Fields */}
                  {d.type === 'mcq' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(
                        [
                          { id: 'opt-a', label: 'A', key: 'optA' },
                          { id: 'opt-b', label: 'B', key: 'optB' },
                          { id: 'opt-c', label: 'C', key: 'optC' },
                          { id: 'opt-d', label: 'D', key: 'optD' },
                        ] as const
                      ).map((opt) => (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-2 p-2 rounded-xl border ${
                            d.correctOpt === opt.id
                              ? 'border-emerald-500 bg-emerald-50/30'
                              : 'border-slate-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`correct-${d.tempId}`}
                            checked={d.correctOpt === opt.id}
                            onChange={() =>
                              updateDraft(d.tempId, { correctOpt: opt.id })
                            }
                          />
                          <span className="text-xs font-bold w-4">
                            {opt.label}.
                          </span>
                          <input
                            type="text"
                            value={d[opt.key]}
                            onChange={(e) =>
                              updateDraft(d.tempId, {
                                [opt.key]: e.target.value,
                              })
                            }
                            className="flex-1 bg-transparent text-xs focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Descriptive Fields */}
                  {d.type === 'descriptive' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        value={d.answerLengthGuidance}
                        onChange={(e) =>
                          updateDraft(d.tempId, {
                            answerLengthGuidance: e.target.value,
                          })
                        }
                        placeholder="Answer length guidance (e.g. 150-250 words)"
                        className="px-3 py-1.5 rounded-xl border border-slate-200"
                      />
                      <input
                        type="text"
                        value={d.sampleRubric}
                        onChange={(e) =>
                          updateDraft(d.tempId, {
                            sampleRubric: e.target.value,
                          })
                        }
                        placeholder="Faculty grading rubric notes..."
                        className="px-3 py-1.5 rounded-xl border border-slate-200"
                      />
                    </div>
                  )}

                  {/* Programming Fields: Analyzed Input/Output Format, All Test Cases & Starter Code Skeleton */}
                  {d.type === 'programming' && (
                    <div className="space-y-3 text-xs bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Target Language
                          </label>
                          <select
                            aria-label="Target Programming Language"
                            value={d.programmingLanguage}
                            onChange={(e) => {
                              const lang = e.target.value as ProgrammingLanguage;
                              const spec = analyzeProgrammingQuestionSpec(
                                d.text,
                                '',
                                lang,
                                d.testCases,
                                d.inputFormat,
                                d.outputFormat,
                                idx
                              );
                              updateDraft(d.tempId, {
                                programmingLanguage: lang,
                                starterCode: spec.starterCode,
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
                          >
                            {PROGRAMMING_LANGUAGES.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Analyzed Input Format
                          </label>
                          <input
                            type="text"
                            value={d.inputFormat}
                            onChange={(e) =>
                              updateDraft(d.tempId, {
                                inputFormat: e.target.value,
                              })
                            }
                            placeholder="e.g. First line: integer N. Second line: N integers"
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            Analyzed Output Format
                          </label>
                          <input
                            type="text"
                            value={d.outputFormat}
                            onChange={(e) =>
                              updateDraft(d.tempId, {
                                outputFormat: e.target.value,
                              })
                            }
                            placeholder="e.g. Space-separated integers on stdout"
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-900"
                          />
                        </div>
                      </div>

                      {/* Multi-Test Case Editor (Sample & Hidden) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                            Auto-Generated Test Cases ({d.testCases.length}) — Sample &amp; Hidden Grading Cases
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = [
                                ...d.testCases,
                                {
                                  id: `tc-${Date.now()}-${d.testCases.length + 1}`,
                                  input: '10 20',
                                  expectedOutput: '30',
                                  isHidden: d.testCases.length > 0,
                                },
                              ];
                              updateDraft(d.tempId, { testCases: next });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            Add Test Case
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {d.testCases.map((tc, tcIdx) => (
                            <div
                              key={tc.id}
                              className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[11px] font-bold text-slate-700">
                                  Test Case #{tcIdx + 1}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = d.testCases.map((item, i) =>
                                        i === tcIdx
                                          ? { ...item, isHidden: !item.isHidden }
                                          : item
                                      );
                                      updateDraft(d.tempId, { testCases: next });
                                    }}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                      tc.isHidden
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    }`}
                                  >
                                    {tc.isHidden ? (
                                      <>
                                        <EyeOff className="w-2.5 h-2.5" />
                                        Hidden Evaluation
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="w-2.5 h-2.5" />
                                        Sample (Visible)
                                      </>
                                    )}
                                  </button>
                                  {d.testCases.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = d.testCases.filter(
                                          (_, i) => i !== tcIdx
                                        );
                                        updateDraft(d.tempId, {
                                          testCases: next,
                                        });
                                      }}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                      title="Remove test case"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="text-[10px] font-semibold text-slate-500 block">
                                    Input (stdin)
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={tc.input}
                                    onChange={(e) => {
                                      const next = d.testCases.map((item, i) =>
                                        i === tcIdx
                                          ? { ...item, input: e.target.value }
                                          : item
                                      );
                                      updateDraft(d.tempId, { testCases: next });
                                    }}
                                    className="w-full px-2 py-1 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-900"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-slate-500 block">
                                    Expected Output (stdout)
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={tc.expectedOutput}
                                    onChange={(e) => {
                                      const next = d.testCases.map((item, i) =>
                                        i === tcIdx
                                          ? {
                                              ...item,
                                              expectedOutput: e.target.value,
                                            }
                                          : item
                                      );
                                      updateDraft(d.tempId, { testCases: next });
                                    }}
                                    className="w-full px-2 py-1 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-900"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Example Starter Code Skeleton (Never the Full Solution) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-extrabold text-slate-700">
                            Example Starter Code Skeleton (Shown to Student — Solution Code Stripped)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const spec = analyzeProgrammingQuestionSpec(
                                d.text,
                                '',
                                d.programmingLanguage,
                                d.testCases,
                                d.inputFormat,
                                d.outputFormat,
                                idx
                              );
                              updateDraft(d.tempId, {
                                starterCode: spec.starterCode,
                              });
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reset to Clean Starter Skeleton
                          </button>
                        </div>
                        <textarea
                          rows={6}
                          value={d.starterCode}
                          onChange={(e) =>
                            updateDraft(d.tempId, {
                              starterCode: e.target.value,
                            })
                          }
                          placeholder="Example starter code template (reads input, leaves // TODO for student logic)..."
                          className="w-full p-2.5 rounded-xl bg-[#070E22] text-emerald-400 font-mono text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: PREVIEW QUESTION PAPER & POST-PUBLISH VIEW        */}
        {/* ========================================================= */}
        {step === 3 && (
          <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Switcher between Official Printable Paper & Student View */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTab('paper')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                    previewTab === 'paper'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Official Printable Question Paper View
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('student-view')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                    previewTab === 'student-view'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  What Displays After Publish (Student Exam View)
                </button>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 px-2">
                {drafts.length} Questions · {totalDraftMarks} Marks Total
              </span>
            </div>

            {previewTab === 'paper' ? (
              <div className="p-5 rounded-2xl border-2 border-slate-800 bg-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-slate-800">
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
                      Panimalar Engineering College — Dept. of AI &amp; Data Science
                    </div>
                    <h3 className="text-lg font-black text-slate-900">
                      {targetExam?.title || 'Examination Question Paper'}
                    </h3>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      <span>
                        Subject: {targetExam?.subjectName || 'General'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-right space-y-0.5">
                    <div className="flex items-center sm:justify-end gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      Duration: {targetExam?.durationMinutes || 60} Mins
                    </div>
                    <div className="flex items-center sm:justify-end gap-1">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      Total Marks: {totalDraftMarks}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {drafts.map((d, idx) => (
                    <div
                      key={d.tempId}
                      className="p-3.5 rounded-xl border border-slate-200 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-xs sm:text-sm font-bold text-slate-900">
                          <span className="font-mono text-blue-600 mr-1.5">
                            Q{idx + 1}.
                          </span>
                          <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 mr-2">
                            {d.type}
                          </span>
                          {d.text}
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700 shrink-0">
                          [{d.marks} Marks]
                        </span>
                      </div>

                      {d.type === 'mcq' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-4 text-xs">
                          {[
                            { id: 'opt-a', label: 'A', text: d.optA },
                            { id: 'opt-b', label: 'B', text: d.optB },
                            { id: 'opt-c', label: 'C', text: d.optC },
                            { id: 'opt-d', label: 'D', text: d.optD },
                          ].map((o) => (
                            <div
                              key={o.id}
                              className={`p-1.5 rounded border ${
                                d.correctOpt === o.id
                                  ? 'border-emerald-500 bg-emerald-50/40 font-bold'
                                  : 'border-slate-200'
                              }`}
                            >
                              ({o.label}) {o.text}{' '}
                              {d.correctOpt === o.id && (
                                <span className="text-[10px] text-emerald-600 ml-1">
                                  ✓ Key
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {d.type === 'programming' && (
                        <div className="pl-4 space-y-2 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <div>
                              <span className="font-extrabold text-slate-700">
                                Input Format:{' '}
                              </span>
                              <span className="text-slate-600">
                                {d.inputFormat}
                              </span>
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-700">
                                Output Format:{' '}
                              </span>
                              <span className="text-slate-600">
                                {d.outputFormat}
                              </span>
                            </div>
                          </div>
                          {d.testCases.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {d.testCases.slice(0, 2).map((tc, tIdx) => (
                                <div
                                  key={tc.id}
                                  className="p-2 rounded-lg border border-slate-200 bg-slate-50 font-mono text-[11px]"
                                >
                                  <div className="font-bold text-slate-700">
                                    Sample Case #{tIdx + 1} (
                                    {tc.isHidden ? 'Hidden' : 'Visible'}):
                                  </div>
                                  <div>Input: {tc.input.replace(/\n/g, ' ')}</div>
                                  <div>Expected Output: {tc.expectedOutput}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Simulated Student Post-Publish View */
              <div className="rounded-2xl border border-purple-500/30 bg-[#0B1426] p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/25 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-red-600/20 border border-red-400/40 text-red-300 text-[11px] font-mono font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      STRICT LOCKDOWN ACTIVE (STUDENT VIEW AFTER PUBLISH)
                    </span>
                    <span className="text-xs font-extrabold text-white">
                      {targetExam?.title}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {drafts.map((d, idx) => (
                      <button
                        key={d.tempId}
                        type="button"
                        onClick={() => setPreviewStudentIdx(idx)}
                        className={`w-7 h-7 rounded-lg font-mono text-xs font-bold cursor-pointer ${
                          idx === safePreviewIdx
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {activeDraftQ && (
                  <div className="bg-white rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold">
                        Question {safePreviewIdx + 1} of {drafts.length} (
                        {activeDraftQ.type.toUpperCase()})
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {activeDraftQ.marks} Marks
                      </span>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-slate-900">
                      {activeDraftQ.text}
                    </div>
                    {activeDraftQ.type === 'mcq' && (
                      <div className="space-y-2">
                        {[
                          { label: 'A', text: activeDraftQ.optA },
                          { label: 'B', text: activeDraftQ.optB },
                          { label: 'C', text: activeDraftQ.optC },
                          { label: 'D', text: activeDraftQ.optD },
                        ].map((o) => (
                          <div
                            key={o.label}
                            className="p-3 rounded-xl border border-slate-200 text-xs flex items-center gap-3"
                          >
                            <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center font-bold">
                              {o.label}
                            </span>
                            <span>{o.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeDraftQ.type === 'descriptive' && (
                      <div className="p-3 rounded-xl border border-slate-200 text-xs text-slate-400 h-24">
                        Candidate descriptive response editor ({activeDraftQ.answerLengthGuidance})...
                      </div>
                    )}
                    {activeDraftQ.type === 'programming' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <div>
                            <div className="font-extrabold text-slate-700">
                              Input Format
                            </div>
                            <div className="text-slate-600 mt-0.5">
                              {activeDraftQ.inputFormat}
                            </div>
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-700">
                              Output Format
                            </div>
                            <div className="text-slate-600 mt-0.5">
                              {activeDraftQ.outputFormat}
                            </div>
                          </div>
                        </div>

                        {activeDraftQ.testCases.filter((tc) => !tc.isHidden)
                          .length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                            {activeDraftQ.testCases
                              .filter((tc) => !tc.isHidden)
                              .map((tc, i) => (
                                <div
                                  key={tc.id}
                                  className="p-2.5 rounded-xl bg-slate-100 border border-slate-200"
                                >
                                  <div className="font-bold text-slate-700 mb-1">
                                    Sample Test Case #{i + 1}
                                  </div>
                                  <div>
                                    <span className="text-slate-500">
                                      Input:{' '}
                                    </span>
                                    <span className="text-slate-900">
                                      {tc.input}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">
                                      Expected Output:{' '}
                                    </span>
                                    <span className="text-emerald-700 font-bold">
                                      {tc.expectedOutput}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}

                        <div className="p-3 rounded-xl bg-[#070E22] text-emerald-400 font-mono text-xs">
                          <div className="text-slate-400">
                            // Student Starter Code Template (
                            {activeDraftQ.programmingLanguage.toUpperCase()}) —
                            No Solution Leaked
                          </div>
                          <pre className="mt-1.5 whitespace-pre-wrap">
                            {activeDraftQ.starterCode}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom Footer Actions */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>

            {drafts.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => handleCommitImport(false, false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold shadow-sm cursor-pointer"
                  title="Save questions and keep this exam in Draft mode (hidden from Student login)"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  Save {drafts.length} Qs as Draft (Hidden from Students)
                </button>

                <button
                  type="button"
                  onClick={() => handleCommitImport(true, true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/25 cursor-pointer"
                  title="Save questions and publish exam immediately so students can view and take it"
                >
                  <Send className="w-4 h-4" />
                  Save &amp; Publish Exam (Live for Students)
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
