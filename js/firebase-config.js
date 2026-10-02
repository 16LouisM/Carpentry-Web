// js/firebase-config.js
 
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
 
const firebaseConfig = {
    apiKey: "AIzaSyC5I_FxEWmEWyKHsOxD4gsku2sN_8b1gr0",
    authDomain: "modjadjiprojects-e0a30.firebaseapp.com",
    projectId: "modjadjiprojects-e0a30",
    storageBucket: "modjadjiprojects-e0a30.firebasestorage.app",
    messagingSenderId: "197119606223",
    appId: "1:197119606223:web:e0a01f284f5165cab0a6ba"
};
 
export const app = initializeApp(firebaseConfig);