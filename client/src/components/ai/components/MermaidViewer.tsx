import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Loader2 } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    // Debounce: only render after 1500ms of no changes (i.e. streaming has fully stopped)
    const timer = setTimeout(() => {
      if (!isMounted) return;

      // Use requestIdleCallback to run off the main thread and avoid freezing the UI
      const idleId = (window.requestIdleCallback || ((cb: any) => setTimeout(cb, 100)))(async () => {
        if (!isMounted) return;
        try {
          const sanitized = sanitizeMermaid(chart);
          const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
          const { svg } = await mermaid.render(id, sanitized);
          if (isMounted && ref.current) {
            ref.current.innerHTML = svg;
            setLoading(false);
            setError(null);
          }
        } catch (err: any) {
          if (isMounted) {
            console.error('Mermaid render error:', err?.message || err);
            setError(err?.message?.split('\n')[0] || 'Failed to render diagram');
            setLoading(false);
          }
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

  return (
    <div className="relative flex justify-center items-center p-4 border rounded-xl bg-white dark:bg-[#1e1e1e] min-h-[100px] overflow-x-auto overflow-y-hidden my-4">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/30 z-10">
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        </div>
      )}
      {error ? (
        <div className="text-red-500 text-sm flex flex-col items-center">
          <span className="font-semibold mb-1">Diagram Error</span>
          <code className="text-xs max-w-full overflow-hidden text-ellipsis">{error}</code>
        </div>
      ) : (
        <div ref={ref} className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto" />
      )}
    </div>
  );
};
