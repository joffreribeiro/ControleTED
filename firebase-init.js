// Firebase initialization for Controle TED
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc as fsDoc, getDoc as fsGetDoc, setDoc as fsSetDoc, onSnapshot as fsOnSnapshot, collection as fsCollection, getDocs as fsGetDocs, writeBatch as fsWriteBatch, deleteDoc as fsDeleteDoc, addDoc as fsAddDoc, runTransaction as fsRunTransaction } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged as fbOnAuthStateChanged, sendPasswordResetEmail as fbSendPasswordResetEmail, updatePassword as fbUpdatePassword, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

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

// ===== Auth helpers =====
window.authCreateUser = async function(email, password, profile = {}) {
  // Usa um app Firebase secundário isolado para criar o usuário sem deslogar o admin atual.
  // createUserWithEmailAndPassword faz login automático com o novo usuário — o app secundário
  // evita que isso afete a sessão principal.
  let secondaryApp = null;
  try {
    const { initializeApp: fbInitApp, deleteApp: fbDeleteApp } = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js');
    const { getAuth: fbGetAuth, createUserWithEmailAndPassword: fbCreate, updateProfile: fbUpdateProfile } = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js');
    const tmpName = 'tmp-create-' + Date.now();
    secondaryApp = fbInitApp(firebaseConfig, tmpName);
    const secondaryAuth = fbGetAuth(secondaryApp);
    const cred = await fbCreate(secondaryAuth, String(email), String(password));
    const user = cred && cred.user ? cred.user : null;
    if (user) {
      try { if (profile.displayName) await fbUpdateProfile(user, { displayName: profile.displayName }); } catch(e){}
      try {
        const uref = fsDoc(db, 'users', user.uid);
        await fsSetDoc(uref, {
          uid: user.uid,
          email: user.email,
          role: profile.role || 'leitor',
          displayName: profile.displayName || user.displayName || '',
          upRestrita: profile.upRestrita || null,
          active: profile.active !== undefined ? profile.active : true
        });
      } catch (e) { console.warn('authCreateUser: error saving profile', e); }
      try { await secondaryAuth.signOut(); } catch(e){}
    }
    try { await fbDeleteApp(secondaryApp); } catch(e){}
    secondaryApp = null;
    return user;
  } catch (e) {
    if (secondaryApp) {
      try {
        const { deleteApp: fbDeleteApp } = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js');
        await fbDeleteApp(secondaryApp);
      } catch(e2){}
    }
    console.warn('authCreateUser error', e);
    throw e;
  }
};

window.authSignIn = async function(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, String(email), String(password));
    return cred && cred.user ? cred.user : null;
  } catch (e) {
    console.warn('authSignIn error', e);
    throw e;
  }
};

window.authSendPasswordReset = async function(email) {
  try {
    await fbSendPasswordResetEmail(auth, String(email));
    return true;
  } catch (e) {
    console.warn('authSendPasswordReset error', e);
    throw e;
  }
};

window.authChangePassword = async function(currentPassword, newPassword) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Nenhum usuário autenticado.');
    const credential = EmailAuthProvider.credential(user.email, String(currentPassword));
    await reauthenticateWithCredential(user, credential);
    await fbUpdatePassword(user, String(newPassword));
    return true;
  } catch (e) {
    console.warn('authChangePassword error', e);
    throw e;
  }
};

window.authSignOut = async function() {
  try {
    await fbSignOut(auth);
    return true;
  } catch (e) {
    console.warn('authSignOut error', e);
    return false;
  }
};

window.authOnStateChanged = function(cb) {
  try {
    return fbOnAuthStateChanged(auth, cb);
  } catch (e) {
    console.warn('authOnStateChanged error', e);
    return null;
  }
};

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

// Collection helpers
window.firestoreGetCollection = async function(collPath) {
  const parts = String(collPath || '').split('/').filter(Boolean);
  if (parts.length === 0) return [];
  const ref = fsCollection(db, ...parts);
  const snap = await fsGetDocs(ref);
  const items = [];
  snap.forEach(d => items.push(Object.assign({ _docId: d.id }, d.data())));
  return items;
};

window.firestoreOnCollectionSnapshot = function(collPath, cb) {
  try {
    const parts = String(collPath || '').split('/').filter(Boolean);
    if (parts.length === 0) return null;
    const ref = fsCollection(db, ...parts);
    return fsOnSnapshot(ref, cb);
  } catch (e) {
    console.warn('firestoreOnCollectionSnapshot error', e);
    return null;
  }
};

window.firestoreBatchSet = async function(collPath, docs) {
  try {
    if (!Array.isArray(docs)) return false;
    const parts = String(collPath || '').split('/').filter(Boolean);
    if (parts.length === 0) throw new Error('Invalid collection path');
    const batch = fsWriteBatch(db);
    for (const d of docs) {
      const id = (d && (d.id || d._docId)) ? String(d.id || d._docId) : String(Date.now()) + Math.floor(Math.random()*1000);
      const ref = fsDoc(db, ...parts, id);
      const copy = Object.assign({}, d);
      // ensure id is stored as property
      copy.id = parseInt(id) || id;
      batch.set(ref, copy);
    }
    await batch.commit();
    return true;
  } catch (e) {
    console.warn('firestoreBatchSet error', e);
    return false;
  }
};

window.firestoreDeleteDoc = async function(path) {
  try {
    const parts = String(path || '').split('/').filter(Boolean);
    if (parts.length % 2 === 1) throw new Error('Invalid doc path');
    const ref = fsDoc(db, ...parts);
    await fsDeleteDoc(ref);
    return true;
  } catch (e) {
    console.warn('firestoreDeleteDoc error', e);
    return false;
  }
};

// Allocate an atomic numeric id stored in `meta/{key}` document
window.firestoreGetNextId = async function(key = 'teds') {
  try {
    const metaRef = fsDoc(db, 'meta', String(key));
    const next = await fsRunTransaction(db, async (tx) => {
      const snap = await tx.get(metaRef);
      if (!snap.exists()) {
        tx.set(metaRef, { nextId: 2 });
        return 1;
      }
      const data = snap.data() || {};
      const cur = Number(data.nextId) || 1;
      tx.update(metaRef, { nextId: cur + 1 });
      return cur;
    });
    return next;
  } catch (e) {
    console.warn('firestoreGetNextId error', e);
    // fallback: timestamp-based id (not ideal for sequential numeric ids)
    return Date.now();
  }
};

// Add a document to a collection (auto-generated ID)
window.firestoreAddDoc = async function(collPath, data) {
  try {
    const ref = fsCollection(db, String(collPath));
    const docRef = await fsAddDoc(ref, data);
    return docRef.id;
  } catch (e) {
    console.warn('firestoreAddDoc error', e);
    return null;
  }
};

// Query a collection with ordering and limit
window.firestoreQueryCollection = async function(collPath, opts = {}) {
  try {
    const { orderByField, orderDir = 'desc', limitCount = 100 } = opts;
    const collRef = fsCollection(db, String(collPath));
    const docs = await fsGetDocs(collRef);
    let results = docs.docs.map(d => Object.assign({ _docId: d.id }, d.data()));
    if (orderByField) {
      results.sort((a, b) => {
        const av = a[orderByField] || '';
        const bv = b[orderByField] || '';
        return orderDir === 'desc' ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
      });
    }
    return results.slice(0, limitCount);
  } catch (e) {
    console.warn('firestoreQueryCollection error', e);
    return [];
  }
};

console.info('Firebase initialized (app/projectId:', firebaseConfig.projectId, ')');

export { app, db, auth };
