// js/site-settings.js
//
// Applies admin-editable site-wide settings to the public homepage:
// logo, "Who We Are" content, Contact Details, and now the workshop
// photo next to the contact form.
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


        // --------------------------------------
        // CONTACT — ADDRESS
        // --------------------------------------

        if (settings.contactAddress) {

            const addressLink = document.getElementById("contactAddressLink");
            const addressText = document.getElementById("contactAddressText");

            if (addressText) {
                addressText.textContent = settings.contactAddress;
            }

            if (addressLink) {
                addressLink.href =
                    "https://maps.google.com/?q=" +
                    encodeURIComponent(settings.contactAddress);
            }
        }


        // --------------------------------------
        // CONTACT — PHONE
        // --------------------------------------

        if (settings.contactPhone) {

            const phoneLink = document.getElementById("contactPhoneLink");
            const phoneText = document.getElementById("contactPhoneText");

            if (phoneText) {
                phoneText.textContent = settings.contactPhone;
            }

            if (phoneLink) {
                phoneLink.href =
                    "tel:" + settings.contactPhone.replace(/\s+/g, "");
            }
        }


        // --------------------------------------
        // CONTACT — EMAIL
        // --------------------------------------

        if (settings.contactEmail) {

            const emailLink = document.getElementById("contactEmailLink");
            const emailText = document.getElementById("contactEmailText");

            if (emailText) {
                emailText.textContent = settings.contactEmail;
            }

            if (emailLink) {
                emailLink.href = "mailto:" + settings.contactEmail;
            }
        }


        // --------------------------------------
        // CONTACT — HOURS
        // --------------------------------------

        if (settings.contactHours) {

            const hoursText = document.getElementById("contactHoursText");

            if (hoursText) {
                hoursText.textContent = settings.contactHours;
            }
        }


        // --------------------------------------
        // CONTACT — SERVICE AREA
        // --------------------------------------

        if (settings.serviceAreaText) {

            const serviceAreaEl = document.getElementById("serviceAreaText");

            if (serviceAreaEl) {
                serviceAreaEl.textContent = settings.serviceAreaText;
            }
        }


        // --------------------------------------
        // WORKSHOP PHOTO
        // --------------------------------------
        //
        // Swaps the "Workshop Photo Coming Soon" placeholder for a real
        // photo once one is set. If no photo has been uploaded yet, the
        // static placeholder stays exactly as it is.

        if (settings.workshopPhotoUrl) {

            const placeholderIcon =
                document.getElementById("workshopPhotoPlaceholder");

            const placeholderText =
                document.getElementById("workshopPhotoPlaceholderText");

            const photoImg = document.getElementById("workshopPhotoImg");

            if (placeholderIcon) {
                placeholderIcon.style.display = "none";
            }

            if (placeholderText) {
                placeholderText.style.display = "none";
            }

            if (photoImg) {

                photoImg.src = settings.workshopPhotoUrl;
                photoImg.style.display = "block";

                if (settings.workshopPhotoAlt) {
                    photoImg.alt = settings.workshopPhotoAlt;
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