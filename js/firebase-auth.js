// js/firebase-auth.js

import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import { app } from "./firebase-config.js";

export const auth = getAuth(app);

export async function loginAdmin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        return userCredential.user;

    } catch (error) {
        console.error("Login error:", error);

        throw error;
    }
}

export async function logoutAdmin() {
    await signOut(auth);
}

export function watchAuthState(callback) {
    return onAuthStateChanged(auth, callback);
}