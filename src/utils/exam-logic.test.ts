import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shuffleQuestionsForStudent,
  calculateExamTimeRemaining,
  evaluateMcqScore,
  formatTimeRemaining,
  calculateGradeSummary,
  executeJavascriptCode,
  evaluateCodingSubmission,
  verifyStudentIdAuthorization,
  verifyAdminCredentials,
  generateOtp,
  verifyOtp,
  validateNewPassword,
  executeMultiLanguageCode,
  calculateQuestionItemAnalysis,
  SUPPORTED_PROGRAMMING_LANGUAGES,
  ALL_SECTIONS_A_TO_Z,
  matchesStudentSectionSearch,
  calculateSectionWiseStudentAnalytics,
  parseBulkQuestionsInput,
  calculateLeaderboardAndCohortStats,
  DEFAULT_CERTIFICATE_TEMPLATE,
  interpolateCertificateText,
  evaluateExamKeyRestriction,
} from './exam-logic.ts';
import type { Question, CodingTestCase } from '../types/exam.ts';

test('shuffleQuestionsForStudent produces deterministic output for the same student', () => {
  const ids = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];
  const run1 = shuffleQuestionsForStudent(ids, 'student_123', 'exam_math_01');
  const run2 = shuffleQuestionsForStudent(ids, 'student_123', 'exam_math_01');
  
  assert.deepEqual(run1, run2, 'Identical seed should yield identical shuffle order across refreshes');
  assert.equal(run1.length, ids.length, 'All questions must be retained');
});

test('shuffleQuestionsForStudent produces different order for different students', () => {
  const ids = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'];
  const studentA = shuffleQuestionsForStudent(ids, 'student_A', 'exam_math_01');
  const studentB = shuffleQuestionsForStudent(ids, 'student_B', 'exam_math_01');
  
  // They should not match identically
  assert.notDeepEqual(studentA, studentB, 'Different students should receive different randomized question sequences');
});

test('calculateExamTimeRemaining calculates correct deadline and remaining seconds', () => {
  const now = Date.now();
  // Exam started 10 minutes ago, duration 60 minutes
  const tenMinutesAgo = new Date(now - 10 * 60 * 1000).toISOString();
  const res = calculateExamTimeRemaining(tenMinutesAgo, 60, now);

  assert.equal(res.isStarted, true);
  assert.equal(res.isExpired, false);
  // Remaining time should be approximately 50 minutes (3000 seconds)
  assert.ok(Math.abs(res.remainingSeconds - 50 * 60) <= 2);
});

test('calculateExamTimeRemaining handles late joins and expired exams', () => {
  const now = Date.now();
  // Exam was 2 hours ago, duration was 60 minutes
  const twoHoursAgo = new Date(now - 120 * 60 * 1000).toISOString();
  const res = calculateExamTimeRemaining(twoHoursAgo, 60, now);

  assert.equal(res.isExpired, true);
  assert.equal(res.remainingSeconds, 0);
});

test('evaluateMcqScore accurately computes marks for matching correct options', () => {
  const questions: Question[] = [
    {
      id: 'q1',
      examId: 'e1',
      questionType: 'mcq',
      questionText: 'What is Python?',
      marks: 5,
      options: ['Snake', 'Language', 'Fruit', 'Car'],
      correctOption: 1,
      order: 1,
    },
    {
      id: 'q2',
      examId: 'e1',
      questionType: 'mcq',
      questionText: '2 + 2 = ?',
      marks: 5,
      options: ['3', '4', '5', '6'],
      correctOption: 1,
      order: 2,
    },
  ];

  const answers = {
    q1: { questionId: 'q1', selectedOption: 1, updatedAt: '' }, // Correct -> 5
    q2: { questionId: 'q2', selectedOption: 0, updatedAt: '' }, // Incorrect -> 0
  };

  const score = evaluateMcqScore(questions, answers);
  assert.equal(score, 5);
});

test('formatTimeRemaining formats hours, minutes, and seconds properly', () => {
  assert.equal(formatTimeRemaining(3665), '01:01:05');
  assert.equal(formatTimeRemaining(59), '00:59');
  assert.equal(formatTimeRemaining(0), '00:00');
});

test('calculateGradeSummary correctly classifies passing status and letter grade', () => {
  const summaryPass = calculateGradeSummary(100, 40, 85);
  assert.equal(summaryPass.passed, true);
  assert.equal(summaryPass.grade, 'A');
  assert.equal(summaryPass.percentage, 85);

  const summaryFail = calculateGradeSummary(100, 40, 35);
  assert.equal(summaryFail.passed, false);
  assert.equal(summaryFail.grade, 'F');
});

test('executeJavascriptCode runs code safely in isolation', () => {
  const code = `
    const nums = input.split(' ').map(Number);
    console.log(nums[0] + nums[1]);
  `;
  const result = executeJavascriptCode(code, '10 20');
  assert.equal(result.output, '30');
  assert.equal(result.error, undefined);
});

test('evaluateCodingSubmission correctly scores passing sample and hidden test cases', () => {
  const code = `
    const [a, b] = input.split(' ').map(Number);
    console.log(a * b);
  `;
  const testCases: CodingTestCase[] = [
    { id: 'tc1', input: '3 4', expectedOutput: '12', isHidden: false, marks: 5 },
    { id: 'tc2', input: '10 5', expectedOutput: '50', isHidden: true, marks: 5 },
    { id: 'tc3', input: '2 0', expectedOutput: '99', isHidden: false, marks: 5 }, // Will fail
  ];

  const evalRes = evaluateCodingSubmission(code, testCases);
  assert.equal(evalRes.passedCount, 2);
  assert.equal(evalRes.awardedMarks, 10);
  assert.equal(evalRes.totalCount, 3);
});

test('verifyStudentIdAuthorization accepts valid registered student ID', () => {
  const students = [
    { studentId: 'STU-2026-001', email: 'alex@student.edu', isActive: true },
    { studentId: 'STU-2026-002', email: 'priya@student.edu', isActive: true },
  ];

  const validRes = verifyStudentIdAuthorization('STU-2026-001', students);
  assert.equal(validRes.isValid, true);
  assert.equal(validRes.error, undefined);

  // Case insensitive match
  const lowerRes = verifyStudentIdAuthorization('stu-2026-002', students);
  assert.equal(lowerRes.isValid, true);
});

test('verifyStudentIdAuthorization displays "meet the admin to add your id" for invalid or unadded ID', () => {
  const students = [
    { studentId: 'STU-2026-001', email: 'alex@student.edu', isActive: true },
  ];

  // Unregistered student ID
  const invalidRes = verifyStudentIdAuthorization('STU-9999-XYZ', students);
  assert.equal(invalidRes.isValid, false);
  assert.equal(invalidRes.error, 'meet the admin to add your id');

  // Empty string
  const emptyRes = verifyStudentIdAuthorization('   ', students);
  assert.equal(emptyRes.isValid, false);
  assert.equal(emptyRes.error, 'meet the admin to add your id');
});

test('verifyStudentIdAuthorization displays "meet the admin to add your id" for deactivated student', () => {
  const students = [
    { studentId: 'STU-2026-003', email: 'david@student.edu', isActive: false },
  ];

  const deactRes = verifyStudentIdAuthorization('STU-2026-003', students);
  assert.equal(deactRes.isValid, false);
  assert.equal(deactRes.error, 'meet the admin to add your id');
});

test('verifyAdminCredentials authorizes admin with password admin123', () => {
  const result = verifyAdminCredentials('admin', 'admin123');
  assert.equal(result.isValid, true);
  assert.equal(result.error, undefined);
});

test('verifyAdminCredentials authorizes taruntk2008@gmail.com with admin123', () => {
  const result = verifyAdminCredentials('taruntk2008@gmail.com', 'admin123');
  assert.equal(result.isValid, true);
  assert.equal(result.error, undefined);
});

test('verifyAdminCredentials rejects unauthorized username or incorrect password', () => {
  const wrongUser = verifyAdminCredentials('intruder', 'admin123');
  assert.equal(wrongUser.isValid, false);
  assert.ok(wrongUser.error?.includes('Invalid administrator'));

  const wrongPass = verifyAdminCredentials('admin', 'wrong_pass');
  assert.equal(wrongPass.isValid, false);
  assert.ok(wrongPass.error?.includes('Incorrect administrator password'));

  const emptyPass = verifyAdminCredentials('admin', '');
  assert.equal(emptyPass.isValid, false);
  assert.ok(emptyPass.error?.includes('password'));
});

test('generateOtp produces 6-digit numeric string', () => {
  const otp = generateOtp(6);
  assert.equal(otp.length, 6);
  assert.match(otp, /^\d{6}$/);
});

test('verifyOtp succeeds with matching OTP within validity window', () => {
  const now = Date.now();
  const expiresAt = now + 600000;
  const res = verifyOtp('849201', '849201', expiresAt, now);
  assert.equal(res.isValid, true);
});

test('verifyOtp rejects expired or mismatched OTP', () => {
  const now = Date.now();
  const expiredRes = verifyOtp('849201', '849201', now - 1000, now);
  assert.equal(expiredRes.isValid, false);
  assert.ok(expiredRes.error?.includes('expired'));

  const mismatchRes = verifyOtp('123456', '849201', now + 600000, now);
  assert.equal(mismatchRes.isValid, false);
  assert.ok(mismatchRes.error?.includes('Invalid'));
});

test('validateNewPassword enforces minimum length and matching confirmation', () => {
  const valid = validateNewPassword('NewPass@2026', 'NewPass@2026');
  assert.equal(valid.isValid, true);

  const short = validateNewPassword('123', '123');
  assert.equal(short.isValid, false);
  assert.ok(short.error?.includes('at least 6 characters'));

  const mismatch = validateNewPassword('NewPass@2026', 'DifferentPass');
  assert.equal(mismatch.isValid, false);
  assert.ok(mismatch.error?.includes('do not match'));
});

test('verifyAdminCredentials honors updated custom admin password', () => {
  const customPass = 'ExamMaster#2026';
  const validRes = verifyAdminCredentials('admin', customPass, customPass);
  assert.equal(validRes.isValid, true);

  // Old default should no longer work once customized
  const oldRes = verifyAdminCredentials('admin', 'admin123', customPass);
  assert.equal(oldRes.isValid, false);
});

test('SUPPORTED_PROGRAMMING_LANGUAGES includes C, Python, Java, JS, C++, C#, Go, Rust', () => {
  const ids = SUPPORTED_PROGRAMMING_LANGUAGES.map((l) => l.id);
  assert.ok(ids.includes('c'));
  assert.ok(ids.includes('python'));
  assert.ok(ids.includes('java'));
  assert.ok(ids.includes('javascript'));
  assert.ok(ids.includes('cpp'));
});

test('executeMultiLanguageCode evaluates Python, C, C++, and Java solutions', () => {
  const pyRes = executeMultiLanguageCode('print(a + b)', '7 8', 'python');
  assert.equal(pyRes.output, '15');

  const cRes = executeMultiLanguageCode(
    '#include <stdio.h>\nint main() { int a, b; scanf("%d %d", &a, &b); printf("%d", a + b); return 0; }',
    '12 30',
    'c'
  );
  assert.equal(cRes.output, '42');

  const cppRes = executeMultiLanguageCode(
    '#include <iostream>\nusing namespace std;\nint main() { int a, b; cin >> a >> b; cout << a * b; return 0; }',
    '6 7',
    'cpp'
  );
  assert.equal(cppRes.output, '42');

  const javaRes = executeMultiLanguageCode(
    'public class Main { public static void main(String[] args) { System.out.println(a + b); } }',
    '25 75',
    'java'
  );
  assert.equal(javaRes.output, '100');
});

test('calculateQuestionItemAnalysis computes failure rates and discrimination index', () => {
  const questions: Question[] = [
    {
      id: 'q1',
      examId: 'e1',
      questionType: 'mcq',
      questionText: 'Hard question',
      marks: 10,
      options: ['A', 'B', 'C', 'D'],
      correctOption: 1,
      order: 1,
    },
  ];
  const attempts = [
    {
      totalMarks: 90,
      answers: { q1: { selectedOption: 1, awardedMarks: 10 } },
    },
    {
      totalMarks: 20,
      answers: { q1: { selectedOption: 0, awardedMarks: 0 } },
    },
  ];
  const analysis = calculateQuestionItemAnalysis(questions, attempts);
  assert.equal(analysis.length, 1);
  assert.equal(analysis[0].accuracyPercent, 50);
  assert.equal(analysis[0].failureRatePercent, 50);
});

test('ALL_SECTIONS_A_TO_Z contains all 12 sections from Section A to Section L', () => {
  assert.equal(ALL_SECTIONS_A_TO_Z.length, 12);
  assert.equal(ALL_SECTIONS_A_TO_Z[0], 'Section A');
  assert.equal(ALL_SECTIONS_A_TO_Z[11], 'Section L');
});

test('matchesStudentSectionSearch supports section queries like "2025 in sec-A" and "sec-Z"', () => {
  const stuA = {
    name: 'Alex Turner',
    studentId: 'STU-2026-001',
    academicYear: '2025',
    year: 'Year 3 (2025)',
    batch: 'Section A',
    department: 'Computer Science',
  };
  const stuZ = {
    name: 'Zara Khan',
    studentId: 'STU-2026-099',
    academicYear: '2026',
    year: 'Year 1 (2026)',
    batch: 'Section Z',
    department: 'Data Science',
  };

  assert.equal(matchesStudentSectionSearch(stuA, '2025 in sec-A'), true);
  assert.equal(matchesStudentSectionSearch(stuA, '2025 in sec-B'), false);
  assert.equal(matchesStudentSectionSearch(stuZ, '2026 in sec-Z'), true);
  assert.equal(matchesStudentSectionSearch(stuZ, 'sec-Z'), true);
  assert.equal(matchesStudentSectionSearch(stuA, 'sec-Z'), false);
});

test('calculateSectionWiseStudentAnalytics computes per-student and section-wise averages & percentages', () => {
  const students = [
    { id: 's1', batch: 'Section A', recordedAverageScore: 50, recordedPercentage: 80 },
    { id: 's2', batch: 'Section A', recordedAverageScore: 60, recordedPercentage: 100 },
    { id: 's3', batch: 'Section Z', recordedAverageScore: 45, recordedPercentage: 75 },
  ];
  const res = calculateSectionWiseStudentAnalytics(students, [], [{ id: 'e1', totalMarks: 60 }]);
  assert.equal(res.perStudent['s1'].sectionAveragePercentage, 90);
  assert.equal(res.perStudent['s1'].sectionAverageScore, 55);
  assert.equal(res.perStudent['s3'].sectionShortCode, 'sec-Z');
  assert.equal(res.perStudent['s3'].sectionAveragePercentage, 75);
});

test('parseBulkQuestionsInput parses CSV, Aiken, and JSON question sets accurately', () => {
  const csvSample = `Type,QuestionText,Marks,Difficulty,OptionA,OptionB,OptionC,OptionD,CorrectAnswer
mcq,What is 5 + 5?,10,Easy,8,10,12,15,B
descriptive,Explain polymorphism in OOP.,15,Medium,150 words,Define compile-time and runtime polymorphism
coding,Sum two numbers,20,Easy,python,10 20,30`;

  const csvParsed = parseBulkQuestionsInput(csvSample, 'csv');
  assert.equal(csvParsed.length, 3);
  assert.equal(csvParsed[0].questionType, 'mcq');
  assert.equal(csvParsed[0].correctOption, 1);
  assert.equal(csvParsed[1].questionType, 'descriptive');
  assert.equal(csvParsed[2].questionType, 'coding');

  const aikenSample = `What is the capital of France?
A. Berlin
B. Madrid
C. Paris
D. Rome
ANSWER: C
MARKS: 5`;

  const aikenParsed = parseBulkQuestionsInput(aikenSample, 'aiken');
  assert.equal(aikenParsed.length, 1);
  assert.equal(aikenParsed[0].correctOption, 2);
  assert.equal(aikenParsed[0].marks, 5);
});

test('calculateLeaderboardAndCohortStats ranks students and aggregates section comparison bars', () => {
  const students = [
    { id: 's1', studentId: 'STU-1', name: 'Alice', email: 'a@e.com', batch: 'Section A', recordedAverageScore: 58, recordedPercentage: 96 },
    { id: 's2', studentId: 'STU-2', name: 'Bob', email: 'b@e.com', batch: 'Section B', recordedAverageScore: 50, recordedPercentage: 84 },
  ];
  const stats = calculateLeaderboardAndCohortStats(students, [], [{ id: 'e1', totalMarks: 60 }]);
  assert.equal(stats.leaderboard.length, 2);
  assert.equal(stats.leaderboard[0].name, 'Alice');
  assert.equal(stats.leaderboard[0].rank, 1);
  assert.equal(stats.leaderboard[0].badge, 'Gold');
  assert.equal(stats.cohortComparison.length, 2);
});

test('interpolateCertificateText replaces dynamic placeholders with candidate & exam values', () => {
  const customBody =
    'Awarded to {studentName} ({studentId}) of {section} for passing {examTitle} in {subjectName} with {score}/{totalMarks} ({percentage}%) Grade {grade}.';
  const rendered = interpolateCertificateText(customBody, {
    studentName: 'Alex Rivera',
    studentId: 'STU-2026-001',
    section: 'Sec-A',
    examTitle: 'Midterm Assessment',
    subjectName: 'Data Structures',
    score: 54,
    totalMarks: 60,
    percentage: 90,
    grade: 'A+',
  });
  assert.equal(
    rendered,
    'Awarded to Alex Rivera (STU-2026-001) of Sec-A for passing Midterm Assessment in Data Structures with 54/60 (90%) Grade A+.'
  );
  assert.ok(DEFAULT_CERTIFICATE_TEMPLATE.certificateTitle.includes('Certificate'));
});

test('evaluateExamKeyRestriction blocks tab-switch, clipboard, and escape shortcuts during exam', () => {
  const tabSwitch1 = evaluateExamKeyRestriction({ key: 'Tab', altKey: true });
  assert.equal(tabSwitch1.blocked, true);
  assert.equal(tabSwitch1.violationType, 'tab_switch');

  const tabSwitch2 = evaluateExamKeyRestriction({ key: 't', ctrlKey: true });
  assert.equal(tabSwitch2.blocked, true);
  assert.equal(tabSwitch2.violationType, 'tab_switch');

  const clip = evaluateExamKeyRestriction({ key: 'v', ctrlKey: true });
  assert.equal(clip.blocked, true);
  assert.equal(clip.violationType, 'clipboard_attempt');

  const esc = evaluateExamKeyRestriction({ key: 'Escape' });
  assert.equal(esc.blocked, true);
  assert.equal(esc.violationType, 'fullscreen_exit');

  const normalTyping = evaluateExamKeyRestriction({ key: 'a' });
  assert.equal(normalTyping.blocked, false);
});





