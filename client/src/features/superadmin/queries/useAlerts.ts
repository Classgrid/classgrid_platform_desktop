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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "../services/superAdminApi";

export const ERROR_LOGS_KEY = ["super-admin", "error-logs"] as const;
export const EMAIL_LOGS_KEY = ["super-admin", "email-logs"] as const;

export function useErrorLogs(intervalMs: number = 60_000, search?: string, level?: string, category?: string, traceId?: string) {
  return useQuery({
    queryKey: [...ERROR_LOGS_KEY, search, level, category, traceId],
    queryFn: () => alertsApi.getErrorLogs({ search, level, category, traceId }),
    staleTime: 5_000,
    refetchInterval: intervalMs > 0 ? intervalMs : false,
  });
}

export function useEmailLogs() {
  return useQuery({
    queryKey: EMAIL_LOGS_KEY,
    queryFn: () => alertsApi.getEmailLogs(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useResendEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => alertsApi.resendEmail(jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMAIL_LOGS_KEY }),
  });
}
