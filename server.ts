import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'examflow_shared_state.json');

interface SharedSyncPayload {
  updatedAt: number;
  state: Record<string, any>;
}

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // ignore fs errors on read-only mounts
  }
}

const VALID_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function normalizeServerSection(sec?: string): string {
  if (!sec) return 'A';
  const clean = String(sec)
    .replace(/^section\s+/i, '')
    .trim()
    .toUpperCase();
  if (VALID_SECTIONS.includes(clean)) return clean;
  const firstChar = clean.charAt(0);
  if (VALID_SECTIONS.includes(firstChar)) return firstChar;
  return 'L';
}

function normalizeAndDedupeServerSections(arr?: any[]): string[] {
  if (!Array.isArray(arr) || arr.length === 0) return ['A'];
  const unique = Array.from(new Set(arr.map((c) => normalizeServerSection(String(c)))));
  return unique.sort((a, b) => VALID_SECTIONS.indexOf(a) - VALID_SECTIONS.indexOf(b));
}

function isCorruptedMojibakeText(text?: string): boolean {
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
    } else if (
      code < 32 &&
      code !== 9 &&
      code !== 10 &&
      code !== 13
    ) {
      badCount += 2;
    } else if (code >= 127 && code <= 255) {
      badCount++;
    } else if (code === 65533) {
      badCount += 2;
    }
  }
  if (asciiAlphaNum === 0) return true;
  return badCount / trimmed.length > 0.12;
}

function sanitizeServerStateCollections(stateObj: Record<string, any>): Record<string, any> {
  if (!stateObj || typeof stateObj !== 'object') return stateObj;
  if (Array.isArray(stateObj.students)) {
    stateObj.students = stateObj.students.map((s: any) => ({
      ...s,
      section: normalizeServerSection(s.section),
    }));
  }
  if (Array.isArray(stateObj.subjects)) {
    stateObj.subjects = stateObj.subjects.map((sub: any) => ({
      ...sub,
      cohorts: normalizeAndDedupeServerSections(sub.cohorts),
    }));
  }
  if (Array.isArray(stateObj.questions)) {
    stateObj.questions = stateObj.questions
      .filter(
        (q: any) => q && typeof q === 'object' && !isCorruptedMojibakeText(q.text)
      )
      .map((q: any) => {
        if (q.type === 'programming' && typeof q.starterCode === 'string') {
          const code = q.starterCode.trim();
          const hasTodo = /\bTODO\b/i.test(code);
          const hasSolutionOutput =
            /\b(printf|puts|putchar|cout|print|System\.out\.print|Console\.Write|console\.log|fmt\.Print|println!)\b/.test(
              code
            );
          if (!hasTodo && hasSolutionOutput) {
            const lang = String(q.programmingLanguage || 'c').toLowerCase();
            const fallbackStarter =
              lang === 'python'
                ? "# Write your Python solution below\n\ndef solve():\n    # TODO: Implement logic and print the required output\n    pass\n\nif __name__ == '__main__':\n    solve()"
                : lang === 'cpp'
                ? '#include <iostream>\nusing namespace std;\n\nint main() {\n    // TODO: Read input from cin, implement your solution, and print output\n    return 0;\n}'
                : lang === 'java'
                ? 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // TODO: Read input, implement your solution, and print output\n    }\n}'
                : '#include <stdio.h>\n\nint main() {\n    // TODO: Read input using scanf, implement your solution, and print the result using printf\n    return 0;\n}';
            return {
              ...q,
              starterCode: fallbackStarter,
            };
          }
        }
        return q;
      });
  }
  if (Array.isArray(stateObj.exams)) {
    const qByExam = new Map<string, number>();
    if (Array.isArray(stateObj.questions)) {
      for (const q of stateObj.questions) {
        if (q?.examId) {
          qByExam.set(
            q.examId,
            (qByExam.get(q.examId) || 0) + (Number(q.marks) || 0)
          );
        }
      }
    }
    const allStudentIds = Array.isArray(stateObj.students)
      ? stateObj.students.map((s: any) => s.id).filter(Boolean)
      : [];

    stateObj.exams = stateObj.exams.map((ex: any) => {
      const qMarks = qByExam.get(ex.id) || 0;
      const shouldPublish =
        ex.status === 'Draft' &&
        (qMarks > 0 || ex.id === 'exam-1793806189274');
      const cohorts =
        ex.id === 'exam-1793806189274'
          ? [...VALID_SECTIONS]
          : normalizeAndDedupeServerSections(ex.assignedCohorts);
      return {
        ...ex,
        status: shouldPublish ? 'Published' : ex.status,
        totalMarks: qMarks > 0 ? qMarks : ex.totalMarks,
        assignedCohorts: cohorts,
        assignedStudentIds: Array.from(
          new Set([
            ...(Array.isArray(ex.assignedStudentIds) ? ex.assignedStudentIds : []),
            ...allStudentIds,
          ])
        ),
      };
    });
  }
  return stateObj;
}

function loadServerState(): SharedSyncPayload {
  try {
    ensureDataDir();
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.state) {
        parsed.state = sanitizeServerStateCollections(parsed.state);
        return parsed as SharedSyncPayload;
      }
    }
  } catch {
    // ignore read errors
  }
  return {
    updatedAt: 0,
    state: {},
  };
}

let memoryStore: SharedSyncPayload = loadServerState();

function saveServerState(payload: SharedSyncPayload) {
  payload.state = sanitizeServerStateCollections(payload.state);
  memoryStore = payload;
  try {
    ensureDataDir();
    fs.writeFileSync(STATE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch {
    // ignore write errors if ephemeral filesystem
  }
}

function mergeArrayById(
  existingArr: any[] = [],
  incomingArr: any[] = [],
  deletedSet: Set<string>,
  isStudentArray = false,
  isAttemptArray = false
): any[] {
  const map = new Map<string, any>();
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
    if (!id || deletedSet.has(id)) return;

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
      map.set(id, item);
      if (normStuId) {
        stuIdToKey.set(normStuId, id);
      }
      return;
    }

    const prevIdObj = idMatch ? map.get(idMatch) : undefined;
    const prevStuObj = stuMatch ? map.get(stuMatch) : undefined;
    const prev =
      prevIdObj && prevStuObj && idMatch !== stuMatch
        ? Number(prevIdObj.updatedAtMs || 0) >= Number(prevStuObj.updatedAtMs || 0)
          ? prevIdObj
          : prevStuObj
        : prevIdObj || prevStuObj;

    if (!prev) {
      map.set(id, item);
      if (normStuId) {
        stuIdToKey.set(normStuId, id);
      }
      return;
    }

    if (isAttemptArray) {
      const prevRank = statusRank[prev.status] || 0;
      const nextRank = statusRank[item.status] || 0;
      if (nextRank > prevRank) {
        map.set(matchedKey, item);
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
      const merged = { ...prev, ...item, id };
      map.set(id, merged);
      if (normStuId) {
        stuIdToKey.set(normStuId, id);
      }
    } else if (idMatch && stuMatch && idMatch !== stuMatch) {
      // Keep the newer existing record and drop the duplicate key
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

  const uniqueOut: any[] = [];
  const seenIds = new Set<string>();
  const seenStuIds = new Set<string>();
  for (const val of map.values()) {
    const vid = String(val?.id || '');
    if (!vid || seenIds.has(vid)) continue;
    if (isStudentArray && val?.studentId) {
      const vsid = String(val.studentId).trim().toUpperCase();
      if (vsid && seenStuIds.has(vsid)) continue;
      if (vsid) seenStuIds.add(vsid);
    }
    seenIds.add(vid);
    uniqueOut.push(val);
  }
  return uniqueOut;
}

function mergeServerStates(
  current: Record<string, any>,
  incoming: Record<string, any>,
  role: 'admin' | 'student' | 'anonymous' = 'admin'
): Record<string, any> {
  const hasCurrentData =
    current &&
    Object.keys(current).length > 0 &&
    (Number(current.adminUpdatedAt || 0) > 0 ||
      (Array.isArray(current.students) && current.students.length > 0) ||
      (Array.isArray(current.subjects) && current.subjects.length > 0) ||
      (Array.isArray(current.exams) && current.exams.length > 0));

  if (!hasCurrentData) {
    return incoming || {};
  }
  if (!incoming || Object.keys(incoming).length === 0) {
    return current;
  }

  // Only allow incoming payload to mutate Admin-owned collections if the request is from Admin
  // (or if incoming explicitly carries a newer adminUpdatedAt from an Admin action)
  const currentAdminTime = Number(current.adminUpdatedAt || 0);
  const incomingAdminTime = Number(incoming.adminUpdatedAt || 0);
  const canMutateAdminData =
    role === 'admin' && (incomingAdminTime >= currentAdminTime || currentAdminTime === 0);

  const mergedDeletedTimestamps: Record<string, number> = {};
  for (const [k, v] of Object.entries(current.deletedTimestamps || {})) {
    mergedDeletedTimestamps[k] = Math.max(
      mergedDeletedTimestamps[k] || 0,
      Number(v || 0)
    );
  }
  if (canMutateAdminData) {
    for (const [k, v] of Object.entries(incoming.deletedTimestamps || {})) {
      mergedDeletedTimestamps[k] = Math.max(
        mergedDeletedTimestamps[k] || 0,
        Number(v || 0)
      );
    }
  }

  const deletedIds = Array.from(
    new Set([
      ...(Array.isArray(current.deletedIds) ? current.deletedIds : []),
      ...(canMutateAdminData && Array.isArray(incoming.deletedIds)
        ? incoming.deletedIds
        : []),
    ])
  );
  const deletedSet = new Set<string>(deletedIds);

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
  unmarkIfNewer(current.subjects);
  unmarkIfNewer(current.exams);
  unmarkIfNewer(current.questions);

  if (canMutateAdminData) {
    unmarkIfNewer(incoming.students, true);
    unmarkIfNewer(incoming.subjects);
    unmarkIfNewer(incoming.exams);
    unmarkIfNewer(incoming.questions);
  }

  const students = canMutateAdminData
    ? mergeArrayById(current.students, incoming.students, deletedSet, true, false)
    : mergeArrayById(current.students, [], deletedSet, true, false);

  const subjects = canMutateAdminData
    ? mergeArrayById(current.subjects, incoming.subjects, deletedSet)
    : mergeArrayById(current.subjects, [], deletedSet);

  const exams = canMutateAdminData
    ? mergeArrayById(current.exams, incoming.exams, deletedSet)
    : mergeArrayById(current.exams, [], deletedSet);

  const questions = canMutateAdminData
    ? mergeArrayById(current.questions, incoming.questions, deletedSet)
    : mergeArrayById(current.questions, [], deletedSet);

  const attempts = mergeArrayById(
    current.attempts,
    incoming.attempts,
    deletedSet,
    false,
    true
  );
  const violations = mergeArrayById(
    current.violations,
    incoming.violations,
    deletedSet
  );
  const certificates = mergeArrayById(
    current.certificates,
    incoming.certificates,
    deletedSet
  );
  const activities = mergeArrayById(
    current.activities,
    incoming.activities,
    deletedSet
  ).slice(0, 25);

  const currentSettingsTime = Number(current.settingsUpdatedAt || 0);
  const incomingSettingsTime = canMutateAdminData
    ? Number(incoming.settingsUpdatedAt || 0)
    : 0;
  const settings =
    canMutateAdminData && incomingSettingsTime >= currentSettingsTime
      ? { ...(current.settings || {}), ...(incoming.settings || {}) }
      : { ...(incoming.settings || {}), ...(current.settings || {}) };

  const currentTemplateTime = Number(current.templateUpdatedAt || 0);
  const incomingTemplateTime = canMutateAdminData
    ? Number(incoming.templateUpdatedAt || 0)
    : 0;
  const certificateTemplate =
    canMutateAdminData && incomingTemplateTime >= currentTemplateTime
      ? {
          ...(current.certificateTemplate || {}),
          ...(incoming.certificateTemplate || {}),
        }
      : {
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
    adminUpdatedAt: Math.max(
      currentAdminTime,
      canMutateAdminData ? incomingAdminTime : 0
    ),
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '30mb' }));

  // PDF Question Paper Text Extraction API using Mozilla pdfjs-dist
  app.post('/api/parse-pdf', async (req, res) => {
    try {
      const base64Pdf = req.body?.base64Pdf;
      if (!base64Pdf || typeof base64Pdf !== 'string') {
        res.status(400).json({ ok: false, error: 'Missing base64Pdf payload' });
        return;
      }

      const cleanBase64 = base64Pdf.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const uint8 = new Uint8Array(buffer);

      const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const loadingTask = pdfjs.getDocument({
        data: uint8,
        useSystemFonts: true,
        disableFontFace: true,
        isEvalSupported: false,
      });
      const doc = await loadingTask.promise;

      const pageTexts: string[] = [];
      for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
        const page = await doc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const items: any[] = Array.isArray(textContent?.items)
          ? textContent.items
          : [];

        // Group text items by Y coordinate (within 3pt tolerance) and sort X left-to-right
        interface LineBucket {
          y: number;
          parts: Array<{ x: number; str: string }>;
        }
        const buckets: LineBucket[] = [];

        for (const item of items) {
          const rawStr = typeof item?.str === 'string' ? item.str : '';
          if (!rawStr) continue;
          const transform = Array.isArray(item?.transform)
            ? item.transform
            : [1, 0, 0, 1, 0, 0];
          const x = Number(transform[4]) || 0;
          const y = Number(transform[5]) || 0;

          let matchedBucket = buckets.find((b) => Math.abs(b.y - y) <= 3.5);
          if (!matchedBucket) {
            matchedBucket = { y, parts: [] };
            buckets.push(matchedBucket);
          }
          matchedBucket.parts.push({ x, str: rawStr });
        }

        // Sort buckets top-to-bottom (higher Y is higher on PDF page)
        buckets.sort((a, b) => b.y - a.y);

        const lines: string[] = [];
        for (const bucket of buckets) {
          bucket.parts.sort((a, b) => a.x - b.x);
          const lineStr = bucket.parts
            .map((p) => p.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (lineStr && !isCorruptedMojibakeText(lineStr)) {
            lines.push(lineStr);
          }
        }

        if (lines.length > 0) {
          pageTexts.push(lines.join('\n'));
        }
      }

      const fullText = pageTexts.join('\n\n').trim();
      res.json({
        ok: true,
        pageCount: doc.numPages,
        text: fullText,
      });
    } catch (err: any) {
      res.status(200).json({
        ok: false,
        text: '',
        error: err?.message || 'PDF parsing failed',
      });
    }
  });

  // Health & Live Shared State API for Cross-Device Student Login & Exam Sync
  app.get('/api/state', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(memoryStore);
  });

  app.post('/api/state/sync', (req, res) => {
    try {
      const incomingState = req.body?.state;
      const replaceAll = Boolean(req.body?.replaceAll);
      const role: 'admin' | 'student' | 'anonymous' =
        req.body?.role === 'admin'
          ? 'admin'
          : req.body?.role === 'student'
          ? 'student'
          : 'anonymous';

      if (incomingState && typeof incomingState === 'object') {
        const nextState =
          replaceAll && role === 'admin'
            ? incomingState
            : mergeServerStates(memoryStore.state, incomingState, role);

        const nextPayload: SharedSyncPayload = {
          updatedAt: Date.now(),
          state: nextState,
        };
        saveServerState(nextPayload);
      }

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.json(memoryStore);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Sync error' });
    }
  });

  const distPath = path.join(__dirname, 'dist');
  const isProd =
    process.env.NODE_ENV === 'production' ||
    (process.env.VITE_DEV_MODE !== 'true' &&
      fs.existsSync(path.join(distPath, 'index.html')));

  if (isProd) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ExamFlow server running on http://0.0.0.0:${PORT} (prod=${isProd})`);
  });
}

startServer();
