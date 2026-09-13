import React from 'react';
import { cn } from '@/lib/utils';

interface SimpleLogStepViewProps {
  text: React.ReactNode;
  icon?: React.ReactNode;
}

export function SimpleLogStepView({ text, icon }: SimpleLogStepViewProps) {
  return (
    <div className="relative z-10 flex flex-col">
      <div className="flex items-center gap-3 p-1 pr-3 -ml-1">
        {/* Tiny Stepper Dot (matches ThoughtStepView) */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-[#4a4a4a] transition-colors" />
        </div>
        
        <div className="flex items-center gap-2 font-medium text-[14px] text-slate-500 dark:text-[#8a8a8a]">
          {icon && <span className="flex shrink-0 opacity-80">{icon}</span>}
          <span>{text}</span>
        </div>
      </div>
    </div>
  );
}
