import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchInvoices, fetchInvoiceDetail, previewInvoice, fetchInvoiceDeliveryHistory, billingApi } from '../services/superAdminBillingApi';

export const useInvoices = (filters: any) => {
  return useQuery({
    queryKey: ['billing-invoices', filters],
    queryFn: () => fetchInvoices(filters),
  });
};

export const useInvoiceDetail = (invoiceId: string) => {
  return useQuery({
    queryKey: ['billing-invoice-detail', invoiceId],
    queryFn: () => fetchInvoiceDetail(invoiceId),
    enabled: !!invoiceId,
  });
};

export const useInvoicePreview = (payload: any) => {
  return useQuery({
    queryKey: ['billing-invoice-preview', payload],
    queryFn: () => previewInvoice(payload),
    enabled: !!payload && !!payload.organizationId,
  });
};

export const useInvoiceDeliveryHistory = (invoiceId: string) => {
  return useQuery({
    queryKey: ['billing-invoice-delivery', invoiceId],
    queryFn: () => fetchInvoiceDeliveryHistory(invoiceId),
    enabled: !!invoiceId,
  });
};

export const useGenerateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await billingApi.post('/invoices/generate', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
    },
  });
};

export const useIssueInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await billingApi.post(`/invoices/${invoiceId}/issue`);
      return res.data;
    },
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['billing-invoice-detail', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
    },
  });
};
