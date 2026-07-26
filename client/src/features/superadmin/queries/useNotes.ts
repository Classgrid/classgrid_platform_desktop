import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesApi, GetNotesParams, Note } from "../services/notesApi";

export const useNotes = (params?: GetNotesParams) => {
  return useQuery({
    queryKey: ["superadmin-notes", params],
    queryFn: () => notesApi.getNotes(params),
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
