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

import { useEffect } from "react";

/**
 * DomainEnforcer component
 * 
 * Used to enforce custom domain redirects for students, faculty, and departments.
 * If the organization has disabled the Classgrid URL and they are accessing via 
 * *.classgrid.in, they will be forcibly redirected to their custom domain.
 * 
 * NOTE: This should NEVER wrap the Org Admin routes, providing an emergency admin access path.
 */
export function DomainEnforcer({
  allowClassgridUrl,
  isCustomDomainEnabled,
  customDomain,
  children
}: {
  allowClassgridUrl?: boolean;
  isCustomDomainEnabled?: boolean;
  customDomain?: string | null;
  children: React.ReactNode;
}) {
  useEffect(() => {
    // 🛡️ Emergency Admin Access
    // Never enforce custom domain redirects for the Org Admin portal.
    // This ensures IT Admins can always access the dashboard via the default Classgrid URL 
    // even if their DNS breaks or they accidentally disable the Classgrid URL.
    if (window.location.pathname.startsWith('/org/')) {
        return;
    }

    // Check if the current hostname is a classgrid domain
    const hostname = window.location.hostname;
    const isClassgridUrl = hostname.includes("classgrid.in");

    // If they have an active custom domain AND have disabled the Classgrid URL, enforce the redirect.
    if (isClassgridUrl && isCustomDomainEnabled !== false && customDomain && allowClassgridUrl === false) {
      console.log(`[Domain Enforcer] Custom domain active. Enforcing strict white-label redirect to: ${customDomain}`);
      // Preserve the path and query string when redirecting
      const targetUrl = `https://${customDomain}${window.location.pathname}${window.location.search}`;
      window.location.replace(targetUrl);
    }
  }, [isCustomDomainEnabled, customDomain, allowClassgridUrl]);

  return <>{children}</>;
}
