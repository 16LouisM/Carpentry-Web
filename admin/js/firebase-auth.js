// admin/js/firebase-auth.js

import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import { app } from "../../js/firebase-config.js";


export const auth = getAuth(app);


// ==========================================
// PERSISTENCE
// ==========================================
//
// browserSessionPersistence = the session lives in this tab only and
// disappears when the tab is closed. That is what you want for a hidden
// admin area: the browser never "remembers" you into the dashboard days
// later.
//
// Swap to browserLocalPersistence if you ever want the session to survive
// a browser restart.

export const persistenceReady =
    setPersistence(auth, browserSessionPersistence)
        .catch((error) => {
            console.error("Could not set auth persistence:", error);
        });


// ==========================================
// LOGIN
// ==========================================

export async function loginAdmin(email, password) {

    // Make sure persistence is configured BEFORE the sign-in call,
    // otherwise Firebase falls back to its default (local) persistence.
    await persistenceReady;

    const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
    );

    return credential.user;
}


// ==========================================
// LOGOUT
// ==========================================

export async function logoutAdmin() {

    await signOut(auth);

    // signOut() resolves once the local session is cleared, so anything
    // after this line runs with a signed-out auth instance.
}


// ==========================================
// AUTH STATE
// ==========================================
//
// Returns the unsubscribe function so callers can stop listening.

export function watchAuthState(callback) {

    return onAuthStateChanged(auth, callback);
}