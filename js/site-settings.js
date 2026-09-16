// js/site-settings.js
//
// Applies admin-editable site-wide settings to the public homepage.
// Currently just the logo — later phases (Who We Are, Contact Details)
// will extend this same file to apply their fields too, once they're
// built, so there's one place that reads settings/site.

import { getSiteSettings } from "./firebase-firestore.js";

document.addEventListener("DOMContentLoaded", applySiteSettings);

async function applySiteSettings() {

    try {

        const settings = await getSiteSettings();

        if (settings.logoUrl) {

            const logoImg = document.querySelector(".nav-logo img");

            if (logoImg) {
                logoImg.src = settings.logoUrl;
            }
        }

    } catch (error) {

        console.error("Could not load site settings:", error);
        // The static logo already in index.html stays as the fallback.
    }

}