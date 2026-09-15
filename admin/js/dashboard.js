// admin/js/dashboard.js

import {
    getProjects,
    getServices,
    getAllTestimonials,
    updateTestimonialStatus,
    deleteTestimonial
} from "../../js/firebase-firestore.js";

import {
    logoutAdmin,
    watchAuthState
} from "./firebase-auth.js";

import { protectAdminPage } from "./admin-guard.js";


// ==========================================
// DOM ELEMENTS
// ==========================================

const navItems = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".admin-section");
const pageTitle = document.getElementById("pageTitle");
const logoutButton = document.getElementById("logoutButton");
const adminEmail = document.getElementById("adminEmail");


// Set while a deliberate sign-out is in progress, so the auth watcher
// below does not fight the logout handler over where to navigate.

let signingOut = false;


// ==========================================
// LOGOUT
// ==========================================

if (!logoutButton) {

    console.error("ERROR: logoutButton was not found in the page.");

} else {

    logoutButton.addEventListener("click", async () => {

        if (signingOut) {
            return;
        }

        signingOut = true;

        logoutButton.disabled = true;
        logoutButton.textContent = "Signing out...";

        try {

            await logoutAdmin();

            // replace() rather than href: the dashboard should not stay
            // in the history stack after signing out.
            window.location.replace("./index.html");

        } catch (error) {

            console.error("Logout error:", error);

            alert("Unable to sign out. Please try again.");

            signingOut = false;

            logoutButton.disabled = false;
            logoutButton.textContent = "Sign Out";
        }

    });

}


// ==========================================
// SESSION WATCHER
// ==========================================
//
// Catches the session ending for any other reason (expired token, signed
// out in another tab). The initial check is handled by protectAdminPage().

watchAuthState((user) => {

    if (signingOut) {
        return;
    }

    if (!user) {
        window.location.replace("./index.html");
        return;
    }

    if (adminEmail) {
        adminEmail.textContent = user.email || "";
    }

});


// ==========================================
// NAVIGATION
// ==========================================

navItems.forEach((button) => {

    button.addEventListener("click", () => {

        const sectionId = button.dataset.section;

        navItems.forEach((item) => item.classList.remove("active"));

        button.classList.add("active");

        sections.forEach((section) => section.classList.remove("active"));

        const section = document.getElementById(sectionId);

        if (section) {
            section.classList.add("active");
        }

        const titles = {
            overview: "Dashboard",
            projects: "Projects",
            services: "Services",
            testimonials: "Testimonials",
            settings: "Settings"
        };

        pageTitle.textContent = titles[sectionId] || "Dashboard";

        if (sectionId === "testimonials") {
            loadTestimonials();
        }

    });

});


// ==========================================
// LOAD DASHBOARD DATA
// ==========================================

async function loadDashboardData() {

    try {

        const [projects, services, testimonials] = await Promise.all([
            getProjects(),
            getServices(),
            getAllTestimonials()
        ]);

        document.getElementById("projectCount").textContent =
            projects.length;

        document.getElementById("serviceCount").textContent =
            services.length;

        document.getElementById("pendingCount").textContent =
            testimonials.filter((item) => item.status === "pending").length;

        document.getElementById("approvedCount").textContent =
            testimonials.filter((item) => item.status === "approved").length;

        displayProjects(projects);
        displayServices(services);

    } catch (error) {

        console.error("Dashboard loading error:", error);
    }

}


// ==========================================
// PROJECTS
// ==========================================

function displayProjects(projects) {

    const container = document.getElementById("projectsList");

    if (!container) {
        return;
    }

    if (!projects.length) {

        container.innerHTML = `
            <div class="empty-state">
                No projects have been added yet.
            </div>
        `;

        return;
    }

    container.innerHTML = projects.map((project) => `

        <div class="admin-item">
            <div>
                <h3>${escapeHTML(project.title || "Untitled")}</h3>
                <p>${escapeHTML(project.category || "")}</p>
            </div>
        </div>

    `).join("");

}


// ==========================================
// SERVICES
// ==========================================

function displayServices(services) {

    const container = document.getElementById("servicesList");

    if (!container) {
        return;
    }

    if (!services.length) {

        container.innerHTML = `
            <div class="empty-state">
                No services have been added yet.
            </div>
        `;

        return;
    }

    container.innerHTML = services.map((service) => `

        <div class="admin-item">

            <div>
                <h3>${escapeHTML(service.title || "Untitled")}</h3>
                <p>${escapeHTML(service.description || "")}</p>
            </div>

            <span class="status ${
                service.active ? "status-approved" : "status-rejected"
            }">
                ${service.active ? "Active" : "Inactive"}
            </span>

        </div>

    `).join("");

}


// ==========================================
// TESTIMONIALS
// ==========================================

async function loadTestimonials() {

    const container = document.getElementById("testimonialsList");

    if (!container) {
        return;
    }

    container.innerHTML = "Loading testimonials...";

    try {

        const testimonials = await getAllTestimonials();

        if (!testimonials.length) {

            container.innerHTML = `
                <div class="empty-state">
                    No client reviews yet.
                </div>
            `;

            return;
        }

        container.innerHTML = testimonials
            .map((testimonial) => testimonialHTML(testimonial))
            .join("");

    } catch (error) {

        console.error("Testimonials loading error:", error);

        container.innerHTML = `
            <div class="error-message">
                Unable to load testimonials.
            </div>
        `;
    }

}


function testimonialHTML(testimonial) {

    const rating = "★".repeat(Number(testimonial.rating || 0));

    const id = escapeHTML(testimonial.id || "");

    return `

        <article class="testimonial-admin-card" data-id="${id}">

            <div class="testimonial-admin-content">

                <div class="testimonial-top">

                    <h3>
                        ${escapeHTML(testimonial.clientName || "Anonymous")}
                    </h3>

                    <span class="status status-${escapeHTML(
                        testimonial.status || ""
                    )}">
                        ${escapeHTML(testimonial.status || "")}
                    </span>

                </div>

                <div class="rating">${rating}</div>

                <p class="testimonial-review">
                    ${escapeHTML(testimonial.review || "")}
                </p>

            </div>

            <div class="testimonial-actions">

                ${testimonial.status === "pending" ? `

                    <button
                        class="action-button approve"
                        data-action="approve"
                        data-id="${id}"
                    >Accept</button>

                    <button
                        class="action-button reject"
                        data-action="reject"
                        data-id="${id}"
                    >Reject</button>

                ` : ""}

                ${testimonial.status === "approved" ? `

                    <button
                        class="action-button remove"
                        data-action="remove"
                        data-id="${id}"
                    >Remove</button>

                ` : ""}

                ${
                    testimonial.status === "rejected" ||
                    testimonial.status === "removed"
                    ? `

                    <button
                        class="action-button delete"
                        data-action="delete"
                        data-id="${id}"
                    >Delete</button>

                ` : ""}

            </div>

        </article>

    `;

}


// ==========================================
// TESTIMONIAL ACTIONS
// ==========================================
//
// One delegated listener on the container, attached once. The old code
// re-bound a listener to every button on every reload.

function attachTestimonialActions() {

    const container = document.getElementById("testimonialsList");

    if (!container) {
        return;
    }

    container.addEventListener("click", async (event) => {

        const button = event.target.closest("[data-action]");

        if (!button || !container.contains(button)) {
            return;
        }

        const action = button.dataset.action;
        const id = button.dataset.id;

        button.disabled = true;

        try {

            if (action === "approve") {
                await updateTestimonialStatus(id, "approved");
            }

            if (action === "reject") {
                await updateTestimonialStatus(id, "rejected");
            }

            if (action === "remove") {
                await updateTestimonialStatus(id, "removed");
            }

            if (action === "delete") {

                const confirmed = confirm(
                    "Delete this testimonial permanently?"
                );

                if (!confirmed) {
                    button.disabled = false;
                    return;
                }

                await deleteTestimonial(id);
            }

            await loadTestimonials();
            await loadDashboardData();

        } catch (error) {

            console.error("Testimonial action error:", error);

            alert("The action could not be completed.");

            button.disabled = false;
        }

    });

}


// ==========================================
// HTML ESCAPING
// ==========================================

function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = String(value);

    return div.innerHTML;
}


// ==========================================
// INITIALISE
// ==========================================
//
// Nothing is read from Firestore until an admin has been confirmed,
// otherwise the first reads fire while signed out and your security
// rules reject them.

(async function init() {

    const user = await protectAdminPage();

    if (adminEmail) {
        adminEmail.textContent = user.email || "";
    }

    attachTestimonialActions();

    await loadDashboardData();

})();