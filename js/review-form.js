// js/review-form.js

import { createTestimonial } from "./firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("reviewForm");

    if (!form) {
        return;
    }

    const starButtons = document.querySelectorAll("#starRatingInput .star-btn");
    const ratingInput = document.getElementById("reviewRating");
    const messageEl = document.getElementById("reviewFormMessage");
    const successEl = document.getElementById("reviewFormSuccess");
    const submitBtn = document.getElementById("reviewSubmitBtn");
    const honeypot = document.getElementById("reviewHoneypot");

    let currentRating = 0;


    // ==========================================
    // STAR RATING WIDGET
    // ==========================================

    function paintStars(value) {

        starButtons.forEach((btn) => {

            const starValue = Number(btn.dataset.value);

            btn.style.color = starValue <= value ? "#d9a441" : "#ccc";
        });
    }

    paintStars(0);

    starButtons.forEach((btn) => {

        btn.addEventListener("click", () => {

            currentRating = Number(btn.dataset.value);
            ratingInput.value = currentRating;

            paintStars(currentRating);
        });

        btn.addEventListener("mouseenter", () => {
            paintStars(Number(btn.dataset.value));
        });

        btn.addEventListener("mouseleave", () => {
            paintStars(currentRating);
        });

    });


    // ==========================================
    // SUBMIT
    // ==========================================

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        // Honeypot: a real visitor never fills this hidden field.
        // If it's filled, quietly do nothing rather than tipping off
        // whatever filled it in.
        if (honeypot && honeypot.value.trim() !== "") {
            return;
        }

        const clientName = document.getElementById("reviewerName").value.trim();
        const review = document.getElementById("reviewText").value.trim();
        const rating = currentRating;

        if (!clientName || !review) {
            messageEl.textContent = "Please fill in your name and review.";
            return;
        }

        if (!rating) {
            messageEl.textContent = "Please select a star rating.";
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
        messageEl.textContent = "";

        try {

            await createTestimonial({ clientName, review, rating });

            form.style.display = "none";

            if (successEl) {
                successEl.style.display = "block";
            }

        } catch (error) {

            console.error("Review submission error:", error);

            messageEl.textContent =
                "Something went wrong. Please try again.";

            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Review";
        }

    });

});