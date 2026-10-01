import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { toast } from "sonner";
import { Spinner } from "@/components/marketing_ui/spinner";

interface MetaConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  backendUrl: string;
  onSuccess: () => void;
}

export function MetaConfigModal({ isOpen, onClose, backendUrl, onSuccess }: MetaConfigModalProps) {
  const [accessToken, setAccessToken] = useState("");
  const [pageId, setPageId] = useState("");
  const [igAccountId, setIgAccountId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!accessToken) {
      toast.error("Access Token is required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${backendUrl}/api/auth/meta/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          meta_access_token: accessToken,
          meta_page_id: pageId,
          meta_ig_account_id: igAccountId
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Meta integration connected successfully!");
        onSuccess();
        onClose();
        setAccessToken("");
        setPageId("");
        setIgAccountId("");
      } else {
        toast.error(data.message || "Failed to connect Meta integration");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving Meta config");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-6 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-background border border-border rounded-2xl shadow-xl overflow-hidden relative p-6"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold mb-2">Configure Meta</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Enter your Meta Graph API credentials to allow the AI to post to Facebook and Instagram.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Graph API Access Token</label>
                <input 
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="EAAGm0..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Facebook Page ID (Optional)</label>
                <input 
                  type="text"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="1234567890"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Instagram Account ID (Optional)</label>
                <input 
                  type="text"
                  value={igAccountId}
                  onChange={(e) => setIgAccountId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="178414..."
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-500/10 text-blue-500 rounded-lg text-sm mt-4">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>Make sure your token has permissions for pages_manage_posts and instagram_basic, instagram_content_publish.</p>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={isSaving || !accessToken}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSaving ? <Spinner className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Configuration
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
