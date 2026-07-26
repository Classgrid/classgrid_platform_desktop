import nodemailer from "nodemailer";
import {
  getOrgAdminInviteHtml,
  getOrgAdminActivatedHtml,
  getPasswordResetEmailHtml,
  getLoginNotificationHtml
} from "../src/services/email-templates.service.js";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const transporter = nodemailer.createTransport({
  host: process.env.AWS_SES_SMTP_HOST,
  port: Number(process.env.AWS_SES_SMTP_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.AWS_SES_SMTP_USER,
    pass: process.env.AWS_SES_SMTP_PASS,
  },
});

const toEmail = "nikhil.shinde@classgrid.in";
const fromEmail = "support@classgrid.in"; 

async function sendEmails() {
  try {
    console.log("Connecting to AWS SES (eu-north-1)...");
    await transporter.verify();
    console.log("Connection successful!");

    console.log("Sending Email 1: Admin Invite");
    await transporter.sendMail({
      from: `"Classgrid" <${fromEmail}>`,
      to: toEmail,
      subject: "AWS SES Test: Admin Invite",
      html: getOrgAdminInviteHtml("Nikhil", "Classgrid Demo", "https://classgrid.in/activate?token=test_token")
    });

    console.log("Sending Email 2: Admin Activated");
    await transporter.sendMail({
      from: `"Classgrid" <${fromEmail}>`,
      to: toEmail,
      subject: "AWS SES Test: Account Activated",
      html: getOrgAdminActivatedHtml("Nikhil", "https://classgrid.in/admin/dashboard", "https://classgrid.in/admin/login")
    });

    console.log("Sending Email 3: Password Reset");
    await transporter.sendMail({
      from: `"Classgrid" <${fromEmail}>`,
      to: toEmail,
      subject: "AWS SES Test: Password Reset",
      html: getPasswordResetEmailHtml("https://classgrid.in/reset-password?token=test_token")
    });

    console.log("Sending Email 4: Login Notification");
    await transporter.sendMail({
      from: `"Classgrid" <${fromEmail}>`,
      to: toEmail,
      subject: "AWS SES Test: Login Notification",
      html: getLoginNotificationHtml({ name: "Nikhil", email: toEmail }, "manual")
    });

    console.log("✅ All 4 emails sent successfully to nikhil.shinde@classgrid.in via AWS SES!");
  } catch (err) {
    console.error("❌ Error sending emails:", err);
  }
}

sendEmails();
