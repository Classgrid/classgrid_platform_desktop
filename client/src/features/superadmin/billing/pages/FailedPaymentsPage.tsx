/**
 * ==============================================================================
 * 🚨 AI AGENT WARNING: BREADCRUMB POLICY 🚨
 * ==============================================================================
 * NEVER hardcode "Super Admin Dashboard /" as a breadcrumb on any deep dive page.
 * Deep dive pages or sub-pages MUST accurately reflect the actual parent pages 
 * they were opened from (e.g., Organizations / [Name] / Configuration / ...).
 * DO NOT use generic dashboard text for breadcrumbs.
 * ==============================================================================
 */

/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveSelect } from '@/components/marketing_ui/responsive-select';
import { SuperadminFilterBar } from '../../components/SuperadminFilterBar';
import { OrganizationSelector } from '../components/shared/BillingFilterComponents';
import { FailedPaymentTable, FailedPaymentsOverview } from '../components/finance/FailureComponents';
import { NikhilTimeCalendar } from '@/components/marketing_ui/nikhil_time_calendar';
import { X } from 'lucide-react';

const FailedPaymentsPage = () => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [organizationType, setOrganizationType] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateType, setDateType] = useState('createdAt');

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filters = {
    status: filterType || undefined,
    organizationId: organizationId || undefined,
    organizationType: organizationType || undefined,
    startDate: dateFrom ? dateFrom.toISOString() : undefined,
    endDate: dateFrom ? (() => { const e = new Date(dateFrom); e.setHours(23, 59, 59, 999); return e.toISOString(); })() : undefined,
    search: search || undefined,
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* ═══ OVERVIEW STATS ═══ */}
      <FailedPaymentsOverview />

      {/* ═══ FILTER BAR — copied from ClassgridTalkPage ═══ */}
      <SuperadminFilterBar
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by name, email, or payment ID..."
      >
        {/* Org Name */}
        <div className="w-[180px]">
          <OrganizationSelector selectedId={organizationId} onSelect={setOrganizationId} />
        </div>

        {/* Org Type */}
        <div className="w-[150px]">
          <ResponsiveSelect
            className="flex h-9 w-full items-center rounded-md border border-border bg-transparent px-3 py-1 shadow-sm hover:bg-accent/50 transition-colors text-sm"
            value={organizationType}
            onChange={(e) => setOrganizationType(e.target.value)}
          >
            <option value="">Org Type: All</option>
            <option value="school">School</option>
            <option value="junior_college">Junior College</option>
            <option value="engineering">Engineering</option>
            <option value="coaching">Coaching</option>
            <option value="diploma">Diploma</option>
            <option value="other">Other</option>
          </ResponsiveSelect>
        </div>

        {/* Date picker */}
        <div className="w-[180px] max-w-[180px] overflow-hidden relative">
          <NikhilTimeCalendar
            value={dateFrom}
            onChange={setDateFrom}
            placeholder="Select Date"
            popDirection="down"
            showTime={false}
            className="h-9 w-full pr-8"
            dateType={dateType}
            onDateTypeChange={setDateType}
          />
          {dateFrom && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setDateFrom(undefined); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-0.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-accent bg-background"
              title="Clear date"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status */}
        <div className="w-[150px]">
          <ResponsiveSelect
            className="flex h-9 w-full items-center rounded-md border border-border bg-transparent px-3 py-1 shadow-sm hover:bg-accent/50 transition-colors text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Status: All</option>
            <option value="UNRESOLVED">Unresolved</option>
            <option value="RESOLVED">Resolved</option>
          </ResponsiveSelect>
        </div>
      </SuperadminFilterBar>

      {/* ═══ TABLE — direct render, no Card wrapper ═══ */}
      <div className="mt-4">
        <FailedPaymentTable 
          filters={filters} 
          onResolve={(id) => navigate(`/super-admin/billing/failed-payments/${id}`)} 
        />
      </div>
    </div>
  );
};

export default FailedPaymentsPage;
