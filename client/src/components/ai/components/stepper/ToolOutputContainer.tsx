import React from 'react';
import { cn } from '@/lib/utils';

interface ToolOutputContainerProps {
  icon?: React.ReactNode;
  toolName: string;
  badge?: string;
  actionName: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'transparent';
}

export function ToolOutputContainer({
  icon,
  toolName,
  badge,
  actionName,
  children,
  className,
  variant = 'default'
}: ToolOutputContainerProps) {
  return (
    <div className={cn("flex flex-col gap-2 pl-4", className)}>
      {/* Header (Outside the border) */}
      <div className="flex items-center gap-2 text-[14px] leading-[20px] text-slate-500 dark:text-[#9b9b9b] font-medium py-1 pl-1">
        {icon && <span className="flex shrink-0 [&>svg]:size-4">{icon}</span>}
        <div className="flex items-center gap-2">
          <span>{toolName}</span>
          {badge && (
            <span className="text-[12px] bg-slate-100 text-slate-600 dark:bg-[#2a2a2a] dark:text-[#a3a3a3] px-1.5 py-[1px] rounded-md leading-none font-medium">
              {badge}
            </span>
          )}
          <span className="opacity-40 font-light mx-0.5">/</span>
          <span className="text-slate-900 dark:text-[#eeeeee] font-semibold tracking-wide">{actionName}</span>
        </div>
      </div>
      
      {/* Content */}
      {variant === 'default' ? (
        <div className="bg-[#f9f9f9] dark:bg-[#151515] rounded-xl border border-slate-200 dark:border-[#2a2a2a] flex flex-col overflow-hidden shadow-sm dark:shadow-none">
          {children}
        </div>
      ) : (
        <div className="flex flex-col pl-1">
          {children}
        </div>
      )}
    </div>
  );
}
