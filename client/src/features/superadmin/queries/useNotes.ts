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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesApi, GetNotesParams, Note } from "../services/notesApi";

export const useNotes = (params?: GetNotesParams) => {
  return useQuery({
    queryKey: ["superadmin-notes", params],
    queryFn: () => notesApi.getNotes(params),
  });
};

export const useNoteStats = () => {
  return useQuery({
    queryKey: ["superadmin-notes-stats"],
    queryFn: () => notesApi.getStats(),
  });
};

export const useNoteVersions = (noteId: string | undefined) => {
  return useQuery({
    queryKey: ["superadmin-notes-versions", noteId],
    queryFn: () => notesApi.getVersions(noteId!),
    enabled: !!noteId,
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (noteData: Partial<Note>) => notesApi.createNote(noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-notes"] });
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...noteData }: Partial<Note> & { id: string }) => notesApi.updateNote(id, noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-notes"] });
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => notesApi.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-notes"] });
    },
  });
};

export const useTogglePin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => notesApi.togglePin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-notes"] });
    },
  });
};
