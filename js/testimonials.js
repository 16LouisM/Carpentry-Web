// js/testimonials.js

import { getApprovedTestimonials } from "./firebase-firestore.js";


document.addEventListener("DOMContentLoaded", async () => {

    await loadApprovedTestimonials();
    duplicateForMarquee();

});


// ==========================================
// LOAD TESTIMONIALS
// ==========================================

async function loadApprovedTestimonials() {

    const grid = document.querySelector("#testimonials .testimonials-grid");

    if (!grid) {
        return;
    }

    try {

        const testimonials = await getApprovedTestimonials();

        if (!testimonials.length) {
            return;
        }

        grid.innerHTML = testimonials
            .map((testimonial) => testimonialCardHTML(testimonial))
            .join("");

        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }

    } catch (error) {

        console.error("Could not load testimonials from Firestore:", error);
    }

}


// ==========================================
// MARQUEE DUPLICATION
// ==========================================
//
// The scrolling animation moves the track left by exactly 50% of its
// own width, then jumps back to 0 — invisible to the eye only if the
// track holds two identical copies of the cards back-to-back.
//
// Two things matter here:
//
//   1. We CLONE the existing nodes and append the clones, rather than
//      doing `grid.innerHTML += grid.innerHTML`. The innerHTML trick
//      works, but it re-parses every node from scratch — which
//      strips the <svg> that Lucide already generated, drops any
//      event listeners, and can flash unstyled content mid-parse.
//      cloneNode(true) preserves the rendered DOM exactly.
//
//   2. The duplicates are marked `aria-hidden` and stripped of
//      focusability, so screen readers and keyboard tab order only
//      encounter each testimonial once. Without this, every card
//      would be announced (and tabbed to) twice.
//
// Runs once, after the Firestore load has either replaced the cards
// or left the static ones in place, so it always doubles whatever
// actually ended up in the grid.

function duplicateForMarquee() {

    const grid = document.querySelector("#testimonials .testimonials-grid");

    if (!grid || !grid.children.length) {
        return;
    }

    // Guard against a second run (e.g. if this is ever called again
    // from another code path). Duplicating twice would give four
    // copies, and the animation would visibly speed up.
    if (grid.dataset.marqueeDuplicated === "true") {
        return;
    }

    const originals = Array.from(grid.children);

    originals.forEach((node) => {

        const clone = node.cloneNode(true);

        // Screen readers should not encounter the duplicate set.
        clone.setAttribute("aria-hidden", "true");

        // Remove the clones from the keyboard tab order as well.
        clone
            .querySelectorAll("a, button, input, select, textarea, [tabindex]")
            .forEach((el) => el.setAttribute("tabindex", "-1"));

        grid.appendChild(clone);
    });

    grid.dataset.marqueeDuplicated = "true";

}


// ==========================================
// CARD TEMPLATE
// ==========================================

function testimonialCardHTML(testimonial) {

    const clientName = escapeHTML(testimonial.clientName || "Anonymous");
    const review = escapeHTML(testimonial.review || "");
    const initials = getInitials(testimonial.clientName || "Anonymous");
    const ratingCount = Math.max(0, Math.min(5, Number(testimonial.rating || 0)));

    // "Homeowner | Vanderbijlpark, Jozi" — role and location joined
    // with a pipe, matching the site's format. Either can be missing.
    const subtitle = [testimonial.role, testimonial.location]
        .filter((part) => part && String(part).trim())
        .map((part) => escapeHTML(part))
        .join(" | ");

    const starIcons = Array.from({ length: 5 })
        .map((_, index) => {
            const filledClass = index < ratingCount ? " filled" : "";
            return `<i data-lucide="star" class="star-icon${filledClass}"></i>`;
        })
        .join("");

    return `

        <div class="testimonial-card">

            <p>"${review}"</p>

            <div class="testimonial-author">

                <div class="testimonial-avatar">${initials}</div>

                <div>

                    <strong>${clientName}</strong>

                    ${subtitle ? `<small>${subtitle}</small>` : ""}

                    <div class="stars" aria-label="${ratingCount} out of 5 stars">
                        ${starIcons}
                    </div>

                </div>

            </div>

        </div>

    `;
}


// ==========================================
// HELPERS
// ==========================================

function getInitials(name) {

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");
}


function escapeHTML(value) {

    const div = document.createElement("div");
    div.textContent = String(value);
    return div.innerHTML;
}