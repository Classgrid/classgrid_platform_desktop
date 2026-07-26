import React, { useState } from "react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Clock, Globe, Lock, Users, Calendar, Tags, History, Edit3, CheckCircle2, Pin, Copy, Trash2, ChevronDown, FileText, Code2 } from "lucide-react";
import { toast } from "sonner";
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
  onTogglePin?: () => void;
  onDelete?: () => void;
}

export function NoteViewer({ note, onEdit, onRestoreVersion, onTogglePin, onDelete }: NoteViewerProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showCopyMenu, setShowCopyMenu] = useState(false);
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

  // Plain text: strip markdown symbols
  const plainText = note.textContent || displayContent
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```\w*\n?/g, "").trim())
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/>/g, "")
    .trim();

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
          <div className="flex flex-wrap justify-end gap-3 mb-6 pt-2">
            {onTogglePin && (
              <Button
                variant="outline"
                size="sm"
                onClick={onTogglePin}
                className={note.isPinned
                  ? "text-amber-500 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:text-amber-600"
                  : ""}
              >
                <Pin className={cn("w-4 h-4 sm:mr-2", note.isPinned ? "fill-amber-500" : "")} />
                <span className="hidden sm:inline">{note.isPinned ? "Unpin" : "Pin"}</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className={showHistory ? "bg-accent" : ""}
            >
              <History className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">History</span>
            </Button>

            {/* Copy Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCopyMenu(!showCopyMenu)}
                onBlur={() => setTimeout(() => setShowCopyMenu(false), 150)}
              >
                <Copy className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Copy</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
              {showCopyMenu && (
                <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 duration-100">
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent rounded-t-lg transition-colors text-left"
                    onMouseDown={() => {
                      navigator.clipboard.writeText(plainText);
                      toast.success("Copied as plain text!");
                      setShowCopyMenu(false);
                    }}
                  >
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Copy as Text
                  </button>
                  <div className="h-px bg-border mx-2" />
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent rounded-b-lg transition-colors text-left"
                    onMouseDown={() => {
                      navigator.clipboard.writeText(note.content || "");
                      toast.success("Copied as Markdown!");
                      setShowCopyMenu(false);
                    }}
                  >
                    <Code2 className="w-4 h-4 text-muted-foreground" />
                    Copy as Markdown
                  </button>
                </div>
              )}
            </div>

            <Button size="sm" onClick={onEdit}>
              <Edit3 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit Note</span>
            </Button>

            {onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            )}
          </div>

          {/* Title Area - 100% width */}
          <div className="flex items-center gap-4 min-w-0 mb-8 w-full">
            <span className="text-4xl sm:text-5xl shrink-0">{note.icon || "📄"}</span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground break-words min-w-0 w-full">
              {note.title}
            </h1>
          </div>

          {/* Beautiful Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-12 p-6 rounded-2xl bg-card border shadow-sm">
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
              <div className="prose prose-emerald dark:prose-invert max-w-full prose-headings:scroll-mt-6 prose-img:rounded-xl prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-p:text-sm prose-p:leading-relaxed prose-li:text-sm overflow-x-auto">
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

      {/* Version History Sidebar (Overlay) */}
      {showHistory && (
        <div className="absolute top-0 right-0 w-80 max-w-[calc(100vw-2rem)] border-l bg-card flex flex-col h-full z-50 shadow-2xl animate-in slide-in-from-right-8 duration-200">
          <div className="p-4 border-b flex items-center justify-between bg-muted/30">
            <h3 className="font-medium flex items-center gap-2 text-foreground">
              <History className="w-4 h-4 text-muted-foreground" /> Version History
            </h3>
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-background" onClick={() => setShowHistory(false)}>
              <span className="text-lg">&times;</span>
            </Button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-5">
            {loadingVersions ? (
              <div className="text-sm text-muted-foreground text-center p-4">Loading history...</div>
            ) : versions.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center p-4">No previous versions</div>
            ) : (
              <div className="space-y-5">
                <div className="relative pl-5 border-l-2 border-emerald-500/50 pb-5">
                  <div className="absolute w-2.5 h-2.5 bg-emerald-500 rounded-full -left-[5.5px] top-1" />
                  <div className="text-sm font-medium text-foreground">Current Version</div>
                  <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Active now
                  </div>
                </div>
                {versions.map((v, i) => (
                  <div key={v._id} className={cn("relative pl-5 border-l-2", i === versions.length - 1 ? "border-transparent" : "border-border/50 pb-5")}>
                    <div className="absolute w-2.5 h-2.5 bg-muted-foreground/30 rounded-full -left-[5.5px] top-1" />
                    <div className="text-sm font-medium text-foreground">{format(new Date(v.createdAt), "MMM d, yyyy")}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{format(new Date(v.createdAt), "h:mm a")}</div>
                    {onRestoreVersion && (
                      <Button variant="link" size="sm" className="h-auto p-0 mt-2 text-xs text-emerald-500 hover:text-emerald-600 font-medium" onClick={() => onRestoreVersion(v)}>
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
