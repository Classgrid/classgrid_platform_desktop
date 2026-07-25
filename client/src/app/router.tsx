/**
 * ==============================================================================
 * 🛑 AI AGENT WARNING: DO NOT MODIFY THE 5 LOGIN PAGES ROUTING 🛑
 * ==============================================================================
 * This application intentionally uses 5 distinct login pages:
 * 1. SuperAdminLoginPage.tsx (Super Admin)
 * 2. ClassgridSubdomainUserLoginPage.tsx (Subdomain Users)
 * 3. ClassgridSubdomainAdminLoginPage.tsx (Subdomain Admins)
 * 4. CustomDomainUserLoginPage.tsx (Custom Domain Users)
 * 5. CustomDomainAdminLoginPage.tsx (Custom Domain Admins)
 * 
 * DO NOT attempt to "simplify" or consolidate these login routes.
 * DO NOT overwrite the dynamic subdomain routing logic.
 * ==============================================================================
 */
import { Navigate, Route, Routes } from "react-router-dom";
import { CandidatePortalPage } from "@/features/admission-portal/pages/CandidatePortalPage";
import { ParentTrackerPage } from "@/features/admission-portal/pages/ParentTrackerPage";

import { DashboardHomePage } from "@/features/superadmin/pages/DashboardHomePage";
import { OrgAdminDashboard } from "@/features/org-admin/components/OrgAdminDashboard";
import { UsagePage } from "@/features/org-admin/pages/UsagePage";
import { BillingPage } from "@/features/org-admin/pages/BillingPage";
import { LeadsPage } from "@/features/superadmin/pages/LeadsPage";
import { LeadDetailsPage } from "@/features/superadmin/pages/LeadDetailsPage";
/**
 * ==============================================================================
 * 🛑 AI AGENT WARNING: DO NOT MODIFY THE 5 LOGIN PAGES ROUTING 🛑
 * ==============================================================================
 * This application intentionally uses 5 distinct login pages:
 * 1. SuperAdminLoginPage.tsx (Super Admin)
 * 2. ClassgridSubdomainUserLoginPage.tsx (Subdomain Users)
 * 3. ClassgridSubdomainAdminLoginPage.tsx (Subdomain Admins)
 * 4. CustomDomainUserLoginPage.tsx (Custom Domain Users)
 * 5. CustomDomainAdminLoginPage.tsx (Custom Domain Admins)
 * 
 * DO NOT attempt to "simplify" or consolidate these login routes.
 * DO NOT overwrite the dynamic subdomain routing logic.
 * ==============================================================================
 */
import { Navigate, Route, Routes } from "react-router-dom";
import { CandidatePortalPage } from "@/features/admission-portal/pages/CandidatePortalPage";
import { ParentTrackerPage } from "@/features/admission-portal/pages/ParentTrackerPage";

import { DashboardHomePage } from "@/features/superadmin/pages/DashboardHomePage";
import { OrgAdminDashboard } from "@/features/org-admin/components/OrgAdminDashboard";
import { UsagePage } from "@/features/org-admin/pages/UsagePage";
import { BillingPage } from "@/features/org-admin/pages/BillingPage";
import { LeadsPage } from "@/features/superadmin/pages/LeadsPage";
import { LeadDetailsPage } from "@/features/superadmin/pages/LeadDetailsPage";
import { SupportTicketsPage } from "@/features/superadmin/pages/SupportTicketsPage";
import { ReviewsPage } from "@/features/superadmin/pages/ReviewsPage";
import { ChangelogPage } from "@/features/superadmin/pages/ChangelogPage";
import { AuditPage } from "@/features/superadmin/pages/AuditPage";
import { ActivityLogPage } from "@/features/superadmin/pages/ActivityLogPage";
import { ConfigPage } from "@/features/superadmin/pages/ConfigPage";
import { UsersPage } from "@/features/superadmin/pages/UsersPage";
import { GlobalUsersPage } from "@/features/superadmin/pages/GlobalUsersPage";
import { UserDetailPage } from "@/features/superadmin/pages/UserDetailPage";
import { GdprPage } from "@/features/superadmin/pages/GdprPage";
import { BackupPage } from "@/features/superadmin/pages/BackupPage";
import { CustomDomainsPage } from "@/features/superadmin/pages/CustomDomainsPage";
import { AnalyticsPage } from "@/features/superadmin/pages/AnalyticsPage";
import { AuditLogsPage } from "@/features/superadmin/pages/AuditLogsPage";
import { OnboardPage } from "@/features/superadmin/pages/OnboardPage";
import { DirectOnboardPage } from "@/features/superadmin/pages/DirectOnboardPage";
import { ClassgridTalkPage } from "@/features/superadmin/pages/ClassgridTalkPage";
import { TeamPage } from "@/features/superadmin/pages/TeamPage";
import { BillingPage } from "@/features/superadmin/pages/BillingPage";
import { RevenuePage } from "@/features/superadmin/pages/RevenuePage";
import { FeedbackPage } from "@/features/superadmin/pages/FeedbackPage";
import { SubscribersPage } from "@/features/superadmin/pages/SubscribersPage";
import { ChatPage } from "@/features/chat/pages/ChatPage";
import { LogoutPage } from "@/features/auth/pages/LogoutPage";
import { SystemHealthPage } from "@/features/superadmin/pages/SystemHealthPage";
import { FeatureFlagsPage } from "@/features/superadmin/pages/FeatureFlagsPage";
import { TransactionsPage } from "@/features/superadmin/pages/TransactionsPage";
import { FailedPaymentsPage } from "@/features/superadmin/pages/FailedPaymentsPage";
import { RollbackPage } from "@/features/superadmin/pages/RollbackPage";
import { ContentModerationPage } from "@/features/superadmin/pages/ContentModerationPage";
import { NotificationEnginePage } from "@/features/superadmin/pages/NotificationEnginePage";
import { OrganizationsPage } from "@/features/superadmin/pages/OrganizationsPage";
import { OrgDetailPage } from "@/features/superadmin/pages/OrgDetailPage";
import { OrgDetailsPage } from "@/features/superadmin/pages/OrgDetailsPage";
import { PlatformAnnouncementsPage } from "@/features/superadmin/pages/PlatformAnnouncementsPage";
import { SharedProfilePage } from "@/features/shared/pages/SharedProfilePage";
import SandboxProfilePage from "@/features/shared/pages/SandboxProfilePage";
import DateTimePickerSandbox from "@/features/sandbox/pages/DateTimePickerSandbox";
import { SandboxPage } from "@/features/superadmin/pages/SandboxPage";
import { StorageLayout } from "@/components/layout/StorageLayout";
import { StorageFilesPage } from "@/features/superadmin/pages/StorageFilesPage";
import { StorageAnalyticsPage } from "@/features/superadmin/pages/StorageAnalyticsPage";
          <Route path="/superadmin/talk" element={<ClassgridTalkPage />} />
          <Route path="/superadmin/classgrid-talk" element={<ClassgridTalkPage />} />
          <Route path="/superadmin/system-health" element={<SystemHealthPage />} />
          <Route path="/superadmin/feature-flags" element={<FeatureFlagsPage />} />
          <Route path="/superadmin/content-moderation" element={<ContentModerationPage />} />
          <Route path="/superadmin/notification-engine" element={<NotificationEnginePage />} />
          <Route path="/superadmin/sandbox" element={<SandboxPage />} />
          <Route path="/superadmin/team" element={<TeamPage />} />
          <Route path="/superadmin/gdpr" element={<GdprPage />} />
          <Route path="/superadmin/backup" element={<BackupPage />} />
          <Route path="/superadmin/profile" element={<SharedProfilePage />} />
          <Route path="/superadmin/settings" element={<SharedSettingsPage />} />
          <Route path="/superadmin/chat" element={<ChatPage />} />
          <Route path="/superadmin/subscribers" element={<SubscribersPage />} />
          

          <Route path="/superadmin/*" element={<ComingSoonPage />} />
        </Route>

        {/* VERCEL STYLE SUPER ADMIN STORAGE SHELL */}
        <Route path="/superadmin/storage" element={<StorageLayout />}>
          <Route index element={<Navigate to="files" replace />} />
          <Route path="files" element={<StorageFilesPage />} />
          <Route path="analytics" element={<StorageAnalyticsPage />} />
          <Route path="s3" element={<StorageS3ConfigPage />} />
        </Route>

        {/* NEW ORG ADMIN SHELL */}
        <Route element={<OrgAdminLayout />}>
          <Route path="/org/admin/settings" element={<SharedSettingsPage />} />
          <Route path="/org/admin/profile" element={<SharedProfilePage />} />
          <Route path="/org/admin/chat" element={<ChatPage />} />
          <Route path="/org/website" element={<WebsiteCMSPage />} />
          <Route path="/org/audit" element={<AuditPage />} />
          <Route path="/org/admin/dashboard" element={<OrgAdminDashboard />} />
          <Route path="/org/admin/usage" element={<UsagePage />} />
          <Route path="/org/admin/billing" element={<BillingPage />} />
          <Route path="/org/admin/*" element={<ComingSoonPage />} />
          <Route path="/org/*" element={<ComingSoonPage />} />
          
          {/* Legacy redirects for compatibility */}
          <Route path="/org/settings" element={<Navigate to="/org/admin/settings" replace />} />
          <Route path="/org/profile" element={<Navigate to="/org/admin/profile" replace />} />
          <Route path="/org/chat" element={<Navigate to="/org/admin/chat" replace />} />
          <Route path="/org/dashboard" element={<Navigate to="/org/admin/dashboard" replace />} />
        </Route>

        <Route path="/" element={<DefaultDashboardRedirect />} />
        <Route path="/admin/dashboard" element={<Navigate to="/org/admin/dashboard" replace />} />

        {/* ── DYNAMIC ROLE LAYOUT (Wraps all 10 Dept Dashboards & Common Pages) ── */}
        <Route element={<DynamicRoleLayout />}>
          {/* Website CMS */}
          <Route path="/dept/admissions/website" element={<WebsiteCMSPage />} />
          <Route path="/dept/fees/website" element={<WebsiteCMSPage />} />
          <Route path="/dept/exams/website" element={<WebsiteCMSPage />} />
          <Route path="/dept/library/website" element={<WebsiteCMSPage />} />
          <Route path="/dept/attendance/website" element={<WebsiteCMSPage />} />
          <Route path="/dept/hr/website" element={<WebsiteCMSPage />} />
          <Route path="/dept/transport/website" element={<WebsiteCMSPage />} />
          <Route path="/faculty/website" element={<WebsiteCMSPage />} />

          {/* 3. Admissions Department Dashboard */}
          <Route path="/dept/admissions/dashboard" element={<AdmissionDashboardRouter />} />
          <Route path="/dept/admissions/applications" element={<AllApplicationsPage />} />
          <Route path="/dept/admissions/applications/:id" element={<ApplicationDetailsPage />} />
          <Route path="/dept/admissions/new" element={<NewApplicationPage />} />
          <Route path="/dept/admissions/documents" element={<DocumentVerificationPage />} />
          <Route path="/dept/admissions/merit" element={<MeritListPage />} />
          <Route path="/dept/admissions/enroll" element={<EnrollmentPage />} />
          <Route path="/dept/admissions/config" element={<AdmissionConfigPage />} />
          <Route path="/dept/admissions/fees" element={<FeeStructurePage />} />
          <Route path="/dept/admissions/schedule" element={<AdmissionSchedulePage />} />
          <Route path="/dept/admissions/analytics" element={<AdmissionAnalyticsPage />} />
          <Route path="/dept/admissions/export" element={<ExportDataPage />} />
          <Route path="/dept/admissions/cet-dte" element={<CETReportsPage />} />
          <Route path="/dept/admissions/cet-import" element={<CETImportPage />} />
          <Route path="/dept/admissions/rla-reporting" element={<RLAReportingPage />} />
          <Route path="/dept/admissions/cap-upgrade" element={<CAPUpgradePage />} />
          <Route path="/dept/admissions/vacancy-tracker" element={<VacancyTrackerPage />} />
          <Route path="/dept/admissions/form-builder" element={<FormBuilderPage />} />
          <Route path="/dept/admissions/crm" element={<LeadTrackingPage />} />
          <Route path="/dept/admissions/comm" element={<CommunicationPage />} />
          <Route path="/dept/admissions/bulk" element={<BulkSmsPage />} />

          {/* 4. Fees Department Dashboard */}
          <Route path="/dept/fees/dashboard" element={<FeesDashboardRouter />} />

          {/* 5. Examination Department Dashboard */}
          <Route path="/dept/exams/dashboard" element={<ExamsDashboardRouter />} />
          <Route path="/dept/exams/results" element={<ResultsProcessingPage />} />

          {/* 6. Library Department Dashboard */}
          <Route path="/dept/library/dashboard" element={<LibraryDashboardRouter />} />

          {/* 7. Attendance Department Dashboard */}
          <Route path="/dept/attendance/dashboard" element={<AttendanceDashboardRouter />} />

          {/* 8. HR & Payroll Department Dashboard */}
          <Route path="/dept/hr/dashboard" element={<HRDashboardRouter />} />

          {/* 9. Hostel & Transport Dashboard */}
          <Route path="/dept/hostel/dashboard" element={<HostelDashboardPage />} />

          {/* 10. Faculty Dashboard */}
          <Route path="/faculty/dashboard" element={<FacultyHomePage />} />
          <Route path="/faculty/work" element={<FacultyWorkPage />} />
          <Route path="/exam/grading" element={<ExamGradingPage />} />

          {/* 11. Student Dashboard */}
          <Route path="/student/dashboard" element={<StudentHomePage />} />
          <Route path="/student/work" element={<StudentWorkPage />} />

          {/* ── Common pages ── */}
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/classroom" element={<ClassroomsPage />} />
          <Route path="/classroom/:id" element={<ClassroomDetailPage />} />
          <Route path="/classrooms" element={<ClassroomsPage />} />
          <Route path="/discover" element={<DiscoverClassroomsPage />} />
          <Route path="/tools" element={<GenericPage title="Schedule" />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/notifications" element={<GenericPage title="Notifications" />} />
          <Route path="/forum" element={<GenericPage title="Forum" />} />
          <Route path="/classgrid-ai" element={<GenericPage title="Classgrid AI" />} />
          <Route path="/drive" element={<GenericPage title="Google Drive" />} />
          <Route path="/virtual-id" element={<GenericPage title="Virtual ID" />} />
          <Route path="/join-requests/:groupId" element={<JoinRequestPage />} />
          <Route path="/join-requests" element={<JoinRequestPage />} />
          <Route path="/whats-new" element={<GenericPage title="What's New" />} />
          <Route path="/organization" element={<GenericPage title="Organization" />} />
          <Route path="/platform-feedback" element={<GenericPage title="Platform Feedback" />} />
          <Route path="/marketplace" element={<GenericPage title="Marketplace" />} />
          <Route path="/my-requests" element={<JoinRequestPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="profile" element={<SharedProfilePage />} />
          <Route path="settings" element={<SharedSettingsPage />} />
          <Route path="classrooms" element={<ClassroomsPage />} />
          <Route path="/support" element={<SupportPage />} />

          {/* ── Wildcard sub-routes ── */}
          <Route path="/dept/admissions/*" element={<GenericPage title="Admissions Module" />} />
          <Route path="/dept/fees/*" element={<GenericPage title="Fees Module" />} />
          <Route path="/dept/exams/*" element={<GenericPage title="Examination Module" />} />
          <Route path="/dept/library/*" element={<GenericPage title="Library Module" />} />
          <Route path="/dept/attendance/*" element={<GenericPage title="Attendance Module" />} />
          <Route path="/dept/hr/*" element={<GenericPage title="HR & Payroll Module" />} />
          <Route path="/dept/hostel/*" element={<GenericPage title="Hostel & Transport Module" />} />
          <Route path="/dept/transport/*" element={<GenericPage title="Transport Module" />} />
          <Route path="/student/*" element={<GenericPage title="Student Module" />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function DefaultDashboardRedirect() {
  const { data: user } = useCurrentUser();

  // (Removed ERP Domain Guard to allow Admins to use the ERP domain)

  return <Navigate to={getRedirectPath(user?.role)} replace />;
}
