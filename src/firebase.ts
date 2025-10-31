// ME
// apiKey: "AIzaSyBc9fl9estr8Zy2bWlOWNxdCYdVA4JXONs",
// authDomain: "people-data-app.firebaseapp.com",
// projectId: "people-data-app",
// storageBucket: "people-data-app.appspot.com", // Corrected
// messagingSenderId: "33165089771",
// appId: "1:33165089771:web:a1d28094202cff983997ae",
// measurementId: "G-Y8GRH2G9XP",

// KIVARO
// apiKey: "AIzaSyC6Rnwy_t-aBOafeahbkxQT3dhx5MLtoqE",
// authDomain: "vanitha-veed.firebaseapp.com",
// projectId: "vanitha-veed",
// storageBucket: "vanitha-veed.firebasestorage.app",
// messagingSenderId: "616033443209",
// appId: "1:616033443209:web:327898d45980ff54299558",
// measurementId: "G-7T4VCHPXGS"

// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC6Rnwy_t-aBOafeahbkxQT3dhx5MLtoqE",
  authDomain: "vanitha-veed.firebaseapp.com",
  projectId: "vanitha-veed",
  storageBucket: "vanitha-veed.appspot.com",
  messagingSenderId: "616033443209",
  appId: "1:616033443209:web:327898d45980ff54299558",
  measurementId: "G-7T4VCHPXGS",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Simplified user save function
export async function saveUserProfile(profile: {
  user_id: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
  status: string;
  role: "admin" | "sales" | "marketing";
}) {
  await addDoc(collection(db, "users"), {
    ...profile,
    createdAt: serverTimestamp(),
  });
}


// // src/firebase.ts
// import { initializeApp } from "firebase/app";
// import {
//   getAuth,
//   sendEmailVerification,
//   sendPasswordResetEmail,
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   onAuthStateChanged,
//   signOut,
//   type User,
// } from "firebase/auth";
// import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
// import { getStorage } from "firebase/storage"; // NEW IMPORT

// // Fix storage bucket URL — `.app` → `.appspot.com`
// const firebaseConfig = {
//   // KIVARO
//   apiKey: "AIzaSyC6Rnwy_t-aBOafeahbkxQT3dhx5MLtoqE",
//   authDomain: "vanitha-veed.firebaseapp.com",
//   projectId: "vanitha-veed",
//   storageBucket: "vanitha-veed.firebasestorage.app",
//   messagingSenderId: "616033443209",
//   appId: "1:616033443209:web:327898d45980ff54299558",
//   measurementId: "G-7T4VCHPXGS"
// };

// const app = initializeApp(firebaseConfig);

// // Initialize services
// export const auth = getAuth(app);
// export const db = getFirestore(app);
// export const storage = getStorage(app); // ADD THIS LINE

// // User profile saving
// interface UserProfile {
//   user_id: string;
//   username: string;
//   email: string;
//   phone?: string;
//   status: string;
//   role: "admin" | "sales" | "marketing";
// }

// export async function saveUserProfile(uid: string, profile: UserProfile) {
//   const userRef = doc(db, "users", uid);
//   await setDoc(
//     userRef,
//     { createdAt: serverTimestamp(), ...profile },
//     { merge: true }
//   );
// }

// export {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   sendEmailVerification,
//   sendPasswordResetEmail,
//   onAuthStateChanged,
//   signOut,
// };

// export type { User };