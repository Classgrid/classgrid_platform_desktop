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

import { useQuery } from "@tanstack/react-query";
import { getAdmissionAnalytics, getAdmissionAnalyticsScoped, getCETDashboard } from "../api";

export function useAdmissionAnalytics(params?: string | { hierarchy_id?: string; division?: string }) {
  return useQuery({
    queryKey: ["admission-analytics", params],
    queryFn: () => {
      if (!params || typeof params === "string") return getAdmissionAnalytics(params);
      return getAdmissionAnalyticsScoped(params);
    },
  });
}

export function useCETDashboard() {
  return useQuery({
    queryKey: ["cet-dashboard"],
    queryFn: getCETDashboard,
  });
}
