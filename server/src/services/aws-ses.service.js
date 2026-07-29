import nodemailer from "nodemailer";

// ─────────────────────────────────────────────────
// AWS SES SMTP TRANSPORTER (STOCKHOLM REGION)
// ─────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.AWS_SES_SMTP_HOST || "email-smtp.eu-north-1.amazonaws.com",
  port: Number(process.env.AWS_SES_SMTP_PORT) || 587,
  secure: false, // TLS requires secureConnection to be false for port 587
  auth: {
    user: process.env.AWS_SES_SMTP_USER,
    pass: process.env.AWS_SES_SMTP_PASS,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error("❌ AWS SES SMTP error:", err.message);
  } else {
    console.log("✅ AWS SES SMTP ready (eu-north-1)");
  }
});

// ─────────────────────────────────────────────────
// SEND VIA AWS SES
// ─────────────────────────────────────────────────
export const sendEmail = async ({ to, subject, html, text, fromName, fromEmail, replyTo }) => {
  console.log(`[AWS SES] Sending to: ${to} | From: ${fromEmail}`);

  const defaultFromName = process.env.AWS_SES_DEFAULT_FROM_NAME || "Classgrid Platform";
  const defaultFromEmail = process.env.AWS_SES_DEFAULT_FROM_EMAIL || "support@classgrid.in";

  const info = await transporter.sendMail({
    from: `"${fromName || defaultFromName}" <${fromEmail || defaultFromEmail}>`,
    replyTo: replyTo || "support@classgrid.in",
    to,
    subject,
    text,
    html,
  });

  console.log(`[AWS SES] ✅ Email sent to: ${to} | ID: ${info.messageId}`);
  return { ...info, provider: "aws_ses" };
};
