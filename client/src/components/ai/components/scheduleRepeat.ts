// Label for a repeating AI schedule (server: utils/schedule-repeat.js), e.g. "Repeats daily · until 16 Oct"
export type ScheduleRepeat = {
  repeat?: "once" | "daily" | "weekly" | "custom";
  repeat_days?: number[];
  repeat_until?: string;
  run_count?: number;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function repeatLabel(s: ScheduleRepeat): string | null {
  if (!s.repeat || s.repeat === "once") return null;
  const what = s.repeat === "custom"
    ? `every ${(s.repeat_days || []).map((d) => DAY_NAMES[d]).filter(Boolean).join(", ")}`
    : s.repeat;
  const until = s.repeat_until
    ? ` · until ${new Date(s.repeat_until).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
    : "";
  const sent = s.run_count ? ` · sent ${s.run_count}×` : "";
  return `Repeats ${what}${until}${sent}`;
}
