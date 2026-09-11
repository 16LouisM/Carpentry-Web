// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC5I_FxEWmEWyKHsOxD4gsku2sN_8b1gr0",
  authDomain: "modjadjiprojects-e0a30.firebaseapp.com",
  projectId: "modjadjiprojects-e0a30",
  storageBucket: "modjadjiprojects-e0a30.firebasestorage.app",
  messagingSenderId: "197119606223",
  appId: "1:197119606223:web:e0a01f284f5165cab0a6ba",
  measurementId: "G-GYGQ6TN8T5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);