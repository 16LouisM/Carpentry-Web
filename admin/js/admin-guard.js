// admin/js/admin-guard.js

import { isAdmin } from "../../js/firebase-firestore.js";
import { watchAuthState } from "./firebase-auth.js";


// ==========================================
// PAGE PROTECTION
// ==========================================
//
// Resolves with the user object once an admin is confirmed.
// Otherwise it sends the browser to the login page and never resolves,
// because the page is being replaced anyway.

export function protectAdminPage() {

    return new Promise((resolve) => {

        let unsubscribe = null;
        let settled = false;

        unsubscribe = watchAuthState(async (user) => {

            if (settled) {
                return;
            }

            settled = true;

            if (typeof unsubscribe === "function") {
                unsubscribe();
            }

            if (user && await isAdmin(user.uid)) {
                resolve(user);
                return;
            }

            if (!user) {
                console.warn("No signed-in user.");
            } else {
                console.warn(
                    `Signed in as ${user.email} (${user.uid}) but there ` +
                    `is no matching document at admins/${user.uid}.`
                );
            }

            // replace() instead of href so the dashboard is not left in
            // the history stack for the back button to walk into.
            window.location.replace("./index.html");
        });

    });
}