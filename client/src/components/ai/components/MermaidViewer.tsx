import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Loader2 } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

export const MermaidViewer = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const renderChart = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted && ref.current) {
          ref.current.innerHTML = svg;
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Mermaid render error:', err);
          setError(err.message || 'Failed to render diagram');
          setLoading(false);
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  return (
    <div className="relative flex justify-center items-center p-4 border rounded-xl bg-white min-h-[100px] overflow-x-auto overflow-y-hidden my-4">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
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
