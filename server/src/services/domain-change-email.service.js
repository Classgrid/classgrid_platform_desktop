import { sendEmail } from "./aws-ses.service.js";

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
    const year = new Date().getFullYear();
    const formattedDate = formatDate(changedAt);
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333333; background-color: #ffffff; margin: 0; }
  .email-container { max-width: 600px; margin: 0 auto; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; }
  .table-row td { padding: 12px; border-bottom: 1px solid #dddddd; }
  .table-label { font-weight: bold; width: 35%; }
  .action-btn { display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px; margin-bottom: 10px; }
  .footer-text { font-size: 12px; color: #777777; }
  hr { border: 0; border-top: 1px solid #eeeeee; margin: 20px 0; }
  .note-box { padding: 15px; background-color: #fff3cd; border: 1px solid #ffe69c; color: #664d03; border-radius: 6px; margin: 15px 0; font-size: 14px; }

  @media (prefers-color-scheme: dark) {
    body { background-color: #111111; color: #e5e5e5; }
    .table-row td { border-bottom: 1px solid #333333; }
    .footer-text { color: #999999; }
    hr { border-top: 1px solid #333333; }
    .note-box { background-color: #332701; border-color: #664d03; color: #ffda6a; }
  }
</style>
</head>
<body>
<div class="email-container">
<h2 style="margin-top:0;">Hello ${escapeHtml(adminName || "Admin")},</h2>
<p>${escapeHtml(summary)}</p>

<table>
  ${Object.entries(details)
            .filter(([, value]) => value !== undefined && value !== null && value !== "")
            .map(([label, value]) => `
  <tr class="table-row">
    <td class="table-label">${escapeHtml(label)}</td>
    <td>${escapeHtml(value)}</td>
  </tr>`).join("")}
  <tr class="table-row">
    <td class="table-label">Changed at</td>
    <td>${escapeHtml(formattedDate)}</td>
  </tr>
</table>

${note ? `<div class="note-box">${escapeHtml(note)}</div>` : ""}

${actionUrl ? `<p><a href="${escapeHtml(actionUrl)}" class="action-btn">${escapeHtml(actionLabel || "Open Classgrid")}</a></p>` : ""}

<p>If you did not authorize this change, contact Classgrid support immediately.</p>
<a href="${escapeHtml(process.env.SUPPORT_URL || 'https://classgrid.in/support')}" class="action-btn" style="background-color: #333333; margin-top: 5px;">Open Support Portal</a>
<br/>
<p>Regards,<br><strong>The Classgrid Team</strong></p>
<hr/>
<p class="footer-text">&copy; ${year} Classgrid. This security notification was sent because a domain setting changed on your organization account.</p>
</div>
</body>
</html>`;
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
    const year = new Date().getFullYear();
    const formattedDate = formatDate(data.changedAt);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(data.copy.title)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333333; background-color: #ffffff; margin: 0; }
  .email-container { max-width: 600px; margin: 0 auto; }
  h2 { margin-top: 0; font-size: 20px; }
  h3 { font-size: 16px; margin-top: 25px; margin-bottom: 15px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #dddddd; }
  .table-row td { padding: 12px; border-bottom: 1px solid #dddddd; }
  .table-label { font-weight: bold; width: 35%; background-color: #f9f9f9; }
  .action-btn { display: inline-block; padding: 10px 20px; background-color: #000000; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-bottom: 20px; }
  .support-btn { display: inline-block; padding: 10px 20px; border: 1px solid #dddddd; color: #333333 !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-bottom: 20px; }
  .footer-text { font-size: 12px; color: #777777; }
  hr { border: 0; border-top: 1px solid #eeeeee; margin: 25px 0; }
  ul.checklist { list-style: none; padding: 0; margin: 0 0 20px 0; }
  ul.checklist li { margin-bottom: 8px; font-weight: 500; }
  code { background-color: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-size: 13px; color: #d63384; }

  @media (prefers-color-scheme: dark) {
    body { background-color: #111111; color: #e5e5e5; }
    table { border: 1px solid #333333; }
    .table-row td { border-bottom: 1px solid #333333; }
    .table-label { background-color: #1a1a1a; }
    .action-btn { background-color: #ffffff; color: #000000 !important; }
    .support-btn { border: 1px solid #444444; color: #eeeeee !important; }
    .footer-text { color: #999999; }
    hr { border-top: 1px solid #333333; }
    code { background-color: #222222; color: #ff85c0; }
  }
</style>
</head>
<body>
<div class="email-container">
<h2>Hello <strong>${escapeHtml(data.adminName)}</strong>,</h2>
<p>${data.copy.summary}</p>
${data.action === 'verified' ? '<p>Classgrid confirmed ownership of the domain, validated the required DNS records, provisioned a secure HTTPS certificate, and enabled the domain for your organization.</p>' : ''}

<hr/>

<h3>Custom Domain Details</h3>
<table>
  ${Object.entries(data.details).filter(([, val]) => val !== undefined && val !== null && val !== "").map(([label, val]) => `
  <tr class="table-row">
    <td class="table-label">${escapeHtml(label)}</td>
    <td>${val}</td>
  </tr>`).join('')}
  <tr class="table-row">
    <td class="table-label">Verified At</td>
    <td>${escapeHtml(formattedDate)}</td>
  </tr>
</table>

<hr/>

${data.copy.showURL && data.newDomain ? `
<h3>What changed?</h3>
<p>Your organization will now use the following URL to access Classgrid:</p>
<p style="font-size: 16px; font-weight: bold;"><a href="https://${escapeHtml(data.newDomain)}" style="color: #007bff; text-decoration: none;">https://${escapeHtml(data.newDomain)}</a></p>
<p>The default Classgrid login URL has been updated based on your domain settings.</p>
<hr/>
` : ''}

${data.copy.checklist.length > 0 ? `
<h3>Verification completed</h3>
<ul class="checklist">
  ${data.copy.checklist.map(item => `<li>&#10003; ${escapeHtml(item)}</li>`).join('')}
</ul>
<hr/>
` : ''}

<h3>Review Custom Domain</h3>
<p>You can review your domain configuration at any time from the Organization Settings dashboard.</p>
<a href="${escapeHtml(data.actionUrl)}" class="action-btn">${escapeHtml(data.copy.actionBtn)}</a>

<hr/>

<h3>Didn't make this change?</h3>
<p>If you did not authorize this update, contact the Classgrid Support team immediately. We recommend reviewing your organization administrators and DNS configuration to secure your account.</p>

<hr/>

<h3>Need assistance?</h3>
<p>Our support team is available to help with DNS configuration, SSL certificates, and custom domain setup.</p>
<a href="${escapeHtml(process.env.SUPPORT_URL || 'https://classgrid.in/support')}" class="support-btn">Open Support Portal</a>

<hr/>

<p>Regards,<br><strong>The Classgrid Team</strong></p>
<br/>
<p class="footer-text">&copy; ${year} Classgrid. All rights reserved.</p>
<p class="footer-text">This security notification was sent because the custom domain settings for your organization were updated. This email cannot be unsubscribed from because it contains important account and security information.</p>
</div>
</body>
</html>`;
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
