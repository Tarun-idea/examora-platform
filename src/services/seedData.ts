import { Subject, Exam, Question, User, ExamAttempt, ViolationLog } from '../types/exam.ts';

export const INITIAL_STUDENTS: User[] = [
  {
    id: 'stu_001',
    name: 'Alex Turner',
    email: 'alex.turner@student.edu',
    studentId: 'STU-2026-001',
    role: 'student',
    department: 'Computer Science & Engineering',
    year: 'Year 3 (2025)',
    academicYear: '2025',
    batch: 'Section A',
    recordedAverageScore: 60,
    recordedPercentage: 100,
    isActive: true,
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'stu_002',
    name: 'Priya Patel',
    email: 'priya.patel@student.edu',
    studentId: 'STU-2026-002',
    role: 'student',
    department: 'Information Technology',
    year: 'Year 2 (2025)',
    academicYear: '2025',
    batch: 'Section A',
    recordedAverageScore: 51,
    recordedPercentage: 85,
    isActive: true,
    createdAt: '2026-09-01T08:15:00Z',
  },
  {
    id: 'stu_003',
    name: 'David Chen',
    email: 'david.chen@student.edu',
    studentId: 'STU-2026-003',
    role: 'student',
    department: 'Software Engineering',
    year: 'Year 4 (2025)',
    academicYear: '2025',
    batch: 'Section B',
    recordedAverageScore: 45,
    recordedPercentage: 75,
    isActive: true,
    createdAt: '2026-09-01T08:30:00Z',
  },
  {
    id: 'stu_004',
    name: 'Maya Lin',
    email: 'maya.lin@student.edu',
    studentId: 'STU-2026-004',
    role: 'student',
    department: 'Data Science & AI',
    year: 'Year 1 (2026)',
    academicYear: '2026',
    batch: 'Section C',
    recordedAverageScore: 54,
    recordedPercentage: 90,
    isActive: true,
    createdAt: '2026-09-01T09:00:00Z',
  },
];

export const INITIAL_ADMIN: User = {
  id: 'admin_001',
  name: 'Dr. Sarah Jenkins',
  email: 'admin@examflow.edu',
  role: 'admin',
  department: 'Faculty of Computing',
  isActive: true,
  createdAt: '2026-08-15T09:00:00Z',
};

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub_py',
    code: 'CS101',
    name: 'Python Programming',
    description: 'Foundations of procedural, functional, and object-oriented programming in Python.',
    status: 'active',
    confidentialProctoring: true,
    batches: ['Section A', 'Section B'],
    createdAt: '2026-09-10T10:00:00Z',
  },
  {
    id: 'sub_dsa',
    code: 'CS202',
    name: 'Data Structures & Algorithms',
    description: 'Algorithmic complexity, trees, graphs, sorting algorithms, and dynamic programming.',
    status: 'active',
    confidentialProctoring: true,
    batches: ['Section A', 'Section B'],
    createdAt: '2026-09-10T10:15:00Z',
  },
  {
    id: 'sub_dbms',
    code: 'CS303',
    name: 'Database Management Systems',
    description: 'Relational database schema design, SQL querying, indexing, and ACID transactions.',
    status: 'active',
    confidentialProctoring: false,
    batches: ['Section A'],
    createdAt: '2026-09-10T10:30:00Z',
  },
  {
    id: 'sub_cn',
    code: 'CS404',
    name: 'Computer Networks',
    description: 'OSI and TCP/IP architecture, socket programming, routing protocols, and network security.',
    status: 'active',
    confidentialProctoring: false,
    batches: ['Section B'],
    createdAt: '2026-09-10T10:45:00Z',
  },
];

const now = new Date();
const currentIso = now.toISOString();
const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
const tomorrowIso = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
const yesterdayIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam_py_final',
    subjectId: 'sub_py',
    subjectName: 'Python Programming',
    title: 'Python Programming Comprehensive Assessment',
    instructions: `1. Ensure you remain in full-screen mode throughout the exam duration.
2. Navigating away, switching tabs, or minimizing the window triggers an automatic violation flag.
3. Questions are presented in randomized order. Your answers are autosaved continuously.
4. For coding questions, you can test against sample test cases before submitting.
5. All calculations are governed by the server deadline.`,
    startsAt: tenMinutesAgo, // Currently ongoing & active!
    durationMinutes: 90,
    totalMarks: 100,
    passingMarks: 40,
    status: 'published',
    assignedStudentIds: [], // All students
    createdBy: 'admin_001',
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'exam_dbms_mid',
    subjectId: 'sub_dbms',
    subjectName: 'Database Management Systems',
    title: 'DBMS SQL & Normalization Midterm',
    instructions: 'Covers 1NF to BCNF, Relational Algebra, and complex SQL joins. No external documentation allowed.',
    startsAt: tomorrowIso,
    durationMinutes: 60,
    totalMarks: 50,
    passingMarks: 25,
    status: 'scheduled',
    assignedStudentIds: ['stu_001', 'stu_002'],
    createdBy: 'admin_001',
    createdAt: '2026-10-05T12:00:00Z',
  },
  {
    id: 'exam_dsa_eval',
    subjectId: 'sub_dsa',
    subjectName: 'Data Structures & Algorithms',
    title: 'Algorithms & Complexity Sprint Assessment',
    instructions: 'Time complexity analysis, recursion trees, and dynamic programming implementations.',
    startsAt: tomorrowIso,
    durationMinutes: 45,
    totalMarks: 60,
    passingMarks: 24,
    status: 'scheduled',
    assignedStudentIds: ['stu_001', 'stu_003'],
    createdBy: 'admin_001',
    createdAt: '2026-10-15T09:00:00Z',
  },
  {
    id: 'exam_cn_draft',
    subjectId: 'sub_cn',
    subjectName: 'Computer Networks',
    title: 'Network Protocols & Socket Architecture Final',
    instructions: 'Covers TCP 3-way handshake, subnetting, and socket programming.',
    startsAt: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 120,
    totalMarks: 100,
    passingMarks: 50,
    status: 'draft',
    assignedStudentIds: [],
    createdBy: 'admin_001',
    createdAt: '2026-10-20T14:00:00Z',
  },
];

export const INITIAL_QUESTIONS: Question[] = [
  // Questions for exam_py_final
  {
    id: 'q_py_01',
    examId: 'exam_py_final',
    questionType: 'mcq',
    questionText: 'Which keyword is used to define a function in Python?',
    marks: 10,
    options: ['function', 'def', 'define', 'func'],
    correctOption: 1,
    explanation: 'In Python, functions are defined using the def keyword followed by the function name and parentheses.',
    difficulty: 'Easy',
    order: 1,
  },
  {
    id: 'q_py_02',
    examId: 'exam_py_final',
    questionType: 'mcq',
    questionText: 'What is the average time complexity of retrieving a value by key in a Python dictionary (hash map)?',
    marks: 10,
    options: ['O(n)', 'O(1)', 'O(log n)', 'O(n log n)'],
    correctOption: 1,
    explanation: 'Python dictionaries are implemented using hash tables, offering amortized O(1) constant time lookup.',
    difficulty: 'Medium',
    order: 2,
  },
  {
    id: 'q_py_03',
    examId: 'exam_py_final',
    questionType: 'mcq',
    questionText: 'Which of the following built-in collection data types is immutable in Python?',
    marks: 10,
    options: ['list', 'set', 'tuple', 'dict'],
    correctOption: 2,
    explanation: 'Tuples cannot be modified after creation, making them immutable and hashable.',
    difficulty: 'Easy',
    order: 3,
  },
  {
    id: 'q_py_04',
    examId: 'exam_py_final',
    questionType: 'descriptive',
    questionText: 'Explain the purpose and mechanics of Generator functions in Python. Contrast how the "yield" keyword differs in memory management and execution state from a standard "return" statement. Include a concise code snippet.',
    marks: 20,
    answerLengthGuide: 'Approximately 150-250 words with a short code example.',
    rubric: 'Explanation of lazy evaluation (7 marks), memory contrast with return (7 marks), code example (6 marks).',
    order: 4,
  },
  {
    id: 'q_py_05',
    examId: 'exam_py_final',
    questionType: 'coding',
    questionText: 'Write a program that takes two integers separated by a space from standard input and prints their sum to standard output.',
    marks: 25,
    codingLanguage: 'javascript',
    starterCode: `// Read two integers from input and print their sum
const [a, b] = input.trim().split(/\\s+/).map(Number);
console.log(a + b);`,
    sampleInput: '10 20',
    sampleOutput: '30',
    testCases: [
      {
        id: 'tc_py_5_1',
        input: '10 20',
        expectedOutput: '30',
        isHidden: false,
        marks: 10,
      },
      {
        id: 'tc_py_5_2',
        input: '125 75',
        expectedOutput: '200',
        isHidden: true,
        marks: 7.5,
      },
      {
        id: 'tc_py_5_3',
        input: '-15 45',
        expectedOutput: '30',
        isHidden: true,
        marks: 7.5,
      },
    ],
    order: 5,
  },
  {
    id: 'q_py_06',
    examId: 'exam_py_final',
    questionType: 'coding',
    questionText: 'Write a program to reverse a given string provided on standard input. Print the reversed string.',
    marks: 25,
    codingLanguage: 'javascript',
    starterCode: `// Reverse the input string
const str = input.trim();
console.log(str.split('').reverse().join(''));`,
    sampleInput: 'examflow',
    sampleOutput: 'wolfmaxe',
    testCases: [
      {
        id: 'tc_py_6_1',
        input: 'examflow',
        expectedOutput: 'wolfmaxe',
        isHidden: false,
        marks: 10,
      },
      {
        id: 'tc_py_6_2',
        input: 'hello world',
        expectedOutput: 'dlrow olleh',
        isHidden: true,
        marks: 7.5,
      },
      {
        id: 'tc_py_6_3',
        input: 'racecar',
        expectedOutput: 'racecar',
        isHidden: true,
        marks: 7.5,
      },
    ],
    order: 6,
  },

  // Questions for exam_dsa_eval (Algorithms)
  {
    id: 'q_dsa_01',
    examId: 'exam_dsa_eval',
    questionType: 'mcq',
    questionText: 'What is the worst-case time complexity of QuickSort?',
    marks: 15,
    options: ['O(n log n)', 'O(n)', 'O(n^2)', 'O(2^n)'],
    correctOption: 2,
    explanation: 'When the chosen pivot is consistently the smallest or largest element, QuickSort degrades to O(n^2).',
    difficulty: 'Medium',
    order: 1,
  },
  {
    id: 'q_dsa_02',
    examId: 'exam_dsa_eval',
    questionType: 'mcq',
    questionText: 'Which data structure is primarily utilized for Breadth-First Search (BFS) graph traversal?',
    marks: 15,
    options: ['Stack', 'Queue', 'Binary Heap', 'Hash Set'],
    correctOption: 1,
    explanation: 'BFS uses a FIFO Queue to visit nodes level-by-level.',
    difficulty: 'Easy',
    order: 2,
  },
  {
    id: 'q_dsa_03',
    examId: 'exam_dsa_eval',
    questionType: 'coding',
    questionText: 'Write a program to calculate the factorial of a non-negative integer n provided on standard input.',
    marks: 30,
    codingLanguage: 'javascript',
    starterCode: `const n = parseInt(input.trim(), 10);
let ans = 1;
for (let i = 2; i <= n; i++) ans *= i;
console.log(ans);`,
    sampleInput: '5',
    sampleOutput: '120',
    testCases: [
      { id: 'tc_dsa_1', input: '5', expectedOutput: '120', isHidden: false, marks: 15 },
      { id: 'tc_dsa_2', input: '0', expectedOutput: '1', isHidden: true, marks: 15 },
    ],
    order: 3,
  },
];

export const INITIAL_ATTEMPTS: Record<string, ExamAttempt> = {
  att_demo_alex: {
    id: 'att_demo_alex',
    examId: 'exam_dsa_eval',
    studentId: 'stu_001',
    studentName: 'Alex Turner',
    studentEmail: 'alex.turner@student.edu',
    startedAt: '2026-10-31T17:57:00.000Z',
    endsAt: '2026-10-31T18:42:00.000Z',
    submittedAt: '2026-10-31T18:32:00.000Z',
    status: 'submitted',
    randomizedQuestionIds: ['q_dsa_01', 'q_dsa_02', 'q_dsa_03'],
    resultReleased: true,
    totalMarks: 60,
    mcqMarks: 30,
    descriptiveMarks: 0,
    codingMarks: 30,
    violationCount: 0,
    answers: {
      q_dsa_01: {
        questionId: 'q_dsa_01',
        selectedOption: 2, // O(n^2) - Correct
        awardedMarks: 15,
        updatedAt: '2026-10-31T18:05:00.000Z',
      },
      q_dsa_02: {
        questionId: 'q_dsa_02',
        selectedOption: 1, // Queue - Correct
        awardedMarks: 15,
        updatedAt: '2026-10-31T18:12:00.000Z',
      },
      q_dsa_03: {
        questionId: 'q_dsa_03',
        code: `const n = parseInt(input.trim(), 10);\nlet ans = 1;\nfor (let i = 2; i <= n; i++) ans *= i;\nconsole.log(ans);`,
        codeLanguage: 'javascript',
        testCaseResults: [
          { testCaseId: 'tc_dsa_1', passed: true, actualOutput: '120', expectedOutput: '120' },
          { testCaseId: 'tc_dsa_2', passed: true, actualOutput: '1', expectedOutput: '1' },
        ],
        awardedMarks: 30,
        updatedAt: '2026-10-31T18:28:00.000Z',
      },
    },
  },
  att_demo_david: {
    id: 'att_demo_david',
    examId: 'exam_dsa_eval',
    studentId: 'stu_003',
    studentName: 'David Chen',
    studentEmail: 'david.chen@student.edu',
    startedAt: '2026-10-31T18:02:00.000Z',
    endsAt: '2026-10-31T18:47:00.000Z',
    submittedAt: '2026-10-31T18:40:00.000Z',
    status: 'submitted',
    randomizedQuestionIds: ['q_dsa_01', 'q_dsa_02', 'q_dsa_03'],
    resultReleased: true,
    totalMarks: 45,
    mcqMarks: 15,
    descriptiveMarks: 0,
    codingMarks: 30,
    violationCount: 1,
    answers: {
      q_dsa_01: {
        questionId: 'q_dsa_01',
        selectedOption: 0, // O(n log n) - Incorrect
        awardedMarks: 0,
        updatedAt: '2026-10-31T18:10:00.000Z',
      },
      q_dsa_02: {
        questionId: 'q_dsa_02',
        selectedOption: 1, // Queue - Correct
        awardedMarks: 15,
        updatedAt: '2026-10-31T18:18:00.000Z',
      },
      q_dsa_03: {
        questionId: 'q_dsa_03',
        code: `const n = parseInt(input.trim(), 10);\nlet ans = 1;\nfor (let i = 2; i <= n; i++) ans *= i;\nconsole.log(ans);`,
        codeLanguage: 'javascript',
        testCaseResults: [
          { testCaseId: 'tc_dsa_1', passed: true, actualOutput: '120', expectedOutput: '120' },
          { testCaseId: 'tc_dsa_2', passed: true, actualOutput: '1', expectedOutput: '1' },
        ],
        awardedMarks: 30,
        updatedAt: '2026-10-31T18:35:00.000Z',
      },
    },
  },
};

export const INITIAL_VIOLATIONS: ViolationLog[] = [
  {
    id: 'viol_001',
    attemptId: 'att_demo_david',
    examId: 'exam_dsa_eval',
    examTitle: 'Algorithms & Complexity Sprint Assessment',
    studentId: 'stu_003',
    studentName: 'David Chen',
    type: 'tab_switch',
    details: 'Browser visibility lost (switched tab or minimized window)',
    timestamp: '2026-10-31T18:33:06.000Z',
  },
];

