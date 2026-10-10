// Readable names for the saved setting values (the dropdowns otherwise show the raw value, e.g. "admin_only")
export const GROUP_SETTING_LABELS: Record<string, string> = {
  private: "Private (Hidden, Invite Only)",
  approval: "Approval Required (Visible, Request to Join)",
  public: "Public / Open (Visible, Instant Join)",
  all: "Members & Admins",
  admin_only: "Only Admins",
  "0": "Off",
  "86400": "24 hours",
  "604800": "7 days",
  "7776000": "90 days",
  general: "General",
  class: "Class",
  department: "Department",
  subject: "Subject",
  team_staff: "Team / Staff",
  official_announcement: "Official / Announcement",
};
