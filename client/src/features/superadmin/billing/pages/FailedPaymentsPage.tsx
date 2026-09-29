/*
 * =========================================================================================
 * 🚨 CRITICAL AI & SYSTEM RULE 🚨
 * NO FRONTEND GITHUB ACTIONS: NEVER create yaml files that build/deploy the frontend to EC2.
 * The frontend is hosted 100% on Vercel. EC2 is only for the backend.
 * =========================================================================================
 */

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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FailedPaymentsTable, FailedPaymentsOverview } from '../components/finance/FailureComponents';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/marketing_ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/marketing_ui/select';
import { SuperadminFilterBar } from '../../components/SuperadminFilterBar';
import { OrganizationSelector, OrganizationTypeFilter } from '../components/shared/BillingFilterComponents';
import { NikhilTimeCalendar } from '@/components/marketing_ui/nikhil_time_calendar';
import { X } from 'lucide-react';

const FailedPaymentsPage = () => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [organizationType, setOrganizationType] = useState('ALL');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateType, setDateType] = useState('createdAt');
  const filters = {
    status: filterType !== 'ALL' ? filterType : undefined,
    organizationId: organizationId || undefined,
    organizationType: organizationType !== 'ALL' ? organizationType : undefined,
    startDate: dateFrom ? dateFrom.toISOString() : undefined,
    endDate: dateFrom ? (() => { const e = new Date(dateFrom); e.setHours(23, 59, 59, 999); return e.toISOString(); })() : undefined,
    search: searchInput || undefined,
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="p-6 border-b border-border bg-card">
        <h2 className="text-xl font-semibold tracking-tight">Failed Payments Triage</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Triage and recover failed payment attempts. Never automatically retry a charge; generate a new secure checkout link instead.
        </p>
      </div>

      <div className="w-full relative z-50 p-6 pb-0">
        <SuperadminFilterBar
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search failed payments, or organization..."
        >
          <div className="w-full md:w-[180px] xl:w-[200px]">
            <OrganizationSelector selectedId={organizationId} onSelect={setOrganizationId} />
          </div>
          <div className="w-full md:w-[160px] xl:w-[180px]">
            <OrganizationTypeFilter value={organizationType} onChange={setOrganizationType} />
          </div>
          <div className="w-full md:w-[160px] xl:w-[160px]">
            <Select value={filterType} onValueChange={(value) => value && setFilterType(value)}>
              <SelectTrigger className="w-full rounded-full border-dashed h-9 bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Failures</SelectItem>
                <SelectItem value="UNRESOLVED">Unresolved</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
        </SuperadminFilterBar>
      </div>

      <div className="p-6 pt-0 space-y-6 mt-4">
        <FailedPaymentsOverview />

        <Card>
          <CardHeader>
            <CardTitle>Failed Transaction Log</CardTitle>
            <p className="text-sm text-muted-foreground">All failed or incomplete platform subscription payments.</p>
          </CardHeader>
          <CardContent className="p-0">
            <FailedPaymentsTable 
              filters={filters} 
              onViewDetail={(id) => navigate(`/super-admin/billing/failed-payments/${id}`)} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FailedPaymentsPage;
