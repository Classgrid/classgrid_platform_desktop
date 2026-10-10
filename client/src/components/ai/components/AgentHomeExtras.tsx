// Home screen of the AI agent (empty New Chat): a greeting by time of day, starter cards that show what the
// agent can do, and a small strip with the user's connected apps and scheduled tasks.
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarCheck, BellRing, Globe, Plug, Clock } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

/** "Good evening, Nikhil" from the viewer's local time and first name. */
export function homeGreeting(name?: string | null) {
  const first = String(name || "").trim().split(/\s+/)[0];
  const h = new Date().getHours();
  const who = first ? `, ${first}` : "";
  if (h >= 5 && h < 12) return `Good morning${who}`;
  if (h >= 12 && h < 17) return `Good afternoon${who}`;
  if (h >= 17 && h < 22) return `Good evening${who}`;
  return first ? `Working late, ${first}?` : "Working late?";
}

const STARTERS = [
  { icon: BarChart3, label: "Analyse a file", prompt: "Analyse the file I'm attaching and give me the key insights with a chart." },
  { icon: CalendarCheck, label: "Make an exam planner", prompt: "Make me a day-by-day exam study planner. My exams start on " },
  { icon: BellRing, label: "Daily WhatsApp reminder", prompt: "Every day at 7 AM, send me a short summary of my tasks on WhatsApp." },
  { icon: Globe, label: "Build me a website", prompt: "Build me a simple one-page website for " },
];

/** Clicking a card puts its prompt in the input so the user can finish or send it. */
export function StarterCards({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="grid w-full max-w-[640px] grid-cols-2 gap-2 sm:grid-cols-4">
      {STARTERS.map(({ icon: Icon, label, prompt }) => (
        <button
          key={label}
          type="button"
          onClick={() => onPick(prompt)}
          className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-left text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </button>
      ))}
    </div>
  );
}

const prettyApp = (id: string) =>
  String(id).replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** "Notion, YouTube connected · 2 scheduled tasks", shown only when there is something to show. */
export function CapabilityStrip() {
  const { data: apps = [] } = useQuery({
    queryKey: ["agent-home-connected"],
    queryFn: async () => {
      const res = await apiClient.get<{ connected?: string[] }>("/api/ai-integrations/status");
      return Array.isArray(res.data?.connected) ? res.data.connected : [];
    },
    staleTime: 5 * 60 * 1000,
  });
  const { data: scheduled = 0 } = useQuery({
    queryKey: ["agent-home-scheduled"],
    queryFn: async () => {
      const res = await apiClient.get<{ success?: boolean; schedules?: unknown[] }>("/api/ai/schedules?status=pending");
      return Array.isArray(res.data?.schedules) ? res.data.schedules.length : 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const names = [...new Set(apps.map(prettyApp))];
  if (names.length === 0 && scheduled === 0) return null;
  const appText = names.length > 3 ? `${names.slice(0, 3).join(", ")} +${names.length - 3}` : names.join(", ");

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {names.length > 0 && (
        <span className="inline-flex items-center gap-1.5"><Plug className="h-3.5 w-3.5" />{appText} connected</span>
      )}
      {scheduled > 0 && (
        <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{scheduled} scheduled {scheduled === 1 ? "task" : "tasks"}</span>
      )}
    </div>
  );
}
