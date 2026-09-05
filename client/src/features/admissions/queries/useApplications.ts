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

import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getApplications,
  getApplicationById,
  updateApplicationStage,
  bulkVerifyApplications,
  bulkSelectApplications,
} from "../api";

type ApplicationsParams = {
  status?: string;
  hierarchy_id?: string;
  division?: string;
  page?: number;
  limit?: number;
  search?: string;
};

export function useApplications(params: ApplicationsParams = {}) {
  return useQuery({
    queryKey: ["admission-applications", params],
    queryFn: () => getApplications(params),
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: ["admission-application", id],
    queryFn: () => getApplicationById(id),
    enabled: !!id,
  });
}

export function useUpdateStage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, comment }: { id: string; status: string; comment?: string }) =>
      updateApplicationStage(id, { status, comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admission-applications"] });
      qc.invalidateQueries({ queryKey: ["admission-analytics"] });
    },
  });
}

export function useBulkVerify() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, comment }: { ids: string[]; comment?: string }) =>
      bulkVerifyApplications(ids, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admission-applications"] });
      qc.invalidateQueries({ queryKey: ["admission-analytics"] });
    },
  });
}

export function useBulkSelect() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, comment }: { ids: string[]; comment?: string }) =>
      bulkSelectApplications(ids, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admission-applications"] });
      qc.invalidateQueries({ queryKey: ["admission-analytics"] });
    },
  });
}
