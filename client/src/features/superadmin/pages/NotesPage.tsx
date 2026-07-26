import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Search, Plus, Pin, Trash2, Edit3, X, Tag, FileText, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/marketing_ui/nikhil_calendar";
import { Input } from "@/components/marketing_ui/input";
import { Button } from "@/components/marketing_ui/button";
import { Badge } from "@/components/ui/badge";
import RichReplyEditor, { RichReplyEditorRef } from "@/app/support/components/RichReplyEditor";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote, useTogglePin } from "../queries/useNotes";
import { Note } from "../services/notesApi";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";

export function NotesPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");

  const editorRef = useRef<RichReplyEditorRef>(null);

  // Queries and mutations
  const { data: notes = [], isLoading } = useNotes({
    date: selectedDate?.toISOString(),
    search: searchQuery || undefined,
    tag: selectedTag,
  });

  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const togglePinMutation = useTogglePin();

  // Extract all unique tags for the filter
  const allTags = Array.from(new Set(notes.flatMap((note) => note.tags)));

  // Handlers
  const handleCreateNew = () => {
    setActiveNote(null);
    setEditTitle("");
    setEditTags([]);
    setIsEditing(true);
    setTimeout(() => editorRef.current?.clear(), 0);
  };

  const handleSave = () => {
    const htmlContent = editorRef.current?.getHTML() || "";
    
    if (!editTitle.trim() || !htmlContent.trim()) {
      alert("Title and content are required.");
      return;
    }

    if (activeNote) {
      updateNoteMutation.mutate(
        { id: activeNote._id, title: editTitle, content: htmlContent, tags: editTags },
        {
          onSuccess: (updatedNote) => {
            setActiveNote(updatedNote);
            setIsEditing(false);
          },
        }
      );
    } else {
      createNoteMutation.mutate(
        { title: editTitle, content: htmlContent, tags: editTags },
        {
          onSuccess: (newNote) => {
            setActiveNote(newNote);
            setIsEditing(false);
          },
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate(id, {
        onSuccess: () => {
          if (activeNote?._id === id) {
            setActiveNote(null);
            setIsEditing(false);
          }
        },
      });
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTagInput.trim()) {
      e.preventDefault();
      const tag = newTagInput.trim().toLowerCase();
      if (!editTags.includes(tag)) {
        setEditTags([...editTags, tag]);
      }
      setNewTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-background">
      
      {/* ── LEFT COLUMN: Calendar & Filters (280px) ── */}
      <div className="w-full md:w-[280px] shrink-0 border-r border-border bg-muted/20 flex flex-col h-full overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Filters</h2>
            {(selectedDate || selectedTag || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => {
                  setSelectedDate(undefined);
                  setSelectedTag(undefined);
                  setSearchQuery("");
                }}
              >
                Clear all
              </Button>
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="bg-background rounded-xl border border-border overflow-hidden flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="p-3"
            />
          </div>

          {allTags.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTag === tag ? "default" : "secondary"}
                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                    onClick={() => setSelectedTag(selectedTag === tag ? undefined : tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CENTER COLUMN: Notes List (350px) ── */}
      <div className="w-full md:w-[350px] shrink-0 border-r border-border bg-background flex flex-col h-full">
        <div className="p-3 border-b border-border flex items-center justify-between bg-muted/10 sticky top-0 z-10">
          <div className="flex flex-col">
            <span className="font-semibold">{notes.length} Notes</span>
            <span className="text-xs text-muted-foreground">
              {selectedDate ? format(selectedDate, "MMM d, yyyy") : "All time"}
            </span>
          </div>
          <Button size="sm" className="gap-1.5" onClick={handleCreateNew}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Note</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 opacity-60">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-sm">No notes found</div>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note._id}
                onClick={() => {
                  setActiveNote(note);
                  setIsEditing(false);
                  setEditTitle(note.title);
                  setEditTags(note.tags);
                }}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm group relative",
                  activeNote?._id === note._id 
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/50 ring-1 ring-emerald-500/20" 
                    : "bg-card border-border hover:border-emerald-500/30"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-medium text-sm line-clamp-1 flex-1 pr-6">{note.title}</h4>
                  {note.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                  {note.textContent || "No text content"}
                </p>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground">
                        +{note.tags.length - 3}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium shrink-0 ml-2">
                    {format(new Date(note.updatedAt), "MMM d")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT COLUMN: Note Editor/Viewer (Flex) ── */}
      <div className="flex-1 bg-card flex flex-col h-full overflow-hidden min-w-[300px]">
        {!activeNote && !isEditing ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40 select-none">
            <FileText className="w-16 h-16 mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold">No Note Selected</h2>
            <p className="text-sm text-muted-foreground max-w-sm text-center mt-2">
              Select a note from the list on the left to view or edit its contents, or create a new note.
            </p>
          </div>
        ) : isEditing ? (
          <div className="flex-1 flex flex-col h-full">
            <div className="p-4 border-b border-border bg-background flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground">
                  {activeNote ? "Edit Note" : "Create New Note"}
                </h2>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                    Save Note
                  </Button>
                </div>
              </div>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Note Title"
                className="text-lg font-semibold border-none px-0 focus-visible:ring-0 shadow-none bg-transparent"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-muted-foreground mr-1" />
                {editTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1 bg-muted">
                    {tag}
                    <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
                <Input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add tag and press Enter..."
                  className="h-6 w-40 text-xs border-dashed bg-transparent"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
              <RichReplyEditor
                ref={editorRef}
                onChange={() => {}}
                initialHtml={activeNote?.content || ""}
                placeholder="Start typing your note here..."
                minHeight={300}
                maxHeight="100%"
                hideAttachments={false}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="p-4 md:px-8 border-b border-border bg-background sticky top-0 z-10 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{activeNote?.title}</h1>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    title={activeNote?.isPinned ? "Unpin note" : "Pin note"}
                    onClick={() => togglePinMutation.mutate(activeNote!._id)}
                  >
                    <Pin className={cn("w-4 h-4", activeNote?.isPinned ? "text-amber-500 fill-amber-500" : "text-muted-foreground")} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                    onClick={() => {
                      setEditTitle(activeNote!.title);
                      setEditTags(activeNote!.tags);
                      setIsEditing(true);
                      setTimeout(() => {
                        if (editorRef.current && activeNote?.content) {
                          editorRef.current.clear();
                          // The RichReplyEditor sets initialHtml on mount
                        }
                      }, 0);
                    }}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(activeNote!._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {activeNote ? format(new Date(activeNote.createdAt), "MMMM d, yyyy 'at' h:mm a") : ""}
                </span>
                {activeNote?.tags && activeNote.tags.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <div className="flex gap-1.5">
                      {activeNote.tags.map(tag => (
                        <span key={tag} className="text-foreground font-medium">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div 
                className="prose prose-sm dark:prose-invert max-w-4xl w-full p-4 md:p-8 mx-auto
                [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 
                [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic 
                [&_a]:text-emerald-600 dark:[&_a]:text-emerald-400 [&_a]:no-underline hover:[&_a]:underline 
                [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-border [&_img]:shadow-sm"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activeNote?.content || "") }}
              />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
