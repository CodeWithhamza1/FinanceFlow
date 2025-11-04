import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;

function initializeFirebase() {
  // Check if firebaseConfig has keys. If not, Firebase is not configured.
  if (Object.keys(firebaseConfig).length === 0 || !firebaseConfig.apiKey) {
    console.warn("Firebase config is empty or invalid. Firebase features will be disabled.");
    return { firebaseApp: undefined, auth: undefined, firestore: undefined };
  }

  if (getApps().length === 0) {
    try {
      firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
      console.error("Failed to initialize Firebase", e);
      return { firebaseApp: undefined, auth: undefined, firestore: undefined };
    }
  } else {
    firebaseApp = getApp();
  }
  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);

  return { firebaseApp, auth, firestore };
}

export { initializeFirebase };
export * from './provider';
export * from './auth/use-user';
