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
