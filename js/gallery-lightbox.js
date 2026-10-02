// js/gallery-lightbox.js
//
// 1. Click-to-enlarge for the Gallery section. Listens on the grid
//    container itself (event delegation), not on individual images,
//    so this keeps working after projects.js replaces the static
//    gallery items with ones loaded from Firestore.
//
// 2. Marquee duplication. The gallery is rendered as a continuously
//    scrolling track (CSS handles the motion); this module ensures
//    the track always contains two identical copies of the items,
//    which is what makes the -50% keyframe loop seamlessly.
//
//    projects.js swaps the grid's innerHTML at an unpredictable time
//    (whenever Firestore responds), so the duplication uses a
//    MutationObserver rather than a one-shot DOMContentLoaded call.
//    If the content is replaced, the observer re-duplicates. If the
//    content is already duplicated, the observer sees that and
//    stands down.

document.addEventListener("DOMContentLoaded", () => {

    const grid = document.querySelector("#gallery .gallery-grid");
    const lightbox = document.getElementById("galleryLightbox");
    const lightboxImg = document.getElementById("galleryLightboxImg");
    const lightboxCaption = document.getElementById("galleryLightboxCaption");
    const closeButton = document.getElementById("galleryLightboxClose");

    if (!grid) {
        return;
    }


    // ==========================================
    // LIGHTBOX
    // ==========================================

    if (lightbox && lightboxImg) {

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
    }


    // ==========================================
    // MARQUEE DUPLICATION
    // ==========================================

    setupMarqueeDuplication(grid);
});


// ==========================================
// MARQUEE DUPLICATION
// ==========================================

function setupMarqueeDuplication(grid) {

    // A grid that has N originals and N clones is already correct.
    // We only re-duplicate when the counts don't line up — i.e. when
    // projects.js has just replaced the contents with a fresh batch.
    function isAlreadyDuplicated() {

        const total = grid.children.length;

        if (!total) {
            return false;
        }

        const clones = grid.querySelectorAll('[data-marquee-clone="true"]').length;

        return clones > 0 && clones * 2 === total;
    }


    function duplicate() {

        if (isAlreadyDuplicated()) {
            return;
        }

        // Remove any partial or stale clones before re-cloning, so a
        // mid-flight replacement can't leave us with three copies.
        grid
            .querySelectorAll('[data-marquee-clone="true"]')
            .forEach((el) => el.remove());

        const originals = Array.from(grid.children);

        if (!originals.length) {
            return;
        }

        originals.forEach((node) => {

            const clone = node.cloneNode(true);

            // Screen readers should encounter each image once.
            clone.setAttribute("aria-hidden", "true");
            clone.setAttribute("data-marquee-clone", "true");

            // Take the duplicates out of the keyboard tab order.
            clone
                .querySelectorAll("a, button, [tabindex]")
                .forEach((el) => el.setAttribute("tabindex", "-1"));

            grid.appendChild(clone);
        });
    }


    // First pass — handles the static-HTML case, where items exist
    // before projects.js ever runs.
    duplicate();

    // Watch for projects.js replacing the grid's children. Debounced
    // so a full innerHTML swap (which fires one mutation per removed
    // child plus one per added child) triggers exactly one pass.
    let debounce = null;

    new MutationObserver(() => {

        clearTimeout(debounce);
        debounce = setTimeout(duplicate, 50);

    }).observe(grid, { childList: true });
}