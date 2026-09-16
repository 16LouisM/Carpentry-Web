// js/projects.js

import { getProjects } from "./firebase-firestore.js";

document.addEventListener("DOMContentLoaded", loadProjects);


// ==========================================
// LOAD & RENDER
// ==========================================
//
// If Firestore has no project documents yet, or the fetch fails for any
// reason, this leaves the six static gallery-item blocks in index.html
// untouched — the public page never shows a blank Gallery section.

async function loadProjects() {

    const grid = document.querySelector("#gallery .gallery-grid");

    if (!grid) {
        return;
    }

    try {

        const projects = await getProjects();

        if (!projects.length) {
            return;
        }

        grid.innerHTML = projects
            .map((project) => projectItemHTML(project))
            .join("");

        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }

    } catch (error) {

        console.error("Could not load projects from Firestore:", error);
        // Static fallback markup stays as-is.
    }

}


// ==========================================
// PROJECT CARD
// ==========================================
//
// Expected Firestore fields on each project document:
//   title      (string, required)  — shown as the caption
//   imageUrl   (string, required)  — the Cloudinary image URL
//   imageAlt   (string, optional)  — falls back to title if missing
//   category   (string, optional)  — not shown publicly yet, used in
//                                     the admin dashboard list

function projectItemHTML(project) {

    const title = escapeHTML(project.title || "Untitled Project");
    const imageUrl = escapeHTML(project.imageUrl || "");
    const imageAlt = escapeHTML(project.imageAlt || project.title || "Project photo");

    return `
        <div class="gallery-item">

            <div class="gallery-item-inner">
                <img src="${imageUrl}" alt="${imageAlt}" loading="lazy">
            </div>

            <div class="gallery-overlay">
                <span>${title}</span>
            </div>

        </div>
    `;
}


// ==========================================
// HTML ESCAPING
// ==========================================

function escapeHTML(value) {

    const div = document.createElement("div");
    div.textContent = String(value);
    return div.innerHTML;
}