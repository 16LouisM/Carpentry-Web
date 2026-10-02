// js/contact-form.js

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("formFields");
    const submitBtn = document.getElementById("submitBtn");
    const successMessage = document.getElementById("formSuccess");

    if (!form) {
        console.error("Contact form not found.");
        return;
    }

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        // Get form values
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const service = document.getElementById("service").value;
        const message = document.getElementById("message").value.trim();

        // Basic validation
        if (!name || !email || !message) {
            alert(
                "Please fill in your name, email address and project description."
            );
            return;
        }

        // Email validation
        const emailParts = email.split("@");
        const domain = emailParts[1] || "";
        const domainDot = domain.indexOf(".");

        const validEmail =
            emailParts.length === 2 &&
            emailParts[0].length > 0 &&
            domainDot > 0 &&
            domainDot < domain.length - 1 &&
            !email.includes(" ");

        if (!validEmail) {
            alert("Please enter a valid email address.");
            return;
        }

        // Disable button while processing
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";

        try {

            // Resolved at runtime — see getApiBase() below.
            const response = await fetch(`${getApiBase()}/api/contact`, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    service,
                    message
                })
            });

            const result = await response.json();

            // -----------------------------------------
            // HIDDEN ADMIN TRIGGER
            // -----------------------------------------
            // Replace, don't assign, so Back can't return the visitor
            // to the public contact page they just triggered the admin
            // redirect from.
            if (result.adminRedirect === true) {
                window.location.replace(
                    result.redirect || "/admin/index.html"
                );
                return;
            }

            // -----------------------------------------
            // NORMAL CONTACT FORM RESPONSE
            // -----------------------------------------
            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "Something went wrong while sending your request."
                );
            }

            // Hide form
            form.style.display = "none";

            // Show success message
            successMessage.classList.add("show");

            // Restore Lucide icons if available
            if (typeof lucide !== "undefined") {
                lucide.createIcons();
            }

            // Restore form after 15 seconds
            setTimeout(() => {

                successMessage.classList.remove("show");

                form.style.display = "";

                form.reset();

                submitBtn.disabled = false;
                submitBtn.textContent = "Send My Request";

            }, 15000);

        } catch (error) {

            console.error("Contact form error:", error);

            alert(
                error.message ||
                "Unable to send your request. Please try again."
            );

            submitBtn.disabled = false;
            submitBtn.textContent = "Send My Request";
        }

    });

});


// ==========================================
// API BASE RESOLUTION
// ==========================================
//
// The site runs in three environments, and each needs a different
// base URL for the API:
//
//   1. Live (Netlify)  → window.ADMIN_API_BASE points at Render
//   2. Local dev       → API runs on :5000, site on :5500/:3000/etc.
//   3. Same-origin     → production backend serves the site too (unused
//                        here but kept for future-proofing)
//
// The script tag in index.html sets window.ADMIN_API_BASE:
//
//     <script>
//         window.ADMIN_API_BASE = "https://carpentry-web.onrender.com";
//     </script>
//
// This helper prefers that value; falls back to :5000 when the browser
// is on a dev port; and returns "" (same-origin) otherwise.

function getApiBase() {

    // 1. Explicit override wins — this is what the live site uses.
    if (typeof window !== "undefined" && window.ADMIN_API_BASE) {
        return String(window.ADMIN_API_BASE).replace(/\/+$/, "");
    }

    // 2. Local development — site is on one port, Express on 5000.
    if (typeof window !== "undefined" && window.location) {

        const port = window.location.port;

        const isDevPort =
            port &&
            port !== "5000" &&   // already on Express
            port !== "80" &&     // plain http
            port !== "443";      // https

        if (isDevPort) {
            return `${window.location.protocol}//${window.location.hostname}:5000`;
        }
    }

    // 3. Same-origin fallback — no base means the API is on the same
    //    domain as the site.
    return "";
}