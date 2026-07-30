import { useQuery } from '@tanstack/react-query';
import { fetchBillingOrganizations } from '../services/superAdminBillingApi';

export const useBillingOrganizations = () => {
  return useQuery({
    queryKey: ['billing-organizations'],
    queryFn: fetchBillingOrganizations,
  });
};
