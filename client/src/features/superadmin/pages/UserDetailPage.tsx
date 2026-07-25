import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { apiClient } from "@/lib/apiClient";
import { useBreadcrumbStore } from "@/store/useBreadcrumbStore";
import { useEffect } from "react";

type ProfileField = {
  key: string;
  label: string;
  type?: string;
  private?: boolean;
};

type ProfileSection = {
  sectionId: string;
  sectionTitle: string;
  fields: ProfileField[];
};

type UserDetailResponse = {
  success: boolean;
  data: {
    user: Record<string, any>;
    organization: Record<string, any> | null;
    profile: Record<string, any> | null;
    schema: ProfileSection[];
  };
};

function formatLabel(value?: string) {
  if (!value) return "";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateValue(value: unknown) {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN");
}

function getNestedValue(source: Record<string, any> | null | undefined, path: string) {
  return path.split(".").reduce<any>((current, key) => current?.[key], source);
}
function normalizeAcademicYear(value: unknown) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "number") return formatAcademicYearRange(value, value + 1);
  return String(value).trim();
}

function formatAcademicYearRange(startYear: number, endYear: number) {
  return `${startYear}-${String(endYear).slice(-2)}`;
}

function getCurrentAcademicYear() {
  const today = new Date();
  const calendarYear = today.getFullYear();
  const startYear = today.getMonth() >= 3 ? calendarYear : calendarYear - 1;
  return formatAcademicYearRange(startYear, startYear + 1);
}

function getRecordAcademicYear(
  organization: Record<string, any> | null | undefined,
  profile: Record<string, any> | null | undefined
) {
  const academicConfig = organization?.academic_config || {};
  const configuredYear =
    academicConfig.currentAcademicYear ||
    academicConfig.current_academic_year ||
    academicConfig.academicYear ||
    academicConfig.academic_year ||
    academicConfig.activeAcademicYear ||
    academicConfig.active_academic_year ||
    academicConfig.session ||
    academicConfig.academicSession ||
    academicConfig.academic_session ||
    profile?.admission_details?.academic_year ||
    profile?.education?.academic_year ||
    profile?.academic_year ||
    organization?.currentAcademicYear ||
    organization?.academic_year;

  if (configuredYear) return normalizeAcademicYear(configuredYear);

  const startYear = academicConfig.academic_year_start || academicConfig.startYear || academicConfig.start_year;
  const endYear = academicConfig.academic_year_end || academicConfig.endYear || academicConfig.end_year;
  if (startYear && endYear) return `${startYear}-${String(endYear).slice(-2)}`;

  return getCurrentAcademicYear();
}

export function UserDetailPage() {
  const navigate = useNavigate();
  const { userId } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["super-admin-user-detail", userId],
    queryFn: () =>
      apiClient
        .get<UserDetailResponse>(`/api/super-admin/users/${userId}/full`)
        .then((response) => response.data),
    enabled: Boolean(userId),
  });

  const user = data?.data?.user;
  const organization = data?.data?.organization;
  const profile = data?.data?.profile;
  const schema = data?.data?.schema ?? [];
  const recordAcademicYear = getRecordAcademicYear(organization, profile);

  const { setBreadcrumbs } = useBreadcrumbStore();

  useEffect(() => {
    setBreadcrumbs([
      { label: "Global Users", href: "/superadmin/global-users" },
      { label: user?.name || "User Details" }
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, user?.name]);

  const getFieldValue = (key: string, type?: string): string => {
    const value = getNestedValue(profile, key);
    if (value === undefined || value === null || value === "") return "";
    if (Array.isArray(value)) return value.filter(Boolean).join(", ");
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (type === "date" || key.toLowerCase().includes("date")) return formatDateValue(value);
    if (typeof value === "object") return Object.values(value).filter(Boolean).join(", ");
    return String(value);
  };

  const sectionsWithData = useMemo(
    () =>
      schema
        .map((section) => ({
          ...section,
          fields: section.fields.filter((field) => getFieldValue(field.key, field.type)),
        }))
        .filter((section) => section.fields.length > 0),
    [schema, profile]
  );

  const renderFieldRows = (fields: ProfileField[]) => {
    const rows = [];

    for (let index = 0; index < fields.length; index += 2) {
      const firstField = fields[index];
      const secondField = fields[index + 1];

      rows.push(
        <tr key={firstField.key}>
          <td className="label-cell">{firstField.label}{firstField.private ? " [private]" : ""}</td>
          <td className="value-cell">{getFieldValue(firstField.key, firstField.type)}</td>
          {secondField ? (
            <>
              <td className="label-cell">{secondField.label}{secondField.private ? " [private]" : ""}</td>
              <td className="value-cell">{getFieldValue(secondField.key, secondField.type)}</td>
            </>
          ) : (
            <td colSpan={3} className="value-cell" />
          )}
        </tr>
      );
    }

    return rows;
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading user record...</div>;
  }

  if (isError || !user) {
    return <div className="p-6 text-sm text-destructive">Unable to load user record.</div>;
  }

  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 animate-in fade-in user-detail-page">
      <style>{`
        .document-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          max-width: 980px;
          margin: 0 auto 16px;
          width: 100%;
        }

        .document-actions button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          font-size: 14px;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .document-actions button:hover {
          background: hsl(var(--muted));
        }

        .record-container {
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
          background: hsl(var(--card));
          color: hsl(var(--card-foreground));
          border-radius: 12px;
          border: 1px solid hsl(var(--border));
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
          overflow: hidden;
        }

        .record-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          line-height: 1.5;
        }

        .record-table td {
          border-bottom: 1px solid hsl(var(--border));
          border-right: 1px solid hsl(var(--border));
        }
        
        .record-table td:last-child {
          border-right: none;
        }
        
        .record-table tr:last-child td {
          border-bottom: none;
        }

        .org-logo-cell {
          width: 130px;
          text-align: center;
          vertical-align: middle;
          padding: 24px;
          background: hsl(var(--muted) / 0.1);
        }

        .org-logo-cell img {
          max-width: 80px;
          max-height: 80px;
          object-fit: contain;
        }

        .org-logo-placeholder {
          display: inline-flex;
          width: 80px;
          height: 80px;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: hsl(var(--muted) / 0.5);
          color: hsl(var(--muted-foreground));
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .org-title-cell {
          padding: 24px;
          vertical-align: middle;
          background: hsl(var(--muted) / 0.1);
        }

        .org-title {
          font-size: 22px;
          font-weight: 600;
          color: hsl(var(--foreground));
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }

        .org-address {
          color: hsl(var(--muted-foreground));
          font-size: 14px;
          white-space: pre-wrap;
          line-height: 1.5;
        }

        .record-title {
          text-align: center;
          font-weight: 600;
          padding: 16px;
          color: hsl(var(--foreground));
          background: hsl(var(--muted) / 0.3);
          font-size: 13px;
          letter-spacing: 0.05em;
        }

        .photo-cell {
          width: 150px;
          text-align: center;
          vertical-align: middle;
          padding: 16px;
        }

        .photo-cell img {
          width: 120px;
          height: 160px;
          object-fit: cover;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          border: 1px solid hsl(var(--border) / 0.5);
        }

        .photo-placeholder {
          display: inline-flex;
          width: 120px;
          height: 160px;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          background: hsl(var(--muted) / 0.3);
          border: 1px dashed hsl(var(--border));
          color: hsl(var(--muted-foreground));
          font-size: 13px;
          font-weight: 500;
        }

        .section-header {
          background: hsl(var(--muted) / 0.5);
          color: hsl(var(--muted-foreground));
          text-align: left;
          font-weight: 600;
          padding: 12px 24px;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.08em;
          border-top: 1px solid hsl(var(--border));
        }

        .label-cell {
          font-weight: 500;
          background: hsl(var(--muted) / 0.15);
          color: hsl(var(--muted-foreground));
          width: 25%;
          padding: 14px 24px;
          vertical-align: top;
          font-size: 13px;
        }

        .value-cell {
          padding: 14px 24px;
          vertical-align: top;
          word-break: break-word;
          color: hsl(var(--foreground));
          font-weight: 500;
        }

        @media print {
          .no-print {
            display: none;
          }

          body {
            margin: 0;
            background: white !important;
          }

          .user-detail-page {
            padding: 0 !important;
            max-width: none !important;
          }

          .record-container {
            max-width: none;
            box-shadow: none;
            border: none;
          }
        }
      `}</style>

      <div className="document-actions no-print" style={{ justifyContent: "flex-end" }}>
        <button type="button" onClick={() => window.print()}>
          <Printer size={16} />
          Print
        </button>
      </div>

      <div className="record-container border border-border sm:rounded-md">
        <table className="record-table">
        <tbody>
          <tr>
            <td className="org-logo-cell">
              {organization?.logo_url ? (
                <img src={organization.logo_url} alt={`${organization?.name || "Organization"} logo`} />
              ) : (
                <span className="org-logo-placeholder">LOGO</span>
              )}
            </td>
            <td colSpan={3} className="org-title-cell">
              <div className="org-title">{organization?.name || "Platform Organization"}</div>
              <div className="org-address">{organization?.address || organization?.location || ""}</div>
            </td>
          </tr>
          <tr>
            <td colSpan={4} className="record-title">
              ACADEMIC YEAR - {recordAcademicYear}<br />
              USER RECORD FOR ACADEMIC YEAR {recordAcademicYear}
            </td>
          </tr>
          <tr>
            <td className="label-cell">Role</td>
            <td className="value-cell">{formatLabel(user.role)}</td>
            <td rowSpan={2} colSpan={2} className="photo-cell">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.name || "User photo"} />
              ) : (
                <span className="photo-placeholder">PHOTO</span>
              )}
            </td>
          </tr>
          <tr>
            <td className="label-cell">Org Type</td>
            <td className="value-cell">{formatLabel(organization?.org_type)}</td>
          </tr>
        </tbody>

        {sectionsWithData.map((section) => (
          <tbody key={section.sectionId}>
            <tr>
              <td colSpan={4} className="section-header">
                {section.sectionTitle}
              </td>
            </tr>
            {renderFieldRows(section.fields)}
          </tbody>
        ))}
      </table>
      </div>
    </div>
  );
}