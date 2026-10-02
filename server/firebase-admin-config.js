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
// Three ways to provide it, tried in this order:
//
// 1. FIREBASE_SERVICE_ACCOUNT_BASE64 — the .json file encoded as a
//    base64 string. Recommended for cloud hosts (Render, Railway,
//    Fly, Vercel, etc.) because a base64 string contains no braces,
//    quotes, newlines, or escape sequences that can be mangled by
//    a web textarea. What you paste is exactly what the server
//    decodes.
//
// 2. FIREBASE_SERVICE_ACCOUNT — the JSON itself as a string. Works,
//    but is fragile: one wrong quote or missing brace and it fails.
//
// 3. FIREBASE_SERVICE_ACCOUNT_PATH — a path to a local .json file.
//    Convenient for development on your own machine.
//
// A failure at any step is logged and the next step is tried. Only
// if all three are missing or broken do we give up.

function tryBase64(raw) {

    if (!raw) return null;

    try {

        const decoded = Buffer.from(raw.trim(), "base64").toString("utf8");
        const parsed = JSON.parse(decoded);

        if (parsed && parsed.project_id) {
            return parsed;
        }

        console.error(
            "✖ FIREBASE_SERVICE_ACCOUNT_BASE64 decoded but has no project_id."
        );

    } catch (error) {

        console.error(
            "✖ FIREBASE_SERVICE_ACCOUNT_BASE64 could not be decoded:",
            error.message
        );
    }

    return null;
}


function tryRawJson(raw) {

    if (!raw) return null;

    try {

        const parsed = JSON.parse(raw.trim());

        if (parsed && parsed.project_id) {
            return parsed;
        }

        console.error(
            "✖ FIREBASE_SERVICE_ACCOUNT parsed but has no project_id."
        );

    } catch (error) {

        console.error(
            "✖ FIREBASE_SERVICE_ACCOUNT is not valid JSON:",
            error.message
        );
    }

    return null;
}


function tryFilePath(keyPath) {

    if (!keyPath) return null;

    const resolved = path.isAbsolute(keyPath)
        ? keyPath
        : path.join(__dirname, keyPath);

    try {

        const raw = fs.readFileSync(resolved, "utf8");
        const parsed = JSON.parse(raw);

        if (parsed && parsed.project_id) {
            return parsed;
        }

        console.error(`✖ ${resolved} parsed but has no project_id.`);

    } catch (error) {

        console.error(
            `✖ Could not read service account file at ${resolved}:`,
            error.message
        );
    }

    return null;
}


function loadServiceAccount() {

    return (
        tryBase64(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) ||
        tryRawJson(process.env.FIREBASE_SERVICE_ACCOUNT) ||
        tryFilePath(process.env.FIREBASE_SERVICE_ACCOUNT_PATH) ||
        {}
    );
}

const serviceAccount = loadServiceAccount();


// ==========================================
// INITIALISE
// ==========================================

let app;

if (!getApps().length) {

    if (serviceAccount && serviceAccount.project_id) {

        app = initializeApp({
            credential: cert(serviceAccount)
        });

        console.log("✓ Firebase Admin initialised");

    } else {

        console.error(
            "✖ No Firebase service account found. Set one of:\n" +
            "   FIREBASE_SERVICE_ACCOUNT_BASE64  (recommended for cloud)\n" +
            "   FIREBASE_SERVICE_ACCOUNT         (raw JSON string)\n" +
            "   FIREBASE_SERVICE_ACCOUNT_PATH    (local file path)\n" +
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