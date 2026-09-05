/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
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
