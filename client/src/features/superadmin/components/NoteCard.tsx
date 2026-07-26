import React from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Pin, Lock, Globe, Users } from "lucide-react";
import { Note } from "../services/notesApi";
import { cn } from "@/lib/utils";
import { getTagColor } from "../utils/noteColors";

interface NoteCardProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
}

const decodeHtmlEntities = (text: string | undefined) => {
  if (!text) return "";
  const textArea = document.createElement("textarea");
  textArea.innerHTML = text;
  return textArea.value;
};

export function NoteCard({ note, isActive, onClick }: NoteCardProps) {
  // Determine visibility icon
  const VisibilityIcon = note.visibility === "Public" ? Globe : note.visibility === "Shared" ? Users : Lock;

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm group",
        isActive
          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/50 ring-1 ring-emerald-500/20"
          : "bg-card border-border hover:border-emerald-500/30"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-base leading-none">{note.icon || "📄"}</span>
          <h4 className="font-medium text-sm line-clamp-1 truncate">{note.title}</h4>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
          {note.visibility === "Private" && <Lock className="w-3 h-3 text-muted-foreground" />}
          {note.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed ml-6">
        {decodeHtmlEntities(note.textContent) || "No content"}
      </p>

      <div className="flex flex-col gap-2 mt-3 pt-2 border-t border-border/50 ml-6">
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.slice(0, 3).map((tag) => (
              <span key={tag} className={cn("px-1.5 py-0.5 rounded border text-[10px] font-medium", getTagColor(tag))}>
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="px-1.5 py-0.5 rounded border border-muted bg-muted text-[10px] font-medium text-muted-foreground">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
          <div className="flex items-center gap-1">
            <span>Edited</span>
            <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
          </div>
          {note.textContent && (
            <span>{Math.max(1, Math.ceil(note.textContent.length / 1000))} min read</span>
          )}
        </div>
      </div>
    </div>
  );
}
