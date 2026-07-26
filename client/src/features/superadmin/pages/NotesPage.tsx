import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, Plus, FileText, Star, Folder, Tag as TagIcon, X } from "lucide-react";
import { NikhilTimeCalendar } from "@/components/marketing_ui/nikhil_time_calendar";
import { Input } from "@/components/marketing_ui/input";
import { Button } from "@/components/marketing_ui/button";
import { Badge } from "@/components/marketing_ui/badge";
import { ScrollArea } from "@/components/marketing_ui/scroll-area";
import { 
  useNotes, 
  useNoteStats, 
  useCreateNote, 
  useUpdateNote, 
  useDeleteNote, 
} from "../queries/useNotes";
import { Note } from "../services/notesApi";
import { toast } from "sonner";
import { NoteCard } from "../components/NoteCard";
import { NoteViewer } from "../components/NoteViewer";
import { PremiumNoteEditor } from "../components/PremiumNoteEditor";

/* ── Custom Resize Handle ── */
function ResizeHandle({ onDrag }: { onDrag: (delta: number) => void }) {
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const onMouseMove = (ev: MouseEvent) => onDrag(ev.clientX - startX);
      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [onDrag]
  );

  return (
    <div
      onMouseDown={onMouseDown}
      className="w-[6px] shrink-0 cursor-col-resize flex items-center justify-center bg-border/50 hover:bg-emerald-500/30 active:bg-emerald-500/50 transition-colors group z-10"
      style={{ touchAction: "none" }}
    >
      <div className="w-[4px] h-8 rounded-full bg-border group-hover:bg-emerald-500/60 transition-colors" />
    </div>
  );
}

export function NotesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [filterMode, setFilterMode] = useState<"All" | "Pinned" | "Private" | "Public">("All");

  const { data: notes = [], isLoading } = useNotes({
    search: searchQuery || undefined,
    date: selectedDate ? selectedDate.toISOString() : undefined,
    tag: selectedTag,
    category: selectedCategory,
    visibility: filterMode === "Private" || filterMode === "Public" ? filterMode : undefined,
  });
  const { data: stats } = useNoteStats();
  
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();

  const [activeNote, setActiveNote] = useState<Note | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editCategory, setEditCategory] = useState("General");
  const [editIcon, setEditIcon] = useState("📄");
  const [editVisibility, setEditVisibility] = useState("Private");
  const [newTagInput, setNewTagInput] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Left column width
  const [leftWidth, setLeftWidth] = useState(400);
  const leftBase = useRef(400);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N -> New Note
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNew();
      }
      // Ctrl/Cmd + F -> Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Ctrl/Cmd + S -> Save (if editing)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (isEditing) handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, editTitle, editContent, editTags, editCategory, editIcon, editVisibility]);

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
    setEditContent("");
    setEditTags([]);
    setEditCategory("General");
    setEditIcon("📄");
    setEditVisibility("Private");
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    const content = editContent || " "; // backend requires content
    const payload = {
      title: editTitle,
      content,
      tags: editTags,
      category: editCategory,
      icon: editIcon,
      visibility: editVisibility,
    };

    if (activeNote) {
      updateNote.mutate(
        { id: activeNote._id, ...payload },
        {
          onSuccess: (updated) => {
            toast.success("Note saved");
            setActiveNote(updated);
            setIsEditing(false);
          },
          onError: () => toast.error("Failed to update note"),
        }
      );
    } else {
      createNote.mutate(payload, {
        onSuccess: (newNote) => {
          toast.success("Note created");
          setActiveNote(newNote);
          setIsEditing(false);
        },
        onError: () => toast.error("Failed to create note"),
      });
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
    setEditTags(editTags.filter((t) => t !== tagToRemove));
  };

  const handleLeftDrag = useCallback((delta: number) => {
    const newW = Math.max(300, Math.min(600, leftBase.current + delta));
    setLeftWidth(newW);
  }, []);

  useEffect(() => {
    leftBase.current = leftWidth;
  }, [leftWidth]);

  // Derived filtered notes
  const displayedNotes = filterMode === "Pinned" ? notes.filter(n => n.isPinned) : notes;

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));
  const allCategories = Array.from(new Set(notes.map((n) => n.category).filter(Boolean)));

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">

      {/* ══════════ LEFT COLUMN: Sidebar + List ══════════ */}
      <div
        style={{ width: leftWidth, minWidth: 300, maxWidth: 600, flexShrink: 0 }}
        className="flex h-full border-r bg-muted/10 overflow-hidden"
      >
        {/* Sidebar Nav (Favorites, Categories) */}
        <div className="w-14 sm:w-48 shrink-0 border-r bg-muted/20 flex flex-col items-center sm:items-stretch py-4">
          <div className="px-2 sm:px-4 pb-4 border-b">
            <Button size="sm" className="w-full justify-center sm:justify-start gap-2" onClick={handleCreateNew}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Note</span>
            </Button>
          </div>
          
          <ScrollArea className="flex-1 w-full pt-4">
            <div className="px-2 sm:px-3 space-y-6">
              {/* Quick Filters */}
              <div className="space-y-1">
                <Button variant={filterMode === "All" ? "secondary" : "ghost"} size="sm" className="w-full justify-center sm:justify-start gap-2 h-8" onClick={() => setFilterMode("All")}>
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="hidden sm:inline">All Notes</span>
                </Button>
                <Button variant={filterMode === "Pinned" ? "secondary" : "ghost"} size="sm" className="w-full justify-center sm:justify-start gap-2 h-8" onClick={() => setFilterMode("Pinned")}>
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="hidden sm:inline">Favorites</span>
                </Button>
              </div>

              {/* Categories */}
              {allCategories.length > 0 && (
                <div className="space-y-1">
                  <h4 className="hidden sm:block text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">Categories</h4>
                  {allCategories.map(cat => (
                    <Button key={cat} variant={selectedCategory === cat ? "secondary" : "ghost"} size="sm" className="w-full justify-center sm:justify-start gap-2 h-8" onClick={() => setSelectedCategory(selectedCategory === cat ? undefined : cat)}>
                      <Folder className="w-4 h-4 text-muted-foreground" />
                      <span className="hidden sm:inline truncate">{cat}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Notes List Column */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header Stats */}
          <div className="px-4 py-3 border-b bg-card flex items-center justify-between">
            <h2 className="text-sm font-semibold">My Notes</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span title="Total Notes">📄 {stats?.total || 0}</span>
              <span title="Pinned">⭐ {stats?.pinned || 0}</span>
            </div>
          </div>

          {/* Search & Date Filter */}
          <div className="p-3 border-b space-y-2 bg-card">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search (Ctrl+F)"
                className="pl-8 h-8 text-xs bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <NikhilTimeCalendar
                value={selectedDate}
                onChange={setSelectedDate}
                placeholder="Date filter"
                popDirection="right"
                className="flex-1 h-8 text-xs bg-muted/50 border-none"
              />
            </div>
            {/* Tags Filter */}
            <div className="flex flex-wrap gap-1 mt-2">
              {allTags.slice(0, 10).map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? "default" : "secondary"}
                  className="cursor-pointer text-[9px] px-1.5 py-0 hover:bg-emerald-500 hover:text-white transition-colors"
                  onClick={() => setSelectedTag(selectedTag === tag ? undefined : tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* List */}
          <ScrollArea className="flex-1 bg-muted/10 p-2">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">Loading...</div>
            ) : displayedNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center opacity-60">
                <FileText className="w-10 h-10 mb-3 text-muted-foreground" />
                <h3 className="text-sm font-medium">No notes found</h3>
                <p className="text-xs mt-1 max-w-[200px]">Create your first note to get started.</p>
                <Button size="sm" variant="outline" className="mt-4 text-xs h-7" onClick={handleCreateNew}>New Note</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {displayedNotes.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    isActive={activeNote?._id === note._id}
                    onClick={() => {
                      setActiveNote(note);
                      setIsEditing(false);
                    }}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      <ResizeHandle onDrag={handleLeftDrag} />

      {/* ══════════ RIGHT COLUMN: Viewer / Editor ══════════ */}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }} className="flex flex-col h-full bg-card">
        {!activeNote && !isEditing ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40 select-none bg-accent/20">
            <FileText className="w-16 h-16 mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold">Premium Notes</h2>
            <p className="text-sm mt-2 text-center max-w-sm">
              Press <kbd className="px-1.5 py-0.5 border rounded bg-background text-xs mx-1 font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 border rounded bg-background text-xs mx-1 font-mono">N</kbd> to create a new note.
            </p>
          </div>
        ) : isEditing ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden p-6 lg:px-12 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between mb-8 pb-4 border-b">
              <h2 className="text-lg font-semibold">{activeNote ? "Edit Note" : "Create New Note"}</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => {
                  setIsEditing(false);
                  if (!activeNote) setActiveNote(null);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={createNote.isPending || updateNote.isPending || !editTitle.trim()}>
                  {createNote.isPending || updateNote.isPending ? "Saving..." : "Save (Ctrl+S)"}
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 pb-12">
              <div className="space-y-6">
                {/* Meta Inputs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Title</label>
                    <Input placeholder="Note Title" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="font-medium" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Category</label>
                    <Input placeholder="e.g. Backend" value={editCategory} onChange={e => setEditCategory(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-16">
                      <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Icon</label>
                      <Input value={editIcon} onChange={e => setEditIcon(e.target.value)} className="text-center text-lg px-0" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Visibility</label>
                      <select 
                        value={editVisibility} 
                        onChange={e => setEditVisibility(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="Private">🔒 Private</option>
                        <option value="Public">🌍 Public</option>
                        <option value="Shared">👥 Shared</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Tags</label>
                  <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md min-h-10 bg-background">
                    {editTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 bg-muted">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:bg-muted-foreground/20 rounded-full p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    <div className="relative flex-1 min-w-[120px]">
                      <TagIcon className="absolute left-2 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        placeholder="Add tag and press Enter"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        className="w-full pl-7 h-7 text-sm outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Markdown Editor */}
                <div className="h-[500px]">
                  <PremiumNoteEditor
                    content={editContent}
                    onChange={setEditContent}
                  />
                </div>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <NoteViewer 
            note={activeNote} 
            onEdit={() => {
              setEditTitle(activeNote.title);
              setEditContent(activeNote.content || "");
              setEditTags(activeNote.tags || []);
              setEditCategory(activeNote.category || "General");
              setEditIcon(activeNote.icon || "📄");
              setEditVisibility(activeNote.visibility || "Private");
              setIsEditing(true);
            }} 
            onRestoreVersion={(v) => {
              if (confirm("Restore this version? This will overwrite the current note content.")) {
                updateNote.mutate({
                  id: activeNote._id,
                  title: v.title,
                  content: v.content,
                  tags: v.tags,
                  category: v.category,
                  icon: v.icon,
                  visibility: v.visibility,
                }, {
                  onSuccess: (updated) => {
                    toast.success("Version restored successfully");
                    setActiveNote(updated);
                  }
                });
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
