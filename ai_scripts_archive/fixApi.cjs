const fs = require('fs');

let f1 = fs.readFileSync('client/src/features/superadmin/billing/services/superAdminBillingApi.ts', 'utf8');
f1 = f1.replace(/export const fetchRevenueByOrg = [^;]+;/s, 'export const fetchRevenueByOrg = async (params?: any) => {\n  const response = await apiClient.get<ApiEnvelope<any[]>>(`/api/super-admin/revenue/by-organization`, { params });\n  return response.data.data;\n};');
f1 = f1.replace(/export const fetchRevenueByModule = [^;]+;/s, 'export const fetchRevenueByModule = async (params?: any) => {\n  const response = await apiClient.get<ApiEnvelope<any[]>>(`/api/super-admin/revenue/by-type`, { params });\n  return response.data.data;\n};');
fs.writeFileSync('client/src/features/superadmin/billing/services/superAdminBillingApi.ts', f1);
console.log("Fixed superAdminBillingApi.ts");
