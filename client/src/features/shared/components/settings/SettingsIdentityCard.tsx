import React from "react";
import { Fingerprint, Copy, Check } from "lucide-react";
import { useUserProfile } from "../../queries/useUserProfile";
import { toast } from "sonner";
import { useState } from "react";

export function SettingsIdentityCard() {
  const { data: userProfile } = useUserProfile();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!userProfile) return null;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(type);
    toast.success(`${type} copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm mb-6">
      <div className="p-5 border-b border-border">
        <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
          <Fingerprint size={18} className="text-foreground" /> System Identity
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your unique system identifiers. You may need these for API integration or support.
        </p>
      </div>
      
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm text-foreground">User ID</span>
            <span className="text-xs text-muted-foreground font-mono">{userProfile.id}</span>
          </div>
          <button
            onClick={() => handleCopy(userProfile.id, 'User ID')}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="Copy User ID"
          >
            {copiedId === 'User ID' ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-muted-foreground" />}
          </button>
        </div>
        
        {userProfile.orgId && (
          <div className="flex items-center justify-between p-5">
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-sm text-foreground">Organization ID</span>
              <span className="text-xs text-muted-foreground font-mono">{userProfile.orgId}</span>
            </div>
            <button
              onClick={() => handleCopy(userProfile.orgId, 'Organization ID')}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              title="Copy Organization ID"
            >
              {copiedId === 'Organization ID' ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-muted-foreground" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
