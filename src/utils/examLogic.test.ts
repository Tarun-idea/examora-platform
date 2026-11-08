import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDeterministicQuestionOrder,
  calculateRemainingSeconds,
  formatCountdownTimer,
  evaluateProgrammingSubmission,
  classifyViolationRisk,
  mergeStudentListsCrossDevice,
  verifyCrossDeviceStudentLogin,
  mergeAuthoritativeAdminState,
} from './examLogic.ts';
import {
  createHardCProgramsDrafts,
  createMediumCProgramsDrafts,
} from './questionPaperParser.ts';

test('getDeterministicQuestionOrder returns same order on repeated calls (refresh safe) and differs across students', () => {
  const qIds = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];
  const orderA1 = getDeterministicQuestionOrder(qIds, 'student-1', 'exam-101');
  const orderA2 = getDeterministicQuestionOrder(qIds, 'student-1', 'exam-101');
  const orderB = getDeterministicQuestionOrder(qIds, 'student-2', 'exam-101');

  assert.deepEqual(orderA1, orderA2);
  assert.equal(orderA1.length, qIds.length);
  assert.deepEqual([...orderA1].sort(), [...qIds].sort());
  assert.notDeepEqual(orderA1, orderB);
});

test('calculateRemainingSeconds respects exam duration and caps late joiners at scheduled deadline', () => {
  const startIso = '2026-11-05T10:00:00.000Z';
  const startMs = new Date(startIso).getTime();
  // 90 mins exam, 30 mins elapsed -> 60 mins (3600s) left
  const remNormal = calculateRemainingSeconds(
    startIso,
    90,
    startMs + 30 * 60 * 1000
  );
  assert.equal(remNormal, 3600);

  // Late student starts at 10:40, but hard exam window ends at 11:30 (only 50 mins left instead of 90)
  const lateStartIso = '2026-11-05T10:40:00.000Z';
  const deadlineIso = '2026-11-05T11:30:00.000Z';
  const remLate = calculateRemainingSeconds(
    lateStartIso,
    90,
    new Date(lateStartIso).getTime(),
    deadlineIso
  );
  assert.equal(remLate, 50 * 60);
});

test('formatCountdownTimer formats seconds into HH:MM:SS', () => {
  assert.equal(formatCountdownTimer(5075), '01:24:35');
  assert.equal(formatCountdownTimer(0), '00:00:00');
});

test('evaluateProgrammingSubmission executes Python and JS against sample & hidden test cases', () => {
  const testCases = [
    { id: 'tc1', input: '10 20', expectedOutput: '30', isHidden: false },
    { id: 'tc2', input: '100 250', expectedOutput: '350', isHidden: true },
  ];

  const pyRes = evaluateProgrammingSubmission(
    'a, b = map(int, input().split())\nprint(a + b)',
    'python',
    testCases,
    20
  );
  assert.equal(pyRes.awardedMarks, 20);
  assert.equal(pyRes.results.every((r) => r.passed), true);

  const jsRes = evaluateProgrammingSubmission(
    'const [a, b] = input.trim().split(/\\s+/).map(Number); console.log(a + b);',
    'javascript',
    testCases,
    20
  );
  assert.equal(jsRes.awardedMarks, 20);

  const cRes = evaluateProgrammingSubmission(
    '#include <stdio.h>\nint main() { int a, b; scanf("%d %d", &a, &b); printf("%d\\n", a + b); return 0; }',
    'c',
    testCases,
    20
  );
  assert.equal(cRes.awardedMarks, 20);

  const cppRes = evaluateProgrammingSubmission(
    '#include <iostream>\nusing namespace std;\nint main() { int a, b; cin >> a >> b; cout << a + b; return 0; }',
    'cpp',
    testCases,
    20
  );
  assert.equal(cppRes.awardedMarks, 20);

  const javaRes = evaluateProgrammingSubmission(
    'import java.util.*; public class Main { public static void main(String[] args) { Scanner s = new Scanner(System.in); System.out.println(s.nextInt() + s.nextInt()); } }',
    'java',
    testCases,
    20
  );
  assert.equal(javaRes.awardedMarks, 20);
});

test('classifyViolationRisk returns Low, Medium, High accurately', () => {
  assert.equal(classifyViolationRisk(1).label, 'Low (1x)');
  assert.equal(classifyViolationRisk(2).label, 'Medium (2x)');
  assert.equal(classifyViolationRisk(4).label, 'High (4x)');
});

test('mergeStudentListsCrossDevice merges Admin-registered students across devices and respects deletions', () => {
  const deviceAStudents = [
    {
      id: 'stu-2025pecai',
      studentId: '2025PECAI',
      name: 'Student 2025PECAI',
      email: '2025pecai@student.edu',
      password: '123',
      status: 'Active' as const,
      updatedAtMs: 1000,
    },
    {
      id: 'stu-new',
      studentId: '2025PECAI02',
      name: 'Arun Kumar',
      email: 'arun@student.edu',
      password: '123',
      status: 'Active' as const,
      updatedAtMs: 2000,
    },
  ];
  const deviceBStudents: typeof deviceAStudents = [];

  const merged = mergeStudentListsCrossDevice(deviceBStudents, deviceAStudents, []);
  assert.equal(merged.length, 2);

  // Student 2025pecai can login on Device B with password '123', their Student ID, or blank password
  const loginWith123 = verifyCrossDeviceStudentLogin('2025pecai', '123', merged);
  assert.equal(loginWith123.success, true);
  assert.equal(loginWith123.student?.studentId, '2025PECAI');

  const loginWithId = verifyCrossDeviceStudentLogin('2025pecai02', '2025pecai02', merged);
  assert.equal(loginWithId.success, true);

  // Unregistered student ID is rejected
  const unregistered = verifyCrossDeviceStudentLogin('unknown999', '123', merged);
  assert.equal(unregistered.success, false);
});

test('mergeAuthoritativeAdminState keeps Admin data permanent across devices and prevents student or fresh-device overwrites', () => {
  const permanentAdminState = {
    students: [
      {
        id: 'stu-2025pecai',
        studentId: '2025PECAI',
        name: 'Student 2025PECAI',
        email: '2025pecai@student.edu',
        password: '123',
        status: 'Active' as const,
        updatedAtMs: 5000,
      },
    ],
    subjects: [{ id: 'sub-101', code: 'CS101', name: 'C Programming' }],
    exams: [{ id: 'exam-101', title: 'Midterm Assessment' }],
    questions: [{ id: 'q-101', examId: 'exam-101', text: 'Print Hello World' }],
    deletedIds: ['stu-removed'],
    adminUpdatedAt: 5000,
  };

  // 1. A student device syncing must NEVER alter Admin students, subjects, exams, or questions
  const afterStudentSync = mergeAuthoritativeAdminState(
    permanentAdminState,
    {
      students: [],
      subjects: [],
      exams: [],
      questions: [],
      deletedIds: [],
      adminUpdatedAt: 99999,
    },
    'student'
  );
  assert.equal(afterStudentSync.students.length, 1);
  assert.equal(afterStudentSync.subjects.length, 1);
  assert.equal(afterStudentSync.exams.length, 1);
  assert.equal(afterStudentSync.questions.length, 1);

  // 2. A fresh uninitialized browser booting with adminUpdatedAt: 0 must NEVER overwrite saved Admin state
  const afterFreshDeviceBoot = mergeAuthoritativeAdminState(
    permanentAdminState,
    {
      students: [],
      subjects: [],
      exams: [],
      questions: [],
      adminUpdatedAt: 0,
    },
    'admin'
  );
  assert.equal(afterFreshDeviceBoot.subjects.length, 1);
  assert.equal(afterFreshDeviceBoot.exams.length, 1);

  // 3. Only an explicit newer Admin modification (adminUpdatedAt > 5000) updates the permanent Admin state
  const afterAdminAddStudent = mergeAuthoritativeAdminState(
    permanentAdminState,
    {
      students: [
        ...permanentAdminState.students,
        {
          id: 'stu-2025pecai99',
          studentId: '2025PECAI99',
          name: 'New Student 99',
          email: 'stu99@student.edu',
          password: '123',
          status: 'Active' as const,
          updatedAtMs: 6000,
        },
      ],
      adminUpdatedAt: 6000,
    },
    'admin'
  );
  assert.equal(afterAdminAddStudent.students.length, 2);
  assert.equal(afterAdminAddStudent.adminUpdatedAt, 6000);
});

test('UI_THEME_TEMPLATES enforces single permanent Amethyst & Cobalt (Purple & Royal Blue) theme', async () => {
  const { UI_THEME_TEMPLATES, resolveUiTheme, DEFAULT_UI_THEME } = await import(
    './uiThemes.ts'
  );
  assert.equal(UI_THEME_TEMPLATES.length, 1);
  assert.equal(UI_THEME_TEMPLATES[0].id, 'amethyst-cobalt');
  assert.equal(UI_THEME_TEMPLATES[0].name, 'Amethyst & Cobalt');

  const resolved = resolveUiTheme('any-other-theme');
  assert.equal(resolved.id, DEFAULT_UI_THEME);
  assert.equal(resolved.isLight, false);
});

test('evaluateProgrammingSubmission executes all 3 C programs from Hard_C-programs PDF accurately', () => {
  // 1. Move All Zeros to the End
  const moveZerosCode = `#include <stdio.h>
int main() {
  int n, a[100], i, j = 0;
  scanf("%d", &n);
  for(i = 0; i < n; i++) scanf("%d", &a[i]);
  for(i = 0; i < n; i++) {
    if(a[i] != 0) a[j++] = a[i];
  }
  while(j < n) a[j++] = 0;
  for(i = 0; i < n; i++) printf("%d ", a[i]);
  return 0;
}`;
  const moveZerosRes = evaluateProgrammingSubmission(
    moveZerosCode,
    'c',
    [
      { id: 'tc-1', input: '6 0 1 0 3 12 0', expectedOutput: '1 3 12 0 0 0', isHidden: false },
      { id: 'tc-2', input: '5 / 1 2 3 4 5', expectedOutput: '1 2 3 4 5', isHidden: true },
      { id: 'tc-3', input: '5 / 0 0 1 2 3', expectedOutput: '1 2 3 0 0', isHidden: true },
      { id: 'tc-4', input: '4 / 0 0 0 0', expectedOutput: '0 0 0 0', isHidden: true },
    ],
    20
  );
  assert.equal(moveZerosRes.awardedMarks, 20);
  assert.equal(moveZerosRes.results.every((r) => r.passed), true);

  // 2. Check Whether Two Strings Are Anagrams
  const anagramCode = `#include <stdio.h>
#include <string.h>
int main() {
  char a[100], b[100];
  int count[26] = {0};
  int i;
  scanf("%99s", a);
  scanf("%99s", b);
  if(strlen(a) != strlen(b)) { printf("Not Anagram"); return 0; }
  for(i = 0; a[i] != '\\0'; i++) {
    count[a[i] - 'a']++;
    count[b[i] - 'a']--;
  }
  for(i = 0; i < 26; i++) {
    if(count[i] != 0) { printf("Not Anagram"); return 0; }
  }
  printf("Anagram");
  return 0;
}`;
  const anagramRes = evaluateProgrammingSubmission(
    anagramCode,
    'c',
    [
      { id: 'tc-1', input: 'listen Silent', expectedOutput: 'Anagram', isHidden: false },
      { id: 'tc-2', input: 'race / care', expectedOutput: 'Anagram', isHidden: true },
      { id: 'tc-3', input: 'hello / world', expectedOutput: 'Not Anagram', isHidden: true },
      { id: 'tc-4', input: 'abc / abcd', expectedOutput: 'Not Anagram', isHidden: true },
      { id: 'tc-5', input: 'aabb / bbaa', expectedOutput: 'Anagram', isHidden: true },
    ],
    20
  );
  assert.equal(anagramRes.awardedMarks, 20);
  assert.equal(anagramRes.results.every((r) => r.passed), true);

  // 3. Rotate an Array by K Positions
  const rotateCode = `#include <stdio.h>
int main() {
  int n, a[100], temp[100];
  int k, i;
  scanf("%d", &n);
  for(i = 0; i < n; i++) scanf("%d", &a[i]);
  scanf("%d", &k);
  k = k % n;
  for(i = 0; i < n; i++) temp[(i + k) % n] = a[i];
  for(i = 0; i < n; i++) printf("%d ", temp[i]);
  return 0;
}`;
  const rotateRes = evaluateProgrammingSubmission(
    rotateCode,
    'c',
    [
      { id: 'tc-1', input: '5 1 2 3 4 5 2', expectedOutput: '4 5 1 2 3', isHidden: false },
      { id: 'tc-2', input: '4 / 1 2 3 4 / 1', expectedOutput: '4 1 2 3', isHidden: true },
      { id: 'tc-3', input: '3 / 1 2 3 / 3', expectedOutput: '1 2 3', isHidden: true },
      { id: 'tc-4', input: '3 / 1 2 3 / 5', expectedOutput: '2 3 1', isHidden: true },
    ],
    20
  );
  assert.equal(rotateRes.awardedMarks, 20);
  assert.equal(rotateRes.results.every((r) => r.passed), true);
});

test('evaluateProgrammingSubmission executes all 12 C programs from medium_c_programs PDF (Set 1, Set 2, Set 3) accurately', () => {
  // Set 1 - 1. Find the Area of a Circle
  const circleCode = `#include <stdio.h>
int main() {
  float r, area;
  scanf("%f", &r);
  area = 3.14 * r * r;
  printf("Area = %.2f", area);
  return 0;
}`;
  assert.equal(
    evaluateProgrammingSubmission(
      circleCode,
      'c',
      [
        { id: 'tc-1', input: '5', expectedOutput: 'Area = 78.50', isHidden: false },
        { id: 'tc-2', input: '10', expectedOutput: 'Area = 314.00', isHidden: true },
      ],
      10
    ).awardedMarks,
    10
  );

  // Set 1 - 2. Print Number Triangle
  const triangleCode = `#include <stdio.h>
int main() {
  int i, j;
  for(i = 1; i <= 5; i++) {
    for(j = 1; j <= i; j++)
      printf("%d ", j);
    printf("\\n");
  }
  return 0;
}`;
  assert.equal(
    evaluateProgrammingSubmission(
      triangleCode,
      'c',
      [
        { id: 'tc-1', input: '-', expectedOutput: '1 / 1 2 / 1 2 3 / 1 2 3 4 / 1 2 3 4 5', isHidden: false },
      ],
      10
    ).awardedMarks,
    10
  );

  // Set 1 - a. Sum of Two Numbers
  const sumTwoCode = `#include <stdio.h>
int main() {
  int a,b;
  scanf("%d%d",&a,&b);
  printf("%d",a+b);
  return 0;
}`;
  assert.equal(
    evaluateProgrammingSubmission(
      sumTwoCode,
      'c',
      [
        { id: 'tc-1', input: '10 20', expectedOutput: '30', isHidden: false },
        { id: 'tc-2', input: '25 75', expectedOutput: '100', isHidden: true },
      ],
      10
    ).awardedMarks,
    10
  );

  // Set 1 - b. Find the Last Digit
  const lastDigitCode = `#include <stdio.h>
int main() {
  int n;
  scanf("%d",&n);
  printf("%d",n%10);
  return 0;
}`;
  assert.equal(
    evaluateProgrammingSubmission(
      lastDigitCode,
      'c',
      [
        { id: 'tc-1', input: '1234', expectedOutput: '4', isHidden: false },
        { id: 'tc-2', input: '987', expectedOutput: '7', isHidden: true },
      ],
      10
    ).awardedMarks,
    10
  );

  // Set 2 - 3. Check Even or Odd
  const evenOddCode = `#include <stdio.h>
int main() {
  int n;
  scanf("%d", &n);
  if(n % 2 == 0) printf("Even");
  else printf("Odd");
  return 0;
}`;
  assert.equal(
    evaluateProgrammingSubmission(
      evenOddCode,
      'c',
      [
        { id: 'tc-1', input: '4', expectedOutput: 'Even', isHidden: false },
        { id: 'tc-2', input: '7', expectedOutput: 'Odd', isHidden: true },
      ],
      10
    ).awardedMarks,
    10
  );

  // Set 2 - 4. Print Star Pattern
  const starCode = `#include <stdio.h>
int main() {
  int i,j;
  for(i=1;i<=3;i++) {
    for(j=1;j<=3;j++)
      printf("* ");
    printf("\\n");
  }
  return 0;
}`;
  assert.equal(
    evaluateProgrammingSubmission(
      starCode,
      'c',
      [
        { id: 'tc-1', input: '-', expectedOutput: '* * * / * * * / * * *', isHidden: false },
      ],
      10
    ).awardedMarks,
    10
  );

  // Set 2 - c. Reverse a Number
  const reverseNumCode = `#include <stdio.h>
int main() {
  int n,rev=0;
  scanf("%d",&n);
  while(n>0) {
    rev=rev*10+n%10;
    n=n/10;
  }
  printf("%d",rev);
  return 0;
}`;
  assert.equal(
    evaluateProgrammingSubmission(
      reverseNumCode,
      'c',
      [
        { id: 'tc-1', input: '12345', expectedOutput: '54321', isHidden: false },
        { id: 'tc-2', input: '908', expectedOutput: '809', isHidden: true },
      ],
      10
    ).awardedMarks,
    10
  );

  // Set 2 - d. Print Multiplication Table
  const multTableCode = `#include <stdio.h>
int main() {
  int n,i;
  scanf("%d",&n);
  for(i=1;i<=10;i++)
    printf("%d\\n",n*i);
  return 0;
}`;
  assert.equal(
    evaluateProgrammingSubmission(
      multTableCode,
      'c',
      [
        { id: 'tc-1', input: '5', expectedOutput: '5 10 15 20 25 30 35 40 45 50', isHidden: false },
        { id: 'tc-2', input: '2', expectedOutput: '2 4 6 8 10 12 14 16 18 20', isHidden: true },
      ],
      10
    ).awardedMarks,
    10
  );

  // Set 3 - 5. Print Numbers from 1 to 10
  const oneToTenCode = `#include <stdio.h>
int main() {
  int i;
  for(i = 1; i <= 10; i++)
    printf("%d ", i);
  return 0;
}`;
  assert.equal(
    evaluateProgrammingSubmission(
      oneToTenCode,
      'c',
      [
        { id: 'tc-1', input: '-', expectedOutput: '1 2 3 4 5 6 7 8 9 10', isHidden: false },
      ],
      10
    ).awardedMarks,
    10
  );

  // Set 3 - 6. Find Sum of Array Elements
  const arraySumCode = `#include <stdio.h>
int main() {
  int a[5], i, sum = 0;
  for(i = 0; i < 5; i++) scanf("%d", &a[i]);
  for(i = 0; i < 5; i++) sum = sum + a[i];
  printf("Sum = %d", sum);
  return 0;
}`;
  assert.equal(
    evaluateProgrammingSubmission(
      arraySumCode,
      'c',
      [
        { id: 'tc-1', input: '10 20 30 40 50', expectedOutput: 'Sum = 150', isHidden: false },
        { id: 'tc-2', input: '1 2 3 4 5', expectedOutput: 'Sum = 15', isHidden: true },
      ],
      10
    ).awardedMarks,
    10
  );

  // Set 3 - e. Find the Length of a String
  const strLenCode = `#include <stdio.h>
int main() {
  char str[100];
  int i=0;
  scanf("%99s",str);
  while(str[i]!='\\0')
    i++;
  printf("%d",i);
  return 0;
}`;
  assert.equal(
    evaluateProgrammingSubmission(
      strLenCode,
      'c',
      [
        { id: 'tc-1', input: 'Hello', expectedOutput: '5', isHidden: false },
        { id: 'tc-2', input: 'Programming', expectedOutput: '11', isHidden: true },
      ],
      10
    ).awardedMarks,
    10
  );

  // Set 3 - f. Print Fibonacci Series
  const fibSeriesCode = `#include <stdio.h>
int main() {
  int n,a=0,b=1,c,i;
  scanf("%d",&n);
  for(i=1;i<=n;i++) {
    printf("%d ",a);
    c=a+b;
    a=b;
    b=c;
  }
  return 0;
}`;
  assert.equal(
    evaluateProgrammingSubmission(
      fibSeriesCode,
      'c',
      [
        { id: 'tc-1', input: '6', expectedOutput: '0 1 1 2 3 5', isHidden: false },
        { id: 'tc-2', input: '5', expectedOutput: '0 1 1 2 3', isHidden: true },
      ],
      10
    ).awardedMarks,
    10
  );
});

test('questionPaperParser analyzes Input/Output formats, synthesizes test cases, and generates starter code skeletons (never solution code)', () => {
  const hardDrafts = createHardCProgramsDrafts();
  assert.equal(hardDrafts.length, 3);

  for (const q of hardDrafts) {
    assert.equal(q.type, 'programming');
    assert.equal(q.programmingLanguage, 'c');
    assert.ok(q.inputFormat.length > 10);
    assert.ok(q.outputFormat.length > 10);
    assert.ok(q.testCases.length >= 3);
    assert.ok(q.starterCode.includes('// TODO:'));
    // Starter code skeleton must NOT pass test cases on its own
    const starterEval = evaluateProgrammingSubmission(
      q.starterCode,
      q.programmingLanguage,
      q.testCases,
      q.marks
    );
    assert.equal(starterEval.awardedMarks, 0);
  }

  const mediumDrafts = createMediumCProgramsDrafts();
  assert.equal(mediumDrafts.length, 12);

  for (const q of mediumDrafts) {
    assert.equal(q.type, 'programming');
    assert.equal(q.programmingLanguage, 'c');
    assert.ok(q.inputFormat.length > 5);
    assert.ok(q.outputFormat.length > 5);
    assert.ok(q.testCases.length >= 1);
    assert.ok(q.starterCode.includes('// TODO:'));
    const starterEval = evaluateProgrammingSubmission(
      q.starterCode,
      q.programmingLanguage,
      q.testCases,
      q.marks
    );
    assert.equal(starterEval.awardedMarks, 0);
  }
});

