import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiAgentReviewsApi } from "../services/superAdminApi";
import { toast } from "sonner";

export const useAgentReviews = () => {
  return useQuery({
    queryKey: ["ai-agent-reviews"],
    queryFn: () => aiAgentReviewsApi.getAll(),
  });
};

export const useUpdateAgentReviewStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'actioned' | 'acknowledged' | 'no_action' | 'pending' }) => 
      aiAgentReviewsApi.updateStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ai-agent-reviews"] });
      toast.success(`Review status updated to ${variables.status}`);
    },
    onError: () => {
      toast.error("Failed to update review status");
    }
  });
};
