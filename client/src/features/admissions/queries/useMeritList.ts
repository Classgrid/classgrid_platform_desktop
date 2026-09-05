/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMeritList, generateMerit } from "../api";

export function useMeritList(hierarchyId?: string) {
  return useQuery({
    queryKey: ["admission-merit-list", hierarchyId],
    queryFn: () => getMeritList(hierarchyId),
  });
}

export function useGenerateMerit() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (hierarchyId?: string) => generateMerit(hierarchyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admission-merit-list"] });
      qc.invalidateQueries({ queryKey: ["admission-analytics"] });
    },
  });
}
