import React from 'react';
import { UploadCloud } from 'lucide-react';
import { ToolOutputContainer } from './ToolOutputContainer';

interface CdnUploadViewProps {
  fileName: string;
  fileSize?: string;
  url: string;
}

export function CdnUploadView({ fileName, url }: CdnUploadViewProps) {
  return (
    <ToolOutputContainer
      icon={<UploadCloud className="text-slate-400 dark:text-[#a3a3a3]" strokeWidth={1.5} />}
      toolName="CDN"
      badge="Alpha"
      actionName="Public file upload"
    >
      <div className="p-3 flex flex-col gap-2">
        <span className="text-[14px] leading-[20px] text-slate-700 dark:text-[#d4d4d4] break-words">
          Uploaded {fileName} to the global CDN
        </span>
        <a 
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-[13px] text-blue-600 dark:text-blue-400 hover:underline font-mono truncate max-w-full"
        >
          {url}
        </a>
      </div>
    </ToolOutputContainer>
  );
}
