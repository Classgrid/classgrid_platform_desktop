import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSubscriptions, fetchSubscriptionDetail, fetchPricingOverrides, setPricingOverride, previewProration } from '../services/superAdminBillingApi';

export const useSubscriptions = () => {
  return useQuery({
    queryKey: ['billing-subscriptions'],
    queryFn: fetchSubscriptions,
  });
};

export const useSubscriptionDetail = (orgId: string) => {
  return useQuery({
    queryKey: ['billing-subscription-detail', orgId],
    queryFn: () => fetchSubscriptionDetail(orgId),
    enabled: !!orgId,
  });
};

export const usePricingOverrides = (orgId: string) => {
  return useQuery({
    queryKey: ['billing-pricing-overrides', orgId],
    queryFn: () => fetchPricingOverrides(orgId),
    enabled: !!orgId,
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
