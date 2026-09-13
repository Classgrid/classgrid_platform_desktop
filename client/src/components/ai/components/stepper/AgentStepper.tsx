import React from 'react';
import { cn } from '@/lib/utils';

interface AgentStepperProps {
  children: React.ReactNode;
  className?: string;
}

export function AgentStepper({ children, className }: AgentStepperProps) {
  // Generate CSS for up to 30 children to cascade their animations
  const cascadeCss = Array.from({ length: 30 }).map((_, i) => `
    .stepper-container > *:nth-child(${i + 1}) { 
      animation-delay: ${i === 0 ? 0 : i * 150}ms; 
    }
  `).join('');

  return (
    // The pseudo-element creates the vertical connector line perfectly aligned with the dots
    <div className={cn("relative flex flex-col gap-2 pl-2 before:absolute before:top-6 before:bottom-4 before:left-[23px] before:w-[2px] before:bg-slate-200 dark:before:bg-[#2a2a2a] stepper-container", className)}>
      <style>{`
        .stepper-container > * {
          animation: stepFadeIn 0.5s ease-out forwards;
          opacity: 0;
        }
        .stepper-container > *:nth-child(1) {
          opacity: 1; /* First element (usually Thought) appears instantly */
          animation: none;
        }
        @keyframes stepFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stepper-container:has(.is-thinking)::before {
          display: none !important;
        }
        ${cascadeCss}
      `}</style>
      {children}
    </div>
  );
}
