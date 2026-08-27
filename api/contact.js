const nodemailer = require("nodemailer");

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

async function contactHandler(req, res) {
    // Only allow POST requests
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed."
        });
    }

    try {
        const {
            name,
            email,
            phone,
            service,
            message
        } = req.body || {};

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "Please complete all required fields."
            });
        }

        // Escape user input
        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safePhone = escapeHtml(phone || "Not provided");
        const safeService = escapeHtml(service || "Not specified");
        const safeMessage = escapeHtml(message).replaceAll(
            "\n",
            "<br>"
        );

        // Create Gmail transporter
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Send email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.BUSINESS_EMAIL,
            replyTo: email,
            subject: `New Website Enquiry - ${name}`,

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 650px;
                    margin: auto;
                    padding: 30px;
                    background: #f8f6f2;
                    color: #333;
                ">

                    <h1 style="color: #6b4423;">
                        New Website Enquiry
                    </h1>

                    <p>
                        A new enquiry has been submitted through
                        the Modjadji Projects website.
                    </p>

                    <hr>

                    <h2>Customer Details</h2>

                    <p>
                        <strong>Name:</strong>
                        ${safeName}
                    </p>

                    <p>
                        <strong>Email:</strong>
                        ${safeEmail}
                    </p>

                    <p>
                        <strong>Phone:</strong>
                        ${safePhone}
                    </p>

                    <p>
                        <strong>Service:</strong>
                        ${safeService}
                    </p>

                    <h2>Project Message</h2>

                    <p>
                        ${safeMessage}
                    </p>

                    <hr>

                    <p style="color: #777;">
                        Sent from the Modjadji Projects website.
                    </p>

                </div>
            `
        });

        console.log(
            `New enquiry received from ${name} (${email})`
        );

        return res.status(200).json({
            success: true,
            message: "Your request has been sent successfully."
        });

    } catch (error) {
        console.error("Email sending error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to send your request. Please try again."
        });
    }
}

module.exports = contactHandler;