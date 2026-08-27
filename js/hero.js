/* =========================================================
   HERO.JS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const hero = document.querySelector(".hero");
    const heroVideo = document.querySelector(".hero-video");

    // Stop if the hero/video does not exist
    if (!hero || !heroVideo) {
        return;
    }


    /* =====================================================
       VIDEO SETUP
       ===================================================== */

    heroVideo.muted = true;
    heroVideo.loop = true;
    heroVideo.playsInline = true;


    /* =====================================================
       AUTOPLAY
       Some browsers block autoplay until play() is called.
       ===================================================== */

    const startVideo = () => {
        const playPromise = heroVideo.play();

        if (playPromise !== undefined) {
            playPromise.catch(() => {
                console.log("Hero video autoplay was blocked.");
            });
        }
    };


    if (heroVideo.readyState >= 2) {
        startVideo();
    } else {
        heroVideo.addEventListener("loadeddata", startVideo, {
            once: true
        });
    }


    /* =====================================================
       PAUSE VIDEO WHEN HERO IS NOT VISIBLE
       Improves performance.
       ===================================================== */

    const videoObserver = new IntersectionObserver(
        (entries) => {

            entries.forEach((entry) => {

                if (entry.isIntersecting) {
                    startVideo();
                } else {
                    heroVideo.pause();
                }

            });

        },
        {
            threshold: 0.1
        }
    );

    videoObserver.observe(hero);


    /* =====================================================
       VIDEO ERROR HANDLING
       If the video cannot load, the hero falls back to CSS.
       ===================================================== */

    heroVideo.addEventListener("error", () => {

        console.warn(
            "Hero video could not be loaded. Using fallback background."
        );

        hero.classList.add("video-error");

    });


    /* =====================================================
       REDUCED MOTION
       Respect the user's accessibility preference.
       ===================================================== */

    const reducedMotionQuery = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const handleReducedMotion = () => {

        if (reducedMotionQuery.matches) {

            heroVideo.pause();

            heroVideo.style.display = "none";

            hero.classList.add("reduced-motion");

        } else {

            heroVideo.style.display = "";

            hero.classList.remove("reduced-motion");

            startVideo();
        }
    };

    handleReducedMotion();

    reducedMotionQuery.addEventListener(
        "change",
        handleReducedMotion
    );


    /* =====================================================
       CLEANUP WHEN PAGE IS HIDDEN
       ===================================================== */

    document.addEventListener("visibilitychange", () => {

        if (document.hidden) {
            heroVideo.pause();
        } else if (!reducedMotionQuery.matches) {
            startVideo();
        }

    });

});