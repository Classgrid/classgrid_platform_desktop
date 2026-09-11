import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import mermaid from 'mermaid';
import { Loader2, Maximize2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

// Sanitize AI-generated mermaid syntax to avoid common parse errors
const sanitizeMermaid = (chart: string): string => {
  return chart
    // Replace literal \n inside node labels [...] with a space
    .replace(/\[([^\]]*?)\\n([^\]]*?)\]/g, (_: string, a: string, b: string) => `[${a} ${b}]`)
    // Strip emojis from the entire chart (they break the parser)
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim();
};

export const MermaidViewer = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    // Debounce: only render after 1500ms of no changes (streaming fully stopped)
    const timer = setTimeout(() => {
      if (!isMounted) return;

      // Run off the main thread to avoid UI freeze
      const idleId = (window.requestIdleCallback || ((cb: any) => setTimeout(cb, 100)))(async () => {
        if (!isMounted) return;
        
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const tempDiv = document.createElement('div');
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
        
        try {
          const sanitized = sanitizeMermaid(chart);
          const { svg } = await mermaid.render(id, sanitized, tempDiv);
          if (isMounted) {
            setSvgContent(svg);
            if (ref.current) ref.current.innerHTML = svg;
            setLoading(false);
            setError(null);
          }
        } catch (err: any) {
          if (isMounted) {
            console.error('Mermaid render error:', err?.message || err);
            // Provide a cleaner error message instead of the raw SVG text
            setError('Syntax error in diagram. Waiting for AI to correct it...');
            setLoading(false);
          }
        } finally {
          // Cleanup temporary container and any orphaned elements Mermaid leaves behind on error
          tempDiv.remove();
          const orphanedSvg = document.getElementById(`d${id}`);
          if (orphanedSvg) orphanedSvg.remove();
          
          // Mermaid sometimes leaves a generic error element with id="dmermaid" or similar
          const genericOrphan = document.getElementById('d' + id);
          if (genericOrphan) genericOrphan.remove();
          
          // Also try to find any elements with 'error-icon' that Mermaid might have injected directly into the body
          document.querySelectorAll('svg[id^="dmermaid-"]').forEach(el => el.remove());
        }
      });

      return () => {
        if (window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      };
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [chart]);

  // Escape key closes fullscreen
  useEffect(() => {
    if (!fullscreen) {
      setZoom(1); // Reset zoom on close
      return;
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [fullscreen]);

  // Lock body scroll when fullscreen is open
  useEffect(() => {
    document.body.style.overflow = fullscreen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [fullscreen]);

  // Zoom with mouse scroll
  useEffect(() => {
    if (!fullscreen) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(prev => {
        const delta = e.deltaY > 0 ? -0.15 : 0.15;
        return Math.min(Math.max(0.5, prev + delta), 6);
      });
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [fullscreen]);

  return (
    <>
      <div className="relative group flex justify-center items-center p-4 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1e1e1e] min-h-[100px] overflow-x-auto overflow-y-hidden my-4">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/30 z-10">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          </div>
        )}
        {error ? (
          <div className="w-full overflow-x-auto bg-slate-50 dark:bg-black/20 p-4 rounded-lg font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {chart}
          </div>
        ) : (
          <>
            <div ref={ref} className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto" />
            {svgContent && (
              <button
                onClick={() => setFullscreen(true)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 dark:text-slate-300"
                title="View fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Fullscreen Lightbox — portaled to body */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {fullscreen && svgContent && (
            <motion.div
              key="mermaid-lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 dark:bg-black/95 backdrop-blur-sm cursor-zoom-out"
              onClick={() => setFullscreen(false)}
            >
              {/* Close button */}
              <button
                className="absolute top-4 right-4 z-[10000] p-2.5 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black/60 dark:text-white/60 transition-all cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setFullscreen(false); }}
                aria-label="Close fullscreen"
              >
                <X className="w-5 h-5" />
              </button>

              {/* SVG rendered fullscreen with Zoom & Pan */}
              <div 
                className="w-full h-full flex items-center justify-center p-10 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  drag
                  dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
                  dragElastic={0.1}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: zoom }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto cursor-grab active:cursor-grabbing"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              </div>

              {/* Hint */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[10000] flex flex-col items-center text-black/40 dark:text-white/40 text-[11px] tracking-wide select-none pointer-events-none">
                <span>Scroll to zoom • Drag to pan</span>
                <span className="opacity-60 mt-0.5">Click backdrop or press Esc to close</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
