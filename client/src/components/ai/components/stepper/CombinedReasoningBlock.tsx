/*
 * =========================================================================================
 * 🚨 CRITICAL AI & SYSTEM RULE 🚨
 * NO FRONTEND GITHUB ACTIONS: NEVER create yaml files that build/deploy the frontend to EC2.
 * The frontend is hosted 100% on Vercel. EC2 is only for the backend.
 * =========================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { TypewriterAccordion } from './TypewriterAccordion';

/**
 * CombinedReasoningBlock - Shows AI reasoning LIVE as it streams in.
 * 
 * Phase 1: Shimmer "Thinking..." (no sentences yet)
 * Phase 2: Live typing - sentences stream in from SSE, displayed immediately
 * Phase 3: Finished - collapsible accordion
 */
export function CombinedReasoningBlock({ sentences, isStreaming = true }: { sentences: string[]; isStreaming?: boolean }) {
  const [timer, setTimer] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const viewportRef = useRef<HTMLDivElement>(null);

  const hasSentences = sentences && sentences.length > 0;
  // We're "finished" only when streaming stops AND we have content
  const isFinished = hasSentences && !isStreaming;

  // Timer logic for the 'Thinking' label (e.g. 1s, 2s)
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  // Auto-scroll viewport as new sentences stream in
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [sentences]);

  return (
    <div className={`relative z-10 flex flex-col group/accordion mb-2 combined-reasoning-block`}>
      <button
        onClick={() => { if (!isStreaming) setExpanded((prev) => !prev) }}
        className={`flex items-center gap-3 rounded-lg p-1 pr-3 -ml-1 transition-colors ${
          !isStreaming ? 'cursor-pointer hover:bg-muted/30' : 'cursor-default'
        }`}
      >
        {/* Stepper Dot Area */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full py-1 relative z-20">
          {hasSentences && (
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 transition-colors" />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {!isStreaming && hasSentences && (
            <ChevronRight
              className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
            />
          )}
          <p
            className="bg-[linear-gradient(110deg,#404040,35%,#fff,50%,#404040,75%,#404040)] bg-[length:200%_100%] bg-clip-text text-[14px] font-medium text-transparent"
            style={{
              animation: isFinished ? "none" : "shimmer 2.5s linear infinite",
            }}
          >
            {isFinished ? "Thought" : "Thinking"}
          </p>
          {!isFinished && (
            <span className="text-sm text-muted-foreground relative z-20">
              {timer}s
            </span>
          )}
        </div>
      </button>

      {/* Live Streaming Content - ALWAYS visible while streaming or expanded */}
      <div
        className={`grid transition-all duration-200 ease-in-out ${
          (isStreaming && hasSentences) || (expanded && hasSentences) ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pl-[36px] pr-2 pb-4">
            {hasSentences && <TypewriterAccordion sentences={sentences} />}
          </div>
        </div>
      </div>

      {!isFinished && (
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      )}
    </div>
  );
}
