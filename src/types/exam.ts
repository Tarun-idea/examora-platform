/**
 * ExamFlow Domain Types & Interfaces
 */

export type UserRole = 'admin' | 'student';

export type ProgrammingLanguage =
  | 'javascript'
  | 'python'
  | 'c'
  | 'cpp'
  | 'java'
  | 'csharp'
  | 'go'
  | 'rust';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  department?: string;
  year?: string;
  academicYear?: string; // e.g. '2025', '2026'
  batch?: string; // 'Section A' through 'Section Z' (sec-A to sec-Z)
  recordedAverageScore?: number; // Recorded average marks for student details
  recordedPercentage?: number; // Recorded percentage for student details & section-wise average
  isActive: boolean;
  createdAt: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  confidentialProctoring?: boolean; // Per-subject ON/OFF toggle for Webcam & Audio Proctoring
  batches?: string[]; // Cohorts/sections associated with this subject
  createdAt: string;
}

export type ExamStatus = 'draft' | 'scheduled' | 'published' | 'ongoing' | 'completed' | 'results_published';

export interface Exam {
  id: string;
  subjectId: string;
  subjectName?: string;
  title: string;
  instructions: string;
  startsAt: string; // ISO string
  durationMinutes: number; // Admin configurable, e.g. 30, 60, 90, 120, 180
  totalMarks: number;
  passingMarks: number;
  status: ExamStatus;
  assignedStudentIds: string[]; // Empty means all students (unless filtered by assignedBatches)
  assignedBatches?: string[]; // e.g. ['Section A', 'Section B']
  autoPublishResultsAt?: string; // Optional ISO timestamp for Timed Auto-Publishing
  createdBy?: string;
  createdAt: string;
}

export type QuestionType = 'mcq' | 'descriptive' | 'coding';

export interface CodingTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  marks: number;
}

export interface Question {
  id: string;
  examId: string;
  questionType: QuestionType;
  questionText: string;
  marks: number;
  options?: string[]; // For MCQ
  correctOption?: number; // 0-indexed for MCQ
  explanation?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  // Coding specific
  codingLanguage?: ProgrammingLanguage;
  starterCode?: string;
  sampleInput?: string;
  sampleOutput?: string;
  testCases?: CodingTestCase[];
  // Descriptive specific
  answerLengthGuide?: string;
  rubric?: string;
  order: number;
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'evaluated';

export interface WebcamAuditSnapshot {
  id: string;
  timestamp: string;
  faceStatus: 'single_face_verified' | 'no_face_detected' | 'multiple_faces_detected';
  audioLevel?: 'normal' | 'elevated_voice' | number;
}

export interface StudentAnswer {
  questionId: string;
  selectedOption?: number; // for MCQ
  answerText?: string; // for descriptive
  code?: string; // for coding
  codeLanguage?: ProgrammingLanguage;
  testCaseResults?: {
    testCaseId: string;
    passed: boolean;
    actualOutput: string;
    expectedOutput: string;
    error?: string;
  }[];
  awardedMarks?: number;
  instructorFeedback?: string;
  isMarkedForReview?: boolean;
  updatedAt: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  startedAt: string;
  endsAt: string; // Absolute deadline
  submittedAt?: string;
  status: AttemptStatus;
  randomizedQuestionIds: string[]; // Fixed randomized question sequence for this attempt
  answers: Record<string, StudentAnswer>; // Keyed by questionId
  mcqMarks: number;
  descriptiveMarks: number;
  codingMarks: number;
  totalMarks: number;
  resultReleased: boolean;
  emailNotificationSentAt?: string;
  violationCount: number;
  extraTimeMinutes?: number;
  webcamSnapshots?: WebcamAuditSnapshot[];
}

export type ViolationType =
  | 'fullscreen_exit'
  | 'tab_switch'
  | 'window_blur'
  | 'clipboard_attempt'
  | 'webcam_anomaly';

export interface ViolationLog {
  id: string;
  attemptId: string;
  examId: string;
  examTitle?: string;
  studentId: string;
  studentName?: string;
  type: ViolationType;
  timestamp: string;
  details: string;
}

export type CertificateAccentTheme = 'amber' | 'blue' | 'emerald' | 'indigo';

export interface CertificateTemplate {
  institutionName: string;
  headerBadgeText: string;
  certificateTitle: string;
  presentationLine: string;
  bodyTemplate: string;
  signatoryLeftName: string;
  signatoryLeftTitle: string;
  signatoryRightName: string;
  signatoryRightTitle: string;
  sealText: string;
  footerNote: string;
  accentTheme: CertificateAccentTheme;
  showScoreBreakdown: boolean;
  showCertificateId: boolean;
  updatedAt: string;
}

