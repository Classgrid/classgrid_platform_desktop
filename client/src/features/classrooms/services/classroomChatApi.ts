/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */

import { apiClient } from '@/lib/apiClient';

export interface ClassroomChatMessage {
  id: string;
  classroom_id: string;
  sender_id: string;
  sender_name: string;
  message?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
}

export const classroomChatApi = {
  getMessages: async (classroomId: string) => {
    const { data } = await apiClient.get<{ messages: ClassroomChatMessage[] }>(
      `/api/classroom-chat/${classroomId}`
    );
    return data;
  },

  sendMessage: async (classroomId: string, message: string, file?: File) => {
    const formData = new FormData();
    if (message) formData.append('message', message);
    if (file) formData.append('file', file);

    const { data } = await apiClient.post<{ message: ClassroomChatMessage }>(
      `/api/classroom-chat/${classroomId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  },
};
