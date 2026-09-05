/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type OrgRolesResponse = {
  roles: string[];
};

/**
 * Fetch the array of allowed roles for the requesting user's organization type.
 * Super admins receive the exhaustive master list.
 */
export function useOrgRoles() {
  return useQuery({
    queryKey: ["hierarchy", "roles"],
    queryFn: async () => {
      const { data } = await apiClient.get<OrgRolesResponse>("/api/hierarchy/roles");
      return data.roles;
    },
  });
}
