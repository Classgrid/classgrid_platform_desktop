/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import { useQuery } from "@tanstack/react-query";
import { auditApi } from "../services/superAdminApi";

export const AUDIT_KEY = ["super-admin", "audit"] as const;

export function useAuditData(startDate: string, endDate: string, criteria?: string) {
  return useQuery({
    queryKey: [...AUDIT_KEY, startDate, endDate, criteria],
    queryFn: () => auditApi.getAuditData(startDate, endDate, criteria),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(startDate && endDate),
  });
}
