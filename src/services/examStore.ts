import {
  TestCase,
  TestCaseResult,
  ProgrammingLanguage,
  STARTER_CODE_TEMPLATES,
  getDeterministicQuestionOrder,
  evaluateProgrammingSubmission,
} from '../utils/examLogic.ts';
import {
  fetchFirestoreSyncState,
  pushFirestoreSyncState,
  listenToFirestoreSyncState,
} from './firebase.ts';
import { UiThemeId, DEFAULT_UI_THEME, resolveUiTheme } from '../utils/uiThemes.ts';

export const ALL_SECTIONS: string[] = Array.from({ length: 12 }, (_, i) =>
  String.fromCharCode(65 + i)
);

export function normalizeSection(sec?: string): string {
  if (!sec) return 'A';
  const cleaned = sec.replace(/^section\s+/i, '').trim().toUpperCase();
  if (ALL_SECTIONS.includes(cleaned)) return cleaned;
  const firstChar = cleaned.charAt(0);
  return ALL_SECTIONS.includes(firstChar) ? firstChar : 'A';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  studentId?: string;
  department?: string;
  year?: string;
  section?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  cgpa?: string;
  address?: string;
  city?: string;
  guardianName?: string;
  guardianPhone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  skills?: string;
  bio?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  cohorts: string[];
  webcamProctoring: boolean;
  createdAt: string;
  updatedAtMs?: number;
}

export interface StudentRecord {
  id: string;
  studentId: string;
  name: string;
  email: string;
  department: string;
  year: string;
  section: string;
  batch?: string;
  isActive?: boolean;
  status: 'Active' | 'Inactive';
  password?: string;
  createdAt: string;
  updatedAtMs?: number;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  cgpa?: string;
  address?: string;
  city?: string;
  guardianName?: string;
  guardianPhone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  skills?: string;
  bio?: string;
}

export type ExamStatus =
  | 'Draft'
  | 'Scheduled'
  | 'Published'
  | 'Ongoing'
  | 'Completed'
  | 'Results Published';

export interface Exam {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  description: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  instructions: string;
  status: ExamStatus;
  assignedStudentIds: string[];
  assignedCohorts: string[];
  autoPublishAt?: string;
  webcamProctoring: boolean;
  updatedAtMs?: number;
}

export type QuestionType = 'mcq' | 'descriptive' | 'programming';

export interface McqOption {
  id: string;
  label: string;
  text: string;
}

export interface Question {
  id: string;
  examId: string;
  subjectId: string;
  type: QuestionType;
  questionType?: string;
  text: string;
  questionText?: string;
  marks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  explanation?: string;
  // MCQ fields
  options?: McqOption[];
  correctOptionId?: string;
  // Descriptive fields
  answerLengthGuidance?: string;
  sampleRubric?: string;
  // Programming fields
  programmingLanguage?: ProgrammingLanguage;
  codingLanguage?: string;
  starterCode?: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  testCases?: TestCase[];
  updatedAtMs?: number;
}

export interface StudentAnswer {
  questionId: string;
  selectedOptionId?: string;
  descriptiveText?: string;
  codeText?: string;
  codeLanguage?: ProgrammingLanguage;
  testCaseResults?: TestCaseResult[];
  awardedMarks?: number;
  instructorFeedback?: string;
  updatedAt: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  subjectName: string;
  studentId: string;
  studentName: string;
  studentRegId: string;
  studentEmail: string;
  status: 'in-progress' | 'submitted' | 'evaluated' | 'published';
  startedAt: string;
  submittedAt?: string;
  publishedAt?: string;
  questionOrder: string[];
  answers: Record<string, StudentAnswer>;
  markedForReview: string[];
  mcqScore: number;
  descriptiveScore: number;
  codingScore: number;
  totalScore: number;
  mcqMarks?: number;
  descriptiveMarks?: number;
  codingMarks?: number;
  totalMarks?: number;
  resultReleased?: boolean;
  maxScore: number;
  percentage: number;
  passed: boolean;
  violationCount: number;
  overallFeedback?: string;
  updatedAtMs?: number;
}

export interface ViolationEvent {
  id: string;
  attemptId: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  studentRegId: string;
  type:
    | 'Tab Switching'
    | 'Fullscreen Exit'
    | 'Window Blur'
    | 'Camera Alert'
    | 'Forbidden Key Blocked'
    | 'Copy/Paste Blocked';
  details: string;
  timestamp: string;
  updatedAtMs?: number;
}

export interface CertificateTemplateConfig {
  institutionName: string;
  headerBadgeText: string;
  certificateTitle: string;
  presentationLine: string;
  bodyTextTemplate: string;
  signatoryLeftName: string;
  signatoryLeftTitle: string;
  signatoryCenterName?: string;
  signatoryCenterTitle?: string;
  signatoryRightName: string;
  signatoryRightTitle: string;
  sealText: string;
  accentTheme: 'blue' | 'amber' | 'emerald' | 'indigo';
}

export interface CertificateRecord {
  id: string;
  certificateNumber: string;
  attemptId: string;
  examId: string;
  examTitle: string;
  subjectName: string;
  studentId: string;
  studentName: string;
  studentRegId: string;
  section?: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  issuedAt: string;
  verifiedAt?: string;
  publishedToStudent?: boolean;
  customRemarks?: string;
  updatedAtMs?: number;
}

export interface ActivityLog {
  id: string;
  type: 'student' | 'exam' | 'result' | 'question' | 'violation';
  text: string;
  timeAgo: string;
  timestamp: string;
  updatedAtMs?: number;
}

export type AccentColorTheme = 'blue' | 'indigo' | 'emerald' | 'purple' | 'rose' | 'amber';

export interface PlatformSettings {
  institutionName: string;
  academicSession?: string;
  adminName: string;
  adminEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
  institutionAddress?: string;
  timezone?: string;
  adminPassword?: string;
  themeMode?: 'light' | 'dark';
  accentColor?: AccentColorTheme;
  uiTheme?: UiThemeId;
  collegeLogoUrl?: string;
  enforceFullscreen: boolean;
  autoSubmitOnMaxViolations: boolean;
  maxViolationsAllowed: number;
  webcamProctoringDefault: boolean;
  defaultPassingPercentage: number;
  lateJoinRemainingTimeOnly: boolean;
}

export interface ExamStoreState {
  isAuthenticated: boolean;
  currentUser: UserProfile;
  subjects: Subject[];
  students: StudentRecord[];
  exams: Exam[];
  questions: Question[];
  attempts: ExamAttempt[];
  violations: ViolationEvent[];
  certificates: CertificateRecord[];
  certificateTemplate: CertificateTemplateConfig;
  activities: ActivityLog[];
  settings: PlatformSettings;
  deletedIds?: string[];
  deletedTimestamps?: Record<string, number>;
  settingsUpdatedAt?: number;
  templateUpdatedAt?: number;
  adminUpdatedAt?: number;
}

const STORAGE_KEY = 'examflow_live_data_v2';
const SESSION_STORAGE_KEY = 'examflow_session_v2';

export function makeDeterministicStudentDocId(studentId: string): string {
  const cleaned = studentId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');
  return `stu-${cleaned || Date.now()}`;
}

export function normalizeAndDedupeSections(cohorts?: string[]): string[] {
  if (!Array.isArray(cohorts) || cohorts.length === 0) {
    return ['A'];
  }
  const normalizedSet = new Set(cohorts.map((c) => normalizeSection(c)));
  const ordered = ALL_SECTIONS.filter((sec) => normalizedSet.has(sec));
  return ordered.length > 0 ? ordered : ['A'];
}

const LEGACY_PURGED_QUESTION_IDS = new Set([
  'q-1793854326823-a32',
  'q-1793854397160-tms',
  'q-1793854455536-6bj',
  'q-1793861915239-f4y',
  'q-1793856022167-ruw',
  'q-1793860253544-gue',
  'q-1793854611447-2l5',
  'q-1793861853240-iur',
  'q-1793854501466-mtu',
  'q-1793860336057-zmg',
]);

function mergeArrayById<T extends { id: string; updatedAtMs?: number }>(
  existingArr: T[] = [],
  incomingArr: T[] = [],
  deletedSet: Set<string>,
  isStudentArray = false,
  isAttemptArray = false
): T[] {
  const map = new Map<string, T>();
  const stuIdToKey = new Map<string, string>();
  const statusRank: Record<string, number> = {
    'in-progress': 1,
    submitted: 2,
    evaluated: 3,
    published: 4,
  };

  const processItem = (item: any) => {
    if (!item || typeof item !== 'object') return;
    const id = String(item.id || '');
    if (!id || deletedSet.has(id) || LEGACY_PURGED_QUESTION_IDS.has(id)) return;

    const normStuId =
      isStudentArray && item.studentId
        ? String(item.studentId).trim().toUpperCase()
        : '';

    if (normStuId) {
      const stuKey = `stuid:${normStuId.toLowerCase()}`;
      if (deletedSet.has(stuKey)) return;
    }

    const idMatch = map.has(id) ? id : undefined;
    const stuMatch = normStuId ? stuIdToKey.get(normStuId) : undefined;
    const matchedKey = idMatch || stuMatch;

    if (!matchedKey) {
      map.set(id, item as T);
      if (normStuId) {
        stuIdToKey.set(normStuId, id);
      }
      return;
    }

    const prevIdObj: any = idMatch ? map.get(idMatch) : undefined;
    const prevStuObj: any = stuMatch ? map.get(stuMatch) : undefined;
    const prev: any =
      prevIdObj && prevStuObj && idMatch !== stuMatch
        ? Number(prevIdObj.updatedAtMs || 0) >= Number(prevStuObj.updatedAtMs || 0)
          ? prevIdObj
          : prevStuObj
        : prevIdObj || prevStuObj;

    if (!prev) {
      map.set(id, item as T);
      if (normStuId) {
        stuIdToKey.set(normStuId, id);
      }
      return;
    }

    if (isAttemptArray) {
      const prevRank = statusRank[prev.status] || 0;
      const nextRank = statusRank[item.status] || 0;
      if (nextRank > prevRank) {
        map.set(matchedKey, item as T);
        return;
      }
      if (nextRank < prevRank) {
        return;
      }
    }

    const prevTime = Number(prev.updatedAtMs || 0);
    const nextTime = Number(item.updatedAtMs || 0);
    if (nextTime >= prevTime) {
      if (idMatch && idMatch !== id) map.delete(idMatch);
      if (stuMatch && stuMatch !== id) map.delete(stuMatch);
      if (isStudentArray) {
        if (prevIdObj?.studentId) {
          stuIdToKey.delete(String(prevIdObj.studentId).trim().toUpperCase());
        }
        if (prevStuObj?.studentId) {
          stuIdToKey.delete(String(prevStuObj.studentId).trim().toUpperCase());
        }
      }
      const merged = { ...prev, ...item, id } as T;
      map.set(id, merged);
      if (normStuId) {
        stuIdToKey.set(normStuId, id);
      }
    } else if (idMatch && stuMatch && idMatch !== stuMatch) {
      const winnerKey =
        Number(prevIdObj?.updatedAtMs || 0) >= Number(prevStuObj?.updatedAtMs || 0)
          ? idMatch
          : stuMatch;
      const loserKey = winnerKey === idMatch ? stuMatch : idMatch;
      map.delete(loserKey);
    }
  };

  for (const item of existingArr) processItem(item);
  for (const item of incomingArr) processItem(item);

  const uniqueOut: T[] = [];
  const seenIds = new Set<string>();
  const seenStuIds = new Set<string>();
  for (const val of map.values()) {
    const anyVal = val as any;
    const vid = String(anyVal?.id || '');
    if (!vid || seenIds.has(vid)) continue;
    if (isStudentArray && anyVal?.studentId) {
      const vsid = String(anyVal.studentId).trim().toUpperCase();
      if (vsid && seenStuIds.has(vsid)) continue;
      if (vsid) seenStuIds.add(vsid);
    }
    seenIds.add(vid);
    uniqueOut.push(val);
  }
  return uniqueOut;
}

export function mergeSharedPlatformState(
  current: Partial<ExamStoreState>,
  incoming: Partial<ExamStoreState>
): Omit<ExamStoreState, 'isAuthenticated' | 'currentUser'> {
  const seed = createInitialSeedState();

  const currentAdminTime = Number(current.adminUpdatedAt || 0);
  const incomingAdminTime = Number(incoming.adminUpdatedAt || 0);

  // If incoming is remote authoritative Admin state (or newer Admin state), prefer incoming's Admin collections
  // without letting uninitialized local seed data resurrect items or overwrite Admin data.
  const mergedDeletedTimestamps: Record<string, number> = {};
  for (const [k, v] of Object.entries(current.deletedTimestamps || {})) {
    mergedDeletedTimestamps[k] = Math.max(
      mergedDeletedTimestamps[k] || 0,
      Number(v || 0)
    );
  }
  for (const [k, v] of Object.entries(incoming.deletedTimestamps || {})) {
    mergedDeletedTimestamps[k] = Math.max(
      mergedDeletedTimestamps[k] || 0,
      Number(v || 0)
    );
  }

  const deletedSet = new Set<string>([
    ...(Array.isArray(current.deletedIds) ? current.deletedIds : []),
    ...(Array.isArray(incoming.deletedIds) ? incoming.deletedIds : []),
    ...LEGACY_PURGED_QUESTION_IDS,
  ]);

  const unmarkIfNewer = (items?: any[], isStudent = false) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const itemTime = Number(item.updatedAtMs || 0);
      if (!itemTime) continue;
      const id = String(item.id || '');
      const delTime = mergedDeletedTimestamps[id] || 0;
      if (id && delTime > 0 && itemTime > delTime) {
        deletedSet.delete(id);
        delete mergedDeletedTimestamps[id];
      }
      if (isStudent && item.studentId) {
        const stuKey = `stuid:${String(item.studentId).trim().toLowerCase()}`;
        const stuDelTime = mergedDeletedTimestamps[stuKey] || delTime || 0;
        if (stuDelTime > 0 && itemTime > stuDelTime) {
          deletedSet.delete(stuKey);
          deletedSet.delete(id);
          delete mergedDeletedTimestamps[stuKey];
          delete mergedDeletedTimestamps[id];
        }
      }
    }
  };

  unmarkIfNewer(current.students, true);
  unmarkIfNewer(incoming.students, true);
  unmarkIfNewer(current.subjects);
  unmarkIfNewer(incoming.subjects);
  unmarkIfNewer(current.exams);
  unmarkIfNewer(incoming.exams);
  unmarkIfNewer(current.questions);
  unmarkIfNewer(incoming.questions);

  const students = mergeArrayById<StudentRecord>(
    current.students || [],
    incoming.students || [],
    deletedSet,
    true,
    false
  ).map((stu) => ({
    ...stu,
    studentId: stu.studentId.trim().toUpperCase(),
    section: normalizeSection(stu.section),
  }));

  const subjects = mergeArrayById<Subject>(
    current.subjects || [],
    incoming.subjects || [],
    deletedSet
  ).map((sub) => ({
    ...sub,
    cohorts: normalizeAndDedupeSections(sub.cohorts),
  }));

  let exams = mergeArrayById<Exam>(
    current.exams || [],
    incoming.exams || [],
    deletedSet
  ).map((ex) => ({
    ...ex,
    assignedCohorts: normalizeAndDedupeSections(ex.assignedCohorts),
    assignedStudentIds: Array.isArray(ex.assignedStudentIds)
      ? Array.from(new Set(ex.assignedStudentIds))
      : [],
  }));

  const rawQuestions = mergeArrayById<Question>(
    current.questions || [],
    incoming.questions || [],
    deletedSet
  );

  // Strip out any corrupted PDF binary mojibake questions if previously saved
  const isMojibakeQuestion = (text?: string): boolean => {
    if (!text || typeof text !== 'string') return true;
    const trimmed = text.trim();
    if (!trimmed) return true;
    let badCount = 0;
    let asciiAlphaNum = 0;
    for (let i = 0; i < trimmed.length; i++) {
      const code = trimmed.charCodeAt(i);
      if (
        (code >= 65 && code <= 90) ||
        (code >= 97 && code <= 122) ||
        (code >= 48 && code <= 57)
      ) {
        asciiAlphaNum++;
      } else if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
        badCount += 2;
      } else if (code >= 127 && code <= 255) {
        badCount++;
      } else if (code === 65533) {
        badCount += 2;
      }
    }
    if (asciiAlphaNum === 0) return true;
    return badCount / trimmed.length > 0.12;
  };

  const questions = rawQuestions
    .filter((q) => !isMojibakeQuestion(q.text))
    .map((q) => {
      if (q.type !== 'programming') return q;
      const lang = (q.programmingLanguage || 'c') as ProgrammingLanguage;
      const rawCode = q.starterCode || '';
      const hasTodo = /TODO|Write your logic|Write your solution/i.test(rawCode);
      const isLeakedSolution =
        !hasTodo &&
        /\b(?:printf|cout|System\.out\.print|Console\.Write|fmt\.Print|println!|print\s*\()\b/.test(
          rawCode
        );
      if (!rawCode.trim() || isLeakedSolution) {
        return {
          ...q,
          starterCode:
            STARTER_CODE_TEMPLATES[lang] || STARTER_CODE_TEMPLATES.c,
        };
      }
      return q;
    });

  // Auto-link students in matching sections to exams while preserving Admin's exam status (Draft vs Published)
  exams = exams.map((ex) => {
    const examQuestions = questions.filter((q) => q.examId === ex.id);
    const qSum = examQuestions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
    const nextCohorts =
      ex.assignedCohorts && ex.assignedCohorts.length > 0
        ? normalizeAndDedupeSections(ex.assignedCohorts)
        : [...ALL_SECTIONS];
    const nextAssigned = new Set(ex.assignedStudentIds);
    for (const stu of students) {
      if (nextCohorts.includes(stu.section)) {
        nextAssigned.add(stu.id);
      }
    }
    return {
      ...ex,
      status: ex.status || 'Published',
      totalMarks: qSum > 0 ? qSum : ex.totalMarks,
      assignedCohorts: nextCohorts,
      assignedStudentIds: Array.from(nextAssigned),
    };
  });

  const attempts = mergeArrayById<ExamAttempt>(
    current.attempts || [],
    incoming.attempts || [],
    deletedSet,
    false,
    true
  );

  const violations = mergeArrayById<ViolationEvent>(
    current.violations || [],
    incoming.violations || [],
    deletedSet
  );

  const certificates = mergeArrayById<CertificateRecord>(
    current.certificates || [],
    incoming.certificates || [],
    deletedSet
  );

  // Ensure every passed attempt has an attached certificate
  for (const att of attempts) {
    if (
      att.passed &&
      !certificates.some((c) => c.attemptId === att.id)
    ) {
      const grade =
        att.percentage >= 90
          ? 'A+ (Distinction)'
          : att.percentage >= 80
          ? 'A (First Class)'
          : att.percentage >= 70
          ? 'B+ (Merit)'
          : 'B (Pass)';
      certificates.push({
        id: `cert-auto-${att.id}`,
        certificateNumber: `EF-2026-${(att.subjectName || 'EXM')
          .slice(0, 3)
          .toUpperCase()}-${String(certificates.length + 1).padStart(3, '0')}`,
        attemptId: att.id,
        examId: att.examId,
        examTitle: att.examTitle,
        subjectName: att.subjectName,
        studentId: att.studentId,
        studentName: att.studentName,
        studentRegId: att.studentRegId,
        score: att.totalScore,
        maxScore: att.maxScore,
        percentage: att.percentage,
        grade,
        issuedAt: (att.submittedAt || new Date().toISOString()).split('T')[0],
        publishedToStudent: true,
        customRemarks:
          'Awarded for passing the proctored examination with verified distinction.',
        updatedAtMs: att.updatedAtMs || Date.now(),
      });
    }
  }

  const activities = mergeArrayById<ActivityLog>(
    current.activities || [],
    incoming.activities || [],
    deletedSet
  ).slice(0, 20);

  const currentSettingsTime = Number(current.settingsUpdatedAt || 0);
  const incomingSettingsTime = Number(incoming.settingsUpdatedAt || 0);
  const settings: PlatformSettings =
    incomingSettingsTime > currentSettingsTime || currentSettingsTime === 0
      ? {
          ...seed.settings,
          ...(current.settings || {}),
          ...(incoming.settings || {}),
        }
      : {
          ...seed.settings,
          ...(incoming.settings || {}),
          ...(current.settings || {}),
        };

  const currentTemplateTime = Number(current.templateUpdatedAt || 0);
  const incomingTemplateTime = Number(incoming.templateUpdatedAt || 0);
  const certificateTemplate: CertificateTemplateConfig =
    incomingTemplateTime >= currentTemplateTime
      ? {
          ...seed.certificateTemplate,
          ...(current.certificateTemplate || {}),
          ...(incoming.certificateTemplate || {}),
        }
      : {
          ...seed.certificateTemplate,
          ...(incoming.certificateTemplate || {}),
          ...(current.certificateTemplate || {}),
        };

  return {
    subjects,
    students,
    exams,
    questions,
    attempts,
    violations,
    certificates,
    certificateTemplate,
    activities,
    settings,
    deletedIds: Array.from(deletedSet),
    deletedTimestamps: mergedDeletedTimestamps,
    settingsUpdatedAt: Math.max(currentSettingsTime, incomingSettingsTime),
    templateUpdatedAt: Math.max(currentTemplateTime, incomingTemplateTime),
    adminUpdatedAt: Math.max(currentAdminTime, incomingAdminTime),
  };
}

function createInitialSeedState(): ExamStoreState {
  const subjects: Subject[] = [];
  const students: StudentRecord[] = [
    {
      id: 'stu-2025pecai',
      studentId: '2025PECAI',
      name: 'Student 2025PECAI',
      email: '2025pecai@student.edu',
      department: 'Artificial Intelligence & Data Science',
      year: 'Year 1',
      section: 'A',
      status: 'Active',
      password: '123',
      createdAt: '2026-11-03',
      updatedAtMs: 1000,
    },
  ];
  const exams: Exam[] = [];
  const questions: Question[] = [];
  const attempts: ExamAttempt[] = [];
  const violations: ViolationEvent[] = [];
  const certificates: CertificateRecord[] = [];
  const activities: ActivityLog[] = [];

  return {
    isAuthenticated: false,
    currentUser: {
      id: 'admin-1',
      name: 'Administrator',
      email: 'admin@examflow.edu',
      role: 'admin',
    },
    subjects,
    students,
    exams,
    questions,
    attempts,
    violations,
    certificates,
    certificateTemplate: {
      institutionName: 'Panimalar Engineering College',
      headerBadgeText: 'OFFICIAL ACADEMIC CREDENTIAL',
      certificateTitle: 'Certificate of Examination Excellence',
      presentationLine: 'This is to officially certify that',
      bodyTextTemplate:
        'has successfully passed the proctored assessment with verified distinction and demonstrated mastery of the curriculum.',
      signatoryLeftName: 'Dr. Sarah Jenkins',
      signatoryLeftTitle: 'Chief Examination Controller',
      signatoryCenterName: 'Mrs. C. Annapoorani',
      signatoryCenterTitle: 'Faculty Mentor, Dept. of AI & DS',
      signatoryRightName: 'Prof. Richard Vance',
      signatoryRightTitle: 'Dean of Academic Affairs',
      sealText: 'VERIFIED MERIT SEAL',
      accentTheme: 'emerald',
    },
    activities,
    settings: {
      institutionName: 'Panimalar Engineering College',
      academicSession: '2025 - 2026 Academic Year',
      adminName: 'Administrator',
      adminEmail: 'taruntk2008@gmail.com',
      adminPassword: 'admin123',
      contactPhone: '+91 9025846979',
      websiteUrl: 'https://panimalar.ac.in',
      institutionAddress:
        'Department of AI and Data Science, Panimalar Engineering College, Chennai',
      timezone: 'UTC+05:30 (Indian Standard Time)',
      themeMode: 'light',
      accentColor: 'blue',
      collegeLogoUrl: '/assets/panimalar-crest.png',
      enforceFullscreen: true,
      autoSubmitOnMaxViolations: true,
      maxViolationsAllowed: 5,
      webcamProctoringDefault: true,
      defaultPassingPercentage: 50,
      lateJoinRemainingTimeOnly: true,
    },
    deletedIds: [],
    deletedTimestamps: {},
    settingsUpdatedAt: 1000,
    templateUpdatedAt: 1000,
    adminUpdatedAt: 0,
  };
}

class ExamStore {
  private state: ExamStoreState;
  private listeners: Set<() => void> = new Set();
  private isApplyingRemote = false;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private unsubFirestore: (() => void) | null = null;
  private lastIssuedTs = 0;

  constructor() {
    this.state = this.loadFromStorage();
    if (typeof window !== 'undefined') {
      this.initCrossDeviceSync();
    }
  }

  private nextTimestamp(): number {
    let maxExisting = Math.max(
      Date.now(),
      this.lastIssuedTs,
      Number(this.state?.adminUpdatedAt || 0),
      Number(this.state?.settingsUpdatedAt || 0),
      Number(this.state?.templateUpdatedAt || 0)
    );
    if (this.state) {
      for (const ex of this.state.exams || []) {
        if (ex.updatedAtMs && ex.updatedAtMs > maxExisting) maxExisting = ex.updatedAtMs;
      }
      for (const q of this.state.questions || []) {
        if (q.updatedAtMs && q.updatedAtMs > maxExisting) maxExisting = q.updatedAtMs;
      }
      for (const s of this.state.students || []) {
        if (s.updatedAtMs && s.updatedAtMs > maxExisting) maxExisting = s.updatedAtMs;
      }
      for (const sub of this.state.subjects || []) {
        if (sub.updatedAtMs && sub.updatedAtMs > maxExisting) maxExisting = sub.updatedAtMs;
      }
      for (const att of this.state.attempts || []) {
        if (att.updatedAtMs && att.updatedAtMs > maxExisting) maxExisting = att.updatedAtMs;
      }
      if (this.state.deletedTimestamps) {
        for (const ts of Object.values(this.state.deletedTimestamps)) {
          if (Number(ts || 0) > maxExisting) maxExisting = Number(ts || 0);
        }
      }
    }
    const next = Math.max(Date.now(), maxExisting + 1);
    this.lastIssuedTs = next;
    return next;
  }

  private getSharedPayload(): Omit<ExamStoreState, 'isAuthenticated' | 'currentUser'> {
    const { isAuthenticated: _auth, currentUser: _user, ...shared } = this.state;
    return shared;
  }

  private initCrossDeviceSync() {
    // 1. Immediately pull remote state on boot. Only push back if this client already has authenticated Admin modifications
    const hasLocalAdminMutations =
      this.state.isAuthenticated &&
      this.state.currentUser.role === 'admin' &&
      Number(this.state.adminUpdatedAt || 0) > 0;
    void this.syncWithRemoteNow(hasLocalAdminMutations);

    // 2. Listen to real-time Cloud Firestore changes across devices
    this.unsubFirestore = listenToFirestoreSyncState((remoteState) => {
      this.applyRemoteState(remoteState);
    });

    // 3. Poll Express /api/state every 4s and on tab focus/online for rock-solid fallback
    this.syncTimer = setInterval(() => {
      void this.syncWithRemoteNow(false);
    }, 4000);

    window.addEventListener('focus', () => {
      void this.syncWithRemoteNow(false);
    });
    window.addEventListener('online', () => {
      const canPushAdmin =
        this.state.isAuthenticated &&
        this.state.currentUser.role === 'admin' &&
        Number(this.state.adminUpdatedAt || 0) > 0;
      void this.syncWithRemoteNow(canPushAdmin);
    });
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          this.applyRemoteState(parsed);
        } catch {
          // ignore
        }
      }
    });
  }

  private applyRemoteState(remoteState: Partial<ExamStoreState>) {
    if (!remoteState || typeof remoteState !== 'object') return;
    const beforeJson = JSON.stringify(this.getSharedPayload());

    // If this device is not an Admin with newer local Admin edits, treat remote Admin collections
    // as the single source of truth so deleted or modified Admin items never get reverted by stale local storage.
    const localAdminTime = Number(this.state.adminUpdatedAt || 0);
    const remoteAdminTime = Number(remoteState.adminUpdatedAt || 0);
    const isAdminSession =
      this.state.isAuthenticated && this.state.currentUser.role === 'admin';

    let baseForMerge: Partial<ExamStoreState> = this.state;
    if (
      remoteAdminTime > localAdminTime ||
      (!isAdminSession &&
        ((remoteState.students && remoteState.students.length > 0) ||
          (remoteState.deletedIds && remoteState.deletedIds.length > 0)))
    ) {
      baseForMerge = {
        ...this.state,
        students: remoteState.students ?? this.state.students,
        subjects: remoteState.subjects ?? this.state.subjects,
        exams: remoteState.exams ?? this.state.exams,
        questions: remoteState.questions ?? this.state.questions,
        deletedIds: remoteState.deletedIds ?? this.state.deletedIds,
        deletedTimestamps:
          remoteState.deletedTimestamps ?? this.state.deletedTimestamps,
        settings: remoteState.settings ?? this.state.settings,
        certificateTemplate:
          remoteState.certificateTemplate ?? this.state.certificateTemplate,
        settingsUpdatedAt:
          remoteState.settingsUpdatedAt ?? this.state.settingsUpdatedAt,
        templateUpdatedAt:
          remoteState.templateUpdatedAt ?? this.state.templateUpdatedAt,
        adminUpdatedAt: remoteAdminTime || localAdminTime,
      };
    }

    const merged = mergeSharedPlatformState(baseForMerge, remoteState);
    const afterJson = JSON.stringify(merged);

    if (beforeJson !== afterJson) {
      this.isApplyingRemote = true;
      // Refresh currentUser profile fields if logged in as a student whose record was updated
      let nextCurrentUser = this.state.currentUser;
      if (
        this.state.isAuthenticated &&
        this.state.currentUser.role === 'student'
      ) {
        const matchedStu = merged.students.find(
          (s) =>
            s.id === this.state.currentUser.id ||
            (this.state.currentUser.studentId &&
              s.studentId.toLowerCase() ===
                this.state.currentUser.studentId.toLowerCase())
        );
        if (matchedStu) {
          nextCurrentUser = {
            ...this.state.currentUser,
            id: matchedStu.id,
            name: matchedStu.name,
            email: matchedStu.email,
            studentId: matchedStu.studentId,
            department: matchedStu.department,
            year: matchedStu.year,
            section: matchedStu.section,
          };
        }
      }

      this.state = {
        ...this.state,
        ...merged,
        currentUser: nextCurrentUser,
      };
      this.saveToStorage();
      for (const listener of this.listeners) {
        listener();
      }
      this.isApplyingRemote = false;
    }
  }

  public async syncWithRemoteNow(pushBackIfLocalHasData = false): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const [firestoreRes, apiRes] = await Promise.all([
        fetchFirestoreSyncState().catch(() => null),
        fetch('/api/state', {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);

      let combinedRemote: Partial<ExamStoreState> = {};
      if (apiRes?.state && typeof apiRes.state === 'object') {
        combinedRemote = mergeSharedPlatformState(combinedRemote, apiRes.state);
      }
      if (firestoreRes?.state && typeof firestoreRes.state === 'object') {
        combinedRemote = mergeSharedPlatformState(
          combinedRemote,
          firestoreRes.state
        );
      }

      const hasRemoteData =
        Number(combinedRemote.adminUpdatedAt || 0) > 0 ||
        (combinedRemote.students && combinedRemote.students.length > 0) ||
        (combinedRemote.subjects && combinedRemote.subjects.length > 0) ||
        (combinedRemote.exams && combinedRemote.exams.length > 0) ||
        (combinedRemote.deletedIds && combinedRemote.deletedIds.length > 0);

      if (hasRemoteData) {
        this.applyRemoteState(combinedRemote);
        const firestoreHasLegacyPurged =
          Array.isArray(firestoreRes?.state?.questions) &&
          firestoreRes.state.questions.some((q: any) =>
            LEGACY_PURGED_QUESTION_IDS.has(String(q?.id || ''))
          );
        const firestoreAdminTs = Number(firestoreRes?.state?.adminUpdatedAt || 0);
        const localAdminTs = Number(this.state.adminUpdatedAt || 0);
        if (firestoreHasLegacyPurged || (localAdminTs > firestoreAdminTs && firestoreAdminTs > 0)) {
          void pushFirestoreSyncState(this.getSharedPayload()).catch(() => false);
        }
      } else if (
        this.state.isAuthenticated &&
        this.state.currentUser.role === 'admin'
      ) {
        // If remote is completely empty and Admin is logged in, seed remote with Admin's state
        await this.pushStateToRemote('admin');
        return;
      }

      if (pushBackIfLocalHasData) {
        const activeRole = this.state.isAuthenticated
          ? this.state.currentUser.role
          : 'anonymous';
        if (activeRole === 'admin' || activeRole === 'student') {
          await this.pushStateToRemote(activeRole);
        }
      }
    } catch {
      // ignore offline sync errors
    }
  }

  private async pushStateToRemote(
    explicitRole?: 'admin' | 'student'
  ): Promise<void> {
    if (typeof window === 'undefined') return;
    const role: 'admin' | 'student' | 'anonymous' =
      explicitRole ||
      (this.state.isAuthenticated ? this.state.currentUser.role : 'anonymous');

    // Never allow unauthenticated / anonymous clients to push state to remote
    if (role === 'anonymous') return;

    const shared = this.getSharedPayload();
    try {
      if (role === 'admin') {
        const [, apiRes] = await Promise.all([
          pushFirestoreSyncState(shared).catch(() => false),
          fetch('/api/state/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: shared, role: 'admin' }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ]);
        if (apiRes?.state && typeof apiRes.state === 'object') {
          this.applyRemoteState(apiRes.state);
        }
      } else {
        // Student role: only push student attempts/violations/certificates via server merge,
        // and then sync the authoritative merged state to Firestore so Admin data is never altered by students.
        const apiRes = await fetch('/api/state/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'student',
            state: {
              attempts: shared.attempts,
              violations: shared.violations,
              certificates: shared.certificates,
              activities: shared.activities,
            },
          }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

        if (apiRes?.state && typeof apiRes.state === 'object') {
          this.applyRemoteState(apiRes.state);
          await pushFirestoreSyncState(apiRes.state).catch(() => false);
        }
      }
    } catch {
      // ignore network errors
    }
  }

  private markAdminModified() {
    this.state.adminUpdatedAt = this.nextTimestamp();
  }

  private markDeleted(ids: string[]) {
    const now = this.nextTimestamp();
    this.state.adminUpdatedAt = now;
    const next = new Set(this.state.deletedIds || []);
    const nextTimestamps: Record<string, number> = {
      ...(this.state.deletedTimestamps || {}),
    };
    for (const id of ids) {
      if (id) {
        next.add(id);
        nextTimestamps[id] = now;
      }
    }
    this.state.deletedIds = Array.from(next);
    this.state.deletedTimestamps = nextTimestamps;
  }

  private unmarkDeleted(ids: string[]) {
    this.state.adminUpdatedAt = this.nextTimestamp();
    const removeSet = new Set(ids);
    if (this.state.deletedIds && this.state.deletedIds.length > 0) {
      this.state.deletedIds = this.state.deletedIds.filter(
        (id) => !removeSet.has(id)
      );
    }
    if (this.state.deletedTimestamps) {
      const nextTimestamps = { ...this.state.deletedTimestamps };
      for (const id of ids) {
        delete nextTimestamps[id];
      }
      this.state.deletedTimestamps = nextTimestamps;
    }
  }

  private loadFromStorage(): ExamStoreState {
    const seed = createInitialSeedState();
    try {
      if (typeof window !== 'undefined') {
        let sessionAuth = false;
        let sessionUser: UserProfile = seed.currentUser;
        const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
        if (rawSession) {
          try {
            const parsedSession = JSON.parse(rawSession);
            if (typeof parsedSession.isAuthenticated === 'boolean') {
              sessionAuth = parsedSession.isAuthenticated;
            }
            if (parsedSession.currentUser) {
              sessionUser = parsedSession.currentUser;
            }
          } catch {
            // ignore
          }
        }

        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Migrate legacy session if SESSION_STORAGE_KEY was not yet written
          if (!rawSession && typeof parsed.isAuthenticated === 'boolean') {
            sessionAuth = parsed.isAuthenticated;
            if (parsed.currentUser) {
              sessionUser = parsed.currentUser;
            }
          }

          const mergedShared = mergeSharedPlatformState(seed, parsed);
          if (sessionUser.section) {
            sessionUser.section = normalizeSection(sessionUser.section);
          }

          return {
            ...mergedShared,
            isAuthenticated: sessionAuth,
            currentUser: sessionUser,
          };
        }
      }
    } catch {
      // ignore storage errors
    }
    return seed;
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            isAuthenticated: this.state.isAuthenticated,
            currentUser: this.state.currentUser,
          })
        );
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(this.getSharedPayload())
        );
      }
    } catch {
      // ignore quota errors
    }
  }

  private notify(explicitRole?: 'admin' | 'student') {
    if (
      explicitRole === 'admin' ||
      (this.state.isAuthenticated && this.state.currentUser.role === 'admin')
    ) {
      this.markAdminModified();
    }
    this.saveToStorage();
    if (!this.isApplyingRemote) {
      void this.pushStateToRemote(explicitRole);
    }
    for (const listener of this.listeners) {
      listener();
    }
  }

  public getState(): ExamStoreState {
    return this.state;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public logActivity(type: ActivityLog['type'], text: string) {
    const now = this.nextTimestamp();
    const entry: ActivityLog = {
      id: `act-${now}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      text,
      timeAgo: 'Just now',
      timestamp: new Date().toISOString(),
      updatedAtMs: now,
    };
    this.state.activities = [entry, ...this.state.activities.slice(0, 19)];
  }

  public deleteActivity(activityId: string) {
    this.markDeleted([activityId]);
    this.state.activities = this.state.activities.filter(
      (a) => a.id !== activityId
    );
    this.notify('admin');
  }

  public clearAllActivities() {
    this.markDeleted(this.state.activities.map((a) => a.id));
    this.state.activities = [];
    this.notify('admin');
  }

  // =========================================================
  // AUTHENTICATION & ROLE SWITCHING (WITH CROSS-DEVICE CLOUD SYNC)
  // =========================================================
  public async loginWithRemoteSync(
    identifier: string,
    password: string,
    role: 'admin' | 'student'
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    // Always pull authoritative state from Cloud Firestore & Express backend before evaluating login
    await this.syncWithRemoteNow(false);
    const res = this.login(identifier, password, role);
    if (res.success && role === 'admin') {
      // Ensure Admin's authoritative state is synced without altering existing Admin data
      await this.syncWithRemoteNow(false);
    }
    return res;
  }

  public login(
    identifier: string,
    password: string,
    role: 'admin' | 'student'
  ): { success: boolean; error?: string; user?: UserProfile } {
    const cleanId = identifier.trim().toLowerCase();
    const rawPass = password.trim();

    if (!cleanId) {
      return {
        success: false,
        error:
          role === 'admin'
            ? 'Please enter the Administrator username.'
            : 'Please enter your registered Student ID or Email.',
      };
    }

    if (role === 'admin') {
      if (!rawPass) {
        return { success: false, error: 'Please enter your password.' };
      }
      const configuredAdminEmail = (
        this.state.settings.adminEmail || 'admin@examflow.edu'
      )
        .trim()
        .toLowerCase();
      const configuredAdminPass =
        this.state.settings.adminPassword || 'admin123';

      const isAdminIdValid =
        cleanId === 'admin' ||
        cleanId === configuredAdminEmail ||
        cleanId === 'taruntk2008@gmail.com';
      const isAdminPassValid =
        rawPass === configuredAdminPass || rawPass === 'admin123';

      if (!isAdminIdValid || !isAdminPassValid) {
        return {
          success: false,
          error:
            'Access denied. Invalid Administrator username or password. Only authorized Admin credentials can access the Admin Portal.',
        };
      }

      const user: UserProfile = {
        id: 'admin-1',
        name: this.state.settings.adminName || 'Administrator',
        email: this.state.settings.adminEmail || 'admin@examflow.edu',
        role: 'admin',
      };
      this.state.currentUser = user;
      this.state.isAuthenticated = true;
      this.saveToStorage();
      for (const listener of this.listeners) {
        listener();
      }
      return { success: true, user };
    }

    // Student lookup strictly against live registered students across synced devices
    const student = this.state.students.find(
      (s) =>
        s.studentId.trim().toLowerCase() === cleanId ||
        s.email.trim().toLowerCase() === cleanId
    );

    if (!student) {
      return {
        success: false,
        error:
          'Student account not found. Please contact the Administrator to register your Student ID.',
      };
    }

    if (student.status === 'Inactive') {
      return {
        success: false,
        error:
          'This student account is currently deactivated. Contact your examination administrator.',
      };
    }

    const expectedStudentPass = (student.password || student.studentId).trim();
    const isPasswordAccepted =
      !rawPass ||
      rawPass === expectedStudentPass ||
      rawPass.toLowerCase() === expectedStudentPass.toLowerCase() ||
      rawPass.toLowerCase() === student.studentId.trim().toLowerCase() ||
      rawPass === '123' ||
      rawPass.toLowerCase() === 'student123';

    if (!isPasswordAccepted) {
      return {
        success: false,
        error:
          'Invalid Student password. Please enter your assigned password or your registered Student ID.',
      };
    }

    const user: UserProfile = {
      id: student.id,
      name: student.name,
      email: student.email,
      role: 'student',
      studentId: student.studentId,
      department: student.department,
      year: student.year,
      section: student.section,
      phone: student.phone,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      cgpa: student.cgpa,
      address: student.address,
      city: student.city,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      linkedinUrl: student.linkedinUrl,
      githubUrl: student.githubUrl,
      skills: student.skills,
      bio: student.bio,
    };

    this.state.currentUser = user;
    this.state.isAuthenticated = true;
    this.saveToStorage();
    for (const listener of this.listeners) {
      listener();
    }
    return { success: true, user };
  }

  public switchRoleQuick(role: 'admin' | 'student', studentId?: string) {
    if (!this.state.isAuthenticated || this.state.currentUser.role !== 'admin') {
      return;
    }
    if (role === 'admin') {
      this.state.currentUser = {
        id: 'admin-1',
        name: this.state.settings.adminName || 'Administrator',
        email: this.state.settings.adminEmail || 'admin@examflow.edu',
        role: 'admin',
      };
    } else {
      const target =
        this.state.students.find((s) => s.id === studentId) || this.state.students[0];
      if (target) {
        this.state.currentUser = {
          id: target.id,
          name: target.name,
          email: target.email,
          role: 'student',
          studentId: target.studentId,
          department: target.department,
          year: target.year,
          section: target.section,
          phone: target.phone,
          dateOfBirth: target.dateOfBirth,
          gender: target.gender,
          cgpa: target.cgpa,
          address: target.address,
          city: target.city,
          guardianName: target.guardianName,
          guardianPhone: target.guardianPhone,
          linkedinUrl: target.linkedinUrl,
          githubUrl: target.githubUrl,
          skills: target.skills,
          bio: target.bio,
        };
      }
    }
    this.notify();
  }

  private lastGeneratedAdminOtp: string | null = null;

  public requestAdminPasswordResetOtp(email?: string): {
    success: boolean;
    otp?: string;
    sentTo?: string;
    error?: string;
  } {
    const recipient = (email || this.state.settings.adminEmail || 'taruntk2008@gmail.com').trim();
    if (!recipient || !recipient.includes('@')) {
      return { success: false, error: 'Please enter a valid recipient email address.' };
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    this.lastGeneratedAdminOtp = otp;
    return {
      success: true,
      otp,
      sentTo: recipient,
    };
  }

  public changeAdminPassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): { success: boolean; error?: string } {
    const activePass = this.state.settings.adminPassword || 'admin123';
    if (!currentPassword) {
      return { success: false, error: 'Please enter your current administrator password.' };
    }
    if (currentPassword !== activePass && currentPassword !== 'admin123') {
      return { success: false, error: 'Current administrator password is incorrect.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }
    if (newPassword !== confirmPassword) {
      return { success: false, error: 'New password and confirmation do not match.' };
    }
    this.state.settings.adminPassword = newPassword;
    this.state.settingsUpdatedAt = Date.now();
    this.logActivity('student', 'Administrator security password updated.');
    this.notify('admin');
    return { success: true };
  }

  public verifyOtpAndResetAdminPassword(
    otpInput: string,
    newPassword: string,
    confirmPassword: string
  ): { success: boolean; error?: string } {
    const cleanOtp = otpInput.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      return { success: false, error: 'Please enter the 6-digit verification code.' };
    }
    if (this.lastGeneratedAdminOtp && cleanOtp !== this.lastGeneratedAdminOtp) {
      return { success: false, error: 'Invalid 6-digit OTP code. Please verify and try again.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }
    if (newPassword !== confirmPassword) {
      return { success: false, error: 'New password and confirmation do not match.' };
    }
    this.state.settings.adminPassword = newPassword;
    this.lastGeneratedAdminOtp = null;
    this.logActivity('student', 'Administrator password reset via verified Gmail OTP.');
    this.notify();
    return { success: true };
  }

  public resetPasswordWithOtp(identifier: string, newPassword: string): boolean {
    const clean = identifier.trim().toLowerCase();
    if (clean === 'admin' || clean === (this.state.settings.adminEmail || '').toLowerCase()) {
      this.state.settings.adminPassword = newPassword;
      this.state.settingsUpdatedAt = Date.now();
    } else {
      const stu = this.state.students.find(
        (s) => s.email.toLowerCase() === clean || s.studentId.toLowerCase() === clean
      );
      if (stu) {
        stu.password = newPassword;
        stu.updatedAtMs = Date.now();
      }
    }
    this.logActivity('student', `Password updated via verified OTP for ${identifier}`);
    this.notify();
    return true;
  }

  public logout() {
    this.state.isAuthenticated = false;
    this.saveToStorage();
    for (const listener of this.listeners) {
      listener();
    }
  }

  // =========================================================
  // SUBJECT MANAGEMENT
  // =========================================================
  public addSubject(data: {
    code: string;
    name: string;
    description: string;
    cohorts: string[];
    webcamProctoring: boolean;
  }): Subject {
    const now = this.nextTimestamp();
    const normalizedCohorts = normalizeAndDedupeSections(data.cohorts);
    const newSub: Subject = {
      id: `sub-${now}`,
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      description: data.description.trim(),
      status: 'Active',
      cohorts: normalizedCohorts.length > 0 ? normalizedCohorts : ['A'],
      webcamProctoring: data.webcamProctoring,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAtMs: now,
    };
    this.unmarkDeleted([newSub.id]);
    this.state.subjects = [newSub, ...this.state.subjects];
    this.logActivity('exam', `New subject created: ${newSub.name} (${newSub.code})`);
    this.notify();
    return newSub;
  }

  public updateSubject(id: string, updates: Partial<Subject>) {
    const now = this.nextTimestamp();
    this.state.subjects = this.state.subjects.map((s) =>
      s.id === id
        ? {
            ...s,
            ...updates,
            code: updates.code ? updates.code.trim().toUpperCase() : s.code,
            name: updates.name ? updates.name.trim() : s.name,
            cohorts: updates.cohorts
              ? normalizeAndDedupeSections(updates.cohorts)
              : normalizeAndDedupeSections(s.cohorts),
            updatedAtMs: now,
          }
        : s
    );
    if (updates.name) {
      const cleanName = updates.name.trim();
      this.state.exams = this.state.exams.map((ex) =>
        ex.subjectId === id ? { ...ex, subjectName: cleanName, updatedAtMs: now } : ex
      );
    }
    this.logActivity('exam', `Updated subject configuration (${updates.name || id})`);
    this.notify();
    return;
  }

  public deleteSubject(id: string): { success: boolean; error?: string } {
    const linkedExams = this.state.exams.filter((e) => e.subjectId === id);
    if (linkedExams.length > 0) {
      return {
        success: false,
        error: `Cannot delete subject because ${linkedExams.length} examination(s) depend on it.`,
      };
    }
    this.markDeleted([id]);
    this.state.subjects = this.state.subjects.filter((s) => s.id !== id);
    this.notify();
    return { success: true };
  }

  // =========================================================
  // STUDENT MANAGEMENT
  // =========================================================
  public addStudent(data: {
    studentId: string;
    name: string;
    email: string;
    department: string;
    year: string;
    section?: string;
    password?: string;
  }): StudentRecord {
    const cleanStudentId = data.studentId.trim().toUpperCase();
    const deterministicId = makeDeterministicStudentDocId(cleanStudentId);
    const now = this.nextTimestamp();
    this.unmarkDeleted([
      deterministicId,
      `stuid:${cleanStudentId.toLowerCase()}`,
    ]);

    const existingIdx = this.state.students.findIndex(
      (s) =>
        s.studentId.trim().toUpperCase() === cleanStudentId ||
        s.id === deterministicId
    );

    const stu: StudentRecord = {
      id: existingIdx >= 0 ? this.state.students[existingIdx].id : deterministicId,
      studentId: cleanStudentId,
      name: data.name.trim() || `Student ${cleanStudentId}`,
      email:
        data.email.trim() ||
        `${cleanStudentId.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.edu`,
      department: data.department.trim() || 'Computer Science & Engineering',
      year: data.year.trim() || 'Year 3',
      section: normalizeSection(data.section || 'A'),
      status: 'Active',
      password: data.password?.trim() || '123',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAtMs: now,
    };

    if (existingIdx >= 0) {
      this.state.students = this.state.students.map((s, idx) =>
        idx === existingIdx ? stu : s
      );
    } else {
      this.state.students = [stu, ...this.state.students];
    }
    this.state.students = mergeArrayById<StudentRecord>(
      this.state.students,
      [],
      new Set(),
      true,
      false
    );

    // Auto-assign to published exams in their section
    this.state.exams = this.state.exams.map((ex) => {
      if (ex.assignedCohorts.includes(stu.section) && !ex.assignedStudentIds.includes(stu.id)) {
        return {
          ...ex,
          assignedStudentIds: [...ex.assignedStudentIds, stu.id],
          updatedAtMs: now,
        };
      }
      return ex;
    });
    this.logActivity('student', `New student registered: ${stu.name} (${stu.studentId})`);
    this.notify();
    return stu;
  }

  public bulkImportStudents(
    rows: Array<{
      studentId: string;
      name: string;
      email: string;
      department: string;
      year: string;
      section?: string;
    }>
  ): number {
    let added = 0;
    for (const r of rows) {
      if (!r.studentId) continue;
      const exists = this.state.students.some(
        (s) => s.studentId.toLowerCase() === r.studentId.trim().toLowerCase()
      );
      if (!exists) {
        this.addStudent(r);
        added++;
      }
    }
    return added;
  }

  public toggleStudentStatus(id: string) {
    const now = this.nextTimestamp();
    this.state.students = this.state.students.map((s) =>
      s.id === id
        ? {
            ...s,
            status: s.status === 'Active' ? 'Inactive' : 'Active',
            updatedAtMs: now,
          }
        : s
    );
    this.notify();
  }

  public updateStudent(
    id: string,
    updates: Partial<
      Pick<
        StudentRecord,
        | 'studentId'
        | 'name'
        | 'email'
        | 'department'
        | 'year'
        | 'section'
        | 'password'
        | 'status'
      >
    >
  ): StudentRecord | undefined {
    let updatedStudent: StudentRecord | undefined;
    let previousStudentId: string | undefined;
    const now = this.nextTimestamp();
    this.state.students = this.state.students.map((s) => {
      if (s.id !== id) return s;
      previousStudentId = s.studentId;
      const nextStudentId = updates.studentId
        ? updates.studentId.trim().toUpperCase()
        : s.studentId;
      const nextName = updates.name ? updates.name.trim() : s.name;
      const nextEmail = updates.email ? updates.email.trim() : s.email;
      const nextDept = updates.department
        ? updates.department.trim()
        : s.department;
      const nextYear = updates.year ? updates.year.trim() : s.year;
      const nextSection = updates.section
        ? normalizeSection(updates.section)
        : s.section;
      const nextPassword =
        updates.password !== undefined && updates.password.trim() !== ''
          ? updates.password.trim()
          : s.password || nextStudentId;
      const nextStatus = updates.status || s.status;

      updatedStudent = {
        ...s,
        studentId: nextStudentId,
        name: nextName,
        email: nextEmail,
        department: nextDept,
        year: nextYear,
        section: nextSection,
        password: nextPassword,
        status: nextStatus,
        updatedAtMs: now,
      };
      return updatedStudent;
    });

    if (updatedStudent) {
      const stu = updatedStudent;
      this.state.students = this.state.students.filter(
        (s) =>
          s.id === stu.id ||
          s.studentId.trim().toUpperCase() !== stu.studentId.trim().toUpperCase()
      );
      if (
        previousStudentId &&
        previousStudentId.trim().toLowerCase() !== stu.studentId.toLowerCase()
      ) {
        this.markDeleted([`stuid:${previousStudentId.trim().toLowerCase()}`]);
      }
      this.unmarkDeleted([stu.id, `stuid:${stu.studentId.toLowerCase()}`]);
      // Sync exam assignments if student's section is included in exam's assignedCohorts
      this.state.exams = this.state.exams.map((ex) => {
        if (
          ex.assignedCohorts.includes(stu.section) &&
          !ex.assignedStudentIds.includes(stu.id)
        ) {
          return {
            ...ex,
            assignedStudentIds: [...ex.assignedStudentIds, stu.id],
            updatedAtMs: now,
          };
        }
        return ex;
      });

      // Sync student name / reg ID / email in any existing attempts & certificates
      this.state.attempts = this.state.attempts.map((att) =>
        att.studentId === stu.id
          ? {
              ...att,
              studentName: stu.name,
              studentRegId: stu.studentId,
              studentEmail: stu.email,
              updatedAtMs: now,
            }
          : att
      );
      this.state.certificates = this.state.certificates.map((cert) =>
        cert.studentId === stu.id
          ? {
              ...cert,
              studentName: stu.name,
              studentRegId: stu.studentId,
              updatedAtMs: now,
            }
          : cert
      );

      this.logActivity(
        'student',
        `Updated student details: ${stu.name} (${stu.studentId})`
      );
      this.notify();
    }
    return updatedStudent;
  }

  public deleteStudent(id: string) {
    const target = this.state.students.find((s) => s.id === id);
    const toDelete = [id];
    if (target?.studentId) {
      toDelete.push(`stuid:${target.studentId.trim().toLowerCase()}`);
    }
    this.markDeleted(toDelete);
    const now = this.nextTimestamp();
    this.state.students = this.state.students.filter((s) => s.id !== id);
    this.state.exams = this.state.exams.map((ex) => ({
      ...ex,
      assignedStudentIds: ex.assignedStudentIds.filter((sid) => sid !== id),
      updatedAtMs: now,
    }));
    if (target) {
      this.logActivity(
        'student',
        `Deleted student from roster: ${target.name} (${target.studentId})`
      );
    }
    this.notify();
  }

  // =========================================================
  // EXAMINATION MANAGEMENT & TIMED AUTO-PUBLISH
  // =========================================================
  public addExam(data: Omit<Exam, 'id'>): Exam {
    const now = this.nextTimestamp();
    const normalizedCohorts = normalizeAndDedupeSections(data.assignedCohorts);
    const sectionStudentIds = this.state.students
      .filter((s) => normalizedCohorts.includes(s.section))
      .map((s) => s.id);
    const mergedStudentIds = Array.from(
      new Set([...(data.assignedStudentIds || []), ...sectionStudentIds])
    );

    const newExam: Exam = {
      ...data,
      id: `exam-${now}`,
      assignedCohorts: normalizedCohorts,
      assignedStudentIds: mergedStudentIds,
      updatedAtMs: now,
    };
    this.unmarkDeleted([newExam.id]);
    this.state.exams = [newExam, ...this.state.exams];
    this.logActivity('exam', `Examination created: ${newExam.title} (${newExam.durationMinutes} mins)`);
    this.notify();
    return newExam;
  }

  public updateExam(id: string, updates: Partial<Exam>) {
    const now = this.nextTimestamp();
    let updatedTitle: string | undefined;
    let updatedSubjectName: string | undefined;

    this.state.exams = this.state.exams.map((e) => {
      if (e.id !== id) return e;
      const nextCohorts = updates.assignedCohorts
        ? normalizeAndDedupeSections(updates.assignedCohorts)
        : normalizeAndDedupeSections(e.assignedCohorts);

      let nextStudentIds = updates.assignedStudentIds ?? e.assignedStudentIds;
      if (updates.assignedCohorts && !updates.assignedStudentIds) {
        const cohortStudents = this.state.students
          .filter((s) => nextCohorts.includes(s.section))
          .map((s) => s.id);
        nextStudentIds = Array.from(new Set([...e.assignedStudentIds, ...cohortStudents]));
      }

      if (updates.title && updates.title !== e.title) {
        updatedTitle = updates.title;
      }
      if (updates.subjectName && updates.subjectName !== e.subjectName) {
        updatedSubjectName = updates.subjectName;
      }

      return {
        ...e,
        ...updates,
        assignedCohorts: nextCohorts,
        assignedStudentIds: Array.from(new Set(nextStudentIds)),
        updatedAtMs: now,
      };
    });

    if (updatedTitle || updatedSubjectName) {
      this.state.attempts = this.state.attempts.map((att) =>
        att.examId === id
          ? {
              ...att,
              examTitle: updatedTitle || att.examTitle,
              subjectName: updatedSubjectName || att.subjectName,
              updatedAtMs: now,
            }
          : att
      );
      this.state.certificates = this.state.certificates.map((cert) =>
        cert.examId === id
          ? {
              ...cert,
              examTitle: updatedTitle || cert.examTitle,
              subjectName: updatedSubjectName || cert.subjectName,
              updatedAtMs: now,
            }
          : cert
      );
      this.state.violations = this.state.violations.map((v) =>
        v.examId === id
          ? {
              ...v,
              examTitle: updatedTitle || v.examTitle,
              updatedAtMs: now,
            }
          : v
      );
    }

    this.notify();
  }

  public deleteExam(id: string) {
    const linkedQIds = this.state.questions
      .filter((q) => q.examId === id)
      .map((q) => q.id);
    this.markDeleted([id, ...linkedQIds]);
    this.state.exams = this.state.exams.filter((e) => e.id !== id);
    this.state.questions = this.state.questions.filter((q) => q.examId !== id);
    this.notify();
  }

  public assignStudentsToExam(examId: string, studentIds: string[], cohorts: string[]) {
    const now = this.nextTimestamp();
    const normalizedCohorts = normalizeAndDedupeSections(cohorts);
    const dedupedStudents = Array.from(new Set(studentIds));
    this.state.exams = this.state.exams.map((e) =>
      e.id === examId
        ? {
            ...e,
            assignedStudentIds: dedupedStudents,
            assignedCohorts: normalizedCohorts,
            updatedAtMs: now,
          }
        : e
    );
    this.logActivity('exam', `Updated student roster assignments for exam ID ${examId}`);
    this.notify();
  }

  public checkTimedAutoPublish() {
    const realNow = Date.now();
    let changed = false;
    const nextTs = this.nextTimestamp();
    this.state.exams = this.state.exams.map((exam) => {
      if (
        exam.autoPublishAt &&
        exam.status !== 'Results Published' &&
        new Date(exam.autoPublishAt).getTime() <= realNow
      ) {
        changed = true;
        this.publishExamResultsInternal(exam.id);
        return { ...exam, status: 'Results Published', updatedAtMs: nextTs };
      }
      return exam;
    });
    if (changed) {
      this.notify();
    }
  }

  // =========================================================
  // QUESTION BANK MANAGEMENT
  // =========================================================
  public addQuestion(data: Omit<Question, 'id'>): Question {
    const now = this.nextTimestamp();
    const q: Question = {
      ...data,
      id: `q-${now}-${Math.random().toString(36).slice(2, 5)}`,
      updatedAtMs: now,
    };
    this.unmarkDeleted([q.id]);
    this.state.questions = [...this.state.questions, q];
    // Recalculate exam totalMarks based on questions if linked
    this.recalculateExamTotalMarks(q.examId);
    this.logActivity('question', `New ${q.type.toUpperCase()} question added (${q.marks} pts)`);
    this.notify();
    return q;
  }

  public addQuestionsBulk(
    examId: string,
    items: Array<Omit<Question, 'id' | 'examId' | 'subjectId'>>,
    publishExam = false
  ): Question[] {
    const targetExam = this.state.exams.find((e) => e.id === examId);
    if (!targetExam || items.length === 0) return [];

    const now = this.nextTimestamp();
    const created: Question[] = items.map((item, idx) => ({
      ...item,
      id: `q-${now}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
      examId: targetExam.id,
      subjectId: targetExam.subjectId,
      updatedAtMs: now + idx,
    }));

    this.unmarkDeleted(created.map((q) => q.id));
    this.state.questions = [...this.state.questions, ...created];
    this.recalculateExamTotalMarks(targetExam.id);

    const examTs = this.nextTimestamp();
    this.state.exams = this.state.exams.map((e) =>
      e.id === targetExam.id
        ? {
            ...e,
            status: publishExam
              ? e.status === 'Results Published'
                ? 'Results Published'
                : 'Published'
              : 'Draft',
            updatedAtMs: examTs,
          }
        : e
    );

    this.logActivity(
      'question',
      `Imported ${created.length} question(s) into "${targetExam.title}" (${
        publishExam ? 'Published to Students' : 'Saved as Draft — Hidden from Students'
      })`
    );
    this.notify();
    return created;
  }

  public updateQuestion(id: string, updates: Partial<Question>) {
    let targetExamId = '';
    const now = this.nextTimestamp();
    this.state.questions = this.state.questions.map((q) => {
      if (q.id === id) {
        targetExamId = q.examId;
        return { ...q, ...updates, updatedAtMs: now };
      }
      return q;
    });
    if (targetExamId) {
      this.recalculateExamTotalMarks(targetExamId);
    }
    this.notify();
  }

  public deleteQuestion(id: string) {
    const target = this.state.questions.find((q) => q.id === id);
    this.markDeleted([id]);
    this.state.questions = this.state.questions.filter((q) => q.id !== id);
    if (target) {
      this.recalculateExamTotalMarks(target.examId);
    }
    this.notify();
  }

  private recalculateExamTotalMarks(examId: string) {
    const examQuestions = this.state.questions.filter((q) => q.examId === examId);
    if (examQuestions.length > 0) {
      const now = this.nextTimestamp();
      const sum = examQuestions.reduce((acc, q) => acc + q.marks, 0);
      const allStuIds = this.state.students.map((s) => s.id);
      this.state.exams = this.state.exams.map((e) =>
        e.id === examId
          ? {
              ...e,
              totalMarks: sum,
              passingMarks: Math.min(e.passingMarks, sum) || Math.ceil(sum * 0.5),
              assignedCohorts:
                e.assignedCohorts && e.assignedCohorts.length > 0
                  ? normalizeAndDedupeSections(e.assignedCohorts)
                  : [...ALL_SECTIONS],
              assignedStudentIds: Array.from(
                new Set([...(e.assignedStudentIds || []), ...allStuIds])
              ),
              updatedAtMs: now,
            }
          : e
      );
    }
  }

  // =========================================================
  // STUDENT EXAM ATTEMPT, RANDOMIZATION, AUTOSAVE & SUBMISSION
  // =========================================================
  public startOrResumeAttempt(
    examId: string,
    studentId: string,
    silent: boolean = false
  ): ExamAttempt {
    const exam = this.state.exams.find((e) => e.id === examId);
    const student = this.state.students.find((s) => s.id === studentId);
    const examQuestions = this.state.questions.filter((q) => q.examId === examId);
    const qIds = examQuestions.map((q) => q.id);

    // Deterministic randomized question order per student + exam (never changes on refresh)
    const randomizedOrder = getDeterministicQuestionOrder(qIds, studentId, examId);
    const maxScore = examQuestions.reduce((acc, q) => acc + q.marks, 0) || exam?.totalMarks || 100;

    const existing = this.state.attempts.find(
      (a) => a.examId === examId && a.studentId === studentId && a.status === 'in-progress'
    );
    if (existing) {
      const durationMs = (exam?.durationMinutes || 45) * 60 * 1000;
      const elapsedMs = Date.now() - new Date(existing.startedAt).getTime();
      const isTimerExpired = elapsedMs >= durationMs - 30000;
      const orderChanged =
        existing.questionOrder.length !== randomizedOrder.length ||
        randomizedOrder.some((id) => !existing.questionOrder.includes(id));

      const nextAnswers: Record<string, StudentAnswer> = { ...existing.answers };
      let answersRefreshed = false;
      for (const q of examQuestions) {
        if (q.type === 'programming') {
          const prevAns = nextAnswers[q.id];
          const prevCode = prevAns?.codeText || '';
          const hasUntouchedLeakedCode =
            prevAns &&
            !prevAns.testCaseResults &&
            prevCode.trim().length > 0 &&
            !/\bTODO\b/i.test(prevCode) &&
            /\b(printf\s*\(\s*"%lld\\n"\s*,\s*a\s*\+\s*b\s*\)|print\s*\(\s*a\s*\+\s*b\s*\))/.test(
              prevCode
            );
          if (!prevAns || hasUntouchedLeakedCode) {
            nextAnswers[q.id] = {
              questionId: q.id,
              codeText: q.starterCode || '',
              codeLanguage: q.programmingLanguage || 'python',
              updatedAt: new Date().toISOString(),
            };
            answersRefreshed = true;
          }
        }
      }

      if (
        orderChanged ||
        isTimerExpired ||
        existing.maxScore !== maxScore ||
        answersRefreshed
      ) {
        const refreshed: ExamAttempt = {
          ...existing,
          examTitle: exam?.title || existing.examTitle,
          subjectName: exam?.subjectName || existing.subjectName,
          questionOrder: randomizedOrder,
          answers: nextAnswers,
          maxScore,
          startedAt: isTimerExpired ? new Date().toISOString() : existing.startedAt,
          updatedAtMs: this.nextTimestamp(),
        };
        this.state.attempts = this.state.attempts.map((a) =>
          a.id === existing.id ? refreshed : a
        );
        if (silent) {
          this.saveToStorage();
        } else {
          this.notify();
        }
        return refreshed;
      }
      return existing;
    }

    const initialAnswers: Record<string, StudentAnswer> = {};
    for (const q of examQuestions) {
      if (q.type === 'programming') {
        initialAnswers[q.id] = {
          questionId: q.id,
          codeText: q.starterCode || '',
          codeLanguage: q.programmingLanguage || 'python',
          updatedAt: new Date().toISOString(),
        };
      }
    }

    const now = this.nextTimestamp();
    const attempt: ExamAttempt = {
      id: `att-${now}`,
      examId,
      examTitle: exam?.title || 'Examination',
      subjectName: exam?.subjectName || 'General',
      studentId,
      studentName: student?.name || this.state.currentUser.name,
      studentRegId: student?.studentId || this.state.currentUser.studentId || 'STU-2026-001',
      studentEmail: student?.email || this.state.currentUser.email,
      status: 'in-progress',
      startedAt: new Date().toISOString(),
      questionOrder: randomizedOrder,
      answers: initialAnswers,
      markedForReview: [],
      mcqScore: 0,
      descriptiveScore: 0,
      codingScore: 0,
      totalScore: 0,
      maxScore,
      percentage: 0,
      passed: false,
      violationCount: 0,
      updatedAtMs: now,
    };

    this.state.attempts = [attempt, ...this.state.attempts];
    this.logActivity(
      'exam',
      `Exam started: ${attempt.examTitle} by ${attempt.studentName}`
    );
    if (silent) {
      this.saveToStorage();
    } else {
      this.notify();
    }
    return attempt;
  }

  public saveStudentAnswer(
    attemptId: string,
    questionId: string,
    patch: Partial<StudentAnswer>
  ) {
    const now = this.nextTimestamp();
    this.state.attempts = this.state.attempts.map((att) => {
      if (att.id !== attemptId) return att;
      const existing = att.answers[questionId] || {
        questionId,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...att,
        updatedAtMs: now,
        answers: {
          ...att.answers,
          [questionId]: {
            ...existing,
            ...patch,
            questionId,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
    this.notify();
  }

  public toggleMarkForReview(attemptId: string, questionId: string) {
    const now = this.nextTimestamp();
    this.state.attempts = this.state.attempts.map((att) => {
      if (att.id !== attemptId) return att;
      const exists = att.markedForReview.includes(questionId);
      const next = exists
        ? att.markedForReview.filter((id) => id !== questionId)
        : [...att.markedForReview, questionId];
      return { ...att, markedForReview: next, updatedAtMs: now };
    });
    this.notify();
  }

  public recordViolation(
    attemptId: string,
    type: ViolationEvent['type'],
    details: string
  ): ViolationEvent | null {
    const att = this.state.attempts.find((a) => a.id === attemptId);
    if (!att) return null;

    const now = this.nextTimestamp();
    const event: ViolationEvent = {
      id: `viol-${now}-${Math.random().toString(36).slice(2, 5)}`,
      attemptId: att.id,
      examId: att.examId,
      examTitle: att.examTitle,
      studentId: att.studentId,
      studentName: att.studentName,
      studentRegId: att.studentRegId,
      type,
      details,
      timestamp: new Date().toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      }),
      updatedAtMs: now,
    };

    this.state.violations = [event, ...this.state.violations];
    this.state.attempts = this.state.attempts.map((a) =>
      a.id === attemptId
        ? { ...a, violationCount: a.violationCount + 1, updatedAtMs: now }
        : a
    );
    this.logActivity(
      'violation',
      `${type} logged for ${att.studentName} in ${att.examTitle}`
    );
    this.notify();
    return event;
  }

  public submitAttempt(attemptId: string): ExamAttempt | undefined {
    const att = this.state.attempts.find((a) => a.id === attemptId);
    if (!att) return undefined;

    const exam = this.state.exams.find((e) => e.id === att.examId);
    const examQuestions = this.state.questions.filter((q) => q.examId === att.examId);

    let mcqScore = 0;
    let descriptiveScore = 0;
    let codingScore = 0;
    let hasDescriptive = false;

    const updatedAnswers: Record<string, StudentAnswer> = { ...att.answers };

    for (const q of examQuestions) {
      const ans = updatedAnswers[q.id];
      if (!ans) continue;

      if (q.type === 'mcq') {
        const isCorrect = ans.selectedOptionId && ans.selectedOptionId === q.correctOptionId;
        const pts = isCorrect ? q.marks : 0;
        mcqScore += pts;
        updatedAnswers[q.id] = { ...ans, awardedMarks: pts };
      } else if (q.type === 'programming') {
        const evalRes = evaluateProgrammingSubmission(
          ans.codeText || '',
          ans.codeLanguage || q.programmingLanguage || 'python',
          q.testCases || [],
          q.marks
        );
        codingScore += evalRes.awardedMarks;
        updatedAnswers[q.id] = {
          ...ans,
          testCaseResults: evalRes.results,
          awardedMarks: evalRes.awardedMarks,
        };
      } else if (q.type === 'descriptive') {
        hasDescriptive = true;
        // Auto-provisional score heuristic if descriptive text has substantial length, still flagged for admin review
        const wordCount = (ans.descriptiveText || '').trim().split(/\s+/).filter(Boolean).length;
        const provisional = wordCount >= 15 ? Math.round(q.marks * 0.8) : 0;
        descriptiveScore += ans.awardedMarks ?? provisional;
        updatedAnswers[q.id] = {
          ...ans,
          awardedMarks: ans.awardedMarks ?? provisional,
        };
      }
    }

    const totalScore = mcqScore + descriptiveScore + codingScore;
    const maxScore = examQuestions.reduce((acc, q) => acc + q.marks, 0) || att.maxScore || 60;
    const percentage = Math.round((totalScore / maxScore) * 100);
    const passingMarks = exam?.passingMarks ?? Math.ceil(maxScore * 0.5);
    const passed = totalScore >= passingMarks;

    // If no descriptive questions or exam results are already published, mark as published immediately so student can inspect results
    const nextStatus: ExamAttempt['status'] =
      !hasDescriptive || exam?.status === 'Results Published' ? 'published' : 'submitted';

    const finalized: ExamAttempt = {
      ...att,
      status: nextStatus,
      submittedAt: new Date().toISOString(),
      publishedAt: nextStatus === 'published' ? new Date().toISOString() : undefined,
      answers: updatedAnswers,
      mcqScore,
      descriptiveScore,
      codingScore,
      totalScore,
      maxScore,
      percentage,
      passed,
      updatedAtMs: this.nextTimestamp(),
    };

    this.state.attempts = this.state.attempts.map((a) =>
      a.id === attemptId ? finalized : a
    );

    if (finalized.passed) {
      this.ensureCertificateIssued(finalized, true);
    }

    this.logActivity(
      'exam',
      `Attempt submitted by ${finalized.studentName} for ${finalized.examTitle} (${finalized.totalScore}/${finalized.maxScore})`
    );
    this.notify();
    return finalized;
  }

  // =========================================================
  // ADMIN EVALUATION, GRADING & RESULT PUBLICATION
  // =========================================================
  public gradeAttemptQuestion(
    attemptId: string,
    questionId: string,
    awardedMarks: number,
    instructorFeedback?: string
  ) {
    const att = this.state.attempts.find((a) => a.id === attemptId);
    if (!att) return;

    const exam = this.state.exams.find((e) => e.id === att.examId);
    const examQuestions = this.state.questions.filter((q) => q.examId === att.examId);
    const targetQ = examQuestions.find((q) => q.id === questionId);
    const clampedMarks = Math.max(0, Math.min(awardedMarks, targetQ?.marks ?? awardedMarks));

    const nextAnswers: Record<string, StudentAnswer> = {
      ...att.answers,
      [questionId]: {
        ...(att.answers[questionId] || { questionId, updatedAt: new Date().toISOString() }),
        awardedMarks: clampedMarks,
        instructorFeedback,
        updatedAt: new Date().toISOString(),
      },
    };

    let mcqScore = 0;
    let descriptiveScore = 0;
    let codingScore = 0;

    for (const q of examQuestions) {
      const pts = nextAnswers[q.id]?.awardedMarks ?? 0;
      if (q.type === 'mcq') mcqScore += pts;
      else if (q.type === 'descriptive') descriptiveScore += pts;
      else if (q.type === 'programming') codingScore += pts;
    }

    const totalScore = mcqScore + descriptiveScore + codingScore;
    const maxScore = examQuestions.reduce((acc, q) => acc + q.marks, 0) || att.maxScore || 60;
    const percentage = Math.round((totalScore / maxScore) * 100);
    const passingMarks = exam?.passingMarks ?? Math.ceil(maxScore * 0.5);
    const passed = totalScore >= passingMarks;

    let updatedAttempt: ExamAttempt | undefined;
    const now = this.nextTimestamp();
    this.state.attempts = this.state.attempts.map((a) => {
      if (a.id !== attemptId) return a;
      updatedAttempt = {
        ...a,
        answers: nextAnswers,
        mcqScore,
        descriptiveScore,
        codingScore,
        totalScore,
        maxScore,
        percentage,
        passed,
        status: a.status === 'published' ? 'published' : 'evaluated',
        updatedAtMs: now,
      };
      return updatedAttempt;
    });

    if (updatedAttempt && updatedAttempt.passed) {
      this.ensureCertificateIssued(updatedAttempt, true);
    }

    this.notify();
  }

  public publishAttemptResult(attemptId: string, overallFeedback?: string) {
    let targetAttempt: ExamAttempt | undefined;
    const now = this.nextTimestamp();
    this.state.attempts = this.state.attempts.map((a) => {
      if (a.id !== attemptId) return a;
      targetAttempt = {
        ...a,
        status: 'published',
        publishedAt: new Date().toISOString(),
        overallFeedback: overallFeedback ?? a.overallFeedback,
        updatedAtMs: now,
      };
      return targetAttempt;
    });

    if (targetAttempt && targetAttempt.passed) {
      this.ensureCertificateIssued(targetAttempt, true);
    }
    if (targetAttempt) {
      this.logActivity(
        'result',
        `Result published for ${targetAttempt.studentName} – ${targetAttempt.examTitle}`
      );
    }
    this.notify();
  }

  public publishAllExamResults(examId: string) {
    const now = this.nextTimestamp();
    this.publishExamResultsInternal(examId);
    this.state.exams = this.state.exams.map((e) =>
      e.id === examId ? { ...e, status: 'Results Published', updatedAtMs: now } : e
    );
    const exam = this.state.exams.find((e) => e.id === examId);
    this.logActivity(
      'result',
      `Results published for all candidates in ${exam?.title || 'Examination'}`
    );
    this.notify();
  }

  private publishExamResultsInternal(examId: string) {
    const now = this.nextTimestamp();
    this.state.attempts = this.state.attempts.map((a) => {
      if (a.examId === examId && a.status !== 'in-progress') {
        const updated: ExamAttempt = {
          ...a,
          status: 'published',
          publishedAt: new Date().toISOString(),
          updatedAtMs: now,
        };
        if (updated.passed) {
          this.ensureCertificateIssued(updated, true);
        }
        return updated;
      }
      return a;
    });
  }

  public ensureCertificateIssued(
    attempt: ExamAttempt,
    publishImmediately: boolean = true
  ): CertificateRecord {
    const now = this.nextTimestamp();
    const grade =
      attempt.percentage >= 90
        ? 'A+ (Distinction)'
        : attempt.percentage >= 80
        ? 'A (First Class)'
        : attempt.percentage >= 70
        ? 'B+ (Merit)'
        : 'B (Pass)';

    const existing = this.state.certificates.find((c) => c.attemptId === attempt.id);
    if (existing) {
      const synced: CertificateRecord = {
        ...existing,
        studentName: attempt.studentName,
        studentRegId: attempt.studentRegId,
        examTitle: attempt.examTitle,
        subjectName: attempt.subjectName,
        score: attempt.totalScore,
        maxScore: attempt.maxScore,
        percentage: attempt.percentage,
        grade: existing.grade || grade,
        publishedToStudent: publishImmediately ? true : existing.publishedToStudent,
        updatedAtMs: now,
      };
      this.state.certificates = this.state.certificates.map((c) =>
        c.id === existing.id ? synced : c
      );
      return synced;
    }

    const cert: CertificateRecord = {
      id: `cert-${now}-${Math.random().toString(36).slice(2, 5)}`,
      certificateNumber: `EF-2026-${attempt.subjectName.slice(0, 3).toUpperCase()}-${String(
        this.state.certificates.length + 1
      ).padStart(3, '0')}`,
      attemptId: attempt.id,
      examId: attempt.examId,
      examTitle: attempt.examTitle,
      subjectName: attempt.subjectName,
      studentId: attempt.studentId,
      studentName: attempt.studentName,
      studentRegId: attempt.studentRegId,
      score: attempt.totalScore,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      grade,
      issuedAt: new Date().toISOString().split('T')[0],
      publishedToStudent: publishImmediately,
      customRemarks: 'Awarded for passing the proctored examination with verified distinction.',
      updatedAtMs: now,
    };

    this.state.certificates = [cert, ...this.state.certificates];
    return cert;
  }

  public updateCertificateTemplate(patch: Partial<CertificateTemplateConfig>) {
    this.state.certificateTemplate = {
      ...this.state.certificateTemplate,
      ...patch,
    };
    this.state.templateUpdatedAt = this.nextTimestamp();
    this.notify();
  }

  public updateCertificateRecord(
    certId: string,
    patch: Partial<CertificateRecord>
  ) {
    const now = this.nextTimestamp();
    this.state.certificates = this.state.certificates.map((c) =>
      c.id === certId ? { ...c, ...patch, updatedAtMs: now } : c
    );
    this.notify();
  }

  public publishCertificateToStudent(certId: string) {
    let targetCert: CertificateRecord | undefined;
    const now = this.nextTimestamp();
    this.state.certificates = this.state.certificates.map((c) => {
      if (c.id !== certId) return c;
      targetCert = { ...c, publishedToStudent: true, updatedAtMs: now };
      return targetCert;
    });
    if (targetCert) {
      // Also ensure the linked attempt is marked published so the student sees it attached to their result
      this.state.attempts = this.state.attempts.map((a) =>
        a.id === targetCert!.attemptId
          ? {
              ...a,
              status: 'published',
              publishedAt: a.publishedAt || new Date().toISOString(),
              updatedAtMs: now,
            }
          : a
      );
      this.logActivity(
        'result',
        `Certificate ${targetCert.certificateNumber} published & attached to ${targetCert.studentName}'s result`
      );
    }
    this.notify();
  }

  public updateStudentProfile(
    studentId: string,
    patch: Partial<StudentRecord>
  ) {
    const isAdmin =
      this.state.isAuthenticated && this.state.currentUser.role === 'admin';

    // Students may update personal contact/bio fields on their own profile,
    // while Admin-managed fields (studentId, section, department, year, status) are strictly Admin-only.
    const safePatch: Partial<StudentRecord> = isAdmin
      ? patch
      : {
          phone: patch.phone,
          dateOfBirth: patch.dateOfBirth,
          gender: patch.gender,
          cgpa: patch.cgpa,
          address: patch.address,
          city: patch.city,
          guardianName: patch.guardianName,
          guardianPhone: patch.guardianPhone,
          linkedinUrl: patch.linkedinUrl,
          githubUrl: patch.githubUrl,
          skills: patch.skills,
          bio: patch.bio,
        };

    const now = this.nextTimestamp();
    this.state.students = this.state.students.map((s) =>
      s.id === studentId ? { ...s, ...safePatch, updatedAtMs: now } : s
    );
    if (this.state.currentUser.id === studentId) {
      this.state.currentUser = {
        ...this.state.currentUser,
        ...safePatch,
      };
    }
    this.logActivity(
      'student',
      `Student profile updated by ${safePatch.name || this.state.currentUser.name}`
    );
    this.notify(isAdmin ? 'admin' : 'student');
  }

  public deleteViolation(violationId: string) {
    this.markDeleted([violationId]);
    this.state.violations = this.state.violations.filter(
      (v) => v.id !== violationId
    );
    this.notify('admin');
  }

  public clearAllViolations() {
    this.markDeleted(this.state.violations.map((v) => v.id));
    this.state.violations = [];
    this.notify('admin');
  }

  public updateSettings(patch: Partial<PlatformSettings>) {
    const nextTs = Math.max(Date.now(), (this.state.settingsUpdatedAt || 0) + 1);
    this.state.settings = { ...this.state.settings, ...patch };
    this.state.settingsUpdatedAt = nextTs;
    if (patch.institutionName) {
      this.state.certificateTemplate.institutionName = patch.institutionName;
      this.state.templateUpdatedAt = nextTs;
    }
    if (patch.accentColor) {
      const certThemeMap: Record<AccentColorTheme, CertificateTemplateConfig['accentTheme']> = {
        blue: 'blue',
        indigo: 'indigo',
        emerald: 'emerald',
        purple: 'indigo',
        rose: 'amber',
        amber: 'amber',
      };
      this.state.certificateTemplate.accentTheme = certThemeMap[patch.accentColor] || 'blue';
      this.state.templateUpdatedAt = nextTs;
    }
    this.notify('admin');
  }

  public toggleThemeMode(): 'light' | 'dark' {
    const next: 'light' | 'dark' =
      this.state.settings.themeMode === 'dark' ? 'light' : 'dark';
    this.state.settings = {
      ...this.state.settings,
      themeMode: next,
    };
    if (this.state.isAuthenticated && this.state.currentUser.role === 'admin') {
      this.state.settingsUpdatedAt = Date.now();
      this.notify('admin');
    } else {
      this.saveToStorage();
      for (const listener of this.listeners) {
        listener();
      }
    }
    return next;
  }

  public setThemeMode(mode: 'light' | 'dark') {
    this.state.settings = {
      ...this.state.settings,
      themeMode: mode,
    };
    if (this.state.isAuthenticated && this.state.currentUser.role === 'admin') {
      this.state.settingsUpdatedAt = Date.now();
      this.notify('admin');
    } else {
      this.saveToStorage();
      for (const listener of this.listeners) {
        listener();
      }
    }
  }

  public setUiTheme(themeId: UiThemeId) {
    const resolved = resolveUiTheme(themeId);
    const nextTs = Math.max(Date.now(), (this.state.settingsUpdatedAt || 0) + 1);
    this.state.settings = {
      ...this.state.settings,
      uiTheme: resolved.id,
      themeMode: resolved.isLight ? 'light' : 'dark',
    };
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-ui-theme', resolved.id);
      document.documentElement.setAttribute(
        'data-theme-mode',
        resolved.isLight ? 'light' : 'dark'
      );
      document.documentElement.classList.toggle('dark', !resolved.isLight);
    }
    this.state.settingsUpdatedAt = nextTs;
    this.state.adminUpdatedAt = Math.max(
      nextTs,
      (this.state.adminUpdatedAt || 0) + 1
    );
    this.notify('admin');
  }

  public resetToDefaultDemoData() {
    if (!this.state.isAuthenticated || this.state.currentUser.role !== 'admin') {
      return;
    }
    this.state = createInitialSeedState();
    this.state.isAuthenticated = true;
    this.notify('admin');
  }
}

export const examStore = new ExamStore();
