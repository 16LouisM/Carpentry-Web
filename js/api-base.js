// js/api-base.js
//
// One place deciding which server the frontend talks to. Locally,
// server/server.js runs on port 5000; once deployed, API routes are
// served from the same origin as the site itself, so this becomes "".
//
// contact-form.js currently hardcodes "http://localhost:5000" directly
// instead of using this — worth unifying onto this helper at some
// point so there's only one place to update before going live.

export const API_BASE =
    (location.hostname === "localhost" || location.hostname === "127.0.0.1")
        ? "http://localhost:5000"
        : "";