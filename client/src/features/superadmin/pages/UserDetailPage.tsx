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
      { label: "Global Users", path: "/superadmin/global-users" },
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
          justify-content: space-between;
          align-items: center;
          max-width: 980px;
          margin: 0 auto 16px;
          width: 100%;
        }

        .document-actions button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #111827;
          font-size: 14px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .document-actions button:hover {
          background: #f3f4f6;
        }

        .record-container {
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
          background: #ffffff;
          color: #020617; /* slate-950 */
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .record-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          line-height: 1.4;
        }

        .record-table td,
        .record-table th {
          border: 1px solid #d1d5db;
        }

        .org-logo-cell {
          width: 130px;
          text-align: center;
          vertical-align: middle;
          padding: 12px;
        }

        .org-logo-cell img {
          max-width: 90px;
          max-height: 90px;
          object-fit: contain;
        }

        .org-logo-placeholder {
          display: inline-flex;
          width: 90px;
          height: 90px;
          align-items: center;
          justify-content: center;
          border: 1px solid #d1d5db;
          color: #6b7280;
          font-weight: 700;
        }

        .org-title-cell {
          padding: 12px 16px;
          vertical-align: middle;
        }

        .org-title {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .org-address {
          color: hsl(var(--muted-foreground));
          white-space: pre-wrap;
        }

        .record-title {
          text-align: center;
          font-weight: 700;
          padding: 10px;
          color: hsl(var(--foreground));
        }

        .photo-cell {
          width: 150px;
          height: 200px;
          text-align: center;
          vertical-align: middle;
          padding: 8px;
        }

        .photo-cell img {
          width: 132px;
          height: 176px;
          object-fit: cover;
          border: 1px solid hsl(var(--border));
        }

        .photo-placeholder {
          display: inline-flex;
          width: 132px;
          height: 176px;
          align-items: center;
          justify-content: center;
          border: 1px solid hsl(var(--border));
          color: hsl(var(--muted-foreground));
          font-weight: 600;
        }

        .section-header {
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
          text-align: center;
          font-weight: 700;
          padding: 10px;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.05em;
        }

        .label-cell {
          font-weight: 600;
          background: hsl(var(--muted) / 0.5);
          color: hsl(var(--foreground));
          width: 25%;
          padding: 10px 14px;
          vertical-align: top;
        }

        .value-cell {
          padding: 10px 14px;
          vertical-align: top;
          word-break: break-word;
          color: hsl(var(--foreground));
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
            <td rowSpan={3} colSpan={2} className="photo-cell">
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
          <tr>
            <td className="label-cell">Status</td>
            <td className="value-cell">{formatLabel(user.status || "active")}</td>
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