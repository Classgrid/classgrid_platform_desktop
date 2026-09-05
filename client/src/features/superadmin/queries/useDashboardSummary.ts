/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/apiClient";

type DashboardSummary = {
  totalOrganizations: number;
  totalFaculty: number;
  totalStudents: number;
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const response = await apiClient.get<DashboardSummary>("/api/admin/dashboard-summary");
      return response.data;
    },
    placeholderData: {
      totalOrganizations: 0,
      totalFaculty: 0,
      totalStudents: 0
    }
  });
}
