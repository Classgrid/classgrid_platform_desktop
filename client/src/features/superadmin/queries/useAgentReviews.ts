import { useQuery } from "@tanstack/react-query";
import { aiAgentReviewsApi } from "../services/superAdminApi";

export const useAgentReviews = () => {
  return useQuery({
    queryKey: ["ai-agent-reviews"],
    queryFn: () => aiAgentReviewsApi.getAll(),
  });
};
