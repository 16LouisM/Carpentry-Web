// admin/js/firebase-auth.js

import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import { app } from "./firebase-config.js";

export const auth = getAuth(app);


// ─────────────────────────────────────
// LOGIN
// ─────────────────────────────────────

export async function loginAdmin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        return userCredential.user;

    } catch (error) {
        console.error("Firebase login error:", error);
        throw error;
    }
}


// ─────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────

export async function logoutAdmin() {
    await signOut(auth);
}


// ─────────────────────────────────────
// AUTH STATE
// ─────────────────────────────────────

export function watchAuthState(callback) {
    return onAuthStateChanged(auth, callback);
}