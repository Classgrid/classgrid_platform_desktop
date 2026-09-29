import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { formatDate } from "@/utils/dateUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/marketing_ui/card";
import { Button } from "@/components/marketing_ui/button";
import { ArrowLeft, RefreshCw, ServerCrash, AlertCircle, Clock, Globe, ShieldAlert, CreditCard } from "lucide-react";
import { useBreadcrumbStore } from "@/store/useBreadcrumbStore";

export default function FailedPaymentDetailsPage() {
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
        { label: "Failed Payments", href: "/super-admin/billing/failed-payments" },
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
        <p className="text-muted-foreground">Failed to load payment details.</p>
        <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Failed Payment Details</h1>
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
                <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-1 text-xs font-medium text-red-500">
                  <AlertCircle className="h-3.5 w-3.5" />
                  FAILED
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
                <p className="text-sm font-medium text-muted-foreground">Error Note</p>
                <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md mt-1">{tx.note || "No specific note attached."}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
            <CardDescription>Details of the user who attempted payment</CardDescription>
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
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Organization</p>
                <p className="font-medium">{tx.organization?.name || tx.organizationId?.name || tx.organizationName || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
