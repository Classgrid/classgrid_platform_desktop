/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
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
