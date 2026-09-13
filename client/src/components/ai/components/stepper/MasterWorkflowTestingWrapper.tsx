import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MasterWorkflowTestingWrapper({
  children,
  title,
  totalTimeMs = 10000 // 5s thinking + 5s execution
}: {
  children: React.ReactNode,
  title?: string,
  totalTimeMs?: number
}) {
  const [isFinished, setIsFinished] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    console.log('MasterBox Mounted! totalTimeMs:', totalTimeMs);
    const timeout = setTimeout(() => {
      console.log('MasterBox Timeout Fired!');
      setIsFinished(true);
    }, totalTimeMs);
    return () => clearTimeout(timeout);
  }, [totalTimeMs]);

  return (
    <div className="relative">
      {/* Master Box Header - Only visible when finished */}
      {isFinished && (
        <button
          className="flex items-center gap-3 cursor-pointer hover:bg-muted/30 rounded-lg p-1 pr-3 -ml-1 transition-colors w-full text-left mb-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* No Stepper Dot for Master Box */}

          <div className="flex items-center gap-1.5">
            <ChevronRight
              className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", isExpanded ? "rotate-90" : "")}
            />
            <span className="font-medium text-[14px] text-slate-800 dark:text-[#eeeeee] bg-[linear-gradient(110deg,#404040,35%,#fff,50%,#404040,75%,#404040)] bg-[length:200%_100%] bg-clip-text text-transparent">
              Worked for {Math.round(totalTimeMs / 1000)} sec
            </span>
          </div>
        </button>
      )}

      {/* Children container */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isFinished && !isExpanded ? "opacity-0 h-0 overflow-hidden" : "opacity-100 h-auto",
        isFinished && isExpanded ? "mt-2" : ""
      )}>
        {children}
      </div>
    </div>
  );
}
