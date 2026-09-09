/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/**
 * SharedChatPage — Premium public read-only viewer for shared AI chat transcripts.
 * URL: share.classgrid.in/shared/:shareId
 */

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface SharedMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface SharedChat {
  title: string;
  sharedBy: string;
  sharedByEmail?: string;
  messages: SharedMessage[];
  createdAt: string;
}

/* ── Classgrid Logo SVG ── */
function ClassgridLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#10b981" />
      <path d="M8 10h4v4H8zM14 10h4v4h-4zM20 10h4v4h-4zM8 16h4v4H8zM14 16h4v4h-4zM20 16h4v4h-4z" fill="white" fillOpacity="0.9" />
    </svg>
  );
}

/* ── Single Message Row ── */
function MessageRow({ msg, isUser }: { msg: SharedMessage; isUser: boolean }) {
  if (isUser) {
    // Vercel style User Message: right-aligned dark bubble
    return (
      <div className="shared-msg-row user-row">
        <div className="user-bubble">
          {msg.content}
        </div>
      </div>
    );
  }

  // Vercel style Assistant Message: plain text left-aligned
  return (
    <div className="shared-msg-row assistant-row">
      <div className="assistant-content">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              if (!inline) {
                return (
                  <pre className="shared-code-block">
                    <code {...props}>{children}</code>
                  </pre>
                );
              }
              return <code className="shared-inline-code" {...props}>{children}</code>;
            },
            a({ href, children, ...props }) {
              return (
                <a href={href} target="_blank" rel="noreferrer" className="shared-link" {...props}>
                  {children}
                </a>
              );
            },
          }}
        >
          {msg.content}
        </ReactMarkdown>
      </div>
    </div>
  );
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

  if (loading) {
    return (
      <div className="shared-page">
        <div className="shared-loading">
          <div className="shared-spinner" />
        </div>
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div className="shared-page">
        <div className="shared-error">
          <h2>Chat not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-page">
      {/* Outer page is pure black #000 */}

      {/* ── Header (simple logo) ── */}
      <header className="shared-header">
        <a href="https://classgrid.in" className="shared-logo-link" target="_blank" rel="noopener noreferrer">
          <ClassgridLogo className="shared-logo-icon" />
          <span className="shared-logo-text">Classgrid</span>
        </a>
      </header>

      {/* ── Center Column with slightly lighter background ── */}
      <div className="shared-content-inner">
        
        {/* Top text: Shared by... */}
        <div className="shared-by-header">
          Shared by <strong>{chat.sharedBy}</strong>
        </div>

        {/* Context Card (like Vercel's AI SDK card) */}
        <div className="shared-context-card">
          <div className="shared-context-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div className="shared-context-info">
            <div className="shared-context-title">{chat.title}</div>
            <div className="shared-context-url">https://share.classgrid.in/shared/{shareId}</div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="shared-messages">
          {chat.messages.map((msg, i) => (
            <MessageRow key={i} msg={msg} isUser={msg.role === "user"} />
          ))}
        </div>

      </div>

      <style>{`
        /* ── Page Shell ── */
        .shared-page {
          min-height: 100vh;
          background: #000000; /* Pure black outer */
          color: #ededed;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* ── Header ── */
        .shared-header {
          padding: 24px 24px 0 24px;
        }

        .shared-logo-link {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #ededed;
          transition: opacity 0.2s;
        }

        .shared-logo-link:hover {
          opacity: 0.7;
        }

        .shared-logo-icon {
          width: 24px;
          height: 24px;
        }

        .shared-logo-text {
          font-size: 15px;
          font-weight: 600;
        }

        /* ── Center Column ── */
        .shared-content-inner {
          margin: 0 auto;
          width: 100%;
          max-width: 800px;
          background: #0a0a0a; /* Slightly lighter inner background */
          min-height: calc(100vh - 60px);
          padding: 48px 40px;
          border-left: 1px solid rgba(255, 255, 255, 0.04);
          border-right: 1px solid rgba(255, 255, 255, 0.04);
        }

        /* ── "Shared by" Text ── */
        .shared-by-header {
          font-size: 14px;
          color: #888;
          margin-bottom: 24px;
        }

        .shared-by-header strong {
          color: #ededed;
          font-weight: 500;
        }

        /* ── Context Card ── */
        .shared-context-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: #111;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          margin-bottom: 40px;
        }

        .shared-context-icon {
          color: #888;
        }

        .shared-context-icon svg {
          width: 20px;
          height: 20px;
        }

        .shared-context-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .shared-context-title {
          font-size: 15px;
          font-weight: 600;
          color: #ededed;
        }

        .shared-context-url {
          font-size: 13px;
          color: #666;
        }

        /* ── Messages ── */
        .shared-messages {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .shared-msg-row {
          display: flex;
          width: 100%;
        }

        /* User Message (Right Aligned Bubble) */
        .user-row {
          justify-content: flex-end;
        }

        .user-bubble {
          background: #1e1e1e;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 15px;
          line-height: 1.5;
          color: #ededed;
          max-width: 80%;
          word-wrap: break-word;
        }

        /* Assistant Message (Left Aligned Plain Text) */
        .assistant-row {
          justify-content: flex-start;
        }

        .assistant-content {
          font-size: 15px;
          line-height: 1.7;
          color: #ededed;
          width: 100%;
        }

        .assistant-content p {
          margin: 0 0 16px;
        }

        .assistant-content p:last-child {
          margin-bottom: 0;
        }

        /* Code blocks */
        .shared-code-block {
          background: #000;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 16px;
          overflow-x: auto;
          margin: 16px 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
        }

        .shared-inline-code {
          background: #1e1e1e;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
        }

        /* Links */
        .shared-link {
          color: #10b981;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        /* Loading & Error */
        .shared-loading, .shared-error {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        
        .shared-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(255,255,255,0.1);
          border-top-color: #10b981;
          border-radius: 50%;
          animation: shared-spin 0.8s linear infinite;
        }

        @keyframes shared-spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .shared-content-inner {
            padding: 32px 20px;
            border-left: none;
            border-right: none;
          }
        }
      `}</style>
    </div>
  );
}
