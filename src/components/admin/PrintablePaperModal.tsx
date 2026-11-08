import React, { useState } from 'react';
import {
  Printer,
  Download,
  FileText,
  KeyRound,
  CheckCircle2,
  Clock,
  Award,
  BookOpen,
  Monitor,
  Lock,
  ChevronLeft,
  ChevronRight,
  Send,
  Play,
  Code2,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Exam as DomainExam, Question as DomainQuestion } from '../../types/exam.ts';
import {
  Exam as StoreExam,
  Question as StoreQuestion,
  examStore,
} from '../../services/examStore.ts';
import {
  evaluateProgrammingSubmission,
  PROGRAMMING_LANGUAGES,
  ProgrammingLanguage,
  STARTER_CODE_TEMPLATES,
  TestCaseResult,
} from '../../utils/examLogic.ts';

interface PrintablePaperModalProps {
  exam: DomainExam | StoreExam;
  questions: Array<DomainQuestion | StoreQuestion>;
  onClose: () => void;
  initialMode?: 'paper' | 'student-view';
}

export const PrintablePaperModal: React.FC<PrintablePaperModalProps> = ({
  exam,
  questions,
  onClose,
  initialMode = 'paper',
}) => {
  const [previewMode, setPreviewMode] = useState<'paper' | 'student-view'>(
    initialMode
  );
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [downloadedNotice, setDownloadedNotice] = useState('');
  const [examStatus, setExamStatus] = useState<string>(
    (exam as StoreExam).status || 'Published'
  );

  // Interactive state for Student Exam Screen Preview
  const [studentQIndex, setStudentQIndex] = useState<number>(0);
  const [previewSelectedMcq, setPreviewSelectedMcq] = useState<
    Record<string, number>
  >({});
  const [previewDescriptive, setPreviewDescriptive] = useState<
    Record<string, string>
  >({});
  const [previewCode, setPreviewCode] = useState<Record<string, string>>({});
  const [previewLang, setPreviewLang] = useState<
    Record<string, ProgrammingLanguage>
  >({});
  const [previewCodeResults, setPreviewCodeResults] = useState<
    TestCaseResult[] | null
  >(null);

  const normalizeQ = (raw: any) => {
    const qType =
      raw.questionType ||
      (raw.type === 'programming' ? 'coding' : raw.type) ||
      'mcq';
    const qText = raw.questionText || raw.text || '';
    const options: string[] | undefined = Array.isArray(raw.options)
      ? raw.options.map((o: any) => (typeof o === 'string' ? o : o.text))
      : undefined;
    let correctOption: number | undefined = raw.correctOption;
    if (
      correctOption === undefined &&
      raw.correctOptionId &&
      Array.isArray(raw.options)
    ) {
      const idx = raw.options.findIndex(
        (o: any) => o.id === raw.correctOptionId
      );
      if (idx >= 0) correctOption = idx;
    }
    return {
      id: String(raw.id || `q-${Math.random()}`),
      questionType: qType as 'mcq' | 'descriptive' | 'coding',
      questionText: qText,
      marks: raw.marks || 10,
      difficulty: raw.difficulty || 'Medium',
      options,
      correctOption,
      explanation: raw.explanation,
      answerLengthGuide: raw.answerLengthGuide || raw.answerLengthGuidance,
      rubric: raw.rubric || raw.sampleRubric,
      codingLanguage: (raw.codingLanguage ||
        raw.programmingLanguage ||
        'python') as ProgrammingLanguage,
      starterCode: raw.starterCode || '',
      inputFormat: raw.inputFormat || 'Standard Input (stdin)',
      outputFormat: raw.outputFormat || 'Standard Output (stdout)',
      constraints: raw.constraints || 'Time Limit: 1.0s | Memory Limit: 64MB',
      testCases: (Array.isArray(raw.testCases)
        ? raw.testCases.map((tc: any, idx: number) => ({
            id: String(tc.id || `tc-${idx}`),
            input: String(tc.input || ''),
            expectedOutput: String(tc.expectedOutput || ''),
            isHidden: Boolean(tc.isHidden),
            marks: Number(
              tc.marks ??
                Math.round((raw.marks || 10) / Math.max(1, raw.testCases.length))
            ),
          }))
        : []) as Array<{
        id: string;
        input: string;
        expectedOutput: string;
        isHidden: boolean;
        marks: number;
      }>,
    };
  };

  const normalizedQuestions = questions.map(normalizeQ);
  const mcqQuestions = normalizedQuestions.filter(
    (q) => q.questionType === 'mcq'
  );
  const descQuestions = normalizedQuestions.filter(
    (q) => q.questionType === 'descriptive'
  );
  const codingQuestions = normalizedQuestions.filter(
    (q) => q.questionType === 'coding'
  );

  const safeStudentIndex =
    normalizedQuestions.length > 0
      ? Math.min(studentQIndex, normalizedQuestions.length - 1)
      : 0;
  const activeStudentQ = normalizedQuestions[safeStudentIndex];

  const handlePublishExamNow = () => {
    if ((exam as StoreExam).id) {
      examStore.updateExam((exam as StoreExam).id, { status: 'Published' });
      setExamStatus('Published');
      setDownloadedNotice(
        `Published "${exam.title}"! Students in assigned sections can now see and start this examination.`
      );
      setTimeout(() => setDownloadedNotice(''), 4000);
    }
  };

  const handleDownloadPdfPaper = () => {
    const lines: string[] = [
      'PANIMALAR ENGINEERING COLLEGE - CHENNAI',
      'Department of AI and Data Science — Official Question Paper',
      `EXAMINATION: ${exam.title} (${exam.subjectName || 'General'})`,
      `Duration: ${exam.durationMinutes} Minutes | Max Marks: ${exam.totalMarks} | Passing Marks: ${exam.passingMarks}`,
      '------------------------------------------------------------------------',
      '',
    ];

    normalizedQuestions.forEach((q, idx) => {
      const typeLabel =
        q.questionType === 'coding'
          ? 'Programming'
          : q.questionType === 'descriptive'
          ? 'Descriptive'
          : 'MCQ';
      lines.push(
        `Q${idx + 1}. [${typeLabel}] [${q.marks} Marks] [Difficulty: ${q.difficulty}]${
          q.questionType === 'coding' ? ` [Language: ${q.codingLanguage}]` : ''
        }`
      );
      lines.push(q.questionText);
      if (q.questionType === 'mcq' && q.options) {
        q.options.forEach((opt, oIdx) => {
          const letter = String.fromCharCode(65 + oIdx);
          lines.push(`${letter}) ${opt}`);
        });
        if (includeAnswerKey && q.correctOption !== undefined) {
          lines.push(`Answer: ${String.fromCharCode(65 + q.correctOption)}`);
        }
      } else if (q.questionType === 'descriptive') {
        lines.push(`Guidance: ${q.answerLengthGuide || '150 - 250 words recommended'}`);
        if (includeAnswerKey && q.rubric) {
          lines.push(`Rubric: ${q.rubric}`);
        }
      } else if (q.questionType === 'coding') {
        lines.push(`InputFormat: ${q.inputFormat}`);
        lines.push(`OutputFormat: ${q.outputFormat}`);
        q.testCases
          .filter((tc) => includeAnswerKey || !tc.isHidden)
          .forEach((tc) => {
            lines.push(
              `TestCase: ${tc.input.replace(/\r?\n/g, ' ')} => ${tc.expectedOutput.replace(/\r?\n/g, ' ')} (${
                tc.isHidden ? 'Hidden' : 'Sample'
              })`
            );
          });
      }
      if (includeAnswerKey && q.explanation) {
        lines.push(`Explanation: ${q.explanation}`);
      }
      lines.push('');
    });

    const escapePdfText = (str: string) =>
      str
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');

    let y = 795;
    const contentOps: string[] = ['BT', '/F1 10 Tf'];
    for (const rawLine of lines) {
      const trimmed = rawLine.trimEnd();
      const chunks: string[] = [];
      if (trimmed.length <= 86) {
        chunks.push(trimmed);
      } else {
        let rem = trimmed;
        while (rem.length > 86) {
          let splitIdx = rem.lastIndexOf(' ', 86);
          if (splitIdx <= 0) splitIdx = 86;
          chunks.push(rem.slice(0, splitIdx));
          rem = rem.slice(splitIdx).trimStart();
        }
        if (rem) chunks.push(rem);
      }
      for (const chunk of chunks) {
        if (y < 45) break;
        contentOps.push(`1 0 0 1 40 ${y} Tm (${escapePdfText(chunk)}) Tj`);
        y -= 13;
      }
    }
    contentOps.push('ET');
    const streamContent = contentOps.join('\n');

    const objects = [
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj',
      '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
      `5 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`,
    ];

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [0];
    for (const obj of objects) {
      offsets.push(pdf.length);
      pdf += obj + '\n';
    }
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam.title
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()}_question_paper.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadedNotice(
      'Downloaded Question Paper in PDF format (.pdf). This PDF can also be re-imported into any exam!'
    );
    setTimeout(() => setDownloadedNotice(''), 4000);
  };

  const handleDownloadPrintableHtml = () => {
    const modeLabel = includeAnswerKey
      ? 'OFFICIAL_ANSWER_KEY_AND_RUBRIC'
      : 'CANDIDATE_QUESTION_PAPER';

    const questionsHtml = normalizedQuestions
      .map((q, idx) => {
        let detailsHtml = '';
        if (q.questionType === 'mcq' && q.options) {
          const opts = q.options
            .map((opt, oIdx) => {
              const letter = String.fromCharCode(65 + oIdx);
              const isCorrect = includeAnswerKey && q.correctOption === oIdx;
              return `<div style="padding: 6px 10px; margin: 4px 0; border: 1px solid ${
                isCorrect ? '#10b981' : '#cbd5e1'
              }; border-radius: 6px; background: ${
                isCorrect ? '#ecfdf5' : '#ffffff'
              }; font-size: 13px;">
                <strong>(${letter})</strong> ${opt} ${
                isCorrect
                  ? '<strong style="color:#047857; margin-left:8px;">[✓ CORRECT ANSWER]</strong>'
                  : ''
              }
              </div>`;
            })
            .join('');
          detailsHtml = `<div style="margin-top:8px;">${opts}</div>`;
        } else if (q.questionType === 'descriptive') {
          detailsHtml = `
            <div style="margin-top:8px; font-size:12px; color:#475569;">
              <em>Expected Length: ${q.answerLengthGuide || '150-250 words'}</em>
            </div>
            ${
              includeAnswerKey && q.rubric
                ? `<div style="margin-top:6px; padding:8px; background:#fffbeb; border:1px solid #fde68a; border-radius:6px; font-size:12px; color:#92400e;">
                    <strong>Official Grading Rubric:</strong> ${q.rubric}
                  </div>`
                : `<div style="margin-top:10px; height:90px; border:1px dashed #94a3b8; border-radius:6px; padding:8px; font-size:11px; color:#94a3b8;">Candidate Answer Space</div>`
            }
          `;
        } else if (q.questionType === 'coding') {
          const tcs = (q.testCases || [])
            .filter((tc) => includeAnswerKey || !tc.isHidden)
            .map(
              (tc, tIdx) =>
                `<div style="font-family:monospace; font-size:12px; margin-top:4px; padding:6px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px;">
                  <strong>${tc.isHidden ? 'Hidden' : 'Sample'} Case #${tIdx + 1} (${tc.marks} marks):</strong> Input: <code>${tc.input}</code> | Expected Output: <code>${tc.expectedOutput}</code>
                </div>`
            )
            .join('');
          detailsHtml = `
            <div style="margin-top:8px; font-size:12px; color:#334155;">
              <strong>Target Language:</strong> ${(q.codingLanguage || 'python').toUpperCase()}
            </div>
            ${tcs}
          `;
        }

        const explanationHtml =
          includeAnswerKey && q.explanation
            ? `<div style="margin-top:6px; font-size:12px; color:#1e40af; background:#eff6ff; padding:6px 10px; border-radius:6px;">
                <strong>Solution Note:</strong> ${q.explanation}
              </div>`
            : '';

        return `
          <div style="padding: 14px 0; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div style="font-weight:700; font-size:14px; color:#0f172a;">
                Q${idx + 1}. [${q.questionType.toUpperCase()}] ${q.questionText}
              </div>
              <div style="font-weight:700; font-size:12px; color:#334155; white-space:nowrap; margin-left:12px;">
                [${q.marks} Marks]
              </div>
            </div>
            ${detailsHtml}
            ${explanationHtml}
          </div>
        `;
      })
      .join('');

    const htmlDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${exam.title} - ${modeLabel}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; max-width: 820px; margin: 28px auto; padding: 0 20px; line-height: 1.5; }
    @media print {
      .no-print { display: none !important; }
      body { margin: 0; padding: 12px; }
    }
  </style>
</head>
<body>
  <div style="border: 2px solid #0f172a; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 12px;">
      <div>
        <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#475569;">
          Panimalar Engineering College — Department of AI &amp; Data Science
        </div>
        <h1 style="margin:4px 0 0 0; font-size:20px;">${exam.title}</h1>
        <div style="font-size:13px; color:#334155; font-weight:600;">Course Subject: ${exam.subjectName || 'General Assessment'}</div>
      </div>
      <div style="text-align:right; font-size:12px;">
        <div><strong>Duration:</strong> ${exam.durationMinutes} Minutes</div>
        <div><strong>Maximum Marks:</strong> ${exam.totalMarks}</div>
        <div><strong>Passing Marks:</strong> ${exam.passingMarks}</div>
        <div style="margin-top:4px; padding:2px 8px; background:${includeAnswerKey ? '#fef3c7' : '#e0f2fe'}; color:${includeAnswerKey ? '#92400e' : '#0369a1'}; font-weight:700; border-radius:4px; display:inline-block;">
          ${includeAnswerKey ? 'CONFIDENTIAL ANSWER KEY' : 'CANDIDATE QUESTION PAPER'}
        </div>
      </div>
    </div>
    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; font-size:12px; margin-bottom:10px;">
      <div style="border:1px solid #cbd5e1; padding:8px; border-radius:4px;"><strong>Candidate Name:</strong> _______________________</div>
      <div style="border:1px solid #cbd5e1; padding:8px; border-radius:4px;"><strong>Student ID / Roll No:</strong> __________________</div>
      <div style="border:1px solid #cbd5e1; padding:8px; border-radius:4px;"><strong>Section (A-L):</strong> Sec-_____</div>
    </div>
    <div style="font-size:12px; color:#475569;">
      <strong>Instructions:</strong> ${exam.instructions || 'Answer all questions clearly. Write legibly and show all required steps.'}
    </div>
  </div>
  ${questionsHtml}
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${
      includeAnswerKey ? 'answer_key' : 'question_paper'
    }.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadedNotice(
      `Downloaded printable ${
        includeAnswerKey
          ? 'Official Answer Key & Rubric'
          : 'Candidate Question Paper'
      } (.html).`
    );
    setTimeout(() => setDownloadedNotice(''), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-6xl w-full p-5 sm:p-6 shadow-2xl max-h-[94vh] flex flex-col">
        {/* Top Action Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Question Paper &amp; Post-Publish Student Preview Studio
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold ${
                  examStatus === 'Published' || examStatus === 'Results Published'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                Status: {examStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Switch between the <strong>Official Printable University Paper</strong> and the{' '}
              <strong>Live Student Exam Screen View</strong> (what displays to candidates after publishing).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {examStatus === 'Draft' && (
              <button
                type="button"
                onClick={handlePublishExamNow}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/25 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Publish Exam Now
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadPdfPaper}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export PDF (.pdf)
            </button>

            <button
              type="button"
              onClick={handleDownloadPrintableHtml}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Printable (.HTML)
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>

            <button
              type="button"
              aria-label="Close preview modal"
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Switcher Bar: Official Printable Paper vs. Live Student Exam View */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode('paper')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                previewMode === 'paper'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              1. Official Printable Question Paper (PDF Format)
            </button>

            <button
              type="button"
              onClick={() => {
                setPreviewMode('student-view');
                setPreviewCodeResults(null);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                previewMode === 'student-view'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Monitor className="w-4 h-4" />
              2. What Displays After Publish (Student Exam Screen View)
            </button>
          </div>

          {previewMode === 'paper' && (
            <button
              type="button"
              onClick={() => setIncludeAnswerKey(!includeAnswerKey)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                includeAnswerKey
                  ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-400 text-amber-800 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              {includeAnswerKey
                ? 'Official Answer Key & Rubric: SHOWN'
                : 'Show Official Answer Key: OFF'}
            </button>
          )}
        </div>

        {downloadedNotice && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{downloadedNotice}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 1: OFFICIAL PRINTABLE QUESTION PAPER (PDF FORMAT)    */}
        {/* ========================================================= */}
        {previewMode === 'paper' ? (
          <div className="mt-4 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            {/* University Paper Header Box */}
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-slate-900 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/panimalar-crest.png"
                    alt="Panimalar Engineering College"
                    className="w-12 h-12 object-contain shrink-0"
                  />
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                      Panimalar Engineering College — Dept. of AI &amp; Data Science
                    </div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                      {exam.title}
                    </h1>
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-2 mt-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Course: {exam.subjectName || 'General Course'}</span>
                      <span>&bull;</span>
                      <span>
                        Breakdown: {mcqQuestions.length} MCQ,{' '}
                        {descQuestions.length} Descriptive,{' '}
                        {codingQuestions.length} Coding
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right space-y-1 text-xs">
                  <div className="flex sm:justify-end items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    Time Allowed: {exam.durationMinutes} Minutes
                  </div>
                  <div className="flex sm:justify-end items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    Max Marks: {exam.totalMarks} (Pass: {exam.passingMarks})
                  </div>
                  <span
                    className={`inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md ${
                      includeAnswerKey
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}
                  >
                    {includeAnswerKey
                      ? 'Confidential Faculty Answer Key'
                      : 'Candidate Examination Paper'}
                  </span>
                </div>
              </div>

              {/* Candidate Info Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Candidate Full Name
                  </span>
                  <div className="h-5 border-b border-dashed border-slate-400 mt-1" />
                </div>
                <div className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Student ID / Roll Number
                  </span>
                  <div className="h-5 border-b border-dashed border-slate-400 mt-1" />
                </div>
                <div className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Section (Section A to Section L)
                  </span>
                  <div className="h-5 border-b border-dashed border-slate-400 mt-1" />
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/60 p-3 rounded-lg">
                <strong>General Instructions:</strong>{' '}
                {exam.instructions ||
                  'All questions are compulsory unless stated otherwise. Marks are indicated against each question.'}
              </div>
            </div>

            {/* Questions Stream */}
            {normalizedQuestions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                No questions have been authored for this examination yet.
              </div>
            ) : (
              <div className="space-y-4">
                {normalizedQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        <span className="font-mono text-blue-600 dark:text-blue-400 mr-1.5">
                          Q{idx + 1}.
                        </span>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mr-2">
                          {q.questionType}
                        </span>
                        {q.questionText}
                      </div>
                      <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg shrink-0 font-mono">
                        [{q.marks} Marks]
                      </span>
                    </div>

                    {/* MCQ Options */}
                    {q.questionType === 'mcq' && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect =
                            includeAnswerKey && q.correctOption === oIdx;
                          return (
                            <div
                              key={oIdx}
                              className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 font-bold text-emerald-900 dark:text-emerald-200'
                                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span className="w-5 h-5 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center font-mono text-[11px] font-bold">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span>{opt}</span>
                              {isCorrect && (
                                <span className="ml-auto text-[10px] font-extrabold uppercase text-emerald-600">
                                  ✓ Answer Key
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Descriptive Space or Rubric */}
                    {q.questionType === 'descriptive' && (
                      <div className="pl-4 space-y-2 text-xs">
                        <div className="text-[11px] text-slate-500 italic">
                          Recommended Answer Length:{' '}
                          {q.answerLengthGuide || '150-250 words'}
                        </div>
                        {includeAnswerKey && q.rubric ? (
                          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                            <strong>Official Grading Rubric:</strong> {q.rubric}
                          </div>
                        ) : (
                          <div className="h-20 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-2 text-[11px] text-slate-400">
                            [Written Response Area for Candidate]
                          </div>
                        )}
                      </div>
                    )}

                    {/* Coding Details */}
                    {q.questionType === 'coding' && (
                      <div className="pl-4 space-y-2 text-xs">
                        <div className="text-[11px] text-slate-500">
                          Default Language:{' '}
                          <strong className="font-mono uppercase text-slate-700 dark:text-slate-300">
                            {q.codingLanguage || 'python'}
                          </strong>{' '}
                          (C, C++, Python, Java, JS, C#, Go, Rust permitted)
                        </div>
                        {q.testCases && q.testCases.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.testCases
                              .filter((tc) => includeAnswerKey || !tc.isHidden)
                              .map((tc, tIdx) => (
                                <div
                                  key={tc.id || tIdx}
                                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
                                >
                                  <div className="font-bold text-slate-700 dark:text-slate-300">
                                    {tc.isHidden
                                      ? 'Hidden Test Case'
                                      : 'Sample Test Case'}{' '}
                                    #{tIdx + 1} ({tc.marks} pts)
                                  </div>
                                  <div>Input: {tc.input}</div>
                                  <div>Expected: {tc.expectedOutput}</div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {includeAnswerKey && q.explanation && (
                      <div className="pl-4 pt-1">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-800 dark:text-blue-200">
                          <strong>Solution Explanation:</strong> {q.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ========================================================= */
          /* MODE 2: LIVE STUDENT EXAM SCREEN VIEW (POST-PUBLISH VIEW) */
          /* ========================================================= */
          <div className="mt-4 flex-1 overflow-y-auto rounded-2xl border border-purple-500/30 bg-[#0B1426] text-white flex flex-col">
            {/* Simulated Lockdown Top Bar */}
            <div className="bg-[#080B24] border-b border-purple-500/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-purple-600/25 border border-purple-400/40 text-purple-200 text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  POST-PUBLISH STUDENT SCREEN PREVIEW
                </span>
                <div>
                  <div className="text-sm font-extrabold text-white">
                    {exam.title}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Subject: {exam.subjectName || 'General'} · Assigned Sections:{' '}
                    {((exam as StoreExam).assignedCohorts || ['A']).join(', ')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Violations: 0 / 3
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-sky-300 font-mono text-sm font-extrabold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {exam.durationMinutes}:00
                </div>
              </div>
            </div>

            {activeStudentQ ? (
              <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
                {/* Left Student Question Workspace */}
                <div className="lg:col-span-9 bg-white text-slate-900 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1 rounded-xl bg-blue-600 text-white text-xs font-extrabold font-mono">
                          Question {safeStudentIndex + 1} of{' '}
                          {normalizedQuestions.length}
                        </span>
                        <span className="text-xs font-bold uppercase text-slate-500">
                          {activeStudentQ.questionType} ·{' '}
                          {activeStudentQ.difficulty}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-extrabold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl">
                        {activeStudentQ.marks} Marks
                      </span>
                    </div>

                    <div className="text-base font-bold text-slate-900 leading-relaxed">
                      {activeStudentQ.questionText}
                    </div>

                    {/* MCQ Interactive Preview */}
                    {activeStudentQ.questionType === 'mcq' &&
                      activeStudentQ.options && (
                        <div className="space-y-2.5 pt-1">
                          {activeStudentQ.options.map((opt, oIdx) => {
                            const selected =
                              previewSelectedMcq[activeStudentQ.id] === oIdx;
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() =>
                                  setPreviewSelectedMcq((prev) => ({
                                    ...prev,
                                    [activeStudentQ.id]: oIdx,
                                  }))
                                }
                                className={`w-full text-left p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                                  selected
                                    ? 'bg-blue-50/70 border-blue-600 text-blue-950 font-bold'
                                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold ${
                                      selected
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span className="text-xs sm:text-sm">
                                    {opt}
                                  </span>
                                </div>
                                {selected && (
                                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                    {/* Descriptive Interactive Preview */}
                    {activeStudentQ.questionType === 'descriptive' && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>
                            Guidance:{' '}
                            {activeStudentQ.answerLengthGuide ||
                              'Write a clear, structured technical explanation.'}
                          </span>
                          <span className="font-mono">
                            {
                              (previewDescriptive[activeStudentQ.id] || '')
                                .trim()
                                .split(/\s+/)
                                .filter(Boolean).length
                            }{' '}
                            words
                          </span>
                        </div>
                        <textarea
                          rows={6}
                          value={previewDescriptive[activeStudentQ.id] || ''}
                          onChange={(e) =>
                            setPreviewDescriptive((prev) => ({
                              ...prev,
                              [activeStudentQ.id]: e.target.value,
                            }))
                          }
                          placeholder="Candidate types their descriptive answer here during the live exam..."
                          className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    )}

                    {/* Coding Sandbox Interactive Preview */}
                    {activeStudentQ.questionType === 'coding' && (
                      <div className="space-y-3 pt-1">
                        <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#070E22]">
                          <div className="px-4 py-2 bg-[#0F1B38] border-b border-slate-800 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Code2 className="w-4 h-4 text-sky-400" />
                              <select
                                aria-label="Preview Programming Language"
                                value={
                                  previewLang[activeStudentQ.id] ||
                                  activeStudentQ.codingLanguage ||
                                  'python'
                                }
                                onChange={(e) => {
                                  const nextLang = e.target
                                    .value as ProgrammingLanguage;
                                  setPreviewLang((prev) => ({
                                    ...prev,
                                    [activeStudentQ.id]: nextLang,
                                  }));
                                  setPreviewCode((prev) => ({
                                    ...prev,
                                    [activeStudentQ.id]:
                                      STARTER_CODE_TEMPLATES[nextLang],
                                  }));
                                }}
                                className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-700"
                              >
                                {PROGRAMMING_LANGUAGES.map((l) => (
                                  <option key={l.id} value={l.id}>
                                    {l.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const lang =
                                  previewLang[activeStudentQ.id] ||
                                  activeStudentQ.codingLanguage ||
                                  'python';
                                const code =
                                  previewCode[activeStudentQ.id] ??
                                  (activeStudentQ.starterCode ||
                                    STARTER_CODE_TEMPLATES[lang]);
                                const res = evaluateProgrammingSubmission(
                                  code,
                                  lang,
                                  activeStudentQ.testCases,
                                  activeStudentQ.marks
                                );
                                setPreviewCodeResults(res.results);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              Run Code &amp; Test Cases
                            </button>
                          </div>

                          <textarea
                            rows={6}
                            value={
                              previewCode[activeStudentQ.id] ??
                              (activeStudentQ.starterCode ||
                                STARTER_CODE_TEMPLATES[
                                  activeStudentQ.codingLanguage || 'python'
                                ])
                            }
                            onChange={(e) =>
                              setPreviewCode((prev) => ({
                                ...prev,
                                [activeStudentQ.id]: e.target.value,
                              }))
                            }
                            className="w-full p-3.5 bg-[#070E22] text-emerald-400 font-mono text-xs focus:outline-none"
                          />
                        </div>

                        {previewCodeResults && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {previewCodeResults.map((tc, idx) => (
                              <div
                                key={tc.testCaseId}
                                className={`p-2.5 rounded-xl border font-mono text-xs ${
                                  tc.passed
                                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                                    : 'bg-red-950/60 border-red-500/40 text-red-200'
                                }`}
                              >
                                <div className="font-bold flex justify-between">
                                  <span>Case #{idx + 1}</span>
                                  <span>{tc.passed ? 'PASSED' : 'FAILED'}</span>
                                </div>
                                <div>
                                  In: {tc.input} | Out: {tc.actualOutput}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Stepper Controls */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={safeStudentIndex === 0}
                      onClick={() => {
                        setPreviewCodeResults(null);
                        setStudentQIndex((i) => Math.max(0, i - 1));
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <span className="text-[11px] text-slate-400 font-medium">
                      Questions automatically shuffle per student in live exams
                    </span>

                    <button
                      type="button"
                      disabled={
                        safeStudentIndex >= normalizedQuestions.length - 1
                      }
                      onClick={() => {
                        setPreviewCodeResults(null);
                        setStudentQIndex((i) =>
                          Math.min(normalizedQuestions.length - 1, i + 1)
                        );
                      }}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Next Question
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Right Student Question Palette */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="bg-[#0F1D3A] rounded-2xl border border-slate-800 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span className="text-slate-300 uppercase">
                        Question Palette
                      </span>
                      <span className="font-mono text-sky-400">
                        {normalizedQuestions.length} Total
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {normalizedQuestions.map((q, idx) => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => {
                            setPreviewCodeResults(null);
                            setStudentQIndex(idx);
                          }}
                          className={`h-10 rounded-xl font-mono text-xs font-extrabold cursor-pointer ${
                            idx === safeStudentIndex
                              ? 'bg-blue-600 text-white ring-2 ring-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-sm text-slate-400">
                No questions in this examination yet. Import or add questions to preview the student exam screen.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
