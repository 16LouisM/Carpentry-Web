// admin/js/admin-fetch.js
//
// A small wrapper around fetch() for calling admin-only API routes
// (like /api/admin/images). It attaches the signed-in admin's current
// Firebase ID token as a Bearer header, which server.js's requireAdmin
// middleware checks.
//
// Usage, once you build the image-upload UI:
//
//   import { adminFetch } from "./admin-fetch.js";
//
//   const formData = new FormData();
//   formData.append("image", fileInput.files[0]);
//
//   const res = await adminFetch("/api/admin/images", {
//       method: "POST",
//       body: formData
//   });

import { auth } from "./firebase-auth.js";

export async function adminFetch(url, options = {}) {

    const user = auth.currentUser;

    if (!user) {
        throw new Error("You're not signed in.");
    }

    // `true` forces a refresh if the cached token is close to expiring.
    const idToken = await user.getIdToken(/* forceRefresh */ true);

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${idToken}`);

    return fetch(url, {
        ...options,
        headers
    });
}