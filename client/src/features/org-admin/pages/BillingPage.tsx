import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrgBilling } from "../queries/useOrgAdminBilling";
import { usePayInvoice } from "../queries/usePayInvoice";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/marketing_ui/select";

// Charts
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

// Icons & Utils
import { CreditCard, Download, IndianRupee, ShieldCheck, Plus, CheckCircle2, Loader2 } from "lucide-react";
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
  
  const [billingEmail, setBillingEmail] = useState("");
  const [billingContactName, setBillingContactName] = useState("");
  
  const [emailVerified, setEmailVerified] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isEmailVerifyModalOpen, setIsEmailVerifyModalOpen] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
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
      setBillingContactName(billingData.billingSettings.billing_contact_name || "");
      setEmailVerified(billingData.billingSettings.email_verified || false);
    }
  }, [billingData]);

  const handleSaveSettings = async () => {
    if (!billingContactName?.trim()) return toast.error("Billing Name is required.");
    if (!billingEmail?.trim()) return toast.error("Billing Email is required.");
    if (!emailVerified) return toast.error("You must verify your Billing Email before saving.");

    try {
      setIsSavingSettings(true);
      const res = await fetch("/api/org/billing/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ 
          invoice_email: billingEmail, 
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



  const handleSendEmailVerification = async () => {
    setIsSendingEmailOtp(true);
    const promise = apiClient.post("/api/org/billing/verify-email/send", { email: billingEmail });

    toast.promise(promise, {
      loading: "Sending OTP to your email...",
      success: () => {
        setResendCooldown(60);
        setIsEmailVerifyModalOpen(true);
        setIsSendingEmailOtp(false);
        return "OTP sent! Check your inbox.";
      },
      error: (error: any) => {
        setIsSendingEmailOtp(false);
        return error.response?.data?.message || "Failed to send email";
      }
    });
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



  if (isLoading) {
    return (
      <div className="p-6 sm:p-10 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* BILLING SETTINGS */}
      <div className="space-y-6">
        
        <Card className="shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden rounded-xl">
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Billing Name</Label>
              <Input 
                value={billingContactName} 
                onChange={(e) => setBillingContactName(e.target.value)} 
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Billing Email</Label>
              <div className="flex gap-2">
                <Input 
                  value={billingEmail} 
                  onChange={(e) => {
                    setBillingEmail(e.target.value);
                    setEmailVerified(false);
                  }} 
                  placeholder="accounts@school.edu"
                  className="flex-1"
                  disabled={!billingContactName?.trim()}
                />
                {emailVerified ? (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">Verified</Badge>
                ) : (
                  <Button variant="outline" onClick={handleSendEmailVerification} disabled={isSendingEmailOtp || !billingEmail?.trim()}>
                    Verify
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-8 py-2 font-medium shadow-sm transition-all hover:shadow-md">
            {isSavingSettings ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Profile...
              </>
            ) : "Save All Changes"}
          </Button>
        </div>
      </div>

      {/* VERIFY EMAIL MODAL */}
      <Dialog open={isEmailVerifyModalOpen} onOpenChange={setIsEmailVerifyModalOpen}>
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
              Verify OTP
            </Button>
            <div className="mt-4 text-center">
              <Button variant="ghost" onClick={handleSendEmailVerification} disabled={isSendingEmailOtp || resendCooldown > 0} className="w-full">
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>



    </div>
  );
}
