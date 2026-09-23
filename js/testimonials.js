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


function testimonialCardHTML(testimonial) {

    const clientName = escapeHTML(testimonial.clientName || "Anonymous");
    const review = escapeHTML(testimonial.review || "");
    const initials = getInitials(testimonial.clientName || "Anonymous");
    const ratingCount = Math.max(0, Math.min(5, Number(testimonial.rating || 0)));

    // "Homeowner, Soshanguve" — role and location joined into one line,
    // matching the original static cards. Either can be missing.
    const subtitle = [testimonial.role, testimonial.location]
        .filter((part) => part && String(part).trim())
        .map((part) => escapeHTML(part))
        .join(", ");

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