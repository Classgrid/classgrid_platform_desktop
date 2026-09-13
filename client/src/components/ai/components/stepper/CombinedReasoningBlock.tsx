import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { TypewriterAccordion } from './TypewriterAccordion';

export function CombinedReasoningBlock({ sentences }: { sentences: string[] }) {
  const [isTyping, setIsTyping] = useState(true);
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`relative z-10 flex flex-col group/accordion mb-2 combined-reasoning-block`}>
      {/* Hide all subsequent steps in the stepper while typing */}
      {isTyping && (
        <style>{`
          .combined-reasoning-block ~ * {
            display: none !important;
          }
        `}</style>
      )}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-3 rounded-lg p-1 pr-3 -ml-1 transition-colors cursor-pointer hover:bg-muted/30"
      >
        {/* Stepper Dot Area - Matches AgentStepAccordion exactly */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full py-1 relative z-20">
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 transition-colors" />
        </div>

        <div className="flex items-center gap-1.5">
          <ChevronRight
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          />
          <p
            className="bg-[linear-gradient(110deg,#404040,35%,#fff,50%,#404040,75%,#404040)] bg-[length:200%_100%] bg-clip-text text-[14px] font-medium text-transparent"
          >
            Thought
          </p>
        </div>
      </button>

      {/* Accordion Content */}
      <div
        className={`grid transition-all duration-200 ease-in-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
      >
        <div className="overflow-hidden">
          <div className="pl-[36px] pr-2 pb-4">
            <TypewriterAccordion sentences={sentences} onComplete={() => setIsTyping(false)} />
          </div>
        </div>
      </div>
    </div>
  );
}
