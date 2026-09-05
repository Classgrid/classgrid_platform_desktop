/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import { useQuery } from "@tanstack/react-query";
import { orgAdminBillingApi } from "../services/orgAdminBillingApi";

export function useOrgUsage(month?: number, year?: number) {
  return useQuery({
    queryKey: ["orgAdmin", "usage", month, year],
    queryFn: () => orgAdminBillingApi.getUsage({ month, year }),
  });
}

export function useOrgBilling() {
  return useQuery({
    queryKey: ["orgAdmin", "billing"],
    queryFn: () => orgAdminBillingApi.getBilling(),
  });
}
