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

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

import type { LucideIcon } from "lucide-react";

export type DashboardRole =
  | "super_admin"
  | "org_admin"
  | "admission_dept"
  | "fees_dept"
  | "exam_dept"
  | "library_dept"
  | "attendance_dept"
  | "hr_dept"
  | "hostel_dept"
  | "faculty"
  | "student";

export type SidebarItem = {
  label: string;
  to: string;
  icon?: LucideIcon;
  badge?: number;
  restrictedToEmail?: string;
  hasNestedNav?: boolean;
};

export type SidebarSection = {
  label?: string;
  items: SidebarItem[];
};

export type DashboardIdentity = {
  name: string;
  subtitle: string;
  email?: string;
  cardTitle?: string;
  cardSubtitle?: string;
  menuItems?: DashboardMenuItem[];
};

export type ModuleSwitcherItem = {
  label: string;
  id: string;
  icon?: LucideIcon;
};

export type DashboardMenuItem = {
  label: string;
  icon: LucideIcon;
  to?: string;
  dividerBefore?: boolean;
};

export type DashboardConfig = {
  role: DashboardRole;
  logo: string;
  brandIcon?: LucideIcon;
  subtitle?: string;
  mobileMode?: "responsive" | "desktop-only";
  switcher?: {
    current: ModuleSwitcherItem;
    items: ModuleSwitcherItem[];
    subtext?: string;
  };
  sections: SidebarSection[];
  identity: DashboardIdentity;
};
