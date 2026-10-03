import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient as api } from "@/lib/apiClient";

// API endpoints
export const aiUsageApi = {
  getGlobalStats: (orgId?: string, month?: number, year?: number) => {
    let url = `/api/super-admin/ai-usage/global/stats?`;
    if (orgId) url += `orgId=${orgId}&`;
    if (month) url += `month=${month}&`;
    if (year) url += `year=${year}&`;
    return api.get(url).then(res => res.data.data);
  },
  getModelBreakdown: () => api.get("/api/super-admin/ai-usage/global/models").then(res => res.data.data),
  
  getOrgs: () => api.get("/api/super-admin/ai-usage/orgs").then(res => res.data.data),
  getOrgDetail: (orgId: string) => api.get(`/api/super-admin/ai-usage/orgs/${orgId}/detail`).then(res => res.data.data),
  
  getOrgUsers: (orgId: string) => api.get(`/api/super-admin/ai-usage/orgs/${orgId}/users`).then(res => res.data.data),
  getUserDetail: (userId: string) => api.get(`/api/super-admin/ai-usage/users/${userId}/detail`).then(res => res.data.data),

  // Mutations
  blockUser: (userId: string, blocked: boolean) => api.put(`/api/super-admin/ai-usage/users/${userId}/block`, { blocked }).then(res => res.data),
  blockOrg: (orgId: string, blocked: boolean) => api.put(`/api/super-admin/ai-usage/orgs/${orgId}/block`, { blocked }).then(res => res.data),
  resetUserUsage: (userId: string) => api.post(`/api/super-admin/ai-usage/users/${userId}/reset`).then(res => res.data),
  resetOrgUsage: (orgId: string) => api.post(`/api/super-admin/ai-usage/orgs/${orgId}/reset`).then(res => res.data),
  grantCredits: (userId: string, amount: number, options?: { sendEmail?: boolean; startDate?: string; endDate?: string }) => api.post(`/api/super-admin/ai-usage/users/${userId}/grant`, { amount, ...options }).then(res => res.data),
  deleteUserData: (userId: string) => api.delete(`/api/super-admin/ai-usage/users/${userId}/data`).then(res => res.data),
  updateOrgLimits: (orgId: string, data: { pro_pool_limit: number, free_weekly_limit_per_user: number, image_generation_limit?: number, whatsapp_scheduling_limit?: number }) => api.put(`/api/super-admin/ai-usage/orgs/${orgId}/limits`, data).then(res => res.data),
};

export const useGlobalAiStats = (orgId?: string, month?: number, year?: number) => useQuery({
  queryKey: ["ai-usage-global", orgId, month, year],
  queryFn: () => aiUsageApi.getGlobalStats(orgId, month, year),
});

export const useAiModelBreakdown = () => useQuery({
  queryKey: ["ai-usage-models"],
  queryFn: aiUsageApi.getModelBreakdown,
});

export const useAiUsageOrgs = () => useQuery({
  queryKey: ["ai-usage-orgs"],
  queryFn: aiUsageApi.getOrgs,
});

export const useAiOrgDetail = (orgId: string) => useQuery({
  queryKey: ["ai-usage-org", orgId],
  queryFn: () => aiUsageApi.getOrgDetail(orgId),
  enabled: !!orgId,
});

export const useAiOrgUsers = (orgId: string) => useQuery({
  queryKey: ["ai-usage-org-users", orgId],
  queryFn: () => aiUsageApi.getOrgUsers(orgId),
  enabled: !!orgId,
});

export const useAiUserDetail = (userId: string) => useQuery({
  queryKey: ["ai-usage-user", userId],
  queryFn: () => aiUsageApi.getUserDetail(userId),
  enabled: !!userId,
});

export const useBlockAiUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, blocked }: { userId: string, blocked: boolean }) => aiUsageApi.blockUser(userId, blocked),
    onSuccess: (_, { userId }) => {
      toast.success("Action completed successfully.");
      queryClient.invalidateQueries({ queryKey: ["ai-usage-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["ai-usage-org-users"] });
    },
    onError: (error) => toast.error("Action failed. " + error.message),
  });
};

export const useBlockAiOrg = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, blocked }: { orgId: string, blocked: boolean }) => aiUsageApi.blockOrg(orgId, blocked),
    onSuccess: (_, { orgId }) => {
      toast.success("Action completed successfully.");
      queryClient.invalidateQueries({ queryKey: ["ai-usage-org", orgId] });
      queryClient.invalidateQueries({ queryKey: ["ai-usage-orgs"] });
    },
    onError: (error) => toast.error("Action failed. " + error.message),
  });
};

export const useGrantAiCredits = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, amount, options }: { userId: string, amount: number, options?: { sendEmail?: boolean; startDate?: string; endDate?: string } }) => aiUsageApi.grantCredits(userId, amount, options),
    onSuccess: (_, { userId }) => {
      toast.success("Action completed successfully.");
      queryClient.invalidateQueries({ queryKey: ["ai-usage-user", userId] });
    },
    onError: (error) => toast.error("Action failed. " + error.message),
  });
};

export const useResetUserUsage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => aiUsageApi.resetUserUsage(userId),
    onSuccess: (_, userId) => {
      toast.success("User usage limit has been reset to 0.");
      queryClient.invalidateQueries({ queryKey: ["ai-usage-user", userId] });
    },
    onError: (error) => toast.error("Failed to reset limit. " + error.message),
  });
};

export const useResetOrgUsage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orgId: string) => aiUsageApi.resetOrgUsage(orgId),
    onSuccess: (_, orgId) => {
      toast.success("Organization usage has been reset.");
      queryClient.invalidateQueries({ queryKey: ["ai-usage-org", orgId] });
      queryClient.invalidateQueries({ queryKey: ["ai-usage-orgs"] });
    },
    onError: (error) => toast.error("Failed to reset limit. " + error.message),
  });
};

export const useUpdateOrgAiLimits = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string, data: { pro_pool_limit: number, free_weekly_limit_per_user: number, image_generation_limit?: number, whatsapp_scheduling_limit?: number } }) => aiUsageApi.updateOrgLimits(orgId, data),
    onSuccess: (_, { orgId }) => {
      toast.success("Organization AI limits updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["ai-usage-org", orgId] });
      queryClient.invalidateQueries({ queryKey: ["ai-usage-orgs"] });
    },
    onError: (error) => toast.error("Failed to update limits. " + error.message),
  });
};
