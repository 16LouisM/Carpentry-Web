import {
    getProjects,
    getServices,
    getAllTestimonials,
    updateTestimonialStatus,
    deleteTestimonial
} from "../../js/firebase-firestore.js";


const navItems =
    document.querySelectorAll(".nav-item");

const sections =
    document.querySelectorAll(".admin-section");

const pageTitle =
    document.getElementById("pageTitle");


// ==========================================
// NAVIGATION
// ==========================================

navItems.forEach(button => {

    button.addEventListener("click", () => {

        const sectionId =
            button.dataset.section;


        navItems.forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");


        sections.forEach(section => {
            section.classList.remove("active");
        });


        const section =
            document.getElementById(sectionId);


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


        pageTitle.textContent =
            titles[sectionId] || "Dashboard";


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

        const [
            projects,
            services,
            testimonials
        ] = await Promise.all([
            getProjects(),
            getServices(),
            getAllTestimonials()
        ]);


        document.getElementById(
            "projectCount"
        ).textContent = projects.length;


        document.getElementById(
            "serviceCount"
        ).textContent = services.length;


        const pending =
            testimonials.filter(
                item => item.status === "pending"
            ).length;


        const approved =
            testimonials.filter(
                item => item.status === "approved"
            ).length;


        document.getElementById(
            "pendingCount"
        ).textContent = pending;


        document.getElementById(
            "approvedCount"
        ).textContent = approved;


        displayProjects(projects);

        displayServices(services);


    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

    }

}


// ==========================================
// PROJECTS
// ==========================================

function displayProjects(projects) {

    const container =
        document.getElementById("projectsList");


    if (!projects.length) {

        container.innerHTML = `
            <div class="empty-state">
                No projects have been added yet.
            </div>
        `;

        return;
    }


    container.innerHTML = projects.map(project => `

        <div class="admin-item">

            <div>

                <h3>
                    ${escapeHTML(project.title || "Untitled")}
                </h3>

                <p>
                    ${escapeHTML(project.category || "")}
                </p>

            </div>

        </div>

    `).join("");

}


// ==========================================
// SERVICES
// ==========================================

function displayServices(services) {

    const container =
        document.getElementById("servicesList");


    if (!services.length) {

        container.innerHTML = `
            <div class="empty-state">
                No services have been added yet.
            </div>
        `;

        return;
    }


    container.innerHTML = services.map(service => `

        <div class="admin-item">

            <div>

                <h3>
                    ${escapeHTML(service.title || "Untitled")}
                </h3>

                <p>
                    ${escapeHTML(service.description || "")}
                </p>

            </div>

            <span class="status ${
                service.active
                    ? "status-approved"
                    : "status-rejected"
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

    const container =
        document.getElementById("testimonialsList");


    container.innerHTML =
        "Loading testimonials...";


    try {

        const testimonials =
            await getAllTestimonials();


        if (!testimonials.length) {

            container.innerHTML = `
                <div class="empty-state">
                    No client reviews yet.
                </div>
            `;

            return;
        }


        container.innerHTML =
            testimonials.map(
                testimonial => testimonialHTML(testimonial)
            ).join("");


        attachTestimonialActions();


    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="error-message">
                Unable to load testimonials.
            </div>
        `;

    }

}


function testimonialHTML(testimonial) {

    const rating =
        "★".repeat(Number(testimonial.rating || 0));


    return `

        <article
            class="testimonial-admin-card"
            data-id="${testimonial.id}"
        >

            <div class="testimonial-admin-content">

                <div class="testimonial-top">

                    <h3>
                        ${escapeHTML(
                            testimonial.clientName || "Anonymous"
                        )}
                    </h3>

                    <span class="status status-${testimonial.status}">
                        ${testimonial.status}
                    </span>

                </div>


                <div class="rating">
                    ${rating}
                </div>


                <p class="testimonial-review">
                    ${escapeHTML(
                        testimonial.review || ""
                    )}
                </p>

            </div>


            <div class="testimonial-actions">

                ${
                    testimonial.status === "pending"
                    ? `
                        <button
                            class="action-button approve"
                            data-action="approve"
                            data-id="${testimonial.id}"
                        >
                            Accept
                        </button>

                        <button
                            class="action-button reject"
                            data-action="reject"
                            data-id="${testimonial.id}"
                        >
                            Reject
                        </button>
                    `
                    : ""
                }


                ${
                    testimonial.status === "approved"
                    ? `
                        <button
                            class="action-button remove"
                            data-action="remove"
                            data-id="${testimonial.id}"
                        >
                            Remove
                        </button>
                    `
                    : ""
                }


                ${
                    testimonial.status === "rejected" ||
                    testimonial.status === "removed"
                    ? `
                        <button
                            class="action-button delete"
                            data-action="delete"
                            data-id="${testimonial.id}"
                        >
                            Delete
                        </button>
                    `
                    : ""
                }

            </div>

        </article>

    `;

}


// ==========================================
// TESTIMONIAL ACTIONS
// ==========================================

function attachTestimonialActions() {

    document
        .querySelectorAll("[data-action]")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const action =
                        button.dataset.action;

                    const id =
                        button.dataset.id;


                    button.disabled = true;


                    try {

                        if (action === "approve") {

                            await updateTestimonialStatus(
                                id,
                                "approved"
                            );

                        }


                        if (action === "reject") {

                            await updateTestimonialStatus(
                                id,
                                "rejected"
                            );

                        }


                        if (action === "remove") {

                            await updateTestimonialStatus(
                                id,
                                "removed"
                            );

                        }


                        if (action === "delete") {

                            const confirmed =
                                confirm(
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

                        console.error(error);

                        alert(
                            "The action could not be completed."
                        );

                        button.disabled = false;

                    }

                }
            );

        });

}


// ==========================================
// HTML ESCAPING
// ==========================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent = value;

    return div.innerHTML;

}


// ==========================================
// INITIALIZE
// ==========================================

loadDashboardData();