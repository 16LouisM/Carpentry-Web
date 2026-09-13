import {
    loginAdmin,
    watchAuthState
} from "../../js/firebase-auth.js";

import {
    isAdmin
} from "../../js/firebase-firestore.js";


const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginError = document.getElementById("loginError");


// ==========================================
// CHECK EXISTING LOGIN
// ==========================================

watchAuthState(async (user) => {

    if (!user) {
        return;
    }

    const admin = await isAdmin(user.uid);

    if (admin) {
        window.location.href = "dashboard.html";
    } else {
        loginError.textContent =
            "This account does not have administrator access.";
    }

});


// ==========================================
// LOGIN
// ==========================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    loginError.textContent = "";

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;


    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";


    try {

        const user = await loginAdmin(
            email,
            password
        );

        const admin = await isAdmin(user.uid);

        if (!admin) {

            loginError.textContent =
                "You are authenticated, but you are not an administrator.";

            loginButton.disabled = false;
            loginButton.textContent = "Sign In";

            return;
        }


        window.location.href = "dashboard.html";


    } catch (error) {

        console.error(error);

        switch (error.code) {

            case "auth/invalid-credential":
                loginError.textContent =
                    "Incorrect email or password.";
                break;

            case "auth/user-not-found":
                loginError.textContent =
                    "No account was found with this email.";
                break;

            case "auth/wrong-password":
                loginError.textContent =
                    "Incorrect password.";
                break;

            case "auth/too-many-requests":
                loginError.textContent =
                    "Too many attempts. Please try again later.";
                break;

            default:
                loginError.textContent =
                    "Unable to sign in. Please try again.";
        }

        loginButton.disabled = false;
        loginButton.textContent = "Sign In";
    }

});