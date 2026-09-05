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

export type AuthType = "platform" | "institution";

export type LeftPanelVariant = "image" | "default";

export type AuthAudience = "user" | "admin" | "super_admin";

export type AuthUserRole = "student" | "teacher";

export type InstitutionAdminRole =
  | "org_admin"
  | "library_manager"
  | "library_admin"
  | "attendance_admin"
  | "hr_dept"
  | "hostel_dept"
  | "hod"
  | "principal"
  | "vice_principal"
  | "exam_controller"
  | "fee_manager"
  | "admission_head"
  | "admission_verifier"
  | "admission_counselor"
  | "admission_clerk"
  | "tpo_officer"
  | "transport_manager"
  | "counselor"
  | "coordinator";

export type AuthLoginRole = AuthUserRole | InstitutionAdminRole | "super_admin";

export type AuthIntent = "student" | "teacher" | "admin" | "super_admin";

export type AuthBranding = {
  authType: AuthType;
  name: string;
  shortName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl?: string;
  campusImageUrl: string;
  leftVariant: LeftPanelVariant;
  subdomain: string;
  siteTitle?: string;
  customDomain?: string | null;
  marketingDomain?: string | null;
  allowClassgridUrl?: boolean;
  isCustomDomainEnabled?: boolean;
  socialLinks?: {
    instagram_url?: string;
    youtube_url?: string;
    facebook_url?: string;
    linkedin_url?: string;
    twitter_url?: string;
    github_url?: string;
    website_url?: string;
  };
};

export type AuthBrandingResponse = {
  success: boolean;
  branding: AuthBranding;
};

export type LoginResponse = {
  message: string;
  firstLogin?: boolean;
  mustResetPassword?: boolean;
  needsOrgCode?: boolean;
  needsDeviceOtp?: boolean;
  retryAfterSeconds?: number;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    organization_id?: string | null;
  };
  organization?: {
    name: string;
    logo?: string;
    subdomain?: string;
  } | null;
};
