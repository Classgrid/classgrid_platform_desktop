import React, { useState } from "react";
import { X, FileText, Code, Eye, ListTodo } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";

export type WorkspaceTab = "files" | "plan" | "code" | "preview";

interface WorkspacePanelProps {
  isOpen: boolean;
  onClose: () => void;
  chatFiles: any[];
  setPreviewFile: (file: any) => void;
  hasPlan: boolean;
  isExecuting: boolean;
  planNode?: React.ReactNode;
  currentHtml?: string;
  currentCss?: string;
}

export function WorkspacePanel({
  isOpen,
  onClose,
  chatFiles,
  setPreviewFile,
  hasPlan,
  isExecuting,
  planNode,
  currentHtml = "",
  currentCss = "",
}: WorkspacePanelProps) {
  // Determine which tabs to show based on state
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("files");

  // Auto-switch to plan if a plan exists and we were on files
  React.useEffect(() => {
    if (hasPlan && activeTab === "files") {
      setActiveTab("plan");
    }
  }, [hasPlan]);

  // Auto-switch to preview if executing
  React.useEffect(() => {
    if (isExecuting && (activeTab === "files" || activeTab === "plan")) {
      setActiveTab("preview");
    }
  }, [isExecuting]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 450, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.3 }}
      className="shrink-0 h-full bg-background border-l border-border/50 flex flex-col overflow-hidden shadow-xl z-50"
    >
      <div className="shrink-0 flex items-center justify-between px-4 pt-3 h-14 border-b border-border/50">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          {hasPlan && (
            <Button
              variant={activeTab === "plan" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("plan")}
              className="text-xs h-8"
            >
              <ListTodo className="h-4 w-4 mr-2" />
              Plan
            </Button>
          )}
          {isExecuting && (
            <>
              <Button
                variant={activeTab === "code" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("code")}
                className="text-xs h-8"
              >
                <Code className="h-4 w-4 mr-2" />
                Code
              </Button>
              <Button
                variant={activeTab === "preview" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("preview")}
                className="text-xs h-8"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </>
          )}
          <Button
            variant={activeTab === "files" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("files")}
            className="text-xs h-8"
          >
            <FileText className="h-4 w-4 mr-2" />
            Files
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 shrink-0 ml-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto w-[450px]">
        {activeTab === "files" && (
          <div className="p-4">
            {chatFiles.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center mt-10">
                No files referenced yet
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {chatFiles.map((f, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setPreviewFile({ src: f.url, name: f.name, mimeType: f.mimeType })
                    }
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted transition-colors text-left cursor-pointer"
                  >
                    <div className="h-10 w-10 shrink-0 bg-primary/10 rounded flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{f.name}</div>
                      <div className="text-[11px] text-muted-foreground uppercase">
                        {f.mimeType
                          .split("/")
                          .pop()
                          ?.replace("vnd.openxmlformats-officedocument.spreadsheetml.sheet", "excel")
                          .replace("jpeg", "jpg")}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "plan" && (
          <div className="p-4 h-full overflow-y-auto">
            {planNode ? (
              planNode
            ) : !hasPlan ? (
              <div className="text-sm text-muted-foreground text-center mt-10">
                No active plan
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center mt-10">
                Loading plan...
              </div>
            )}
          </div>
        )}

        {activeTab === "code" && (
          <div className="p-4 h-full flex flex-col gap-4">
            <div className="flex-1 overflow-auto rounded-lg bg-[#1e1e1e] p-4 text-xs font-mono text-gray-300">
              <div className="text-gray-500 mb-2 select-none">// index.html</div>
              <pre><code>{currentHtml || "<!-- Waiting for code... -->"}</code></pre>
            </div>
            <div className="flex-1 overflow-auto rounded-lg bg-[#1e1e1e] p-4 text-xs font-mono text-gray-300">
              <div className="text-gray-500 mb-2 select-none">/* style.css */</div>
              <pre><code>{currentCss || "/* Waiting for CSS... */"}</code></pre>
            </div>
          </div>
        )}

        {activeTab === "preview" && (
          <div className="h-full w-full bg-white relative">
            {!currentHtml && !currentCss ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Waiting for rendering...
              </div>
            ) : (
              <iframe
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <style>
                        /* Base resets */
                        body { margin: 0; font-family: system-ui, sans-serif; }
                        * { box-sizing: border-box; }
                        ${currentCss}
                      </style>
                    </head>
                    <body>
                      ${currentHtml}
                    </body>
                  </html>
                `}
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
