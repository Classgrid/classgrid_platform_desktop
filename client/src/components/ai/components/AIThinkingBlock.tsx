"use client";

import { Card } from "@/components/marketing_ui/card";
import { Loader } from "./ui/loader";
import { useEffect, useRef, useState } from "react";

export default function AIThinkingBlock({ thinkingContent, isFinished }: { thinkingContent?: string, isFinished?: boolean }) {
const [scrollPosition, setScrollPosition] = useState(0);
const contentRef = useRef<HTMLDivElement>(null);
const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

const ThinkingContent = thinkingContent || "";

const [timer, setTimer] = useState(0);

useEffect(() => {
  if (isFinished) return;
  const timerInterval = setInterval(() => {
    setTimer((prev) => prev + 1);
  }, 1000);

  return () => {
    clearInterval(timerInterval);
  };
}, [isFinished]);

useEffect(() => {
  if (isFinished) {
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    return;
  }
  if (contentRef.current) {
    const scrollHeight = contentRef.current.scrollHeight;
    const clientHeight = contentRef.current.clientHeight;
    const maxScroll = scrollHeight - clientHeight;

    scrollIntervalRef.current = setInterval(() => {
      setScrollPosition((prev) => {
        const newPosition = prev + 1;
        if (newPosition >= maxScroll) {
          return 0;
        }
        return newPosition;
      });
    }, 5);

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }
}, [ThinkingContent, isFinished]);

useEffect(() => {
  if (contentRef.current && !isFinished) {
    contentRef.current.scrollTop = scrollPosition;
  }
}, [scrollPosition, isFinished]);

return (
  <>
    <div className="flex flex-col p-3 max-w-xl">
      <div className="flex items-center justify-start gap-2 mb-4">
        {/* {!isFinished && <Loader size={"sm"} />} */}
        <p
          className="bg-[linear-gradient(110deg,#404040,35%,#fff,50%,#404040,75%,#404040)] bg-[length:200%_100%] bg-clip-text text-base text-transparent animate-[shimmer_5s_linear_infinite]"
          style={{
            animation: isFinished ? "none" : "shimmer 5s linear infinite",
          }}
        >
          Thinking
        </p>
        <span className="text-sm text-muted-foreground">
          {timer}s
        </span>
        <style>{`
          @keyframes shimmer {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
        `}</style>
      </div>
      {/* Hidden thinking content box as per user request */}
    </div>
  </>
);
}
