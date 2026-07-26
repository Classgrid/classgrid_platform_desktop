import React, { useState } from "react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Clock, User, Globe, Lock, Users, Calendar, Tags, History, Edit3, CheckCircle2 } from "lucide-react";
import { Note } from "../services/notesApi";
import { cn } from "@/lib/utils";
import { getTagColor } from "../utils/noteColors";
import { Button } from "@/components/marketing_ui/button";
import { useNoteVersions } from "../queries/useNotes";
import rehypeRaw from "rehype-raw";

interface NoteViewerProps {
  note: Note;
  onEdit: () => void;
  onRestoreVersion?: (version: any) => void;
}

export function NoteViewer({ note, onEdit, onRestoreVersion }: NoteViewerProps) {
  const [showHistory, setShowHistory] = useState(false);
  const { data: versions = [], isLoading: loadingVersions } = useNoteVersions(showHistory ? note._id : undefined);

  const VisibilityIcon = note.visibility === "Public" ? Globe : note.visibility === "Shared" ? Users : Lock;

  // Clean up legacy HTML tags from rich text editor days
  let displayContent = note.content || "";
  if (displayContent.includes("<div>")) {
    displayContent = displayContent
      .replace(/<div>/g, "")
      .replace(/<\/div>/g, "\n")
      .replace(/<br\s*\/?>/gi, "\n");
  }

  // Auto-detect raw environment variable files and wrap them in a code block for perfect formatting
  if (!displayContent.trim().startsWith("```") && displayContent.includes("MONGO_URI=")) {
    displayContent = "```env\n" + displayContent.trim() + "\n```";
  }

  // Extract headings for Table of Contents
  const headings = displayContent
    .split("\n")
    .filter((line) => line.startsWith("#"))
    .map((line) => {
      const match = line.match(/^(#{1,6})\s+(.+)/);
      if (!match) return null;
      return { level: match[1].length, text: match[2] };
    })
    .filter(Boolean) as { level: number; text: string }[];

  return (
    <div className="flex w-full h-full overflow-hidden">
      <div className="flex-1 min-w-0 h-full overflow-y-auto bg-background relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 relative">
          
          {/* Header Actions */}
          <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex flex-wrap justify-end gap-2 z-10">
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className={showHistory ? "bg-accent" : ""}>
              <History className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">History</span>
            </Button>
            <Button size="sm" onClick={onEdit}>
              <Edit3 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit Note</span>
            </Button>
          </div>

          {/* Title Area */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 pt-12 sm:pt-0 pr-0 sm:pr-48 relative min-w-0">
            <span className="text-5xl shrink-0">{note.icon || "📄"}</span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground break-words min-w-0" style={{ overflowWrap: 'anywhere' }}>
              {note.title}
            </h1>
          </div>

          {/* Beautiful Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-12 p-6 rounded-2xl bg-card border shadow-sm">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Created
              </span>
              <span className="text-sm font-medium">{format(new Date(note.createdAt), "dd MMM yyyy")}</span>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Last Edited
              </span>
              <span className="text-sm font-medium">{format(new Date(note.updatedAt), "h:mm a")}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Visibility
              </span>
              <span className="text-sm font-medium flex items-center gap-1.5">
                <VisibilityIcon className="w-3.5 h-3.5 text-emerald-500" />
                {note.visibility || "Private"}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Tags className="w-3.5 h-3.5" /> Tags
              </span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {note.tags?.length ? note.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border", getTagColor(tag))}>
                    {tag}
                  </span>
                )) : <span className="text-sm text-muted-foreground">No tags</span>}
                {note.tags?.length > 2 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                    +{note.tags.length - 2}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-12">
            {/* Markdown Content */}
            <div className="flex-1 min-w-0 pb-32">
              <div 
                className="prose prose-emerald dark:prose-invert max-w-full prose-headings:scroll-mt-6 prose-img:rounded-xl break-words prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-p:text-sm prose-p:leading-relaxed prose-li:text-sm" 
                style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
              >
                {displayContent ? (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {displayContent}
                  </ReactMarkdown>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl opacity-60">
                    <Edit3 className="w-12 h-12 mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No content yet</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                      Click the Edit button to start writing your note using Markdown.
                    </p>
                    <Button variant="outline" className="mt-6" onClick={onEdit}>Start Writing</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Version History Sidebar */}
      {showHistory && (
        <div className="w-80 shrink-0 border-l bg-card flex flex-col h-full z-10">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <History className="w-4 h-4" /> Version History
            </h3>
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setShowHistory(false)}>
              &times;
            </Button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {loadingVersions ? (
              <div className="text-sm text-muted-foreground text-center p-4">Loading history...</div>
            ) : versions.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center p-4">No previous versions</div>
            ) : (
              <div className="space-y-4">
                <div className="relative pl-4 border-l-2 border-emerald-500/50 pb-4">
                  <div className="absolute w-2 h-2 bg-emerald-500 rounded-full -left-[5px] top-1.5" />
                  <div className="text-sm font-medium">Current Version</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Active now
                  </div>
                </div>
                {versions.map((v, i) => (
                  <div key={v._id} className={cn("relative pl-4 border-l-2", i === versions.length - 1 ? "border-transparent" : "border-border/50")}>
                    <div className="absolute w-2 h-2 bg-muted-foreground/30 rounded-full -left-[5px] top-1.5" />
                    <div className="text-sm font-medium">{format(new Date(v.createdAt), "MMM d, h:mm a")}</div>
                    {onRestoreVersion && (
                      <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-xs text-emerald-500" onClick={() => onRestoreVersion(v)}>
                        Restore this version
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
