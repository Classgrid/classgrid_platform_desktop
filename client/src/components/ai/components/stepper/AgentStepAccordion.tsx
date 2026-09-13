import React, { useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepStatus = 'loading' | 'success' | 'error';

interface AgentStepAccordionProps {
  title: React.ReactNode;
  status: StepStatus;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function AgentStepAccordion({
  title,
  status,
  defaultExpanded = false,
  children,
  icon
}: AgentStepAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="relative z-10 flex flex-col group/accordion">
      {/* Header */}
      <div 
        className="flex items-center gap-3 cursor-pointer group-hover/accordion:bg-muted/30 rounded-lg p-1 pr-3 -ml-1 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Tiny Stepper Dot (matches ThoughtStepView) */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full py-1">
          <div className={cn(
            "h-1.5 w-1.5 rounded-full transition-colors",
            status === 'loading' && "bg-muted-foreground/60 animate-pulse",
            status === 'success' && "bg-muted-foreground/40",
            status === 'error' && "bg-destructive/60"
          )} />
        </div>
        
        <div className={cn(
          "flex items-center gap-1.5 font-medium text-[14px]",
          status === 'error' ? "text-red-700 dark:text-[#ff7b72]" : "text-slate-600 dark:text-[#a3a3a3]"
        )}>
          {icon && <span className="text-muted-foreground flex shrink-0 [&>svg]:size-3.5">{icon}</span>}
          <span className="truncate">{title}</span>
          <div className="opacity-50 group-hover/accordion:opacity-100 transition-opacity flex items-center justify-center">
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        "grid transition-all duration-200 ease-in-out",
        isExpanded ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className="pl-[36px] pr-2 pb-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
