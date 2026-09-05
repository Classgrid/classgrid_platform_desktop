/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

// useDiscoverClassrooms.ts — GET /api/classrooms/discover
import { useQuery } from '@tanstack/react-query';
import { classroomApi } from '../services/classroomApi';

export function useDiscoverClassrooms(params?: { search?: string; subject?: string }) {
  return useQuery({
    queryKey: ['classrooms', 'discover', params],
    queryFn: () => classroomApi.discoverClassrooms(params),
  });
}
