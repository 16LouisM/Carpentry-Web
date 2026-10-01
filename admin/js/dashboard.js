// admin/js/dashboard.js

import {
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    getServices,
    getAllTestimonials,
    updateTestimonialStatus,
    deleteTestimonial,
    getSiteSettings,
    updateSiteSettings
} from "../../js/firebase-firestore.js";

import {
    logoutAdmin,
    watchAuthState
} from "./firebase-auth.js";

import { protectAdminPage } from "./admin-guard.js";
import { adminFetch } from "./admin-fetch.js";
import { notify } from "./admin-notify.js";
import {
    installHistoryGuard,
    uninstallHistoryGuard
} from "./history-guard.js";


// ==========================================
// DOM ELEMENTS
// ==========================================

const navItems = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".admin-section");
const pageTitle = document.getElementById("pageTitle");
const logoutButton = document.getElementById("logoutButton");
const adminEmail = document.getElementById("adminEmail");

const logoFileInput = document.getElementById("logoFileInput");
const logoPreview = document.getElementById("logoPreview");
const saveLogoButton = document.getElementById("saveLogoButton");
const logoStatus = document.getElementById("logoStatus");

const aboutTitleInput = document.getElementById("aboutTitleInput");
const aboutTextArea = document.getElementById("aboutTextArea");
const aboutImageFileInput = document.getElementById("aboutImageFileInput");
const aboutImagePreview = document.getElementById("aboutImagePreview");
const saveAboutButton = document.getElementById("saveAboutButton");
const aboutStatus = document.getElementById("aboutStatus");

const contactAddressInput = document.getElementById("contactAddressInput");
const contactPhoneInput = document.getElementById("contactPhoneInput");
const contactEmailInput = document.getElementById("contactEmailInput");
const contactHoursInput = document.getElementById("contactHoursInput");
const serviceAreaTextArea = document.getElementById("serviceAreaTextArea");
const saveContactButton = document.getElementById("saveContactButton");
const contactStatus = document.getElementById("contactStatus");

const workshopPhotoFileInput = document.getElementById("workshopPhotoFileInput");
const workshopPhotoPreview = document.getElementById("workshopPhotoPreview");
const saveWorkshopPhotoButton = document.getElementById("saveWorkshopPhotoButton");
const workshopPhotoStatus = document.getElementById("workshopPhotoStatus");

const reviewImageFileInput = document.getElementById("reviewImageFileInput");
const reviewImagePreview = document.getElementById("reviewImagePreview");
const saveReviewImageButton = document.getElementById("saveReviewImageButton");
const deleteReviewImageButton = document.getElementById("deleteReviewImageButton");
const reviewImageStatus = document.getElementById("reviewImageStatus");

const addProjectButton = document.getElementById("addProjectButton");
const projectFormWrapper = document.getElementById("projectFormWrapper");
const projectFormTitle = document.getElementById("projectFormTitle");
const projectFormId = document.getElementById("projectFormId");
const projectTitleInput = document.getElementById("projectTitleInput");
const projectCategoryInput = document.getElementById("projectCategoryInput");
const projectImageAltInput = document.getElementById("projectImageAltInput");
const projectImageFileInput = document.getElementById("projectImageFileInput");
const projectImagePreview = document.getElementById("projectImagePreview");
const saveProjectButton = document.getElementById("saveProjectButton");
const cancelProjectButton = document.getElementById("cancelProjectButton");
const projectFormStatus = document.getElementById("projectFormStatus");


// Set while a deliberate sign-out is in progress, so the auth watcher
// below does not fight the logout handler over where to navigate.

let signingOut = false;


// ==========================================
// HISTORY GUARD
// ==========================================
//
// Trap Back/Forward so the user cannot cross between the admin and
// the public site using browser chrome. Installed synchronously,
// before any async work runs, so the wall is up from the first
// paint. The callback fires on every attempted exit — if the
// session has since been lost we bounce to login; otherwise we
// silently hold position.

installHistoryGuard({
    onExitAttempt: async () => {

        if (signingOut) {
            return;
        }

        try {

            const user = await protectAdminPage();

            if (!user) {
                uninstallHistoryGuard();
                window.location.replace("./index.html");
            }

        } catch (error) {

            console.error("History guard auth check failed:", error);

            uninstallHistoryGuard();
            window.location.replace("./index.html");
        }
    }
});


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

            // Drop the guard so our own redirect is not swallowed by
            // the popstate trap.
            uninstallHistoryGuard();

            window.location.replace("./index.html");

        } catch (error) {

            console.error("Logout error:", error);

            notify.error("Unable to sign out. Please try again.", {
                title: "Sign-out failed"
            });

            signingOut = false;

            logoutButton.disabled = false;
            logoutButton.textContent = "Sign Out";
        }

    });

}


// ==========================================
// SESSION WATCHER
// ==========================================

watchAuthState((user) => {

    if (signingOut) {
        return;
    }

    if (!user) {

        // Session revoked elsewhere or expired — kill the guard so
        // this redirect is not blocked by our own trap.
        uninstallHistoryGuard();

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

    // Each collection is fetched independently: a broken query on one
    // (e.g. a missing Firestore index) must never prevent the other
    // two from loading and rendering. Promise.all() would fail the
    // whole batch if any single promise rejected — Promise.allSettled
    // does not.

    const [
        projectsResult,
        servicesResult,
        testimonialsResult
    ] = await Promise.allSettled([
        getProjects(),
        getServices(),
        getAllTestimonials()
    ]);

    const projects = projectsResult.status === "fulfilled"
        ? projectsResult.value
        : [];

    const services = servicesResult.status === "fulfilled"
        ? servicesResult.value
        : [];

    const testimonials = testimonialsResult.status === "fulfilled"
        ? testimonialsResult.value
        : [];

    if (projectsResult.status === "rejected") {
        console.error("Could not load projects:", projectsResult.reason);
    }

    if (servicesResult.status === "rejected") {
        console.error("Could not load services:", servicesResult.reason);
    }

    if (testimonialsResult.status === "rejected") {
        console.error("Could not load testimonials:", testimonialsResult.reason);
    }

    document.getElementById("projectCount").textContent =
        projectsResult.status === "fulfilled" ? projects.length : "—";

    document.getElementById("serviceCount").textContent =
        servicesResult.status === "fulfilled" ? services.length : "—";

    document.getElementById("pendingCount").textContent =
        testimonialsResult.status === "fulfilled"
            ? testimonials.filter((item) => item.status === "pending").length
            : "—";

    document.getElementById("approvedCount").textContent =
        testimonialsResult.status === "fulfilled"
            ? testimonials.filter((item) => item.status === "approved").length
            : "—";

    // Projects renders even if Services or Testimonials failed — this is
    // the fix for the "Edit form opens empty" bug: projectsCache now
    // gets populated as long as getProjects() itself succeeds.
    displayProjects(projects);
    displayServices(services);

}


// ==========================================
// PROJECTS — DISPLAY
// ==========================================

let projectsCache = [];

function displayProjects(projects) {

    projectsCache = projects;

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

            <div style="display:flex; align-items:center; gap:1rem;">

                ${project.imageUrl ? `
                    <img
                        src="${escapeHTML(project.imageUrl)}"
                        alt=""
                        style="width:60px; height:45px; object-fit:cover; border-radius:6px; flex-shrink:0;"
                    >
                ` : ""}

                <div>
                    <h3>${escapeHTML(project.title || "Untitled")}</h3>
                    <p>${escapeHTML(project.category || "")}</p>
                </div>

            </div>

            <div style="display:flex; gap:0.5rem;">

                <button
                    type="button"
                    class="action-button"
                    data-project-action="edit"
                    data-id="${escapeHTML(project.id)}"
                >Edit</button>

                <button
                    type="button"
                    class="action-button reject"
                    data-project-action="delete"
                    data-id="${escapeHTML(project.id)}"
                >Delete</button>

            </div>

        </div>

    `).join("");

}


// ==========================================
// PROJECTS — ADD / EDIT FORM
// ==========================================

let editingProjectId = null;
let selectedProjectImageFile = null;
let currentProjectImageUrl = "";

function openProjectForm(project) {

    if (!projectFormWrapper) {
        return;
    }

    if (project) {

        editingProjectId = project.id;
        currentProjectImageUrl = project.imageUrl || "";

        if (projectFormTitle) projectFormTitle.textContent = "Edit Project";
        if (projectFormId) projectFormId.value = project.id;
        if (projectTitleInput) projectTitleInput.value = project.title || "";
        if (projectCategoryInput) projectCategoryInput.value = project.category || "";
        if (projectImageAltInput) projectImageAltInput.value = project.imageAlt || "";

        if (projectImagePreview) {

            if (project.imageUrl) {
                projectImagePreview.src = project.imageUrl;
                projectImagePreview.style.display = "block";
            } else {
                projectImagePreview.style.display = "none";
            }
        }

    } else {

        editingProjectId = null;
        currentProjectImageUrl = "";

        if (projectFormTitle) projectFormTitle.textContent = "Add New Project";
        if (projectFormId) projectFormId.value = "";
        if (projectTitleInput) projectTitleInput.value = "";
        if (projectCategoryInput) projectCategoryInput.value = "";
        if (projectImageAltInput) projectImageAltInput.value = "";

        if (projectImagePreview) {
            projectImagePreview.src = "";
            projectImagePreview.style.display = "none";
        }
    }

    selectedProjectImageFile = null;

    if (projectImageFileInput) {
        projectImageFileInput.value = "";
    }

    if (projectFormStatus) {
        projectFormStatus.textContent = "";
    }

    projectFormWrapper.style.display = "block";
    projectFormWrapper.scrollIntoView({ behavior: "smooth", block: "nearest" });

}

function closeProjectForm() {

    if (projectFormWrapper) {
        projectFormWrapper.style.display = "none";
    }

    editingProjectId = null;
    selectedProjectImageFile = null;
    currentProjectImageUrl = "";
}


if (addProjectButton) {

    addProjectButton.addEventListener("click", () => {
        openProjectForm(null);
    });

}


if (cancelProjectButton) {

    cancelProjectButton.addEventListener("click", () => {
        closeProjectForm();
    });

}


if (projectImageFileInput) {

    projectImageFileInput.addEventListener("change", () => {

        const file = projectImageFileInput.files[0];

        selectedProjectImageFile = file || null;

        if (file && projectImagePreview) {
            projectImagePreview.src = URL.createObjectURL(file);
            projectImagePreview.style.display = "block";
        }

    });

}


if (saveProjectButton) {

    saveProjectButton.addEventListener("click", async () => {

        const title = projectTitleInput ? projectTitleInput.value.trim() : "";

        if (!title) {

            if (projectFormStatus) {
                projectFormStatus.textContent = "Please enter a project title.";
            }

            notify.warning("Please enter a project title.", {
                title: "Missing title"
            });

            return;
        }

        saveProjectButton.disabled = true;

        if (projectFormStatus) {
            projectFormStatus.textContent = "Saving...";
        }

        try {

            let imageUrl = currentProjectImageUrl;

            if (selectedProjectImageFile) {

                const formData = new FormData();
                formData.append("image", selectedProjectImageFile);

                const uploadResponse = await adminFetch(
                    "/api/admin/images",
                    { method: "POST", body: formData }
                );

                const uploadResult = await uploadResponse.json();

                if (!uploadResponse.ok || !uploadResult.success) {
                    throw new Error(
                        uploadResult.message || "Photo upload failed."
                    );
                }

                imageUrl = uploadResult.image.url;
            }

            const fields = {
                title,
                category: projectCategoryInput ? projectCategoryInput.value.trim() : "",
                imageAlt: projectImageAltInput ? projectImageAltInput.value.trim() : "",
                imageUrl
            };

            const wasEditing = Boolean(editingProjectId);

            if (wasEditing) {
                await updateProject(editingProjectId, fields);
            } else {
                await createProject(fields);
            }

            closeProjectForm();

            notify.success(
                wasEditing ? "Project updated." : "Project added.",
                { title: "Projects" }
            );

            await loadDashboardData();

        } catch (error) {

            console.error("Project save error:", error);

            if (projectFormStatus) {
                projectFormStatus.textContent =
                    error.message || "Unable to save this project.";
            }

            notify.error(error.message || "Unable to save this project.", {
                title: "Save failed"
            });

        } finally {

            saveProjectButton.disabled = false;
        }

    });

}


// ==========================================
// PROJECTS — EDIT / DELETE (delegated)
// ==========================================

(function attachProjectActions() {

    const container = document.getElementById("projectsList");

    if (!container) {
        return;
    }

    container.addEventListener("click", async (event) => {

        const button = event.target.closest("[data-project-action]");

        if (!button || !container.contains(button)) {
            return;
        }

        const action = button.dataset.projectAction;
        const id = button.dataset.id;

        if (action === "edit") {

            const project = projectsCache.find((item) => item.id === id);

            if (project) {
                openProjectForm(project);
            } else {
                notify.warning(
                    "This project is no longer in the list. Refresh and try again.",
                    { title: "Project not found" }
                );
            }

            return;
        }

        if (action === "delete") {

            const confirmed = await notify.confirm(
                "Delete this project permanently? This does not delete its photo from Cloudinary.",
                {
                    title: "Delete project",
                    confirmLabel: "Delete",
                    variant: "danger"
                }
            );

            if (!confirmed) {
                return;
            }

            button.disabled = true;

            try {

                await deleteProject(id);
                await loadDashboardData();

                notify.success("Project deleted.", {
                    title: "Projects"
                });

            } catch (error) {

                console.error("Project delete error:", error);

                notify.error("The project could not be deleted.", {
                    title: "Delete failed"
                });

                button.disabled = false;
            }

        }

    });

})();


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
                notify.success("Review approved.", { title: "Testimonials" });
            }

            if (action === "reject") {
                await updateTestimonialStatus(id, "rejected");
                notify.info("Review rejected.", { title: "Testimonials" });
            }

            if (action === "remove") {
                await updateTestimonialStatus(id, "removed");
                notify.warning("Review removed from the site.", {
                    title: "Testimonials"
                });
            }

            if (action === "delete") {

                const confirmed = await notify.confirm(
                    "Delete this testimonial permanently?",
                    {
                        title: "Delete testimonial",
                        confirmLabel: "Delete",
                        variant: "danger"
                    }
                );

                if (!confirmed) {
                    button.disabled = false;
                    return;
                }

                await deleteTestimonial(id);
                notify.success("Testimonial deleted.", {
                    title: "Testimonials"
                });
            }

            await loadTestimonials();
            await loadDashboardData();

        } catch (error) {

            console.error("Testimonial action error:", error);

            notify.error("The action could not be completed.", {
                title: "Action failed"
            });

            button.disabled = false;
        }

    });

}


// ==========================================
// SITE SETTINGS
// ==========================================

let selectedLogoFile = null;
let selectedAboutImageFile = null;
let currentAboutImageUrl = "";
let selectedWorkshopPhotoFile = null;
let currentWorkshopPhotoUrl = "";
let selectedReviewImageFile = null;
let currentReviewImageUrl = "";
let currentReviewImagePublicId = "";


async function initSettingsPanel() {

    // Hidden by default, synchronously, before any async fetch even
    // starts. An <img> with src="" tries to load the page itself as
    // an image and shows a broken-image icon — this prevents that
    // flash (or permanent broken state, if the fetch below fails)
    // regardless of what the HTML's own inline style says.
    [logoPreview, aboutImagePreview, workshopPhotoPreview, reviewImagePreview]
        .forEach((img) => {
            if (img) {
                img.style.display = "none";
            }
        });

    let settings = {};

    try {

        settings = await getSiteSettings();

    } catch (error) {

        console.error("Could not load current site settings:", error);

        notify.error("Could not load current site settings.", {
            title: "Settings"
        });

        return;
    }

    if (logoPreview && settings.logoUrl) {
        logoPreview.src = settings.logoUrl;
        logoPreview.style.display = "block";
    }

    if (aboutTitleInput && settings.aboutTitle) {
        aboutTitleInput.value = settings.aboutTitle;
    }

    if (aboutTextArea && settings.aboutText) {
        aboutTextArea.value = settings.aboutText;
    }

    if (settings.aboutImageUrl) {

        currentAboutImageUrl = settings.aboutImageUrl;

        if (aboutImagePreview) {
            aboutImagePreview.src = settings.aboutImageUrl;
            aboutImagePreview.style.display = "block";
        }
    }

    if (contactAddressInput && settings.contactAddress) {
        contactAddressInput.value = settings.contactAddress;
    }

    if (contactPhoneInput && settings.contactPhone) {
        contactPhoneInput.value = settings.contactPhone;
    }

    if (contactEmailInput && settings.contactEmail) {
        contactEmailInput.value = settings.contactEmail;
    }

    if (contactHoursInput && settings.contactHours) {
        contactHoursInput.value = settings.contactHours;
    }

    if (serviceAreaTextArea && settings.serviceAreaText) {
        serviceAreaTextArea.value = settings.serviceAreaText;
    }

    if (workshopPhotoPreview && settings.workshopPhotoUrl) {
        currentWorkshopPhotoUrl = settings.workshopPhotoUrl;
        workshopPhotoPreview.src = settings.workshopPhotoUrl;
        workshopPhotoPreview.style.display = "block";
    }

    if (settings.reviewFormImageUrl) {

        currentReviewImageUrl = settings.reviewFormImageUrl;
        currentReviewImagePublicId = settings.reviewFormImagePublicId || "";

        if (reviewImagePreview) {
            reviewImagePreview.src = settings.reviewFormImageUrl;
            reviewImagePreview.style.display = "block";
        }

        if (deleteReviewImageButton) {
            deleteReviewImageButton.style.display = "inline-block";
        }
    }

}


if (logoFileInput) {

    logoFileInput.addEventListener("change", () => {

        const file = logoFileInput.files[0];

        selectedLogoFile = file || null;

        if (file) {
            logoPreview.src = URL.createObjectURL(file);
            saveLogoButton.disabled = false;
        } else {
            saveLogoButton.disabled = true;
        }

        if (logoStatus) {
            logoStatus.textContent = "";
        }

    });

}


if (saveLogoButton) {

    saveLogoButton.addEventListener("click", async () => {

        if (!selectedLogoFile) {
            return;
        }

        saveLogoButton.disabled = true;

        if (logoStatus) {
            logoStatus.textContent = "Uploading...";
        }

        try {

            const formData = new FormData();
            formData.append("image", selectedLogoFile);

            const uploadResponse = await adminFetch(
                "/api/admin/images",
                { method: "POST", body: formData }
            );

            const uploadResult = await uploadResponse.json();

            if (!uploadResponse.ok || !uploadResult.success) {
                throw new Error(uploadResult.message || "Upload failed.");
            }

            await updateSiteSettings({ logoUrl: uploadResult.image.url });

            if (logoStatus) {
                logoStatus.textContent = "Logo saved.";
            }

            notify.success("Logo saved.", { title: "Settings" });

            selectedLogoFile = null;
            logoFileInput.value = "";

        } catch (error) {

            console.error("Logo save error:", error);

            if (logoStatus) {
                logoStatus.textContent = error.message || "Unable to save logo.";
            }

            notify.error(error.message || "Unable to save logo.", {
                title: "Save failed"
            });

        } finally {

            saveLogoButton.disabled = true;
        }

    });

}


if (aboutImageFileInput) {

    aboutImageFileInput.addEventListener("change", () => {

        const file = aboutImageFileInput.files[0];

        selectedAboutImageFile = file || null;

        if (file && aboutImagePreview) {
            aboutImagePreview.src = URL.createObjectURL(file);
            aboutImagePreview.style.display = "block";
        }

        if (aboutStatus) {
            aboutStatus.textContent = "";
        }

    });

}


if (saveAboutButton) {

    saveAboutButton.addEventListener("click", async () => {

        saveAboutButton.disabled = true;

        if (aboutStatus) {
            aboutStatus.textContent = "Saving...";
        }

        try {

            let aboutImageUrl = currentAboutImageUrl;

            if (selectedAboutImageFile) {

                const formData = new FormData();
                formData.append("image", selectedAboutImageFile);

                const uploadResponse = await adminFetch(
                    "/api/admin/images",
                    { method: "POST", body: formData }
                );

                const uploadResult = await uploadResponse.json();

                if (!uploadResponse.ok || !uploadResult.success) {
                    throw new Error(
                        uploadResult.message || "Photo upload failed."
                    );
                }

                aboutImageUrl = uploadResult.image.url;
            }

            await updateSiteSettings({
                aboutTitle: aboutTitleInput ? aboutTitleInput.value.trim() : "",
                aboutText: aboutTextArea ? aboutTextArea.value.trim() : "",
                aboutImageUrl
            });

            currentAboutImageUrl = aboutImageUrl;
            selectedAboutImageFile = null;

            if (aboutImageFileInput) {
                aboutImageFileInput.value = "";
            }

            if (aboutStatus) {
                aboutStatus.textContent = "Who We Are section saved.";
            }

            notify.success("Who We Are section saved.", { title: "Settings" });

        } catch (error) {

            console.error("Who We Are save error:", error);

            if (aboutStatus) {
                aboutStatus.textContent =
                    error.message || "Unable to save this section.";
            }

            notify.error(error.message || "Unable to save this section.", {
                title: "Save failed"
            });

        } finally {

            saveAboutButton.disabled = false;
        }

    });

}


if (saveContactButton) {

    saveContactButton.addEventListener("click", async () => {

        saveContactButton.disabled = true;

        if (contactStatus) {
            contactStatus.textContent = "Saving...";
        }

        try {

            await updateSiteSettings({
                contactAddress: contactAddressInput
                    ? contactAddressInput.value.trim()
                    : "",
                contactPhone: contactPhoneInput
                    ? contactPhoneInput.value.trim()
                    : "",
                contactEmail: contactEmailInput
                    ? contactEmailInput.value.trim()
                    : "",
                contactHours: contactHoursInput
                    ? contactHoursInput.value.trim()
                    : "",
                serviceAreaText: serviceAreaTextArea
                    ? serviceAreaTextArea.value.trim()
                    : ""
            });

            if (contactStatus) {
                contactStatus.textContent = "Contact details saved.";
            }

            notify.success("Contact details saved.", { title: "Settings" });

        } catch (error) {

            console.error("Contact details save error:", error);

            if (contactStatus) {
                contactStatus.textContent =
                    error.message || "Unable to save contact details.";
            }

            notify.error(error.message || "Unable to save contact details.", {
                title: "Save failed"
            });

        } finally {

            saveContactButton.disabled = false;
        }

    });

}


// ==========================================
// WORKSHOP PHOTO — SAVE
// ==========================================

if (workshopPhotoFileInput) {

    workshopPhotoFileInput.addEventListener("change", () => {

        const file = workshopPhotoFileInput.files[0];

        selectedWorkshopPhotoFile = file || null;

        if (file && workshopPhotoPreview) {
            workshopPhotoPreview.src = URL.createObjectURL(file);
            workshopPhotoPreview.style.display = "block";
        }

        if (saveWorkshopPhotoButton) {
            saveWorkshopPhotoButton.disabled = !file;
        }

        if (workshopPhotoStatus) {
            workshopPhotoStatus.textContent = "";
        }

    });

}


if (saveWorkshopPhotoButton) {

    saveWorkshopPhotoButton.addEventListener("click", async () => {

        if (!selectedWorkshopPhotoFile) {
            return;
        }

        saveWorkshopPhotoButton.disabled = true;

        if (workshopPhotoStatus) {
            workshopPhotoStatus.textContent = "Uploading...";
        }

        try {

            const formData = new FormData();
            formData.append("image", selectedWorkshopPhotoFile);

            const uploadResponse = await adminFetch(
                "/api/admin/images",
                { method: "POST", body: formData }
            );

            const uploadResult = await uploadResponse.json();

            if (!uploadResponse.ok || !uploadResult.success) {
                throw new Error(uploadResult.message || "Upload failed.");
            }

            await updateSiteSettings({
                workshopPhotoUrl: uploadResult.image.url
            });

            currentWorkshopPhotoUrl = uploadResult.image.url;

            if (workshopPhotoStatus) {
                workshopPhotoStatus.textContent = "Workshop photo saved.";
            }

            notify.success("Workshop photo saved.", { title: "Settings" });

            selectedWorkshopPhotoFile = null;
            workshopPhotoFileInput.value = "";

        } catch (error) {

            console.error("Workshop photo save error:", error);

            if (workshopPhotoStatus) {
                workshopPhotoStatus.textContent =
                    error.message || "Unable to save this photo.";
            }

            notify.error(error.message || "Unable to save this photo.", {
                title: "Save failed"
            });

        } finally {

            saveWorkshopPhotoButton.disabled = true;
        }

    });

}


// ==========================================
// REVIEW FORM IMAGE — SAVE / DELETE
// ==========================================
//
// Unlike Logo/Who We Are/Workshop Photo, this one supports true
// deletion: removing it here also deletes the file from Cloudinary,
// not just unlinking it from the site. Replacing it does the same —
// the old image is deleted once the new one is confirmed uploaded, so
// Cloudinary storage doesn't quietly fill up with orphaned photos.

if (reviewImageFileInput) {

    reviewImageFileInput.addEventListener("change", () => {

        const file = reviewImageFileInput.files[0];

        selectedReviewImageFile = file || null;

        if (file && reviewImagePreview) {
            reviewImagePreview.src = URL.createObjectURL(file);
            reviewImagePreview.style.display = "block";
            saveReviewImageButton.disabled = false;
        } else {
            saveReviewImageButton.disabled = true;
        }

        if (reviewImageStatus) {
            reviewImageStatus.textContent = "";
        }

    });

}


async function deleteCloudinaryImage(publicId) {

    if (!publicId) {
        return;
    }

    try {

        await adminFetch("/api/admin/images", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicId })
        });

    } catch (error) {

        // Not fatal — the site's copy of the URL is what actually
        // matters; a leftover Cloudinary file is a minor cleanup
        // issue, not a broken feature.
        console.error("Could not delete old Cloudinary image:", error);
    }

}


if (saveReviewImageButton) {

    saveReviewImageButton.addEventListener("click", async () => {

        if (!selectedReviewImageFile) {
            return;
        }

        saveReviewImageButton.disabled = true;

        if (reviewImageStatus) {
            reviewImageStatus.textContent = "Uploading...";
        }

        try {

            const formData = new FormData();
            formData.append("image", selectedReviewImageFile);

            const uploadResponse = await adminFetch(
                "/api/admin/images",
                { method: "POST", body: formData }
            );

            const uploadResult = await uploadResponse.json();

            if (!uploadResponse.ok || !uploadResult.success) {
                throw new Error(uploadResult.message || "Upload failed.");
            }

            const previousPublicId = currentReviewImagePublicId;

            await updateSiteSettings({
                reviewFormImageUrl: uploadResult.image.url,
                reviewFormImagePublicId: uploadResult.image.publicId
            });

            // Clean up the image being replaced, now that the new one
            // is confirmed saved.
            if (previousPublicId) {
                await deleteCloudinaryImage(previousPublicId);
            }

            currentReviewImageUrl = uploadResult.image.url;
            currentReviewImagePublicId = uploadResult.image.publicId;

            if (reviewImageStatus) {
                reviewImageStatus.textContent = "Image saved.";
            }

            notify.success("Image saved.", { title: "Review form" });

            if (deleteReviewImageButton) {
                deleteReviewImageButton.style.display = "inline-block";
            }

            selectedReviewImageFile = null;
            reviewImageFileInput.value = "";

        } catch (error) {

            console.error("Review image save error:", error);

            if (reviewImageStatus) {
                reviewImageStatus.textContent =
                    error.message || "Unable to save image.";
            }

            notify.error(error.message || "Unable to save image.", {
                title: "Save failed"
            });

        } finally {

            saveReviewImageButton.disabled = true;
        }

    });

}


if (deleteReviewImageButton) {

    deleteReviewImageButton.addEventListener("click", async () => {

        const confirmed = await notify.confirm(
            "Remove this image from the review form and delete it from Cloudinary? This can't be undone.",
            {
                title: "Remove review image",
                confirmLabel: "Remove",
                variant: "danger"
            }
        );

        if (!confirmed) {
            return;
        }

        deleteReviewImageButton.disabled = true;

        if (reviewImageStatus) {
            reviewImageStatus.textContent = "Removing...";
        }

        try {

            await updateSiteSettings({
                reviewFormImageUrl: "",
                reviewFormImagePublicId: ""
            });

            if (currentReviewImagePublicId) {
                await deleteCloudinaryImage(currentReviewImagePublicId);
            }

            currentReviewImageUrl = "";
            currentReviewImagePublicId = "";

            if (reviewImagePreview) {
                reviewImagePreview.src = "";
                reviewImagePreview.style.display = "none";
            }

            deleteReviewImageButton.style.display = "none";

            if (reviewImageStatus) {
                reviewImageStatus.textContent = "Image removed.";
            }

            notify.success("Image removed.", { title: "Review form" });

        } catch (error) {

            console.error("Review image delete error:", error);

            if (reviewImageStatus) {
                reviewImageStatus.textContent =
                    error.message || "Unable to remove image.";
            }

            notify.error(error.message || "Unable to remove image.", {
                title: "Remove failed"
            });

        } finally {

            deleteReviewImageButton.disabled = false;
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

(async function init() {

    const user = await protectAdminPage();

    if (adminEmail) {
        adminEmail.textContent = user.email || "";
    }

    attachTestimonialActions();

    await loadDashboardData();
    await initSettingsPanel();

})();