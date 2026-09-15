// admin/js/login.js

import { loginAdmin, logoutAdmin } from "./firebase-auth.js";
import { isAdmin } from "../../js/firebase-firestore.js";


const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");


// ==========================================
// ALWAYS START FROM A CLEAN SESSION
// ==========================================
//
// This page never forwards an existing session to the dashboard.
// Any session Firebase is still holding is cleared the moment the login
// page opens, so the hidden contact-form trigger always lands on the
// form instead of jumping past it.

const sessionCleared = logoutAdmin().catch((error) => {
    console.error("Could not clear the previous session:", error);
});


// ==========================================
// MESSAGES
// ==========================================

function showMessage(text, isError = true) {

    if (!loginMessage) {
        return;
    }

    loginMessage.textContent = text;

    loginMessage.classList.toggle("error", isError);
    loginMessage.classList.toggle("success", !isError);
}


function setBusy(busy) {

    if (!loginButton) {
        return;
    }

    loginButton.disabled = busy;
    loginButton.textContent = busy ? "Signing in..." : "Sign In";
}


// ==========================================
// ERROR TEXT
// ==========================================

function messageForError(error) {

    switch (error && error.code) {

        case "auth/invalid-email":
            return "That email address is not valid.";

        case "auth/user-disabled":
            return "This account has been disabled.";

        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/too-many-requests":
            return "Too many attempts. Please wait a moment and try again.";

        case "auth/network-request-failed":
            return "Network error. Check your connection and try again.";

        default:
            return "Unable to sign in. Please try again.";
    }
}


// ==========================================
// SUBMIT
// ==========================================

if (!form) {

    console.error("ERROR: loginForm was not found.");

} else {

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showMessage("Please enter your email and password.");
            return;
        }

        setBusy(true);
        showMessage("", false);

        try {

            // Wait for the clean-up sign-out above to finish first,
            // so it cannot cancel the sign-in that follows.
            await sessionCleared;

            const user = await loginAdmin(email, password);

            if (!(await isAdmin(user.uid))) {

                await logoutAdmin();

                showMessage("This account does not have admin access.");

                setBusy(false);

                return;
            }

            window.location.replace("./dashboard.html");

        } catch (error) {

            console.error("Login error:", error);

            showMessage(messageForError(error));

            setBusy(false);
        }

    });

}