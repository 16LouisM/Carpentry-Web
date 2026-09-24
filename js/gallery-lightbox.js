// js/gallery-lightbox.js
//
// Click-to-enlarge for the Gallery section. Listens on the grid
// container itself (event delegation), not on individual images, so
// this keeps working after projects.js replaces the static gallery
// items with ones loaded from Firestore.

document.addEventListener("DOMContentLoaded", () => {

    const grid = document.querySelector("#gallery .gallery-grid");
    const lightbox = document.getElementById("galleryLightbox");
    const lightboxImg = document.getElementById("galleryLightboxImg");
    const lightboxCaption = document.getElementById("galleryLightboxCaption");
    const closeButton = document.getElementById("galleryLightboxClose");

    if (!grid || !lightbox || !lightboxImg) {
        return;
    }

    function openLightbox(imgEl, captionText) {

        lightboxImg.src = imgEl.src;
        lightboxImg.alt = imgEl.alt || "";

        if (lightboxCaption) {
            lightboxCaption.textContent = captionText || "";
        }

        lightbox.style.display = "flex";
        document.body.style.overflow = "hidden";
    }

    function closeLightbox() {

        lightbox.style.display = "none";
        lightboxImg.src = "";
        document.body.style.overflow = "";
    }

    grid.addEventListener("click", (event) => {

        const item = event.target.closest(".gallery-item");

        if (!item || !grid.contains(item)) {
            return;
        }

        const img = item.querySelector(".gallery-item-inner img");

        if (!img) {
            return;
        }

        const captionEl = item.querySelector(".gallery-overlay span");
        const captionText = captionEl ? captionEl.textContent.trim() : "";

        openLightbox(img, captionText);
    });

    if (closeButton) {
        closeButton.addEventListener("click", closeLightbox);
    }

    // Clicking the dark backdrop (not the image or caption) closes it.
    lightbox.addEventListener("click", (event) => {

        if (event.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape" && lightbox.style.display === "flex") {
            closeLightbox();
        }
    });

});