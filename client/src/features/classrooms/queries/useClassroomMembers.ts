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

// useClassroomMembers.ts — GET /api/classrooms/:id/members
import { useQuery } from '@tanstack/react-query';
import { classroomApi } from '../services/classroomApi';

export function useClassroomMembers(classroomId: string | undefined) {
  return useQuery({
    queryKey: ['classrooms', classroomId, 'members'],
    queryFn: () => classroomApi.getMembers(classroomId!),
    enabled: !!classroomId,
  });
}
