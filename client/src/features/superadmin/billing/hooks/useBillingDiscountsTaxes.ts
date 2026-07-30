import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDiscounts, createDiscount, fetchTaxRules, createTaxRule, grantCredits } from '../../services/superAdminBillingApi';

export interface TaxRulePayload {
    name: string;
    ratePercent: number;
    country: string;
    state?: string;
    isActive: boolean;
}

export interface DiscountPayload {
    code: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    maxUses?: number;
    validUntil?: string;
}

export const useDiscounts = () => {
  return useQuery({
    queryKey: ['billing-discounts'],
    queryFn: fetchDiscounts,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

export const useCreateDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DiscountPayload) => createDiscount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-discounts'] });
    },
  });
};

export const useTaxRules = () => {
  return useQuery({
    queryKey: ['billing-tax-rules'],
    queryFn: fetchTaxRules,
    staleTime: 60 * 60 * 1000, // 1 hour (tax rules rarely change)
    retry: 3,
  });
};

export const useCreateTaxRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TaxRulePayload) => createTaxRule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-tax-rules'] });
    },
  });
};

export const useGrantCredits = (orgId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { amountPaise: number; reason: string }) => grantCredits(orgId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-organization-credits', orgId] });
    },
  });
};
