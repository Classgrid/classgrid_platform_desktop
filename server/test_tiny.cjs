const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const nodemailer = require("nodemailer");

async function run() {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.AWS_SES_SMTP_HOST,
            port: Number(process.env.AWS_SES_SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.AWS_SES_SMTP_USER,
                pass: process.env.AWS_SES_SMTP_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: '"Classgrid System" <support@classgrid.in>',
            to: "nikhilsubsun123@gmail.com",
            subject: "Tiny Test",
            text: "This is a tiny test.",
        });
        
        console.log("Tiny email sent successfully! ID:", info.messageId);
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
