const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const nodemailer = require("nodemailer");

async function run() {
    console.log("Testing AWS SES SMTP connection...");
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.AWS_SES_SMTP_HOST || "email-smtp.eu-north-1.amazonaws.com",
            port: Number(process.env.AWS_SES_SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.AWS_SES_SMTP_USER,
                pass: process.env.AWS_SES_SMTP_PASS,
            },
        });

        await transporter.verify();
        console.log("AWS SES SMTP Connection Verified!");

        console.log("Attempting to send direct test email...");
        const info = await transporter.sendMail({
            from: '"Classgrid System" <support@classgrid.in>',
            to: "nikhilsubsun123@gmail.com",
            subject: "Classgrid Direct AWS Test",
            text: "This is a direct test of the AWS SES SMTP system.",
            html: "<p>This is a direct test of the AWS SES SMTP system.</p>",
        });
        
        console.log("Email Sent Successfully!", info);
    } catch (e) {
        console.error("AWS SES Error:", e);
    }
}
run();
