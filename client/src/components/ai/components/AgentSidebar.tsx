import React from "react";
import { createPortal } from "react-dom";
import { MessageSquare, Plus, Search, Pin, MoreHorizontal, Pencil, Trash2, Share, Copy, Mail, Check, Link2, FileText, ExternalLink, X, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/marketing_ui/sidebar";
import { Input } from "@/components/marketing_ui/input";
import { Button } from "@/components/marketing_ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/marketing_ui/accordion";

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/marketing_ui/dropdown-menu";
import { toast } from "sonner";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  pinned?: boolean;
}

export function AgentNestedMenu({ searchQuery = "" }: { searchQuery?: string }) {
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);
  
  // State for Three-Dot menu operations
  const [editingSessionId, setEditingSessionId] = React.useState<string | null>(null);
  const [editingTitle, setEditingTitle] = React.useState("");
  const [shareModalOpen, setShareModalOpen] = React.useState(false);
  const [shareSessionId, setShareSessionId] = React.useState<string | null>(null);
  const [isSharingEmail, setIsSharingEmail] = React.useState(false);
  const [sharedEmailSuccess, setSharedEmailSuccess] = React.useState(false);
  const [copiedSuccess, setCopiedSuccess] = React.useState(false);
  const [isCopying, setIsCopying] = React.useState(false);
  const [publicShareUrl, setPublicShareUrl] = React.useState<string | null>(null);
  const [isCreatingLink, setIsCreatingLink] = React.useState(false);
  const [linkCopied, setLinkCopied] = React.useState(false);

  React.useEffect(() => {
    const handleActiveSessionChanged = (e: any) => {
      setActiveSessionId(e.detail?.sessionId || null);
    };
    window.addEventListener("agent:active-session-changed", handleActiveSessionChanged);
    return () => window.removeEventListener("agent:active-session-changed", handleActiveSessionChanged);
  }, []);

  const fetchSessions = () => {
    setLoading(true);
    const endpoint = typeof import.meta !== "undefined" && import.meta.env
      ? (import.meta.env.VITE_API_URL || "https://api.classgrid.in") + "/api/ai/sessions"
      : "/api/ai/sessions";
      
    fetch(endpoint, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.sessions) setSessions(data.sessions);
      })
      .catch(err => console.error("Failed to load sessions", err))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    fetchSessions();

    const handleRefresh = () => {
      fetchSessions();
    };

    window.addEventListener("agent:refresh-sessions", handleRefresh);
    return () => window.removeEventListener("agent:refresh-sessions", handleRefresh);
  }, []);

  const today = new Date();
  const isToday = (dateString: string) => {
    const d = new Date(dateString);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };
  
  const endpointPrefix = typeof import.meta !== "undefined" && import.meta.env
    ? (import.meta.env.VITE_API_URL || "https://api.classgrid.in")
    : "";

  const handleUpdateSession = async (id: string, updates: any) => {
    try {
      const res = await fetch(`${endpointPrefix}/api/ai/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include"
      });
      if (res.ok) {
        if (updates.pinned !== undefined) {
            toast.success(updates.pinned ? "Chat pinned successfully!" : "Chat unpinned.");
        }
        fetchSessions();
      } else {
        const errData = await res.json();
        if (errData.error) {
            toast.error(errData.error);
        } else {
            toast.error("Failed to update chat.");
        }
      }
    } catch (e) {
      console.error("Failed to update session", e);
      toast.error("Failed to update chat.");
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this chat?")) return;
    try {
      const res = await fetch(`${endpointPrefix}/api/ai/sessions/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        if (activeSessionId === id) window.dispatchEvent(new Event("agent:new-chat"));
        fetchSessions();
      }
    } catch (e) {
      console.error("Failed to delete session", e);
    }
  };

  const handleRenameSubmit = (id: string) => {
    if (editingTitle.trim()) {
      handleUpdateSession(id, { title: editingTitle.trim() });
    }
    setEditingSessionId(null);
  };

  const handleShareEmail = async (id: string) => {
    setIsSharingEmail(true);
    setSharedEmailSuccess(false);
    try {
      const res = await fetch(`${endpointPrefix}/api/ai/sessions/${id}/share`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        setSharedEmailSuccess(true);
        setTimeout(() => setSharedEmailSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Failed to share session via email", e);
    } finally {
      setIsSharingEmail(false);
    }
  };

  const handleCopyChat = async (id: string) => {
    try {
      setIsCopying(true);
      const res = await fetch(`${endpointPrefix}/api/ai/sessions/${id}/messages`, { credentials: "include" });
      const data = await res.json();
      if (data.messages) {
        let transcript = "";
        data.messages.forEach((msg: any) => {
          transcript += `${msg.role === 'user' ? 'You' : 'Classgrid AI'}:\n${msg.content}\n\n`;
        });
        await navigator.clipboard.writeText(transcript);
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Failed to copy session", e);
    } finally {
      setIsCopying(false);
    }
  };

  // ── PUBLIC LINK ──
  const handleCreatePublicLink = async (id: string) => {
    setIsCreatingLink(true);
    try {
      const res = await fetch(`${endpointPrefix}/api/ai/sessions/${id}/public-share`, {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (data.shareUrl) {
        setPublicShareUrl(data.shareUrl);
        await navigator.clipboard.writeText(data.shareUrl);
        setLinkCopied(true);
        toast.success("Public link copied to clipboard!");
        setTimeout(() => setLinkCopied(false), 3000);
      }
    } catch (e) {
      console.error("Failed to create public share", e);
      toast.error("Failed to create share link.");
    } finally {
      setIsCreatingLink(false);
    }
  };

  // ── COPY AS PLAIN TEXT ──
  const handleCopyText = async (id: string) => {
    try {
      const res = await fetch(`${endpointPrefix}/api/ai/sessions/${id}/messages`, { credentials: "include" });
      const data = await res.json();
      if (data.messages) {
        let transcript = "";
        data.messages.forEach((msg: any) => {
          transcript += `${msg.role === 'user' ? 'You' : 'Classgrid AI'}:\n${msg.content}\n\n`;
        });
        await navigator.clipboard.writeText(transcript);
        toast.success("Plain text copied to clipboard!");
      }
    } catch (e) {
      console.error("Failed to copy as text", e);
    }
  };

  // ── COPY AS MARKDOWN ──
  const handleCopyMarkdown = async (id: string) => {
    try {
      const res = await fetch(`${endpointPrefix}/api/ai/sessions/${id}/messages`, { credentials: "include" });
      const data = await res.json();
      if (data.messages) {
        let md = "";
        data.messages.forEach((msg: any) => {
          const role = msg.role === 'user' ? 'You' : 'Classgrid AI';
          md += `### **${role}**\n${msg.content}\n\n`;
        });
        await navigator.clipboard.writeText(md);
        toast.success("Markdown copied to clipboard!");
      }
    } catch (e) {
      console.error("Failed to copy as markdown", e);
    }
  };

  // ── WHATSAPP ──
  const handleShareWhatsApp = (url: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, "_blank");
  };

  // ── LINKEDIN ──
  const handleShareLinkedIn = (url: string) => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
  };

  const filteredSessions = sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const pinnedSessions = filteredSessions.filter(s => s.pinned);
  const unpinnedSessions = filteredSessions.filter(s => !s.pinned);
  
  const todaySessions = unpinnedSessions.filter(s => isToday(s.created_at));
  const previousSessions = unpinnedSessions.filter(s => !isToday(s.created_at));

  const navigate = useNavigate();
  const location = useLocation();

  // Extract base path robustly by finding the 'agent' segment
  const pathParts = location.pathname.split('/');
  const agentIndex = pathParts.indexOf('agent');
  const baseAgentPath = agentIndex !== -1 
    ? pathParts.slice(0, agentIndex + 1).join('/')
    : location.pathname;

  const handleNewChat = () => {
    navigate(baseAgentPath);
    window.dispatchEvent(new Event("agent:new-chat")); // Keep event for legacy state reset if needed
  };

  const handleLoadChat = (sessionId: string) => {
    navigate(`${baseAgentPath}/${sessionId}`);
  };

  const renderSessionItem = (session: ChatSession) => {
    const isEditing = editingSessionId === session.id;
    let displayTitle = session.title.replace(/^(Title:|Title:|\*\*Title:\*\*)\s*/i, '').trim();
    if (displayTitle.length > 25) {
      displayTitle = displayTitle.substring(0, 25).trim() + "...";
    }

    return (
      <SidebarMenuItem key={session.id}>
        <div className="relative group w-full flex items-center">
          {isEditing ? (
            <div className="flex-1 px-2 py-1">
              <Input
                autoFocus
                className="h-7 text-xs px-2 w-full bg-background"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => handleRenameSubmit(session.id)}
                onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit(session.id)}
              />
            </div>
          ) : (
            <SidebarMenuButton
              isActive={session.id === activeSessionId}
              onClick={() => handleLoadChat(session.id)}
              className="h-auto py-1.5 cursor-pointer flex-1"
              render={
                <span className="truncate block w-full pr-6">{displayTitle}</span>
              }
            />
          )}

          {!isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="absolute right-2 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground cursor-pointer">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                sideOffset={4}
                className="w-[180px] z-[100] bg-[#202123] dark:bg-[#202123] text-[#ececf1] border border-white/10 rounded-xl p-1.5 shadow-xl"
              >
                <DropdownMenuItem 
                  className="gap-3 py-1.5 px-2.5 text-[13px] cursor-pointer hover:bg-[#343541] focus:bg-[#343541] focus:text-[#ececf1] rounded-md transition-colors"
                  onClick={() => {
                    setShareSessionId(session.id);
                    setShareModalOpen(true);
                  }}
                >
                  <Share className="w-4 h-4" strokeWidth={1.5} />
                  Share
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="gap-3 py-1.5 px-2.5 text-[13px] cursor-pointer hover:bg-[#343541] focus:bg-[#343541] focus:text-[#ececf1] rounded-md transition-colors"
                  onClick={() => {
                    setEditingSessionId(session.id);
                    setEditingTitle(session.title);
                  }}
                >
                  <Pencil className="w-4 h-4" strokeWidth={1.5} />
                  Rename
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="gap-3 py-1.5 px-2.5 text-[13px] cursor-pointer hover:bg-[#343541] focus:bg-[#343541] focus:text-[#ececf1] rounded-md transition-colors"
                  onClick={() => {
                    if (!session.pinned && pinnedSessions.length >= 5) {
                      toast.error("You can only pin up to 5 chats.");
                      return;
                    }
                    handleUpdateSession(session.id, { pinned: !session.pinned });
                  }}
                >
                  <Pin className="w-4 h-4" strokeWidth={1.5} />
                  {session.pinned ? "Unpin chat" : "Pin chat"}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-white/10 my-1" />
                
                <DropdownMenuItem 
                  className="gap-3 py-1.5 px-2.5 text-[13px] cursor-pointer text-[#ef4444] hover:bg-[#343541] focus:bg-[#343541] focus:text-[#ef4444] rounded-md transition-colors"
                  onClick={() => handleDeleteSession(session.id)}
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <SidebarGroup className="pt-1">
        <div className="px-2 pb-3 mb-3 border-b border-border/50">
        <Button 
          onClick={handleNewChat}
          className="w-full justify-start gap-2 h-9 px-3 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium text-sm">New Chat</span>
        </Button>
      </div>

      <SidebarGroupContent>
        <Accordion defaultValue={["pinned", "today", "previous"]} multiple className="w-full">
          {pinnedSessions.length > 0 && (
            <AccordionItem value="pinned" className="border-none mb-2">
              <AccordionTrigger className="px-2 py-1.5 hover:no-underline group/acc-trigger flex items-center h-auto min-h-0 border-transparent focus-visible:ring-0 cursor-pointer">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pinned</span>
              </AccordionTrigger>
              <AccordionContent className="pb-0 pt-1 px-0">
                <SidebarMenu>
                  {pinnedSessions.map(renderSessionItem)}
                </SidebarMenu>
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem value="today" className="border-none mb-2">
            <AccordionTrigger className="px-2 py-1.5 hover:no-underline group/acc-trigger flex items-center h-auto min-h-0 border-transparent focus-visible:ring-0 cursor-pointer">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today</span>
            </AccordionTrigger>
            <AccordionContent className="pb-0 pt-1 px-0">
              <SidebarMenu>
                {loading && <div className="px-2 text-xs text-muted-foreground py-2">Loading...</div>}
                {!loading && todaySessions.length === 0 && <div className="px-2 text-xs text-muted-foreground py-2">No chats today</div>}
                {todaySessions.map(renderSessionItem)}
              </SidebarMenu>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="previous" className="border-none">
            <AccordionTrigger className="px-2 py-1.5 hover:no-underline group/acc-trigger flex items-center h-auto min-h-0 border-transparent focus-visible:ring-0 cursor-pointer">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Previous</span>
            </AccordionTrigger>
            <AccordionContent className="pb-0 pt-1 px-0">
              <SidebarMenu>
                {!loading && previousSessions.length === 0 && <div className="px-2 text-xs text-muted-foreground py-2">No previous chats</div>}
                {previousSessions.map(renderSessionItem)}
              </SidebarMenu>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SidebarGroupContent>
    </SidebarGroup>
      
      {/* Share Modal - Layout style: ChatGPT, Colors: Classgrid Theme (global.css) */}
      {shareModalOpen && shareSessionId && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setShareModalOpen(false); setPublicShareUrl(null); setLinkCopied(false); }}>
          <div className="bg-background text-foreground border border-border rounded-2xl w-[440px] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-semibold truncate max-w-[300px]">
                {sessions.find(s => s.id === shareSessionId)?.title || "Share Chat"}
              </h3>
              <button 
                onClick={() => { setShareModalOpen(false); setPublicShareUrl(null); setLinkCopied(false); }}
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Card */}
            <div className="px-6 py-6">
              <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-foreground font-semibold text-sm flex items-center gap-2">
                    Classgrid AI <span className="text-muted-foreground font-normal text-xs">&lt;agent@classgrid.in&gt;</span>
                  </div>
                </div>
                
                <div className="flex justify-center mb-6">
                  <div className="text-[11px] text-muted-foreground font-medium">
                    {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} (0 minutes ago)
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-muted-foreground mb-3 border-b border-border pb-2">
                  <span>to me</span>
                  <span>transcript</span>
                </div>

                <div className="text-sm text-foreground/80 font-medium truncate flex items-center justify-between">
                  <span className="truncate pr-4">Chat Transcript: {sessions.find(s => s.id === shareSessionId)?.title}...</span>
                  <span className="font-bold text-foreground text-base shrink-0">Classgrid AI</span>
                </div>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="px-6 pb-8 pt-2 flex items-center justify-center gap-5 flex-wrap">
               {/* Copy Link */}
               <button
                  className="flex flex-col items-center gap-2.5 group cursor-pointer"
                  onClick={async () => {
                    if (publicShareUrl) {
                       await navigator.clipboard.writeText(publicShareUrl);
                       setLinkCopied(true);
                       toast.success("Link copied!");
                       setTimeout(() => setLinkCopied(false), 2000);
                    } else {
                       handleCreatePublicLink(shareSessionId);
                    }
                  }}
                  disabled={isCreatingLink}
                >
                  <div className="w-12 h-12 rounded-full bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                    {isCreatingLink ? <Loader2 className="w-5 h-5 animate-spin" /> : linkCopied ? <Check className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                  </div>
                  <span className="text-[11px] text-muted-foreground group-hover:text-foreground font-medium transition-colors">Copy link</span>
                </button>

                {/* WhatsApp */}
                <button
                  className="flex flex-col items-center gap-2.5 group cursor-pointer"
                  onClick={() => {
                    if (publicShareUrl) {
                      handleShareWhatsApp(publicShareUrl);
                    } else {
                      toast.error("Create a public link first");
                    }
                  }}
                  disabled={!publicShareUrl}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    publicShareUrl 
                      ? 'bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground' 
                      : 'bg-muted/50 text-muted-foreground/30'
                  }`}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <span className="text-[11px] text-muted-foreground group-hover:text-foreground font-medium transition-colors">WhatsApp</span>
                </button>

                {/* LinkedIn */}
                <button
                  className="flex flex-col items-center gap-2.5 group cursor-pointer"
                  onClick={() => {
                    if (publicShareUrl) {
                      handleShareLinkedIn(publicShareUrl);
                    } else {
                      toast.error("Create a public link first");
                    }
                  }}
                  disabled={!publicShareUrl}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    publicShareUrl 
                      ? 'bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground' 
                      : 'bg-muted/50 text-muted-foreground/30'
                  }`}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </div>
                  <span className="text-[11px] text-muted-foreground group-hover:text-foreground font-medium transition-colors">LinkedIn</span>
                </button>

                {/* Email */}
                <button
                  className="flex flex-col items-center gap-2.5 group cursor-pointer"
                  onClick={() => handleShareEmail(shareSessionId)}
                  disabled={isSharingEmail || sharedEmailSuccess}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    sharedEmailSuccess
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground'
                  }`}>
                    {sharedEmailSuccess ? <Check className="w-5 h-5" /> : isSharingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                  </div>
                  <span className="text-[11px] text-muted-foreground group-hover:text-foreground font-medium transition-colors">Email</span>
                </button>

                {/* Copy Text */}
                <button
                  className="flex flex-col items-center gap-2.5 group cursor-pointer"
                  onClick={() => handleCopyText(shareSessionId)}
                >
                  <div className="w-12 h-12 rounded-full bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                    <Copy className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] text-muted-foreground group-hover:text-foreground font-medium transition-colors">Text</span>
                </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
}
