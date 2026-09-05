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

// useClassroomRequests.ts — GET /api/classrooms/:id/requests
import { useQuery } from '@tanstack/react-query';
import { classroomApi } from '../services/classroomApi';

// Faculty: pending requests for a single classroom
export function useClassroomRequests(classroomId: string | undefined) {
  return useQuery({
    queryKey: ['classrooms', classroomId, 'requests'],
    queryFn: () => classroomApi.getRequests(classroomId!),
    enabled: !!classroomId,
  });
}

// Faculty: all pending requests across ALL classrooms
export function useAllClassroomRequests() {
  return useQuery({
    queryKey: ['classrooms', 'all-requests'],
    queryFn: () => classroomApi.getAllRequests(),
  });
}

// Student: my own requests
export function useMyClassroomRequests() {
  return useQuery({
    queryKey: ['classrooms', 'my-requests'],
    queryFn: () => classroomApi.getMyRequests(),
  });
}
