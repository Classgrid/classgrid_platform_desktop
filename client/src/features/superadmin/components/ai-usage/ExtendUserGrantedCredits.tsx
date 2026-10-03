import React, { useState } from "react";
import { Button } from "@/components/marketing_ui/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/marketing_ui/popover";
import { Calendar } from "@/components/marketing_ui/nikhil_calendar";
import { format } from "date-fns";
import { aiUsageQueries } from "../../queries/useAiUsage";

export function ExtendUserGrantedCredits({ userId, currentExpiry }: { userId: string, currentExpiry?: string | null }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    currentExpiry ? new Date(currentExpiry) : undefined
  );
  const queryClient = useQueryClient();

  const handleExtend = async () => {
    if (!selectedDate) {
      toast.error("Please select an end date");
      return;
    }
    setIsLoading(true);
    try {
      await aiUsageQueries.extendCredits(userId, selectedDate.toISOString());
      toast.success("Granted credits expiration extended successfully.");
      queryClient.invalidateQueries({ queryKey: ["aiUsage", "user", userId] });
      queryClient.invalidateQueries({ queryKey: ["aiUsage"] });
      queryClient.invalidateQueries({ queryKey: ["ai-usage-user"] });
      setIsOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || "Failed to extend credits");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          size="sm"
          variant="outline" 
          onClick={(e) => e.stopPropagation()}
        >
          <CalendarIcon className="w-4 h-4 mr-2" />
          Extend
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 bg-card border border-border" align="end" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <h4 className="font-medium text-sm text-foreground">Extend Expiration</h4>
            <p className="text-xs text-muted-foreground">Select a new expiration date.</p>
          </div>
          
          <div className="border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-muted/30 px-4 py-2 border-b border-border">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">New Expiry Date</div>
                <div className="font-semibold text-foreground">{selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select date"}</div>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={{ before: new Date() }}
              className="bg-card"
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleExtend} disabled={isLoading || !selectedDate}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Expiry
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
