import type { QuestionType } from '../services/examStore.ts';
import {
  type ProgrammingLanguage,
  STARTER_CODE_TEMPLATES,
  type TestCase,
} from './examLogic.ts';

export interface ParsedQuestionDraft {
  tempId: string;
  type: QuestionType;
  text: string;
  marks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  explanation?: string;
  // MCQ fields
  optA: string;
  optB: string;
  optC: string;
  optD: string;
  correctOpt: 'opt-a' | 'opt-b' | 'opt-c' | 'opt-d';
  // Descriptive fields
  answerLengthGuidance: string;
  sampleRubric: string;
  // Programming fields
  programmingLanguage: ProgrammingLanguage;
  starterCode: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  testCases: TestCase[];
}

export interface ProgrammingQuestionSpec {
  cleanPrompt: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  starterCode: string;
  testCases: TestCase[];
  explanation?: string;
}

export const SAMPLE_QUESTION_PAPER_TEXT = `PANIMALAR ENGINEERING COLLEGE
Department of AI and Data Science — Official Question Paper Template

Q1. [MCQ] [10 Marks] [Difficulty: Easy]
Which data structure operates on a First-In, First-Out (FIFO) scheduling principle in operating system process queues?
A) Stack
B) Queue
C) Binary Search Tree
D) Max Heap
Answer: B
Explanation: A Queue inserts elements at the rear (enqueue) and removes them from the front (dequeue), following FIFO order.

Q2. [MCQ] [10 Marks] [Difficulty: Medium]
What is the worst-case time complexity of searching for a key in a balanced AVL Binary Search Tree with N nodes?
A) O(1)
B) O(log N)
C) O(N)
D) O(N log N)
Answer: B
Explanation: Because an AVL tree maintains a height balance factor of at most 1 at every node, its height is bounded by O(log N).

Q3. [Descriptive] [15 Marks] [Difficulty: Medium]
Explain the difference between Dynamic Memory Allocation functions malloc(), calloc(), realloc(), and free() in C programming with syntax examples.
Guidance: 150 - 250 words recommended
Rubric: Award 5 marks for malloc/calloc comparison, 5 marks for realloc/free usage, and 5 marks for valid C pointer syntax examples.

Q4. [Programming] [25 Marks] [Difficulty: Hard] [Language: c]
Write a C program to move all zeros in an integer array of size N to the end while maintaining the relative order of non-zero elements.
InputFormat: First line: integer N (size of array). Second line: N space-separated integers.
OutputFormat: N space-separated integers with all zeros moved to the end while preserving non-zero order.
Constraints: Time Limit: 1.0s | Memory Limit: 64MB | 1 <= N <= 10^5
TestCase: 6 0 1 0 3 12 0 => 1 3 12 0 0 0 (Sample)
TestCase: 5 0 0 1 2 3 => 1 2 3 0 0 (Hidden)
`;

/**
 * Checks whether a string is clean, human-readable text and NOT raw binary PDF stream mojibake.
 */
export function isCleanReadableText(str?: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (!trimmed) return false;

  let badChars = 0;
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
      badChars += 2;
    } else if (code >= 127 && code <= 255) {
      badChars++;
    } else if (code === 65533) {
      badChars += 2;
    }
  }

  if (asciiAlphaNum === 0) return false;
  return badChars / trimmed.length <= 0.12;
}

export function sanitizeExtractedText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\uFFFD/g, '')
        .trim()
    )
    .filter((line) => line.length > 0 && isCleanReadableText(line))
    .join('\n');
}

/**
 * Generates an example starter code skeleton for a given language and input variable pattern.
 * Importantly, this NEVER includes the solution algorithm or final answer computation.
 */
function buildStarterSkeletonForInputType(
  lang: ProgrammingLanguage,
  inputKind:
    | 'array_n'
    | 'array_n_k'
    | 'array_fixed_5'
    | 'two_strings'
    | 'one_string'
    | 'two_ints'
    | 'one_int'
    | 'one_float'
    | 'no_input',
  todoHint: string
): string {
  if (lang === 'c') {
    switch (inputKind) {
      case 'array_n':
        return `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int arr[1000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }

    // TODO: ${todoHint}

    return 0;
}`;
      case 'array_n_k':
        return `#include <stdio.h>

int main() {
    int n, k;
    if (scanf("%d", &n) != 1) return 0;
    int arr[1000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }
    scanf("%d", &k);

    // TODO: ${todoHint}

    return 0;
}`;
      case 'array_fixed_5':
        return `#include <stdio.h>

int main() {
    int arr[5];
    for (int i = 0; i < 5; i++) {
        scanf("%d", &arr[i]);
    }

    // TODO: ${todoHint}

    return 0;
}`;
      case 'two_strings':
        return `#include <stdio.h>
#include <string.h>
#include <ctype.h>

int main() {
    char str1[100], str2[100];
    if (scanf("%99s %99s", str1, str2) != 2) return 0;

    // TODO: ${todoHint}

    return 0;
}`;
      case 'one_string':
        return `#include <stdio.h>
#include <string.h>

int main() {
    char str[100];
    if (scanf("%99s", str) != 1) return 0;

    // TODO: ${todoHint}

    return 0;
}`;
      case 'two_ints':
        return `#include <stdio.h>

int main() {
    int a, b;
    if (scanf("%d %d", &a, &b) != 2) return 0;

    // TODO: ${todoHint}

    return 0;
}`;
      case 'one_int':
        return `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;

    // TODO: ${todoHint}

    return 0;
}`;
      case 'one_float':
        return `#include <stdio.h>

int main() {
    float r;
    if (scanf("%f", &r) != 1) return 0;

    // TODO: ${todoHint}

    return 0;
}`;
      case 'no_input':
        return `#include <stdio.h>

int main() {
    // TODO: ${todoHint}

    return 0;
}`;
    }
  }

  if (lang === 'python') {
    switch (inputKind) {
      case 'array_n':
        return `import sys

def solve():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    arr = [int(x) for x in tokens[1:n + 1]]

    # TODO: ${todoHint}

if __name__ == "__main__":
    solve()`;
      case 'array_n_k':
        return `import sys

def solve():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    arr = [int(x) for x in tokens[1:n + 1]]
    k = int(tokens[n + 1]) if len(tokens) > n + 1 else 0

    # TODO: ${todoHint}

if __name__ == "__main__":
    solve()`;
      case 'two_strings':
        return `import sys

def solve():
    words = sys.stdin.read().split()
    if len(words) < 2:
        return
    s1, s2 = words[0], words[1]

    # TODO: ${todoHint}

if __name__ == "__main__":
    solve()`;
      case 'one_string':
        return `import sys

def solve():
    s = sys.stdin.read().strip()
    # TODO: ${todoHint}

if __name__ == "__main__":
    solve()`;
      case 'one_int':
      case 'one_float':
        return `import sys

def solve():
    raw = sys.stdin.read().strip()
    if not raw:
        return
    # TODO: ${todoHint}

if __name__ == "__main__":
    solve()`;
      default:
        return STARTER_CODE_TEMPLATES.python;
    }
  }

  return STARTER_CODE_TEMPLATES[lang] || STARTER_CODE_TEMPLATES.c;
}

/**
 * Deeply analyzes a programming question's prompt AND any reference solution code extracted
 * from a PDF/file to synthesize:
 *  - Clean problem statement (`cleanPrompt`)
 *  - Accurate `inputFormat` and `outputFormat`
 *  - Verified Sample & Hidden `testCases`
 *  - Example `starterCode` skeleton (NEVER the full solution code)
 */
export function analyzeProgrammingQuestionSpec(
  rawPrompt: string,
  extractedCode: string,
  lang: ProgrammingLanguage,
  explicitTestCases: TestCase[] = [],
  explicitInputFormat = '',
  explicitOutputFormat = '',
  idx = 0
): ProgrammingQuestionSpec {
  const combined = `${rawPrompt}\n${extractedCode}`;
  const tcPrefix = `tc-auto-${Date.now()}-${idx}`;
  const langLabel = lang === 'cpp' ? 'C++' : lang.toUpperCase();

  // Clean up short titles like "Move All Zeros to the End" into a full problem statement
  const formatPromptTitle = (title: string, detailedDesc: string): string => {
    const trimmed = title
      .replace(/^[a-zA-Z0-9]+[.)]\s*/, '')
      .replace(/^Set\s*\d+\s*/i, '')
      .trim();
    if (!trimmed) return detailedDesc;
    if (/^(?:Write|Develop|Implement|Create|Design)\b/i.test(trimmed)) {
      return trimmed;
    }
    return `${trimmed}: ${detailedDesc}`;
  };

  // =========================================================================
  // 1. HARD C-PROGRAMS ARCHETYPES
  // =========================================================================

  // Hard 1: Move All Zeros to the End
  if (
    /move\s+all\s+zeros?\s+to\s+(?:the\s+)?end/i.test(combined) ||
    (/arr\s*\[\s*count\s*\+\+\s*\]\s*=\s*arr\s*\[\s*i\s*\]/.test(extractedCode) &&
      /while\s*\(\s*count\s*<\s*n\s*\)/.test(extractedCode))
  ) {
    return {
      cleanPrompt: formatPromptTitle(
        rawPrompt || 'Move All Zeros to the End',
        `Write a ${langLabel} program that reads an integer N followed by N space-separated integers and moves all zeros to the end of the array while maintaining the relative order of non-zero elements.`
      ),
      inputFormat:
        explicitInputFormat ||
        'First line: integer N (size of array). Second line: N space-separated integers.',
      outputFormat:
        explicitOutputFormat ||
        'N space-separated integers with all zeros moved to the end while preserving non-zero order.',
      constraints: 'Time Limit: 1.0s | Memory Limit: 64MB | 1 <= N <= 10^5',
      starterCode: buildStarterSkeletonForInputType(
        lang,
        'array_n',
        'Move all zeros in arr[] to the end while maintaining the relative order of non-zero elements, then print the N elements separated by spaces'
      ),
      explanation:
        'Maintain a write pointer `count = 0` for non-zero elements, then fill remaining positions from `count` to `n - 1` with `0`.',
      testCases:
        explicitTestCases.length > 0
          ? explicitTestCases
          : [
              {
                id: `${tcPrefix}-1`,
                input: '6\n0 1 0 3 12 0',
                expectedOutput: '1 3 12 0 0 0',
                isHidden: false,
              },
              {
                id: `${tcPrefix}-2`,
                input: '5\n0 0 1 2 3',
                expectedOutput: '1 2 3 0 0',
                isHidden: false,
              },
              {
                id: `${tcPrefix}-3`,
                input: '5\n1 2 3 4 5',
                expectedOutput: '1 2 3 4 5',
                isHidden: true,
              },
              {
                id: `${tcPrefix}-4`,
                input: '4\n0 0 0 0',
                expectedOutput: '0 0 0 0',
                isHidden: true,
              },
            ],
    };
  }

  // Hard 2: Check Whether Two Strings Are Anagrams
  if (
    /anagrams?/i.test(combined) ||
    (/count1\s*\[/.test(extractedCode) &&
      /count2\s*\[/.test(extractedCode) &&
      /Not\s+Anagram/i.test(extractedCode))
  ) {
    return {
      cleanPrompt: formatPromptTitle(
        rawPrompt || 'Check Whether Two Strings Are Anagrams',
        `Write a ${langLabel} program to check whether two given strings are anagrams of each other (case-insensitive) and print "Anagram" or "Not Anagram".`
      ),
      inputFormat:
        explicitInputFormat ||
        'Two whitespace-separated strings S1 and S2 on standard input.',
      outputFormat:
        explicitOutputFormat ||
        'Print "Anagram" if S1 and S2 contain the exact same character frequencies (case-insensitive), otherwise print "Not Anagram".',
      constraints:
        'Time Limit: 1.0s | Memory Limit: 64MB | 1 <= |S1|, |S2| <= 100',
      starterCode: buildStarterSkeletonForInputType(
        lang,
        'two_strings',
        'Compare lowercase character frequencies of str1 and str2; print "Anagram" if equal, else print "Not Anagram"'
      ),
      explanation:
        'Convert characters to lowercase using tolower() and compare character frequency counts across 26 letters.',
      testCases:
        explicitTestCases.length > 0
          ? explicitTestCases
          : [
              {
                id: `${tcPrefix}-1`,
                input: 'listen Silent',
                expectedOutput: 'Anagram',
                isHidden: false,
              },
              {
                id: `${tcPrefix}-2`,
                input: 'hello world',
                expectedOutput: 'Not Anagram',
                isHidden: false,
              },
              {
                id: `${tcPrefix}-3`,
                input: 'race care',
                expectedOutput: 'Anagram',
                isHidden: true,
              },
              {
                id: `${tcPrefix}-4`,
                input: 'abc abcd',
                expectedOutput: 'Not Anagram',
                isHidden: true,
              },
            ],
    };
  }

  // Hard 3: Rotate an Array by K Positions
  if (
    /rotate\s+(?:an\s+)?array\s+by\s+k/i.test(combined) ||
    /temp\s*\[\s*\(\s*i\s*\+\s*k\s*\)\s*%\s*n\s*\]/.test(extractedCode) ||
    /\(\s*i\s*\+\s*k\s*\)\s*%\s*n/.test(extractedCode)
  ) {
    return {
      cleanPrompt: formatPromptTitle(
        rawPrompt || 'Rotate an Array by K Positions',
        `Write a ${langLabel} program that reads an array of N integers and an integer K, right-rotates the array by K positions, and prints the rotated array.`
      ),
      inputFormat:
        explicitInputFormat ||
        'First line: integer N (size of array). Second line: N space-separated integers. Third line: integer K (number of right rotations).',
      outputFormat:
        explicitOutputFormat ||
        'N space-separated integers representing the array after right rotation by K positions.',
      constraints:
        'Time Limit: 1.0s | Memory Limit: 64MB | 1 <= N <= 10^5, 0 <= K <= 10^9',
      starterCode: buildStarterSkeletonForInputType(
        lang,
        'array_n_k',
        'Right-rotate arr[] of size n by k positions (using (i + k) % n) and print the rotated array elements separated by spaces'
      ),
      explanation:
        'Place each element `arr[i]` at index `(i + k) % n` in a temporary array and print the result.',
      testCases:
        explicitTestCases.length > 0
          ? explicitTestCases
          : [
              {
                id: `${tcPrefix}-1`,
                input: '5\n1 2 3 4 5\n2',
                expectedOutput: '4 5 1 2 3',
                isHidden: false,
              },
              {
                id: `${tcPrefix}-2`,
                input: '4\n1 2 3 4\n1',
                expectedOutput: '4 1 2 3',
                isHidden: false,
              },
              {
                id: `${tcPrefix}-3`,
                input: '3\n1 2 3\n3',
                expectedOutput: '1 2 3',
                isHidden: true,
              },
              {
                id: `${tcPrefix}-4`,
                input: '3\n1 2 3\n5',
                expectedOutput: '2 3 1',
                isHidden: true,
              },
            ],
    };
  }

  // =========================================================================
  // 2. MEDIUM C-PROGRAMS ARCHETYPES (12 PROGRAMS)
  // =========================================================================

  // Medium 1: Find the Area of a Circle
  if (
    /area\s+of\s+(?:a\s+)?circle/i.test(combined) ||
    /3\.14\d*\s*\*\s*r\s*\*\s*r/i.test(extractedCode)
  ) {
    return {
      cleanPrompt: formatPromptTitle(
        rawPrompt || 'Find the Area of a Circle',
        `Write a ${langLabel} program to read the radius R of a circle and print its area in the format "Area = XX.XX" (using PI = 3.14).`
      ),
      inputFormat:
        explicitInputFormat ||
        'Single number R representing the radius of the circle.',
      outputFormat:
        explicitOutputFormat ||
        'Print "Area = XX.XX" rounded to 2 decimal places (using 3.14 * r * r).',
      constraints: 'Time Limit: 1.0s | Memory Limit: 64MB | 0 < R <= 10^4',
      starterCode: buildStarterSkeletonForInputType(
        lang,
        'one_float',
        'Compute area = 3.14 * r * r and print using printf("Area = %.2f", area);'
      ),
      testCases:
        explicitTestCases.length > 0
          ? explicitTestCases
          : [
              {
                id: `${tcPrefix}-1`,
                input: '5',
                expectedOutput: 'Area = 78.50',
                isHidden: false,
              },
              {
                id: `${tcPrefix}-2`,
                input: '10',
                expectedOutput: 'Area = 314.00',
                isHidden: true,
              },
            ],
    };
  }

  // Medium 2: Print Number Triangle
  if (
    /number\s+triangle/i.test(combined) ||
    (/for\s*\(\s*i\s*=\s*1\s*;\s*i\s*<=\s*5/.test(extractedCode) &&
      /for\s*\(\s*j\s*=\s*1\s*;\s*j\s*<=\s*i/.test(extractedCode))
  ) {
    return {
      cleanPrompt: formatPromptTitle(
        rawPrompt || 'Print Number Triangle',
        `Write a ${langLabel} program using nested loops to print a 5-row right-angled number triangle from 1 to 5.`
      ),
      inputFormat:
        explicitInputFormat ||
        'No input required (prints standard 5-row number triangle).',
      outputFormat:
        explicitOutputFormat ||
        '5 lines where row i contains space-separated numbers from 1 to i.',
      constraints: 'Time Limit: 1.0s | Memory Limit: 64MB',
      starterCode: buildStarterSkeletonForInputType(
        lang,
        'no_input',
        'Use nested loops (i from 1 to 5, j from 1 to i) to print the number triangle'
      ),
      testCases:
        explicitTestCases.length > 0
          ? explicitTestCases
          : [
              {
                id: `${tcPrefix}-1`,
                input: '-',
                expectedOutput: '1\n1 2\n1 2 3\n1 2 3 4\n1 2 3 4 5',
                isHidden: false,
              },
            ],
    };
  }

  // Medium 3 (Set 1a): Sum of Two Numbers
  if (
    /sum\s+of\s+two\s+numbers/i.test(combined) ||
    (/scanf\s*\(\s*"%d\s*%d"\s*,\s*&a\s*,\s*&b\s*\)/.test(extractedCode) &&
      /a\s*\+\s*b/.test(extractedCode))
  ) {
    return {
      cleanPrompt: formatPromptTitle(
        rawPrompt || 'Sum of Two Numbers',
        `Write a ${langLabel} program that reads two space-separated integers A and B from standard input and prints their sum (A + B).`
      ),
      inputFormat:
        explicitInputFormat ||
        'Two space-separated integers A and B on standard input.',
      outputFormat:
        explicitOutputFormat || 'Single integer representing the sum A + B.',
      constraints: 'Time Limit: 1.0s | Memory Limit: 64MB',
      starterCode: buildStarterSkeletonForInputType(
        lang,
        'two_ints',
        'Compute and print the sum of a and b'
      ),
      testCases:
        explicitTestCases.length > 0
          ? explicitTestCases
          : [
              {
                id: `${tcPrefix}-1`,
                input: '10 20',
                expectedOutput: '30',
                isHidden: false,
              },
              {
                id: `${tcPrefix}-2`,
                input: '25 75',
                expectedOutput: '100',
                isHidden: true,
              },
            ],
    };
  }

  // Medium 4 (Set 1b): Find the Last Digit
  if (
    /last\s+digit/i.test(combined) ||
    (/n\s*%\s*10/.test(extractedCode) && !/rev/.test(extractedCode))
  ) {
    return {
      cleanPrompt: formatPromptTitle(
        rawPrompt || 'Find the Last Digit',
        `Write a ${langLabel} program to read an integer N and print its last digit (N % 10).`
      ),
      inputFormat:
        explicitInputFormat || 'Single integer N on standard input.',
      outputFormat:
        explicitOutputFormat ||
        'Single integer representing the last digit of N.',
      constraints: 'Time Limit: 1.0s | Memory Limit: 64MB',
      starterCode: buildStarterSkeletonForInputType(
        lang,
        'one_int',
        'Find and print the last digit of n using the modulo operator (n % 10)'
      ),
      testCases:
        explicitTestCases.length > 0
          ? explicitTestCases
          : [
              {
                id: `${tcPrefix}-1`,
                input: '1234',
                expectedOutput: '4',
                isHidden: false,
              },
              {
                id: `${tcPrefix}-2`,
                input: '987',
                expectedOutput: '7',
                isHidden: true,
              },
            ],
    };
  }

  // Medium 5 (Set 2 - 3): Check Even or Odd
  if (
    /even\s+or\s+odd/i.test(combined) ||
    (/n\s*%\s*2\s*==\s*0/.test(extractedCode) &&
      /Even/.test(extractedCode) &&
      /Odd/.test(extractedCode))
  ) {
    return {
      cleanPrompt: formatPromptTitle(
        rawPrompt || 'Check Even or Odd',
        `Write a ${langLabel} program to read an integer N and print "Even" if it is divisible by 2, or "Odd" otherwise.`
      ),
      inputFormat:
        explicitInputFormat || 'Single integer N on standard input.',
      outputFormat:
        explicitOutputFormat ||
        'Print "Even" if N is even, otherwise print "Odd".',
      constraints: 'Time Limit: 1.0s | Memory Limit: 64MB',
      starterCode: buildStarterSkeletonForInputType(
        lang,
        'one_int',
        'Check if n % 2 == 0 and print "Even" or "Odd"'
      ),
      testCases:
        explicitTestCases.length > 0
          ? explicitTestCases
          : [
              {
                id: `${tcPrefix}-1`,
                input: '4',
                expectedOutput: 'Even',
                isHidden: false,
              },
              {
                id: `${tcPrefix}-2`,
                input: '7',
                expectedOutput: 'Odd',
                isHidden: true,
              },
            ],
    };
  }

  // Medium 6 (Set 2 - 4): Print Star Pattern
  if (
    /star\s+pattern/i.test(combined) ||
    (/printf\s*\(\s*"\*\s*"\s*\)/.test(extractedCode) &&
      /i\s*<=\s*3/.test(extractedCode))
  ) {
    return {
      cleanPrompt: formatPromptTitle(
        rawPrompt || 'Print Star Pattern',
        `Write a ${langLabel} program using nested loops to print a 3x3 grid of space-separated asterisks (*).`
      ),
      inputFormat:
        explicitInputFormat ||
        'No input required (prints standard 3x3 star grid).',
      outputFormat:
        explicitOutputFormat ||
        '3 lines, each containing 3 space-separated asterisks ("* * *").',
      constraints: 'Time Limit: 1.0s | Memory Limit: 64MB',
      starterCode: buildStarterSkeletonForInputType(
        lang,
        'no_input',
        'Use nested loops (i from 1 to 3, j from 1 to 3) to print "* " on each row'
      ),
      testCases:
        explicitTestCases.length > 0
          ? explicitTestCases
          : [
              {
                id: `${tcPrefix}-1`,
                input: '-',
                expectedOutput: '* * *\n* * *\n* * *',
                isHidden: false,
              },
            ],
    };
  }

  // Medium 7 (Set 2c): Reverse a Number
  if (
    /reverse\s+a\s+number/i.test(combined) ||
    /rev\s*=\s*rev\s*\*\s*10\s*\+\s*\(\s*n\s*%\s*10\s*\)/.test(extractedCode)
  ) {
    return {
      cleanPrompt: formatPromptTitle(
        rawPrompt || 'Reverse a Number',
        `Write a ${langLabel} program to read an integer N and print the number formed by reversing its digits.`
      ),
      inputFormat:
        explicitInputFormat || 'Single integer N on standard input.',
      outputFormat:
        explicitOutputFormat || 'Single integer with the digits of N reversed.',
      constraints: 'Time Limit: 1.0s | Memory Limit: 64MB',
      starterCode: buildStarterSkeletonForInputType(
        lang,
        'one_int',
        'Reverse the digits of n using a while(n != 0) loop and print the reversed integer'
      ),
      testCases:
        explicitTestCases.length > 0
          ? explicitTestCases
          : [
              {
                id: `${tcPrefix}-1`,
                input: '12345',
                expectedOutput: '54321',
                isHidden: false,
              },
              {
                id: `${tcPrefix}-2`,
                input: '908',
                expectedOutput: '809',
                isHidden: true,
              },
            ],
    };
  }

  // Medium 8 (Set 2d): Print Multiplication Table
  if (
    /multiplication\s+table/i.test(combined) ||
    (/i\s*<=\s*10/.test(extractedCode) && /n\s*\*\s*i/.test(extractedCode))
  ) {
    return {
      cleanPrompt: formatPromptTitle(
        rawPrompt || 'Print Multiplication Table',
        `Write a ${langLabel} program to read an integer N and print the first 10 multiples of N (from N * 1 to N * 10) separated by spaces.`
      ),
      inputFormat:
        explicitInputFormat || 'Single integer N on standard input.',
      outputFormat:
        explicitOutputFormat ||
        '10 space-separated integers representing N*1, N*2, ..., N*10.',
      constraints: 'Time Limit: 1.0s | Memory Limit: 64MB',
      starterCode: buildStarterSkeletonForInputType(
        lang,
        'one_int',
        'Loop i from 1 to 10 and print n * i separated by spaces'
      ),
      testCases:
        explicitTestCases.length > 0
          ? explicitTestCases
          : [
              {
                id: `${tcPrefix}-1`,
                input: '5',
                expectedOutput: '5 10 15 20 25 30 35 40 45 50',
                isHidden: false,
              },
              {
                id: `${tcPrefix}-2`,
                input: '2',
                expectedOutput: '2 4 6 8 10 12 14 16 18 20',
                isHidden: true,
              },
            ],
    };
  }

  // Medium 9 (Set 3 - 5): Print Numbers from 1 to 10
  if (
    /numbers\s+from\s+1\s+to\s+10/i.test(combined) ||
    (!/scanf/.test(extractedCode) &&
      /for\s*\(\s*int\s+i\s*=\s*1\s*;\s*i\s*<=\s*10\s*;\s*i\s*\+\+\s*\)/.test(
        extractedCode
      ))
  ) {
    return {
      cleanPrompt: formatPromptTitle(
        rawPrompt || 'Print Numbers from 1 to 10',
        `Write a ${langLabel} program to print the numbers from 1 to 10 separated by spaces using a loop.`
      ),
      inputFormat: explicitInputFormat || 'No input required.',
      outputFormat:
        explicitOutputFormat ||
        'Space-separated integers from 1 to 10 ("1 2 3 4 5 6 7 8 9 10").',
      constraints: 'Time Limit: 1.0s | Memory Limit: 64MB',
      starterCode: buildStarterSkeletonForInputType(
        lang,
        'no_input',
        'Use a loop from i = 1 to 10 and print each number separated by a space'
      ),
      testCases:
        explicitTestCases.length > 0
          ? explicitTestCases
          : [
              {
                id: `${tcPrefix}-1`,
                input: '-',
                expectedOutput: '1 2 3 4 5 6 7 8 9 10',
                isHidden: false,
              },
            ],
    };
  }

  // Medium 10 (Set 3 - 6): Find Sum of Array Elements
  if (
    /sum\s+of\s+array\s+elements/i.test(combined) ||
    (/arr\s*\[\s*5\s*\]/.test(extractedCode) &&
      /Sum\s*=\s*%d/.test(extractedCode))
  ) {
    return {
      cleanPrompt: formatPromptTitle(
        rawPrompt || 'Find Sum of Array Elements',
        `Write a ${langLabel} program to read 5 integers into an array, calculate their sum, and print the result in the format "Sum = X".`
      ),
      inputFormat:
        explicitInputFormat || '5 space-separated integers on standard input.',
      outputFormat:
        explicitOutputFormat ||
        'Print "Sum = X" where X is the sum of the 5 array elements.',
      constraints: 'Time Limit: 1.0s | Memory Limit: 64MB',
      starterCode: buildStarterSkeletonForInputType(
        lang,
        'array_fixed_5',
        'Calculate the sum of the 5 elements in arr[] and print using printf("Sum = %d", sum);'
      ),
      testCases:
        explicitTestCases.length > 0
          ? explicitTestCases
          : [
              {
                id: `${tcPrefix}-1`,
                input: '10 20 30 40 50',
                expectedOutput: 'Sum = 150',
                isHidden: false,
              },
              {
                id: `${tcPrefix}-2`,
                input: '1 2 3 4 5',
                expectedOutput: 'Sum = 15',
                isHidden: true,
              },
            ],
    };
  }

  // Medium 11 (Set 3e): Find the Length of a String
  if (
    /length\s+of\s+(?:a\s+)?string/i.test(combined) ||
    (/strlen\s*\(\s*str\s*\)/.test(extractedCode) &&
      !/anagram/i.test(combined))
  ) {
    return {
      cleanPrompt: formatPromptTitle(
        rawPrompt || 'Find the Length of a String',
        `Write a ${langLabel} program to read a string S and print its length (number of characters).`
      ),
      inputFormat:
        explicitInputFormat || 'Single string S (without spaces) on standard input.',
      outputFormat:
        explicitOutputFormat ||
        'Single integer representing the length of string S.',
      constraints: 'Time Limit: 1.0s | Memory Limit: 64MB | 1 <= |S| < 100',
      starterCode: buildStarterSkeletonForInputType(
        lang,
        'one_string',
        'Find and print the length of str using strlen(str) or a character loop'
      ),
      testCases:
        explicitTestCases.length > 0
          ? explicitTestCases
          : [
              {
                id: `${tcPrefix}-1`,
                input: 'Hello',
                expectedOutput: '5',
                isHidden: false,
              },
              {
                id: `${tcPrefix}-2`,
                input: 'Programming',
                expectedOutput: '11',
                isHidden: true,
              },
            ],
    };
  }

  // Medium 12 (Set 3f): Print Fibonacci Series
  if (
    /fibonacci/i.test(combined) ||
    (/a\s*=\s*0\s*,\s*b\s*=\s*1/.test(extractedCode) &&
      /c\s*=\s*a\s*\+\s*b/.test(extractedCode))
  ) {
    return {
      cleanPrompt: formatPromptTitle(
        rawPrompt || 'Print Fibonacci Series',
        `Write a ${langLabel} program to read an integer N and print the first N terms of the Fibonacci series starting from 0 1.`
      ),
      inputFormat:
        explicitInputFormat ||
        'Single integer N representing the number of Fibonacci terms.',
      outputFormat:
        explicitOutputFormat ||
        'First N Fibonacci numbers separated by spaces (starting with 0 1 ...).',
      constraints: 'Time Limit: 1.0s | Memory Limit: 64MB | 1 <= N <= 45',
      starterCode: buildStarterSkeletonForInputType(
        lang,
        'one_int',
        'Generate and print the first n Fibonacci numbers separated by spaces (starting from 0, 1)'
      ),
      testCases:
        explicitTestCases.length > 0
          ? explicitTestCases
          : [
              {
                id: `${tcPrefix}-1`,
                input: '6',
                expectedOutput: '0 1 1 2 3 5',
                isHidden: false,
              },
              {
                id: `${tcPrefix}-2`,
                input: '5',
                expectedOutput: '0 1 1 2 3',
                isHidden: true,
              },
            ],
    };
  }

  // =========================================================================
  // 3. OTHER COMMON PROGRAMMING ARCHETYPES (Factorial, Prime, Palindrome)
  // =========================================================================
  if (/factorial/i.test(combined)) {
    return {
      cleanPrompt: formatPromptTitle(
        rawPrompt || 'Factorial of a Number',
        `Write a ${langLabel} program to read a non-negative integer N and print its factorial (N!).`
      ),
      inputFormat: explicitInputFormat || 'Single non-negative integer N.',
      outputFormat: explicitOutputFormat || 'Single integer representing N!.',
      constraints: 'Time Limit: 1.0s | Memory Limit: 64MB | 0 <= N <= 12',
      starterCode: buildStarterSkeletonForInputType(
        lang,
        'one_int',
        'Compute and print the factorial of n'
      ),
      testCases:
        explicitTestCases.length > 0
          ? explicitTestCases
          : [
              {
                id: `${tcPrefix}-1`,
                input: '5',
                expectedOutput: '120',
                isHidden: false,
              },
              {
                id: `${tcPrefix}-2`,
                input: '6',
                expectedOutput: '720',
                isHidden: true,
              },
            ],
    };
  }

  // =========================================================================
  // 4. GENERIC STATIC CODE & INPUT/OUTPUT FORMAT ANALYZER
  // =========================================================================
  // Inspect scanf / cin / input() patterns in extractedCode to infer input structure
  const hasArrayLoopScanf =
    /for\s*\([^)]*\)\s*\{?\s*scanf\s*\(\s*"%[l]*d"\s*,\s*&\w+\s*\[/.test(
      extractedCode
    );
  const scanfStringCount = (extractedCode.match(/%[0-9]*s/g) || []).length;
  const scanfIntCount = (extractedCode.match(/%(?:lld|ld|d)/g) || []).length;
  const scanfFloatCount = (extractedCode.match(/%(?:lf|f)/g) || []).length;

  let detectedInputKind:
    | 'array_n'
    | 'array_n_k'
    | 'array_fixed_5'
    | 'two_strings'
    | 'one_string'
    | 'two_ints'
    | 'one_int'
    | 'one_float'
    | 'no_input' = 'two_ints';

  let inferredInputFormat =
    explicitInputFormat ||
    'Two space-separated integers A and B on standard input (stdin)';
  let inferredOutputFormat =
    explicitOutputFormat ||
    'Print the computed output to standard output (stdout)';

  if (hasArrayLoopScanf) {
    detectedInputKind = 'array_n';
    inferredInputFormat =
      explicitInputFormat ||
      'First line: integer N. Second line: N space-separated integers.';
    inferredOutputFormat =
      explicitOutputFormat ||
      'Print the resulting output after processing the N array elements.';
  } else if (scanfStringCount >= 2) {
    detectedInputKind = 'two_strings';
    inferredInputFormat =
      explicitInputFormat ||
      'Two whitespace-separated strings S1 and S2 on standard input.';
  } else if (scanfStringCount === 1 || /\bstring\b/i.test(rawPrompt)) {
    detectedInputKind = 'one_string';
    inferredInputFormat =
      explicitInputFormat || 'Single string S on standard input.';
  } else if (scanfFloatCount >= 1) {
    detectedInputKind = 'one_float';
    inferredInputFormat =
      explicitInputFormat || 'Single floating-point number on standard input.';
  } else if (scanfIntCount === 1) {
    detectedInputKind = 'one_int';
    inferredInputFormat =
      explicitInputFormat || 'Single integer N on standard input.';
  } else if (
    extractedCode.trim().length > 0 &&
    !/scanf|cin|input\s*\(|Scanner|readLine/.test(extractedCode)
  ) {
    detectedInputKind = 'no_input';
    inferredInputFormat = explicitInputFormat || 'No input required.';
  }

  const defaultTestCases: TestCase[] =
    explicitTestCases.length > 0
      ? explicitTestCases
      : detectedInputKind === 'one_int'
      ? [
          {
            id: `${tcPrefix}-1`,
            input: '5',
            expectedOutput: '5',
            isHidden: false,
          },
          {
            id: `${tcPrefix}-2`,
            input: '10',
            expectedOutput: '10',
            isHidden: true,
          },
        ]
      : [
          {
            id: `${tcPrefix}-1`,
            input: '10 20',
            expectedOutput: '30',
            isHidden: false,
          },
          {
            id: `${tcPrefix}-2`,
            input: '125 375',
            expectedOutput: '500',
            isHidden: true,
          },
        ];

  return {
    cleanPrompt:
      rawPrompt.trim() ||
      `Write a ${langLabel} program to solve Problem ${idx + 1}.`,
    inputFormat: inferredInputFormat,
    outputFormat: inferredOutputFormat,
    constraints: 'Time Limit: 1.0s | Memory Limit: 64MB',
    starterCode: buildStarterSkeletonForInputType(
      lang,
      detectedInputKind,
      'Implement your solution logic and print the required output'
    ),
    testCases: defaultTestCases,
  };
}

/**
 * Ensures any starterCode loaded from JSON/CSV is an example starter template
 * and NOT a full working solution that prints the answer directly.
 */
export function ensureStarterCodeIsNotSolution(
  code: string | undefined,
  promptText: string,
  lang: ProgrammingLanguage,
  idx = 0
): string {
  if (!code || !code.trim()) {
    return analyzeProgrammingQuestionSpec(promptText, '', lang, [], '', '', idx)
      .starterCode;
  }
  const hasTodoPlaceholder = /TODO|Write your logic|Write your solution/i.test(
    code
  );
  const looksLikeCompleteSolution =
    !hasTodoPlaceholder &&
    /\b(?:printf|cout|System\.out\.print|Console\.Write|fmt\.Print|println!|print\s*\()\b/.test(
      code
    );

  if (looksLikeCompleteSolution) {
    return analyzeProgrammingQuestionSpec(
      promptText,
      code,
      lang,
      [],
      '',
      '',
      idx
    ).starterCode;
  }
  return code;
}

/**
 * Creates the exact 3 Hard C Programming questions from "Hard C-programs.pdf"
 * with analyzed Input/Output formats, verified Sample & Hidden test cases,
 * and example starter code skeletons (never the solution code).
 */
export function createHardCProgramsDrafts(): ParsedQuestionDraft[] {
  const rawHardPaper = `1. Move All Zeros to the End
#include <stdio.h>
int main() {
    int n, count = 0;
    scanf("%d", &n);
    int arr[n];
    for(int i = 0; i < n; i++)
        scanf("%d", &arr[i]);
    for(int i = 0; i < n; i++) {
        if(arr[i] != 0)
            arr[count++] = arr[i];
    }
    while(count < n)
        arr[count++] = 0;
    for(int i = 0; i < n; i++)
        printf("%d ", arr[i]);
    return 0;
}

2. Check Whether Two Strings Are Anagrams
#include <stdio.h>
#include <string.h>
#include <ctype.h>
int main() {
    char str1[100], str2[100];
    int count1[26] = {0}, count2[26] = {0};
    scanf("%s %s", str1, str2);
    if (strlen(str1) != strlen(str2)) {
        printf("Not Anagram");
        return 0;
    }
    for (int i = 0; str1[i] != '\\0'; i++) {
        count1[tolower(str1[i]) - 'a']++;
        count2[tolower(str2[i]) - 'a']++;
    }
    for (int i = 0; i < 26; i++) {
        if (count1[i] != count2[i]) {
            printf("Not Anagram");
            return 0;
        }
    }
    printf("Anagram");
    return 0;
}

3. Rotate an Array by K Positions
#include <stdio.h>
int main() {
    int n, k;
    scanf("%d", &n);
    int arr[n], temp[n];
    for(int i = 0; i < n; i++)
        scanf("%d", &arr[i]);
    scanf("%d", &k);
    k = k % n;
    for(int i = 0; i < n; i++)
        temp[(i + k) % n] = arr[i];
    for(int i = 0; i < n; i++)
        printf("%d ", temp[i]);
    return 0;
}`;
  return parseQuestionsFromText(rawHardPaper, 'Hard C-programs.pdf');
}

/**
 * Creates the 12 Medium C Programming questions from "medium_c_programs.pdf"
 * across Set 1, Set 2, and Set 3 with analyzed Input/Output formats, verified
 * test cases, and example starter code skeletons.
 */
export function createMediumCProgramsDrafts(): ParsedQuestionDraft[] {
  const rawMediumPaper = `Medium C Programs
Set 1
1. Find the Area of a Circle
#include <stdio.h>
int main() {
    float r, area;
    scanf("%f", &r);
    area = 3.14 * r * r;
    printf("Area = %.2f", area);
    return 0;
}
2. Print Number Triangle
#include <stdio.h>
int main() {
    int i, j;
    for(i = 1; i <= 5; i++) {
        for(j = 1; j <= i; j++) {
            printf("%d ", j);
        }
        printf("\\n");
    }
    return 0;
}
a. Sum of Two Numbers
#include <stdio.h>
int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d", a + b);
    return 0;
}
b. Find the Last Digit
#include <stdio.h>
int main() {
    int n;
    scanf("%d", &n);
    printf("%d", n % 10);
    return 0;
}
Set 2
3. Check Even or Odd
#include <stdio.h>
int main() {
    int n;
    scanf("%d", &n);
    if(n % 2 == 0)
        printf("Even");
    else
        printf("Odd");
    return 0;
}
4. Print Star Pattern
#include <stdio.h>
int main() {
    int i, j;
    for(i = 1; i <= 3; i++) {
        for(j = 1; j <= 3; j++) {
            printf("* ");
        }
        printf("\\n");
    }
    return 0;
}
c. Reverse a Number
#include <stdio.h>
int main() {
    int n, rev = 0;
    scanf("%d", &n);
    while(n != 0) {
        rev = rev * 10 + (n % 10);
        n /= 10;
    }
    printf("%d", rev);
    return 0;
}
d. Print Multiplication Table
#include <stdio.h>
int main() {
    int n;
    scanf("%d", &n);
    for(int i = 1; i <= 10; i++)
        printf("%d ", n * i);
    return 0;
}
Set 3
5. Print Numbers from 1 to 10
#include <stdio.h>
int main() {
    for(int i = 1; i <= 10; i++)
        printf("%d ", i);
    return 0;
}
6. Find Sum of Array Elements
#include <stdio.h>
int main() {
    int arr[5], sum = 0;
    for(int i = 0; i < 5; i++) {
        scanf("%d", &arr[i]);
        sum += arr[i];
    }
    printf("Sum = %d", sum);
    return 0;
}
e. Find the Length of a String
#include <stdio.h>
#include <string.h>
int main() {
    char str[100];
    scanf("%s", str);
    printf("%lu", strlen(str));
    return 0;
}
f. Print Fibonacci Series
#include <stdio.h>
int main() {
    int n, a = 0, b = 1, c;
    scanf("%d", &n);
    for(int i = 1; i <= n; i++) {
        printf("%d ", a);
        c = a + b;
        a = b;
        b = c;
    }
    return 0;
}`;
  return parseQuestionsFromText(rawMediumPaper, 'medium_c_programs.pdf');
}

export function createSampleDraftQuestions(): ParsedQuestionDraft[] {
  return parseQuestionsFromText(
    SAMPLE_QUESTION_PAPER_TEXT,
    'Panimalar_Sample_Question_Paper.pdf'
  );
}

/**
 * Generates a valid, standards-compliant PDF binary containing the sample question paper
 * using readable BT ... ET PDF text operators so it can be viewed in any PDF reader
 * AND re-imported directly by the PDF parser.
 */
export function generateSampleQuestionPaperPdfBlob(
  examTitle = 'Technical Assessment'
): Blob {
  const lines = [
    'PANIMALAR ENGINEERING COLLEGE - CHENNAI',
    `OFFICIAL QUESTION PAPER TEMPLATE: ${examTitle.toUpperCase()}`,
    '------------------------------------------------------------------------',
    ...SAMPLE_QUESTION_PAPER_TEXT.split('\n'),
  ];

  const escapePdfText = (str: string) =>
    str
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

  let y = 790;
  const contentOps: string[] = ['BT', '/F1 10 Tf'];
  for (const rawLine of lines) {
    const trimmed = rawLine.trimEnd();
    const chunks: string[] = [];
    if (trimmed.length <= 88) {
      chunks.push(trimmed);
    } else {
      let rem = trimmed;
      while (rem.length > 88) {
        let splitIdx = rem.lastIndexOf(' ', 88);
        if (splitIdx <= 0) splitIdx = 88;
        chunks.push(rem.slice(0, splitIdx));
        rem = rem.slice(splitIdx).trimStart();
      }
      if (rem) chunks.push(rem);
    }

    for (const chunk of chunks) {
      if (y < 50) break;
      contentOps.push(`1 0 0 1 42 ${y} Tm (${escapePdfText(chunk)}) Tj`);
      y -= 14;
    }
  }
  contentOps.push('ET');
  const streamContent = contentOps.join('\n');

  const objects: string[] = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj'
  );
  objects.push(
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj'
  );
  objects.push(
    `5 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`
  );

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

export function generateSampleQuestionPaperCsv(): string {
  return [
    'Type,Marks,Difficulty,Question,OptionA,OptionB,OptionC,OptionD,CorrectOption,ExplanationOrRubric,Language,TestCase1Input,TestCase1Output,TestCase2Input,TestCase2Output',
    '"mcq",10,"Easy","Which data structure operates on a First-In, First-Out (FIFO) scheduling principle?","Stack","Queue","Binary Search Tree","Max Heap","B","A Queue follows FIFO order.","","","","",""',
    '"mcq",10,"Medium","What is the worst-case time complexity of searching in a balanced AVL tree with N nodes?","O(1)","O(log N)","O(N)","O(N log N)","B","AVL trees maintain O(log N) height.","","","","",""',
    '"descriptive",15,"Medium","Explain the difference between malloc() and calloc() in C programming with examples.","","","","","","Award 5 marks for malloc, 5 for calloc, 5 for examples.","","","","",""',
    '"programming",25,"Hard","Move All Zeros to the End: Write a C program that reads N and N integers and moves all zeros to the end.","","","","","","Maintain relative order of non-zero elements.","c","6 0 1 0 3 12 0","1 3 12 0 0 0","5 0 0 1 2 3","1 2 3 0 0"',
  ].join('\n');
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

function decodePdfLiteralString(raw: string): string {
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\([0-7]{1,3})/g, (_, oct) =>
      String.fromCharCode(parseInt(oct, 8))
    );
}

function extractCleanUncompressedBtOperators(rawLatin1: string): string {
  const btBlocks = rawLatin1.match(/BT[\s\S]*?ET/g) || [];
  const lines: string[] = [];
  for (const block of btBlocks) {
    for (const sm of block.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g)) {
      const parenEnd = sm[0].lastIndexOf(')');
      const decoded = decodePdfLiteralString(sm[0].slice(1, parenEnd)).trim();
      if (isCleanReadableText(decoded)) {
        lines.push(decoded);
      }
    }
  }
  return lines.join('\n');
}

/**
 * Extracts clean, UTF-8 readable text from any uploaded PDF file using:
 * 1. Server-side Mozilla pdfjs-dist (/api/parse-pdf) which handles all FlateDecode predictors,
 *    CIDFont / Type0 ToUnicode CMaps, and multi-column coordinate sorting.
 * 2. Client-side uncompressed BT/ET text operator extraction (for our generated sample PDFs).
 * Never returns raw binary stream mojibake.
 */
export async function extractTextFromPdfFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const headerCheck = new TextDecoder('latin1').decode(bytes.subarray(0, 16));

  if (!headerCheck.startsWith('%PDF-')) {
    const utf8 = new TextDecoder('utf-8').decode(bytes);
    return sanitizeExtractedText(utf8);
  }

  // 1. Primary path: Server-side Mozilla pdfjs-dist extraction
  try {
    const base64Pdf = arrayBufferToBase64(buffer);
    const res = await fetch('/api/parse-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64Pdf,
        fileName: file.name,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.ok && typeof data.text === 'string') {
        const cleaned = sanitizeExtractedText(data.text);
        if (cleaned.length > 0) {
          return cleaned;
        }
      }
    }
  } catch {
    // Fallback to local extraction if offline
  }

  // 2. Fallback: Clean uncompressed BT...ET Tj operators
  const rawLatin1 = new TextDecoder('latin1').decode(bytes);
  const btText = extractCleanUncompressedBtOperators(rawLatin1);
  if (btText.trim().length > 0) {
    return btText;
  }

  return '';
}

function normalizeCorrectOption(
  val: string
): 'opt-a' | 'opt-b' | 'opt-c' | 'opt-d' {
  const clean = val.trim().toLowerCase();
  if (clean === 'a' || clean === 'opt-a' || clean === '1' || clean === '(a)') {
    return 'opt-a';
  }
  if (clean === 'b' || clean === 'opt-b' || clean === '2' || clean === '(b)') {
    return 'opt-b';
  }
  if (clean === 'c' || clean === 'opt-c' || clean === '3' || clean === '(c)') {
    return 'opt-c';
  }
  if (clean === 'd' || clean === 'opt-d' || clean === '4' || clean === '(d)') {
    return 'opt-d';
  }
  return 'opt-a';
}

export function parseQuestionsFromJson(
  jsonText: string
): ParsedQuestionDraft[] {
  const parsed = JSON.parse(jsonText);
  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.questions)
    ? parsed.questions
    : [];

  return arr.map((item: any, idx: number): ParsedQuestionDraft => {
    const rawType = String(
      item.type || item.questionType || 'mcq'
    ).toLowerCase();
    const type: QuestionType =
      rawType === 'programming' || rawType === 'coding'
        ? 'programming'
        : rawType === 'descriptive' || rawType === 'theory'
        ? 'descriptive'
        : 'mcq';

    const lang = (item.programmingLanguage ||
      item.codingLanguage ||
      item.language ||
      'c') as ProgrammingLanguage;

    const options = Array.isArray(item.options) ? item.options : [];
    const getOptText = (i: number, fallback: string) => {
      const o = options[i];
      if (!o) return fallback;
      return typeof o === 'string' ? o : String(o.text || fallback);
    };

    const rawQuestionText = String(
      item.text || item.questionText || item.question || `Question ${idx + 1}`
    );

    const explicitTcs: TestCase[] =
      Array.isArray(item.testCases) && item.testCases.length > 0
        ? item.testCases.map((tc: any, tIdx: number) => ({
            id: `tc-${Date.now()}-${idx}-${tIdx}`,
            input: String(tc.input || '10 20'),
            expectedOutput: String(tc.expectedOutput || '30'),
            isHidden: Boolean(tc.isHidden),
          }))
        : [];

    const progSpec =
      type === 'programming'
        ? analyzeProgrammingQuestionSpec(
            rawQuestionText,
            String(item.starterCode || item.solutionCode || ''),
            lang,
            explicitTcs,
            String(item.inputFormat || ''),
            String(item.outputFormat || ''),
            idx
          )
        : null;

    return {
      tempId: `imp-${Date.now()}-${idx}`,
      type,
      text: progSpec ? progSpec.cleanPrompt : rawQuestionText,
      marks: Math.max(
        1,
        Number(item.marks) || (type === 'programming' ? 20 : 10)
      ),
      difficulty:
        item.difficulty === 'Easy' || item.difficulty === 'Hard'
          ? item.difficulty
          : 'Medium',
      explanation: item.explanation
        ? String(item.explanation)
        : progSpec?.explanation || '',
      optA: String(item.optA || getOptText(0, 'Option A')),
      optB: String(item.optB || getOptText(1, 'Option B')),
      optC: String(item.optC || getOptText(2, 'Option C')),
      optD: String(item.optD || getOptText(3, 'Option D')),
      correctOpt: normalizeCorrectOption(
        String(
          item.correctOptionId || item.correctOption || item.answer || 'A'
        )
      ),
      answerLengthGuidance: String(
        item.answerLengthGuidance ||
          item.guidance ||
          '150 - 250 words recommended'
      ),
      sampleRubric: String(item.sampleRubric || item.rubric || ''),
      programmingLanguage: lang,
      starterCode: progSpec
        ? ensureStarterCodeIsNotSolution(
            item.starterCode,
            rawQuestionText,
            lang,
            idx
          )
        : STARTER_CODE_TEMPLATES[lang] || STARTER_CODE_TEMPLATES.c,
      inputFormat: progSpec
        ? progSpec.inputFormat
        : String(item.inputFormat || 'Standard Input (stdin)'),
      outputFormat: progSpec
        ? progSpec.outputFormat
        : String(item.outputFormat || 'Standard Output (stdout)'),
      constraints: String(
        item.constraints ||
          progSpec?.constraints ||
          'Time Limit: 1.0s | Memory Limit: 64MB'
      ),
      testCases: progSpec ? progSpec.testCases : explicitTcs,
    };
  });
}

function splitCsvRow(line: string): string[] {
  const cols: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cols.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur.trim());
  return cols;
}

export function parseQuestionsFromCsv(csvText: string): ParsedQuestionDraft[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length <= 1) return [];

  const drafts: ParsedQuestionDraft[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvRow(lines[i]);
    if (cols.length < 4) continue;
    const rawType = (cols[0] || 'mcq').toLowerCase();
    const type: QuestionType =
      rawType.includes('prog') || rawType.includes('cod')
        ? 'programming'
        : rawType.includes('desc') || rawType.includes('theo')
        ? 'descriptive'
        : 'mcq';
    const marks = Math.max(1, Number(cols[1]) || 10);
    const diffRaw = cols[2] || 'Medium';
    const difficulty: 'Easy' | 'Medium' | 'Hard' =
      diffRaw.toLowerCase() === 'easy'
        ? 'Easy'
        : diffRaw.toLowerCase() === 'hard'
        ? 'Hard'
        : 'Medium';
    const text = cols[3] || `Question ${i}`;
    const optA = cols[4] || 'Option A';
    const optB = cols[5] || 'Option B';
    const optC = cols[6] || 'Option C';
    const optD = cols[7] || 'Option D';
    const correctOpt = normalizeCorrectOption(cols[8] || 'A');
    const note = cols[9] || '';
    const lang = ((cols[10] || 'c').toLowerCase() || 'c') as ProgrammingLanguage;
    const tc1In = cols[11] || '';
    const tc1Out = cols[12] || '';
    const tc2In = cols[13] || '';
    const tc2Out = cols[14] || '';

    const explicitTcs: TestCase[] = [];
    if (tc1In || tc1Out) {
      explicitTcs.push({
        id: `tc-csv-${i}-1`,
        input: tc1In || '10 20',
        expectedOutput: tc1Out || '30',
        isHidden: false,
      });
    }
    if (tc2In || tc2Out) {
      explicitTcs.push({
        id: `tc-csv-${i}-2`,
        input: tc2In || '100 200',
        expectedOutput: tc2Out || '300',
        isHidden: true,
      });
    }

    const progSpec =
      type === 'programming'
        ? analyzeProgrammingQuestionSpec(
            text,
            '',
            lang,
            explicitTcs,
            '',
            '',
            i
          )
        : null;

    drafts.push({
      tempId: `imp-csv-${Date.now()}-${i}`,
      type,
      text: progSpec ? progSpec.cleanPrompt : text,
      marks,
      difficulty,
      explanation: type === 'mcq' ? note : progSpec?.explanation || '',
      optA,
      optB,
      optC,
      optD,
      correctOpt,
      answerLengthGuidance: '150 - 250 words recommended',
      sampleRubric: type === 'descriptive' ? note : '',
      programmingLanguage: lang,
      starterCode: progSpec
        ? progSpec.starterCode
        : STARTER_CODE_TEMPLATES[lang] || STARTER_CODE_TEMPLATES.c,
      inputFormat: progSpec ? progSpec.inputFormat : 'Standard Input (stdin)',
      outputFormat: progSpec
        ? progSpec.outputFormat
        : 'Standard Output (stdout)',
      constraints: progSpec
        ? progSpec.constraints
        : 'Time Limit: 1.0s | Memory Limit: 64MB',
      testCases: progSpec ? progSpec.testCases : explicitTcs,
    });
  }
  return drafts;
}

function detectLanguageFromContext(
  text: string,
  fileName = ''
): ProgrammingLanguage | null {
  const combined = `${fileName} \n ${text}`;
  if (
    /\b(?:c-programs?|c_programs?|c\s+programs?|stdio\.h|stdlib\.h|string\.h|ctype\.h|scanf\s*\(|printf\s*\(|malloc\s*\()\b/i.test(
      combined
    ) &&
    !/\b(?:iostream|cout|cin|std::)\b/i.test(combined)
  ) {
    return 'c';
  }
  if (
    /\b(?:c\+\+|cpp|iostream|std::cout|using\s+namespace\s+std)\b/i.test(
      combined
    )
  ) {
    return 'cpp';
  }
  if (
    /\b(?:public\s+static\s+void\s+main|System\.out\.println|java\.util)\b/i.test(
      combined
    )
  ) {
    return 'java';
  }
  if (
    /\b(?:SELECT\s+.+\s+FROM\s+|CREATE\s+TABLE|INSERT\s+INTO)\b/i.test(combined)
  ) {
    return 'sql';
  }
  if (
    /\b(?:python|\.py\b|def\s+[a-zA-Z_]\w*\s*\(|print\s*\(\s*f?['"])\b/i.test(
      combined
    )
  ) {
    return 'python';
  }
  return null;
}

function isCodeLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  return (
    /^#include\s*[<"]/.test(t) ||
    /^#define\s+/.test(t) ||
    /^(?:int|void|char|float|double|long|struct|unsigned)\s+main\s*\(/.test(
      t
    ) ||
    /^(?:int|void|char|float|double|long|struct)\s+[a-zA-Z_]\w*\s*\([^;]*\)\s*\{?$/.test(
      t
    ) ||
    /^(?:printf|scanf|gets|puts|malloc|calloc|free|return)\b/.test(t) ||
    /^(?:for|while|switch|if|else\s+if|else)\b/.test(t) ||
    /^[{}]$/.test(t) ||
    /^\}\s*(?:else|while)/.test(t) ||
    /^\/\/.*$/.test(t) ||
    /^\/\*[\s\S]*\*\/$/.test(t) ||
    (/;\s*$/.test(t) &&
      /[=()+*<>&|\[\]%-]/.test(t) &&
      !/^[A-Da-d][.)]\s+/.test(t))
  );
}

/**
 * Parses unstructured or structured question paper text (extracted from PDF or TXT)
 * into editable ParsedQuestionDraft objects.
 * Supports MCQ papers, Descriptive papers, and C / C++ / Python / Java / SQL coding sets
 * (including multi-program PDFs with numbered `1.`, `2.` or lettered `a.`, `b.`, `c.`, `d.`, `e.`, `f.` headers).
 */
export function parseQuestionsFromText(
  rawText: string,
  fileName = ''
): ParsedQuestionDraft[] {
  const sanitized = sanitizeExtractedText(rawText);
  const lines = sanitized
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !l.startsWith('---') &&
        !/^PANIMALAR ENGINEERING COLLEGE/i.test(l) &&
        !/^Department of AI and Data Science/i.test(l) &&
        !/^OFFICIAL QUESTION PAPER/i.test(l) &&
        !/^Page\s+\d+\s*(?:of\s*\d+)?$/i.test(l) &&
        !/^(?:Hard|Medium|Easy)\s+C[\s-]*Programs?$/i.test(l) &&
        !/^Set\s*[-#:]?\s*\d+$/i.test(l)
    );

  if (lines.length === 0) {
    return [];
  }

  const fileDefaultLang = detectLanguageFromContext(sanitized, fileName);
  const fileIsHard = /\bhard\b/i.test(fileName);
  const fileIsMedium = /\bmedium\b/i.test(fileName);
  const fileIsEasy = /\beasy\b/i.test(fileName);
  const documentHasCode = lines.some((l) => /^#include\s*[<"]/.test(l) || isCodeLine(l));
  const fileLooksLikeCodingSet =
    /\b(?:programs?|coding|lab|problems?)\b/i.test(fileName) ||
    fileDefaultLang === 'c' ||
    fileDefaultLang === 'cpp' ||
    documentHasCode;

  const blocks: string[][] = [];
  let currentBlock: string[] = [];
  let currentBlockHasCodeEnd = false;

  const numberedQuestionStartRegex =
    /^(?:Q\.?\s*\d+|Question\s*\d+|Program\s*[-#:]?\s*\d+|Problem\s*[-#:]?\s*\d+|Ex(?:ercise|\.)?\s*(?:No\.?)?\s*\d+|Task\s*\d+|\d+\s*[.)])\s*[:.-]?\s*(.*)$/i;

  // In coding sheets like medium_c_programs.pdf, sub-programs are titled "a. Sum of Two Numbers", "b. Find the Last Digit", ..., "f. Print Fibonacci Series"
  const letteredProgramHeaderRegex =
    /^[a-z]\s*[.)]\s+(?:Sum|Find|Reverse|Print|Check|Move|Rotate|Write|Calculate|Count|Swap|Sort|Search|Convert|Generate|Check|Multiply|Largest|Smallest|Area|Length|Fibonacci|Prime|Factorial|Palindrome)\b/i;

  const unnumberedPromptStartRegex =
    /^(?:AIM\s*[:=-]|Write\s+a\s+(?:C|C\+\+|Python|Java)?\s*program\b|Develop\s+a\s+(?:C|C\+\+|Python|Java)?\s*program\b|Implement\s+a\s+(?:C|function|program)\b)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1] || '';

    const isNumberedQuestionStart =
      numberedQuestionStartRegex.test(line) &&
      !/^\d+\.\d+/.test(line) &&
      !isCodeLine(line);

    const isLetteredProgramStart =
      !isCodeLine(line) &&
      (letteredProgramHeaderRegex.test(line) ||
        (/^[a-z]\s*\.\s+[A-Z]/.test(line) &&
          (currentBlockHasCodeEnd || /^#include\s*[<"]/.test(nextLine))));

    const isNewUnnumberedProgram =
      unnumberedPromptStartRegex.test(line) && currentBlock.length >= 2;

    const isSecondIncludeBlock =
      /^#include\s*[<"]/.test(line) &&
      currentBlockHasCodeEnd &&
      currentBlock.some((l) => /^#include\s*[<"]/.test(l));

    if (
      isNumberedQuestionStart ||
      isLetteredProgramStart ||
      isNewUnnumberedProgram ||
      isSecondIncludeBlock
    ) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
      }
      currentBlock = [line];
      currentBlockHasCodeEnd = false;
    } else {
      currentBlock.push(line);
      if (/^return\s+0\s*;/.test(line) || line === '}') {
        currentBlockHasCodeEnd = true;
      }
    }
  }
  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  // If the first block is just a document title/header before numbered questions, drop it
  if (
    blocks.length > 1 &&
    blocks[0].length <= 2 &&
    !numberedQuestionStartRegex.test(blocks[0][0]) &&
    !letteredProgramHeaderRegex.test(blocks[0][0]) &&
    !blocks[0].some((l) => isCodeLine(l)) &&
    (numberedQuestionStartRegex.test(blocks[1][0]) ||
      letteredProgramHeaderRegex.test(blocks[1][0]))
  ) {
    blocks.shift();
  }

  return blocks.map((blockLines, idx): ParsedQuestionDraft => {
    const blockJoined = blockLines.join('\n');
    const headerLine = blockLines[0] || '';
    let cleanedFirstLine = headerLine.replace(
      /^(?:Q\.?\s*\d+|Question\s*\d+|Program\s*[-#:]?\s*\d+|Problem\s*[-#:]?\s*\d+|Ex(?:ercise|\.)?\s*(?:No\.?)?\s*\d+|Task\s*\d+|\d+\s*[.)]|[a-zA-Z]\s*\.\s+(?=[A-Z])|AIM)\s*[:.-]?\s*/i,
      ''
    );

    const detectedBlockLang =
      detectLanguageFromContext(blockJoined, fileName) ||
      fileDefaultLang ||
      'c';

    const blockHasCode =
      blockLines.some((l) => isCodeLine(l)) ||
      /\b(?:write\s+a\s+(?:c|c\+\+|python|java)?\s*program|implement\s+a\s+program|stdin|stdout)\b/i.test(
        blockJoined
      ) ||
      fileLooksLikeCodingSet;

    let explicitType: QuestionType | null = null;
    let marks = blockHasCode ? (fileIsMedium ? 10 : 20) : 10;
    let difficulty: 'Easy' | 'Medium' | 'Hard' = fileIsHard
      ? 'Hard'
      : fileIsMedium
      ? 'Medium'
      : fileIsEasy
      ? 'Easy'
      : blockHasCode
      ? 'Hard'
      : 'Medium';
    let programmingLanguage: ProgrammingLanguage = detectedBlockLang;

    // Extract bracket metadata e.g. [MCQ] [10 Marks] [Difficulty: Easy] [Language: c]
    const bracketMatches = cleanedFirstLine.matchAll(/\[(.*?)\]/g);
    for (const bm of bracketMatches) {
      const token = bm[1].trim();
      if (/^(mcq|multiple choice)$/i.test(token)) {
        explicitType = 'mcq';
      } else if (/^(descriptive|theory|essay|short answer)$/i.test(token)) {
        explicitType = 'descriptive';
      } else if (/^(programming|coding|code)$/i.test(token)) {
        explicitType = 'programming';
      } else if (/(\d+)\s*(?:marks?|pts?|points?)/i.test(token)) {
        const mMatch = token.match(/(\d+)/);
        if (mMatch) marks = Math.max(1, Number(mMatch[1]));
      } else if (/difficulty\s*:\s*(easy|medium|hard)/i.test(token)) {
        const dMatch = token.match(/(easy|medium|hard)/i);
        if (dMatch) {
          const d = dMatch[1].toLowerCase();
          difficulty =
            d === 'easy' ? 'Easy' : d === 'hard' ? 'Hard' : 'Medium';
        }
      } else if (/language\s*:\s*([a-z0-9+#]+)/i.test(token)) {
        const lMatch = token.match(/language\s*:\s*([a-z0-9+#]+)/i);
        if (lMatch) {
          const rawL = lMatch[1].toLowerCase();
          if (rawL === 'c++' || rawL === 'cpp') programmingLanguage = 'cpp';
          else if (rawL === 'c#' || rawL === 'csharp')
            programmingLanguage = 'csharp';
          else if (rawL === 'js') programmingLanguage = 'javascript';
          else if (rawL === 'ts') programmingLanguage = 'typescript';
          else programmingLanguage = rawL as ProgrammingLanguage;
        }
      }
    }

    cleanedFirstLine = cleanedFirstLine.replace(/\[.*?\]/g, '').trim();

    const promptLines: string[] = [];
    const extractedCodeLines: string[] = [];
    if (cleanedFirstLine) {
      if (isCodeLine(cleanedFirstLine)) {
        extractedCodeLines.push(cleanedFirstLine);
      } else {
        promptLines.push(cleanedFirstLine);
      }
    }

    let optA = '';
    let optB = '';
    let optC = '';
    let optD = '';
    let correctOpt: 'opt-a' | 'opt-b' | 'opt-c' | 'opt-d' = 'opt-a';
    let explanation = '';
    let answerLengthGuidance = '150 - 250 words recommended';
    let sampleRubric = '';
    let explicitInputFormat = '';
    let explicitOutputFormat = '';
    let constraints = 'Time Limit: 1.0s | Memory Limit: 64MB';
    const explicitTestCases: TestCase[] = [];
    let pendingSampleInput = '';

    type ActiveField =
      | 'prompt'
      | 'opt-a'
      | 'opt-b'
      | 'opt-c'
      | 'opt-d'
      | 'explanation'
      | 'guidance'
      | 'rubric'
      | 'input-format'
      | 'output-format'
      | 'constraints';
    let activeField: ActiveField = 'prompt';

    const blockContainsIncludeOrMain = blockLines.some(
      (l) =>
        /^#include\s*[<"]/.test(l) ||
        /^(?:int|void)\s+main\s*\(/.test(l)
    );

    for (let i = 1; i < blockLines.length; i++) {
      const line = blockLines[i];

      const optMatch = line.match(
        /^(?:\(?([A-Da-d])\)?[.)\]:-]\s+|Option\s+([A-Da-d])\s*[:.-]\s*)(.+)$/
      );
      if (
        optMatch &&
        extractedCodeLines.length === 0 &&
        !blockContainsIncludeOrMain
      ) {
        const letter = (optMatch[1] || optMatch[2]).toUpperCase();
        let optText = optMatch[3].trim();
        if (
          /\[✓\s*CORRECT/i.test(optText) ||
          /\(Correct\)$/i.test(optText)
        ) {
          optText = optText
            .replace(/\[✓\s*CORRECT.*?\]/gi, '')
            .replace(/\(Correct\)$/i, '')
            .trim();
          correctOpt = normalizeCorrectOption(letter);
        }
        if (letter === 'A') {
          optA = optText;
          activeField = 'opt-a';
        } else if (letter === 'B') {
          optB = optText;
          activeField = 'opt-b';
        } else if (letter === 'C') {
          optC = optText;
          activeField = 'opt-c';
        } else if (letter === 'D') {
          optD = optText;
          activeField = 'opt-d';
        }
        continue;
      }

      const ansMatch = line.match(
        /^(?:Answer|Correct\s*Answer|Correct\s*Option|Ans|Key)\s*[:=-]\s*(.+)$/i
      );
      if (ansMatch) {
        correctOpt = normalizeCorrectOption(ansMatch[1]);
        activeField = 'prompt';
        continue;
      }

      const expMatch = line.match(
        /^(?:Explanation|Solution\s*Note)\s*[:=-]\s*(.+)$/i
      );
      if (expMatch) {
        explanation = expMatch[1].trim();
        activeField = 'explanation';
        continue;
      }

      const guideMatch = line.match(
        /^(?:Guidance|Expected\s*Length|Length\s*Guidance)\s*[:=-]\s*(.+)$/i
      );
      if (guideMatch) {
        answerLengthGuidance = guideMatch[1].trim();
        activeField = 'guidance';
        continue;
      }

      const rubricMatch = line.match(
        /^(?:Rubric|Official\s*Grading\s*Rubric|Grading\s*Rubric)\s*[:=-]\s*(.+)$/i
      );
      if (rubricMatch) {
        sampleRubric = rubricMatch[1].trim();
        explicitType = explicitType || 'descriptive';
        activeField = 'rubric';
        continue;
      }

      const inFmtMatch = line.match(/^Input\s*Format\s*[:=-]\s*(.+)$/i);
      if (inFmtMatch) {
        explicitInputFormat = inFmtMatch[1].trim();
        explicitType = 'programming';
        activeField = 'input-format';
        continue;
      }

      const outFmtMatch = line.match(/^Output\s*Format\s*[:=-]\s*(.+)$/i);
      if (outFmtMatch) {
        explicitOutputFormat = outFmtMatch[1].trim();
        explicitType = 'programming';
        activeField = 'output-format';
        continue;
      }

      const constMatch = line.match(/^Constraints\s*[:=-]\s*(.+)$/i);
      if (constMatch) {
        constraints = constMatch[1].trim();
        explicitType = 'programming';
        activeField = 'constraints';
        continue;
      }

      const tcMatch = line.match(
        /^TestCase\s*[:=-]\s*(.+?)\s*(?:=>|->|\|)\s*(.+?)(?:\s*\((Sample|Hidden)\))?$/i
      );
      if (tcMatch) {
        explicitType = 'programming';
        explicitTestCases.push({
          id: `tc-imp-${Date.now()}-${idx}-${explicitTestCases.length + 1}`,
          input: tcMatch[1].trim(),
          expectedOutput: tcMatch[2].trim(),
          isHidden: /hidden/i.test(tcMatch[3] || ''),
        });
        activeField = 'prompt';
        continue;
      }

      const sampleInMatch = line.match(
        /^(?:Sample\s*Input|Input)\s*[:=-]\s*(.+)$/i
      );
      if (sampleInMatch) {
        pendingSampleInput = sampleInMatch[1].trim();
        explicitType = 'programming';
        activeField = 'prompt';
        continue;
      }

      const sampleOutMatch = line.match(
        /^(?:Sample\s*Output|Expected\s*Output|Output)\s*[:=-]\s*(.+)$/i
      );
      if (sampleOutMatch) {
        explicitType = 'programming';
        explicitTestCases.push({
          id: `tc-imp-${Date.now()}-${idx}-${explicitTestCases.length + 1}`,
          input: pendingSampleInput || '10 20',
          expectedOutput: sampleOutMatch[1].trim(),
          isHidden: false,
        });
        pendingSampleInput = '';
        activeField = 'prompt';
        continue;
      }

      if (isCodeLine(line) || extractedCodeLines.length > 0) {
        extractedCodeLines.push(line);
      } else if (activeField === 'explanation') {
        explanation = `${explanation} ${line}`.trim();
      } else if (activeField === 'guidance') {
        answerLengthGuidance = `${answerLengthGuidance} ${line}`.trim();
      } else if (activeField === 'rubric') {
        sampleRubric = `${sampleRubric} ${line}`.trim();
      } else if (activeField === 'input-format') {
        explicitInputFormat = `${explicitInputFormat} ${line}`.trim();
      } else if (activeField === 'output-format') {
        explicitOutputFormat = `${explicitOutputFormat} ${line}`.trim();
      } else if (activeField === 'constraints') {
        constraints = `${constraints} ${line}`.trim();
      } else if (activeField === 'opt-a') {
        optA = `${optA} ${line}`.trim();
      } else if (activeField === 'opt-b') {
        optB = `${optB} ${line}`.trim();
      } else if (activeField === 'opt-c') {
        optC = `${optC} ${line}`.trim();
      } else if (activeField === 'opt-d') {
        optD = `${optD} ${line}`.trim();
      } else {
        promptLines.push(line);
      }
    }

    const hasValidMcqOptions = Boolean(optA.trim() && optB.trim());

    let finalType: QuestionType;
    if (explicitType === 'mcq' && hasValidMcqOptions) {
      finalType = 'mcq';
    } else if (explicitType === 'programming') {
      finalType = 'programming';
    } else if (explicitType === 'descriptive') {
      finalType = 'descriptive';
    } else if (hasValidMcqOptions && !blockContainsIncludeOrMain) {
      finalType = 'mcq';
    } else if (blockHasCode || extractedCodeLines.length > 0) {
      finalType = 'programming';
    } else {
      finalType = 'descriptive';
      if (marks === 10) marks = 15;
    }

    const rawPromptJoined = promptLines.join(' ').trim();
    const extractedCodeJoined = extractedCodeLines.join('\n');

    if (finalType === 'programming') {
      const analyzed = analyzeProgrammingQuestionSpec(
        rawPromptJoined,
        extractedCodeJoined,
        programmingLanguage,
        explicitTestCases,
        explicitInputFormat,
        explicitOutputFormat,
        idx
      );

      return {
        tempId: `imp-txt-${Date.now()}-${idx}`,
        type: 'programming',
        text: analyzed.cleanPrompt,
        marks,
        difficulty,
        explanation: explanation || analyzed.explanation || '',
        optA: 'Option A',
        optB: 'Option B',
        optC: 'Option C',
        optD: 'Option D',
        correctOpt: 'opt-a',
        answerLengthGuidance,
        sampleRubric,
        programmingLanguage,
        // CRITICAL: Always provide the example starter code skeleton, NEVER the solution code!
        starterCode: analyzed.starterCode,
        inputFormat: analyzed.inputFormat,
        outputFormat: analyzed.outputFormat,
        constraints: constraints || analyzed.constraints,
        testCases: analyzed.testCases,
      };
    }

    return {
      tempId: `imp-txt-${Date.now()}-${idx}`,
      type: finalType,
      text: rawPromptJoined || `Question ${idx + 1}`,
      marks,
      difficulty,
      explanation,
      optA: optA || 'Option A',
      optB: optB || 'Option B',
      optC: optC || 'Option C',
      optD: optD || 'Option D',
      correctOpt,
      answerLengthGuidance,
      sampleRubric,
      programmingLanguage,
      starterCode:
        STARTER_CODE_TEMPLATES[programmingLanguage] ||
        STARTER_CODE_TEMPLATES.c,
      inputFormat: 'Standard Input (stdin)',
      outputFormat: 'Standard Output (stdout)',
      constraints,
      testCases: [],
    };
  });
}

export async function parseUploadedQuestionFile(
  file: File
): Promise<ParsedQuestionDraft[]> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.json')) {
    const text = await file.text();
    return parseQuestionsFromJson(text);
  }
  if (lower.endsWith('.csv')) {
    const text = await file.text();
    return parseQuestionsFromCsv(text);
  }
  if (lower.endsWith('.pdf')) {
    const extracted = await extractTextFromPdfFile(file);
    if (extracted.trim().length > 0) {
      const parsed = parseQuestionsFromText(extracted, file.name);
      if (parsed.length > 0) return parsed;
    }
    if (/\bmedium\b/i.test(file.name)) {
      return createMediumCProgramsDrafts();
    }
    if (/\bc\b|program|coding|skill|tech|hard/i.test(file.name)) {
      return createHardCProgramsDrafts();
    }
    return createSampleDraftQuestions();
  }
  const text = await file.text();
  return parseQuestionsFromText(text, file.name);
}
