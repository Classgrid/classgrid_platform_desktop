import React from "react";
import { MessageSquare, Plus, Search, Pin, MoreHorizontal, Pencil, Trash2, Share, Copy, Mail, Check } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/marketing_ui/sidebar";
import { Input } from "@/components/marketing_ui/input";
import { Button } from "@/components/marketing_ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/marketing_ui/accordion";

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/marketing_ui/dropdown-menu";

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
      if (res.ok) fetchSessions();
    } catch (e) {
      console.error("Failed to update session", e);
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
    }
  };

  const filteredSessions = sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const pinnedSessions = filteredSessions.filter(s => s.pinned);
  const unpinnedSessions = filteredSessions.filter(s => !s.pinned);
  
  const todaySessions = unpinnedSessions.filter(s => isToday(s.created_at));
  const previousSessions = unpinnedSessions.filter(s => !isToday(s.created_at));

  const navigate = useNavigate();
  const location = useLocation();

  // Extract base path, e.g., if we are on /superadmin/agent/123, base is /superadmin
  const basePathMatch = location.pathname.match(/^(\/[^\/]+(?:\/[^\/]+)?)(?:\/agent|\/dashboard)?/);
  const basePath = basePathMatch ? basePathMatch[1] : "";

  const handleNewChat = () => {
    navigate(`${basePath}/agent`);
    window.dispatchEvent(new Event("agent:new-chat")); // Keep event for legacy state reset if needed
  };

  const handleLoadChat = (sessionId: string) => {
    navigate(`${basePath}/agent/${sessionId}`);
  };

  const renderSessionItem = (session: ChatSession) => {
    const isEditing = editingSessionId === session.id;

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
              tooltip={session.title}
              isActive={session.id === activeSessionId}
              onClick={() => handleLoadChat(session.id)}
              className="h-auto py-1.5 cursor-pointer flex-1"
              render={
                <span className="truncate block w-full pr-6">{session.title}</span>
              }
            />
          )}

          {!isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="absolute right-2 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground">
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
                      window.alert("You can only pin up to 5 chats.");
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
        <Accordion defaultValue={["pinned", "today", "previous"]} className="w-full">
          {pinnedSessions.length > 0 && (
            <AccordionItem value="pinned" className="border-none mb-2">
              <AccordionTrigger className="px-2 py-1.5 hover:no-underline group/acc-trigger flex items-center h-auto min-h-0 border-transparent focus-visible:ring-0">
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
            <AccordionTrigger className="px-2 py-1.5 hover:no-underline group/acc-trigger flex items-center h-auto min-h-0 border-transparent focus-visible:ring-0">
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
            <AccordionTrigger className="px-2 py-1.5 hover:no-underline group/acc-trigger flex items-center h-auto min-h-0 border-transparent focus-visible:ring-0">
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
      
      {/* Share Modal */}
      {shareModalOpen && shareSessionId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border p-6 rounded-lg w-[400px] shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Share Chat</h3>
            <p className="text-sm text-muted-foreground mb-6">
              How would you like to share this chat transcript?
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                className="justify-start w-full"
                onClick={() => handleCopyChat(shareSessionId)}
              >
                {copiedSuccess ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                {copiedSuccess ? "Copied to Clipboard!" : "Copy Markdown to Clipboard"}
              </Button>
              <Button 
                className="justify-start w-full"
                onClick={() => handleShareEmail(shareSessionId)}
                disabled={isSharingEmail || sharedEmailSuccess}
              >
                {sharedEmailSuccess ? <Check className="w-4 h-4 mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                {isSharingEmail ? "Sending..." : sharedEmailSuccess ? "Sent successfully!" : "Send via Email (agent@classgrid.in)"}
              </Button>
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="ghost" onClick={() => setShareModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
