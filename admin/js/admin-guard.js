import {
    watchAuthState,
    logoutAdmin
} from "../../js/firebase-auth.js";

import {
    isAdmin
} from "../../js/firebase-firestore.js";


const logoutButton =
    document.getElementById("logoutButton");


watchAuthState(async (user) => {

    if (!user) {

        window.location.href = "index.html";

        return;
    }


    const admin = await isAdmin(user.uid);


    if (!admin) {

        await logoutAdmin();

        window.location.href = "index.html";

        return;
    }


    const adminEmail =
        document.getElementById("adminEmail");


    if (adminEmail) {
        adminEmail.textContent = user.email;
    }

});


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            await logoutAdmin();

            window.location.href = "index.html";

        }
    );

}