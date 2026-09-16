// js/site-settings.js
//
// Applies admin-editable site-wide settings to the public homepage:
// the logo, and now the "Who We Are" heading, body text and photo.
// Contact Details will extend this same file once it's built.
//
// Every field is optional — if settings/site doesn't have it yet, the
// existing static HTML is left exactly as it is.

import { getSiteSettings } from "./firebase-firestore.js";

document.addEventListener("DOMContentLoaded", applySiteSettings);

async function applySiteSettings() {

    try {

        const settings = await getSiteSettings();


        // --------------------------------------
        // LOGO
        // --------------------------------------

        if (settings.logoUrl) {

            const logoImg = document.querySelector(".nav-logo img");

            if (logoImg) {
                logoImg.src = settings.logoUrl;
            }
        }


        // --------------------------------------
        // WHO WE ARE — HEADING
        // --------------------------------------

        if (settings.aboutTitle) {

            const titleEl = document.querySelector("#about .section-title");

            if (titleEl) {
                titleEl.textContent = settings.aboutTitle;
            }
        }


        // --------------------------------------
        // WHO WE ARE — BODY TEXT
        // --------------------------------------
        //
        // Stored as one string, paragraphs separated by a blank line.

        if (settings.aboutText) {

            const paragraphsContainer =
                document.getElementById("aboutParagraphs");

            if (paragraphsContainer) {

                const paragraphs = settings.aboutText
                    .split(/\n\s*\n/)
                    .map((paragraph) => paragraph.trim())
                    .filter(Boolean);

                paragraphsContainer.innerHTML = paragraphs
                    .map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`)
                    .join("");
            }
        }


        // --------------------------------------
        // WHO WE ARE — PHOTO
        // --------------------------------------

        if (settings.aboutImageUrl) {

            const aboutImg = document.querySelector(".about-image img");

            if (aboutImg) {

                aboutImg.src = settings.aboutImageUrl;

                if (settings.aboutImageAlt) {
                    aboutImg.alt = settings.aboutImageAlt;
                }
            }
        }

    } catch (error) {

        console.error("Could not load site settings:", error);
        // Static fallback markup in index.html stays as-is.
    }

}


function escapeHTML(value) {

    const div = document.createElement("div");
    div.textContent = String(value);
    return div.innerHTML;
}