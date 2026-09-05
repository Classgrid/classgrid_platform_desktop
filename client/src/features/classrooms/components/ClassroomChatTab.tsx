/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useClassroomChat, useSendClassroomMessage } from '../queries/useClassroomChat';
import { useCurrentUser } from '@/features/auth/queries/useCurrentUser';
import { ChatConversation } from '@/features/chat/components/ChatConversation';
import { ChatInput } from '@/features/chat/components/ChatInput';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { Spinner } from '@/components/marketing_ui/spinner';

interface ClassroomChatTabProps {
  classroomId: string | undefined;
  userRole: 'faculty' | 'student';
}

export const ClassroomChatTab: React.FC<ClassroomChatTabProps> = ({ classroomId, userRole }) => {
  const { data, isLoading } = useClassroomChat(classroomId);
  const { mutate: sendMessage, isPending: isSending } = useSendClassroomMessage();
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();

  const messages = data?.messages || [];
  const currentUserId = currentUser?._id || '';

  // Setup Realtime Subscription for new messages
  useEffect(() => {
    if (!classroomId) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`classroom_chat_${classroomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'classroom_messages',
          filter: `classroom_id=eq.${classroomId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['classroom-chat', classroomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classroomId, queryClient]);

  const handleSendMessage = (text: string, file?: File) => {
    if (!classroomId) return;
    sendMessage({ classroomId, message: text, file });
  };

  const dummyThread = {
    id: classroomId || 'classroom',
    type: 'group' as const,
    name: 'Classroom Discussion',
    participants: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex h-[600px] items-center justify-center">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-4">
      <div className="flex-1 min-h-0 relative">
        <ChatConversation 
          thread={dummyThread}
          messages={messages as any}
          currentUserId={currentUserId}
          isLoading={isLoading}
          hasMore={false}
          onLoadMore={() => {}}
          onReply={() => {}}
          onDelete={() => {}}
          onEdit={() => {}}
          onReact={() => {}}
          canReply={true}
        />
      </div>
      <div className="border-t border-gray-200">
        <ChatInput 
          onSendMessage={handleSendMessage}
          threadId={classroomId!}
          disabled={false}
          threadType="group"
        />
      </div>
    </div>
  );
};
