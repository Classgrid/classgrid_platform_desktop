import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDiscounts, createDiscount, fetchTaxRules, createTaxRule, grantCredits } from '../services/superAdminBillingApi';

export const useDiscounts = () => {
  return useQuery({
    queryKey: ['billing-discounts'],
    queryFn: fetchDiscounts,
  });
};

export const useCreateDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-discounts'] });
    },
  });
};

export const useTaxRules = () => {
  return useQuery({
    queryKey: ['billing-tax-rules'],
    queryFn: fetchTaxRules,
  });
};

export const useCreateTaxRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTaxRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-tax-rules'] });
    },
  });
};

export const useGrantCredits = (orgId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => grantCredits(orgId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-organization-credits', orgId] });
    },
  });
};
