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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { configApi } from "../services/superAdminApi";

export const HEALTH_KEY = ["super-admin", "health"] as const;
export const FEATURE_FLAGS_KEY = ["super-admin", "feature-flags"] as const;

export function useSystemHealth() {
  return useQuery({
    queryKey: HEALTH_KEY,
    queryFn: () => configApi.getHealth(),
    staleTime: 2_000,
    refetchInterval: 5_000,
  });
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: FEATURE_FLAGS_KEY,
    queryFn: () => configApi.getFeatureFlags(),
    staleTime: 60_000,
  });
}

export function useToggleFeatureFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, isEnabled }: { key: string; isEnabled: boolean }) =>
      configApi.toggleFeatureFlag(key, isEnabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: FEATURE_FLAGS_KEY }),
  });
}
