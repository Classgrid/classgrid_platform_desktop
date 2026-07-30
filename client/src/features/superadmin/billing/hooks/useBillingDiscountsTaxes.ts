import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDiscounts, createDiscount, fetchTaxRules, createTaxRule, fetchTaxRuleVersions, createTaxRuleVersion, fetchCreditAccount, grantCredits } from '../../services/superAdminBillingApi';

export interface TaxRulePayload {
    name: string;
    code: string;
    taxPercentage: number;
    placeOfSupplyLogic: 'INTRA_STATE' | 'INTER_STATE' | 'INTERNATIONAL';
}

export interface DiscountPayload {
    name: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    amountPaise?: number;
    percentage?: number;
    validFrom: string;
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
    mutationFn: async (payload: TaxRulePayload) => {
      const rule = await createTaxRule({ name: payload.name, code: payload.code });
      const isInterState = payload.placeOfSupplyLogic === 'INTER_STATE';
      const isIntraState = payload.placeOfSupplyLogic === 'INTRA_STATE';
      return createTaxRuleVersion(rule._id, {
        taxPercentage: payload.taxPercentage,
        igstPercentage: isInterState ? payload.taxPercentage : 0,
        cgstPercentage: isIntraState ? payload.taxPercentage / 2 : 0,
        sgstPercentage: isIntraState ? payload.taxPercentage / 2 : 0,
        placeOfSupplyLogic: payload.placeOfSupplyLogic,
        effectiveFrom: new Date().toISOString(),
      });
    },
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

export const useCreditAccount = (orgId: string) => {
  return useQuery({
    queryKey: ['billing-organization-credits', orgId],
    queryFn: () => fetchCreditAccount(orgId),
    enabled: !!orgId,
  });
};

export const useTaxRuleVersions = (taxRuleId: string) => {
  return useQuery({
    queryKey: ['billing-tax-rule-versions', taxRuleId],
    queryFn: () => fetchTaxRuleVersions(taxRuleId),
    enabled: !!taxRuleId,
  });
};
