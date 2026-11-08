import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Save,
  RotateCcw,
  FileCheck2,
  Download,
  Edit3,
  X,
  Users,
  Filter,
  FolderDown,
  QrCode,
} from 'lucide-react';
import {
  examStore,
  CertificateTemplateConfig,
  CertificateRecord,
} from '../../services/examStore.ts';
import {
  downloadAndPrintCertificate,
  downloadCertificateRecord,
  downloadBatchCertificates,
} from '../../utils/certificateDownload.ts';
import {
  generateCertificateQrBase64,
  buildCertificateQrText,
} from '../../services/qrGenerator.ts';

const ALL_SECTIONS_A_TO_Z = Array.from(
  { length: 12 },
  (_, idx) => `Section ${String.fromCharCode(65 + idx)}`
);

function normalizeSectionLabel(rawSection?: string): string {
  const cleaned = (rawSection || '').trim();
  if (!cleaned) return 'Section A';
  const match = cleaned.match(/^(?:section|sec)?[\s\-_]*([a-l])$/i);
  if (match) {
    return `Section ${match[1].toUpperCase()}`;
  }
  return ALL_SECTIONS_A_TO_Z.includes(cleaned) ? cleaned : 'Section A';
}

export const CertificateManagement: React.FC = () => {
  const state = examStore.getState();
  const tpl = state.certificateTemplate;

  // Certificate Template & Details State
  const [institutionName, setInstitutionName] = useState<string>(
    tpl.institutionName
  );
  const [headerBadgeText, setHeaderBadgeText] = useState<string>(
    tpl.headerBadgeText
  );
  const [certificateTitle, setCertificateTitle] = useState<string>(
    tpl.certificateTitle
  );
  const [presentationLine, setPresentationLine] = useState<string>(
    tpl.presentationLine
  );
  const [bodyTextTemplate, setBodyTextTemplate] = useState<string>(
    tpl.bodyTextTemplate
  );
  const [signatoryLeftName, setSignatoryLeftName] = useState<string>(
    tpl.signatoryLeftName
  );
  const [signatoryLeftTitle, setSignatoryLeftTitle] = useState<string>(
    tpl.signatoryLeftTitle
  );
  const [signatoryCenterName, setSignatoryCenterName] = useState<string>(
    tpl.signatoryCenterName || 'Dr. S. Prasanna Devi'
  );
  const [signatoryCenterTitle, setSignatoryCenterTitle] = useState<string>(
    tpl.signatoryCenterTitle || 'Chief Examination Controller'
  );
  const [signatoryRightName, setSignatoryRightName] = useState<string>(
    tpl.signatoryRightName
  );
  const [signatoryRightTitle, setSignatoryRightTitle] = useState<string>(
    tpl.signatoryRightTitle
  );
  const [sealText, setSealText] = useState<string>(tpl.sealText);
  const [accentTheme, setAccentTheme] = useState<
    CertificateTemplateConfig['accentTheme']
  >(tpl.accentTheme || 'emerald');
  const [defaultRemarks, setDefaultRemarks] = useState<string>(
    'Awarded for passing the proctored examination with verified distinction.'
  );
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showQrDetailsModal, setShowQrDetailsModal] = useState<boolean>(false);
  const [selectedPreviewCertId, setSelectedPreviewCertId] =
    useState<string>('');
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState<string>('');

  // Section-Wise (Section A - Section L) & Exam Filter State for Group Certificate Download
  const [selectedExamFilter, setSelectedExamFilter] = useState<string>('ALL');
  const [selectedSectionFilter, setSelectedSectionFilter] =
    useState<string>('Section A');
  const [batchProgress, setBatchProgress] = useState<{
    sectionLabel: string;
    current: number;
    total: number;
  } | null>(null);

  // Auto-ensure every passed student attempt has an official CertificateRecord issued
  useEffect(() => {
    const current = examStore.getState();
    for (const att of current.attempts) {
      if (att.passed) {
        const exists = current.certificates.some((c) => c.attemptId === att.id);
        if (!exists) {
          examStore.ensureCertificateIssued(att, true);
        }
      }
    }
  }, [state.attempts.length]);

  const currentTemplateConfig: CertificateTemplateConfig = useMemo(
    () => ({
      institutionName: institutionName.trim() || tpl.institutionName,
      headerBadgeText: headerBadgeText.trim() || tpl.headerBadgeText,
      certificateTitle: certificateTitle.trim() || tpl.certificateTitle,
      presentationLine: presentationLine.trim() || tpl.presentationLine,
      bodyTextTemplate: bodyTextTemplate.trim() || tpl.bodyTextTemplate,
      signatoryLeftName: signatoryLeftName.trim() || tpl.signatoryLeftName,
      signatoryLeftTitle: signatoryLeftTitle.trim() || tpl.signatoryLeftTitle,
      signatoryCenterName:
        signatoryCenterName.trim() ||
        tpl.signatoryCenterName ||
        'Dr. S. Prasanna Devi',
      signatoryCenterTitle:
        signatoryCenterTitle.trim() ||
        tpl.signatoryCenterTitle ||
        'Chief Examination Controller',
      signatoryRightName: signatoryRightName.trim() || tpl.signatoryRightName,
      signatoryRightTitle:
        signatoryRightTitle.trim() || tpl.signatoryRightTitle,
      sealText: sealText.trim() || tpl.sealText,
      accentTheme,
    }),
    [
      institutionName,
      headerBadgeText,
      certificateTitle,
      presentationLine,
      bodyTextTemplate,
      signatoryLeftName,
      signatoryLeftTitle,
      signatoryCenterName,
      signatoryCenterTitle,
      signatoryRightName,
      signatoryRightTitle,
      sealText,
      accentTheme,
      tpl,
    ]
  );

  // Build enriched list of passed student certificates mapped to their Section (Section A - Section L)
  const passedCertificatesWithSection = useMemo(() => {
    const certMap = new Map<
      string,
      { cert: CertificateRecord; section: string }
    >();

    const findStudentSection = (studentId: string, studentRegId: string) => {
      const stu = state.students.find(
        (s) =>
          s.id === studentId ||
          s.studentId.trim().toLowerCase() ===
            (studentRegId || '').trim().toLowerCase()
      );
      return normalizeSectionLabel(stu?.section);
    };

    for (const cert of state.certificates) {
      // Only include certificates for passed attempts
      const matchingAttempt = state.attempts.find(
        (a) => a.id === cert.attemptId
      );
      if (matchingAttempt && !matchingAttempt.passed) continue;
      const section = findStudentSection(cert.studentId, cert.studentRegId);
      certMap.set(cert.id, { cert, section });
    }

    // Also include any passed attempt that hasn't been synced into state.certificates yet
    for (const att of state.attempts) {
      if (!att.passed) continue;
      const alreadyHasCert = Array.from(certMap.values()).some(
        (item) => item.cert.attemptId === att.id
      );
      if (!alreadyHasCert) {
        const section = findStudentSection(att.studentId, att.studentRegId);
        const issuedDate = (
          att.publishedAt ||
          att.submittedAt ||
          att.startedAt
        ).split('T')[0];
        const fallbackCert: CertificateRecord = {
          id: `cert-${att.id}`,
          certificateNumber: `EF-2026-${att.id.slice(-4).toUpperCase()}`,
          attemptId: att.id,
          examId: att.examId,
          examTitle: att.examTitle,
          subjectName: att.subjectName,
          studentId: att.studentId,
          studentName: att.studentName,
          studentRegId: att.studentRegId,
          section,
          score: att.totalScore,
          maxScore: att.maxScore,
          percentage: att.percentage,
          grade:
            att.percentage >= 90
              ? 'A+ (Distinction)'
              : att.percentage >= 75
              ? 'A (First Class)'
              : 'B (Pass)',
          issuedAt: issuedDate,
          verifiedAt: issuedDate,
          publishedToStudent: true,
          customRemarks: defaultRemarks,
        };
        certMap.set(fallbackCert.id, { cert: fallbackCert, section });
      }
    }

    return Array.from(certMap.values()).filter((item) =>
      selectedExamFilter === 'ALL'
        ? true
        : item.cert.examId === selectedExamFilter
    );
  }, [
    state.certificates,
    state.attempts,
    state.students,
    selectedExamFilter,
    defaultRemarks,
  ]);

  // Active preview payload (uses selected or first passed certificate)
  const previewSample = useMemo(() => {
    const selectedItem =
      passedCertificatesWithSection.find(
        (item) => item.cert.id === selectedPreviewCertId
      ) || passedCertificatesWithSection[0];
    const latestCert = selectedItem?.cert || state.certificates[0];
    const firstStudent = state.students[0];
    const firstExam = state.exams[0];
    const issuedDate =
      latestCert?.issuedAt || new Date().toISOString().split('T')[0];

    return {
      certificateNumber:
        latestCert?.certificateNumber || 'EF-2026-OFFICIAL-001',
      studentName:
        latestCert?.studentName || firstStudent?.name || 'Tarunkumar V',
      studentRegId:
        latestCert?.studentRegId || firstStudent?.studentId || '2025',
      section:
        selectedItem?.section ||
        normalizeSectionLabel(firstStudent?.section) ||
        'Section A',
      examTitle:
        latestCert?.examTitle || firstExam?.title || 'Technical Assessment',
      subjectName:
        latestCert?.subjectName ||
        firstExam?.subjectName ||
        state.subjects[0]?.name ||
        'Official Assessment',
      scoreText: latestCert
        ? `${latestCert.score} / ${latestCert.maxScore} (${latestCert.percentage}%)`
        : '60 / 60 (100%)',
      grade: latestCert?.grade || 'A+ (Distinction)',
      issuedAt: issuedDate,
      verifiedAt: latestCert?.verifiedAt || issuedDate,
      verificationStatus: `VERIFIED & ACTIVE CREDENTIAL (Issued: ${issuedDate})`,
      institutionName:
        institutionName.trim() || 'Panimalar Engineering College',
    };
  }, [
    passedCertificatesWithSection,
    selectedPreviewCertId,
    state.certificates,
    state.students,
    state.exams,
    state.subjects,
    institutionName,
  ]);

  useEffect(() => {
    let active = true;
    generateCertificateQrBase64(previewSample, 220).then((url) => {
      if (active) setPreviewQrDataUrl(url);
    });
    return () => {
      active = false;
    };
  }, [previewSample]);

  // Count of passed certificates per section (Section A - Section L)
  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sec of ALL_SECTIONS_A_TO_Z) {
      counts[sec] = 0;
    }
    for (const item of passedCertificatesWithSection) {
      counts[item.section] = (counts[item.section] || 0) + 1;
    }
    return counts;
  }, [passedCertificatesWithSection]);

  // Filtered passed certificates for the selected section
  const displayedSectionCertificates = useMemo(() => {
    if (selectedSectionFilter === 'ALL') {
      return passedCertificatesWithSection;
    }
    return passedCertificatesWithSection.filter(
      (item) => item.section === selectedSectionFilter
    );
  }, [passedCertificatesWithSection, selectedSectionFilter]);

  const handleGroupDownloadBySection = async (sectionLabel: string) => {
    const targetItems =
      sectionLabel === 'ALL'
        ? passedCertificatesWithSection
        : passedCertificatesWithSection.filter(
            (item) => item.section === sectionLabel
          );
    if (targetItems.length === 0) {
      setBannerMessage(
        `No passed student certificates found in ${
          sectionLabel === 'ALL' ? 'any section' : sectionLabel
        } for the selected examination filter.`
      );
      return;
    }
    setBatchProgress({
      sectionLabel,
      current: 1,
      total: targetItems.length,
    });
    const certsToDownload = targetItems.map((item) => ({
      ...item.cert,
      section: item.section,
    }));
    const downloadedCount = await downloadBatchCertificates(
      currentTemplateConfig,
      certsToDownload,
      (current, total) => {
        setBatchProgress({ sectionLabel, current, total });
      },
      sectionLabel === 'ALL' ? 'All_Sections' : sectionLabel
    );
    setBatchProgress(null);
    setBannerMessage(
      `Successfully downloaded all ${downloadedCount} passed student certificate${
        downloadedCount === 1 ? '' : 's'
      } for ${
        sectionLabel === 'ALL' ? 'All Sections (A–L)' : sectionLabel
      } in a single combined PDF file!`
    );
  };

  const handleSaveAndPublishTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    examStore.updateCertificateTemplate({
      institutionName: institutionName.trim() || tpl.institutionName,
      headerBadgeText: headerBadgeText.trim() || tpl.headerBadgeText,
      certificateTitle: certificateTitle.trim() || tpl.certificateTitle,
      presentationLine: presentationLine.trim() || tpl.presentationLine,
      bodyTextTemplate: bodyTextTemplate.trim() || tpl.bodyTextTemplate,
      signatoryLeftName: signatoryLeftName.trim() || tpl.signatoryLeftName,
      signatoryLeftTitle: signatoryLeftTitle.trim() || tpl.signatoryLeftTitle,
      signatoryCenterName:
        signatoryCenterName.trim() ||
        tpl.signatoryCenterName ||
        'Dr. S. Prasanna Devi',
      signatoryCenterTitle:
        signatoryCenterTitle.trim() ||
        tpl.signatoryCenterTitle ||
        'Chief Examination Controller',
      signatoryRightName: signatoryRightName.trim() || tpl.signatoryRightName,
      signatoryRightTitle:
        signatoryRightTitle.trim() || tpl.signatoryRightTitle,
      sealText: sealText.trim() || tpl.sealText,
      accentTheme,
    });

    // Ensure every student who passed an examination automatically has their certificate issued, updated, and attached to their result
    const latestState = examStore.getState();
    for (const att of latestState.attempts) {
      if (att.passed) {
        const cert = examStore.ensureCertificateIssued(att, true);
        if (defaultRemarks.trim()) {
          examStore.updateCertificateRecord(cert.id, {
            customRemarks: defaultRemarks.trim(),
            publishedToStudent: true,
          });
        }
      }
    }

    setBannerMessage(
      'Official Certificate Details & QR Verification Template saved & published! Every student who passes an examination automatically receives this certificate filled with their details and scannable QR code.'
    );
  };

  const handleResetDefaults = () => {
    setInstitutionName('Panimalar Engineering College');
    setHeaderBadgeText('OFFICIAL ACADEMIC CREDENTIAL');
    setCertificateTitle('Certificate of Examination Excellence');
    setPresentationLine('This is to officially certify that');
    setBodyTextTemplate(
      'has successfully passed the proctored assessment with verified distinction and demonstrated mastery of the curriculum.'
    );
    setSignatoryLeftName('Mrs. C. Annapoorani');
    setSignatoryLeftTitle('Faculty Mentor, Dept. of AI & DS');
    setSignatoryCenterName('Dr. S. Prasanna Devi');
    setSignatoryCenterTitle('Chief Examination Controller');
    setSignatoryRightName('Head of Department');
    setSignatoryRightTitle('Department of AI and Data Science');
    setSealText('VERIFIED MERIT SEAL');
    setAccentTheme('emerald');
    setDefaultRemarks(
      'Awarded for passing the proctored examination with verified distinction.'
    );
  };

  const previewPalette = {
    blue: {
      outerBorder: 'border-blue-400',
      innerBorder: 'border-blue-200',
      topWash: 'from-blue-50/90 via-white to-white',
      badge: 'bg-blue-50 text-blue-700 border-blue-300',
      primaryText: 'text-blue-700',
      nameText: 'text-blue-950 border-blue-700',
      sealBox: 'bg-blue-50 border-blue-700 text-blue-800',
      qrBorder: 'border-blue-700',
    },
    amber: {
      outerBorder: 'border-amber-400',
      innerBorder: 'border-amber-200',
      topWash: 'from-amber-50/90 via-white to-white',
      badge: 'bg-amber-50 text-amber-800 border-amber-300',
      primaryText: 'text-amber-700',
      nameText: 'text-amber-950 border-amber-700',
      sealBox: 'bg-amber-50 border-amber-700 text-amber-800',
      qrBorder: 'border-amber-700',
    },
    emerald: {
      outerBorder: 'border-emerald-400',
      innerBorder: 'border-emerald-200',
      topWash: 'from-emerald-50/90 via-white to-white',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-400',
      primaryText: 'text-emerald-700',
      nameText: 'text-emerald-950 border-emerald-700',
      sealBox: 'bg-emerald-50 border-emerald-700 text-emerald-800',
      qrBorder: 'border-emerald-700',
    },
    indigo: {
      outerBorder: 'border-indigo-400',
      innerBorder: 'border-indigo-200',
      topWash: 'from-indigo-50/90 via-white to-white',
      badge: 'bg-indigo-50 text-indigo-800 border-indigo-300',
      primaryText: 'text-indigo-700',
      nameText: 'text-indigo-950 border-indigo-700',
      sealBox: 'bg-indigo-50 border-indigo-700 text-indigo-800',
      qrBorder: 'border-indigo-700',
    },
  }[accentTheme || 'emerald'];

  return (
    <div className="space-y-6 max-w-[1480px] w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Award className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-extrabold text-white">
              Certificate Details &amp; Official QR Template Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Configure and preview the official Panimalar Engineering College
            certificate with embedded scannable student verification QR code.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowQrDetailsModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#131742] hover:bg-[#1B2158] border border-cyan-400/45 text-cyan-200 text-xs font-bold cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            Inspect QR Verification Data
          </button>
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] hover:from-[#8B5CF6] hover:to-[#6366F1] text-white text-xs font-bold shadow-[0_0_20px_rgba(124,58,237,0.45)] cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            Customize Certificate Modal
          </button>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#131742] hover:bg-[#1B2158] border border-purple-500/35 text-slate-200 text-xs font-bold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Default Template
          </button>
        </div>
      </div>

      {/* Automatic Pass Attachment Guarantee Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0B282A] via-[#0F1E3A] to-[#12153A] border border-emerald-500/45 flex items-center gap-3.5 text-xs shadow-lg">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="font-extrabold text-white text-xs sm:text-sm">
            Scannable Student Verification QR Code &amp; Automatic Result Attachment Enabled
          </div>
          <div className="text-[11px] sm:text-xs text-slate-200 mt-0.5 leading-relaxed">
            Every passed student&apos;s certificate includes the top-left{' '}
            <strong className="text-emerald-300 font-bold">
              Panimalar Engineering College Banner
            </strong>
            , 3-column official signatories, and a{' '}
            <strong className="text-cyan-300 font-bold">
              scannable QR code
            </strong>{' '}
            encoding Student Name, Registration ID, Section (A–L), Examination,
            Verified Score, Merit Grade, Issue Date, and Verification Status.
          </div>
        </div>
      </div>

      {bannerMessage && (
        <div className="p-3.5 rounded-2xl bg-purple-500/20 border border-purple-400/45 text-purple-100 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-xs font-bold text-cyan-300 hover:text-white underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Split Layout: Left Certificate Details Editor, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Edit & Modify Certificate Details */}
        <form
          onSubmit={handleSaveAndPublishTemplate}
          className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4"
        >
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-slate-900">
              Edit &amp; Modify Certificate Details
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize institutional titles, citation text, 3 signatories, and
              verification seal.
            </p>
          </div>

          <div>
            <label
              htmlFor="cert-inst-name"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Institution / University Name
            </label>
            <input
              id="cert-inst-name"
              type="text"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="cert-badge-text"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Top Header Badge
              </label>
              <input
                id="cert-badge-text"
                type="text"
                value={headerBadgeText}
                onChange={(e) => setHeaderBadgeText(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="cert-seal-text"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Verification Seal Label
              </label>
              <input
                id="cert-seal-text"
                type="text"
                value={sealText}
                onChange={(e) => setSealText(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="cert-main-title"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Certificate Heading Title
            </label>
            <input
              id="cert-main-title"
              type="text"
              value={certificateTitle}
              onChange={(e) => setCertificateTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="cert-pres-line"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Presentation Line
            </label>
            <input
              id="cert-pres-line"
              type="text"
              value={presentationLine}
              onChange={(e) => setPresentationLine(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label
              htmlFor="cert-body-text"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Achievement Citation Body Text
            </label>
            <textarea
              id="cert-body-text"
              rows={2}
              value={bodyTextTemplate}
              onChange={(e) => setBodyTextTemplate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label
              htmlFor="cert-remarks"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Official Merit Citation Note
            </label>
            <input
              id="cert-remarks"
              type="text"
              value={defaultRemarks}
              onChange={(e) => setDefaultRemarks(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Left Signatory
              </label>
              <input
                type="text"
                value={signatoryLeftName}
                onChange={(e) => setSignatoryLeftName(e.target.value)}
                placeholder="Left Name"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold mb-1.5"
              />
              <input
                type="text"
                value={signatoryLeftTitle}
                onChange={(e) => setSignatoryLeftTitle(e.target.value)}
                placeholder="Left Title"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Center Signatory
              </label>
              <input
                type="text"
                value={signatoryCenterName}
                onChange={(e) => setSignatoryCenterName(e.target.value)}
                placeholder="Center Name"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold mb-1.5"
              />
              <input
                type="text"
                value={signatoryCenterTitle}
                onChange={(e) => setSignatoryCenterTitle(e.target.value)}
                placeholder="Center Title"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Right Signatory
              </label>
              <input
                type="text"
                value={signatoryRightName}
                onChange={(e) => setSignatoryRightName(e.target.value)}
                placeholder="Right Name"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold mb-1.5"
              />
              <input
                type="text"
                value={signatoryRightTitle}
                onChange={(e) => setSignatoryRightTitle(e.target.value)}
                placeholder="Right Title"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Certificate Color Theme
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['emerald', 'blue', 'amber', 'indigo'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAccentTheme(t)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
                    accentTheme === t
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white border-purple-400 shadow-[0_0_15px_rgba(124,58,237,0.45)]'
                      : 'bg-[#141946] text-slate-200 border-purple-500/35 hover:bg-[#1C225C] hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-purple-500/20">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] hover:from-[#8B5CF6] hover:to-[#6366F1] text-white text-xs font-bold shadow-[0_0_20px_rgba(124,58,237,0.45)] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save &amp; Publish Certificate Details
            </button>
          </div>
        </form>

        {/* Right Column: Live Certificate Preview (Exact Match to Client Reference Layout) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0E1132] rounded-2xl border border-purple-500/30 p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-xs font-extrabold text-white">
                  Live Official Certificate Preview (With Dynamic Student QR Code)
                </div>
                <div className="text-[11px] text-slate-300">
                  Top-left Panimalar banner, 3 signatories, bottom Merit Seal,
                  and scannable verification QR code.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {passedCertificatesWithSection.length > 0 && (
                <select
                  aria-label="Select passed student for certificate preview"
                  value={
                    selectedPreviewCertId ||
                    passedCertificatesWithSection[0]?.cert.id ||
                    ''
                  }
                  onChange={(e) => setSelectedPreviewCertId(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#141946] border border-purple-500/40 text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {passedCertificatesWithSection.map(({ cert, section }) => (
                    <option
                      key={cert.id}
                      value={cert.id}
                      className="bg-[#0E1132] text-white"
                    >
                      {cert.studentName} ({cert.studentRegId} • {section})
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => {
                  downloadAndPrintCertificate(currentTemplateConfig, {
                    ...previewSample,
                    remarks: defaultRemarks,
                  });
                  setBannerMessage(
                    'Certificate downloaded as high-resolution PNG with scannable QR code!'
                  );
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] hover:from-[#8B5CF6] hover:to-[#6366F1] text-white text-xs font-bold shadow-[0_0_20px_rgba(124,58,237,0.45)] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Certificate PNG
              </button>
            </div>
          </div>

          {/* Official White & Emerald Certificate Sheet (Exact Match to Uploaded Layout) */}
          <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-2xl border border-slate-200">
            <div
              className={`border-[4px] ${previewPalette.outerBorder} rounded-xl p-2 sm:p-3 bg-gradient-to-b ${previewPalette.topWash} relative overflow-hidden`}
            >
              <div
                className={`border-[2px] ${previewPalette.innerBorder} rounded-lg p-5 sm:p-7 relative overflow-hidden`}
              >
                {/* Large Centered Institutional Crest Watermark in Background */}
                <img
                  src="/assets/panimalar-crest.png"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-80 h-auto object-contain opacity-[0.15] z-0"
                />

                <div className="relative z-10 space-y-5">
                  {/* Top Row: Top-Left Full Panimalar Banner + Top-Center Official Pill Badge (NO small center logo) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 items-start gap-3">
                    {/* Top-Left Full Panimalar Engineering College Banner */}
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

                    {/* Top-Center Pill Badge (No small logo below it) */}
                    <div className="sm:col-span-7 flex sm:justify-start justify-center sm:pl-4 pt-1">
                      <span
                        className={`px-4 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${previewPalette.badge}`}
                      >
                        {headerBadgeText}
                      </span>
                    </div>
                  </div>

                  {/* Main Heading Block (No small center logo) */}
                  <div className="text-center space-y-1.5 pt-1">
                    <div
                      className={`text-xs sm:text-sm font-extrabold tracking-wider uppercase ${previewPalette.primaryText}`}
                    >
                      {institutionName}
                    </div>
                    <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {certificateTitle}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 pt-1">
                      {presentationLine}
                    </p>
                  </div>

                  {/* Student Name with Underline */}
                  <div className="text-center">
                    <div
                      className={`inline-block px-8 pb-1.5 text-2xl sm:text-3xl font-extrabold border-b-[3px] ${previewPalette.nameText}`}
                    >
                      {previewSample.studentName}
                    </div>
                  </div>

                  {/* Registration ID, Examination, Citation, and Score */}
                  <div className="text-center space-y-2 max-w-2xl mx-auto">
                    <div className="text-xs sm:text-sm font-medium text-slate-700">
                      Registration ID: {previewSample.studentRegId} &nbsp;•&nbsp;
                      Examination: {previewSample.examTitle}
                    </div>
                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                      {bodyTextTemplate}
                    </p>
                    <div
                      className={`text-xs sm:text-sm font-mono font-extrabold pt-1 ${previewPalette.primaryText}`}
                    >
                      Verified Score: {previewSample.scoreText} &nbsp; | &nbsp;
                      Merit Grade: {previewSample.grade}
                    </div>
                    {defaultRemarks && (
                      <div className="text-[11px] sm:text-xs italic text-slate-500 pt-0.5">
                        &ldquo;{defaultRemarks}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* 3-Column Signatories Row */}
                  <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-xs">
                    <div className="text-center sm:text-left">
                      <div className="font-extrabold text-slate-900">
                        {signatoryLeftName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {signatoryLeftTitle}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="font-extrabold text-slate-900">
                        {signatoryCenterName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {signatoryCenterTitle}
                      </div>
                    </div>

                    <div className="text-center sm:text-right">
                      <div className="font-extrabold text-slate-900">
                        {signatoryRightName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {signatoryRightTitle}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: [ ✓ VERIFIED MERIT SEAL ] + [ Dynamic Scannable QR Code ] + [ Issued Date • Verified Official Credential ] */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                      {/* Bottom-Left Verified Merit Seal */}
                      <div
                        className={`px-6 py-3.5 rounded-xl border-2 ${previewPalette.sealBox} font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-2xs`}
                      >
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>✓ {sealText}</span>
                      </div>

                      {/* Dynamic Scannable QR Code right next to Verified Merit Seal */}
                      {previewQrDataUrl && (
                        <button
                          type="button"
                          onClick={() => setShowQrDetailsModal(true)}
                          title="Click to inspect encoded student QR verification data"
                          className={`p-1.5 rounded-xl bg-white border-2 ${previewPalette.qrBorder} shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0`}
                        >
                          <img
                            src={previewQrDataUrl}
                            alt={`Scannable QR Code for ${previewSample.studentName}`}
                            className="w-16 h-16 object-contain rounded"
                          />
                        </button>
                      )}
                    </div>

                    {/* Bottom-Right Issued Metadata */}
                    <div className="text-[11px] font-mono text-slate-600 text-center sm:text-right">
                      Issued: {previewSample.issuedAt} &nbsp;•&nbsp; Verified
                      Official Credential
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section-Wise (Section A – Section L) Group Certificate Download & Passed Students Registry */}
      <div className="bg-[#0E1132] rounded-3xl border border-purple-500/35 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-purple-500/25">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-cyan-400">
              <FolderDown className="w-4 h-4" />
              <span>Section-Wise Group Certificate Download (Section A – Section L)</span>
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Passed Student Certificates by Section (All-in-One PDF Format)
            </h2>
            <p className="text-xs text-slate-300">
              Only students who <strong className="text-emerald-300">PASSED</strong> their examination receive a merit certificate. Select any section (<strong className="text-white">Section A</strong> to <strong className="text-white">Section L</strong>) to download all passed student certificates for that section combined into <strong className="text-cyan-300">one single multi-page PDF file</strong>.
            </p>
          </div>

          {/* Examination Filter + Active Section Group Download Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#141946] border border-purple-500/35 rounded-xl px-3 py-2">
              <Filter className="w-3.5 h-3.5 text-purple-300 shrink-0" />
              <label
                htmlFor="cert-exam-filter"
                className="text-[11px] font-bold text-slate-300 whitespace-nowrap"
              >
                Examination:
              </label>
              <select
                id="cert-exam-filter"
                value={selectedExamFilter}
                onChange={(e) => setSelectedExamFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#0E1132] text-white">
                  All Examinations ({passedCertificatesWithSection.length} Passed)
                </option>
                {state.exams.map((ex) => (
                  <option
                    key={ex.id}
                    value={ex.id}
                    className="bg-[#0E1132] text-white"
                  >
                    {ex.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={
                Boolean(batchProgress) ||
                displayedSectionCertificates.length === 0
              }
              onClick={() => handleGroupDownloadBySection(selectedSectionFilter)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-extrabold shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
            >
              <FolderDown className="w-4 h-4" />
              {batchProgress &&
              batchProgress.sectionLabel === selectedSectionFilter
                ? `Building PDF (${batchProgress.current}/${batchProgress.total})...`
                : selectedSectionFilter === 'ALL'
                ? `Download All Sections in 1 PDF (${displayedSectionCertificates.length} Passed)`
                : `Download ${selectedSectionFilter} in 1 PDF (${displayedSectionCertificates.length} Passed)`}
            </button>
          </div>
        </div>

        {/* Active Sections Quick One-Click Group Download Cards */}
        {ALL_SECTIONS_A_TO_Z.some((sec) => (sectionCounts[sec] || 0) > 0) && (
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-purple-200 flex items-center justify-between">
              <span>Quick Section-Wise Separate Group Downloads (Sections with Passed Students):</span>
              <span className="text-[11px] text-slate-400">
                Click any section card below to download all passed certificates for that section separately
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {ALL_SECTIONS_A_TO_Z.filter(
                (sec) => (sectionCounts[sec] || 0) > 0
              ).map((sec) => {
                const count = sectionCounts[sec] || 0;
                const isSelected = selectedSectionFilter === sec;
                const isDownloadingThis =
                  batchProgress?.sectionLabel === sec;
                return (
                  <div
                    key={sec}
                    onClick={() => setSelectedSectionFilter(sec)}
                    className={`rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#1A215A] border-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.25)]'
                        : 'bg-[#131842] border-purple-500/30 hover:border-purple-400/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-white">
                        {sec}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-mono font-bold">
                        {count} Passed
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={Boolean(batchProgress)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSectionFilter(sec);
                        handleGroupDownloadBySection(sec);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] hover:from-[#8B5CF6] hover:to-[#6366F1] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {isDownloadingThis
                        ? `Building PDF (${batchProgress?.current}/${batchProgress?.total})...`
                        : `Download ${sec} PDF (${count})`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Complete Section A to Section L Selector Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              Filter Passed Students by Section (A – L):
            </span>
            <button
              type="button"
              onClick={() => setSelectedSectionFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                selectedSectionFilter === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-[#141946] text-slate-300 border-purple-500/35 hover:text-white'
              }`}
            >
              Show All Sections ({passedCertificatesWithSection.length} Passed)
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
            {ALL_SECTIONS_A_TO_Z.map((sec) => {
              const shortLabel = sec.replace('Section ', 'Sec ');
              const count = sectionCounts[sec] || 0;
              const active = selectedSectionFilter === sec;
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSelectedSectionFilter(sec)}
                  className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    active
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white border-cyan-300 shadow-[0_0_14px_rgba(124,58,237,0.5)]'
                      : count > 0
                      ? 'bg-[#161C4F] text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
                      : 'bg-[#11153A] text-slate-400 border-purple-500/20 hover:bg-[#161B4A] hover:text-slate-200'
                  }`}
                >
                  <span className="text-[11px] font-extrabold">{shortLabel}</span>
                  <span
                    className={`text-[10px] font-mono ${
                      active
                        ? 'text-cyan-200 font-bold'
                        : count > 0
                        ? 'text-emerald-400 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {count} pass
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Passed Students Certificate Table for Selected Section */}
        <div className="bg-[#0B0E29] rounded-2xl border border-purple-500/30 overflow-hidden">
          <div className="px-5 py-3.5 bg-[#121742] border-b border-purple-500/25 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-extrabold text-white">
                {selectedSectionFilter === 'ALL'
                  ? 'All Sections (A – L) — Passed Student Certificates'
                  : `${selectedSectionFilter} — Passed Student Certificates`}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-mono font-bold">
                {displayedSectionCertificates.length} Eligible
              </span>
            </div>

            {displayedSectionCertificates.length > 0 && (
              <button
                type="button"
                disabled={Boolean(batchProgress)}
                onClick={() =>
                  handleGroupDownloadBySection(selectedSectionFilter)
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {selectedSectionFilter === 'ALL'
                  ? `Download All (${displayedSectionCertificates.length}) in 1 PDF`
                  : `Download All ${selectedSectionFilter} (${displayedSectionCertificates.length}) in 1 PDF`}
              </button>
            )}
          </div>

          {displayedSectionCertificates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-purple-500/20 text-[11px] font-bold text-slate-300 uppercase bg-[#0E1235]">
                    <th className="py-3.5 px-4">Certificate No.</th>
                    <th className="py-3.5 px-4">Passed Student</th>
                    <th className="py-3.5 px-4">Reg ID</th>
                    <th className="py-3.5 px-4">Section</th>
                    <th className="py-3.5 px-4">Examination</th>
                    <th className="py-3.5 px-4">Verified Score</th>
                    <th className="py-3.5 px-4">Merit Grade</th>
                    <th className="py-3.5 px-4 text-right">Certificate Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/15">
                  {displayedSectionCertificates.map(({ cert, section }) => (
                    <tr
                      key={cert.id}
                      className="hover:bg-purple-500/10 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                        {cert.certificateNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {cert.studentName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {cert.studentRegId}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-purple-500/20 border border-purple-400/40 text-purple-200 font-bold text-[11px]">
                          {section}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200 font-semibold">
                        {cert.examTitle}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-300">
                        {cert.score} / {cert.maxScore} ({cert.percentage}%)
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-[11px]">
                          {cert.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            downloadCertificateRecord(
                              currentTemplateConfig,
                              cert,
                              section
                            );
                            setBannerMessage(
                              `Downloaded certificate with scannable QR code for ${cert.studentName} (${section})!`
                            );
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] hover:from-[#8B5CF6] hover:to-[#6366F1] text-white text-xs font-bold cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Certificate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center space-y-2">
              <div className="text-sm font-bold text-slate-200">
                No Passed Student Certificates in{' '}
                {selectedSectionFilter === 'ALL'
                  ? 'Any Section'
                  : selectedSectionFilter}
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Only students who pass their examination automatically receive a
                certificate. Switch to a highlighted section above or select
                &ldquo;Show All Sections&rdquo; to view passed students in other
                sections.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Verification Payload Modal */}
      {showQrDetailsModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Scannable QR Code Verification Payload
                  </h2>
                  <p className="text-xs text-slate-500">
                    Scan with any smartphone camera to verify student &amp;
                    credential usage details
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close QR modal"
                onClick={() => setShowQrDetailsModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
              {previewQrDataUrl && (
                <img
                  src={previewQrDataUrl}
                  alt="Scannable QR Code"
                  className="w-36 h-36 rounded-xl border-2 border-emerald-600 bg-white p-1.5 shrink-0 shadow-xs"
                />
              )}
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" /> Verified Official QR
                </div>
                <div className="font-bold text-slate-900">
                  Student: {previewSample.studentName} ({previewSample.studentRegId})
                </div>
                <div>Section: {previewSample.section}</div>
                <div>Exam: {previewSample.examTitle}</div>
                <div className="font-mono font-bold text-emerald-700">
                  Score: {previewSample.scoreText} • {previewSample.grade}
                </div>
                <div className="text-[11px] text-slate-500">
                  Issued &amp; Verified: {previewSample.issuedAt}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-700 mb-1.5">
                Exact Text Shown When QR Code is Scanned:
              </div>
              <pre className="bg-slate-900 text-emerald-300 font-mono text-[11px] p-4 rounded-2xl overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {buildCertificateQrText(previewSample)}
              </pre>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowQrDetailsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered Floating Certificate Customization Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Customize Official Certificate Details
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Modify institution name, citation text, 3 signatories, and
                  color theme.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                handleSaveAndPublishTemplate(e);
                setShowEditModal(false);
              }}
              className="mt-5 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Institution / University Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Certificate Heading Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={certificateTitle}
                    onChange={(e) => setCertificateTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Top Header Badge
                  </label>
                  <input
                    type="text"
                    value={headerBadgeText}
                    onChange={(e) => setHeaderBadgeText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Verification Seal Label
                  </label>
                  <input
                    type="text"
                    value={sealText}
                    onChange={(e) => setSealText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Achievement Citation Body Text
                </label>
                <textarea
                  rows={2}
                  value={bodyTextTemplate}
                  onChange={(e) => setBodyTextTemplate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Left Signatory
                  </label>
                  <input
                    type="text"
                    value={signatoryLeftName}
                    onChange={(e) => setSignatoryLeftName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold mb-1.5"
                  />
                  <input
                    type="text"
                    value={signatoryLeftTitle}
                    onChange={(e) => setSignatoryLeftTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Center Signatory
                  </label>
                  <input
                    type="text"
                    value={signatoryCenterName}
                    onChange={(e) => setSignatoryCenterName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold mb-1.5"
                  />
                  <input
                    type="text"
                    value={signatoryCenterTitle}
                    onChange={(e) => setSignatoryCenterTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Right Signatory
                  </label>
                  <input
                    type="text"
                    value={signatoryRightName}
                    onChange={(e) => setSignatoryRightName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold mb-1.5"
                  />
                  <input
                    type="text"
                    value={signatoryRightTitle}
                    onChange={(e) => setSignatoryRightTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Save &amp; Publish Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
