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
import { orgAdminMembersApi } from "../services/orgAdminMembersApi";

export const useOrgRoles = () => {
  return useQuery({
    queryKey: ["orgAdmin", "roles"],
    queryFn: () => orgAdminMembersApi.fetchRoles(),
  });
};

export const useMembers = (params?: { search?: string; role?: string }) => {
  return useQuery({
    queryKey: ["orgAdmin", "members", params],
    queryFn: () => orgAdminMembersApi.fetchMembers(params),
  });
};

export const usePendingMembers = () => {
  return useQuery({
    queryKey: ["orgAdmin", "pendingMembers"],
    queryFn: () => orgAdminMembersApi.fetchPendingMembers(),
  });
};

export const useInviteStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: orgAdminMembersApi.inviteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgAdmin", "members"] });
      queryClient.invalidateQueries({ queryKey: ["orgAdmin", "pendingMembers"] });
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: orgAdminMembersApi.removeMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgAdmin", "members"] });
    },
  });
};

export const useResendInvite = () => {
  return useMutation({
    mutationFn: orgAdminMembersApi.resendInvite,
  });
};
