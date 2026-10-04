import { useState } from "react";
import { Info, Check, X, Clock, CalendarDays } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";

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

  const getTimelineSteps = () => {
    if (!history || history.length === 0) return { steps: [], currentStep: 0 };

    const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const isExhausted = used >= limit;
    const isCurrentlyPaused = sortedHistory.length > 0 && sortedHistory[sortedHistory.length - 1].type === "paused";
    const isRevoked = sortedHistory.length > 0 && sortedHistory.some(s => s.type === "revoked");

    const generatedSteps = [];

    // Step 1: Grant
    const grantEvent = sortedHistory.find(h => h.type === "granted");
    if (grantEvent) {
      generatedSteps.push({
        id: "granted",
        title: "Granted",
        description: new Date(grantEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        isCompleted: true,
        isActive: false,
      });
    } else {
      generatedSteps.push({
        id: "granted",
        title: "Granted",
        description: "Initial Grant",
        isCompleted: true,
        isActive: false,
      });
    }

    // Step 2 & Middle Steps
    const middleEvents = sortedHistory.filter(h => h.type !== "granted");
    for (const event of middleEvents) {
      generatedSteps.push({
        id: event.id,
        title: event.type === "paused" ? "Paused" : event.type === "resumed" ? "Resumed" : event.type === "revoked" ? "Revoked" : event.type === "extended" ? "Extended" : event.type,
        description: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        isCompleted: true,
        isActive: false,
      });
    }

    // Final Status Step
    if (!isRevoked) {
      if (isExhausted) {
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
    }

    const activeIndex = generatedSteps.findIndex(s => s.isActive);
    const currentStep = activeIndex !== -1 ? activeIndex : generatedSteps.length;

    return {
      steps: generatedSteps.map(s => ({ ...s })),
      currentStep
    };
  };

  const timeline = getTimelineSteps();
  const totalSteps = timeline.steps.length;
  const progressPercentage = totalSteps > 1 ? Math.min(100, Math.max(0, (timeline.currentStep / (totalSteps - 1)) * 100)) : 100;

  return (
    <>
      <Button variant="outline" size="sm" className="h-8" onClick={() => setIsOpen(true)}>
        <Info className="w-4 h-4 mr-2" />
        Details
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Custom Modal Card */}
          <div className="relative w-full max-w-6xl bg-background border border-border shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">Audit Timeline</h2>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    {timeline.currentStep} of {totalSteps} completed
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-muted">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Custom Scratch-Built Timeline */}
            <div className="p-10 pb-20 overflow-x-auto">
              {(!history || history.length === 0) ? (
                <div className="text-sm text-muted-foreground italic bg-muted/10 p-4 rounded-lg border border-border/30 text-center">
                  No timeline records found.
                </div>
              ) : (
                <div className="relative w-full flex items-center justify-between min-w-[600px] max-w-5xl mx-auto pt-10">
                  
                  {/* Background Track */}
                  <div className="absolute left-0 right-0 top-16 h-[2px] bg-border/40 -z-10" />
                  
                  {/* Active Track */}
                  <div 
                    className="absolute left-0 top-16 h-[2px] bg-emerald-500 -z-10 transition-all duration-1000 ease-in-out" 
                    style={{ width: `${progressPercentage}%` }} 
                  />

                  {/* Steps */}
                  {timeline.steps.map((step, index) => {
                    const isCompleted = index < timeline.currentStep;
                    const isActive = index === timeline.currentStep;
                    
                    return (
                      <div key={index} className="flex flex-col items-center relative group w-32">
                        {/* Circle */}
                        <div 
                          className={`flex items-center justify-center w-12 h-12 rounded-full border-[3px] shadow-sm transition-all duration-500 bg-background
                            ${isCompleted ? "border-emerald-500 text-emerald-500" : 
                              isActive ? "border-emerald-500 text-emerald-500 ring-4 ring-emerald-500/20" : 
                              "border-border text-muted-foreground"}
                          `}
                        >
                          {isCompleted ? (
                            <Check className="w-6 h-6 stroke-[3]" />
                          ) : (
                            <span className={`text-lg font-bold ${isActive ? "animate-pulse" : ""}`}>{index + 1}</span>
                          )}
                        </div>

                        {/* Text */}
                        <div className="absolute top-16 mt-4 flex flex-col items-center text-center w-40">
                          <span className={`text-sm font-bold tracking-wide uppercase transition-colors
                            ${isActive || isCompleted ? "text-foreground" : "text-muted-foreground/50"}`}
                          >
                            {step.title}
                          </span>
                          {step.description && (
                            <span className="text-xs text-muted-foreground mt-2 font-medium">
                              {step.description}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Progress Bar */}
            <div className="p-6 border-t border-border/50 bg-muted/10 flex items-center gap-4">
              <div className="h-2 w-full bg-border/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-muted-foreground min-w-[3rem] text-right">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
