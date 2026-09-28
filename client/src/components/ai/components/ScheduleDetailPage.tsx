import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
  FileText,
  Info,
  StickyNote,
  Trash2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  AlarmClock,
} from "lucide-react";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";
import { NikhilTimeCalendar } from "@/components/marketing_ui/nikhil_time_calendar";
import { toast } from "sonner";
import { apiClient as api } from "@/lib/apiClient";

type ScheduleStatus = "pending" | "sent" | "failed" | "cancelled";

interface AiSchedule {
  _id: string;
  title: string;
  description?: string;
  summary?: string;
  action_info?: string;
  email_subject?: string;
  email_body?: string;
  scheduled_at: string;
  status: ScheduleStatus;
  error_message?: string;
  createdAt?: string;
  created_at?: string;
}

const Field = ({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
    <div className="border rounded-lg px-3 py-2.5 bg-background text-sm min-h-[38px] whitespace-pre-wrap leading-relaxed">
      {children || value || <span className="text-muted-foreground/50">—</span>}
    </div>
  </div>
);

const SectionCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
    <div className="bg-muted/30 px-5 py-4 border-b">
      <h2 className="font-semibold text-card-foreground text-sm uppercase tracking-wide">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export const ScheduleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [schedule, setSchedule] = useState<AiSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Derive back path from URL
  const pathParts = location.pathname.split("/");
  const scheduleIdx = pathParts.indexOf("schedule");
  const backPath = scheduleIdx !== -1
    ? pathParts.slice(0, scheduleIdx + 1).join("/")
    : pathParts.slice(0, -1).join("/") || "/";

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/ai/schedules/${id}`);
        if (res.data?.success) {
          setSchedule(res.data.schedule);
          if (res.data.schedule.scheduled_at) {
            setSelectedDate(new Date(res.data.schedule.scheduled_at));
          }
        } else {
          toast.error("Schedule not found");
          navigate(backPath);
        }
      } catch {
        toast.error("Failed to load schedule");
        navigate(backPath);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchSchedule();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await api.delete(`/api/ai/schedules/${id}`);
      toast.success("Schedule deleted");
      navigate(backPath);
    } catch {
      toast.error("Failed to delete schedule");
    }
  };

  const getStatusBadge = (status: ScheduleStatus) => {
    switch (status) {
      case "pending": return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">● Pending</Badge>;
      case "sent": return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">● Completed</Badge>;
      case "failed": return <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">● Failed</Badge>;
      case "cancelled": return <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400">● Cancelled</Badge>;
    }
  };

  const handleUpdateSchedule = async () => {
    if (!schedule || !selectedDate) return;
    try {
      setIsUpdating(true);
      
      const res = await api.put(`/api/ai/schedules/${schedule._id}`, {
        scheduled_at: selectedDate.toISOString(),
      });
      
      if (res.data.success && res.data.schedule) {
        setSchedule(res.data.schedule);
        toast.success("Schedule updated successfully");
      }
    } catch (err: any) {
      console.error("Failed to update schedule:", err);
      toast.error("Failed to update schedule");
    } finally {
      setIsUpdating(false);
    }
  };

  // ─── LOADING SKELETON ───
  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6 lg:p-8 pb-16 animate-pulse">
        <div className="flex items-center gap-3 mb-8 border-b border-border pb-6">
          <div className="h-8 w-8 bg-muted rounded-lg" />
          <div className="h-8 w-64 bg-muted rounded-md" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 space-y-6">
            <div className="h-40 bg-card border rounded-xl" />
            <div className="h-48 bg-card border rounded-xl" />
            <div className="h-48 bg-card border rounded-xl" />
          </div>
          <div className="xl:col-span-4 space-y-6">
            <div className="h-56 bg-card border rounded-xl" />
            <div className="h-40 bg-card border rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!schedule) return null;

  const createdDateStr = schedule.createdAt || schedule.created_at;
  const summaryText = schedule.summary || schedule.email_subject;
  const detailsText = schedule.action_info;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 pb-16 overflow-y-auto h-full">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-6 mb-8">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => navigate(backPath)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{schedule.title}</h1>
            {getStatusBadge(schedule.status)}
          </div>
          {schedule.description && (
            <p className="text-muted-foreground mt-1 text-sm pl-9">{schedule.description}</p>
          )}
          {createdDateStr && (
            <p className="text-muted-foreground text-xs mt-1 pl-9">
              Created on {format(new Date(createdDateStr), "dd MMM yyyy, hh:mm a")}
            </p>
          )}
        </div>
      </div>

      {/* ── 12-COLUMN GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* LEFT CONTENT (col-span-8) */}
        <div className="xl:col-span-8 space-y-6">

          {/* SCHEDULE DETAILS */}
          <SectionCard title="Schedule Details" subtitle="Timing and context of this scheduled task">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Scheduled Date & Time">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium">
                    {format(new Date(schedule.scheduled_at), "dd MMMM yyyy, hh:mm a")}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Asia/Kolkata · IST</p>
              </Field>
              <Field label="Created On">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>
                    {createdDateStr
                      ? format(new Date(createdDateStr), "dd MMM yyyy, hh:mm a")
                      : "—"}
                  </span>
                </div>
              </Field>
              <Field label="Status">
                {getStatusBadge(schedule.status)}
              </Field>
              <Field label="Schedule ID" value={`#${schedule._id.slice(-8).toUpperCase()}`} />
            </div>
          </SectionCard>

          {/* SUBJECT / TOPIC */}
          {(summaryText) && (
            <SectionCard title="Subject / Topic" subtitle="What this schedule is about">
              <Field label="Subject">
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{summaryText}</span>
                </div>
              </Field>
            </SectionCard>
          )}

          {/* SUMMARY */}
          {schedule.summary && (
            <SectionCard title="Summary" subtitle="Quick overview from the AI">
              <Field label="Summary" value={schedule.summary} />
            </SectionCard>
          )}

          {/* DETAILS & INFORMATION */}
          {detailsText && (
            <SectionCard title="Details & Information" subtitle="Full context and additional information">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Action Information</label>
                <div className="border rounded-lg px-3 py-3 bg-background text-sm min-h-[100px] whitespace-pre-wrap leading-relaxed">
                  {detailsText}
                </div>
              </div>
            </SectionCard>
          )}

          {/* CALENDAR FOR RESCHEDULING */}
          {schedule.status === "pending" && (
            <SectionCard title="Reschedule Task" subtitle="Change the scheduled date and time">
              <div className="flex flex-col gap-4">
                <NikhilTimeCalendar 
                  value={selectedDate} 
                  onChange={setSelectedDate} 
                />
                <div className="flex items-center gap-3 mt-2">
                  <Button 
                    variant="default" 
                    onClick={handleUpdateSchedule}
                    disabled={isUpdating || !selectedDate || selectedDate.getTime() === new Date(schedule.scheduled_at).getTime()}
                  >
                    {isUpdating ? "Saving..." : "Update Schedule"}
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* CALENDAR FOR RESCHEDULING */}
          {schedule.status === "pending" && (
            <SectionCard title="Reschedule Task" subtitle="Change the scheduled date and time">
              <div className="flex flex-col gap-4">
                <NikhilTimeCalendar 
                  value={selectedDate} 
                  onChange={setSelectedDate} 
                />
                <div className="flex items-center gap-3 mt-2">
                  <Button 
                    variant="default" 
                    onClick={handleUpdateSchedule}
                    disabled={isUpdating || !selectedDate || selectedDate.getTime() === new Date(schedule.scheduled_at).getTime()}
                  >
                    {isUpdating ? "Saving..." : "Update Schedule"}
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* DESCRIPTION */}
          {schedule.description && (
            <SectionCard title="Notes" subtitle="Description or notes for this schedule">
              <Field label="Notes" value={schedule.description} />
            </SectionCard>
          )}

        </div>

        {/* RIGHT SIDEBAR (col-span-4) */}
        <div className="xl:col-span-4 space-y-6">
          <div className="sticky top-6 space-y-6">

            {/* STATUS CARD */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="bg-muted/30 px-5 py-4 border-b">
                <h2 className="font-semibold text-card-foreground text-sm uppercase tracking-wide">Status</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  {schedule.status === "pending" && <AlarmClock className="w-5 h-5 text-blue-500" />}
                  {schedule.status === "sent" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  {schedule.status === "failed" && <AlertCircle className="w-5 h-5 text-red-500" />}
                  {schedule.status === "cancelled" && <XCircle className="w-5 h-5 text-slate-500" />}
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Current Status</p>
                    <p className="font-semibold text-sm capitalize">{schedule.status === "sent" ? "Completed" : schedule.status}</p>
                  </div>
                </div>

                {schedule.status === "pending" && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-400">
                    This schedule is active. An email will be sent automatically at the scheduled time.
                  </div>
                )}
                {schedule.status === "sent" && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg p-3 text-xs text-emerald-700 dark:text-emerald-400">
                    Task was completed successfully at the scheduled time.
                  </div>
                )}
              </div>
            </div>

            {/* TIMELINE CARD */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="bg-muted/30 px-5 py-4 border-b">
                <h2 className="font-semibold text-card-foreground text-sm uppercase tracking-wide">Timeline</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Created</label>
                  <p className="text-sm font-medium text-foreground">
                    {createdDateStr ? format(new Date(createdDateStr), "dd MMM yyyy") : "—"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {createdDateStr ? format(new Date(createdDateStr), "hh:mm a") : ""}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Scheduled For</label>
                  <p className="text-sm font-medium text-foreground">
                    {format(new Date(schedule.scheduled_at), "dd MMM yyyy")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(schedule.scheduled_at), "hh:mm a")} · IST
                  </p>
                </div>
              </div>
            </div>

            {/* DELETE */}
            <div className="border-t border-border/40 pt-4">
              <DangerConfirmDialog
                title="Delete Schedule?"
                description="Are you sure you want to cancel and delete this scheduled task? This cannot be undone."
                onConfirm={handleDelete}
              >
                <Button variant="destructive" className="w-full h-11 rounded-xl text-sm font-bold">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Schedule
                </Button>
              </DangerConfirmDialog>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDetailPage;
