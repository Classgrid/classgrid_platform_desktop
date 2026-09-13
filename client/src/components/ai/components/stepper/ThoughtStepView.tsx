import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

interface ThoughtStepViewProps {
  title: string;
  details: string;
}

export function ThoughtStepView({ title, details }: ThoughtStepViewProps) {
  if (!details || details.trim().length === 0) return null;
  
  return (
    <div className="relative z-10 flex flex-col group/thought">
      <div className="flex items-start gap-3 p-1 -ml-1">
        {/* Alignment spacer matching AgentStepAccordion's icon */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
        </div>
        
        <div className="flex-1 min-w-0 pt-[3px]">
          <Accordion type="single" collapsible defaultValue="thought" className="mb-4">
            <AccordionItem value="thought" className="border-none">
              <AccordionTrigger className="w-fit flex-none justify-start gap-1.5 h-auto text-[12px] font-medium text-muted-foreground hover:text-foreground hover:no-underline transition-colors cursor-pointer [&>svg]:size-3.5 [&>svg]:ml-0 py-1">
                <span>Thought</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-2">
                <div className="flex flex-col gap-1.5 text-[14px] leading-[20px] font-sans whitespace-pre-wrap max-h-[400px] overflow-y-auto custom-scrollbar">
                  <div className="font-semibold text-slate-900 dark:text-white">{title}</div>
                  <div className="text-slate-700 dark:text-[#a3a3a3]">{details.trim()}</div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
