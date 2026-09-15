// server/server.js

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const app = express();

const PORT = process.env.PORT || 5000;

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
// START SERVER
// =====================================================

app.listen(PORT, () => {
    console.log(
        `Modjadji Projects server running on port ${PORT}`
    );
});