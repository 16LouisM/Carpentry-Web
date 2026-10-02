// server/firebase-admin-config.js

const path = require("path");
const fs = require("fs");

const { initializeApp, cert, getApps, getApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");


// ==========================================
// LOAD THE SERVICE ACCOUNT
// ==========================================
//
// Two ways to provide it, checked in this order:
//
// 1. FIREBASE_SERVICE_ACCOUNT — the JSON as a single-line or
//    multi-line string. This is the option Render/Vercel use,
//    because they have no local file system we control. Checked
//    FIRST so a stray FIREBASE_SERVICE_ACCOUNT_PATH from a local
//    .env file can't shadow a properly-configured cloud env var.
//
// 2. FIREBASE_SERVICE_ACCOUNT_PATH — path to the raw downloaded
//    .json file. Convenient for local development.
//
// Either way, if the first option fails, the second is tried. Only
// if BOTH are missing or broken do we give up.

function loadServiceAccount() {

    // --- Option 1: JSON string (Render / Vercel) ---

    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (raw) {

        try {

            const parsed = JSON.parse(raw);

            if (parsed && parsed.project_id) {
                return parsed;
            }

            console.error(
                "✖ FIREBASE_SERVICE_ACCOUNT parsed but has no project_id field."
            );

        } catch (error) {

            console.error(
                "✖ FIREBASE_SERVICE_ACCOUNT is not valid JSON:",
                error.message
            );
        }
    }
}

const serviceAccount = loadServiceAccount();


// ==========================================
// INITIALISE
// ==========================================

let app;

if (!getApps().length) {

    if (serviceAccount.project_id) {

        app = initializeApp({
            credential: cert(serviceAccount)
        });

        console.log("✓ Firebase Admin initialised");

    } else {

        console.error(
            "✖ No Firebase service account found — set either " +
            "FIREBASE_SERVICE_ACCOUNT_PATH (local file) or " +
            "FIREBASE_SERVICE_ACCOUNT (JSON string) in the environment. " +
            "Admin-only routes will reject every request until this is set."
        );
    }

} else {

    app = getApp();
}


// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    auth: () => getAuth(app),
    firestore: () => getFirestore(app)
};