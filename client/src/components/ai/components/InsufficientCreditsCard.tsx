import React from 'react';
import { XCircle, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

export interface InsufficientCreditsCardProps {
  onDismiss: () => void;
  onOpenAiHub: () => void;
}

export function InsufficientCreditsCard({
  onDismiss,
  onOpenAiHub
}: InsufficientCreditsCardProps) {
  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <XCircle className="h-5 w-5 text-destructive" />
        <h3 className="text-base font-semibold text-card-foreground">
          Insufficient AI Credits
        </h3>
      </div>

      {/* Body Text */}
      <p className="mb-5 text-[15px] leading-relaxed text-muted-foreground">
        You need at least 50 AI Credits to send messages. To continue using the AI now,
        upgrade your plan. Your baseline quota will refresh weekly.
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
          variant="default"
          onClick={onOpenAiHub}
          className="gap-1.5"
        >
          <Sparkles className="w-4 h-4" />
          Open AI Hub
        </Button>
      </div>
    </div>
  );
}
