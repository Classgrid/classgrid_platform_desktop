import { AppRouter } from "@/app/router";
import { Toaster } from "@/components/marketing_ui/sonner";
import { GlobalErrorBoundary } from "@/components/layout/GlobalErrorBoundary";
import { GlobalUploadManager } from "@/components/GlobalUploadManager";

export function App() {
  return (
    <GlobalErrorBoundary>
      <div className="bg-background text-foreground min-h-screen w-full">
        <AppRouter />
        <Toaster />
        <GlobalUploadManager />
      </div>
    </GlobalErrorBoundary>
  );
}
