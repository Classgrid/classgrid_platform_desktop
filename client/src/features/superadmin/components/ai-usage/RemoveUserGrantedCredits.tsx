// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
import React, { useState } from "react";
import { Button } from "@/components/marketing_ui/button";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";

export function RemoveUserGrantedCredits({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      await apiClient.post(`/api/super-admin/ai-usage/users/${userId}/credits/remove`);
      toast.success("Granted credits removed successfully.");
      queryClient.invalidateQueries({ queryKey: ["aiUsage", "user", userId] });
      queryClient.invalidateQueries({ queryKey: ["aiUsage"] });
      setIsDialogOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || "Failed to remove credits");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        size="sm"
        variant="destructive"
        onClick={(e) => {
          e.stopPropagation();
          setIsDialogOpen(true);
        }}
      >
        Remove
      </Button>
      
      <DangerConfirmDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleRemove}
        title="Remove Granted Credits"
        description="Are you sure you want to remove all remaining granted credits for this user? This action cannot be undone and will revoke their active promotional credits immediately."
        actionLabel="Yes, Remove Credits"
        warningMessage="The user's granted balance will be permanently set to zero."
        isLoading={isLoading}
      />
    </>
  );
}
