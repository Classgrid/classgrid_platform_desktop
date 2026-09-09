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
  sharedByAvatar?: string;
  messages: SharedMessage[];
  createdAt: string;
}

/* ── Removed Fake Logo Component ── */

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

      {/* ── Header (Real logo) ── */}
      <header className="shared-header">
        <a href="https://classgrid.in" className="shared-logo-link" target="_blank" rel="noopener noreferrer">
          <img src="/logo.png" alt="Classgrid" className="shared-logo-icon" />
          <span className="shared-logo-text">Classgrid</span>
        </a>
      </header>

      {/* ── Center Column Wrapper ── */}
      <div className="shared-center-wrapper">
        
        {/* Author Block (Changelog style, but positioned outside like Vercel) */}
        <div className="changelog-author-block">
          <span className="shared-by-text-prefix">Shared by</span>
          {chat.sharedByAvatar ? (
            <img src={chat.sharedByAvatar} alt={chat.sharedBy} className="author-avatar" />
          ) : (
            <div className="author-avatar fallback">
              {chat.sharedBy.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
          )}
          <div className="author-text-col">
            <span className="author-name">{chat.sharedBy}</span>
            {chat.sharedByEmail && <span className="author-email">{chat.sharedByEmail}</span>}
          </div>
        </div>

        {/* ── Inner Content (Context Card & Messages) ── */}
        <div className="shared-content-inner">
          
          {/* Chat Messages */}
        <div className="shared-messages">
          {chat.messages.map((msg, i) => (
            <MessageRow key={i} msg={msg} isUser={msg.role === "user"} />
          ))}
        </div>

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
          object-fit: contain;
        }

        .shared-logo-text {
          font-size: 15px;
          font-weight: 600;
        }

        /* ── Center Wrapper ── */
        .shared-center-wrapper {
          margin: 0 auto;
          width: 100%;
          max-width: 650px;
          display: flex;
          flex-direction: column;
          padding: 16px;
        }

        /* ── Inner Content ── */
        .shared-content-inner {
          width: 100%;
          background: #0a0a0a;
          min-height: calc(100vh - 120px);
          padding: 48px 40px;
          border-left: 1px solid rgba(255, 255, 255, 0.04);
          border-right: 1px solid rgba(255, 255, 255, 0.04);
          display: flex;
          flex-direction: column;
        }

        /* ── Changelog-Style Author Block ── */
        .changelog-author-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
        }
        
        .author-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .shared-by-text-prefix {
          color: #888;
          font-size: 14px;
          font-weight: 400;
        }

        .author-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
        }

        .author-avatar.fallback {
          background: #333;
          color: #ededed;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }

        .author-text-col {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }

        .author-name {
          color: #ededed;
          font-size: 14px;
          font-weight: 500;
          line-height: 1;
        }

        .author-email {
          color: #888;
          font-size: 13px;
          line-height: 1;
        }

        /* ── Messages ── */
        .shared-messages {
          display: flex;
          flex-direction: column;
          gap: 24px;
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
          background: #2a2a2a;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 24px;
          font-weight: 400;
          letter-spacing: normal;
          color: #ededed;
          max-width: 80%;
          word-wrap: break-word;
        }

        /* Assistant Message (Left Aligned Plain Text) */
        .assistant-row {
          justify-content: flex-start;
        }

        .assistant-content {
          font-size: 14px;
          line-height: 24px;
          font-weight: 400;
          letter-spacing: normal;
          color: #ededed;
          width: 100%;
          max-width: 95%;
        }

        .assistant-content p {
          margin: 0 0 10px;
        }

        .assistant-content p:last-child {
          margin-bottom: 0;
        }

        /* Headings inline/tight */
        .assistant-content h1, 
        .assistant-content h2, 
        .assistant-content h3, 
        .assistant-content h4 {
          font-size: 14px;
          font-weight: 600;
          margin: 16px 0 4px;
          color: #fff;
        }

        /* Lists */
        .assistant-content ul, 
        .assistant-content ol {
          margin: 0 0 10px 20px;
          padding: 0;
        }

        .assistant-content li {
          margin-bottom: 4px;
        }

        /* Code blocks (subtle, no huge borders) */
        .shared-code-block {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          overflow-x: auto;
          margin: 8px 0;
          font-family: 'JetBrains Mono', monospace;
          
          /* Match Link Share Alert sizing */
          width: 100%;
          max-width: 100%;
          padding: 10px 12px;
          font-size: 14px;
        }

        .shared-inline-code {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 4px;
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
