/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import nodemailer from "nodemailer";
import accessLogger from "../config/logger.js";
import NotificationTemplate from "../models/NotificationTemplate.js";
import NotificationLog from "../models/NotificationLog.js";
import Handlebars from "handlebars";
import { baseTemplate } from "./email-templates.service.js";

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
export const sendEmail = async ({ to, subject, html, text, fromName, fromEmail, replyTo, userId, organizationId, maxRetries = 3, attachments }) => {
  console.log(`[AWS SES] Sending to: ${to} | From: ${fromEmail || "default"}`);

  // Note: AWS SES is verified for the entire classgrid.in domain.
  // You can pass ANY address under @classgrid.in (e.g. billing@, admin@, etc.) in the 'fromEmail' parameter.
  // This default is only used if no specific fromEmail is provided.
  const defaultFromName = process.env.AWS_SES_DEFAULT_FROM_NAME || "Classgrid Platform";
  const defaultFromEmail = process.env.AWS_SES_DEFAULT_FROM_EMAIL || "support@classgrid.in";

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
          const info = await transporter.sendMail({
              from: `"${fromName || defaultFromName}" <${fromEmail || defaultFromEmail}>`,
              replyTo: replyTo || "support@classgrid.in",
              to,
              subject,
              text,
              html,
              attachments,
          });

          accessLogger.info(`[AWS SES] ✅ Email sent to: ${to} | ID: ${info.messageId} | Attempt: ${attempt}`, {
              provider: "aws_ses",
              to,
              messageId: info.messageId,
              attempt,
              ...(organizationId && { orgId: organizationId?.toString ? organizationId.toString() : organizationId }),
              ...(userId && { userId: userId?.toString ? userId.toString() : userId })
          });
          return { ...info, provider: "aws_ses", retryCount: attempt - 1 };
      } catch (error) {
          lastError = error;
          console.warn(`[AWS SES] ⚠️ Send failed (Attempt ${attempt}/${maxRetries}): ${error.message}`);
          if (attempt < maxRetries) {
              await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempt))); // Exponential backoff
          }
      }
  }

  accessLogger.error(`[AWS SES] ❌ Failed to send email after ${maxRetries} attempts: ${to}`, { error: lastError.message });
  throw lastError;
};

export const sendTemplateEmail = async ({ templateName, to, data, userId, organizationId, fromName, fromEmail, replyTo, idempotencyKey }) => {
    try {
        if (idempotencyKey) {
            const existingLog = await NotificationLog.findOne({ idempotencyKey, status: { $in: ["SENT", "DELIVERED"] } });
            if (existingLog) {
                console.log(`[AWS SES] Idempotency key ${idempotencyKey} already processed. Skipping.`);
                return { messageId: existingLog.providerMessageId, provider: "aws_ses", skipped: true };
            }
        }

        const template = await NotificationTemplate.findOne({ name: templateName, type: "EMAIL", isActive: true });
        if (!template) throw new Error(`Email template not found or inactive: ${templateName}`);

        if (template.requiredPlaceholders && template.requiredPlaceholders.length > 0) {
            const missing = template.requiredPlaceholders.filter(p => data[p] === undefined || data[p] === null);
            if (missing.length > 0) {
                throw new Error(`Missing required template placeholders: ${missing.join(", ")}`);
            }
        }

        const compiledSubject = Handlebars.compile(template.subject)(data || {});
        let compiledHtml = Handlebars.compile(template.htmlBody)(data || {});
        
        // Wrap the DB content in the Classgrid base template layout
        compiledHtml = baseTemplate({
            content: compiledHtml,
            title: compiledSubject
        });

        const compiledText = template.textBody ? Handlebars.compile(template.textBody)(data || {}) : undefined;

        const info = await sendEmail({
            to,
            subject: compiledSubject,
            html: compiledHtml,
            text: compiledText,
            fromName: fromName || template.fromName,
            fromEmail: fromEmail || template.fromEmail,
            replyTo,
            userId,
            organizationId
        });

        await NotificationLog.create({
            organizationId,
            userId,
            templateId: template._id,
            type: "EMAIL",
            recipient: to,
            status: "SENT",
            providerMessageId: info.messageId,
            metadata: data,
            idempotencyKey,
            retryCount: info.retryCount || 0
        });

        return info;
    } catch (error) {
        console.warn(`[AWS SES] Failed to send template email (${templateName}):`, error.message);
        await NotificationLog.create({
            organizationId,
            userId,
            type: "EMAIL",
            recipient: to,
            status: "FAILED",
            failureReason: error.message,
            metadata: { templateName, ...data },
            idempotencyKey
        });
        throw error;
    }
};
