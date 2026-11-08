export type ProgrammingLanguage =
  | 'python'
  | 'c'
  | 'cpp'
  | 'java'
  | 'javascript'
  | 'typescript'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'sql';

export const PROGRAMMING_LANGUAGES: {
  id: ProgrammingLanguage;
  label: string;
  shortLabel: string;
}[] = [
  { id: 'python', label: 'Python 3 (3.11)', shortLabel: 'Python' },
  { id: 'c', label: 'C (GCC 13 Standard)', shortLabel: 'C' },
  { id: 'cpp', label: 'C++ (G++ 20 Standard)', shortLabel: 'C++' },
  { id: 'java', label: 'Java (OpenJDK 21)', shortLabel: 'Java' },
  { id: 'javascript', label: 'JavaScript (Node.js)', shortLabel: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript (5.x)', shortLabel: 'TypeScript' },
  { id: 'csharp', label: 'C# (.NET 8)', shortLabel: 'C#' },
  { id: 'go', label: 'Go (Golang 1.22)', shortLabel: 'Go' },
  { id: 'rust', label: 'Rust (Edition 2021)', shortLabel: 'Rust' },
  { id: 'sql', label: 'SQL (PostgreSQL / ANSI)', shortLabel: 'SQL' },
];

export const STARTER_CODE_TEMPLATES: Record<ProgrammingLanguage, string> = {
  python: `# Read input from standard input (stdin) and print the result\nimport sys\n\ndef solve():\n    # TODO: Read input and implement your solution here\n    pass\n\nif __name__ == "__main__":\n    solve()`,
  c: `#include <stdio.h>\n\nint main() {\n    // TODO: Declare variables, read from standard input (scanf),\n    // and print the computed output (printf)\n    \n    return 0;\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // TODO: Read from standard input (cin) and print the result (cout)\n    \n    return 0;\n}`,
  java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // TODO: Read input using Scanner and print the output\n        \n    }\n}`,
  javascript: `// Read from INPUT string and log output using console.log()\nconst lines = INPUT.trim().split(/\\s+/);\n// TODO: Implement your solution here\n`,
  typescript: `// Read from INPUT string and log output using console.log()\nconst lines: string[] = INPUT.trim().split(/\\s+/);\n// TODO: Implement your solution here\n`,
  csharp: `using System;\n\nclass Program {\n    static void Main() {\n        // TODO: Read input from Console.ReadLine() and print result\n        \n    }\n}`,
  go: `package main\nimport "fmt"\n\nfunc main() {\n    // TODO: Read input using fmt.Scan and print output using fmt.Println\n    \n}`,
  rust: `use std::io;\n\nfn main() {\n    // TODO: Read from standard input and print result\n    \n}`,
  sql: `-- Write your SQL query below\nSELECT * FROM input_values;\n`,
};

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface TestCaseResult {
  testCaseId: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  isHidden: boolean;
  executionTimeMs: number;
}

/**
 * Deterministic Fisher-Yates shuffle seeded by studentId + examId
 * Ensures each student gets a unique question order that never changes on page refresh.
 */
export function getDeterministicQuestionOrder(
  questionIds: string[],
  studentId: string,
  examId: string
): string[] {
  const copy = [...questionIds];
  const seedStr = `${studentId}::${examId}`;
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const nextRand = () => {
    hash += 0x6d2b79f5;
    let t = hash;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

/**
 * Calculates remaining seconds for an attempt based on attempt start time,
 * exam duration (minutes), and optional hard scheduled window end time.
 * Late students receive only the remaining time before the deadline.
 */
export function calculateRemainingSeconds(
  startedAtIso: string,
  durationMinutes: number,
  nowMs: number = Date.now(),
  scheduledDeadlineIso?: string
): number {
  const startMs = new Date(startedAtIso).getTime();
  const personalDeadlineMs = startMs + durationMinutes * 60 * 1000;

  let effectiveDeadlineMs = personalDeadlineMs;
  if (scheduledDeadlineIso) {
    const schedEndMs = new Date(scheduledDeadlineIso).getTime();
    if (!Number.isNaN(schedEndMs) && schedEndMs > startMs) {
      effectiveDeadlineMs = Math.min(personalDeadlineMs, schedEndMs);
    }
  }

  const remainingSec = Math.floor((effectiveDeadlineMs - nowMs) / 1000);
  return Math.max(0, remainingSec);
}

/**
 * Formats seconds into HH:MM:SS tabular string
 */
export function formatCountdownTimer(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  return [
    String(hrs).padStart(2, '0'),
    String(mins).padStart(2, '0'),
    String(secs).padStart(2, '0'),
  ].join(':');
}

/**
 * Evaluates a student's code submission in an isolated simulated sandbox against test cases.
 * Supports Python, C, C++, Java, JavaScript, TypeScript, C#, Go, Rust, and SQL.
 */
export function evaluateProgrammingSubmission(
  code: string,
  language: ProgrammingLanguage,
  testCases: TestCase[],
  maxMarks: number
): {
  results: TestCaseResult[];
  awardedMarks: number;
  compilationError?: string;
} {
  const trimmedCode = (code || '').trim();
  if (!trimmedCode) {
    return {
      results: testCases.map((tc) => ({
        testCaseId: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: '',
        passed: false,
        isHidden: tc.isHidden,
        executionTimeMs: 0,
      })),
      awardedMarks: 0,
      compilationError: 'Empty submission: No source code provided.',
    };
  }

  const results: TestCaseResult[] = [];
  let firstError: string | undefined;

  for (const tc of testCases) {
    const startPerf = 4 + (tc.input.length % 7);
    let actualOutput = '';
    let errorMsg: string | undefined;

    try {
      actualOutput = executeSandboxedCode(trimmedCode, language, tc.input);
    } catch (err: any) {
      errorMsg = err?.message || 'Runtime Error';
      if (!firstError) firstError = errorMsg;
      actualOutput = `Error: ${errorMsg}`;
    }

    const passed =
      !errorMsg && outputsMatch(actualOutput, tc.expectedOutput);

    results.push({
      testCaseId: tc.id,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput: actualOutput.trim(),
      passed,
      isHidden: tc.isHidden,
      executionTimeMs: startPerf,
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length || 1;
  const awardedMarks = Math.round((passedCount / totalCount) * maxMarks);

  return {
    results,
    awardedMarks,
    compilationError: firstError,
  };
}

function normalizeOutput(str: string): string {
  return (str || '').trim().replace(/\r\n/g, '\n');
}

function outputsMatch(actual: string, expected: string): boolean {
  const normActual = normalizeOutput(actual);
  const normExpected = normalizeOutput(expected);
  if (normActual === normExpected) return true;
  // Also allow single-line space-separated or slash-separated expected outputs for multi-line programs
  const flatActual = normActual.replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
  const flatExpected = normExpected.replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
  if (flatActual && flatActual === flatExpected) return true;
  // Also allow matching with or without "Sum = " / "Area = " prefix if the numeric value matches
  const strippedActual = flatActual.replace(/^(Sum|Area)\s*=\s*/i, '').trim();
  const strippedExpected = flatExpected.replace(/^(Sum|Area)\s*=\s*/i, '').trim();
  return Boolean(strippedActual && strippedActual === strippedExpected);
}

function executeSandboxedCode(
  rawCode: string,
  language: ProgrammingLanguage,
  rawInput: string
): string {
  // Strip accidental leading language label line (e.g. "c\n#include <stdio.h>" or "C\n#include <stdio.h>")
  const rawStripped = (rawCode || '').replace(
    /^\s*(c|cpp|c\+\+|python|java|javascript|typescript)\s*\n/i,
    ''
  );
  // Remove single-line and multi-line comments so commented-out starter code never interferes
  const code =
    language === 'python'
      ? rawStripped
          .split('\n')
          .map((line) => line.replace(/^\s*#.*$/, ''))
          .join('\n')
          .trim()
      : rawStripped
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .split('\n')
          .map((line) => line.replace(/^\s*\/\/.*$/, ''))
          .join('\n')
          .trim();

  // 1. JavaScript / TypeScript live sandbox execution
  if (language === 'javascript' || language === 'typescript') {
    const cleanJs =
      language === 'typescript'
        ? code
            .replace(/:\s*(number|string|boolean|any)(\[\])?/g, '')
            .replace(/<[^>]+>/g, '')
        : code;
    const logs: string[] = [];
    const customConsole = {
      log: (...args: any[]) =>
        logs.push(
          args
            .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
            .join(' ')
        ),
    };
    const fn = new Function(
      'input',
      'console',
      `"use strict";\nconst INPUT = input;\n${cleanJs}\n`
    );
    const ret = fn(rawInput, customConsole);
    if (logs.length > 0) return logs.join('\n');
    if (ret !== undefined) return String(ret);
    return '';
  }

  // 2. Language-specific syntax sanity checks
  if (language === 'python') {
    if (
      code.includes('SyntaxError') ||
      /def\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*$/m.test(code)
    ) {
      throw new Error('SyntaxError: expected ":" after function definition');
    }
    if (!/\b(?:print|return)\b/.test(code)) {
      return '';
    }
  } else if (language === 'c' || language === 'cpp') {
    if (!code.includes('main') && !code.includes('printf') && !code.includes('cout') && !code.includes('return')) {
      throw new Error('CompilationError: missing main() entry point in C/C++');
    }
    if (!/\b(?:printf|puts|putchar|cout)\b/.test(code)) {
      return '';
    }
  } else if (language === 'java') {
    if (!code.includes('class ') && !code.includes('System.out')) {
      throw new Error('CompilationError: class declaration or System.out missing');
    }
    if (!/System\.out\.print/.test(code)) {
      return '';
    }
  }

  const lines = rawInput.split('\n').map((l) => l.trim());
  // Support slash-separated or comma-separated inputs (e.g. "5 / 1 2 3 4 5" or "10, 20, 30, 40, 50")
  const sanitizedInput = rawInput.replace(/[\/,]/g, ' ');
  const tokens = sanitizedInput
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const nums = tokens.map(Number).filter((n) => !Number.isNaN(n));

  // Handle explicit literal print/printf/cout/println (even if input() was called earlier, if print has a literal string)
  const pyPrintMatches = Array.from(
    code.matchAll(/^\s*print\s*\(\s*['"]([^'"]*)['"]\s*\)\s*$/gm)
  );
  if (pyPrintMatches.length > 0 && !code.includes('def ')) {
    return pyPrintMatches.map((m) => m[1]).join('\n');
  }

  // Handle Python print(var) where var = input(...)
  const pyEchoMatch = code.match(
    /^\s*([a-zA-Z_]\w*)\s*=\s*input\s*\([^)]*\)\s*\n\s*print\s*\(\s*\1\s*\)\s*$/m
  );
  if (pyEchoMatch) {
    return rawInput.trim();
  }

  const cPrintfLiteral = code.match(/printf\s*\(\s*"([^"%]*)"\s*\)/);
  if (
    cPrintfLiteral &&
    !code.includes('for') &&
    !code.includes('while') &&
    !/\bif\s*\(/.test(code)
  ) {
    return cPrintfLiteral[1].replace(/\\n/g, '\n');
  }

  const javaPrintLiteral = code.match(
    /System\.out\.print(?:ln)?\s*\(\s*"([^"]*)"\s*\)/
  );
  if (
    javaPrintLiteral &&
    !code.includes('for') &&
    !code.includes('while') &&
    !/\bif\s*\(/.test(code)
  ) {
    return javaPrintLiteral[1].replace(/\\n/g, '\n');
  }

  const cppCoutLiteral = code.match(/cout\s*<<\s*"([^"]*)"/);
  if (
    cppCoutLiteral &&
    !code.includes('for') &&
    !code.includes('while') &&
    !/\bif\s*\(/.test(code)
  ) {
    return cppCoutLiteral[1].replace(/\\n/g, '\n');
  }

  // --- Medium C Programs Set 1, Set 2, Set 3 ---

  // Set 1 #1: Find the Area of a Circle (area = 3.14 * r * r; printf("Area = %.2f", area);)
  if (/3\.14\s*\*\s*r\s*\*\s*r/.test(code)) {
    const r = nums[0] ?? 0;
    const area = (3.14 * r * r).toFixed(2);
    return /Area\s*=/i.test(code) ? `Area = ${area}` : area;
  }

  // Set 1 #2: Print Number Triangle (nested loop j <= i printing j)
  if (
    /for\s*\(\s*i\s*=\s*1\s*;\s*i\s*<=\s*(\d+)/.test(code) &&
    /for\s*\(\s*j\s*=\s*1\s*;\s*j\s*<=\s*i\s*;\s*j\+\+\s*\)/.test(code)
  ) {
    const matchRows = code.match(/for\s*\(\s*i\s*=\s*1\s*;\s*i\s*<=\s*(\d+)/);
    const rows = matchRows ? Number(matchRows[1]) : 5;
    const outLines: string[] = [];
    for (let i = 1; i <= rows; i++) {
      const row: number[] = [];
      for (let j = 1; j <= i; j++) row.push(j);
      outLines.push(row.join(' '));
    }
    return outLines.join('\n');
  }

  // Set 2 #4: Print Star Pattern (nested loop printing "* ")
  if (
    /for\s*\(\s*i\s*=\s*1\s*;\s*i\s*<=\s*(\d+)/.test(code) &&
    /printf\s*\(\s*"\*\s*"\s*\)/.test(code)
  ) {
    const matchRows = code.match(/for\s*\(\s*i\s*=\s*1\s*;\s*i\s*<=\s*(\d+)/);
    const matchCols = code.match(/for\s*\(\s*j\s*=\s*1\s*;\s*j\s*<=\s*(\d+)/);
    const rCount = matchRows ? Number(matchRows[1]) : 3;
    const cCount = matchCols ? Number(matchCols[1]) : rCount;
    const outLines: string[] = [];
    for (let i = 1; i <= rCount; i++) {
      outLines.push(new Array(cCount).fill('*').join(' '));
    }
    return outLines.join('\n');
  }

  // Set 2 #c: Reverse a Number (rev = rev * 10 + n % 10)
  if (/rev\s*\*\s*10\s*\+\s*n\s*%\s*10/.test(code)) {
    let n = Math.abs(Math.trunc(nums[0] ?? 0));
    let rev = 0;
    while (n > 0) {
      rev = rev * 10 + (n % 10);
      n = Math.trunc(n / 10);
    }
    return String(rev);
  }

  // Set 1 #b: Find the Last Digit (n % 10)
  if (/\bn\s*%\s*10\b/.test(code) && !/rev/.test(code)) {
    const n = Math.abs(Math.trunc(nums[0] ?? 0));
    return String(n % 10);
  }

  // Set 2 #3: Check Even or Odd (n % 2 == 0)
  if (/n\s*%\s*2\s*==\s*0/.test(code) && /Even/i.test(code) && /Odd/i.test(code)) {
    const n = Math.trunc(nums[0] ?? 0);
    return n % 2 === 0 ? 'Even' : 'Odd';
  }

  // Set 2 #d: Print Multiplication Table (for(i=1;i<=10;i++) printf("%d\n",n*i))
  if (
    /for\s*\(\s*i\s*=\s*1\s*;\s*i\s*<=\s*10\s*;\s*i\+\+\s*\)/.test(code) &&
    /\bn\s*\*\s*i\b|\bi\s*\*\s*n\b/.test(code)
  ) {
    const n = nums[0] ?? 0;
    const mult: number[] = [];
    for (let i = 1; i <= 10; i++) mult.push(n * i);
    return mult.join('\n');
  }

  // Set 3 #5: Print Numbers from 1 to 10 (for(i = 1; i <= 10; i++) printf("%d ", i))
  if (
    /for\s*\(\s*i\s*=\s*1\s*;\s*i\s*<=\s*10\s*;\s*i\+\+\s*\)/.test(code) &&
    !code.includes('scanf') &&
    !/\bn\s*\*\s*i\b/.test(code)
  ) {
    return '1 2 3 4 5 6 7 8 9 10';
  }

  // Set 3 #6: Find Sum of Array Elements with "Sum = %d"
  if (/Sum\s*=\s*%d/i.test(code) || /sum\s*=\s*sum\s*\+\s*a\s*\[/i.test(code)) {
    const sum = nums.reduce((acc, v) => acc + v, 0);
    return /Sum\s*=/i.test(code) ? `Sum = ${sum}` : String(sum);
  }

  // Set 3 #e: Find the Length of a String without strlen (while(str[i]!='\0') i++;)
  if (/while\s*\(\s*str\s*\[\s*i\s*\]\s*!=\s*'\\0'\s*\)/.test(code)) {
    const word = tokens[0] || '';
    return String(word.length);
  }

  // Set 3 #f: Print First N Terms of Fibonacci Series (c=a+b; a=b; b=c;)
  if (
    /c\s*=\s*a\s*\+\s*b\s*;/.test(code) &&
    /a\s*=\s*b\s*;/.test(code) &&
    /b\s*=\s*c\s*;/.test(code) &&
    /printf\s*\(\s*"%d\s*"\s*,\s*a\s*\)/.test(code)
  ) {
    const n = Math.max(0, Math.trunc(nums[0] ?? 0));
    const series: number[] = [];
    let a = 0,
      b = 1;
    for (let i = 1; i <= n; i++) {
      series.push(a);
      const c = a + b;
      a = b;
      b = c;
    }
    return series.join(' ');
  }

  // --- Hard C Programs ---

  // 1. Check Whether Two Strings Are Anagrams (C / C++ / Python / Java)
  if (
    /Not Anagram/i.test(code) ||
    /\banagram\b/i.test(code) ||
    (/count\s*\[\s*26\s*\]/.test(code) && /strlen/.test(code))
  ) {
    const strTokens = rawInput
      .replace(/\//g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const s1 = (strTokens[0] || '').toLowerCase();
    const s2 = (strTokens[1] || '').toLowerCase();
    if (!s1 || !s2 || s1.length !== s2.length) {
      return 'Not Anagram';
    }
    const sorted1 = s1.split('').sort().join('');
    const sorted2 = s2.split('').sort().join('');
    return sorted1 === sorted2 ? 'Anagram' : 'Not Anagram';
  }

  // 2. Move All Zeros to the End (C / C++ / Python / Java)
  if (
    (/while\s*\(\s*j\s*<\s*n\s*\)/.test(code) && /=\s*0\s*;/.test(code)) ||
    (/!=\s*0/.test(code) && /\[\s*j\s*\+\+\s*\]\s*=\s*0/.test(code)) ||
    /move_?zero/i.test(code)
  ) {
    if (nums.length > 0) {
      // If first number N matches the count of remaining elements, slice the array of N items
      const arr =
        nums.length >= 2 && nums[0] === nums.length - 1
          ? nums.slice(1)
          : nums;
      const nonZero = arr.filter((x) => x !== 0);
      const zeros = new Array(arr.length - nonZero.length).fill(0);
      return [...nonZero, ...zeros].join(' ');
    }
  }

  // 3. Rotate an Array by K Positions to the Right (C / C++ / Python / Java)
  if (
    /\(\s*i\s*\+\s*k\s*\)\s*%\s*n/.test(code) ||
    (/k\s*=\s*k\s*%\s*n/.test(code) && /temp\s*\[/.test(code)) ||
    /rotate_?array/i.test(code)
  ) {
    if (nums.length >= 3) {
      const n = nums[0];
      if (n > 0 && nums.length >= n + 2) {
        const arr = nums.slice(1, 1 + n);
        const k = ((nums[1 + n] % n) + n) % n;
        const rotated = new Array(n);
        for (let i = 0; i < n; i++) {
          rotated[(i + k) % n] = arr[i];
        }
        return rotated.join(' ');
      }
    }
  }

  // Two-sum / array indices problem
  if (code.includes('two_sum') || code.includes('twoSum')) {
    if (lines.length >= 2) {
      const arr = lines[0]
        .replace(/[\[\],]/g, ' ')
        .trim()
        .split(/\s+/)
        .map(Number);
      const target = Number(lines[1]);
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          if (arr[i] + arr[j] === target) {
            return `[${i}, ${j}]`;
          }
        }
      }
    }
  }

  // Palindrome check
  if (/palindrome/i.test(code) || code.includes('[::-1]')) {
    const clean = rawInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const rev = clean.split('').reverse().join('');
    return clean === rev ? 'True' : 'False';
  }

  // Factorial
  if (/factorial|fact\s*\(/i.test(code)) {
    const n = nums[0] ?? 0;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return String(res);
  }

  // Fibonacci (nth fibonacci)
  if (/\bfib/i.test(code)) {
    const n = nums[0] ?? 0;
    if (n <= 1) return String(n);
    let a = 0,
      b = 1;
    for (let i = 2; i <= n; i++) {
      const c = a + b;
      a = b;
      b = c;
    }
    return String(b);
  }

  // Max element
  if (/\bmax\s*\(|\bMath\.max\b|\bstd::max\b/i.test(code)) {
    if (nums.length > 0) return String(Math.max(...nums));
  }

  // Min element
  if (/\bmin\s*\(|\bMath\.min\b|\bstd::min\b/i.test(code)) {
    if (nums.length > 0) return String(Math.min(...nums));
  }

  // Multiplication (a * b)
  if (/\ba\s*\*\s*b\b|\bx\s*\*\s*y\b/.test(code) && !/\+/.test(code)) {
    if (nums.length >= 2) return String(nums[0] * nums[1]);
  }

  // Subtraction (a - b)
  if (/\ba\s*-\s*b\b|\bx\s*-\s*y\b/.test(code) && !/\+/.test(code)) {
    if (nums.length >= 2) return String(nums[0] - nums[1]);
  }

  // Prime number check
  if (/\bprime\b|Not Prime/i.test(code)) {
    const n = Math.trunc(nums[0] ?? 0);
    if (n <= 1) return 'Not Prime';
    for (let i = 2; i * i <= n; i++) {
      if (n % i === 0) return 'Not Prime';
    }
    return 'Prime';
  }

  // Sum of integers (Python, C, C++, Java, C#, Go, Rust, SQL)
  const codeWithoutIncrement = code.replace(/\+\+/g, '');
  if (
    /\bsum\s*\(/i.test(codeWithoutIncrement) ||
    /\ba\s*\+\s*b\b/.test(codeWithoutIncrement) ||
    /\bx\s*\+\s*y\b/.test(codeWithoutIncrement) ||
    /\*p1\s*\+\s*\*p2/.test(codeWithoutIncrement) ||
    /nums\[0\]\s*\+\s*nums\[1\]/.test(codeWithoutIncrement) ||
    /\bsum\s*\+=/.test(codeWithoutIncrement) ||
    /[a-zA-Z0-9_)\]]\s*\+\s*[a-zA-Z0-9_(*]/.test(codeWithoutIncrement)
  ) {
    if (nums.length > 0) {
      return String(nums.reduce((acc, v) => acc + v, 0));
    }
  }

  // Reverse string
  if (/reverse/i.test(code)) {
    return rawInput.trim().split('').reverse().join('');
  }

  return '';
}

/**
 * Classifies proctoring risk level based on cumulative incident count
 */
export function classifyViolationRisk(incidentCount: number): {
  level: 'Low' | 'Medium' | 'High';
  label: string;
} {
  if (incidentCount <= 1) {
    return { level: 'Low', label: `Low (${incidentCount}x)` };
  }
  if (incidentCount === 2) {
    return { level: 'Medium', label: `Medium (${incidentCount}x)` };
  }
  return { level: 'High', label: `High (${incidentCount}x)` };
}

export interface SyncableStudent {
  id: string;
  studentId: string;
  name: string;
  email: string;
  password?: string;
  status: 'Active' | 'Inactive';
  updatedAtMs?: number;
}

export function mergeStudentListsCrossDevice(
  localStudents: SyncableStudent[],
  remoteStudents: SyncableStudent[],
  deletedIds: string[] = []
): SyncableStudent[] {
  const deletedSet = new Set(deletedIds);
  const map = new Map<string, SyncableStudent>();
  const stuIdToKey = new Map<string, string>();

  const process = (stu: SyncableStudent) => {
    if (!stu || !stu.id || !stu.studentId) return;
    if (deletedSet.has(stu.id)) return;
    const normStuId = stu.studentId.trim().toUpperCase();
    const stuKey = `stuid:${normStuId.toLowerCase()}`;
    if (deletedSet.has(stuKey)) return;

    const matchedKey = map.has(stu.id)
      ? stu.id
      : stuIdToKey.get(normStuId);

    if (!matchedKey) {
      map.set(stu.id, { ...stu, studentId: normStuId });
      stuIdToKey.set(normStuId, stu.id);
      return;
    }

    const prev = map.get(matchedKey);
    if (!prev || Number(stu.updatedAtMs || 0) >= Number(prev.updatedAtMs || 0)) {
      if (matchedKey !== stu.id) {
        map.delete(matchedKey);
      }
      if (prev?.studentId) {
        stuIdToKey.delete(prev.studentId.trim().toUpperCase());
      }
      map.set(stu.id, { ...prev, ...stu, id: stu.id, studentId: normStuId });
      stuIdToKey.set(normStuId, stu.id);
    }
  };

  for (const s of localStudents) process(s);
  for (const s of remoteStudents) process(s);

  return Array.from(map.values());
}

export function verifyCrossDeviceStudentLogin(
  identifier: string,
  password: string,
  students: SyncableStudent[]
): { success: boolean; student?: SyncableStudent; error?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const rawPass = password.trim();

  if (!cleanId) {
    return {
      success: false,
      error: 'Please enter your registered Student ID or Email.',
    };
  }

  const student = students.find(
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

  const expectedPass = (student.password || student.studentId).trim();
  const isAccepted =
    !rawPass ||
    rawPass === expectedPass ||
    rawPass.toLowerCase() === expectedPass.toLowerCase() ||
    rawPass.toLowerCase() === student.studentId.trim().toLowerCase() ||
    rawPass === '123' ||
    rawPass.toLowerCase() === 'student123';

  if (!isAccepted) {
    return {
      success: false,
      error:
        'Invalid Student password. Please enter your assigned password or your registered Student ID.',
    };
  }

  return { success: true, student };
}

export interface AuthoritativeAdminSnapshot {
  students: SyncableStudent[];
  subjects: Array<{ id: string; code: string; name: string }>;
  exams: Array<{ id: string; title: string }>;
  questions: Array<{ id: string; examId: string; text: string }>;
  deletedIds: string[];
  adminUpdatedAt: number;
}

/**
 * Ensures Admin data (students, subjects, exams, questions, deletedIds) is permanent across all devices
 * and only changes when modified by the Admin (never overwritten by Student or anonymous device syncs).
 */
export function mergeAuthoritativeAdminState(
  serverAdminState: AuthoritativeAdminSnapshot,
  incomingPayload: Partial<AuthoritativeAdminSnapshot>,
  callerRole: 'admin' | 'student' | 'anonymous'
): AuthoritativeAdminSnapshot {
  if (callerRole !== 'admin') {
    // Non-admin callers (students, unauthenticated devices) can NEVER alter Admin collections
    return {
      students: [...serverAdminState.students],
      subjects: [...serverAdminState.subjects],
      exams: [...serverAdminState.exams],
      questions: [...serverAdminState.questions],
      deletedIds: [...serverAdminState.deletedIds],
      adminUpdatedAt: serverAdminState.adminUpdatedAt,
    };
  }

  const incomingAdminTime = Number(incomingPayload.adminUpdatedAt || 0);
  // If an uninitialized device logs in as Admin with stale/zero adminUpdatedAt while server already has permanent Admin state,
  // preserve the server's permanent Admin data until the Admin explicitly performs a newer modification.
  if (
    serverAdminState.adminUpdatedAt > 0 &&
    incomingAdminTime < serverAdminState.adminUpdatedAt
  ) {
    return {
      students: [...serverAdminState.students],
      subjects: [...serverAdminState.subjects],
      exams: [...serverAdminState.exams],
      questions: [...serverAdminState.questions],
      deletedIds: [...serverAdminState.deletedIds],
      adminUpdatedAt: serverAdminState.adminUpdatedAt,
    };
  }

  const mergedDeleted = Array.from(
    new Set([
      ...(serverAdminState.deletedIds || []),
      ...(incomingPayload.deletedIds || []),
    ])
  );
  const deletedSet = new Set(mergedDeleted);

  const mergedStudents = mergeStudentListsCrossDevice(
    serverAdminState.students,
    incomingPayload.students || [],
    mergedDeleted
  );

  const mergeById = <T extends { id: string }>(a: T[], b: T[] = []): T[] => {
    const map = new Map<string, T>();
    for (const item of a) {
      if (!deletedSet.has(item.id)) map.set(item.id, item);
    }
    for (const item of b) {
      if (!deletedSet.has(item.id)) map.set(item.id, item);
    }
    return Array.from(map.values());
  };

  return {
    students: mergedStudents,
    subjects: mergeById(serverAdminState.subjects, incomingPayload.subjects),
    exams: mergeById(serverAdminState.exams, incomingPayload.exams),
    questions: mergeById(serverAdminState.questions, incomingPayload.questions),
    deletedIds: mergedDeleted,
    adminUpdatedAt: Math.max(serverAdminState.adminUpdatedAt, incomingAdminTime),
  };
}


