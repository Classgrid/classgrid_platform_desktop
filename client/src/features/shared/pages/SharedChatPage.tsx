/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/**
 * SharedChatPage — Public read-only viewer for shared AI chat transcripts.
 * Reuses the same AskAiPanel component from our AI chat system but in read-only mode.
 * URL: share.classgrid.in/:shareId
 */

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AskAiPanel } from "@/components/ai/components/AskAiPanel";

interface SharedMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface SharedChat {
  title: string;
  sharedBy: string;
  messages: SharedMessage[];
  createdAt: string;
}

export function SharedChatPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [chat, setChat] = useState<SharedChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || "https://api.classgrid.in";

  useEffect(() => {
    if (!shareId) return;

    fetch(`${apiUrl}/api/ai/shared/${shareId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Chat not found");
        return res.json();
      })
      .then((data) => setChat(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [shareId, apiUrl]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading shared chat...</p>
        </div>
      </div>
    );
  }

  // Error / Not found state
  if (error || !chat) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-xl font-bold text-foreground mb-2">Chat not found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This shared chat link may have expired or been removed.
          </p>
          <a
            href="https://classgrid.in"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Go to Classgrid
          </a>
        </div>
      </div>
    );
  }

  // Convert shared messages to the format AskAiPanel expects
  const initialMessages = chat.messages.map((msg, i) => ({
    id: `shared-${i}`,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    createdAt: msg.created_at ? new Date(msg.created_at).getTime() : Date.now(),
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Chat Title Area */}
      <div className="border-b border-border bg-background">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{chat.title}</h1>
            <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Shared by <strong className="text-foreground">{chat.sharedBy}</strong> on {new Date(chat.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Content — using the exact same AskAiPanel component */}
      <div className="flex-1 bg-muted/10">
        <div className="max-w-4xl mx-auto py-6">
          <AskAiPanel
            open={true}
            onOpenChange={() => { }}
            variant="in-flow"
            initialMessages={initialMessages}
            autoFocus={false}
            readOnly={true}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by{" "}
          <a href="https://classgrid.in" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            Classgrid AI
          </a>
          {" "}— Your ERP Assistant
        </p>
      </div>
    </div>
  );
}
