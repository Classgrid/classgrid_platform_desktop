/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { X, Sparkles, Loader2, Bot, Copy, Check } from 'lucide-react';
import { ClassroomContent } from '../types/classroom.types';
import { classroomApi } from '../services/classroomApi';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: ClassroomContent | null;
  classroomId?: string;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({ isOpen, onClose, material, classroomId }) => {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !material) return null;

  const handleSummarize = async () => {
    if (!classroomId || !material.id) {
      toast.error('Cannot summarize: missing classroom or material ID');
      return;
    }

    setIsSummarizing(true);
    setSummary(null);

    try {
      const result = await classroomApi.summarizeMaterial(classroomId, material.id);
      setSummary(result.summary || 'No summary could be generated for this document.');
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to summarize';
      toast.error(message);
      setSummary(`⚠️ Could not generate summary: ${message}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopySummary = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast.success('Summary copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleClose = () => {
    setIsSummarizing(false);
    setSummary(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 p-4 sm:p-8 flex flex-col animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between text-white mb-4 shrink-0">
        <div className="flex-1 min-w-0 pr-4">
          <h2 className="text-xl font-bold truncate">{material.title || 'PDF Viewer'}</h2>
          <p className="text-sm text-gray-400 truncate">{material.file_url}</p>
        </div>
        
        <div className="flex items-center gap-4 shrink-0">
          <button 
            onClick={handleSummarize}
            disabled={isSummarizing || summary !== null}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white px-4 py-2 rounded-lg font-medium transition-all active:scale-95"
          >
            {isSummarizing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {isSummarizing ? 'Analyzing...' : 'AI Summarize'}
          </button>
          
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full bg-white rounded-lg overflow-hidden relative flex">
        
        {/* PDF Iframe */}
        <iframe 
          src={material.file_url} 
          title={material.title}
          className="w-full h-full border-none"
        />

        {/* Loading Shimmer Overlay */}
        {isSummarizing && (
          <div className="absolute top-0 right-0 w-full sm:w-96 h-full bg-white border-l border-gray-200 shadow-2xl animate-in slide-in-from-right-8 duration-300 flex flex-col z-10">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2 text-indigo-600 font-bold">
                <Bot size={20} />
                <h3>AI Summary</h3>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
            </div>
          </div>
        )}

        {/* AI Summary Side Panel */}
        {summary && (
          <div className="absolute top-0 right-0 w-full sm:w-96 h-full bg-white border-l border-gray-200 shadow-2xl animate-in slide-in-from-right-8 duration-300 flex flex-col z-10">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2 text-indigo-600 font-bold">
                <Bot size={20} />
                <h3>AI Summary</h3>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleCopySummary}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors"
                  title="Copy summary"
                >
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
                <button 
                  onClick={() => setSummary(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="prose prose-sm prose-indigo max-w-none [&_p]:mb-3 [&_ul]:mb-3 [&_ol]:mb-3 [&_li]:mb-1 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};
