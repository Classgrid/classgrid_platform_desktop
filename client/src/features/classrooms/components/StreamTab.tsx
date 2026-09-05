/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import React, { useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useClassroomContent } from '../queries/useClassroomContent';
import { EmptyState } from './EmptyState';
import { Spinner } from '@/components/marketing_ui/spinner';
import { Skeleton } from '@/components/marketing_ui/skeleton';
import { ClassroomContent } from '../types/classroom.types';
import { AnnouncementCard } from './AnnouncementCard';
import { PostAnnouncementForm } from './PostAnnouncementForm';
import { getSupabaseClient } from '@/lib/supabaseClient';

interface StreamTabProps {
  classroomId: string | undefined;
  userRole: 'faculty' | 'student';
  teacher?: {
    name: string;
    profilePicture?: string;
  };
}

export const StreamTab: React.FC<StreamTabProps> = ({ classroomId, userRole, teacher }) => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useClassroomContent(classroomId, 'announcement');
  const announcements: ClassroomContent[] = data?.data || [];

  useEffect(() => {
    if (!classroomId) return;
    const sb = getSupabaseClient();
    if (!sb) return;

    const channel = sb
      .channel(`classroom_${classroomId}_announcements`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'classroom_content',
          filter: `classroom_id=eq.${classroomId}`,
        },
        (payload) => {
          // If a new content item is inserted and it's an announcement, refresh the query
          if (payload.new && payload.new.type === 'announcement') {
            queryClient.invalidateQueries({ queryKey: ['classrooms', classroomId, 'content', 'announcement'] });
          }
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [classroomId, queryClient]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="pl-[52px]">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {userRole === 'faculty' && classroomId && (
        <PostAnnouncementForm classroomId={classroomId} teacher={teacher} />
      )}

      {announcements.length === 0 ? (
        <EmptyState 
          icon={MessageSquare}
          title="No announcements yet"
          description="When you post an announcement, it will appear here."
        />
      ) : (
        <div className="space-y-6">
          {announcements.map((announcement) => (
            <AnnouncementCard 
              key={announcement.id || announcement._id}
              announcement={announcement}
              teacher={teacher || { name: 'Faculty Member' }}
              userRole={userRole}
              classroomId={classroomId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
