import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Search, Plus, Pin, Trash2, Edit3, X, Tag, FileText, Calendar as CalendarIcon } from "lucide-react";
import { NikhilTimeCalendar } from "@/components/marketing_ui/nikhil_time_calendar";
import { Input } from "@/components/marketing_ui/input";
import { Button } from "@/components/marketing_ui/button";
import { Badge } from "@/components/marketing_ui/badge";
import RichReplyEditor, { RichReplyEditorRef } from "@/app/support/components/RichReplyEditor";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote, useTogglePin } from "../queries/useNotes";
import { Note } from "../services/notesApi";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";

const decodeHtmlEntities = (text: string | undefined) => {
  if (!text) return "";
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

export function NotesPage() {
  const { data: notes = [], isLoading } = useNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const togglePin = useTogglePin();

  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTag, setSelectedTag] = useState<string | undefined>();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const editorRef = useRef<RichReplyEditorRef>(null);

  const allTags = Array.from(new Set(notes.flatMap((note) => note.tags)));

  useEffect(() => {
    if (activeNote && !notes.find((n) => n._id === activeNote._id)) {
      setActiveNote(null);
      setIsEditing(false);
    }
  }, [notes, activeNote]);

  const handleCreateNew = () => {
    setActiveNote(null);
    setIsEditing(true);
    setEditTitle("");
    setEditTags([]);
    if (editorRef.current) {
      editorRef.current.clearContent();
    }
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    const content = editorRef.current?.getContent() || "";
    const textContent = editorRef.current?.getTextContent() || "";

    if (activeNote) {
      updateNote.mutate({
        id: activeNote._id,
        updates: { title: editTitle, content, textContent, tags: editTags },
      });
      setIsEditing(false);
    } else {
      createNote.mutate(
        { title: editTitle, content, textContent, tags: editTags },
        {
          onSuccess: (newNote) => {
            setActiveNote(newNote);
            setIsEditing(false);
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (!activeNote) return;
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNote.mutate(activeNote._id);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTagInput.trim()) {
      e.preventDefault();
      if (!editTags.includes(newTagInput.trim())) {
        setEditTags([...editTags, newTagInput.trim()]);
      }
      setNewTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditTags(editTags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div style={{ display: "flex", height: "100%", width: "100%", overflow: "hidden" }}>
      {/* ── LEFT: Filters ── */}
      <div
        style={{ width: 280, minWidth: 280, maxWidth: 280, flexShrink: 0 }}
        className="flex flex-col h-full bg-muted/20 border-r border-border overflow-y-auto"
      >
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

          <div className="bg-background rounded-xl overflow-hidden">
            <NikhilTimeCalendar
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Select date & time"
              popDirection="right"
              className="w-full bg-accent/30 border-border shadow-sm hover:bg-accent/50"
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

      {/* ── CENTER: Notes List ── */}
      <div
        style={{ width: 320, minWidth: 320, maxWidth: 320, flexShrink: 0 }}
        className="flex flex-col h-full bg-background border-r border-border"
      >
        <div className="p-3 border-b border-border flex items-center justify-between bg-muted/10 shrink-0">
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
                  {note.isPinned && (
                    <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                  {decodeHtmlEntities(note.textContent) || "No text content"}
                </p>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground"
                      >
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

      {/* ── RIGHT: Editor ── */}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }} className="flex flex-col h-full bg-card">
        {!activeNote && !isEditing ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40 select-none">
            <FileText className="w-16 h-16 mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold">No Note Selected</h2>
            <p className="text-sm mt-2 max-w-xs text-center">
              Select a note from the list on the left to view or edit its contents, or create a new
              note.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border bg-background shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md text-muted-foreground">
                    {isEditing && !activeNote
                      ? "New Note"
                      : isEditing
                        ? "Editing Note"
                        : "Viewing Note"}
                  </span>
                  {activeNote && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      Last edited{" "}
                      {format(new Date(activeNote.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {activeNote && !isEditing && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePin.mutate(activeNote._id)}
                        className={
                          activeNote.isPinned
                            ? "text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-500/10"
                            : "text-muted-foreground"
                        }
                      >
                        <Pin className="w-4 h-4 mr-1.5" />
                        {activeNote.isPinned ? "Unpin" : "Pin"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(true);
                          setEditTitle(activeNote.title);
                          setEditTags(activeNote.tags);
                        }}
                      >
                        <Edit3 className="w-4 h-4 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Delete
                      </Button>
                    </>
                  )}
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        if (!activeNote) setActiveNote(null);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Note Title"
                  value={isEditing ? editTitle : activeNote?.title}
                  onChange={(e) => setEditTitle(e.target.value)}
                  readOnly={!isEditing}
                  className={cn(
                    "text-xl font-semibold h-12 px-3 focus-visible:ring-emerald-500",
                    !isEditing && "border-transparent bg-transparent px-0"
                  )}
                />

                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {editTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="relative max-w-sm">
                      <Tag className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Add tags (press Enter)"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        className="h-8 pl-8 text-xs bg-muted/50"
                      />
                    </div>
                  </div>
                ) : activeNote?.tags.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {activeNote.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
              <div className={cn("absolute inset-0", !isEditing && "pointer-events-none")}>
                <RichReplyEditor
                  ref={editorRef}
                  initialContent={activeNote?.content}
                  placeholder="Write your note here..."
                  onChange={() => {}}
                />
              </div>
              {!isEditing && activeNote?.content && (
                <div
                  className="absolute inset-0 overflow-y-auto p-4 prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(activeNote.content),
                  }}
                />
              )}
            </div>

            {/* Footer */}
            {isEditing && (
              <div className="p-4 border-t border-border bg-background flex justify-end gap-3 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    if (!activeNote) setActiveNote(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    createNote.isPending || updateNote.isPending || !editTitle.trim()
                  }
                  className="gap-2"
                >
                  {createNote.isPending || updateNote.isPending ? "Saving..." : "Save Note"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
