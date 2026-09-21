// js/testimonials.js

import { getApprovedTestimonials } from "./firebase-firestore.js";

document.addEventListener("DOMContentLoaded", loadApprovedTestimonials);


async function loadApprovedTestimonials() {

    const grid = document.querySelector("#testimonials .testimonials-grid");

    if (!grid) {
        return;
    }

    try {

        const testimonials = await getApprovedTestimonials();

        if (!testimonials.length) {
            // No approved reviews yet — keep the hand-picked static
            // cards already in index.html rather than showing nothing.
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
        // Static fallback markup stays as-is.
    }

}


function testimonialCardHTML(testimonial) {

    const clientName = escapeHTML(testimonial.clientName || "Anonymous");
    const review = escapeHTML(testimonial.review || "");
    const initials = getInitials(testimonial.clientName || "Anonymous");
    const ratingCount = Math.max(0, Math.min(5, Number(testimonial.rating || 0)));

    const starIcons = Array.from({ length: ratingCount })
        .map(() => `<i data-lucide="star"></i>`)
        .join("");

    return `

        <div class="testimonial-card">

            <p>"${review}"</p>

            <div class="testimonial-author">

                <div class="testimonial-avatar">${initials}</div>

                <div>

                    <strong>${clientName}</strong>

                    <div class="stars" aria-label="${ratingCount} out of 5 stars">
                        ${starIcons}
                    </div>

                </div>

            </div>

        </div>

    `;
}


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