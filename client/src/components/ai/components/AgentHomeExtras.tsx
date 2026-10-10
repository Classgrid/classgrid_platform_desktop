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
  { icon: BarChart3, label: "Analyse a file", prompt: "What kinds of files can you analyse for me, and what can you do with them? Tell me how to upload one." },
  { icon: CalendarCheck, label: "Exam planner", prompt: "Make me a 2-week exam study planner with daily topics, revision days and short breaks." },
  { icon: BellRing, label: "WhatsApp reminder", prompt: "Help me set up a daily WhatsApp reminder. Ask me what time and what it should say." },
  { icon: Globe, label: "Build a website", prompt: "Build me a simple, modern one-page personal portfolio website." },
];

/** Clicking a card sends its prompt to the AI straight away. */
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
          <span className="leading-tight">{label}</span>
        </button>
      ))}
    </div>
  );
}

const prettyApp = (id: string) =>
  String(id).replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

type IntegrationInfo = { id: string; name: string; imgUrl?: string; invertInDarkMode?: boolean; invertInLightMode?: boolean };

/** Connected apps (with their real logos from the AI Hub list) and scheduled tasks; hidden when there is neither. */
export function CapabilityStrip({ integrations = [] }: { integrations?: IntegrationInfo[] }) {
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

  // Same ids as the AI Hub (it matches this status list against INTEGRATIONS_LIST); unknown ids still show by name
  const connected = [...new Set(apps)].map((id) => {
    const info = integrations.find((i) => i.id === id || i.id === `mcp-${id}`);
    return { id, name: info?.name || prettyApp(id), info };
  });
  if (connected.length === 0 && scheduled === 0) return null;
  const label = connected.length === 1 ? `${connected[0]!.name} connected` : `${connected.length} apps connected`;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {connected.length > 0 && (
        <span className="inline-flex items-center gap-2">
          <span className="flex items-center -space-x-1">
            {connected.slice(0, 5).map(({ id, name, info }) =>
              info?.imgUrl ? (
                <img
                  key={id}
                  src={info.imgUrl}
                  alt={name}
                  title={name}
                  className={`h-4 w-4 rounded-sm object-contain bg-background ring-2 ring-background ${info.invertInDarkMode ? "dark:invert" : ""} ${info.invertInLightMode ? "invert dark:invert-0" : ""}`}
                />
              ) : (
                <Plug key={id} className="h-3.5 w-3.5" aria-label={name} />
              )
            )}
          </span>
          {label}
        </span>
      )}
      {scheduled > 0 && (
        <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{scheduled} scheduled {scheduled === 1 ? "task" : "tasks"}</span>
      )}
    </div>
  );
}
