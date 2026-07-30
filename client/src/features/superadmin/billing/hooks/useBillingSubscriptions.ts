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
