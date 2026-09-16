// server/server.js

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const admin = require("./firebase-admin-config.js");

const app = express();

const PORT = process.env.PORT || 5000;


// =====================================================
// CLOUDINARY CONFIGURATION
// =====================================================

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// =====================================================
// IMAGE UPLOAD CONFIGURATION
// =====================================================

const upload = multer({

    storage: multer.memoryStorage(),

    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB
    },

    fileFilter: (req, file, cb) => {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG and WEBP images are allowed."));
        }
    }
});


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the main website (remove this if the frontend is hosted
// separately, e.g. on Vercel, and only the API runs here)
app.use(express.static(path.join(__dirname, "..")));


// =====================================================
// ADMIN AUTH MIDDLEWARE
// =====================================================
//
// Protects any route it's attached to. The client must send:
//   Authorization: Bearer <firebase ID token>
//
// The token is verified against Firebase itself (not just decoded), and
// the uid it contains must also have a document at admins/{uid} in
// Firestore — the same check your dashboard already does client-side.
// This is the check that was missing: naming a route "/api/admin/..."
// does nothing on its own to stop someone from calling it directly.

async function requireAdmin(req, res, next) {

    try {

        const header = req.headers.authorization || "";

        const match = header.match(/^Bearer (.+)$/);

        if (!match) {

            return res.status(401).json({
                success: false,
                message: "Missing or malformed Authorization header."
            });
        }

        const idToken = match[1];

        const decoded = await admin.auth().verifyIdToken(idToken);

        const adminDoc = await admin
            .firestore()
            .collection("admins")
            .doc(decoded.uid)
            .get();

        if (!adminDoc.exists) {

            return res.status(403).json({
                success: false,
                message: "This account does not have admin access."
            });
        }

        // Available to the route handler if needed (e.g. logging who
        // uploaded what).
        req.adminUid = decoded.uid;
        req.adminEmail = decoded.email;

        next();

    } catch (error) {

        console.error("Admin auth check failed:", error.message);

        return res.status(401).json({
            success: false,
            message: "Your session has expired. Please sign in again."
        });
    }
}


// =====================================================
// EMAIL CONFIGURATION
// =====================================================

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Check email connection when the server starts, so a bad
// EMAIL_USER/EMAIL_PASS shows up in the logs immediately
transporter.verify((error, success) => {
    if (error) {
        console.error("✖ Email server connection failed:");
        console.error(error.message);
    } else {
        console.log("✓ Email server is ready");
    }
});


// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Modjadji Projects server is running."
    });
});


// =====================================================
// CONTACT FORM
// =====================================================

app.post("/api/contact", async (req, res) => {

    try {

        const {
            name,
            email,
            phone,
            service,
            message
        } = req.body || {};


        // ---------------------------------------------
        // BASIC VALIDATION
        // ---------------------------------------------

        if (!name || !email || !message) {

            return res.status(400).json({
                success: false,
                message:
                    "Please complete all required fields."
            });

        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address."
            });
        }


        // ---------------------------------------------
        // HIDDEN ADMIN TRIGGER
        // ---------------------------------------------

        const adminTrigger =
            process.env.ADMIN_TRIGGER;

        const submittedMessage =
            String(message).trim();

        if (
            adminTrigger &&
            submittedMessage === adminTrigger
        ) {

            console.log(
                "Admin trigger detected."
            );

            return res.status(200).json({
                success: true,
                adminRedirect: true,
                redirect: "/admin/index.html"
            });

        }


        // ---------------------------------------------
        // ESCAPE HTML
        // ---------------------------------------------

        function escapeHtml(value) {

            return String(value)
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll('"', "&quot;")
                .replaceAll("'", "&#39;");
        }


        const safeName =
            escapeHtml(name);

        const safeEmail =
            escapeHtml(email);

        const safePhone =
            escapeHtml(phone || "Not provided");

        const safeService =
            escapeHtml(service || "Not specified");

        const safeMessage =
            escapeHtml(message)
                .replaceAll("\n", "<br>");


        // ---------------------------------------------
        // SEND EMAIL
        // ---------------------------------------------

        await transporter.sendMail({

            from: process.env.EMAIL_USER,

            to: process.env.BUSINESS_EMAIL,

            replyTo: email,

            subject:
                `New Website Enquiry - ${name}`,

            html: `
                <!DOCTYPE html>
                <html>
                <body style="
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                ">
                    <h2>New Website Enquiry</h2>
                    <p><strong>Name:</strong> ${safeName}</p>
                    <p><strong>Email:</strong> ${safeEmail}</p>
                    <p><strong>Phone:</strong> ${safePhone}</p>
                    <p><strong>Service:</strong> ${safeService}</p>
                    <p><strong>Project Description:</strong></p>
                    <p>${safeMessage}</p>
                </body>
                </html>
            `

        });


        console.log(
            `New enquiry received from ${name} (${email})`
        );


        // ---------------------------------------------
        // SUCCESS
        // ---------------------------------------------

        return res.status(200).json({
            success: true,
            message:
                "Your request has been sent successfully."
        });


    } catch (error) {

        console.error(
            "Email sending error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to send your request. Please try again."
        });

    }

});


// =====================================================
// CLOUDINARY IMAGE UPLOAD API  (admin-only)
// =====================================================

app.post(
    "/api/admin/images",
    requireAdmin,
    upload.single("image"),
    async (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({
                    success: false,
                    message: "Please select an image."
                });

            }

            const result = await new Promise((resolve, reject) => {

                const stream = cloudinary.uploader.upload_stream(
                    { folder: "modjadji-projects" },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );

                stream.end(req.file.buffer);
            });

            console.log(
                `✓ Image uploaded by ${req.adminEmail}:`,
                result.public_id
            );

            return res.status(200).json({
                success: true,
                message: "Image uploaded successfully.",
                image: {
                    url: result.secure_url,
                    publicId: result.public_id
                }
            });

        } catch (error) {

            console.error("✖ Cloudinary upload error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to upload image."
            });

        }

    }
);


// =====================================================
// CLOUDINARY IMAGE DELETE API  (admin-only)
// =====================================================

app.delete(
    "/api/admin/images",
    requireAdmin,
    async (req, res) => {

        try {

            const { publicId } = req.body || {};

            if (!publicId) {

                return res.status(400).json({
                    success: false,
                    message: "Image public ID is required."
                });

            }

            const result = await cloudinary.uploader.destroy(publicId);

            if (result.result !== "ok") {

                return res.status(404).json({
                    success: false,
                    message: "Image could not be deleted."
                });

            }

            console.log(
                `✓ Image deleted by ${req.adminEmail}:`,
                publicId
            );

            return res.status(200).json({
                success: true,
                message: "Image deleted successfully."
            });

        } catch (error) {

            console.error("✖ Cloudinary delete error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to delete image."
            });

        }

    }
);


// =====================================================
// UPLOAD ERROR HANDLER
// =====================================================
//
// Must be registered after the routes above — Express recognises an
// error handler by its 4-argument signature.

app.use((error, req, res, next) => {

    if (error instanceof multer.MulterError) {

        if (error.code === "LIMIT_FILE_SIZE") {

            return res.status(400).json({
                success: false,
                message: "Image is too large. Maximum size is 10 MB."
            });

        }
    }

    if (error) {

        return res.status(400).json({
            success: false,
            message: error.message || "Image upload failed."
        });

    }

    next();

});


// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
    console.log(
        `Modjadji Projects server running on port ${PORT}`
    );
});