import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  projectId: "marklar-throne-0lxdt",
  appId: "1:108803851673:web:a79c0890d6a8c6a613bf08",
  apiKey: "AIzaSyDc6QBbvSD7RqaGG58MOJuSIsG4GhgZOBM",
  authDomain: "marklar-throne-0lxdt.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-khaochaisonhealt-f94e2769-0017-46c7-91bf-ea4b7d183cec",
  storageBucket: "marklar-throne-0lxdt.firebasestorage.app",
  messagingSenderId: "108803851673",
  measurementId: "",
  oAuthClientId: "108803851673-8ul9ruvjmm6imt20efga04r6ssstda56.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId || undefined
  );
} catch (e) {
  firestoreInstance = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = firestoreInstance;

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connected to Firestore successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

testConnection();
