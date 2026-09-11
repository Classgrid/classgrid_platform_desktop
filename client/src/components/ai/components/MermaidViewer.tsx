import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import mermaid from 'mermaid';
import { Loader2, Maximize2, X, AlertCircle, Copy, Check, Code2, Link as LinkIcon, MoreVertical, FileText } from 'lucide-react';
import { toast } from "sonner";
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

export const MermaidViewer = ({ chart, onRetry }: { chart: string, onRetry?: (errorMsg: string) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(chart);
    setCopied(true);
    toast.success("Code contents copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

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

        try {
          const sanitized = sanitizeMermaid(chart);
          const { svg } = await mermaid.render(id, sanitized);
          if (isMounted) {
            setSvgContent(svg);
            if (ref.current) ref.current.innerHTML = svg;
            setLoading(false);
            setError(null);
          }
        } catch (err: any) {
          if (isMounted) {
            console.error('Mermaid render error:', err?.message || err);
            setError('Repairing diagram...');
            setLoading(false);
            if (onRetry) {
              onRetry(err?.message || "Invalid Mermaid syntax");
            }
            window.dispatchEvent(
              new CustomEvent('trigger-auto-repair', {
                detail: { error: err?.message || err, chart }
              })
            );
          }
        } finally {
          // Cleanup any orphaned elements Mermaid leaves behind on error
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

  const handleDropdownCopy = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy to clipboard");
    } finally {
      setShowDropdown(false);
    }
  };

  return (
    <div className="w-full relative group mermaid-wrapper">
      <div className={`relative flex justify-center items-center p-6 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1e1e1e] min-h-[100px] overflow-visible my-4 ${showCode ? "items-start justify-start !p-4" : ""}`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/30 z-10">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          </div>
        )}
        {error ? (
          <div className="w-full bg-slate-50 dark:bg-black/20 p-4 rounded-lg flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 min-h-[120px] border border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Diagram Incomplete</span>
            </div>
            <span className="text-[13px] text-center max-w-[250px]">{error === 'Repairing diagram...' ? 'The AI made a syntax error. We are repairing it in the background...' : 'The diagram could not be fully rendered due to missing or invalid syntax.'}</span>
          </div>
        ) : (
          <>
            <div ref={ref} className={`w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto ${showCode ? "hidden" : "pt-4 pb-2"}`} />
            {showCode && (
              <div className="w-full max-h-[400px] overflow-y-auto font-mono text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre text-left">
                {chart}
              </div>
            )}

            {/* Linear Style 3-Dot Dropdown */}
            {svgContent && (
              <div className="absolute top-3 -left-8 z-[50]" ref={dropdownRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      transition={{ duration: 0.1 }}
                      className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-[#222] border border-slate-200 dark:border-white/10 rounded-lg shadow-xl py-1 flex flex-col z-[100]"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDropdownCopy(window.location.href, "Diagram URL copied to clipboard");
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 text-left"
                      >
                        <LinkIcon className="w-3.5 h-3.5 opacity-70" />
                        Copy link
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDropdownCopy(svgContent, "Diagram SVG copied to clipboard");
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 text-left"
                      >
                        <Copy className="w-3.5 h-3.5 opacity-70" />
                        Copy diagram
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDropdownCopy(chart, "Code contents copied to clipboard");
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 text-left"
                      >
                        <FileText className="w-3.5 h-3.5 opacity-70" />
                        Copy source
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {svgContent && (
              <div className="absolute top-3 right-3 opacity-80 hover:opacity-100 flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#2a2a2a] shadow-sm border border-slate-200 dark:border-white/5">
                <button
                  onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                  className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 dark:text-slate-300 active:scale-95"
                  title="Copy mermaid source"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCode(!showCode); }}
                  className={`p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-white/20 active:scale-95 ${showCode ? "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/20" : "text-slate-500 dark:text-slate-300"}`}
                  title="View source code"
                >
                  <Code2 className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-3.5 bg-slate-300 dark:bg-white/20 mx-0.5" />
                <button
                  onClick={(e) => { e.stopPropagation(); setFullscreen(true); }}
                  className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 dark:text-slate-300 active:scale-95"
                  title="View fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
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
              {/* Top Right Buttons */}
              <div className="absolute top-4 right-4 z-[10000] flex items-center gap-1 p-1 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-md">
                <button
                  onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                  className="p-2.5 rounded-full hover:bg-black/20 dark:hover:bg-white/20 text-black/60 dark:text-white/60 transition-all cursor-pointer"
                  title="Copy mermaid source"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setShowCode(!showCode)}
                  className={`p-2.5 rounded-full hover:bg-black/20 dark:hover:bg-white/20 transition-all cursor-pointer ${showCode ? "text-indigo-500 bg-black/10 dark:bg-white/10" : "text-black/60 dark:text-white/60"}`}
                  title="Toggle source code"
                >
                  <Code2 className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-black/20 dark:bg-white/20 mx-1" />
                <button
                  className="p-2.5 rounded-full hover:bg-black/20 dark:hover:bg-white/20 text-black/60 dark:text-white/60 transition-all cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setFullscreen(false); }}
                  aria-label="Close fullscreen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Layout Container */}
              <div className="w-full h-full flex" onClick={(e) => e.stopPropagation()}>

                {/* SVG rendered fullscreen with Zoom & Pan */}
                <div className="flex-1 h-full flex items-center justify-center p-10 overflow-hidden relative">
                  <motion.div
                    drag
                    dragMomentum={false}
                    dragElastic={0}
                    dragConstraints={{ left: -4000, right: 4000, top: -4000, bottom: 4000 }}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: zoom }}
                    exit={{ opacity: 0, scale: 0.88 }}
                    transition={{
                      opacity: { duration: 0.2 },
                      scale: { type: "tween", duration: 0 }
                    }}
                    className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto cursor-grab active:cursor-grabbing"
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                  {/* Hint */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[10000] flex flex-col items-center text-black/60 dark:text-white/60 text-[11px] tracking-wide select-none pointer-events-none bg-white/80 dark:bg-black/80 px-4 py-1.5 rounded-full backdrop-blur-md border border-black/5 dark:border-white/5">
                    <span>Scroll to zoom • Drag to pan</span>
                    <span className="opacity-60 mt-0.5">Click backdrop or press Esc to close</span>
                  </div>
                </div>

                {/* Code Pane (Dual View) */}
                {showCode && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="w-[400px] h-full bg-slate-50 dark:bg-[#121212] border-l border-slate-200 dark:border-white/10 flex flex-col pt-20 pb-6 px-6"
                  >
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">Mermaid Source</div>
                    <div className="flex-1 overflow-y-auto font-mono text-[13px] text-slate-700 dark:text-slate-300 whitespace-pre">
                      {chart}
                    </div>
                  </motion.div>
                )}
              </div>


            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
