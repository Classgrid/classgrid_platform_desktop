/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import axios from 'axios';
import { getAuthHeader } from '@/features/auth/services/authApi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface NotificationTemplate {
    _id: string;
    name: string;
    type: 'EMAIL' | 'SMS';
    category: 'PAYMENT' | 'ADMISSION' | 'SAAS' | 'SYSTEM';
    subject?: string;
    htmlBody?: string;
    textBody?: string;
    requiredPlaceholders: string[];
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationLog {
    _id: string;
    organizationId: { _id: string; name: string; code: string };
    userId?: string;
    templateId?: { _id: string; name: string; category: string };
    type: 'EMAIL' | 'SMS';
    recipient: string;
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';
    providerMessageId?: string;
    failureReason?: string;
    metadata?: any;
    createdAt: string;
}

export const superAdminNotificationApi = {
    // -------------------------------------------------------------
    // TEMPLATES
    // -------------------------------------------------------------
    getTemplates: async (): Promise<NotificationTemplate[]> => {
        const response = await axios.get(`${API_URL}/super-admin/notifications-sys/templates`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    getTemplate: async (id: string): Promise<NotificationTemplate> => {
        const response = await axios.get(`${API_URL}/super-admin/notifications-sys/templates/${id}`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    createTemplate: async (data: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
        const response = await axios.post(`${API_URL}/super-admin/notifications-sys/templates`, data, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    updateTemplate: async (id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
        const response = await axios.put(`${API_URL}/super-admin/notifications-sys/templates/${id}`, data, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    previewTemplate: async (data: { htmlBody?: string; textBody?: string; subject?: string; data: any }): Promise<{ subject: string; html: string; text: string }> => {
        const response = await axios.post(`${API_URL}/super-admin/notifications-sys/templates/preview`, data, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    // -------------------------------------------------------------
    // LOGS
    // -------------------------------------------------------------
    getLogs: async (params: { orgId?: string; status?: string; type?: string; limit?: number; page?: number }): Promise<{ logs: NotificationLog[]; total: number; pages: number }> => {
        const response = await axios.get(`${API_URL}/super-admin/notifications-sys/logs`, {
            headers: getAuthHeader(),
            params
        });
        return response.data.data;
    },

    getLogDetails: async (id: string): Promise<NotificationLog> => {
        const response = await axios.get(`${API_URL}/super-admin/notifications-sys/logs/${id}`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },
};
