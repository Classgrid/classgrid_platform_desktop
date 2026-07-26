import React from 'react';
import { useUploadStore } from '../stores/useUploadStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, ChevronDown, ChevronUp, File, AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { storageKeys } from '../features/superadmin/queries/useStorage';

export function GlobalUploadManager() {
  const { uploads, isDrawerOpen, setDrawerOpen, removeUpload, clearCompleted, retryUpload } = useUploadStore();
  const [isMinimized, setIsMinimized] = React.useState(false);
  const queryClient = useQueryClient();

  // Invalidate queries when uploads complete to keep UI fresh
  React.useEffect(() => {
    const newlyCompleted = uploads.filter(u => u.status === 'completed');
    if (newlyCompleted.length > 0) {
      // Debounce the invalidation to avoid spamming the backend
      const timeout = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: storageKeys.lists() });
        queryClient.invalidateQueries({ queryKey: storageKeys.analytics() });
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [uploads, queryClient]);

  if (uploads.length === 0) return null;

  const activeCount = uploads.filter(u => u.status === 'uploading' || u.status === 'pending').length;
  const errorCount = uploads.filter(u => u.status === 'error').length;
  const completedCount = uploads.filter(u => u.status === 'completed').length;
  
  const totalProgress = uploads.reduce((acc, curr) => acc + curr.progress, 0) / (uploads.length || 1);

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-background border rounded-lg shadow-xl overflow-hidden flex flex-col transition-all duration-300">
      {/* Header */}
      <div 
        className="bg-muted px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/80"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center space-x-2">
          {activeCount > 0 ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          ) : errorCount > 0 ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          <span className="font-semibold text-sm">
            {activeCount > 0 
              ? `Uploading ${activeCount} file${activeCount > 1 ? 's' : ''}` 
              : errorCount > 0 
                ? `${errorCount} upload${errorCount > 1 ? 's' : ''} failed`
                : `${completedCount} upload${completedCount > 1 ? 's' : ''} complete`}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive" 
            onClick={(e) => { 
              e.stopPropagation(); 
              setDrawerOpen(false); 
              if (activeCount === 0) clearCompleted(); 
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Global Progress Bar (visible when minimized or uploading) */}
      {(isMinimized || activeCount > 0) && (
        <Progress value={totalProgress} className="h-1 rounded-none bg-muted" />
      )}

      {/* Body List */}
      {!isMinimized && (
        <ScrollArea className="h-64 flex-1 p-2 bg-card">
          <div className="space-y-2">
            {uploads.map((upload) => (
              <div key={upload.id} className="text-sm border rounded p-2 flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 truncate pr-2">
                    <File className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate font-medium">{upload.name}</span>
                  </div>
                  
                  {upload.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                  {upload.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />}
                  {upload.status === 'pending' && <span className="text-xs text-muted-foreground">Waiting...</span>}
                </div>
                
                {upload.status === 'uploading' && (
                  <div className="flex items-center space-x-2">
                    <Progress value={upload.progress} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-8 text-right">{upload.progress}%</span>
                  </div>
                )}
                
                {upload.status === 'error' && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-red-500 truncate pr-2">{upload.errorMessage}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => retryUpload(upload.id)}>
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
      
      {/* Footer */}
      {!isMinimized && completedCount > 0 && (
        <div className="p-2 bg-muted/50 border-t flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearCompleted} className="h-8 text-xs">
            Clear completed
          </Button>
        </div>
      )}
    </div>
  );
}
