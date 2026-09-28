import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar, Trash2, CheckCircle2, Clock, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { Badge } from "@/components/marketing_ui/badge";
import { toast } from "sonner";
import api from "@/lib/api";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";

type ScheduleStatus = "pending" | "sent" | "failed" | "cancelled";

interface AiSchedule {
  _id: string;
  title: string;
  description: string;
  scheduled_at: string;
  status: ScheduleStatus;
  error_message?: string;
  created_at: string;
}

export const SchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<AiSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | ScheduleStatus>("all");

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/ai/schedules?status=${filter}`);
      if (response.data?.success) {
        setSchedules(response.data.schedules);
      }
    } catch (error) {
      toast.error("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [filter]);

  const handleDelete = async (id: string) => {
    try {
      const response = await api.delete(`/ai/schedules/${id}`);
      if (response.data?.success) {
        toast.success("Schedule deleted");
        setSchedules(schedules.filter(s => s._id !== id));
      }
    } catch (error) {
      toast.error("Failed to delete schedule");
    }
  };

  const getStatusIcon = (status: ScheduleStatus) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-blue-500" />;
      case "sent": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "failed": return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "cancelled": return <XCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: ScheduleStatus) => {
    switch (status) {
      case "pending": return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">Pending</Badge>;
      case "sent": return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">Sent</Badge>;
      case "failed": return <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">Failed</Badge>;
      case "cancelled": return <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400">Cancelled</Badge>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background relative z-10 p-6 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Scheduled Tasks
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Emails and tasks scheduled by your AI Assistant
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSchedules} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border/50 pb-4">
        {["all", "pending", "sent", "failed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border/60 rounded-2xl bg-muted/20">
          <Calendar className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No scheduled tasks</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            You don't have any tasks scheduled. Ask the AI to remind you about something or schedule an email!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((schedule) => (
            <div 
              key={schedule._id} 
              className="bg-card border border-border/50 rounded-xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col group relative"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(schedule.status)}
                  {getStatusBadge(schedule.status)}
                </div>
                
                <DangerConfirmDialog
                  title="Delete Schedule?"
                  description="Are you sure you want to cancel and delete this scheduled task? This cannot be undone."
                  onConfirm={() => handleDelete(schedule._id)}
                >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </DangerConfirmDialog>
              </div>

              <h3 className="font-semibold text-lg line-clamp-1 mb-1 pr-8">{schedule.title}</h3>
              {schedule.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                  {schedule.description}
                </p>
              )}

              <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(schedule.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
                {schedule.error_message && (
                  <span className="text-red-500 truncate max-w-[120px]" title={schedule.error_message}>
                    {schedule.error_message}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
