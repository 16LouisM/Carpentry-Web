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
// 1. FIREBASE_SERVICE_ACCOUNT_PATH — path to the raw downloaded .json
//    file. Easiest for local development: no manual flattening, no
//    quoting headaches. Relative paths are resolved from this file's
//    folder (server/).
//
// 2. FIREBASE_SERVICE_ACCOUNT — the JSON as a single-line string.
//    Use this on Vercel, where you paste the value into a dashboard
//    text field rather than editing a .env file by hand, so the
//    line-break problem doesn't come up.

function loadServiceAccount() {

    const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (keyPath) {

        const resolved = path.isAbsolute(keyPath)
            ? keyPath
            : path.join(__dirname, keyPath);

        try {

            const raw = fs.readFileSync(resolved, "utf8");
            return JSON.parse(raw);

        } catch (error) {

            console.error(
                `✖ Could not read service account file at ${resolved}:`,
                error.message
            );

            return {};
        }
    }

    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (raw) {

        try {

            return JSON.parse(raw);

        } catch (error) {

            console.error(
                "✖ FIREBASE_SERVICE_ACCOUNT is not valid JSON:",
                error.message
            );

            return {};
        }
    }

    return {};
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
            "FIREBASE_SERVICE_ACCOUNT (JSON string) in server/.env. " +
            "Admin-only routes will reject every request until this is set."
        );
    }

} else {

    app = getApp();
}


// ==========================================
// EXPORTS
// ==========================================
//
// Same call shape as before (admin.auth(), admin.firestore()), so
// server.js's requireAdmin middleware doesn't need any changes.

module.exports = {
    auth: () => getAuth(app),
    firestore: () => getFirestore(app)
};