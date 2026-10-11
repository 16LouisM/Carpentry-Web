// admin/js/admin-fetch.js
//
// A small wrapper around fetch() for calling admin-only API routes
// (like /api/admin/images). It attaches the signed-in admin's current
// Firebase ID token as a Bearer header, which server.js's requireAdmin
// middleware checks, and prefixes relative paths with API_BASE so
// this works whether the admin dashboard and the backend share one
// origin or live on two different domains (e.g. admin on Vercel,
// server on Render).
//
// Usage:
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
//
// Existing calls that already pass a relative path like "/api/admin/images"
// need no changes — the prefixing happens here, once, centrally.

import { auth } from "./firebase-auth.js";
import { API_BASE } from "../../js/api-base.js";

export async function adminFetch(path, options = {}) {

    const user = auth.currentUser;

    if (!user) {
        throw new Error("You're not signed in.");
    }

    // `true` forces a refresh if the cached token is close to expiring.
    const idToken = await user.getIdToken(/* forceRefresh */ true);

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${idToken}`);

    const url = /^https?:\/\//.test(path) ? path : `${API_BASE}${path}`;

    return fetch(url, {
        ...options,
        headers
    });
}