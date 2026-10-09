// Public chat (chat.classgrid.in) accounts must finish sign-up — a verified WhatsApp number and age —
// before they can use the AI. ERP users, staff and impersonation sessions are never affected.

export const CHAT_PUBLIC_ORG_ID = "6ac4b95e0f8a97f45e98b0ff";

export function isPublicChatAccount(user) {
    if (!user) return false;
    const orgId = String(user.organization_id?._id || user.organization_id || "");
    // Older chat sign-ups were saved as "student" in the public org
    return orgId === CHAT_PUBLIC_ORG_ID && (user.role === "user" || user.role === "student");
}

export function needsChatOnboarding(user) {
    if (!isPublicChatAccount(user)) return false;
    if (String(user.email || "").toLowerCase().endsWith("@classgrid.in")) return false;
    const meta = user.metadata || {};
    return !meta.whatsappPhone || !meta.age;
}
