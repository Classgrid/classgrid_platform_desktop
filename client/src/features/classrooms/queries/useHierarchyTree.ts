/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

// useHierarchyTree.ts — GET /api/hierarchy/tree
import { useQuery } from '@tanstack/react-query';
import { hierarchyApi } from '../services/classroomApi';

export function useHierarchyTree() {
  return useQuery({
    queryKey: ['hierarchy', 'tree'],
    queryFn: () => hierarchyApi.getTree(),
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
}

export function useHierarchyChildren(parentId: string | undefined) {
  return useQuery({
    queryKey: ['hierarchy', 'children', parentId],
    queryFn: () => hierarchyApi.getChildren(parentId!),
    enabled: !!parentId,
  });
}
