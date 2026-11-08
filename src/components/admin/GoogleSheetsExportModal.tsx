import React, { useState } from 'react';
import { FileSpreadsheet, Download, Copy, Check, ExternalLink, X } from 'lucide-react';
import { examStore } from '../../services/examStore.ts';

interface GoogleSheetsExportModalProps {
  onClose: () => void;
  initialExamId?: string;
}

export const GoogleSheetsExportModal: React.FC<GoogleSheetsExportModalProps> = ({
  onClose,
  initialExamId = 'ALL',
}) => {
  const state = examStore.getState();
  const [exportType, setExportType] = useState<'results' | 'students' | 'questions'>('results');
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId);
  const [copied, setCopied] = useState(false);

  const selectedExam = state.exams.find((e) => e.id === selectedExamId);

  // Generate CSV data based on type & selected exam filter
  const generateCsv = () => {
    if (exportType === 'results') {
      const rows = [
        [
          'Attempt_ID',
          'Exam_Title',
          'Student_ID',
          'Student_Name',
          'Student_Email',
          'Batch',
          'MCQ_Marks',
          'Descriptive_Marks',
          'Coding_Marks',
          'Total_Marks',
          'Max_Marks',
          'Status',
          'Result_Released',
          'Violations',
          'Submitted_At',
        ],
      ];

      Object.values(state.attempts)
        .filter((att) => selectedExamId === 'ALL' || att.examId === selectedExamId)
        .forEach((att) => {
          const exam = state.exams.find((e) => e.id === att.examId);
          const student = state.students.find((s) => s.id === att.studentId);
          rows.push([
            att.id,
            `"${exam?.title || att.examTitle || ''}"`,
            student?.studentId || att.studentRegId || att.studentId,
            `"${att.studentName || ''}"`,
            att.studentEmail || '',
            `Section ${student?.section || 'A'}`,
            String(att.mcqScore ?? 0),
            String(att.descriptiveScore ?? 0),
            String(att.codingScore ?? 0),
            String(att.totalScore ?? 0),
            String(exam?.totalMarks || att.maxScore || 100),
            att.status,
            att.status === 'published' ? 'YES' : 'NO',
            String(att.violationCount || 0),
            att.submittedAt || '',
          ]);
        });
      return rows.map((r) => r.join(',')).join('\n');
    }

    if (exportType === 'students') {
      const rows = [
        ['Student_ID', 'Full_Name', 'Email', 'Department', 'Year', 'Section', 'Status', 'Created_At'],
      ];
      state.students.forEach((s) => {
        rows.push([
          s.studentId || '',
          `"${s.name}"`,
          s.email,
          `"${s.department || ''}"`,
          s.year || '',
          `Section ${s.section || 'A'}`,
          s.status === 'Active' ? 'Active' : 'Inactive',
          s.createdAt,
        ]);
      });
      return rows.map((r) => r.join(',')).join('\n');
    }

    // Questions export
    const rows = [
      ['Question_ID', 'Exam_Title', 'Type', 'Language', 'Question_Statement', 'Marks', 'Difficulty'],
    ];
    state.questions
      .filter((q) => selectedExamId === 'ALL' || q.examId === selectedExamId)
      .forEach((q) => {
        const exam = state.exams.find((e) => e.id === q.examId);
        const qType = q.type || 'mcq';
        const qLang = q.programmingLanguage || 'N/A';
        const qText = q.text || '';
        rows.push([
          q.id,
          `"${exam?.title || ''}"`,
          qType,
          qLang,
          `"${qText.replace(/"/g, '""')}"`,
          String(q.marks),
          q.difficulty || 'Medium',
        ]);
      });
    return rows.map((r) => r.join(',')).join('\n');
  };

  const csvContent = generateCsv();

  const handleCopy = () => {
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const slug = selectedExam
      ? selectedExam.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 28)
      : 'All_Exams';
    link.setAttribute(
      'download',
      `ExamFlow_${exportType}_${slug}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Google Sheets & CSV Export Suite
              </h2>
              <p className="text-xs text-slate-500">
                Export particular exam student results, rosters, or questions directly into Google Sheets to share.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setExportType('results')}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
              exportType === 'results'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500'
            }`}
          >
            Examination Results
          </button>
          <button
            onClick={() => setExportType('students')}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
              exportType === 'students'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500'
            }`}
          >
            Student Roster
          </button>
          <button
            onClick={() => setExportType('questions')}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
              exportType === 'questions'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500'
            }`}
          >
            Question Bank
          </button>
        </div>

        {/* Exam Selector Filter for Results / Questions */}
        {(exportType === 'results' || exportType === 'questions') && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Particular Examination to Export:
            </span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Examinations Combined</option>
              {state.exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.subjectName})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Preview Code Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Formatted Sheet Data ({selectedExam ? selectedExam.title : 'All Examinations'}):
            </span>
            <span>{csvContent.split('\n').length} Rows</span>
          </div>

          <pre className="p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] h-48 overflow-auto border border-slate-800">
            {csvContent}
          </pre>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Copy and paste into <strong className="text-slate-700 dark:text-slate-300">sheets.new</strong> or download the CSV file to share.
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied to Clipboard' : 'Copy Sheet Data'}
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download .CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
