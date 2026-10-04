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
      case "block": return "User Blocked";
      case "purchase": return "Credits Purchased";
      default: return "Action Recorded";
    }
  };

  const getDescription = (item: any) => {
    switch(item.type) {
      case "grant": return `Granted ${formatNumber(item.credits_added)} credits.`;
      case "extend": return `Extended to ${item.metadata?.newEndDate ? new Date(item.metadata.newEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}.`;
      default: return null;
    }
  };

  const getTimelineSteps = () => {
    if (!history || history.length === 0) return { steps: [], currentStep: 0 };
    
    const generatedSteps: { title: string; description: string; isCompleted: boolean; isActive: boolean; id: string }[] = [];
    
    // 1. Granted
    const grantEvent = history.find(h => h.type === "grant");
    generatedSteps.push({
      id: "grant",
      title: "Credits Granted",
      description: grantEvent ? new Date(grantEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Unknown",
      isCompleted: true,
      isActive: false,
    });

    // 2. Process chronological events
    const sortedHistory = [...history].filter(h => h.type !== "grant").sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let isCurrentlyPaused = false;
    
    sortedHistory.forEach((ev, idx) => {
      if (ev.type === "pause") {
         isCurrentlyPaused = true;
         generatedSteps.push({
           id: `pause-${idx}`,
           title: "Paused",
           description: new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
           isCompleted: true,
           isActive: false,
         });
      } else if (ev.type === "resume") {
         isCurrentlyPaused = false;
         generatedSteps.push({
           id: `resume-${idx}`,
           title: "Resumed",
           description: new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
           isCompleted: true,
           isActive: false,
         });
      } else if (ev.type === "extend") {
         generatedSteps.push({
           id: `extend-${idx}`,
           title: "Extended",
           description: `${new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${getDescription(ev) || ''}`,
           isCompleted: true,
           isActive: false,
         });
      } else if (ev.type === "revoke") {
         generatedSteps.push({
           id: `revoke-${idx}`,
           title: "Revoked",
           description: new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
           isCompleted: true,
           isActive: false,
         });
      } else {
         generatedSteps.push({
           id: `event-${idx}`,
           title: getTitle(ev.type),
           description: new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
           isCompleted: true,
           isActive: false,
         });
      }
    });

    // 3. Determine terminal/current state
    const isRevoked = history.some(h => h.type === "revoke");
    const isExhausted = limit > 0 && used >= limit;

    if (isRevoked) {
      const last = generatedSteps[generatedSteps.length - 1];
      if (last.title === "Revoked") {
         last.isActive = true;
         last.isCompleted = false;
      }
    } else if (isExhausted) {
      generatedSteps.push({
        id: "exhausted",
        title: "Exhausted",
        description: "All credits used",
        isCompleted: false,
        isActive: true,
      });
    } else if (isCurrentlyPaused) {
      const last = generatedSteps.filter(s => s.title === "Paused").pop();
      if (last) {
         last.isActive = true;
         last.isCompleted = false;
      }
      generatedSteps.push({
        id: "expiration",
        title: "Expiration",
        description: "Pending",
        isCompleted: false,
        isActive: false,
      });
    } else {
      generatedSteps.push({
        id: "active",
        title: "Active",
        description: "Consuming credits",
        isCompleted: false,
        isActive: true,
      });
      generatedSteps.push({
        id: "expiration",
        title: "Expiration",
        description: "Pending",
        isCompleted: false,
        isActive: false,
      });
    }

    const activeIndex = generatedSteps.findIndex(s => s.isActive);
    const currentStep = activeIndex !== -1 ? activeIndex : generatedSteps.length;

    return {
      steps: generatedSteps.map(s => ({ id: s.id, title: s.title, description: s.description })),
      currentStep
    };
  };

  const timeline = getTimelineSteps();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Info className="w-4 h-4 mr-2" />
          Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-[#0a0a0a] border-border text-foreground">
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
                  steps={timeline.steps} 
                  currentStep={timeline.currentStep} 
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
