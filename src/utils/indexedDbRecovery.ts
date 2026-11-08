import { StudentAnswer } from '../types/exam.ts';

const DB_NAME = 'ExamFlowRecoveryDB';
const STORE_NAME = 'attempt_answers';
const DB_VERSION = 1;

function openRecoveryDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'attemptId' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

export async function saveAttemptBackupToIndexedDB(
  attemptId: string,
  examId: string,
  studentId: string,
  answers: Record<string, StudentAnswer>
): Promise<boolean> {
  const db = await openRecoveryDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({
        attemptId,
        examId,
        studentId,
        answers,
        syncedAt: new Date().toISOString(),
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function loadAttemptBackupFromIndexedDB(
  attemptId: string
): Promise<{ answers: Record<string, StudentAnswer>; syncedAt: string } | null> {
  const db = await openRecoveryDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(attemptId);
      req.onsuccess = () => {
        if (req.result && req.result.answers) {
          resolve({
            answers: req.result.answers,
            syncedAt: req.result.syncedAt,
          });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}
