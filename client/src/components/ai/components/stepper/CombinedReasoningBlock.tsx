import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { TypewriterAccordion } from './TypewriterAccordion';

export function CombinedReasoningBlock({ sentences, forceThinkingMode = false }: { sentences: string[], forceThinkingMode?: boolean }) {
  const [isFinished, setIsFinished] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const [timer, setTimer] = useState(0);
  const [expanded, setExpanded] = useState(true);

  // Timer logic
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  // Finish after 5 seconds
  useEffect(() => {
    if (forceThinkingMode) return;
    const timeout = setTimeout(() => {
      setIsFinished(true);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [forceThinkingMode]);

  return (
    <div className={`relative z-10 flex flex-col group/accordion mb-2 ${!isFinished ? 'is-thinking' : ''} combined-reasoning-block`}>
      {/* Steps visibility is now perfectly handled by AgentStepper CSS */}
      <button
        onClick={() => { if (isFinished) setExpanded((prev) => !prev) }}
        className={`flex items-center gap-3 rounded-lg p-1 pr-3 -ml-1 transition-colors ${
          isFinished ? 'cursor-pointer hover:bg-muted/30' : 'cursor-default'
        }`}
      >
        {/* Stepper Dot Area - Matches AgentStepAccordion exactly */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full py-1 relative z-20">
          {isFinished && (
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 transition-colors" />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isFinished && (
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

      {/* Accordion Content */}
      <div
        className={`grid transition-all duration-200 ease-in-out ${
          expanded && isFinished ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pl-[36px] pr-2 pb-4">
            {isFinished && <TypewriterAccordion sentences={sentences} onComplete={() => setIsTyping(false)} />}
          </div>
        </div>
      </div>
      
      {!isFinished && (
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      )}
    </div>
  );
}
