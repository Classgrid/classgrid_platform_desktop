/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchInvoices, fetchInvoiceDetail, previewInvoice, fetchInvoiceDeliveryHistory, generateInvoice, issueInvoice } from '../../services/superAdminBillingApi';

export interface InvoiceFilters {
  status?: string;
  organizationId?: string;
  startDate?: string;
  endDate?: string;
}

export const useInvoices = (filters: InvoiceFilters) => {
  return useQuery({
    queryKey: ['billing-invoices', filters],
    queryFn: () => fetchInvoices(filters),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useInvoiceDetail = (invoiceId: string) => {
  return useQuery({
    queryKey: ['billing-invoice-detail', invoiceId],
    queryFn: () => fetchInvoiceDetail(invoiceId),
    enabled: !!invoiceId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useInvoicePreview = (payload: any) => {
  return useQuery({
    queryKey: ['billing-invoice-preview', payload],
    queryFn: () => previewInvoice(payload),
    enabled: !!payload && !!payload.organizationId,
    staleTime: 10 * 60 * 1000, // Preview is static for a given payload
    retry: 1,
  });
};

export const useInvoiceDeliveryHistory = (invoiceId: string) => {
  return useQuery({
    queryKey: ['billing-invoice-delivery', invoiceId],
    queryFn: () => fetchInvoiceDeliveryHistory(invoiceId),
    enabled: !!invoiceId,
    staleTime: 60 * 1000,
    retry: 2,
  });
};

export const useGenerateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      return generateInvoice(payload);
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
      return issueInvoice(invoiceId);
    },
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['billing-invoice-detail', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
    },
  });
};
