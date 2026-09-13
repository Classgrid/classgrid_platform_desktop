/*
 * =========================================================================================
 * 🚨 CRITICAL AI & SYSTEM RULE 🚨
 * NO FRONTEND GITHUB ACTIONS: NEVER create yaml files that build/deploy the frontend to EC2.
 * The frontend is hosted 100% on Vercel. EC2 is only for the backend.
 * =========================================================================================
 */

import React from 'react';
import { Laptop } from 'lucide-react';
import { ToolOutputContainer } from './ToolOutputContainer';

interface FileActionViewProps {
  fileName: string;
}

export function FileActionView({ fileName }: FileActionViewProps) {
  return (
    <ToolOutputContainer
      icon={<Laptop className="text-slate-400 dark:text-[#a3a3a3]" strokeWidth={1.5} />}
      toolName="Computer"
      badge="Alpha"
      actionName="Shared file"
    >
      <div className="p-3">
        <span className="text-[14px] leading-[20px] text-slate-700 dark:text-[#d4d4d4] break-words">
          Uploaded {typeof fileName === 'object' ? JSON.stringify(fileName) : fileName} to the computer
        </span>
      </div>
    </ToolOutputContainer>
  );
}
