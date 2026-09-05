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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchFailedPayments, 
  fetchFailedPaymentDetail, 
  generatePaymentLink, 
  assignFailure, 
  addFailureNote, 
  resolveFailure,
  fetchFailureOverview,
  notifyFailureOrganization,
  exportFailureDiagnostic
} from '../../services/superAdminBillingApi';

export interface PaymentLinkPayload {
  amountPaise?: number;
  expiryHours?: number;
  sendEmail?: boolean;
}

export const useFailedPaymentsList = (filters: { status?: string } = {}) => {
  return useQuery({
    queryKey: ['billing-failed-payments', filters],
    queryFn: () => fetchFailedPayments(filters),
    staleTime: 60 * 1000,
    retry: 2,
  });
};

export const useFailureOverview = () => {
  return useQuery({
    queryKey: ['billing-failed-payments-overview'],
    queryFn: fetchFailureOverview,
    staleTime: 60 * 1000,
    retry: 2,
  });
};

export const useFailedPaymentDetail = (failureId: string) => {
  return useQuery({
    queryKey: ['billing-failed-payment-detail', failureId],
    queryFn: () => fetchFailedPaymentDetail(failureId),
    enabled: !!failureId,
    staleTime: 60 * 1000,
  });
};

export const useGeneratePaymentLink = (failureId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaymentLinkPayload) => generatePaymentLink(failureId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-failed-payment-detail', failureId] });
    },
  });
};

export const useAssignFailure = (failureId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { assigneeId: string }) => assignFailure(failureId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-failed-payment-detail', failureId] });
      queryClient.invalidateQueries({ queryKey: ['billing-failed-payments'] });
    },
  });
};

export const useAddFailureNote = (failureId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { note: string }) => addFailureNote(failureId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-failed-payment-detail', failureId] });
    },
  });
};

export const useResolveFailure = (failureId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { resolution: string }) => resolveFailure(failureId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-failed-payment-detail', failureId] });
      queryClient.invalidateQueries({ queryKey: ['billing-failed-payments'] });
    },
  });
};

export const useNotifyFailureOrganization = (failureId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { message: string }) => notifyFailureOrganization(failureId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-failed-payment-detail', failureId] });
    },
  });
};

export const useFailureDiagnosticExport = (failureId: string) => {
  return useMutation({
    mutationFn: (payload: { format: 'JSON'; includeRedactedPayload: boolean }) =>
      exportFailureDiagnostic(failureId, payload),
  });
};
