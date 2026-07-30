import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchFailedPayments, 
  fetchFailedPaymentDetail, 
  generatePaymentLink, 
  assignFailure, 
  addFailureNote, 
  resolveFailure 
} from '../services/superAdminBillingApi';

export const useFailedPaymentsList = () => {
  return useQuery({
    queryKey: ['billing-failed-payments'],
    queryFn: fetchFailedPayments,
  });
};

export const useFailedPaymentDetail = (failureId: string) => {
  return useQuery({
    queryKey: ['billing-failed-payment-detail', failureId],
    queryFn: () => fetchFailedPaymentDetail(failureId),
    enabled: !!failureId,
  });
};

export const useGeneratePaymentLink = (failureId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => generatePaymentLink(failureId, payload),
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
