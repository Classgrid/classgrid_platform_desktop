import { useState } from 'react';
import { Check, Copy, Mail, MessageSquare, Terminal } from 'lucide-react';

export function CopyBlockClient({ text, label = 'copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-6 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] overflow-hidden text-sm shadow-sm dark:shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-end px-3 py-1.5 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#1f1f23] min-h-[36px]">
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5"
          title="Copy text"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 text-slate-700 dark:text-zinc-300 text-[15px] leading-relaxed whitespace-pre-wrap break-words font-sans">
        {text}
      </div>
    </div>
  );
}
