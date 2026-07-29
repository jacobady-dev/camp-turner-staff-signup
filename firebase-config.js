/*
  CAMP TURNER SHARED ROSTER CONFIGURATION

  1. Create a Firebase project.
  2. Add a Web App.
  3. Enable Firestore Database.
  4. Paste the Firebase configuration object below.
  5. Change useSharedDatabase to true.
*/

export const useSharedDatabase = false;

export const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};
