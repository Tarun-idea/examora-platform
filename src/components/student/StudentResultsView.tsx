import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Award,
  ShieldCheck,
  Lock,
  Download,
} from 'lucide-react';
import { examStore } from '../../services/examStore.ts';
import { downloadCertificateRecord } from '../../utils/certificateDownload.ts';
import { generateCertificateQrBase64 } from '../../services/qrGenerator.ts';

interface StudentResultsViewProps {
  attemptId: string;
  onBack: () => void;
}

export const StudentResultsView: React.FC<StudentResultsViewProps> = ({
  attemptId,
  onBack,
}) => {
  const state = examStore.getState();
  const attempt = state.attempts.find((a) => a.id === attemptId);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // If student passed, find or auto-attach their certificate
  const certificate =
    attempt && attempt.passed
      ? state.certificates.find((c) => c.attemptId === attempt.id) ||
        examStore.ensureCertificateIssued(attempt, true)
      : undefined;
  const tpl = state.certificateTemplate;

  const studentSection =
    state.students.find(
      (s) =>
        s.id === attempt?.studentId ||
        s.studentId.trim().toLowerCase() ===
          (attempt?.studentRegId || '').trim().toLowerCase()
    )?.section || 'Section A';

  useEffect(() => {
    let active = true;
    if (certificate) {
      generateCertificateQrBase64(
        {
          certificateNumber: certificate.certificateNumber,
          studentName: certificate.studentName,
          studentRegId: certificate.studentRegId,
          section: certificate.section || studentSection,
          examTitle: certificate.examTitle,
          subjectName: certificate.subjectName,
          scoreText: `${certificate.score} / ${certificate.maxScore} (${certificate.percentage}%)`,
          grade: certificate.grade,
          issuedAt: certificate.issuedAt,
          verifiedAt: certificate.verifiedAt || certificate.issuedAt,
          verificationStatus: `VERIFIED & ACTIVE CREDENTIAL (Issued: ${certificate.issuedAt})`,
          institutionName: tpl.institutionName,
        },
        220
      ).then((url) => {
        if (active) setQrDataUrl(url);
      });
    }
    return () => {
      active = false;
    };
  }, [certificate, studentSection, tpl.institutionName]);

  if (!attempt) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
        <p className="text-sm text-slate-600">Attempt record not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleDownloadCertificate = () => {
    if (certificate) {
      downloadCertificateRecord(tpl, certificate, studentSection);
      setDownloadNotice(
        `Certificate ${certificate.certificateNumber} downloaded as high-resolution PNG with scannable QR code!`
      );
    }
  };

  return (
    <div className="space-y-6 max-w-[1480px] w-full mx-auto">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Student Dashboard
        </button>

        {attempt.passed && certificate && (
          <button
            type="button"
            onClick={handleDownloadCertificate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Official Certificate
          </button>
        )}
      </div>

      {downloadNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadNotice(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Score Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold ${
                attempt.passed
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {attempt.passed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> PASSED — CERTIFICATE ATTACHED
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" /> DID NOT PASS
                </>
              )}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Attempt ID: {attempt.id}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900">
            {attempt.examTitle}
          </h1>
          <p className="text-xs text-slate-500">
            Candidate: {attempt.studentName} ({attempt.studentRegId}) ·{' '}
            {studentSection} · Published:{' '}
            {attempt.publishedAt
              ? new Date(attempt.publishedAt).toLocaleDateString()
              : 'Verified'}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">
              Final Score
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {attempt.totalScore}{' '}
              <span className="text-lg text-slate-400">
                / {attempt.maxScore}
              </span>
            </div>
          </div>

          <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white flex flex-col items-center justify-center font-mono">
            <span className="text-xl font-extrabold">{attempt.percentage}%</span>
            <span className="text-[10px] uppercase">Accuracy</span>
          </div>
        </div>
      </div>

      {/* Section Score Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <div className="text-xs text-slate-500">MCQ Auto-Evaluated</div>
          <div className="text-xl font-extrabold text-blue-600 font-mono mt-1">
            {attempt.mcqScore} pts
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <div className="text-xs text-slate-500">Descriptive Assessment</div>
          <div className="text-xl font-extrabold text-amber-600 font-mono mt-1">
            {attempt.descriptiveScore} pts
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <div className="text-xs text-slate-500">Programming Test Cases</div>
          <div className="text-xl font-extrabold text-emerald-600 font-mono mt-1">
            {attempt.codingScore} pts
          </div>
        </div>
      </div>

      {/* Evaluator Overall Remarks (if provided) */}
      {attempt.overallFeedback && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-1.5">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Official Evaluator Remarks
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {attempt.overallFeedback}
          </p>
        </div>
      )}

      {/* Automatically Attached Full Certificate for Passing Candidate */}
      {attempt.passed && certificate && (
        <div className="bg-white rounded-3xl border-2 border-emerald-300 p-6 sm:p-8 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-emerald-700">
                  Attached Certificate #{certificate.certificateNumber} ·{' '}
                  {certificate.grade}
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  Official Merit Certificate (With Scannable Student Verification QR Code)
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadCertificate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Certificate PNG
            </button>
          </div>

          {/* Official White & Emerald Certificate Sheet */}
          <div className="border-[4px] border-emerald-400 rounded-xl p-2 sm:p-3 bg-gradient-to-b from-emerald-50/90 via-white to-white relative overflow-hidden">
            <div className="border-[2px] border-emerald-200 rounded-lg p-5 sm:p-8 relative overflow-hidden">
              {/* Centered Institutional Crest Watermark */}
              <img
                src="/assets/panimalar-crest.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-80 h-auto object-contain opacity-[0.15] z-0"
              />

              <div className="relative z-10 space-y-5">
                {/* Top Row: Top-Left Full Panimalar Banner + Top-Center Official Pill Badge (NO small center logo) */}
                <div className="grid grid-cols-1 sm:grid-cols-12 items-start gap-3">
                  <div className="sm:col-span-5 flex items-center gap-2.5 text-left">
                    <img
                      src="/assets/panimalar-crest.png"
                      alt="Panimalar Engineering College Emblem"
                      className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0"
                    />
                    <div className="flex flex-col items-center text-center leading-tight">
                      <span className="text-xs sm:text-sm font-black tracking-wide text-slate-800 uppercase">
                        PANIMALAR
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-extrabold tracking-wider text-slate-700 uppercase">
                        ENGINEERING COLLEGE
                      </span>
                      <span className="mt-0.5 px-2 py-0.5 rounded-[3px] bg-[#C62828] text-white font-bold text-[8px] tracking-wide">
                        An Autonomous Institution
                      </span>
                      <span className="mt-0.5 text-[8px] font-bold text-slate-600">
                        Affiliated to Anna University, Chennai
                      </span>
                      <span className="text-[7.5px] font-bold text-slate-500 uppercase">
                        (JAISAKTHI EDUCATIONAL TRUST)
                      </span>
                    </div>
                  </div>

                  <div className="sm:col-span-7 flex sm:justify-start justify-center sm:pl-4 pt-1">
                    <span className="px-4 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-400">
                      {tpl.headerBadgeText}
                    </span>
                  </div>
                </div>

                {/* Main Heading Block (No small center logo) */}
                <div className="text-center space-y-1.5 pt-1">
                  <div className="text-xs sm:text-sm font-extrabold tracking-wider uppercase text-emerald-700">
                    {tpl.institutionName}
                  </div>
                  <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {tpl.certificateTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 pt-1">
                    {tpl.presentationLine}
                  </p>
                </div>

                {/* Candidate Name */}
                <div className="text-center">
                  <div className="inline-block px-8 pb-1.5 text-2xl sm:text-3xl font-extrabold text-emerald-950 border-b-[3px] border-emerald-700">
                    {certificate.studentName}
                  </div>
                </div>

                {/* Citation & Score */}
                <div className="text-center space-y-2 max-w-2xl mx-auto">
                  <div className="text-xs sm:text-sm font-medium text-slate-700">
                    Registration ID: {certificate.studentRegId} &nbsp;•&nbsp;
                    Examination: {certificate.examTitle}
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                    {tpl.bodyTextTemplate}
                  </p>
                  <div className="text-xs sm:text-sm font-mono font-extrabold text-emerald-700 pt-1">
                    Verified Score: {certificate.score} / {certificate.maxScore}{' '}
                    ({certificate.percentage}%) &nbsp; | &nbsp; Merit Grade:{' '}
                    {certificate.grade}
                  </div>
                  {certificate.customRemarks && (
                    <div className="text-[11px] sm:text-xs italic text-slate-500 pt-0.5">
                      &ldquo;{certificate.customRemarks}&rdquo;
                    </div>
                  )}
                </div>

                {/* 3-Column Signatories Row */}
                <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-xs">
                  <div className="text-center sm:text-left">
                    <div className="font-extrabold text-slate-900">
                      {tpl.signatoryLeftName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {tpl.signatoryLeftTitle}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="font-extrabold text-slate-900">
                      {tpl.signatoryCenterName || 'Dr. S. Prasanna Devi'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {tpl.signatoryCenterTitle || 'Chief Examination Controller'}
                    </div>
                  </div>

                  <div className="text-center sm:text-right">
                    <div className="font-extrabold text-slate-900">
                      {tpl.signatoryRightName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {tpl.signatoryRightTitle}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: [ ✓ VERIFIED MERIT SEAL ] + [ Dynamic Scannable QR Code ] + [ Issued Date • Verified Official Credential ] */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                    <div className="px-6 py-3.5 rounded-xl border-2 bg-emerald-50 border-emerald-700 text-emerald-800 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>✓ {tpl.sealText}</span>
                    </div>

                    {qrDataUrl && (
                      <div className="p-1.5 rounded-xl bg-white border-2 border-emerald-700 shadow-2xs shrink-0">
                        <img
                          src={qrDataUrl}
                          alt={`Scannable QR Code for ${certificate.studentName}`}
                          className="w-16 h-16 object-contain rounded"
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-slate-600 text-center sm:text-right">
                    Issued: {certificate.issuedAt} &nbsp;•&nbsp; Verified
                    Official Credential
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confidential Question & Answer Key Protection Notice */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <div className="text-xs font-extrabold text-slate-900">
            Examination Questions &amp; Answer Key Protected
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            To prevent question leakage and unfair advantage across student cohorts, individual question prompts and official correct answers are restricted to the Administrator Evaluation Station.
          </p>
        </div>
      </div>
    </div>
  );
};
