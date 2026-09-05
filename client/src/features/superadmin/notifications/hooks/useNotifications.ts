/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminNotificationApi, NotificationTemplate, NotificationLog } from '../services/superAdminNotificationApi';
import { toast } from 'sonner';

// ----------------------------------------------------------------------
// TEMPLATES
// ----------------------------------------------------------------------

export const useNotificationTemplates = () => {
    return useQuery({
        queryKey: ['notification-templates'],
        queryFn: () => superAdminNotificationApi.getTemplates(),
    });
};

export const useNotificationTemplate = (id: string) => {
    return useQuery({
        queryKey: ['notification-template', id],
        queryFn: () => superAdminNotificationApi.getTemplate(id),
        enabled: !!id,
    });
};

export const useCreateNotificationTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<NotificationTemplate>) => superAdminNotificationApi.createTemplate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
            toast.success("Template created successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to create template");
        }
    });
};

export const useUpdateNotificationTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<NotificationTemplate> }) => superAdminNotificationApi.updateTemplate(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
            queryClient.invalidateQueries({ queryKey: ['notification-template', variables.id] });
            toast.success("Template updated successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to update template");
        }
    });
};

export const usePreviewNotificationTemplate = () => {
    return useMutation({
        mutationFn: (data: { htmlBody?: string; textBody?: string; subject?: string; data: any }) => superAdminNotificationApi.previewTemplate(data),
    });
};

// ----------------------------------------------------------------------
// LOGS
// ----------------------------------------------------------------------

export const useNotificationLogs = (filters: { orgId?: string; status?: string; type?: string; limit?: number; page?: number }) => {
    return useQuery({
        queryKey: ['notification-logs', filters],
        queryFn: () => superAdminNotificationApi.getLogs(filters),
    });
};

export const useNotificationLogDetails = (id: string) => {
    return useQuery({
        queryKey: ['notification-log', id],
        queryFn: () => superAdminNotificationApi.getLogDetails(id),
        enabled: !!id,
    });
};
