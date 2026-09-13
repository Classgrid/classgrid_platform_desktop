import React from 'react';
import { cn } from '@/lib/utils';

interface AgentStepperProps {
  children: React.ReactNode;
  className?: string;
}

export function AgentStepper({ children, className }: AgentStepperProps) {
  return (
    // The pseudo-element creates the vertical connector line perfectly aligned with the dots
    <div className={cn("relative flex flex-col gap-2 pl-2 before:absolute before:top-6 before:bottom-4 before:left-[23px] before:w-[2px] before:bg-slate-200 dark:before:bg-[#2a2a2a]", className)}>
      {children}
    </div>
  );
}
