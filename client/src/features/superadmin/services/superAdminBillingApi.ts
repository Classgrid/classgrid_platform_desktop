import axios from 'axios';

// Create a customized axios instance for billing
export const billingApi = axios.create({
  baseURL: '/api/superadmin/billing',
  withCredentials: true,
});

// Add interceptors if needed (e.g. for auth tokens)
billingApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchBillingPermissions = async () => {
  const res = await billingApi.get('/permissions');
  return res.data.data;
};

export const fetchBillingOrganizations = async () => {
  const res = await billingApi.get('/organizations');
  return res.data.data;
};

// --- CATALOG API ---

export const fetchPlans = async () => {
  const res = await billingApi.get('/catalog/plans');
  return res.data.data;
};

export const createPlan = async (payload: any) => {
  const res = await billingApi.post('/catalog/plans', payload);
  return res.data.data;
};

export const fetchPlan = async (planId: string) => {
  const res = await billingApi.get(`/catalog/plans/${planId}`);
  return res.data.data;
};

export const updatePlanEligibility = async (planId: string, payload: any) => {
  const res = await billingApi.put(`/catalog/plans/${planId}/eligibility`, payload);
  return res.data.data;
};

export const fetchPlanVersions = async (planId: string) => {
  const res = await billingApi.get(`/catalog/plans/${planId}/versions`);
  return res.data.data;
};

export const fetchPlanVersionDetail = async (planId: string, version: number) => {
  // Assuming the backend can fetch specific version by number
  const res = await billingApi.get(`/catalog/plans/${planId}/versions/${version}`);
  return res.data.data;
};

export const fetchModules = async () => {
  const res = await billingApi.get('/catalog/modules');
  return res.data.data;
};

export const createModule = async (payload: any) => {
  const res = await billingApi.post('/catalog/modules', payload);
  return res.data.data;
};

export const fetchModule = async (moduleId: string) => {
  const res = await billingApi.get(`/catalog/modules/${moduleId}`);
  return res.data.data;
};

export const updateModuleEligibility = async (moduleId: string, payload: any) => {
  const res = await billingApi.put(`/catalog/modules/${moduleId}/eligibility`, payload);
  return res.data.data;
};

export const fetchModuleVersions = async (moduleId: string) => {
  const res = await billingApi.get(`/catalog/modules/${moduleId}/versions`);
  return res.data.data;
};


// --- SUBSCRIPTION API ---

export const fetchSubscriptions = async () => {
  const res = await billingApi.get('/subscriptions');
  return res.data.data;
};

export const fetchSubscriptionOverview = async () => {
  const res = await billingApi.get('/subscriptions/overview');
  return res.data.data;
};

export const fetchSubscriptionDetail = async (orgId: string) => {
  const res = await billingApi.get(`/subscriptions/${orgId}`);
  return res.data.data;
};

export const fetchPricingOverrides = async (orgId: string) => {
  const res = await billingApi.get(`/subscriptions/${orgId}/overrides`);
  return res.data.data;
};

export const setPricingOverride = async (data: { orgId: string; moduleId: string; overridePricePaise: number }) => {
  const res = await billingApi.post(`/subscriptions/${data.orgId}/overrides`, data);
  return res.data.data;
};

export const previewProration = async (orgId: string, newPlanId: string) => {
  const res = await billingApi.post(`/subscriptions/${orgId}/preview-proration`, { newPlanId });
  return res.data.data;
};

// --- REVENUE API ---

export const fetchRevenueOverview = async () => {
  const res = await billingApi.get('/revenue');
  return res.data.data;
};

export const fetchRevenueByOrg = async () => {
  const res = await billingApi.get('/revenue/by-organization');
  return res.data.data;
};

export const fetchRevenueByModule = async () => {
  const res = await billingApi.get('/revenue/by-module');
  return res.data.data;
};

export const fetchRevenueByInvoice = async () => {
  const res = await billingApi.get('/revenue/by-invoice');
  return res.data.data;
};

export const exportRevenue = async () => {
  const res = await billingApi.get('/revenue/export', { responseType: 'blob' });
  return res.data;
};

// --- TRANSACTIONS API ---

export const fetchTransactions = async (filters: any) => {
  const res = await billingApi.get('/finance/transactions', { params: filters });
  return res.data.data;
};

export const fetchTransactionDetail = async (txId: string) => {
  const res = await billingApi.get(`/finance/transactions/${txId}`);
  return res.data.data;
};

export const fetchTransactionWebhooks = async (txId: string) => {
  const res = await billingApi.get(`/finance/transactions/${txId}/webhooks`);
  return res.data.data;
};

export const fetchTransactionTimeline = async (txId: string) => {
  const res = await billingApi.get(`/finance/transactions/${txId}/timeline`);
  return res.data.data;
};
// --- INVOICES API ---

export const fetchInvoices = async (filters: any) => {
  const res = await billingApi.get('/invoices', { params: filters });
  return res.data.data;
};

export const fetchInvoiceDetail = async (invoiceId: string) => {
  const res = await billingApi.get(`/invoices/${invoiceId}`);
  return res.data.data;
};

export const previewInvoice = async (payload: any) => {
  const res = await billingApi.post('/invoices/preview', payload);
  return res.data.data;
};

export const fetchInvoiceDeliveryHistory = async (invoiceId: string) => {
  const res = await billingApi.get(`/invoices/${invoiceId}/delivery-history`);
  return res.data.data;
};
// --- DISCOUNTS & TAXES API ---

export const fetchDiscounts = async () => {
  const res = await billingApi.get('/discounts');
  return res.data.data;
};

export const createDiscount = async (payload: any) => {
  const res = await billingApi.post('/discounts', payload);
  return res.data.data;
};

export const fetchTaxRules = async () => {
  const res = await billingApi.get('/tax-rules');
  return res.data.data;
};

export const createTaxRule = async (payload: any) => {
  const res = await billingApi.post('/tax-rules', payload);
  return res.data.data;
};

export const grantCredits = async (orgId: string, payload: any) => {
  const res = await billingApi.post(`/organizations/${orgId}/credits/grant`, payload);
  return res.data.data;
};

// --- FAILED PAYMENTS API ---

export const fetchFailedPayments = async () => {
  const res = await billingApi.get('/failures/failed-payments');
  return res.data.data;
};

export const fetchFailureOverview = async () => {
  const res = await billingApi.get('/failures/failed-payments/overview');
  return res.data.data;
};

export const fetchFailedPaymentDetail = async (failureId: string) => {
  const res = await billingApi.get(`/failed-payments/${failureId}`);
  return res.data.data;
};

export const generatePaymentLink = async (failureId: string, payload: any) => {
  const res = await billingApi.post(`/failed-payments/${failureId}/generate-payment-link`, payload);
  return res.data.data;
};

export const assignFailure = async (failureId: string, payload: { assigneeId: string }) => {
  const res = await billingApi.post(`/failed-payments/${failureId}/assign`, payload);
  return res.data.data;
};

export const addFailureNote = async (failureId: string, payload: { note: string }) => {
  const res = await billingApi.post(`/failed-payments/${failureId}/add-note`, payload);
  return res.data.data;
};

export const resolveFailure = async (failureId: string, payload: { resolution: string }) => {
  const res = await billingApi.post(`/failed-payments/${failureId}/resolve`, payload);
  return res.data.data;
};
