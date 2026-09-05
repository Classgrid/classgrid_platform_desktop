/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { fetchBillingOrganizations } from '../services/superAdminBillingApi';

export const useBillingOrganizations = () => {
  return useQuery({
    queryKey: ['billing-organizations'],
    queryFn: fetchBillingOrganizations,
  });
};
