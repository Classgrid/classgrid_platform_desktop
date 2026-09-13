import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

export function MasterWorkflowWrapper({ children, totalSteps = 6 }: { children: React.ReactNode, totalSteps?: number }) {
  const [phase, setPhase] = useState<'thinking' | 'executing' | 'finished'>('thinking');
  const [expanded, setExpanded] = useState(false);
  const [timer, setTimer] = useState(0);

  // Timer counts up while thinking or executing
  useEffect(() => {
    if (phase === 'finished') return;
    const interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    // 5 seconds of thinking
    const t1 = setTimeout(() => {
      setPhase('executing');
      setExpanded(true); // Ensure it's expanded during execution
    }, 5000);

    // Finish after thinking (5s) + typing (2s) + steps (0.5s each)
    const executionTimeMs = 5000 + 2000 + (totalSteps * 500);
    const t2 = setTimeout(() => {
      setPhase('finished');
      setExpanded(false); // Auto-collapse when finished!
    }, executionTimeMs);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [totalSteps]);

  if (phase === 'thinking') {
    return (
      <div className="mb-4 flex items-center gap-2 p-2 pl-4">
        <p className="bg-[linear-gradient(110deg,#404040,35%,#fff,50%,#404040,75%,#404040)] bg-[length:200%_100%] bg-clip-text text-[14px] font-medium text-transparent animate-[shimmer_2.5s_linear_infinite]">
          Thinking
        </p>
        <span className="text-sm text-muted-foreground mt-0.5">
          {timer}s
        </span>
      </div>
    );
  }

  if (phase === 'executing') {
    return (
      <div className="mb-4">
        {children}
      </div>
    );
  }

  // finished phase
  return (
    <div className="mb-4">
      {children}
    </div>
  );
}
