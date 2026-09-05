/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../services/superAdminApi";

export const DASHBOARD_OVERVIEW_KEY = ["super-admin", "dashboard-overview"] as const;

export function useDashboardOverview() {
  return useQuery({
    queryKey: DASHBOARD_OVERVIEW_KEY,
    queryFn: () => dashboardApi.getOverview(),
    staleTime: 60_000,
  });
}
