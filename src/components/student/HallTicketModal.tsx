import React from 'react';
import {
  GraduationCap,
  X,
  Printer,
  Download,
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  User,
} from 'lucide-react';
import {
  Exam,
  UserProfile,
  PlatformSettings,
  AccentColorTheme,
} from '../../services/examStore.ts';

interface HallTicketModalProps {
  exam: Exam;
  student: UserProfile;
  settings: PlatformSettings;
  onClose: () => void;
}

const ACCENT_PALETTE: Record<
  AccentColorTheme,
  {
    primary: string;
    dark: string;
    lightBg: string;
    border: string;
    badgeCls: string;
    headerGrad: string;
    btnCls: string;
  }
> = {
  blue: {
    primary: '#1D4ED8',
    dark: '#0A1D56',
    lightBg: '#EFF6FF',
    border: '#93C5FD',
    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200',
    headerGrad: 'from-blue-600 to-indigo-800',
    btnCls: 'bg-blue-600 hover:bg-blue-700',
  },
  indigo: {
    primary: '#4338CA',
    dark: '#1E1B4B',
    lightBg: '#EEF2FF',
    border: '#A5B4FC',
    badgeCls: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    headerGrad: 'from-indigo-600 to-purple-800',
    btnCls: 'bg-indigo-600 hover:bg-indigo-700',
  },
  emerald: {
    primary: '#047857',
    dark: '#064E3B',
    lightBg: '#ECFDF5',
    border: '#6EE7B7',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    headerGrad: 'from-emerald-600 to-teal-800',
    btnCls: 'bg-emerald-600 hover:bg-emerald-700',
  },
  purple: {
    primary: '#7E22CE',
    dark: '#3B0764',
    lightBg: '#FAF5FF',
    border: '#D8B4FE',
    badgeCls: 'bg-purple-50 text-purple-700 border-purple-200',
    headerGrad: 'from-purple-600 to-fuchsia-800',
    btnCls: 'bg-purple-600 hover:bg-purple-700',
  },
  rose: {
    primary: '#BE123C',
    dark: '#4C0519',
    lightBg: '#FFF1F2',
    border: '#FDA4AF',
    badgeCls: 'bg-rose-50 text-rose-700 border-rose-200',
    headerGrad: 'from-rose-600 to-red-800',
    btnCls: 'bg-rose-600 hover:bg-rose-700',
  },
  amber: {
    primary: '#B45309',
    dark: '#451A03',
    lightBg: '#FFFBEB',
    border: '#FCD34D',
    badgeCls: 'bg-amber-50 text-amber-800 border-amber-200',
    headerGrad: 'from-amber-500 to-orange-700',
    btnCls: 'bg-amber-600 hover:bg-amber-700',
  },
};

export const HallTicketModal: React.FC<HallTicketModalProps> = ({
  exam,
  student,
  settings,
  onClose,
}) => {
  const accent: AccentColorTheme = settings.accentColor || 'blue';
  const theme = ACCENT_PALETTE[accent] || ACCENT_PALETTE.blue;
  const hallTicketNo = `HT-2026-${(exam.subjectName || 'EXM')
    .slice(0, 3)
    .toUpperCase()}-${(student.studentId || '001').slice(-3)}`;

  const handleDownloadAndPrintHallTicket = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1400;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 6;
        ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

        // Header bar
        ctx.fillStyle = theme.primary;
        ctx.fillRect(35, 35, canvas.width - 70, 140);

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.font = 'bold 18px Inter, system-ui, sans-serif';
        ctx.fillText(
          'OFFICIAL EXAMINATION ADMIT CARD / HALL TICKET',
          canvas.width / 2,
          82
        );
        ctx.font = 'bold 32px Inter, system-ui, sans-serif';
        ctx.fillText(
          (settings.institutionName || 'ExamFlow University').toUpperCase(),
          canvas.width / 2,
          126
        );
        ctx.font = '16px Inter, system-ui, sans-serif';
        ctx.fillText(
          settings.academicSession || '2026 - 2027 Academic Session',
          canvas.width / 2,
          156
        );

        // Candidate Details Section
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 22px Inter, system-ui, sans-serif';
        ctx.fillText('Candidate Details', 80, 230);

        ctx.font = '19px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#334155';
        ctx.fillText(`Candidate Name: ${student.name}`, 80, 272);
        ctx.fillText(
          `Registration ID: ${student.studentId || 'STU-2026-001'}`,
          80,
          310
        );
        ctx.fillText(
          `Department: ${student.department || 'Computer Science & Engineering'}`,
          80,
          348
        );
        ctx.fillText(
          `Academic Year & Section: ${student.year || 'Year 3'}  •  Section ${
            student.section || 'A'
          }`,
          80,
          386
        );

        ctx.textAlign = 'right';
        ctx.font = 'bold 20px JetBrains Mono, monospace';
        ctx.fillStyle = theme.primary;
        ctx.fillText(`Hall Ticket No: ${hallTicketNo}`, canvas.width - 80, 272);
        ctx.fillStyle = '#047857';
        ctx.fillText('Status: CLEARED FOR EXAM', canvas.width - 80, 310);

        // Exam Table Box
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2;
        ctx.strokeRect(80, 430, canvas.width - 160, 210);

        ctx.fillStyle = theme.lightBg;
        ctx.fillRect(82, 432, canvas.width - 164, 52);

        ctx.textAlign = 'left';
        ctx.fillStyle = theme.dark;
        ctx.font = 'bold 20px Inter, system-ui, sans-serif';
        ctx.fillText('Scheduled Examination Specification', 105, 465);

        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 24px Inter, system-ui, sans-serif';
        ctx.fillText(exam.title, 105, 528);

        ctx.font = '19px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#334155';
        ctx.fillText(
          `Subject: ${exam.subjectName}   |   Date: ${exam.scheduledDate}   |   Start Time: ${exam.startTime}`,
          105,
          570
        );
        ctx.fillText(
          `Duration: ${exam.durationMinutes} Minutes   |   Total Marks: ${exam.totalMarks}   |   Passing Marks: ${exam.passingMarks}`,
          105,
          610
        );

        // Instructions
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 20px Inter, system-ui, sans-serif';
        ctx.fillText('Mandatory Proctoring & Examination Rules:', 80, 695);

        ctx.font = '17px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(
          '1. Fullscreen lock is enforced throughout the assessment. Exiting fullscreen or switching tabs logs a violation.',
          80,
          732
        );
        ctx.fillText(
          '2. Escape keys, Function keys (F1-F12), and Copy/Paste shortcuts are strictly blocked during the live test.',
          80,
          764
        );
        ctx.fillText(
          '3. Reaching 3 proctoring violations automatically terminates and submits the examination attempt.',
          80,
          796
        );

        // Signatures
        ctx.strokeStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.moveTo(80, 855);
        ctx.lineTo(canvas.width - 80, 855);
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 20px Inter, system-ui, sans-serif';
        ctx.fillText(settings.adminName || 'Dr. Sarah Jenkins', 80, 905);
        ctx.fillStyle = '#64748B';
        ctx.font = '16px Inter, system-ui, sans-serif';
        ctx.fillText('Chief Examination Controller', 80, 932);

        ctx.textAlign = 'right';
        ctx.fillStyle = theme.primary;
        ctx.font = 'bold 18px JetBrains Mono, monospace';
        ctx.fillText('VERIFIED OFFICIAL HALL TICKET', canvas.width - 80, 915);

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `HallTicket_${hallTicketNo}_${student.name.replace(
          /[^a-zA-Z0-9]/g,
          '_'
        )}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      // ignore canvas errors
    }

    try {
      window.print();
    } catch {
      // ignore sandbox print restrictions
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase border ${theme.badgeCls}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Official Examination Hall Ticket
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1.5">
              Candidate Examination Admit Card
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Hall Ticket Card */}
        <div className="rounded-2xl border-2 border-slate-200 overflow-hidden bg-white shadow-xs">
          {/* Branded College Banner */}
          <div
            className={`bg-gradient-to-r ${theme.headerGrad} text-white p-5 flex items-center justify-between gap-4`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                <img
                  src={settings.collegeLogoUrl || '/assets/panimalar-crest.png'}
                  alt="College Logo"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith('/assets/panimalar-crest.png')) {
                      target.src = '/assets/panimalar-crest.png';
                    }
                  }}
                  className="w-full h-full object-contain p-1 bg-white rounded-xl"
                />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-white/80">
                  {settings.academicSession || '2025 - 2026 Academic Year'}
                </div>
                <div className="text-lg font-extrabold tracking-tight">
                  {settings.institutionName &&
                  settings.institutionName !==
                    'Stanford Institute of Technology & Computing'
                    ? settings.institutionName
                    : 'Panimalar Engineering College'}
                </div>
                <div className="text-xs text-white/90 font-semibold">
                  Department of AI and Data Science · Proctored Examination Hall Ticket
                </div>
              </div>
            </div>

            <div className="text-right font-mono shrink-0">
              <div className="text-[10px] uppercase text-white/75">
                Hall Ticket No.
              </div>
              <div className="text-xs font-extrabold bg-white/15 px-3 py-1 rounded-lg border border-white/20 mt-0.5">
                {hallTicketNo}
              </div>
            </div>
          </div>

          {/* Candidate & Exam Details Body */}
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <div className="text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3" /> Candidate Name
                </div>
                <div className="font-extrabold text-slate-900 mt-0.5">
                  {student.name}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Registration ID</div>
                <div className="font-mono font-extrabold text-blue-600 mt-0.5">
                  {student.studentId || 'STU-2026-001'}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Year &amp; Section</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {student.year || 'Year 3'} · Section {student.section || 'A'}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Eligibility</div>
                <div className="inline-flex items-center gap-1 font-extrabold text-emerald-700 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </div>
              </div>
            </div>

            {/* Examination Schedule Specification */}
            <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase text-blue-600">
                    {exam.subjectName} · Assigned Cohorts: {exam.assignedCohorts.join(', ')}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {exam.title}
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
                  {exam.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <div className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Exam Date
                  </div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {exam.scheduledDate}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Start Time
                  </div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {exam.startTime}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Duration</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {exam.durationMinutes} Mins
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Marks (Pass)</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {exam.totalMarks} ({exam.passingMarks})
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Signatures */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <div className="font-extrabold text-slate-900">
                  {settings.adminName || 'Dr. Sarah Jenkins'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Chief Examination Controller
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[11px] font-bold text-emerald-700">
                  ✓ DIGITALLY VERIFIED ADMIT CARD
                </div>
                <div className="text-[11px] text-slate-400">
                  {settings.institutionName}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleDownloadAndPrintHallTicket}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-colors cursor-pointer ${theme.btnCls}`}
          >
            <Printer className="w-4 h-4" />
            <Download className="w-3.5 h-3.5" />
            Print &amp; Download Hall Ticket
          </button>
        </div>
      </div>
    </div>
  );
};
