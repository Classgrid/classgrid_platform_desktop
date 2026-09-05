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

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

// ── QUERIES ─────────────────────────────────────────────────────────────

/**
 * Fetches the dynamic 4x2 strategy rules (which sections/documents are enabled)
 * for a specific organization.
 */
export function useGetAdmissionStrategy(orgId: string | undefined) {
  return useQuery({
    queryKey: ["public-admission-strategy", orgId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/public/admissions/strategy/${orgId}`);
      return res.data.data;
    },
    enabled: !!orgId,
    // The strategy rules rarely change, so we can cache them for a while
    staleTime: 1000 * 60 * 5, 
  });
}

// ── MUTATIONS ───────────────────────────────────────────────────────────

/**
 * Submits the massive multi-part admission application payload.
 * The payload can be a standard JSON object or a FormData object if it includes files.
 */
export function useSubmitApplication() {
  return useMutation({
    mutationFn: async (payload: any | FormData) => {
      // If the payload is FormData (contains files), axios will automatically
      // set the Content-Type to 'multipart/form-data'. If it's a standard JS
      // object, it will be 'application/json'.
      const res = await apiClient.post(`/api/public/admissions/apply`, payload);
      return res.data.data;
    },
  });
}
