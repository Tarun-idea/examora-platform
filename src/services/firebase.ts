/**
 * Firebase Client SDK Initialization & Helpers
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, getDocFromServer, setDoc, onSnapshot, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence verbose connection warnings during token service propagation/offline mode
setLogLevel('silent');

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

export const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
];

SCOPES.forEach((scope) => {
  googleAuthProvider.addScope(scope);
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory only (never in localStorage or sessionStorage).
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called directly from a button click or user interaction (no prior awaits)
export const googleSignIn = async (): Promise<{ user: FirebaseUser; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    // Call signInWithPopup synchronously in the first tick of the click handler
    const popupPromise = signInWithPopup(auth, googleAuthProvider);
    const result = await popupPromise;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Sign-In');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Encode RFC 2822 email message to base64url format required by Gmail API
 */
function encodeMimeMessageBase64Url(to: string, subject: string, htmlBody: string): string {
  const mimeMessage = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    htmlBody,
  ].join('\r\n');

  return btoa(unescape(encodeURIComponent(mimeMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Send an email via the Gmail API (https://gmail.googleapis.com/gmail/v1/users/me/messages/send)
 * Calls googleSignIn() synchronously on the first tick if no token is cached so popups are not blocked.
 */
export async function sendGmailMessage(params: {
  to: string;
  subject: string;
  htmlBody: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    let token = cachedAccessToken;
    if (!token) {
      // Trigger popup synchronously before any async work to preserve user gesture activation
      const signInPromise = googleSignIn();
      const signInResult = await signInPromise;
      token = signInResult?.accessToken || null;
    }

    if (!token) {
      return {
        success: false,
        error: 'Google account authorization is required to send emails via Gmail.',
      };
    }

    const raw = encodeMimeMessageBase64Url(params.to, params.subject, params.htmlBody);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (response.status === 401 || response.status === 403) {
      cachedAccessToken = null;
      return {
        success: false,
        error: 'Gmail permission was not granted or session expired. Please click Send again and check the Gmail permission box in the Google sign-in window.',
      };
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errData?.error?.message || `Gmail API error (${response.status})`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id,
    };
  } catch (err: any) {
    let friendly = err?.message || 'Failed to send email via Gmail.';
    if (err?.code === 'auth/popup-closed-by-user') {
      friendly = 'Google sign-in popup was closed before completing Gmail authorization.';
    } else if (err?.code === 'auth/popup-blocked') {
      friendly =
        'Chrome blocked the Google sign-in popup. Please click the popup-blocked icon in the right side of your Chrome address bar to allow popups, then click Confirm & Send Email again.';
    }
    return {
      success: false,
      error: friendly,
    };
  }
}

export async function sendAdminOtpGmail(
  recipientEmail: string,
  otpCode: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `ExamFlow Admin Password Reset Code: ${otpCode}`;
  const htmlBody = `
    <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border-radius: 16px; border: 1px solid #DCE7FF; background-color: #F8FAFF; color: #0B1B3D;">
      <div style="font-size: 22px; font-weight: 900; color: #0052D4; margin-bottom: 8px;">
        ExamFlow Security Verification
      </div>
      <p style="font-size: 14px; color: #4A5E8C; line-height: 1.5; margin-bottom: 20px;">
        You requested a one-time verification code (OTP) to reset your ExamFlow Administrator password for <strong>${recipientEmail}</strong>.
      </p>
      <div style="background-color: #FFFFFF; border: 2px solid #0066FF; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 20px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #52658F; font-weight: 700; margin-bottom: 6px;">
          Your 6-Digit Verification Code
        </div>
        <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0052D4; font-family: monospace;">
          ${otpCode}
        </div>
      </div>
      <p style="font-size: 12px; color: #6B7E9E; line-height: 1.5; margin: 0;">
        This code is valid for 10 minutes. Enter this code on the ExamFlow login screen to set your new password.
      </p>
    </div>
  `;

  return sendGmailMessage({
    to: recipientEmail,
    subject,
    htmlBody,
  });
}

// Initialize Firestore with Database ID from config
const firestoreDatabaseId =
  (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId ||
  'ai-studio-2008-02d43818-3203-4254-81eb-0898309acdc4';
export const db = getFirestore(app, firestoreDatabaseId);

// Error logging conforming to Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Info:', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection on boot per Firebase skill guidelines
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'examflow_sync', 'live_state'));
  } catch (error: any) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('token-service-api'))) {
      // Gracefully operate with Express API + local storage fallback
    }
  }
}

export async function fetchFirestoreSyncState(): Promise<{ updatedAt: number; state: Record<string, any> } | null> {
  try {
    const docRef = doc(db, 'examflow_sync', 'live_state');
    let snap;
    try {
      snap = await getDocFromServer(docRef);
    } catch {
      snap = await getDoc(docRef);
    }
    if (!snap || !snap.exists()) return null;
    const data = snap.data();
    if (data && typeof data.payloadJson === 'string') {
      return {
        updatedAt: Number(data.updatedAt || Date.now()),
        state: JSON.parse(data.payloadJson),
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'examflow_sync/live_state');
    return null;
  }
}

export async function pushFirestoreSyncState(stateObj: Record<string, any>): Promise<boolean> {
  try {
    const payloadJson = JSON.stringify(stateObj);
    if (payloadJson.length > 940000) {
      return false;
    }
    const docRef = doc(db, 'examflow_sync', 'live_state');
    await setDoc(docRef, {
      updatedAt: Date.now(),
      payloadJson,
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'examflow_sync/live_state');
    return false;
  }
}

export function listenToFirestoreSyncState(
  onReceiveState: (remoteState: Record<string, any>, updatedAt: number) => void
): () => void {
  try {
    const docRef = doc(db, 'examflow_sync', 'live_state');
    return onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (data && typeof data.payloadJson === 'string') {
          try {
            const parsed = JSON.parse(data.payloadJson);
            onReceiveState(parsed, Number(data.updatedAt || Date.now()));
          } catch {
            // ignore malformed JSON
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'examflow_sync/live_state');
      }
    );
  } catch {
    return () => {};
  }
}


