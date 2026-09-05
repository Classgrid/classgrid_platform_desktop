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

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
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
