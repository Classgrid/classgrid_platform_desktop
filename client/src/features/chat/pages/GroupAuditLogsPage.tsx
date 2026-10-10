import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { DataTable } from "@/components/marketing_ui/data-table";
import { ResponsiveSelect } from "@/components/marketing_ui/responsive-select";
import { NikhilTimeCalendar } from "@/components/marketing_ui/nikhil_time_calendar";
import { SuperadminFilterBar } from "@/features/superadmin/components/SuperadminFilterBar";
import { toast } from "sonner";

// Group audit log (Grid): who did what in which group, from GET /api/group-chat/audit-logs.
// Super admin sees every group, org admins their org's groups, everyone else the groups they admin.

type AuditLog = {
  id: string;
  created_at: string;
  group_id: string | null;
  group_name?: string | null;
  action: string;
  actor_id?: string | null;
  actor_name?: string | null;
  actor_role?: string | null;
  target_id?: string | null;
  target_type?: string | null;
  target_name?: string | null;
  old_value?: any;
  new_value?: any;
  ip_address?: string | null;
  user_agent?: string | null;
};

// Readable name and badge colour for each action
const ACTIONS: Record<string, { label: string; tone: string }> = {
  group_created: { label: "Group created", tone: "green" },
  group_deleted: { label: "Group deleted", tone: "red" },
  group_details_changed: { label: "Details changed", tone: "blue" },
  group_photo_changed: { label: "Photo changed", tone: "blue" },
  group_banner_changed: { label: "Banner changed", tone: "blue" },
  permissions_updated: { label: "Settings changed", tone: "blue" },
  disappearing_messages_changed: { label: "Disappearing messages", tone: "blue" },
  member_added: { label: "Member added", tone: "green" },
  member_joined: { label: "Member joined", tone: "green" },
  join_requested: { label: "Join requested", tone: "gray" },
  join_request_approved: { label: "Request approved", tone: "green" },
  join_request_rejected: { label: "Request rejected", tone: "amber" },
  member_removed: { label: "Member removed", tone: "red" },
  member_left: { label: "Member left", tone: "amber" },
  member_promoted: { label: "Made admin", tone: "violet" },
  member_demoted: { label: "Removed as admin", tone: "amber" },
  message_deleted: { label: "Message deleted", tone: "red" },
  messages_bulk_deleted: { label: "Messages deleted", tone: "red" },
  message_edited: { label: "Message edited", tone: "blue" },
  message_pinned: { label: "Pinned", tone: "violet" },
  message_unpinned: { label: "Unpinned", tone: "gray" },
  message_approved: { label: "Message approved", tone: "green" },
  message_rejected: { label: "Message rejected", tone: "amber" },
};

const TONES: Record<string, string> = {
  green: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
  red: "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400",
  blue: "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400",
  amber: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
  violet: "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-400",
  gray: "bg-muted text-muted-foreground border-border",
};

const FIELD_LABELS: Record<string, string> = {
  name: "Name", description: "Description", avatar_url: "Photo", banner_url: "Banner",
  send_message_policy: "Who can send messages", send_attachments_policy: "Who can send attachments",
  add_member_policy: "Who can add members", edit_info_policy: "Who can edit info", create_poll_policy: "Who can create polls",
  require_message_approval: "Message approval", require_join_approval: "Join approval", group_type: "Group type",
  is_private: "Private", is_official: "Official", message_ttl: "Disappearing messages", role: "Role",
};

function actionMeta(action: string) {
  return ACTIONS[action] || { label: action.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()), tone: "gray" };
}

function short(v: any, max = 60): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "On" : "Off";
  const t = typeof v === "object" ? JSON.stringify(v) : String(v);
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

// One line describing what changed, e.g. "Name: Maths → Maths 10A"
function describe(log: AuditLog): string {
  const oldV = log.old_value && typeof log.old_value === "object" ? log.old_value : null;
  const newV = log.new_value && typeof log.new_value === "object" ? log.new_value : null;
  if (log.action === "message_edited") return `"${short(oldV?.message, 40)}" → "${short(newV?.message, 40)}"`;
  if (log.action === "message_deleted") return `"${short(oldV?.message, 70)}"`;
  if (log.action === "messages_bulk_deleted") return `${oldV?.count ?? "?"} messages`;
  if (log.action === "message_rejected" && newV?.reason) return `Reason: ${short(newV.reason)}`;
  if (oldV || newV) {
    const keys = [...new Set([...Object.keys(oldV || {}), ...Object.keys(newV || {})])].filter((k) => !["message", "sender_id", "deleted_by", "user_id", "added_by"].includes(k));
    if (keys.length) {
      return keys.slice(0, 2).map((k) => {
        const label = FIELD_LABELS[k] || k;
        return oldV && k in oldV ? `${label}: ${short(oldV[k], 24)} → ${short(newV?.[k], 24)}` : `${label}: ${short(newV?.[k], 30)}`;
      }).join(" · ") + (keys.length > 2 ? ` +${keys.length - 2} more` : "");
    }
    if (newV?.message) return `"${short(newV.message, 70)}"`;
  }
  return "";
}

// "Chrome · Windows" from a user agent
function device(ua?: string | null): string {
  if (!ua) return "—";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} · ${os}` : browser;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

const PAGE_SIZE = 50;

export function GroupAuditLogsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [groupId, setGroupId] = useState("");
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [exporting, setExporting] = useState(false);

  // Search waits for a short pause in typing
  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);
  useEffect(() => setPage(1), [search, groupId, action, dateFrom, dateTo]);

  const params = useMemo(() => {
    const p: Record<string, string> = { page: String(page), pageSize: String(PAGE_SIZE) };
    if (search) p.search = search;
    if (groupId) p.groupId = groupId;
    if (action) p.action = action;
    if (dateFrom) { const d = new Date(dateFrom); d.setHours(0, 0, 0, 0); p.from = d.toISOString(); }
    if (dateTo) { const d = new Date(dateTo); d.setHours(23, 59, 59, 999); p.to = d.toISOString(); }
    return p;
  }, [page, search, groupId, action, dateFrom, dateTo]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["group-audit-logs", params],
    queryFn: async () => (await apiClient.get("/api/group-chat/audit-logs", { params })).data as { logs: AuditLog[]; total: number; groups: { id: string; name: string }[] },
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  });

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const exportCsv = async () => {
    setExporting(true);
    try {
      const { page: _p, pageSize: _s, ...filters } = params;
      const res = await apiClient.get("/api/group-chat/audit-logs", { params: { ...filters, format: "csv" }, responseType: "blob" });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `group-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Couldn't export the audit log.");
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      key: "created_at", header: "Time", width: "w-[130px]",
      render: (v: string) => { const t = formatTime(v); return <div className="leading-tight"><div className="text-[13px] font-medium">{t.date}</div><div className="text-[12px] text-muted-foreground">{t.time}</div></div>; },
    },
    { key: "group_name", header: "Group", width: "w-[150px]", render: (v: string) => <span className="block truncate text-[13px]" title={v || ""}>{v || "—"}</span> },
    {
      key: "action", header: "Action", width: "w-[160px]",
      render: (v: string) => { const m = actionMeta(v); return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${TONES[m.tone]}`}>{m.label}</span>; },
    },
    {
      key: "actor_name", header: "By", width: "w-[150px]",
      render: (v: string, row: AuditLog) => <div className="leading-tight min-w-0"><div className="truncate text-[13px] font-medium">{v || "—"}</div>{row.actor_role && <div className="truncate text-[11px] capitalize text-muted-foreground">{row.actor_role.replace(/_/g, " ")}</div>}</div>,
    },
    { key: "target_name", header: "Target", width: "w-[140px]", render: (v: string, row: AuditLog) => <span className="block truncate text-[13px]" title={v || row.target_id || ""}>{v || (row.target_type === "message" ? "A message" : "—")}</span> },
    { key: "details", header: "Details", width: "w-[260px]", render: (_: any, row: AuditLog) => <span className="block truncate text-[13px] text-muted-foreground" title={describe(row)}>{describe(row) || "—"}</span> },
    {
      key: "ip_address", header: "IP & device", width: "w-[150px]",
      render: (v: string, row: AuditLog) => <div className="leading-tight min-w-0"><div className="truncate font-mono text-[12px]">{v || "—"}</div><div className="truncate text-[11px] text-muted-foreground">{device(row.user_agent)}</div></div>,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <SuperadminFilterBar searchQuery={searchInput} onSearchChange={setSearchInput} searchPlaceholder="Search name, group, action…">
        <div className="w-[180px]">
          <ResponsiveSelect className="flex h-9 w-full items-center rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent/50" value={groupId} onChange={(e: any) => setGroupId(e.target.value)}>
            <option value="">Group: All</option>
            {(data?.groups || []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </ResponsiveSelect>
        </div>
        <div className="w-[180px]">
          <ResponsiveSelect className="flex h-9 w-full items-center rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent/50" value={action} onChange={(e: any) => setAction(e.target.value)}>
            <option value="">Action: All</option>
            <option value="group_created,group_deleted,group_details_changed,group_photo_changed,group_banner_changed,permissions_updated,disappearing_messages_changed">Group changes</option>
            <option value="member_added,member_joined,member_removed,member_left,member_promoted,member_demoted,join_requested,join_request_approved,join_request_rejected">Members</option>
            <option value="message_deleted,messages_bulk_deleted,message_edited,message_pinned,message_unpinned,message_approved,message_rejected">Messages</option>
            {Object.entries(ACTIONS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </ResponsiveSelect>
        </div>
        {[{ value: dateFrom, set: setDateFrom, ph: "From date" }, { value: dateTo, set: setDateTo, ph: "To date" }].map((d, i) => (
          <div key={i} className="relative w-[160px] max-w-[160px] overflow-hidden">
            <NikhilTimeCalendar value={d.value} onChange={d.set as any} placeholder={d.ph} popDirection="down" showTime={false} className="h-9 w-full pr-8" />
            {d.value && (
              <button type="button" onClick={(e) => { e.stopPropagation(); d.set(undefined); }} className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground" title="Clear date">
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={exportCsv}
          disabled={exporting || total === 0}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </SuperadminFilterBar>

      {isError ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 text-center text-sm">
          <p className="font-medium text-red-600 dark:text-red-400">Couldn't load the audit log.</p>
          <p className="mt-1 text-muted-foreground">{(error as any)?.message || "Please try again."}</p>
          <button onClick={() => refetch()} className="mt-3 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">Retry</button>
        </div>
      ) : (
        <div className={`overflow-x-auto ${data?.logs?.length ? "rounded-md border bg-card" : ""}`}>
          <DataTable
            className={data?.logs?.length ? "min-w-[1100px] rounded-none border-0" : ""}
            columns={columns}
            rows={data?.logs || []}
            isLoading={isLoading}
            skeletonLines={8}
            emptyMessage="No activity yet. Group actions (members, settings, messages) will appear here."
            onRowClick={(row) => setSelected(row)}
          />
        </div>
      )}

      {total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{total.toLocaleString("en-IN")} {total === 1 ? "entry" : "entries"}</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
            <span>Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Full details of one entry */}
      {selected && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${TONES[actionMeta(selected.action).tone]}`}>{actionMeta(selected.action).label}</span>
                <p className="mt-2 text-sm text-muted-foreground">{formatTime(selected.created_at).date} · {formatTime(selected.created_at).time}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Group</dt><dd className="break-words">{selected.group_name || "—"}</dd>
              <dt className="text-muted-foreground">By</dt><dd className="break-words">{selected.actor_name || "—"}{selected.actor_role ? ` (${selected.actor_role.replace(/_/g, " ")})` : ""}</dd>
              <dt className="text-muted-foreground">Target</dt><dd className="break-words">{selected.target_name || selected.target_id || "—"}{selected.target_type ? ` · ${selected.target_type}` : ""}</dd>
              <dt className="text-muted-foreground">IP address</dt><dd className="font-mono">{selected.ip_address || "—"}</dd>
              <dt className="text-muted-foreground">Device</dt><dd className="break-words text-xs">{selected.user_agent || "—"}</dd>
            </dl>
            {(selected.old_value || selected.new_value) && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[{ t: "Before", v: selected.old_value }, { t: "After", v: selected.new_value }].map(({ t, v }) => (
                  <div key={t}>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t}</p>
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-muted/40 p-3 text-xs">{v ? JSON.stringify(v, null, 2) : "—"}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
