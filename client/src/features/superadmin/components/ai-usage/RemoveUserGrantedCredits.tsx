// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
import React, { useState } from "react";
import { Button } from "@/components/marketing_ui/button";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";

export function RemoveUserGrantedCredits({ userId, transactionId }: { userId: string, transactionId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      await apiClient.post(`/api/super-admin/ai-usage/users/${userId}/credits/${transactionId}/remove`);
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
        description="Are you sure you want to revoke this specific grant? This will permanently deduct the remaining credits from their promotional pool."
        actionLabel="Yes, Remove Credits"
        warningMessage="This action cannot be undone."
        isLoading={isLoading}
      />
    </>
  );
}
