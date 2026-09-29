import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { formatDate } from "@/utils/dateUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/marketing_ui/card";
import { Button } from "@/components/marketing_ui/button";
import { ArrowLeft, RefreshCw, ServerCrash, CheckCircle2, Clock, Globe, ShieldAlert, CreditCard } from "lucide-react";

export default function TransactionDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["superadmin", "transaction", id],
    queryFn: () => apiClient.get(`/api/super-admin/transactions/${id}`).then((r) => r.data),
  });

  const tx = data?.data;

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Transaction Details</h1>
          <p className="text-sm text-muted-foreground">
            Transaction ID: {tx._id}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Razorpay Details</CardTitle>
            <CardDescription>Payment gateway information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Amount</p>
                <p className="text-lg font-bold">₹{tx.amount?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {tx.status?.toUpperCase() || "SUCCESS"}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment ID</p>
                <p className="font-mono text-sm">{tx.razorpayPaymentId || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                <p className="font-mono text-sm">{tx.razorpayOrderId || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Note</p>
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md mt-1">{tx.note || "No specific note attached."}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
            <CardDescription>Details of the user who made the payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">User Name</p>
                <p className="font-medium">{tx.userName || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                <p className="font-medium">{tx.userEmail || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mobile Number</p>
                <p className="font-medium">{tx.userMobile || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Organization</p>
                <p className="font-medium">{tx.organizationName || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <p className="font-medium capitalize">{tx.userRole || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Network & Device Context</CardTitle>
            <CardDescription>Security and origin information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Payment Method</p>
                <p className="font-medium uppercase mt-1">{tx.paymentMethod || "UNKNOWN"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Payment Time</p>
                <p className="font-medium mt-1">{tx.paymentTime ? formatDate(tx.paymentTime, "dd MMM yyyy, hh:mm a") : "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> IP Address</p>
                <p className="font-mono text-sm mt-1">{tx.networkIp || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5" /> VPN Usage</p>
                <p className="font-medium mt-1">{tx.vpnConnected ? "Detected" : "Not Detected"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
