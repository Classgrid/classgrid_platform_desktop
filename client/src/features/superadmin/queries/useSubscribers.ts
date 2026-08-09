import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscribersApi } from "../services/superAdminApi";

export const SUBSCRIBERS_KEY = ["super-admin", "subscribers"] as const;

export function useSubscribers(
  params?: { q?: string; status?: string },
  enabled = true
) {
  return useQuery({
    queryKey: [...SUBSCRIBERS_KEY, params],
    queryFn: () => subscribersApi.list(params),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    enabled,
  });
}

export function usePauseSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => subscribersApi.pause(email),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBSCRIBERS_KEY }),
  });
}

export function useResumeSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => subscribersApi.resume(email),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBSCRIBERS_KEY }),
  });
}

export function useRemoveSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => subscribersApi.remove(email),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SUBSCRIBERS_KEY });
    },
  });
}

export function useUpdateSubscriberPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, preferences }: { email: string, preferences: { receives_blog?: boolean; receives_changelog?: boolean; receives_legal?: boolean } }) => 
      subscribersApi.updatePreferences(email, preferences),
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey: SUBSCRIBERS_KEY });
      
      // Optimistically update all queries (both list and detail views)
      qc.setQueriesData({ queryKey: SUBSCRIBERS_KEY }, (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((sub: any) => 
            sub.email === variables.email 
              ? { ...sub, ...variables.preferences } 
              : sub
          )
        };
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: SUBSCRIBERS_KEY });
    },
  });
}
