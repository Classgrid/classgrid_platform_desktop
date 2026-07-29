import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrgBilling } from "../queries/useOrgAdminBilling";
import { usePayInvoice } from "../queries/usePayInvoice";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";

// Native UI Components (No Tremor)
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/marketing_ui/card";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { Switch } from "@/components/marketing_ui/switch";
import { Label } from "@/components/marketing_ui/label";
import { Input } from "@/components/marketing_ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/marketing_ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/marketing_ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/marketing_ui/input-otp";

// Charts
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

// Icons & Utils
import { CreditCard, Download, IndianRupee, ShieldCheck, Plus, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

// Custom SVG Progress Circle to replace Tremor's
const ProgressCircle = ({ value, colorClass, children, size = 64, strokeWidth = 6 }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle className="text-gray-100 dark:text-gray-800" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={size/2} cy={size/2} />
        <circle className={`${colorClass} transition-all duration-1000 ease-in-out`} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx={size/2} cy={size/2} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
        {children}
      </div>
    </div>
  );
};

export function BillingPage() {
  const queryClient = useQueryClient();
  const { data: billingData, isLoading, isError } = useOrgBilling();
  const { mutateAsync: payInvoice } = usePayInvoice();
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  const [showComparison, setShowComparison] = useState(false);
  const [isAddingBilling, setIsAddingBilling] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingGstin, setBillingGstin] = useState("");
  const [billingAddress1, setBillingAddress1] = useState("");
  const [billingAddress2, setBillingAddress2] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingPincode, setBillingPincode] = useState("");
  const [billingContactName, setBillingContactName] = useState("");
  
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  const [isEmailVerifyModalOpen, setIsEmailVerifyModalOpen] = useState(false);
  const [isPhoneVerifyModalOpen, setIsPhoneVerifyModalOpen] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  // Sync settings with backend data when loaded
  useEffect(() => {
    if (billingData?.billingSettings) {
      setBillingEmail(billingData.billingSettings.invoice_email || "");
      setBillingPhone(billingData.billingSettings.phone || "");
      setBillingGstin(billingData.billingSettings.gstin || "");
      setBillingAddress1(billingData.billingSettings.address_line1 || "");
      setBillingAddress2(billingData.billingSettings.address_line2 || "");
      setBillingCity(billingData.billingSettings.city || "");
      setBillingState(billingData.billingSettings.state || "");
      setBillingPincode(billingData.billingSettings.pincode || "");
      setBillingContactName(billingData.billingSettings.billing_contact_name || "");
      setEmailVerified(billingData.billingSettings.email_verified || false);
      setPhoneVerified(billingData.billingSettings.phone_verified || false);
    }
  }, [billingData]);

  const handleSaveSettings = async () => {
    try {
      setIsSavingSettings(true);
      const res = await fetch("/api/org/billing/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ 
          invoice_email: billingEmail, 
          phone: billingPhone,
          gstin: billingGstin,
          address_line1: billingAddress1,
          address_line2: billingAddress2,
          city: billingCity,
          state: billingState,
          pincode: billingPincode,
          billing_contact_name: billingContactName
        })
      });
      if (!res.ok) throw new Error("Failed to save settings");
      toast.success("Billing settings saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["orgBilling"] });
    } catch (err: any) {
      toast.error(err.message || "Could not save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePayNow = async (invoiceId: string) => {
    try {
      setPayingInvoiceId(invoiceId);
      await payInvoice(invoiceId);
      toast.success("Payment successful!");
      queryClient.invalidateQueries({ queryKey: ["orgBilling"] });
    } catch (error: any) {
      toast.error(error.message || "Payment failed or was cancelled.");
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const handleSetupMandate = async () => {
    try {
      setIsSavingSettings(true);
      const res = await apiClient.post("/api/org/billing/setup-mandate");
      const { key_id, order_id, amount, currency } = res.data;

      const options = {
        key: key_id,
        amount,
        currency,
        order_id,
        name: "Classgrid",
        description: "Payment Verification",
        handler: function(response: any) {
          toast.success("Account connected and verified successfully!");
          setIsAddingBilling(false);
        },
        prefill: { email: billingEmail || "admin@classgrid.in" },
        theme: { color: "#2563eb" }
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to initialize secure gateway");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/org/billing/invoice/${invoiceId}/pdf`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (!response.ok) throw new Error("Failed to download PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error.message || "Failed to download PDF");
    }
  };

  const handleSendEmailVerification = async () => {
    try {
      setIsVerifying(true);
      await apiClient.post("/api/org/billing/verify-email/send", { email: billingEmail });
      toast.success("OTP sent! Check your inbox.");
      setResendCooldown(60);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send email");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    try {
      setIsVerifying(true);
      await apiClient.post("/api/org/billing/verify-email/confirm", { otp: emailOtp });
      toast.success("Email verified successfully!");
      setEmailVerified(true);
      setIsEmailVerifyModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    try {
      setIsVerifying(true);
      await apiClient.post("/api/org/billing/verify-phone/send", { phone: billingPhone });
      toast.success("OTP sent to your phone number.");
      setResendCooldown(60);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    try {
      setIsVerifying(true);
      await apiClient.post("/api/org/billing/verify-phone/confirm", { otp: phoneOtp });
      toast.success("Phone verified successfully!");
      setPhoneVerified(true);
      setIsPhoneVerifyModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 sm:p-10 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-64 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="lg:col-span-2 h-64 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (isError || !billingData) {
    return (
      <div className="p-6 sm:p-10 max-w-7xl mx-auto">
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="pt-6 text-red-800 dark:text-red-200">
            Failed to load billing data.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { subscription, currentMonthCharges, invoices, payments, monthlyHistory, feeCollection } = billingData;

  // Process data for the chart to support the "Show Comparison" toggle if needed
  const chartData = (monthlyHistory || []).map(record => ({
    month: record.month,
    'This Month': record.totalAmount,
    'Estimated with Tax': record.totalAmount * 1.18,
  }));

  // Resource Usage Calculations
  const storageLimit = subscription?.limits?.storageGb || 100;
  const storageUsed = currentMonthCharges?.storageCharges?.count || 0;
  const storagePercent = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

  const emailsUsed = currentMonthCharges?.emailCharges?.count || 0;
  const smsUsed = currentMonthCharges?.smsCharges?.count || 0;

  const valueFormatter = (number: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short',
      style: 'currency',
      currency: 'INR',
    }).format(number);
  };

  const getStatusColor = (status: string) => {
    if (status === 'active' || status === 'paid') return 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent';
    if (status === 'overdue') return 'bg-red-500 hover:bg-red-600 text-white border-transparent';
    return 'bg-amber-500 hover:bg-amber-600 text-white border-transparent';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Billing & Subscription</h2>
        <p className="text-muted-foreground mt-1">Manage your Classgrid subscription, view invoices, and track payments.</p>
      </div>

      {/* HISTORICAL USAGE CHART (TOP) - Matching User Snippet natively */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-gray-200/60 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg">Daily Cost Trend</CardTitle>
            <CardDescription>Your daily platform usage costs over the current billing cycle.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full mt-4">
              {billingData.dailySeries && billingData.dailySeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={billingData.dailySeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 12 }} 
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
                      }}
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                      labelFormatter={(label) => format(new Date(label), "dd MMM yyyy")}
                    />
                    <Area type="monotone" dataKey="amountInr" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                  Daily usage data will appear here once active.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 shadow-sm border-gray-200/60 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg">Resource Breakdown</CardTitle>
            <CardDescription>Distribution of your costs this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Storage', value: currentMonthCharges?.storageCharges?.total || 0, color: '#10b981' },
                      { name: 'Emails', value: currentMonthCharges?.emailCharges?.total || 0, color: '#8b5cf6' },
                      { name: 'SMS', value: currentMonthCharges?.smsCharges?.total || 0, color: '#6366f1' },
                      { name: 'AI Tokens', value: currentMonthCharges?.aiUsageCharges?.total || 0, color: '#ec4899' },
                      { name: 'Live Classes', value: currentMonthCharges?.liveClassCharges?.total || 0, color: '#d946ef' },
                      { name: 'Modules', value: currentMonthCharges?.moduleChargesTotal || 0, color: '#f43f5e' },
                      { name: 'Platform Fee', value: currentMonthCharges?.platformFee || 0, color: '#64748b' },
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {
                      [
                        { name: 'Storage', value: currentMonthCharges?.storageCharges?.total || 0, color: '#10b981' },
                        { name: 'Emails', value: currentMonthCharges?.emailCharges?.total || 0, color: '#8b5cf6' },
                        { name: 'SMS', value: currentMonthCharges?.smsCharges?.total || 0, color: '#6366f1' },
                        { name: 'AI Tokens', value: currentMonthCharges?.aiUsageCharges?.total || 0, color: '#ec4899' },
                        { name: 'Live Classes', value: currentMonthCharges?.liveClassCharges?.total || 0, color: '#d946ef' },
                        { name: 'Modules', value: currentMonthCharges?.moduleChargesTotal || 0, color: '#f43f5e' },
                        { name: 'Platform Fee', value: currentMonthCharges?.platformFee || 0, color: '#64748b' },
                      ].filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))
                    }
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {currentMonthCharges?.total === 0 && (
                 <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                   No charges yet
                 </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RESOURCES USED - PROGRESS CIRCLES */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Resource Usage</CardTitle>
          <CardDescription>Real-time limits and usage for your organization based on your current plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mt-4">
            
            <div className="flex flex-col items-center text-center">
              <ProgressCircle value={storagePercent} colorClass={storagePercent > 80 ? "text-red-500" : "text-emerald-500"}>
                <span>{storagePercent}%</span>
              </ProgressCircle>
              <p className="mt-4 font-semibold text-gray-900 dark:text-white">Storage</p>
              <p className="text-xs text-muted-foreground mt-1">{storageUsed.toFixed(2)} GB / {storageLimit} GB</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <ProgressCircle value={emailsUsed > 0 ? 100 : 0} colorClass="text-purple-500">
                <span className="text-purple-600 dark:text-purple-400">{emailsUsed}</span>
              </ProgressCircle>
              <p className="mt-4 font-semibold text-gray-900 dark:text-white">Emails Sent</p>
              <p className="text-xs text-muted-foreground mt-1">Pay-as-you-go</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <ProgressCircle value={smsUsed > 0 ? 100 : 0} colorClass="text-indigo-500">
                <span className="text-indigo-600 dark:text-indigo-400">{smsUsed}</span>
              </ProgressCircle>
              <p className="mt-4 font-semibold text-gray-900 dark:text-white">SMS Sent</p>
              <p className="text-xs text-muted-foreground mt-1">Pay-as-you-go</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <ProgressCircle value={100} colorClass="text-pink-500">
                <span className="text-pink-600 dark:text-pink-400">{currentMonthCharges?.aiUsageCharges?.count?.toLocaleString() || 0}</span>
              </ProgressCircle>
              <p className="mt-4 font-semibold text-gray-900 dark:text-white">AI Tokens</p>
              <p className="text-xs text-muted-foreground mt-1">Pay-as-you-go</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <ProgressCircle value={100} colorClass="text-violet-500">
                <span className="text-violet-600 dark:text-violet-400">{currentMonthCharges?.liveClassCharges?.count?.toLocaleString() || 0}</span>
              </ProgressCircle>
              <p className="mt-4 font-semibold text-gray-900 dark:text-white">Live Minutes</p>
              <p className="text-xs text-muted-foreground mt-1">Pay-as-you-go</p>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* SETUP BILLING ACCOUNT */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl shadow-sm">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Setup Billing Account</h3>
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                Add a payment method to automatically pay your monthly SaaS invoices based on the resources used above. 
                We dynamically calculate your usage so you only pay for what you actually use.
              </p>
              <div className="mt-5">
                <Button 
                  onClick={() => setIsAddingBilling(true)}
                  disabled={isAddingBilling}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PLAN CARD */}
        <Card className="lg:col-span-1 shadow-sm flex flex-col justify-between">
          <CardContent className="pt-6 flex-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Current Plan</h3>
              <Badge className={getStatusColor(subscription?.status || "")}>
                <ShieldCheck className="w-3 h-3 mr-1" />
                {subscription?.plan?.toUpperCase() || "DEMO"}
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="font-medium capitalize text-sm">{subscription?.status || "No active plan"}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                <span className="text-sm text-muted-foreground">Billing State</span>
                <Badge variant={subscription?.isPaid ? "default" : "secondary"} className={subscription?.isPaid ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-orange-100 text-orange-800 hover:bg-orange-100"}>
                  {subscription?.isPaid ? "Paid" : "Unpaid"}
                </Badge>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                <span className="text-sm text-muted-foreground">Next Renewal</span>
                <span className="font-medium text-sm">
                  {subscription?.expiresAt ? format(new Date(subscription.expiresAt), "dd MMM yyyy") : "N/A"}
                </span>
              </div>
            </div>
            
            <div className="mt-8">
              <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Resource Limits</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Storage Limit</span><span className="font-medium">{subscription?.limits?.storageGb ? `${subscription.limits.storageGb} GB` : "Pay as you go"}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CURRENT MONTH ESTIMATE */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Current Month Accrued Charges</CardTitle>
            <CardDescription>Estimated charges for the current billing cycle. Finalized at month end.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="font-medium text-gray-900 dark:text-gray-100">Classgrid Platform Fee</span>
                <span className="font-semibold">₹{currentMonthCharges?.platformFee?.toLocaleString() || 0}</span>
              </div>
              
              <div className="space-y-2 py-2">
                {currentMonthCharges?.moduleLineItems && currentMonthCharges.moduleLineItems.length > 0 && (
                  <div className="space-y-1 pb-2 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subscribed Modules</p>
                    {currentMonthCharges.moduleLineItems.map((mod: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Module: {mod.label}</span>
                        <span>₹{mod.price?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}


                {currentMonthCharges?.emailCharges?.count > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Emails ({currentMonthCharges.emailCharges.count} × ₹{currentMonthCharges.emailCharges.rate})</span>
                    <span>₹{currentMonthCharges.emailCharges.total.toLocaleString()}</span>
                  </div>
                )}
                
                {currentMonthCharges?.smsCharges?.count > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SMS ({currentMonthCharges.smsCharges.count} × ₹{currentMonthCharges.smsCharges.rate})</span>
                    <span>₹{currentMonthCharges.smsCharges.total.toLocaleString()}</span>
                  </div>
                )}

                {currentMonthCharges?.storageCharges?.count > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Storage ({currentMonthCharges.storageCharges.count} GB × ₹{currentMonthCharges.storageCharges.rate})</span>
                    <span>₹{currentMonthCharges.storageCharges.total.toLocaleString()}</span>
                  </div>
                )}
                
                {currentMonthCharges?.aiUsageCharges && currentMonthCharges.aiUsageCharges.count > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">AI Tokens ({currentMonthCharges.aiUsageCharges.count.toLocaleString()} × ₹{currentMonthCharges.aiUsageCharges.rate})</span>
                    <span>₹{currentMonthCharges.aiUsageCharges.total.toLocaleString()}</span>
                  </div>
                )}
                
                {currentMonthCharges?.liveClassCharges && currentMonthCharges.liveClassCharges.count > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Live Classes ({currentMonthCharges.liveClassCharges.count.toLocaleString()} mins × ₹{currentMonthCharges.liveClassCharges.rate})</span>
                    <span>₹{currentMonthCharges.liveClassCharges.total.toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              <hr className="border-gray-200 dark:border-gray-800" />
              
              <div className="flex justify-between py-1 text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{currentMonthCharges?.subtotal?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between py-1 text-sm">
                <span className="text-muted-foreground">GST ({currentMonthCharges?.gstPercent || 18}%)</span>
                <span className="font-medium">₹{currentMonthCharges?.gstAmount?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center py-4 mt-2 bg-gray-50 dark:bg-gray-800/40 rounded-xl px-4 border border-gray-100 dark:border-gray-800">
                <span className="font-semibold text-gray-900 dark:text-white">Estimated Total</span>
                <span className="font-bold text-xl text-blue-600 dark:text-blue-400">₹{currentMonthCharges?.total?.toLocaleString() || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FEE COLLECTION SUMMARY */}
      <Card className="border-t-4 border-t-emerald-500 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Student Fee Collection</CardTitle>
          <CardDescription>Overview of fees collected by your organization from students.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
              <p className="text-sm text-muted-foreground font-medium">Total Billed</p>
              <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">₹{feeCollection?.totalBilled?.toLocaleString() || 0}</p>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Total Collected</p>
              <p className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-500">₹{feeCollection?.totalPaid?.toLocaleString() || 0}</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900">
              <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">Outstanding</p>
              <p className="text-2xl font-bold mt-2 text-amber-600 dark:text-amber-500">₹{feeCollection?.outstanding?.toLocaleString() || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
              <p className="text-sm text-muted-foreground font-medium">Total Invoices</p>
              <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{feeCollection?.totalInvoices || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* INVOICE HISTORY */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Invoice History</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="overflow-x-auto">
            {invoices && invoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <TableHead className="font-semibold">Invoice #</TableHead>
                    <TableHead className="font-semibold">Billing Period</TableHead>
                    <TableHead className="font-semibold">Due Date</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv: any, idx: number) => (
                    <TableRow key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.billingPeriod?.month} {inv.billingPeriod?.year}</TableCell>
                      <TableCell>{format(new Date(inv.dueDate), "dd MMM yyyy")}</TableCell>
                      <TableCell className="font-medium">₹{inv.total?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(inv.status)}>
                          {inv.status?.toUpperCase() || "UNPAID"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="h-8" onClick={() => setSelectedInvoice(inv)}>
                            <Download className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                          {inv.status !== "paid" && (
                            <Button 
                              size="sm" 
                              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={payingInvoiceId === inv.id}
                              onClick={() => handlePayNow(inv.id)}
                            >
                              <CreditCard className="w-3.5 h-3.5 mr-1" />
                              {payingInvoiceId === inv.id ? "Processing..." : "Pay Now"}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <CreditCard className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No invoices yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Invoices will appear here once they are generated.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* BILLING SETTINGS */}
      <div className="space-y-6 mt-12">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Billing Profile & Verification</h3>
        
        <Card className="shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden rounded-xl">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Invoice Email</Label>
                <div className="flex gap-2">
                  <Input 
                    value={billingEmail} 
                    onChange={(e) => setBillingEmail(e.target.value)} 
                    placeholder="accounts@school.edu"
                    className="flex-1"
                  />
                  {emailVerified ? (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">Verified</Badge>
                  ) : (
                    <Button variant="outline" onClick={() => setIsEmailVerifyModalOpen(true)}>Verify</Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Billing Phone Number</Label>
                <div className="flex gap-2">
                  <Input 
                    value={billingPhone} 
                    onChange={(e) => setBillingPhone(e.target.value)} 
                    placeholder="9876543210"
                    className="flex-1"
                  />
                  {phoneVerified ? (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">Verified</Badge>
                  ) : (
                    <Button variant="outline" onClick={() => setIsPhoneVerifyModalOpen(true)}>Verify</Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Billing Contact Name</Label>
                <Input 
                  value={billingContactName} 
                  onChange={(e) => setBillingContactName(e.target.value)} 
                  placeholder="John Doe"
                />
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">GSTIN (Optional)</Label>
                <Input 
                  value={billingGstin} 
                  onChange={(e) => setBillingGstin(e.target.value)} 
                  placeholder="27AADCB2230M1Z2"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden rounded-xl">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Billing Address</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 md:col-span-2">
                <Label className="text-sm font-medium">Address Line 1</Label>
                <Input 
                  value={billingAddress1} 
                  onChange={(e) => setBillingAddress1(e.target.value)} 
                  placeholder="Street address, P.O. box, company name, c/o"
                />
              </div>

              <div className="space-y-3 md:col-span-2">
                <Label className="text-sm font-medium">Address Line 2 (Optional)</Label>
                <Input 
                  value={billingAddress2} 
                  onChange={(e) => setBillingAddress2(e.target.value)} 
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">City</Label>
                <Input 
                  value={billingCity} 
                  onChange={(e) => setBillingCity(e.target.value)} 
                  placeholder="Mumbai"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">State / Province</Label>
                <select 
                  className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={billingState}
                  onChange={(e) => setBillingState(e.target.value)}
                >
                  <option value="">Select State / UT</option>
                  <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Chandigarh">Chandigarh</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Goa">Goa</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Ladakh">Ladakh</option>
                  <option value="Lakshadweep">Lakshadweep</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Puducherry">Puducherry</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="West Bengal">West Bengal</option>
                </select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">ZIP / Postal Code</Label>
                <Input 
                  value={billingPincode} 
                  onChange={(e) => setBillingPincode(e.target.value)} 
                  placeholder="400001"
                />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/40 px-6 py-4 flex justify-end border-t border-gray-200 dark:border-gray-800">
            <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white rounded-md px-6">
              {isSavingSettings ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </Card>
      </div>
      
      {/* INVOICE DETAILS MODAL */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="flex justify-between text-sm text-gray-500">
                <div>
                  <p>Billing Period:</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedInvoice.billingPeriod?.month}/{selectedInvoice.billingPeriod?.year}
                  </p>
                </div>
                <div className="text-right">
                  <p>Due Date:</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {format(new Date(selectedInvoice.dueDate), "dd MMM yyyy")}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 font-medium">Resource</th>
                      <th className="text-right py-2 font-medium">Usage</th>
                      <th className="text-right py-2 font-medium">Rate</th>
                      <th className="text-right py-2 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.lineItems?.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <td className="py-2">{item.resourceLabel || item.provider}</td>
                        <td className="text-right py-2">{item.totalQuantity} {item.unit}</td>
                        <td className="text-right py-2">₹{item.unitRateInr}</td>
                        <td className="text-right py-2 font-medium">₹{item.amountInr?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>₹{selectedInvoice.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">GST ({selectedInvoice.taxPercent}%)</span>
                  <span>₹{selectedInvoice.taxAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total Amount</span>
                  <span>₹{selectedInvoice.total?.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end pt-4 gap-3">
                <Button variant="outline" onClick={() => setSelectedInvoice(null)}>Close</Button>
                <Button variant="outline" onClick={() => handleDownloadPdf(selectedInvoice.id)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                {selectedInvoice.status !== "paid" && (
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={payingInvoiceId === selectedInvoice.id}
                    onClick={() => {
                      handlePayNow(selectedInvoice.id);
                      setSelectedInvoice(null);
                    }}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay ₹{selectedInvoice.total?.toLocaleString()} Now
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ADD PAYMENT METHOD MODAL */}
      <Dialog open={isAddingBilling} onOpenChange={setIsAddingBilling}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Connect a debit or credit card to automatically pay your monthly SaaS invoices.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-center">Payment Verification</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              You will be redirected to our payment gateway to authenticate and save your card for future recurring billing.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button variant="outline" onClick={() => setIsAddingBilling(false)} disabled={isSavingSettings}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSetupMandate} disabled={isSavingSettings}>
              {isSavingSettings ? "Connecting..." : "Proceed to Gateway"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* VERIFY EMAIL MODAL */}
      <Dialog open={isEmailVerifyModalOpen} onOpenChange={(open) => {
        setIsEmailVerifyModalOpen(open);
        if (open) handleSendEmailVerification();
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Verify Email Address</DialogTitle>
            <DialogDescription>
              Enter the 6-digit OTP sent to {billingEmail}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2 flex flex-col items-center">
              <Label>Enter 6-digit Code</Label>
              <InputOTP 
                value={emailOtp}
                onChange={setEmailOtp}
                maxLength={6}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={handleVerifyEmailOtp} disabled={isVerifying || emailOtp.length !== 6} className="w-full">
              {isVerifying ? "Verifying..." : "Verify OTP"}
            </Button>
            <Button variant="ghost" onClick={handleSendEmailVerification} disabled={isVerifying || resendCooldown > 0} className="w-full">
              {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* VERIFY PHONE MODAL */}
      <Dialog open={isPhoneVerifyModalOpen} onOpenChange={(open) => {
        setIsPhoneVerifyModalOpen(open);
        if (open) handleSendPhoneOtp(); // Auto-send when opened
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Verify Phone Number</DialogTitle>
            <DialogDescription>
              Enter the 6-digit OTP sent to {billingPhone}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2 flex flex-col items-center">
              <Label>Enter 6-digit Code</Label>
              <InputOTP 
                value={phoneOtp}
                onChange={setPhoneOtp}
                maxLength={6}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={handleVerifyPhoneOtp} disabled={isVerifying || phoneOtp.length !== 6} className="w-full">
              {isVerifying ? "Verifying..." : "Verify OTP"}
            </Button>
            <Button variant="ghost" onClick={handleSendPhoneOtp} disabled={isVerifying || resendCooldown > 0} className="w-full">
               {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
