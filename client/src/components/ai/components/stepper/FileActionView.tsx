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
          Uploaded {fileName} to the computer
        </span>
      </div>
    </ToolOutputContainer>
  );
}
