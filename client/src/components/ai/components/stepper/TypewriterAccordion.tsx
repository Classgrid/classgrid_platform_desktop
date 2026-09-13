"use client";

import React, { useEffect, useRef, useState } from "react";

const SENT_H = 40; // 2 lines × 20px
const GAP = 4;
const MAX_H = 180;
const FADE = 16;

interface TypewriterAccordionProps {
  sentences: string[];
  onComplete?: () => void;
}

export function TypewriterAccordion({ sentences, onComplete }: TypewriterAccordionProps) {
  const [fade, setFade] = useState({ top: false, bottom: true });
  const viewportRef = useRef<HTMLDivElement>(null);

  // Typewriter states
  const [displayedSentences, setDisplayedSentences] = useState<string[]>([]);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);

  // Typewriter effect (Word-by-Word without Loop)
  useEffect(() => {
    if (!sentences || sentences.length === 0) return;

    if (currentSentenceIdx >= sentences.length) {
      if (onComplete) onComplete();
      return;
    }

    const fullSentence = sentences[currentSentenceIdx];
    const words = fullSentence.split(' ');
    let wordIndex = 0;

    const typingInterval = setInterval(() => {
      wordIndex++;
      
      setDisplayedSentences((prev) => {
        const next = [...prev];
        next[currentSentenceIdx] = words.slice(0, wordIndex).join(' ') + (wordIndex < words.length ? ' ' : '');
        return next;
      });

      if (wordIndex >= words.length) {
        clearInterval(typingInterval);
        setTimeout(() => {
          setCurrentSentenceIdx((prev) => prev + 1);
        }, 400); // slight pause between sentences
      }
    }, 120); // 120ms per word is a medium/readable speed

    return () => clearInterval(typingInterval);
  }, [currentSentenceIdx, sentences]);

  const count = displayedSentences.length;
  
  // Auto-scroll to keep typing cursor in view
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [displayedSentences]);

  const onScroll = () => {
    const el = viewportRef.current;
    if (!el) return;
    setFade({
      top: el.scrollTop > 1,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 1,
    });
  };

  const isScrollable = viewportRef.current ? viewportRef.current.scrollHeight > MAX_H : false;
  const showTop = fade.top;
  const showBottom = isScrollable ? fade.bottom : false;
  const mask = isScrollable
    ? `linear-gradient(to bottom, transparent 0, #000 ${showTop ? FADE : 0}px, #000 calc(100% - ${showBottom ? FADE : 0}px), transparent 100%)`
    : "none";

  return (
    <div className="flex flex-col w-[360px] max-w-full font-sans">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* VIEWPORT STREAM */}
      <div className="min-h-0 overflow-hidden">
        <div
          ref={viewportRef}
          className="mt-1.5 overflow-hidden transition-[height] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] overflow-y-auto"
          style={{ 
            maxHeight: `${MAX_H}px`, 
            WebkitMaskImage: mask, 
            maskImage: mask,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          onScroll={onScroll}
        >
          <style>{`.overflow-y-auto::-webkit-scrollbar { display: none; }`}</style>
          
          <div className="flex flex-col gap-2">
            {displayedSentences.map((line, i) => (
              <p 
                key={i} 
                className="m-0 leading-[20px] text-[13px] font-[425] text-slate-500 dark:text-[#737373] tracking-tight animate-[fadeIn_420ms_cubic-bezier(0.22,1,0.36,1)]"
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
