/*
  CAMP TURNER FIREBASE CONFIGURATION

  Setup:
  1. Create a Firebase project and add a Web App.
  2. Create a Firestore database.
  3. Enable Anonymous sign-in under Authentication > Sign-in method.
  4. Paste the Web App configuration below.
  5. Publish the firestore.rules file included in this repository.
  6. Change useSharedDatabase to true.
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
