import { create } from 'zustand';
import { storageApi } from '../features/superadmin/services/storageApi';
import { toast } from 'sonner';

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  name: string;
  prefix: string;
  progress: number;
  status: UploadStatus;
  key?: string;
  cdnUrl?: string;
  errorMessage?: string;
}

interface UploadStore {
  uploads: UploadItem[];
  isDrawerOpen: boolean;
  addUploads: (files: File[], prefix: string) => void;
  removeUpload: (id: string) => void;
  clearCompleted: () => void;
  setDrawerOpen: (isOpen: boolean) => void;
  retryUpload: (id: string) => void;
}

const CONCURRENT_UPLOADS = 20;

// Private state to track processing loop so it doesn't run multiple times
let isProcessing = false;

export const useUploadStore = create<UploadStore>((set, get) => ({
  uploads: [],
  isDrawerOpen: false,

  addUploads: (files: File[], prefix: string) => {
    const newUploads: UploadItem[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      prefix,
      progress: 0,
      status: 'pending',
    }));

    set(state => ({
      uploads: [...state.uploads, ...newUploads],
      isDrawerOpen: true, // Auto open drawer when new uploads start
    }));

    // Trigger processing loop
    processQueue(get, set);
  },

  removeUpload: (id: string) => {
    set(state => ({
      uploads: state.uploads.filter(u => u.id !== id),
    }));
  },

  clearCompleted: () => {
    set(state => ({
      uploads: state.uploads.filter(u => u.status !== 'completed'),
    }));
  },

  setDrawerOpen: (isOpen: boolean) => {
    set({ isDrawerOpen: isOpen });
  },

  retryUpload: (id: string) => {
    set(state => ({
      uploads: state.uploads.map(u => 
        u.id === id ? { ...u, status: 'pending', progress: 0, errorMessage: undefined } : u
      )
    }));
    processQueue(get, set);
  }
}));

async function processQueue(get: () => UploadStore, set: (fn: (state: UploadStore) => UploadStore) => void) {
  if (isProcessing) return;
  isProcessing = true;

  try {
    while (true) {
      const state = get();
      const activeCount = state.uploads.filter(u => u.status === 'uploading').length;
      
      if (activeCount >= CONCURRENT_UPLOADS) {
        // Queue is full, wait a bit and check again
        await new Promise(r => setTimeout(r, 500));
        continue;
      }

      const nextPending = state.uploads.find(u => u.status === 'pending');
      
      if (!nextPending) {
        // No more pending uploads, loop finishes
        break;
      }

      // Mark as uploading
      set(state => ({
        uploads: state.uploads.map(u => u.id === nextPending.id ? { ...u, status: 'uploading' } : u)
      }));

      // Fire and forget the upload (it handles its own state updates)
      processSingleUpload(nextPending, set).catch(console.error);
    }
  } finally {
    isProcessing = false;
  }
}

async function processSingleUpload(upload: UploadItem, set: (fn: (state: UploadStore) => UploadStore) => void) {
  try {
    // 1. Get Presigned URL
    const { presignedUrl, key, cdnUrl } = await storageApi.getPresignedUploadUrl(
      upload.file.name, 
      upload.prefix, 
      upload.file.type || 'application/octet-stream'
    );

    // 2. Upload directly to S3
    await storageApi.uploadFileDirect(presignedUrl, upload.file, (progressEvent) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        set(state => ({
          uploads: state.uploads.map(u => 
            u.id === upload.id ? { ...u, progress: Math.max(u.progress, percentCompleted) } : u
          )
        }));
      }
    });

    // 3. Mark completed
    set(state => ({
      uploads: state.uploads.map(u => 
        u.id === upload.id ? { ...u, status: 'completed', progress: 100, key, cdnUrl } : u
      )
    }));

  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Upload failed';
    set(state => ({
      uploads: state.uploads.map(u => 
        u.id === upload.id ? { ...u, status: 'error', errorMessage } : u
      )
    }));
    toast.error(`Failed to upload ${upload.name}: ${errorMessage}`);
  }
}
