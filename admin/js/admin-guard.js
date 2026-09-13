// admin/js/admin-guard.js

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import { app } from "./firebase-config.js";

const db = getFirestore(app);

const auth = (() => {
    return import("./firebase-auth.js").then(module => module.auth);
})();

async function checkAdmin(user) {

    if (!user) {
        window.location.href = "/admin/index.html";
        return false;
    }

    try {

        const adminRef = doc(db, "admins", user.uid);
        const adminSnapshot = await getDoc(adminRef);

        if (!adminSnapshot.exists()) {

            console.warn("User is authenticated but is not an admin.");

            window.location.href = "/admin/index.html";

            return false;
        }

        return true;

    } catch (error) {

        console.error("Admin verification failed:", error);

        window.location.href = "/admin/index.html";

        return false;
    }
}


export async function protectAdminPage() {

    const { auth: firebaseAuth } = await auth;

    return new Promise((resolve) => {

        onAuthStateChanged(firebaseAuth, async (user) => {

            const result = await checkAdmin(user);

            resolve(result);
        });

    });
}