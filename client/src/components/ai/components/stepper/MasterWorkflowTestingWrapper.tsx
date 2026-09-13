import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MasterWorkflowTestingWrapper({ 
  children, 
  title,
  totalTimeMs = 10000 // 5s thinking + 5s execution
}: { 
  children: React.ReactNode, 
  title: string,
  totalTimeMs?: number 
}) {
  const [isFinished, setIsFinished] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsFinished(true);
    }, totalTimeMs);
    return () => clearTimeout(timeout);
  }, [totalTimeMs]);

  return (
    <div className="relative">
      {/* Master Box Header - Only visible when finished */}
      {isFinished && (
        <div 
          className="flex items-center gap-3 cursor-pointer hover:bg-muted/30 rounded-lg p-2 transition-colors border border-border/40 bg-card/50 shadow-sm mb-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col flex-1">
            <span className="font-medium text-[14px] text-foreground">{title}</span>
            <span className="text-[12px] text-muted-foreground">Worked for {Math.round(totalTimeMs/1000)} sec</span>
          </div>
          <div className="text-muted-foreground">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </div>
      )}

      {/* Children container */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isFinished && !isExpanded ? "opacity-0 h-0 overflow-hidden" : "opacity-100 h-auto",
        isFinished && isExpanded ? "pl-4 ml-2 border-l-2 border-border/30 mt-4" : ""
      )}>
        {children}
      </div>
    </div>
  );
}
