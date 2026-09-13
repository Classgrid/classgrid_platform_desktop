import React, { ReactNode } from 'react';
import { AgentStepAccordion } from './AgentStepAccordion';
import { AgentStepper } from './AgentStepper';
import { ThoughtStepView } from './ThoughtStepView';
import { SimpleLogStepView } from './SimpleLogStepView';
import { KnowledgeBaseSearchView } from './KnowledgeBaseSearchView';
import { FileText, Plane, Network } from 'lucide-react';

export type WorkflowStepType = 
  | 'thought' 
  | 'log' 
  | 'knowledge_search';

export interface WorkflowStep {
  id: string | number;
  type: WorkflowStepType;
  title?: string;
  details?: string;
  text?: string;
  icon?: 'plane' | 'file' | 'network';
  results?: Array<{
    title: string;
    source?: string;
    icon?: 'plane' | 'file' | 'network';
  }>;
}

interface WorkflowAccordionProps {
  title: string;
  steps: WorkflowStep[];
  defaultExpanded?: boolean;
}

// Helper to resolve icon strings to components
const resolveIcon = (iconName?: string) => {
  if (iconName === 'plane') return <Plane className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />;
  if (iconName === 'file') return <FileText className="w-4 h-4" strokeWidth={2} />;
  if (iconName === 'network') return <Network className="w-4 h-4" strokeWidth={1.5} />;
  return undefined;
};

export function WorkflowAccordion({ title, steps, defaultExpanded = true }: WorkflowAccordionProps) {
  return (
    <AgentStepAccordion 
      title={`${steps.length} steps`}
      status="success" 
      defaultExpanded={defaultExpanded}
    >
      <AgentStepper>
        {steps.map((step) => {
          if (step.type === 'thought') {
            return (
              <ThoughtStepView 
                key={step.id}
                title={step.title || ""}
                details={step.details || ""}
              />
            );
          }
          
          if (step.type === 'log') {
            return (
              <SimpleLogStepView 
                key={step.id}
                text={step.text || ""} 
                icon={resolveIcon(step.icon)}
              />
            );
          }

          if (step.type === 'knowledge_search') {
            return (
              <KnowledgeBaseSearchView 
                key={step.id}
                providerIcon={<div className="w-4 h-4 bg-black dark:bg-white text-white dark:text-black rounded-sm flex items-center justify-center text-[10px] font-bold">N</div>}
                results={step.results?.map(r => ({
                  ...r,
                  icon: resolveIcon(r.icon)
                }))}
              />
            );
          }

          return null;
        })}
      </AgentStepper>
    </AgentStepAccordion>
  );
}
