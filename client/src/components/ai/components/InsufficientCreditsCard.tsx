import React from 'react';
import { XCircle } from 'lucide-react';
import { Button } from '../ui/button';

export interface InsufficientCreditsCardProps {
  onDismiss: () => void;
  onSeePlans: () => void;
  onPurchase: () => void;
  refreshDate: Date;
}

export function InsufficientCreditsCard({ 
  onDismiss, 
  onSeePlans, 
  onPurchase, 
  refreshDate 
}: InsufficientCreditsCardProps) {
  
  // Format the date to look exactly like the screenshot: "9/25/2026, 5:24:01 PM"
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(refreshDate);

  return (
    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#1C1C1C]">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <XCircle className="h-5 w-5 text-slate-400 dark:text-slate-500" />
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
          Insufficient AI Credits
        </h3>
      </div>

      {/* Body Text (No specific model mentioned, completely generalized for Classgrid) */}
      <p className="mb-5 text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
        You need at least 50 AI Credits to send messages. To continue using the AI now, 
        purchase more AI Credits. Your plan's baseline quota will refresh on {formattedDate}.
      </p>

      {/* Buttons */}
      <div className="flex items-center justify-between mt-2">
        <Button 
          variant="secondary" 
          onClick={onDismiss}
          className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Dismiss
        </Button>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            onClick={onSeePlans}
            className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            See Plans
          </Button>
          <Button 
            variant="default" 
            onClick={onPurchase}
            className="bg-[#0070F3] text-white hover:bg-[#0060d1]"
          >
            Purchase Credits
          </Button>
        </div>
      </div>
    </div>
  );
}
