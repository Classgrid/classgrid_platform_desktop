/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

// useClassroomContent.ts — GET /api/classrooms/:id/content/:type
import { useQuery } from '@tanstack/react-query';
import { classroomApi } from '../services/classroomApi';

export function useClassroomContent(
  classroomId: string | undefined,
  type: 'announcement' | 'material' | 'quiz'
) {
  return useQuery({
    queryKey: ['classrooms', classroomId, 'content', type],
    queryFn: () => classroomApi.getContent(classroomId!, type),
    enabled: !!classroomId,
  });
}
