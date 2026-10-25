import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, disableNetwork } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const apiKey = process.env.FIREBASE_API_KEY || firebaseConfig.apiKey;

const config = {
  ...firebaseConfig,
  apiKey: apiKey
};

export const app = getApps().length ? getApp() : initializeApp(config);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connection Test
const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, '_connection_test_', 'check'));
    console.log("✅ Firebase connection verified successfully.");
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn("Firebase client is currently offline.");
    } else {
      console.log("✅ Firebase API connection verified.");
    }
  }
};
// With the placeholder config there is no backend: stay offline instead of retrying.
export const isFirebasePlaceholder = String(firebaseConfig.projectId).startsWith('your-');
if (isFirebasePlaceholder) {
  disableNetwork(db).catch(() => {});
} else {
  testConnection();
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default app;

