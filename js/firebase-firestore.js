// js/firebase-firestore.js

import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import { app } from "./firebase-config.js";

export const db = getFirestore(app);


// ==========================================
// ADMIN CHECK
// ==========================================

export async function isAdmin(uid) {
    if (!uid) {
        return false;
    }

    try {
        const adminRef = doc(db, "admins", uid);
        const adminSnapshot = await getDoc(adminRef);

        return adminSnapshot.exists();

    } catch (error) {
        console.error("Admin check failed:", error);
        return false;
    }
}


// ==========================================
// SITE SETTINGS
// ==========================================

const SITE_SETTINGS_REF = doc(db, "settings", "site");

export async function getSiteSettings() {

    const snapshot = await getDoc(SITE_SETTINGS_REF);

    return snapshot.exists() ? snapshot.data() : {};
}

export async function updateSiteSettings(fields) {

    await setDoc(
        SITE_SETTINGS_REF,
        {
            ...fields,
            updatedAt: serverTimestamp()
        },
        { merge: true }
    );
}


// ==========================================
// SERVICES
// ==========================================

export async function getServices() {
    const servicesRef = collection(db, "services");

    const servicesQuery = query(
        servicesRef,
        where("active", "==", true),
        orderBy("order", "asc")
    );

    const snapshot = await getDocs(servicesQuery);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}


// ==========================================
// PROJECTS
// ==========================================

export async function getProjects() {
    const projectsRef = collection(db, "projects");

    const snapshot = await getDocs(projectsRef);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

export async function createProject({ title, category, imageUrl, imageAlt }) {

    const projectsRef = collection(db, "projects");

    return await addDoc(projectsRef, {
        title: (title || "").trim(),
        category: (category || "").trim(),
        imageUrl: imageUrl || "",
        imageAlt: (imageAlt || "").trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
}

export async function updateProject(projectId, { title, category, imageUrl, imageAlt }) {

    const projectRef = doc(db, "projects", projectId);

    await updateDoc(projectRef, {
        title: (title || "").trim(),
        category: (category || "").trim(),
        imageUrl: imageUrl || "",
        imageAlt: (imageAlt || "").trim(),
        updatedAt: serverTimestamp()
    });
}

export async function deleteProject(projectId) {

    const projectRef = doc(db, "projects", projectId);

    await deleteDoc(projectRef);
}


// ==========================================
// APPROVED TESTIMONIALS
// ==========================================

export async function getApprovedTestimonials() {
    const testimonialsRef = collection(db, "testimonials");

    const testimonialsQuery = query(
        testimonialsRef,
        where("status", "==", "approved"),
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(testimonialsQuery);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}


// ==========================================
// ADMIN TESTIMONIALS
// ==========================================

export async function getAllTestimonials() {
    const testimonialsRef = collection(db, "testimonials");

    const testimonialsQuery = query(
        testimonialsRef,
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(testimonialsQuery);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}


// ==========================================
// CREATE TESTIMONIAL
// ==========================================

export async function createTestimonial({
    clientName,
    review,
    rating,
    location,
    role
}) {
    const testimonialsRef = collection(db, "testimonials");

    return await addDoc(testimonialsRef, {
        clientName: clientName.trim(),
        review: review.trim(),
        rating: Number(rating),
        location: (location || "").trim(),
        role: (role || "").trim(),
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
}


// ==========================================
// UPDATE TESTIMONIAL STATUS
// ==========================================

export async function updateTestimonialStatus(
    testimonialId,
    status
) {
    const testimonialRef = doc(
        db,
        "testimonials",
        testimonialId
    );

    await updateDoc(testimonialRef, {
        status,
        updatedAt: serverTimestamp()
    });
}


// ==========================================
// DELETE TESTIMONIAL
// ==========================================

export async function deleteTestimonial(testimonialId) {
    const testimonialRef = doc(
        db,
        "testimonials",
        testimonialId
    );

    await deleteDoc(testimonialRef);
}