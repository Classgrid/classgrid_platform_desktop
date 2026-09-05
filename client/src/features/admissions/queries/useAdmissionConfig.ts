/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdmissionConfig, updateAdmissionConfig, getMasterFieldPool, getMasterDocumentPool } from "../api";
import type { AdmissionConfig } from "../types";

export function useAdmissionConfig() {
  return useQuery<AdmissionConfig>({
    queryKey: ["admission-config"],
    queryFn: getAdmissionConfig,
  });
}

export function useUpdateAdmissionConfig() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, any>) => updateAdmissionConfig(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admission-config"] });
    },
  });
}

export function useMasterFieldPool() {
  return useQuery({
    queryKey: ["admission-master-field-pool"],
    queryFn: getMasterFieldPool,
  });
}

export function useMasterDocumentPool() {
  return useQuery({
    queryKey: ["admission-master-document-pool"],
    queryFn: getMasterDocumentPool,
  });
}
