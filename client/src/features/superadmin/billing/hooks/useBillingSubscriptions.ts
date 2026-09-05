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
import { fetchSubscriptions, fetchSubscriptionDetail, fetchPricingOverrides, setPricingOverride, previewProration, fetchSubscriptionOverview, assignSubscriptionPlan, addSubscriptionModule } from '../../services/superAdminBillingApi';

export const useSubscriptions = () => {
  return useQuery({
    queryKey: ['billing-subscriptions'],
    queryFn: fetchSubscriptions,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useSubscriptionOverview = () => {
  return useQuery({
    queryKey: ['billing-subscription-overview'],
    queryFn: fetchSubscriptionOverview,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useSubscriptionDetail = (orgId: string) => {
  return useQuery({
    queryKey: ['billing-subscription-detail', orgId],
    queryFn: () => fetchSubscriptionDetail(orgId),
    enabled: !!orgId,
    staleTime: 60 * 1000,
  });
};

export const usePricingOverrides = (orgId: string) => {
  return useQuery({
    queryKey: ['billing-pricing-overrides', orgId],
    queryFn: () => fetchPricingOverrides(orgId),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSetPricingOverride = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setPricingOverride,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['billing-pricing-overrides', variables.orgId] });
    },
  });
};

export const usePreviewProration = () => {
  return useMutation({
    mutationFn: (data: { orgId: string; newPlanId: string }) => previewProration(data.orgId, data.newPlanId),
  });
};

export const useAssignSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, billingPlanVersionId }: { orgId: string; billingPlanVersionId: string }) =>
      assignSubscriptionPlan(orgId, { billingPlanVersionId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['billing-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['billing-subscription-detail', variables.orgId] });
    },
  });
};

export const useAddSubscriptionModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, billingModuleVersionId }: { orgId: string; billingModuleVersionId: string }) =>
      addSubscriptionModule(orgId, { billingModuleVersionId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['billing-subscription-detail', variables.orgId] });
    },
  });
};
