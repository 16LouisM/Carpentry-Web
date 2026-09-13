// admin/js/login.js

import {
    loginAdmin,
    watchAuthState
} from "./firebase-auth.js";


// ─────────────────────────────────────
// ELEMENTS
// ─────────────────────────────────────

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");


// ─────────────────────────────────────
// CHECK EXISTING LOGIN
// ─────────────────────────────────────

watchAuthState((user) => {

    if (user) {

        window.location.href = "./dashboard.html";

    }

});


// ─────────────────────────────────────
// LOGIN
// ─────────────────────────────────────

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document
        .getElementById("email")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value;


    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";

    loginMessage.textContent = "";


    try {

        const user = await loginAdmin(email, password);

        console.log("Logged in:", user.uid);

        loginMessage.textContent = "Login successful.";

        window.location.href = "./dashboard.html";

    } catch (error) {

        console.error(error);

        switch (error.code) {

            case "auth/invalid-credential":
                loginMessage.textContent =
                    "Incorrect email or password.";
                break;

            case "auth/user-not-found":
                loginMessage.textContent =
                    "No account was found with this email.";
                break;

            case "auth/wrong-password":
                loginMessage.textContent =
                    "Incorrect password.";
                break;

            case "auth/too-many-requests":
                loginMessage.textContent =
                    "Too many attempts. Please try again later.";
                break;

            default:
                loginMessage.textContent =
                    "Unable to sign in. Please try again.";
        }

    } finally {

        loginButton.disabled = false;
        loginButton.textContent = "Sign In";

    }

});