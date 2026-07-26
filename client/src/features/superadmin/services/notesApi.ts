import { apiClient } from "@/lib/apiClient";

export interface Note {
  _id: string;
  title: string;
  content: string;
  textContent: string;
  tags: string[];
  isPinned: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetNotesParams {
  date?: string; // ISO string for specific date
  tag?: string;
  search?: string;
}

export const notesApi = {
  getNotes: async (params?: GetNotesParams): Promise<Note[]> => {
    const { data } = await apiClient.get<{ success: boolean; notes: Note[] }>("/api/super-admin/storage/notes", { params });
    return data.notes;
  },

  createNote: async (noteData: Partial<Note>): Promise<Note> => {
    const { data } = await apiClient.post<{ success: boolean; note: Note }>("/api/super-admin/storage/notes", noteData);
    return data.note;
  },

  updateNote: async (id: string, noteData: Partial<Note>): Promise<Note> => {
    const { data } = await apiClient.put<{ success: boolean; note: Note }>(`/api/super-admin/storage/notes/${id}`, noteData);
    return data.note;
  },

  deleteNote: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/super-admin/storage/notes/${id}`);
  },

  togglePin: async (id: string): Promise<Note> => {
    const { data } = await apiClient.patch<{ success: boolean; note: Note }>(`/api/super-admin/storage/notes/${id}/pin`);
    return data.note;
  },
};
