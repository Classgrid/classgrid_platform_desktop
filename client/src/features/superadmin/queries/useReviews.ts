/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import { useQuery } from "@tanstack/react-query";
import { reviewsApi } from "../services/superAdminApi";

export const REVIEWS_KEY = ["super-admin", "reviews"] as const;

export function useReviews() {
  return useQuery({
    queryKey: REVIEWS_KEY,
    queryFn: () => reviewsApi.getAll(),
    staleTime: 60_000,
  });
}
