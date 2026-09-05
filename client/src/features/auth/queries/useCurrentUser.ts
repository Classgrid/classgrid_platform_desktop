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

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type CurrentUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  organization_id?: string;
  [key: string]: any;
};

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      try {
        // Fallback for OAuth: Extract token from URL if it exists
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get("token");
        if (urlToken) {
          localStorage.setItem("token", urlToken);
          // Remove token from URL for security/cleanliness
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const res = await apiClient.get<CurrentUser | { user: CurrentUser; token?: string }>("/api/auth/me");
        
        // Save refreshed token from /api/auth/me response
        if ("token" in res.data && res.data.token) {
          localStorage.setItem("token", res.data.token);
        }

        const data = "user" in res.data ? res.data.user : res.data;
        if (data && !data._id && data.id) {
          data._id = data.id;
        }
        return data;
      } catch (err) {
        return null; // Not logged in
      }
    },
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  });
}
