import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Download, ImageIcon, Loader2 } from "lucide-react";
import { DocsImageViewer, DocsViewerImage } from "./DocsImageViewer";

interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  createdAt: string;
  sessionId: string;
}

interface AiImagesGalleryProps {
  backendUrl: string;
}

export function AiImagesGallery({ backendUrl }: AiImagesGalleryProps) {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/ai/my-images`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch images");
        }
        const data = await res.json();
        setImages(data.images || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [backendUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Loading your generated images...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
        <p>You haven't generated any images yet.</p>
        <p className="text-sm opacity-70">Try asking the AI to "Create an image of..."</p>
      </div>
    );
  }

  // Group images by month
  const groupedImages = images.reduce((acc, img) => {
    const month = format(parseISO(img.createdAt), "MMMM yyyy");
    if (!acc[month]) acc[month] = [];
    acc[month].push(img);
    return acc;
  }, {} as Record<string, GeneratedImage[]>);

  // Convert to DocsViewer format
  const allViewerImages: DocsViewerImage[] = images.map((img) => ({
    id: img.id,
    src: img.url,
    alt: img.prompt,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <DocsImageViewer
        images={allViewerImages}
        renderThumbnails={(viewerImages, openImage) => (
          <div className="space-y-10">
            {Object.entries(groupedImages).map(([month, monthImages]) => (
              <div key={month}>
                <h4 className="text-lg font-semibold text-foreground mb-4 sticky top-0 bg-background/95 backdrop-blur py-2 z-10 border-b border-border/50">
                  {month}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {monthImages.map((img) => {
                    const viewerImg = viewerImages.find((v) => v.id === img.id)!;
                    return (
                      <div key={img.id} className="flex flex-col gap-2">
                        <div
                          className="group relative aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer border border-border/50 hover:border-emerald-500/50 transition-colors"
                          onClick={(e) => openImage(viewerImg, e)}
                        >
                          <img
                            src={img.url}
                            alt={img.prompt}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                        <div className="px-1">
                          <p className="text-sm font-medium text-foreground line-clamp-1" title={img.prompt}>
                            {img.prompt}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(parseISO(img.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      />
    </div>
  );
}
