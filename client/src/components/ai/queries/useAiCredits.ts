import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient as api } from "@/lib/apiClient";

export const aiCreditsApi = {
  getMyBalance: () => api.get("/api/ai/credits/balance").then(res => res.data.data),
  getMyHistory: () => api.get("/api/ai/credits/history").then(res => res.data.data),
  initiateTopUp: (amount_inr: number) => api.post("/api/ai/topup/initiate", { amount_inr }).then(res => res.data.data),
};

export const useMyAiBalance = () => useQuery({
  queryKey: ["my-ai-balance"],
  queryFn: aiCreditsApi.getMyBalance,
});

export const useMyAiHistory = () => useQuery({
  queryKey: ["my-ai-history"],
  queryFn: aiCreditsApi.getMyHistory,
});

export const useInitiateAiTopUp = () => {
  return useMutation({
    mutationFn: (amount_inr: number) => aiCreditsApi.initiateTopUp(amount_inr),
  });
};
