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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgDetailApi, type OrgBillingRates } from "../services/superAdminApi";

export const orgDetailKey = (orgId: string) =>
  ["super-admin", "org-detail", orgId] as const;

/** Fetch full org detail: usage + subscription + billing rates */
export function useOrgDetail(orgId: string | undefined) {
  return useQuery({
    queryKey: orgDetailKey(orgId ?? ""),
    queryFn: () => orgDetailApi.getOrgDetail(orgId!),
    enabled: !!orgId,
    staleTime: 30_000,
    retry: 1,
  });
}

/** Save billing rates for this org — invalidates detail on success */
export function useSaveBillingRates(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rates: Partial<OrgBillingRates> & { plan?: string }) =>
      orgDetailApi.saveBillingRates(orgId, rates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgDetailKey(orgId) });
    },
  });
}

/** Create a Razorpay Order for Platform Subscription */
export function useCreateRazorpayOrder(orgId: string) {
  return useMutation({
    mutationFn: (amount: number) => orgDetailApi.createRazorpayOrder(orgId, amount),
  });
}

/** Verify Platform Subscription Payment */
export function useVerifyRazorpayPayment(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => orgDetailApi.verifyRazorpayPayment(orgId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgDetailKey(orgId) });
    },
  });
}
