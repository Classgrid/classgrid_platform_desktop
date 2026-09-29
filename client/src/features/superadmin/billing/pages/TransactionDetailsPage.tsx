import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { formatDate } from "@/utils/dateUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/marketing_ui/card";
import { Button } from "@/components/marketing_ui/button";
import { ArrowLeft, RefreshCw, ServerCrash, CheckCircle2, Clock, Globe, ShieldAlert, CreditCard } from "lucide-react";
import { useBreadcrumbStore } from "@/store/useBreadcrumbStore";

export default function TransactionDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setBreadcrumbs);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["superadmin", "transaction", id],
    queryFn: () => apiClient.get(`/api/super-admin/transactions/${id}`).then((r) => r.data),
  });

  const tx = data?.data;

  useEffect(() => {
    if (tx) {
      setBreadcrumbs([
        { label: "Transactions", href: "/super-admin/billing/transactions" },
        { label: tx._id },
      ]);
    }
    return () => setBreadcrumbs([]);
  }, [tx, setBreadcrumbs]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-64 bg-muted animate-pulse rounded-md"></div>
          <div className="h-4 w-96 bg-muted animate-pulse rounded-md mt-2"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-[250px] bg-muted animate-pulse rounded-xl"></div>
          <div className="h-[250px] bg-muted animate-pulse rounded-xl"></div>
          <div className="h-[200px] bg-muted animate-pulse rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (isError || !tx) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <ServerCrash className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">Failed to load transaction details.</p>
        <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
      </div>
    );
  }

  // Extract method details
  const rawMethod = tx.paymentMethod || '';
  const [methodType, methodDetail] = rawMethod.includes(':') ? rawMethod.split(':', 2) : [rawMethod, ''];

  const isSuccess = tx.status === 'success' || tx.status === 'CAPTURED';
  const isFailed = tx.status === 'failed';

  const createdAt = tx.paymentTime || tx.createdAt;
  const capturedAt = tx.paymentTime || tx.createdAt;
  const settlementDate = capturedAt ? new Date(new Date(capturedAt).getTime() + 3 * 24 * 60 * 60 * 1000) : null;
  const now = new Date();
  const isSettled = settlementDate ? settlementDate <= now : false;

  const steps = [
    { label: 'Payment Created', sub: createdAt ? formatDate(createdAt) : '—', done: true, failed: false },
    { label: 'Payment Authorized', sub: isSuccess ? (capturedAt ? formatDate(capturedAt) : '—') : (isFailed ? 'Not completed' : 'Pending'), done: isSuccess, failed: isFailed },
    { label: 'Payment Captured', sub: isSuccess ? (capturedAt ? formatDate(capturedAt) : '—') : (isFailed ? 'Not completed' : 'Pending'), done: isSuccess, failed: isFailed },
    { label: isSettled ? 'Settlement Processed' : 'Settlement Pending', sub: settlementDate ? `Expected by ${formatDate(settlementDate)}` : '—', done: isSettled && isSuccess, failed: false, pending: !isSettled },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Transaction Details</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            ID: {tx._id}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* ── SECTION 1: Overview Hero ── */}
        <div className={`col-span-full rounded-xl border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
          ${isSuccess ? 'bg-emerald-500/5 border-emerald-500/20' : isFailed ? 'bg-red-500/5 border-red-500/20' : 'bg-card border-border'}`}>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
            <p className="text-4xl font-bold text-foreground tracking-tight">
              ₹{tx.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || (tx.amountPaise ? (tx.amountPaise / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—')}
            </p>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              {tx.razorpayPaymentId || tx._id}
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-3">
            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold uppercase tracking-wider ${
              isFailed ? "bg-red-500/10 text-red-500 border border-red-500/20" :
              "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
            }`}>
              {isFailed ? <ShieldAlert className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {tx.status || 'SUCCESS'}
            </div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest bg-background/50 px-3 py-1.5 rounded-md border border-border/50 shadow-sm backdrop-blur-sm">
              {tx.paymentFlow === 'ai_topup' ? '🤖 AI Top-Up' : tx.paymentFlow === 'subscription' ? '🏢 Subscription' : tx.type || '💳 Razorpay'}
            </span>
          </div>
        </div>

        {/* ── SECTION 2: Customer Details ── */}
        <Card className="shadow-sm">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{tx.userName || "Unknown"}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium truncate max-w-[150px]">{tx.userEmail || "—"}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Mobile</span>
              <span className="font-medium font-mono">{tx.userMobile || "—"}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-medium font-mono text-xs">{tx.userId?._id || tx.userId || "—"}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-1">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize px-2 py-0.5 bg-muted rounded text-xs">{tx.userRole || "—"}</span>
            </div>
          </CardContent>
        </Card>

        {/* ── SECTION 3: Payment Details ── */}
        <Card className="shadow-sm">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500"><CreditCard className="h-4 w-4" /></div>
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Method</span>
              <span className="font-medium uppercase flex items-center gap-1.5">
                {methodType.toLowerCase() === 'upi' ? '📱' : methodType.toLowerCase() === 'card' ? '💳' : '🏦'} {methodType || tx.method || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
              <span className="text-muted-foreground">{methodType.toLowerCase() === 'upi' ? 'UPI VPA' : 'Account'}</span>
              <span className="font-medium font-mono text-xs truncate max-w-[140px]" title={methodDetail}>{methodDetail || '—'}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Bank RRN</span>
              <span className="font-medium font-mono text-xs">{tx.bankRRN || "—"}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium text-[11px]">{tx.paymentTime ? formatDate(tx.paymentTime) : tx.createdAt ? formatDate(tx.createdAt) : "—"}</span>
            </div>
            <div className="flex justify-between items-start text-sm pt-1">
              <span className="text-muted-foreground shrink-0 mr-4">Note</span>
              <span className="font-medium text-xs text-right leading-tight">{tx.note || "—"}</span>
            </div>
          </CardContent>
        </Card>

        {/* ── SECTION 4 & 5 Combined: Organization & Fees ── */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-muted/30 border-b py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="p-1 rounded bg-amber-500/10 text-amber-500"><Globe className="h-3.5 w-3.5" /></div>
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 pb-3 px-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium text-right line-clamp-1">{tx.organization?.name || tx.organizationId?.name || tx.organizationName || "—"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">ID</span>
                <span className="font-medium font-mono text-xs">{tx.organization?._id || tx.organizationId?._id || (typeof tx.organizationId === 'string' ? tx.organizationId : '') || "—"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="bg-muted/30 border-b py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="p-1 rounded bg-purple-500/10 text-purple-500"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                Fees & Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 pb-3 px-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Razorpay Fee</span>
                <span className="font-medium text-red-500/80">{tx.feePaise != null ? `-₹${(tx.feePaise / 100).toFixed(2)}` : '₹0.00'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">GST on Fee</span>
                <span className="font-medium text-red-500/80">{tx.taxPaise != null ? `-₹${(tx.taxPaise / 100).toFixed(2)}` : '₹0.00'}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold pt-1 border-t border-border/50">
                <span className="text-foreground">Net Received</span>
                <span className="text-emerald-500">{
                  tx.amount != null
                    ? `₹${(tx.amount - (tx.feePaise || 0) / 100 - (tx.taxPaise || 0) / 100).toFixed(2)}`
                    : '—'
                }</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/50">
                <span>IP: <span className="font-mono">{tx.sourceIp || '—'}</span></span>
                <span>Fee Bearer: Merchant</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── SECTION 6: Payment Timeline ── */}
        <Card className="shadow-sm md:col-span-2 lg:col-span-full border-primary/20">
          <CardHeader className="bg-primary/5 border-b pb-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary text-primary-foreground"><Clock className="h-4 w-4" /></div>
              Payment Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row justify-between gap-6 relative">
              {/* Desktop Connecting Line */}
              <div className="hidden sm:block absolute top-[14px] left-[10%] right-[10%] h-0.5 bg-border -z-10" />
              {/* Mobile Connecting Line */}
              <div className="sm:hidden absolute left-[14px] top-6 bottom-6 w-0.5 bg-border -z-10" />

              {steps.map((step, idx) => (
                <div key={idx} className="flex flex-row sm:flex-col items-start sm:items-center text-left sm:text-center relative gap-4 sm:gap-2 flex-1">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-background transition-colors shadow-sm
                    ${step.done ? 'border-emerald-500' : step.failed ? 'border-red-500' : 'border-muted-foreground/30'}`}>
                    {step.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : step.failed ? (
                      <ShieldAlert className="h-4 w-4 text-red-500" />
                    ) : (
                      <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold leading-tight ${step.done ? 'text-foreground' : step.failed ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[150px] mx-auto">{step.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

