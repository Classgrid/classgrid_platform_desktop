/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

// useClassroomDetail.ts — GET /api/classrooms/:id
import { useQuery } from '@tanstack/react-query';
import { classroomApi } from '../services/classroomApi';

export function useClassroomDetail(classroomId: string | undefined) {
  return useQuery({
    queryKey: ['classrooms', 'detail', classroomId],
    queryFn: () => classroomApi.getClassroomById(classroomId!),
    enabled: !!classroomId,
  });
}
