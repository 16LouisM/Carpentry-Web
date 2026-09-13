// server/server.js

require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 5000;

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the main website
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

// Check email connection when the server starts
transporter.verify((error, success) => {
    if (error) {
        console.error("✖ Email server connection failed:");
        console.error(error.message);
    } else {
        console.log("✓ Email server is ready");
    }
});

// =====================================================
// CONTACT / REQUEST FORM
// =====================================================

app.post("/api/contact", async (req, res) => {

    try {

        const {
            name,
            email,
            phone,
            service,
            message
        } = req.body;

        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "Please provide your name, email and message."
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address."
            });
        }

        // ---------------------------------------------
        // EMAIL TO BUSINESS
        // ---------------------------------------------

        const businessMail = {
            from: process.env.EMAIL_USER,
            to: process.env.BUSINESS_EMAIL || process.env.EMAIL_USER,

            replyTo: email,

            subject: `New Website Request from ${name}`,

            text: `
New customer request from the Modjadji Projects website.

Name:
${name}

Email:
${email}

Phone:
${phone || "Not provided"}

Service:
${service || "Not specified"}

Message:
${message}
            `,

            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">

                    <h2>New Website Request</h2>

                    <p>
                        A new customer request has been submitted
                        through the Modjadji Projects website.
                    </p>

                    <hr>

                    <h3>Client Details</h3>

                    <p>
                        <strong>Name:</strong><br>
                        ${escapeHtml(name)}
                    </p>

                    <p>
                        <strong>Email:</strong><br>
                        ${escapeHtml(email)}
                    </p>

                    <p>
                        <strong>Phone:</strong><br>
                        ${escapeHtml(phone || "Not provided")}
                    </p>

                    <p>
                        <strong>Service:</strong><br>
                        ${escapeHtml(service || "Not specified")}
                    </p>

                    <h3>Message</h3>

                    <p>
                        ${escapeHtml(message).replace(/\n/g, "<br>")}
                    </p>

                    <hr>

                    <p>
                        <strong>Reply directly to this email to contact the client.</strong>
                    </p>

                </div>
            `
        };

        // Send email to business
        await transporter.sendMail(businessMail);

        // ---------------------------------------------
        // OPTIONAL CONFIRMATION EMAIL TO CLIENT
        // ---------------------------------------------

        const clientMail = {
            from: process.env.EMAIL_USER,
            to: email,

            subject: "We received your request — Modjadji Projects",

            text: `
Hello ${name},

Thank you for contacting Modjadji Projects.

We have received your request and will get back to you as soon as possible.

Regards,
Modjadji Projects
            `,

            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">

                    <h2>Thank you for contacting Modjadji Projects</h2>

                    <p>Hello ${escapeHtml(name)},</p>

                    <p>
                        Thank you for getting in touch with us.
                        We have received your request successfully.
                    </p>

                    <p>
                        Our team will review your message and
                        get back to you as soon as possible.
                    </p>

                    <br>

                    <p>
                        Kind regards,<br>
                        <strong>Modjadji Projects</strong>
                    </p>

                </div>
            `
        };

        // Send confirmation to client
        await transporter.sendMail(clientMail);

        // ---------------------------------------------
        // SUCCESS RESPONSE
        // ---------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Your request has been sent successfully."
        });

    } catch (error) {

        console.error("Contact form error:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while sending your request."
        });
    }
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message: "Modjadji Projects server is running.",
        time: new Date().toISOString()
    });

});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {

    console.log("");
    console.log("==========================================");
    console.log("     MODJADJI PROJECTS SERVER");
    console.log("==========================================");
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ http://localhost:${PORT}`);
    console.log("==========================================");
    console.log("");

});

// =====================================================
// HTML ESCAPE FUNCTION
// =====================================================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}