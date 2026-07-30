import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRevenueOverview, fetchRevenueByOrg, fetchRevenueByModule, fetchRevenueByInvoice, exportRevenue, fetchTransactions, fetchTransactionDetail, fetchTransactionWebhooks, fetchTransactionTimeline, fetchFailedPayments, billingApi } from '../../services/superAdminBillingApi';

export interface TransactionFilters {
  status?: string;
  type?: string;
  organizationId?: string;
  startDate?: string;
  endDate?: string;
}

export const useRevenueOverview = () => {
  return useQuery({
    queryKey: ['billing-revenue-overview'],
    queryFn: fetchRevenueOverview,
    staleTime: 5 * 60 * 1000,
  });
};

export const useRevenueByOrg = () => {
  return useQuery({
    queryKey: ['billing-revenue-org'],
    queryFn: fetchRevenueByOrg,
    staleTime: 5 * 60 * 1000,
  });
};

export const useRevenueByModule = () => {
  return useQuery({
    queryKey: ['billing-revenue-module'],
    queryFn: fetchRevenueByModule,
    staleTime: 5 * 60 * 1000,
  });
};

export const useRevenueByInvoice = () => {
  return useQuery({
    queryKey: ['billing-revenue-by-invoice'],
    queryFn: fetchRevenueByInvoice,
    staleTime: 5 * 60 * 1000,
  });
};

export const useExportRevenue = () => {
  return useMutation({
    mutationFn: exportRevenue,
    onSuccess: (blob) => {
      // Create a temporary link to download the blob
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `revenue_export_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    },
  });
};

export const useTransactions = (filters: TransactionFilters) => {
  return useQuery({
    queryKey: ['billing-transactions', filters],
    queryFn: () => fetchTransactions(filters),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useTransactionDetail = (txId: string) => {
  return useQuery({
    queryKey: ['billing-transaction-detail', txId],
    queryFn: () => fetchTransactionDetail(txId),
    enabled: !!txId,
    staleTime: 60 * 1000,
  });
};

export const useTransactionWebhooks = (txId: string) => {
  return useQuery({
    queryKey: ['billing-transaction-webhooks', txId],
    queryFn: () => fetchTransactionWebhooks(txId),
    enabled: !!txId,
    staleTime: 60 * 1000,
  });
};

export const useTransactionTimeline = (txId: string) => {
  return useQuery({
    queryKey: ['billing-transaction-timeline', txId],
    queryFn: () => fetchTransactionTimeline(txId),
    enabled: !!txId,
    staleTime: 60 * 1000,
  });
};

export const useRefundTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ txId, amountPaise, reason }: { txId: string; amountPaise: number; reason: string }) => {
      const res = await billingApi.post(`/finance/transactions/${txId}/refunds`, { amountPaise, reason });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['billing-transaction-detail', variables.txId] });
      queryClient.invalidateQueries({ queryKey: ['billing-transactions'] });
    },
  });
};

export const useFailedPayments = () => {
  return useQuery({
    queryKey: ['billing-failed-payments'],
    queryFn: fetchFailedPayments,
  });
};
