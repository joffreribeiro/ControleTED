// Firebase initialization for Controle TED
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc as fsDoc, getDoc as fsGetDoc, setDoc as fsSetDoc, onSnapshot as fsOnSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAyT1jL8qXPdzNbgt-zJffTh8uPKm3iK8U",
  authDomain: "controleted.firebaseapp.com",
  projectId: "controleted",
  storageBucket: "controleted.firebasestorage.app",
  messagingSenderId: "362344293725",
  appId: "1:362344293725:web:2d622a90270c5dc64ff4b4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Try to enable IndexedDB persistence for Firestore (optional, fails silently if not supported)
enableIndexedDbPersistence(db).catch((err) => {
  console.warn('IndexedDB persistence not available:', err && err.code ? err.code : err);
});

// Expose on window for use in the app
window.firebaseApp = app;
window.firebaseDB = db;
window.firebaseAuth = auth;

// Helper wrappers to use Firestore from non-module inline scripts
window.firestoreGetDoc = async function(path) {
  try {
    const parts = String(path || '').split('/').filter(Boolean);
    if (parts.length % 2 === 1) return null; // expect collection/doc pairs
    const ref = fsDoc(db, ...parts);
    const snap = await fsGetDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn('firestoreGetDoc error', e);
    return null;
  }
};

window.firestoreSetDoc = async function(path, data, options = { merge: false }) {
  try {
    const parts = String(path || '').split('/').filter(Boolean);
    if (parts.length % 2 === 1) throw new Error('Invalid path for doc');
    const ref = fsDoc(db, ...parts);
    await fsSetDoc(ref, data, options);
    return true;
  } catch (e) {
    console.warn('firestoreSetDoc error', e);
    return false;
  }
};

window.firestoreOnSnapshot = function(path, cb) {
  try {
    const parts = String(path || '').split('/').filter(Boolean);
    if (parts.length % 2 === 1) return null;
    const ref = fsDoc(db, ...parts);
    return fsOnSnapshot(ref, cb);
  } catch (e) {
    console.warn('firestoreOnSnapshot error', e);
    return null;
  }
};

console.info('Firebase initialized (app/projectId:', firebaseConfig.projectId, ')');

export { app, db, auth };
