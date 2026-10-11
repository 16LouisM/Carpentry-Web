// js/api-base.js
//
// One place deciding which server the frontend talks to.
//
// The frontend and the backend live on different domains once
// deployed (static site -> Render for the API), so a relative path like
// "/api/contact" would hit the frontend host, which has no such route.
//
// Resolution order:
//   1. window.ADMIN_API_BASE, if a page sets it (same override the
//      contact form already honours)
//   2. local development -> the Express server on port 5000
//   3. otherwise the live Render backend

const RENDER_API = "https://carpentry-web.onrender.com";

function resolveApiBase() {

    if (typeof window !== "undefined" && window.ADMIN_API_BASE) {
        return String(window.ADMIN_API_BASE).replace(/\/+$/, "");
    }

    const host = location.hostname;

    if (host === "localhost" || host === "127.0.0.1") {
        return "http://localhost:5000";
    }

    return RENDER_API;
}

export const API_BASE = resolveApiBase();