import React from 'react';
import { XCircle, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

export interface InsufficientCreditsCardProps {
  onDismiss: () => void;
  onUpgrade: () => void;
  refreshDate: Date;
}

export function InsufficientCreditsCard({
  onDismiss,
  onUpgrade,
  refreshDate
}: InsufficientCreditsCardProps) {
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
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <XCircle className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold text-card-foreground">
          Insufficient AI Credits
        </h3>
      </div>

      {/* Body Text */}
      <p className="mb-5 text-[15px] leading-relaxed text-muted-foreground">
        You need at least 50 AI Credits to send messages. To continue using the AI now,
        purchase more AI Credits. Your plan's baseline quota will refresh on {formattedDate}.
      </p>

      {/* Buttons */}
      <div className="flex items-center justify-between mt-2">
        <Button
          variant="outline"
          onClick={onDismiss}
        >
          Dismiss
        </Button>

        <Button
          variant="outline"
          onClick={onUpgrade}
          className="relative h-10 rounded-lg border-border bg-accent px-4 md:px-6 text-sm font-medium tracking-tight text-foreground/90 transition-all duration-200 hover:bg-slate-200 dark:hover:bg-accent/80 hover:border-border hover:text-foreground cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Purchase Credits
        </Button>
      </div>
    </div>
  );
}
