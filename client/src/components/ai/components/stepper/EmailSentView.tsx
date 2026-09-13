import React from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

interface EmailSentViewProps {
  toCount: number;
  subject: string;
}

export function EmailSentView({ toCount, subject }: EmailSentViewProps) {
  return (
    <div className="flex flex-col">
      {/* The Success Card */}
      <div className="bg-white dark:bg-[#151515] rounded-xl border border-slate-200/80 dark:border-white/10 flex items-center justify-between p-4 shadow-sm dark:shadow-none w-full max-w-[400px]">
        
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Success Icon Box */}
          <div className="h-10 w-10 shrink-0 bg-slate-100/50 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-lg flex items-center justify-center relative">
            <Send className="h-5 w-5 ml-0.5" />
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#151515] rounded-full p-[1px]">
              <CheckCircle2 className="h-4 w-4 text-slate-800 dark:text-slate-100" />
            </div>
          </div>
          
          {/* Info */}
          <div className="flex flex-col overflow-hidden">
            <span className="text-[14px] font-medium text-slate-800 dark:text-[#eeeeee] truncate">
              Email successfully sent
            </span>
            <span className="text-[13px] text-slate-500 dark:text-[#8a8a8a] mt-0.5 truncate">
              Delivered to {toCount} {toCount === 1 ? 'recipient' : 'recipients'}
            </span>
          </div>
        </div>
        
      </div>
    </div>
  );
}
