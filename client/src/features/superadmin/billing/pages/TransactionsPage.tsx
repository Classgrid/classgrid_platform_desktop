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

/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/marketing_ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/marketing_ui/card';
import { Input } from '@/components/marketing_ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/marketing_ui/select';
import { SuperadminFilterBar } from '../../components/SuperadminFilterBar';
import { OrganizationSelector, OrganizationTypeFilter } from '../components/shared/BillingFilterComponents';
import { TransactionTable, TransactionDetailDrawer } from '../components/finance/TransactionComponents';
import { NikhilTimeCalendar } from '@/components/marketing_ui/nikhil_time_calendar';
import { X } from 'lucide-react';

type DateRange = { from: Date; to?: Date };

const TransactionsPage = () => {
  const navigate = useNavigate();
  const [paymentFlow, setPaymentFlow] = useState('ALL');
  const [organizationId, setOrganizationId] = useState('');
  const [organizationType, setOrganizationType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [method, setMethod] = useState('ALL');
  const [settlementStatus, setSettlementStatus] = useState('ALL');
  const [refundStatus, setRefundStatus] = useState('ALL');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateType, setDateType] = useState('createdAt');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filters = {
    type: paymentFlow !== 'ALL' ? paymentFlow : undefined,
    organizationId: organizationId || undefined,
    organizationType: organizationType !== 'ALL' ? organizationType : undefined,
    status: status !== 'ALL' ? status : undefined,
    method: method !== 'ALL' ? method : undefined,
    settlementStatus: settlementStatus !== 'ALL' ? settlementStatus : undefined,
    refundStatus: refundStatus !== 'ALL' ? refundStatus : undefined,
    startDate: dateFrom ? dateFrom.toISOString() : undefined,
    endDate: dateFrom ? (() => { const e = new Date(dateFrom); e.setHours(23, 59, 59, 999); return e.toISOString(); })() : undefined,
    search: search || undefined,
  };

  const clearFilters = () => {
    setPaymentFlow('ALL');
    setOrganizationId('');
    setOrganizationType('ALL');
    setStatus('ALL');
    setMethod('ALL');
    setSettlementStatus('ALL');
    setRefundStatus('ALL');
    setDateFrom(undefined);
    setSearchInput('');
    setSearch('');
  };

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <div className="border-b border-border bg-card p-6">
        <h2 className="text-xl font-semibold tracking-tight">Payment Transactions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Includes both Classgrid subscriptions and institution-owned payment flows.
        </p>
      </div>

      <div className="w-full relative z-50 p-6 pb-0">
        <SuperadminFilterBar
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search transaction, provider payment, or organization"
        >
          <div className="w-full md:w-[180px] xl:w-[200px]">
            <OrganizationSelector selectedId={organizationId} onSelect={setOrganizationId} />
          </div>
          <div className="w-full md:w-[160px] xl:w-[180px]">
            <OrganizationTypeFilter value={organizationType} onChange={setOrganizationType} />
          </div>
          <div className="w-full md:w-[160px] xl:w-[180px]">
            <Select value={paymentFlow} onValueChange={(value) => value && setPaymentFlow(value)}>
              <SelectTrigger className="w-full rounded-full border-dashed h-9 bg-background"><SelectValue placeholder="Payment flow" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All payment flows</SelectItem>
                <SelectItem value="CLASSGRID_SUBSCRIPTION">Classgrid subscriptions</SelectItem>
                <SelectItem value="INSTITUTION_FEE">Institution payments</SelectItem>
                <SelectItem value="AI_TOPUP">AI Top-Ups</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-[160px] xl:w-[160px]">
            <Select value={status} onValueChange={(value) => value && setStatus(value)}>
              <SelectTrigger className="w-full rounded-full border-dashed h-9 bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="CAPTURED">Captured / Success</SelectItem>
                <SelectItem value="PARTIALLY_REFUNDED">Partially refunded</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="DISPUTED">Disputed</SelectItem>
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
        <Card>
          <CardHeader><CardTitle>Transaction log</CardTitle></CardHeader>
          <CardContent className="p-0">
            <TransactionTable filters={filters} onViewDetail={(id) => navigate(`/super-admin/billing/transactions/${id}`)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TransactionsPage;
