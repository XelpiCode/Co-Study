import type { App } from "firebase-admin/app";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import { getFirestore } from "firebase-admin/firestore";
import type { Storage } from "firebase-admin/storage";
import { getStorage } from "firebase-admin/storage";

interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  storageBucket: string;
}

let adminApp: App | null = null;
let adminFirestore: Firestore | null = null;
let adminStorage: Storage | null = null;
let initializationError: Error | null = null;

const loadConfig = (): FirebaseAdminConfig | null => {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const storageBucket =
    process.env.FIREBASE_ADMIN_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey || !storageBucket) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey,
    storageBucket,
  };
};

export const isFirebaseAdminConfigured = () => !!loadConfig();

export const getFirebaseAdmin = () => {
  if (adminFirestore && adminStorage) {
    return {
      app: adminApp!,
      firestore: adminFirestore,
      storage: adminStorage,
      bucket: adminStorage.bucket(),
    };
  }

  if (initializationError) {
    throw initializationError;
  }

  const config = loadConfig();
  if (!config) {
    initializationError = new Error(
      "Firebase Admin SDK is not configured. Please set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY, and FIREBASE_ADMIN_STORAGE_BUCKET.",
    );
    throw initializationError;
  }

  try {
    adminApp =
      getApps().length > 0
        ? getApps()[0]!
        : initializeApp({
            credential: cert({
              projectId: config.projectId,
              clientEmail: config.clientEmail,
              privateKey: config.privateKey,
            }),
            storageBucket: config.storageBucket,
          });

    adminFirestore = getFirestore(adminApp);
    adminStorage = getStorage(adminApp);

    return {
      app: adminApp,
      firestore: adminFirestore,
      storage: adminStorage,
      bucket: adminStorage.bucket(),
    };
  } catch (error) {
    initializationError =
      error instanceof Error ? error : new Error("Unknown error while initializing Firebase Admin.");
    throw initializationError;
  }
};


