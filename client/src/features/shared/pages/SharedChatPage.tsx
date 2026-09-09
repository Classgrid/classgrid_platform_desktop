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
 * Inspired by Vercel's shared chat design with gradient edge glows and centered layout.
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

/* ── Classgrid Logo SVG (same as sidebar) ── */
function ClassgridLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#10b981" />
      <path d="M8 10h4v4H8zM14 10h4v4h-4zM20 10h4v4h-4zM8 16h4v4H8zM14 16h4v4h-4zM20 16h4v4h-4z" fill="white" fillOpacity="0.9" />
    </svg>
  );
}

/* ── AI Bot Avatar ── */
function BotAvatar() {
  return (
    <div className="shared-bot-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2M20 14h2M15 13v2M9 13v2" />
      </svg>
    </div>
  );
}

/* ── User Avatar (initials) ── */
function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return <div className="shared-user-avatar">{initials}</div>;
}

/* ── Single Message Row ── */
function MessageRow({ msg, isUser }: { msg: SharedMessage; isUser: boolean }) {
  return (
    <div className={`shared-msg-row ${isUser ? "shared-msg-user" : "shared-msg-assistant"}`}>
      <div className="shared-msg-avatar-col">
        {isUser ? <UserAvatar name="You" /> : <BotAvatar />}
      </div>
      <div className="shared-msg-content-col">
        <div className="shared-msg-role">{isUser ? "You" : "Classgrid AI"}</div>
        {isUser ? (
          <div className="shared-msg-text-user">{msg.content}</div>
        ) : (
          <div className="shared-msg-text-assistant">
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
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="shared-link"
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
                table({ children, ...props }) {
                  return (
                    <div className="shared-table-wrap">
                      <table className="shared-table" {...props}>{children}</table>
                    </div>
                  );
                },
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        )}
        {msg.created_at && (
          <div className="shared-msg-time">
            {new Date(msg.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
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

  // Loading state
  if (loading) {
    return (
      <div className="shared-page">
        <div className="shared-loading">
          <div className="shared-spinner" />
          <p>Loading shared chat...</p>
        </div>
      </div>
    );
  }

  // Error / Not found state
  if (error || !chat) {
    return (
      <div className="shared-page">
        <div className="shared-error">
          <div className="shared-error-icon">🔗</div>
          <h2>Chat not found</h2>
          <p>This shared chat link may have expired or been removed.</p>
          <a href="https://classgrid.in" className="shared-error-btn">
            Go to Classgrid
          </a>
        </div>
      </div>
    );
  }

  const sharedDate = new Date(chat.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const initials = chat.sharedBy
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="shared-page">
      {/* ── Top gradient accent bar ── */}
      <div className="shared-top-gradient" />

      {/* ── Header ── */}
      <header className="shared-header">
        <a href="https://classgrid.in" className="shared-logo-link" target="_blank" rel="noopener noreferrer">
          <ClassgridLogo className="shared-logo-icon" />
          <span className="shared-logo-text">Classgrid</span>
        </a>
      </header>

      {/* ── Content Column (slightly lighter bg than outer page) ── */}
      <div className="shared-content-wrapper">
        <div className="shared-content-inner">
          {/* ── Cover / Hero Card ── */}
          <div className="shared-cover">
            <h1 className="shared-cover-title">{chat.title}</h1>
            <div className="shared-cover-profile">
              <div className="shared-cover-avatar">{initials}</div>
              <div className="shared-cover-info">
                <span className="shared-cover-name">{chat.sharedBy}</span>
                {chat.sharedByEmail && (
                  <span className="shared-cover-email">{chat.sharedByEmail}</span>
                )}
              </div>
            </div>
            <div className="shared-cover-date">{sharedDate}</div>
          </div>

          {/* ── Divider ── */}
          <div className="shared-divider" />

          {/* ── Chat Messages ── */}
          <div className="shared-messages">
            {chat.messages.map((msg, i) => (
              <MessageRow key={i} msg={msg} isUser={msg.role === "user"} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="shared-footer">
        <p>
          Powered by{" "}
          <a href="https://classgrid.in" target="_blank" rel="noopener noreferrer">
            Classgrid AI
          </a>
        </p>
      </footer>

      {/* ── Scoped Styles ── */}
      <style>{`
        /* ── Page Shell ── */
        .shared-page {
          min-height: 100vh;
          background: #0a0a0a;
          color: #ededed;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* ── Top Gradient Accent Bar ── */
        .shared-top-gradient {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          height: 3px;
          background: linear-gradient(90deg, transparent, #10b981, #3b82f6, transparent);
          border-radius: 0 0 4px 4px;
          z-index: 100;
          opacity: 0.8;
        }

        /* ── Header (simple logo, not a bar) ── */
        .shared-header {
          padding: 20px 24px;
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
          width: 28px;
          height: 28px;
        }

        .shared-logo-text {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        /* ── Content Wrapper ── */
        .shared-content-wrapper {
          position: relative;
          max-width: 768px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .shared-content-inner {
          position: relative;
          background: #111;
          min-height: calc(100vh - 56px - 60px);
        }

        /* ── Cover / Hero Section ── */
        .shared-cover {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 56px 32px 40px;
          background: linear-gradient(180deg, rgba(16, 185, 129, 0.04) 0%, transparent 100%);
        }

        .shared-cover-title {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.2;
          color: #fff;
          margin: 0 0 24px;
          max-width: 500px;
        }

        .shared-cover-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .shared-cover-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.02em;
          flex-shrink: 0;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }

        .shared-cover-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
        }

        .shared-cover-name {
          font-size: 15px;
          font-weight: 600;
          color: #fff;
        }

        .shared-cover-email {
          font-size: 13px;
          color: #888;
        }

        .shared-cover-date {
          font-size: 13px;
          color: #666;
          margin-top: 4px;
        }

        /* ── Divider ── */
        .shared-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          margin: 0 32px;
        }

        /* ── Messages ── */
        .shared-messages {
          padding: 24px 32px 48px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .shared-msg-row {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }

        .shared-msg-avatar-col {
          flex-shrink: 0;
          padding-top: 2px;
        }

        .shared-msg-content-col {
          flex: 1;
          min-width: 0;
        }

        .shared-msg-role {
          font-size: 13px;
          font-weight: 600;
          color: #aaa;
          margin-bottom: 6px;
          text-transform: capitalize;
        }

        /* User avatar */
        .shared-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #333;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #ccc;
          border: 1px solid rgba(255,255,255,0.08);
        }

        /* Bot avatar */
        .shared-bot-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }

        .shared-bot-avatar svg {
          width: 16px;
          height: 16px;
        }

        /* User message text */
        .shared-msg-text-user {
          background: #262626;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px;
          line-height: 1.6;
          color: #ededed;
          display: inline-block;
          max-width: 100%;
          word-wrap: break-word;
        }

        /* Assistant message text */
        .shared-msg-text-assistant {
          font-size: 14px;
          line-height: 1.7;
          color: #d4d4d4;
        }

        .shared-msg-text-assistant p {
          margin: 0 0 12px;
        }

        .shared-msg-text-assistant p:last-child {
          margin-bottom: 0;
        }

        .shared-msg-text-assistant strong {
          color: #10b981;
          font-weight: 600;
        }

        .shared-msg-text-assistant ul,
        .shared-msg-text-assistant ol {
          margin: 8px 0 12px 20px;
          padding: 0;
        }

        .shared-msg-text-assistant li {
          margin-bottom: 6px;
          color: #d4d4d4;
        }

        .shared-msg-text-assistant li::marker {
          color: #10b981;
        }

        .shared-msg-text-assistant h1,
        .shared-msg-text-assistant h2,
        .shared-msg-text-assistant h3,
        .shared-msg-text-assistant h4 {
          color: #fff;
          margin: 20px 0 8px;
          font-weight: 600;
        }

        .shared-msg-text-assistant h1 { font-size: 20px; }
        .shared-msg-text-assistant h2 { font-size: 18px; }
        .shared-msg-text-assistant h3 { font-size: 16px; }

        .shared-msg-time {
          font-size: 11px;
          color: #555;
          margin-top: 6px;
        }

        /* Code blocks */
        .shared-code-block {
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 16px;
          overflow-x: auto;
          margin: 12px 0;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 13px;
          line-height: 1.5;
          color: #d4d4d4;
        }

        .shared-inline-code {
          background: #262626;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 13px;
          color: #10b981;
        }

        /* Links */
        .shared-link {
          color: #10b981;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.2s;
        }

        .shared-link:hover {
          color: #34d399;
        }

        /* Tables */
        .shared-table-wrap {
          overflow-x: auto;
          margin: 12px 0;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .shared-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .shared-table th {
          background: #1a1a1a;
          padding: 10px 14px;
          text-align: left;
          font-weight: 600;
          color: #fff;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .shared-table td {
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          color: #aaa;
        }

        .shared-table tr:last-child td {
          border-bottom: none;
        }

        /* ── Footer ── */
        .shared-footer {
          text-align: center;
          padding: 20px;
          font-size: 12px;
          color: #555;
        }

        .shared-footer a {
          color: #10b981;
          text-decoration: none;
          font-weight: 500;
        }

        .shared-footer a:hover {
          text-decoration: underline;
        }

        /* ── Loading State ── */
        .shared-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 16px;
        }

        .shared-loading p {
          font-size: 14px;
          color: #666;
        }

        .shared-spinner {
          width: 28px;
          height: 28px;
          border: 2px solid rgba(255,255,255,0.1);
          border-top-color: #10b981;
          border-radius: 50%;
          animation: shared-spin 0.8s linear infinite;
        }

        @keyframes shared-spin {
          to { transform: rotate(360deg); }
        }

        /* ── Error State ── */
        .shared-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
          padding: 24px;
        }

        .shared-error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .shared-error h2 {
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 8px;
        }

        .shared-error p {
          font-size: 14px;
          color: #888;
          margin: 0 0 24px;
        }

        .shared-error-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          border-radius: 8px;
          background: #10b981;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.2s;
        }

        .shared-error-btn:hover {
          background: #059669;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .shared-edge-glow {
            display: none;
          }

          .shared-content-wrapper {
            padding: 0 12px;
          }

          .shared-cover {
            padding: 32px 20px 28px;
          }

          .shared-cover-title {
            font-size: 22px;
          }

          .shared-messages {
            padding: 16px 16px 40px;
            gap: 24px;
          }

          .shared-content-inner {
            border-left: none;
            border-right: none;
          }
        }
      `}</style>
    </div>
  );
}
