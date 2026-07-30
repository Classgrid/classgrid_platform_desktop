import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchBillingExportDownload, fetchBillingExportJob } from '../../services/superAdminBillingApi';

export const useBillingExportJob = (jobId: string) => {
  return useQuery({
    queryKey: ['billing-export-job', jobId],
    queryFn: () => fetchBillingExportJob(jobId),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'PENDING' || status === 'PROCESSING' ? 2000 : false;
    },
  });
};

export const useBillingExportDownload = () => {
  return useMutation({
    mutationFn: (jobId: string) => fetchBillingExportDownload(jobId),
    onSuccess: ({ url, fileName }) => {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName || '';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    },
  });
};
