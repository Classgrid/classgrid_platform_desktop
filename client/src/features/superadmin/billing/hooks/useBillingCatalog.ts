import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPlans, fetchModules, fetchPlanVersions, fetchPlanVersionDetail, createPlan, fetchModuleVersions, createModule, fetchPlan, updatePlanEligibility, fetchModule, updateModuleEligibility } from '../services/superAdminBillingApi';

export const useBillingPlans = () => {
  return useQuery({
    queryKey: ['billing-plans'],
    queryFn: fetchPlans,
  });
};

export const useBillingModules = () => {
  return useQuery({
    queryKey: ['billing-modules'],
    queryFn: fetchModules,
  });
};

export const usePlanVersions = (planId: string) => {
  return useQuery({
    queryKey: ['billing-plan-versions', planId],
    queryFn: () => fetchPlanVersions(planId),
    enabled: !!planId,
  });
};

export const usePlanVersionDetail = (planId: string, version: number) => {
  return useQuery({
    queryKey: ['billing-plan-version', planId, version],
    queryFn: () => fetchPlanVersionDetail(planId, version),
    enabled: !!planId && !!version,
  });
};

export const usePlanEligibility = (planId: string) => {
  return useQuery({
    queryKey: ['billing-plan-eligibility', planId],
    queryFn: () => fetchPlan(planId),
    enabled: !!planId,
  });
};

export const useUpdatePlanEligibility = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, payload }: { planId: string, payload: any }) => updatePlanEligibility(planId, payload),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: ['billing-plan-eligibility', planId] });
      queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
    },
  });
};

export const useCreatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
    },
  });
};

export const useModuleVersions = (moduleId: string) => {
  return useQuery({
    queryKey: ['billing-module-versions', moduleId],
    queryFn: () => fetchModuleVersions(moduleId),
    enabled: !!moduleId,
  });
};

export const useCreateModule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-modules'] });
    },
  });
};

export const useModuleEligibility = (moduleId: string) => {
  return useQuery({
    queryKey: ['billing-module-eligibility', moduleId],
    queryFn: () => fetchModule(moduleId),
    enabled: !!moduleId,
  });
};

export const useUpdateModuleEligibility = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, payload }: { moduleId: string, payload: any }) => updateModuleEligibility(moduleId, payload),
    onSuccess: (_, { moduleId }) => {
      queryClient.invalidateQueries({ queryKey: ['billing-module-eligibility', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['billing-modules'] });
    },
  });
};
