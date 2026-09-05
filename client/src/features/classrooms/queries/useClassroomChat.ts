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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classroomChatApi } from '../services/classroomChatApi';
import { toast } from 'sonner';

export function useClassroomChat(classroomId: string | undefined) {
  return useQuery({
    queryKey: ['classroom-chat', classroomId],
    queryFn: () => classroomChatApi.getMessages(classroomId!),
    enabled: !!classroomId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSendClassroomMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classroomId, message, file }: { classroomId: string; message: string; file?: File }) => 
      classroomChatApi.sendMessage(classroomId, message, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classroom-chat', variables.classroomId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });
}
