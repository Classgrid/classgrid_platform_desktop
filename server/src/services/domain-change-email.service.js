import { sendEmail } from "./aws-ses.service.js";
import { baseTemplate } from "./email-templates.service.js";

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatDate(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "Not available";
    return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

// ============================================================================
// STANDARD CLASSGRID DOMAIN CHANGES (org.classgrid.in)
// ============================================================================

function buildNotificationHtml({ title, orgName, adminName, summary, details, actionUrl, actionLabel, note, changedAt }) {
    const formattedDate = formatDate(changedAt);
    
    // Build the details block
    const detailsHtml = Object.entries(details)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([label, value]) => `
            <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #111111; width: 40%; vertical-align: top;">${escapeHtml(label)}</td>
                <td style="padding: 8px 0; color: #374151; vertical-align: top;">${escapeHtml(value)}</td>
            </tr>
        `).join("");

    const content = `
        <h2 style="color: #111111; margin-top: 0;">Hello ${escapeHtml(adminName || "Admin")},</h2>
        <p style="font-size: 15px; color: #374151;">${escapeHtml(summary)}</p>
        
        <div class="box" style="margin: 24px 0; padding: 20px; background-color: #f9f9f9; border: 1px solid #eaeaea; border-radius: 8px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                ${detailsHtml}
                <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #111111; width: 40%; vertical-align: top;">Changed at</td>
                    <td style="padding: 8px 0; color: #374151; vertical-align: top;">${escapeHtml(formattedDate)}</td>
                </tr>
            </table>
        </div>

        ${note ? `<div class="box" style="margin: 24px 0; padding: 16px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;"><p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Important:</strong> ${escapeHtml(note)}</p></div>` : ""}

        ${actionUrl ? `<div style="margin: 32px 0;"><a href="${escapeHtml(actionUrl)}" class="btn" style="background-color: #111111; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${escapeHtml(actionLabel || "Open Classgrid")}</a></div>` : ""}

        <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">If you did not authorize this change, contact Classgrid support immediately.</p>
        <p style="font-size: 14px; color: #6b7280;"><a href="https://classgrid.in/support" style="color: #111111; text-decoration: underline;">Open Support Portal</a></p>
    `;

    return baseTemplate({
        title: escapeHtml(title),
        content,
        ignoreText: "This security notification was sent because a domain setting changed on your organization account."
    });
}

function buildNotificationText({ title, orgName, adminName, summary, details, actionUrl, note, changedAt }) {
    const rows = Object.entries({ ...details, "Changed at": formatDate(changedAt) })
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([label, value]) => `${label}: ${value}`);

    return [
        title,
        "",
        `Hello ${adminName || "Admin"},`,
        "",
        summary,
        "",
        `Organization: ${orgName}`,
        ...rows,
        note ? `\nImportant: ${note}` : "",
        actionUrl ? `\nOpen Classgrid: ${actionUrl}` : "",
        "",
        "If you did not authorize this change, contact Classgrid support immediately.",
        `Need assistance? Open Support Portal: ${process.env.SUPPORT_URL || 'https://classgrid.in/support'}`,
        "",
        "Regards,",
        "The Classgrid Team",
    ].filter(Boolean).join("\n");
}

async function queueDomainEmail({ to, subject, template, organizationId, userId }) {
    if (!to) return { queued: false, reason: "missing_admin_email" };

    const job = await sendEmail({
        to,
        subject,
        html: buildNotificationHtml(template),
        text: buildNotificationText(template),
        type: "domain_change",
        channel: "notification",
        userId: userId || null,
        organizationId: organizationId || null,
    });

    return { queued: Boolean(job), jobId: job?._id || null };
}

export async function notifyDomainChange({
    to,
    orgName,
    adminName,
    adminEmail,
    oldDomain,
    newDomain,
    organizationId,
    userId,
}) {
    const oldHost = oldDomain && oldDomain !== "none" ? `${oldDomain}.classgrid.in` : "Not previously assigned";
    const newHost = `${newDomain}.classgrid.in`;
    const actionUrl = `https://${newHost}/org/login`;
    const template = {
        title: "Classgrid organization URL changed",
        orgName,
        adminName,
        summary: "Your Classgrid organization URL has changed. The new URL is active immediately.",
        details: {
            "Old URL": oldHost,
            "New URL": newHost,
            "Administrator": adminEmail,
        },
        actionUrl,
        actionLabel: "Open admin login",
        note: oldDomain && oldDomain !== "none"
            ? `The old URL no longer points to this organization. Update bookmarks and shared links. The old name is not described as permanently reserved and may be available under platform rules.`
            : "Share the new URL only with people who should access this organization.",
        changedAt: new Date(),
    };

    return queueDomainEmail({
        to,
        subject: `Classgrid organization URL changed to ${newHost}`,
        template,
        organizationId,
        userId,
    });
}

// ============================================================================
// CUSTOM DOMAIN CHANGES (erp.custom.com)
// ============================================================================

// The copy is now built dynamically inside notifyExternalDomainChange based on domainType

export function buildCustomDomainHtml(data) {
    const formattedDate = formatDate(data.changedAt);

    // Build the details block
    const detailsHtml = Object.entries(data.details)
        .filter(([, val]) => val !== undefined && val !== null && val !== "")
        .map(([label, val]) => `
            <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #111111; width: 40%; vertical-align: top;">${escapeHtml(label)}</td>
                <td style="padding: 8px 0; color: #374151; vertical-align: top;">${escapeHtml(val)}</td>
            </tr>
        `).join("");

    const content = `
        <h2 style="color: #111111; margin-top: 0;">Hello ${escapeHtml(data.adminName || "Admin")},</h2>
        <p style="font-size: 15px; color: #374151;">${escapeHtml(data.copy.summary)}</p>
        
        ${data.action === 'verified' ? '<p style="font-size: 15px; color: #374151;">Classgrid confirmed ownership of the domain, validated the required DNS records, provisioned a secure HTTPS certificate, and enabled the domain for your organization.</p>' : ''}
        
        <h3 style="color: #111111; margin-top: 32px; font-size: 16px;">Custom Domain Details</h3>
        <div class="box" style="margin: 16px 0 24px; padding: 20px; background-color: #f9f9f9; border: 1px solid #eaeaea; border-radius: 8px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                ${detailsHtml}
                <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #111111; width: 40%; vertical-align: top;">Verified At</td>
                    <td style="padding: 8px 0; color: #374151; vertical-align: top;">${escapeHtml(formattedDate)}</td>
                </tr>
            </table>
        </div>

        ${data.copy.showURL && data.newDomain ? `
        <div class="box" style="margin: 24px 0; padding: 20px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
            <p style="margin: 0 0 8px; font-weight: 600; color: #111111;">What changed?</p>
            <p style="margin: 0 0 12px; color: #374151; font-size: 14px;">Your organization will now use the following URL to access Classgrid:</p>
            <p style="margin: 0; font-size: 16px; font-weight: bold;"><a href="https://${escapeHtml(data.newDomain)}" style="color: #16a34a; text-decoration: none;">https://${escapeHtml(data.newDomain)}</a></p>
        </div>
        ` : ''}

        ${data.copy.checklist.length > 0 ? `
        <h3 style="color: #111111; margin-top: 32px; font-size: 16px;">Verification completed</h3>
        <ul style="margin: 16px 0 24px 20px; padding: 0; color: #374151; font-size: 14px;">
          ${data.copy.checklist.map(item => `<li style="margin-bottom: 8px; font-weight: 500;">${escapeHtml(item)}</li>`).join('')}
        </ul>
        ` : ''}

        <div style="margin: 32px 0;">
            <a href="${escapeHtml(data.actionUrl)}" class="btn" style="background-color: #111111; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${escapeHtml(data.copy.actionBtn)}</a>
        </div>

        <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">If you did not authorize this change, contact Classgrid support immediately.</p>
        <p style="font-size: 14px; color: #6b7280;"><a href="https://classgrid.in/support" style="color: #111111; text-decoration: underline;">Open Support Portal</a></p>
    `;

    return baseTemplate({
        title: escapeHtml(data.copy.title),
        content,
        ignoreText: "This security notification was sent because a custom domain setting changed on your organization account."
    });
}

export function buildCustomDomainText(data) {
    return [
        data.copy.title,
        "",
        `Hello ${data.adminName},`,
        "",
        data.copy.summary.replace(/<[^>]+>/g, ''),
        "",
        "Custom Domain Details:",
        ...Object.entries(data.details)
            .filter(([, val]) => val !== undefined && val !== null && val !== "")
            .map(([label, val]) => `- ${label}: ${String(val).replace(/<[^>]+>/g, '')}`),
        `- Verified At: ${formatDate(data.changedAt)}`,
        "",
        data.copy.showURL && data.newDomain ? `New URL: https://${data.newDomain}\n` : "",
        data.copy.checklist.length > 0 ? "Verification completed:\n" + data.copy.checklist.map(item => `✓ ${item}`).join('\n') + "\n" : "",
        `Review Domain here: ${data.actionUrl}`,
        "",
        `Need assistance? Open Support Portal: ${process.env.SUPPORT_URL || 'https://classgrid.in/support'}`,
        "",
        "Regards,",
        "The Classgrid Team",
    ].filter(Boolean).join("\n");
}

export async function notifyExternalDomainChange({
    to,
    orgName,
    adminName,
    adminEmail,
    action,
    domainType,
    oldDomain,
    newDomain,
    oldSettings,
    newSettings,
    brandingReset = false,
    organizationId,
    userId,
}) {
    const typeLabel = domainType === "erp_domain" ? "ERP login domain" : "Public website domain";
    const activeDomain = newDomain || oldDomain;
    const actionUrl = newDomain ? `https://${newDomain}${domainType === "erp_domain" ? "/org/login" : ""}` : "https://classgrid.in";

    let copy = {};
    const domainText = `<strong>${escapeHtml(typeLabel)}</strong> (<code>${escapeHtml(activeDomain)}</code>)`;

    switch (action) {
        case "registered":
            copy = {
                title: `${typeLabel} registered`,
                summary: `Your organization's ${domainText} has been registered and now requires DNS verification.`,
                actionBtn: `Review ${typeLabel}`,
                checklist: [],
                showURL: false
            };
            break;
        case "changed":
            copy = {
                title: `${typeLabel} changed`,
                summary: `Your organization's ${domainText} was changed. The replacement domain must be verified before it becomes active.`,
                actionBtn: `Review ${typeLabel}`,
                checklist: [],
                showURL: false
            };
            break;
        case "verified":
            copy = {
                title: `${typeLabel} verified`,
                summary: `Your organization's ${domainText} has been successfully verified and is now active.`,
                actionBtn: `Review ${typeLabel}`,
                checklist: [
                    "Domain ownership verified",
                    "DNS routing validated",
                    "HTTPS certificate issued",
                    "Secure login activated",
                    "Organization routing updated",
                    "Default login URL disabled"
                ],
                showURL: true
            };
            break;
        case "settings_updated":
            copy = {
                title: `${typeLabel} access changed`,
                summary: `Access settings for your organization's ${domainText} were updated.`,
                actionBtn: `Review ${typeLabel}`,
                checklist: [],
                showURL: false
            };
            break;
        case "removed":
            copy = {
                title: `${typeLabel} removed`,
                summary: `Your organization's ${domainText} was removed from Classgrid.`,
                actionBtn: "Open Classgrid",
                checklist: [],
                showURL: false
            };
            break;
        default:
            copy = {
                title: `${typeLabel} updated`,
                summary: `Settings for your organization's ${domainText} were updated.`,
                actionBtn: "Open Classgrid",
                checklist: [],
                showURL: false
            };
    }

    const settingsSummary = (settings) => {
        if (!settings) return undefined;
        if (settings.is_enabled) {
            if (settings.allow_classgrid_url) {
                return `<code>${escapeHtml(activeDomain)}</code> AND Default Classgrid URL`;
            } else {
                return `<code>${escapeHtml(activeDomain)}</code> ONLY (Default URL disabled)`;
            }
        } else {
            return `Default Classgrid URL ONLY (<code>${escapeHtml(activeDomain)}</code> disabled)`;
        }
    };

    const data = {
        action,
        copy,
        orgName,
        adminName,
        newDomain,
        oldDomain,
        actionUrl,
        changedAt: new Date(),
        details: {
            "Organization": orgName,
            "Domain Type": domainType === "erp_domain" ? "ERP Login Domain" : "Public Website Domain",
            "Domain": action === "changed" && oldDomain && oldDomain !== newDomain
                ? `<code>${escapeHtml(newDomain)}</code> (was <code>${escapeHtml(oldDomain)}</code>)`
                : `<code>${escapeHtml(activeDomain)}</code>`,
            "Access Status": settingsSummary(newSettings),
            "Administrator": `<a href="mailto:${escapeHtml(adminEmail)}" style="color:#007bff;text-decoration:none;">${escapeHtml(adminEmail)}</a>`
        }
    };

    // Add specific statuses based on action type
    if (action === 'verified') {
        data.details["Verification Status"] = "✅ Verified";
        data.details["SSL/TLS Status"] = "✅ Active";
        data.details["DNS Status"] = "Ownership & routing records validated";
    } else if (action === 'registered' || action === 'changed') {
        data.details["Verification Status"] = "⏳ Pending Verification (Action Required)";
        data.details["SSL/TLS Status"] = "⏳ Pending DNS Validation";
    }

    if (!to) return { queued: false, reason: "missing_admin_email" };

    const subject = `${copy.title}: ${activeDomain || typeLabel}`;
    await sendEmail({
        to,
        subject,
        html: buildCustomDomainHtml(data),
        text: buildCustomDomainText(data),
        type: "domain_change",
        channel: "notification",
        userId: userId || null,
        organizationId: organizationId || null,
    });

    return { queued: true };
}
