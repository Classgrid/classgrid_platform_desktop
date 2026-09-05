/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
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
