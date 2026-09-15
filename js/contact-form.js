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

            const response = await fetch("http://localhost:5000/api/contact", {
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
            if (result.adminRedirect === true) {
                window.location.href = result.redirect || "/admin/index.html";
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