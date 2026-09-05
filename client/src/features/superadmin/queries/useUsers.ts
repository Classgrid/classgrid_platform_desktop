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
import { usersApi } from "../services/superAdminApi";

export const ALL_USERS_KEY = ["super-admin", "all-users"] as const;

export function useAllUsers() {
  return useQuery({
    queryKey: ALL_USERS_KEY,
    queryFn: () => usersApi.getAllUsers(),
    staleTime: 60_000,
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.suspendUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ALL_USERS_KEY }),
  });
}

export function useReactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.reactivateUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ALL_USERS_KEY }),
  });
}

export function useImpersonateUser() {
  return useMutation({
    mutationFn: (id: string) => usersApi.impersonateUser(id),
    onSuccess: (data) => {
      window.location.href = "/work";
    },
    onError: (error: any) => {
      alert(error?.message || "Failed to impersonate user.");
    }
  });
}
