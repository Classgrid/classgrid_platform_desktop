// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
import { useState } from "react";
import { Button } from "@/components/marketing_ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/marketing_ui/dialog";
import { Info, Play, Pause, Trash2, Gift, Clock, CalendarDays } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { Stepper } from "@/components/marketing_ui/stepper";

interface ViewGrantedCreditsDetailsProps {
  used: number;
  limit: number;
  history: Array<{
    id: string;
    type: string;
    credits_added: number;
    status: string;
    date: string;
    metadata: any;
  }>;
}

export function ViewGrantedCreditsDetails({ used, limit, history }: ViewGrantedCreditsDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const percent = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0;

  const getIcon = (type: string) => {
    switch(type) {
      case "grant": return <Gift className="w-4 h-4 text-emerald-500" />;
      case "pause": return <Pause className="w-4 h-4 text-amber-500" />;
      case "resume": return <Play className="w-4 h-4 text-blue-500" />;
      case "revoke": return <Trash2 className="w-4 h-4 text-red-500" />;
      case "extend": return <CalendarDays className="w-4 h-4 text-purple-500" />;
      default: return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTitle = (type: string) => {
    switch(type) {
      case "grant": return "Credits Granted";
      case "pause": return "Access Paused";
      case "resume": return "Access Resumed";
      case "revoke": return "Credits Revoked";
      case "extend": return "Duration Extended";
      default: return "Action Recorded";
    }
  };

  const getDescription = (item: any) => {
    switch(item.type) {
      case "grant": return `Granted ${formatNumber(item.credits_added)} credits.`;
      case "extend": return `Extended expiration to ${item.metadata?.newEndDate ? new Date(item.metadata.newEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}.`;
      default: return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Info className="w-4 h-4 mr-2" />
          Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-[#0a0a0a] border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl">Promotional Credit Details</DialogTitle>
          <DialogDescription>
            View consumption and the lifecycle timeline of these promotional credits.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-8 mt-4">
          
          {/* Timeline Section */}
          <div className="w-full">
            <h4 className="text-sm font-medium mb-4 flex items-center text-muted-foreground"><Clock className="w-4 h-4 mr-2"/> Audit Timeline</h4>
            
            {(!history || history.length === 0) ? (
              <div className="text-sm text-muted-foreground italic bg-muted/10 p-4 rounded-lg border border-border/30 text-center">
                No timeline records found for this promotional grant.
              </div>
            ) : (
              <div className="w-full bg-muted/5 border border-border/50 rounded-xl p-4">
                <Stepper 
                  steps={[...history].reverse().map(item => ({
                    id: item.id,
                    title: getTitle(item.type),
                    description: `${new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${getDescription(item) || ''}`
                  }))} 
                  currentStep={history.length - 1} 
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
