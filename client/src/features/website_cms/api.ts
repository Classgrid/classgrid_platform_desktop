/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

import { apiClient } from "@/lib/apiClient";

export type WebsiteCMSPageKey = "home" | "about" | "admissions" | "facilities" | "contact";
export type WebsiteCMSPageStatus = "published" | "draft";

export type WebsiteCMSStoredPage = {
  html?: string;
  status?: WebsiteCMSPageStatus;
  updatedAt?: string;
};

export type OrgWebsiteContent = {
  _id?: string;
  organization_id?: string;
  org_slug?: string;
  isPublished?: boolean;
  updatedAt?: string;
  pages?: Partial<Record<WebsiteCMSPageKey, WebsiteCMSStoredPage>>;
  institution?: {
    name?: string;
    shortName?: string;
    type?: string;
    tagline?: string;
    location?: string;
    address?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
  };
  hero?: {
    badge?: string;
    headline?: string;
    subHeadline?: string;
    description?: string;
  };
  principal?: {
    name?: string;
    designation?: string;
    message?: string;
  };
  story?: string;
  vision?: string;
  mission?: string;
  admissionBanner?: {
    title?: string;
    description?: string;
    ctaLabel?: string;
  };
  programs?: Array<{
    name?: string;
    description?: string;
    duration?: string;
    eligibility?: string;
    intake?: string;
  }>;
  infrastructure?: Array<{
    category?: string;
    name?: string;
    description?: string;
  }>;
  contactPage?: {
    officeHours?: string;
    mapEmbedUrl?: string;
  };
};

type OrgWebsiteContentResponse = {
  success: boolean;
  message?: string;
  data?: OrgWebsiteContent;
};

export type OrgWebsiteUpdatePayload = Record<string, unknown>;

export async function fetchOrgWebsiteContent() {
  const response = await apiClient.get<OrgWebsiteContentResponse>("/api/org-website/my-content");
  return response.data.data ?? null;
}

export async function setupOrgWebsiteContent(payload = {}) {
  const response = await apiClient.post<OrgWebsiteContentResponse>("/api/org-website/setup", payload);
  return response.data.data ?? null;
}

export async function updateOrgWebsiteContent(payload: OrgWebsiteUpdatePayload) {
  const response = await apiClient.patch<OrgWebsiteContentResponse>("/api/org-website/update", payload);
  return response.data.data ?? null;
}