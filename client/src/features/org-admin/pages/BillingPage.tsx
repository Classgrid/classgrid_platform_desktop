import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrgBilling } from "../queries/useOrgAdminBilling";
import { usePayInvoice } from "../queries/usePayInvoice";
import toast from "react-hot-toast";
import {
  Card,
  Text,
  Flex,
  Grid,
  Title,
  Subtitle,
  Badge,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Button,
  Divider,
  BarChart,
  Switch,
  ProgressCircle,
  Metric,
} from "@tremor/react";
import { CreditCard, Download, IndianRupee, ShieldCheck, Plus, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export function BillingPage() {
  const queryClient = useQueryClient();
  const { data: billingData, isLoading, isError } = useOrgBilling();
  const { mutateAsync: payInvoice } = usePayInvoice();
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  const [showComparison, setShowComparison] = useState(false);
  const [isAddingBilling, setIsAddingBilling] = useState(false);

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
          <Text className="text-red-800 dark:text-red-200">Failed to load billing data.</Text>
        </Card>
      </div>
    );
  }

  const { subscription, currentMonthCharges, invoices, payments, monthlyHistory, feeCollection } = billingData;

  // Process data for the chart to support the "Show Comparison" toggle if needed
  const chartData = (monthlyHistory || []).map(record => ({
    month: record.month,
    'This Month': record.totalAmount,
    'Estimated with Tax': record.totalAmount * 1.18, // dynamic calculation for toggle
  }));

  // Resource Usage Calculations
  const storageLimit = subscription?.limits?.storageGb || 100;
  const storageUsed = currentMonthCharges?.storageCharges?.count || 0;
  const storagePercent = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

  const studentsLimit = subscription?.limits?.maxStudents || 1000;
  const studentsUsed = currentMonthCharges?.studentCharges?.count || 0;
  const studentsPercent = Math.min(100, Math.round((studentsUsed / studentsLimit) * 100));

  const facultyLimit = subscription?.limits?.maxFaculty || 100;
  const facultyUsed = currentMonthCharges?.facultyCharges?.count || 0;
  const facultyPercent = Math.min(100, Math.round((facultyUsed / facultyLimit) * 100));

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      <div>
        <Title className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Billing & Subscription</Title>
        <Text>Manage your Classgrid subscription, view invoices, and track payments.</Text>
      </div>

      {/* HISTORICAL USAGE CHART (TOP) - Matching User Snippet */}
      <Card className="sm:mx-auto sm:max-w-4xl">
        <h3 className="ml-1 mr-1 font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
          Month-over-Month Billing History
        </h3>
        <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-6">
          Your total billed amount across all platform resources over the last 6 months.
        </p>
        
        {chartData && chartData.length > 0 ? (
          <>
            <BarChart
              data={chartData}
              index="month"
              categories={
                showComparison ? ['This Month', 'Estimated with Tax'] : ['This Month']
              }
              colors={showComparison ? ['blue', 'cyan'] : ['blue']}
              valueFormatter={valueFormatter}
              yAxisWidth={65}
              className="mt-6 hidden h-72 sm:block"
            />
            <BarChart
              data={chartData}
              index="month"
              categories={
                showComparison ? ['This Month', 'Estimated with Tax'] : ['This Month']
              }
              colors={showComparison ? ['blue', 'cyan'] : ['blue']}
              valueFormatter={valueFormatter}
              showYAxis={false}
              className="mt-4 h-56 sm:hidden"
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-72 text-gray-500">
            No historical data available yet.
          </div>
        )}
        
        <Divider />
        <div className="mb-2 flex items-center space-x-3">
          <Switch
            id="comparison"
            checked={showComparison}
            onChange={() => setShowComparison(!showComparison)}
          />
          <label
            htmlFor="comparison"
            className="text-tremor-default text-tremor-content dark:text-dark-tremor-content"
          >
            Show Estimated 18% GST Projection
          </label>
        </div>
      </Card>

      {/* RESOURCES USED - PROGRESS CIRCLES */}
      <Card>
        <Title>Resource Usage</Title>
        <Text>Real-time limits and usage for your organization based on your current plan.</Text>
        <Grid numItems={2} numItemsSm={3} numItemsLg={5} className="gap-6 mt-6">
          <Flex flexDirection="col" className="text-center">
            <ProgressCircle value={storagePercent} radius={35} strokeWidth={6} color={storagePercent > 80 ? "red" : "emerald"}>
              <span className="text-sm font-medium">{storagePercent}%</span>
            </ProgressCircle>
            <Text className="mt-4 font-medium">Storage</Text>
            <Text className="text-xs text-gray-500">{storageUsed.toFixed(2)} GB / {storageLimit} GB</Text>
          </Flex>

          <Flex flexDirection="col" className="text-center">
            <ProgressCircle value={studentsPercent} radius={35} strokeWidth={6} color={studentsPercent > 80 ? "red" : "blue"}>
              <span className="text-sm font-medium">{studentsPercent}%</span>
            </ProgressCircle>
            <Text className="mt-4 font-medium">Students</Text>
            <Text className="text-xs text-gray-500">{studentsUsed} / {studentsLimit}</Text>
          </Flex>

          <Flex flexDirection="col" className="text-center">
            <ProgressCircle value={facultyPercent} radius={35} strokeWidth={6} color={facultyPercent > 80 ? "red" : "amber"}>
              <span className="text-sm font-medium">{facultyPercent}%</span>
            </ProgressCircle>
            <Text className="mt-4 font-medium">Faculty</Text>
            <Text className="text-xs text-gray-500">{facultyUsed} / {facultyLimit}</Text>
          </Flex>

          <Flex flexDirection="col" className="text-center">
            <ProgressCircle value={emailsUsed > 0 ? 100 : 0} radius={35} strokeWidth={6} color="purple">
              <span className="text-sm font-medium text-purple-600">{emailsUsed}</span>
            </ProgressCircle>
            <Text className="mt-4 font-medium">Emails Sent</Text>
            <Text className="text-xs text-gray-500">Pay-as-you-go</Text>
          </Flex>

          <Flex flexDirection="col" className="text-center">
            <ProgressCircle value={smsUsed > 0 ? 100 : 0} radius={35} strokeWidth={6} color="indigo">
              <span className="text-sm font-medium text-indigo-600">{smsUsed}</span>
            </ProgressCircle>
            <Text className="mt-4 font-medium">SMS Sent</Text>
            <Text className="text-xs text-gray-500">Pay-as-you-go</Text>
          </Flex>
        </Grid>
      </Card>

      {/* SETUP BILLING ACCOUNT */}
      <Card decoration="left" decorationColor="blue" className="bg-blue-50/50 dark:bg-blue-900/10">
        <Flex alignItems="start" className="gap-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex-1">
            <Title>Setup Billing Account</Title>
            <Text className="mt-1">
              Add a payment method to automatically pay your monthly SaaS invoices based on the resources used above. 
              We dynamically calculate your usage so you only pay for what you actually use.
            </Text>
            <div className="mt-4">
              <Button 
                icon={Plus} 
                onClick={() => setIsAddingBilling(true)}
                loading={isAddingBilling}
              >
                Add Payment Method
              </Button>
            </div>
          </div>
        </Flex>
      </Card>

      <Grid numItems={1} numItemsLg={3} className="gap-6">
        {/* PLAN CARD */}
        <Card className="lg:col-span-1 flex flex-col justify-between">
          <div>
            <Flex alignItems="center" className="mb-4">
              <Title>Current Plan</Title>
              <Badge color={subscription?.status === "active" ? "emerald" : "amber"} icon={ShieldCheck}>
                {subscription?.plan?.toUpperCase() || "NONE"}
              </Badge>
            </Flex>
            
            <div className="space-y-4">
              <Flex className="border-b border-gray-100 dark:border-gray-800 pb-2">
                <Text>Status</Text>
                <Text className="font-medium capitalize">{subscription?.status || "No active plan"}</Text>
              </Flex>
              <Flex className="border-b border-gray-100 dark:border-gray-800 pb-2">
                <Text>Billing State</Text>
                <Badge color={subscription?.isPaid ? "emerald" : "orange"}>
                  {subscription?.isPaid ? "Paid" : "Unpaid"}
                </Badge>
              </Flex>
              <Flex className="border-b border-gray-100 dark:border-gray-800 pb-2">
                <Text>Next Renewal</Text>
                <Text className="font-medium">
                  {subscription?.expiresAt ? format(new Date(subscription.expiresAt), "dd MMM yyyy") : "N/A"}
                </Text>
              </Flex>
            </div>
            
            <div className="mt-6">
              <Subtitle className="mb-2 text-sm font-semibold">Seat Limits</Subtitle>
              <div className="space-y-1 text-sm">
                <Flex><Text>Students</Text><Text>{subscription?.limits?.maxStudents || "Unlimited"}</Text></Flex>
                <Flex><Text>Faculty</Text><Text>{subscription?.limits?.maxFaculty || "Unlimited"}</Text></Flex>
                <Flex><Text>Dept Admins</Text><Text>{subscription?.limits?.maxDeptAdmins || "Unlimited"}</Text></Flex>
                <Flex><Text>Storage Limit</Text><Text>{subscription?.limits?.storageGb ? `${subscription.limits.storageGb} GB` : "Pay as you go"}</Text></Flex>
              </div>
            </div>
          </div>
          
          <Button variant="secondary" className="w-full mt-6">Change Plan</Button>
        </Card>

        {/* CURRENT MONTH ESTIMATE */}
        <Card className="lg:col-span-2">
          <Title>Current Month Accrued Charges</Title>
          <Text className="mb-6">Estimated charges for the current billing cycle. Finalized at month end.</Text>
          
          <div className="space-y-3">
            <Flex className="py-2 border-b border-gray-100 dark:border-gray-800">
              <Text className="font-medium text-gray-900 dark:text-gray-100">Classgrid Platform Fee</Text>
              <Text className="font-medium">₹{currentMonthCharges.platformFee.toLocaleString()}</Text>
            </Flex>
            
            {currentMonthCharges.studentCharges.count > 0 && (
              <Flex className="py-1">
                <Text>Students ({currentMonthCharges.studentCharges.count} × ₹{currentMonthCharges.studentCharges.rate})</Text>
                <Text>₹{currentMonthCharges.studentCharges.total.toLocaleString()}</Text>
              </Flex>
            )}
            
            {currentMonthCharges.facultyCharges.count > 0 && (
              <Flex className="py-1">
                <Text>Faculty ({currentMonthCharges.facultyCharges.count} × ₹{currentMonthCharges.facultyCharges.rate})</Text>
                <Text>₹{currentMonthCharges.facultyCharges.total.toLocaleString()}</Text>
              </Flex>
            )}

            {currentMonthCharges.deptAdminCharges.count > 0 && (
              <Flex className="py-1">
                <Text>Dept Admins ({currentMonthCharges.deptAdminCharges.count} × ₹{currentMonthCharges.deptAdminCharges.rate})</Text>
                <Text>₹{currentMonthCharges.deptAdminCharges.total.toLocaleString()}</Text>
              </Flex>
            )}

            {currentMonthCharges.emailCharges.count > 0 && (
              <Flex className="py-1">
                <Text>Emails ({currentMonthCharges.emailCharges.count} × ₹{currentMonthCharges.emailCharges.rate})</Text>
                <Text>₹{currentMonthCharges.emailCharges.total.toLocaleString()}</Text>
              </Flex>
            )}
            
            {currentMonthCharges.smsCharges?.count ? (
              <Flex className="py-1">
                <Text>SMS ({currentMonthCharges.smsCharges.count} × ₹{currentMonthCharges.smsCharges.rate})</Text>
                <Text>₹{currentMonthCharges.smsCharges.total.toLocaleString()}</Text>
              </Flex>
            ) : null}

            {currentMonthCharges.storageCharges?.count ? (
              <Flex className="py-1">
                <Text>Storage ({currentMonthCharges.storageCharges.count} GB × ₹{currentMonthCharges.storageCharges.rate})</Text>
                <Text>₹{currentMonthCharges.storageCharges.total.toLocaleString()}</Text>
              </Flex>
            ) : null}
            
            <Divider />
            
            <Flex className="py-1">
              <Text>Subtotal</Text>
              <Text>₹{currentMonthCharges.subtotal.toLocaleString()}</Text>
            </Flex>
            <Flex className="py-1">
              <Text>GST ({currentMonthCharges.gstPercent}%)</Text>
              <Text>₹{currentMonthCharges.gstAmount.toLocaleString()}</Text>
            </Flex>
            <Flex className="py-2 mt-2 bg-gray-50 dark:bg-gray-800/50 rounded px-3">
              <Text className="font-semibold text-gray-900 dark:text-white">Estimated Total</Text>
              <Text className="font-bold text-lg text-gray-900 dark:text-white">₹{currentMonthCharges.total.toLocaleString()}</Text>
            </Flex>
          </div>
        </Card>
      </Grid>

      {/* FEE COLLECTION SUMMARY */}
      <Card decoration="top" decorationColor="emerald">
        <Title>Student Fee Collection</Title>
        <Text>Overview of fees collected by your organization from students.</Text>
        <Grid numItems={2} numItemsSm={4} className="gap-4 mt-6">
          <div>
            <Text>Total Billed</Text>
            <Metric className="text-xl mt-1">₹{feeCollection.totalBilled.toLocaleString()}</Metric>
          </div>
          <div>
            <Text>Total Collected</Text>
            <Metric className="text-xl mt-1 text-emerald-600">₹{feeCollection.totalPaid.toLocaleString()}</Metric>
          </div>
          <div>
            <Text>Outstanding</Text>
            <Metric className="text-xl mt-1 text-amber-600">₹{feeCollection.outstanding.toLocaleString()}</Metric>
          </div>
          <div>
            <Text>Invoices</Text>
            <Metric className="text-xl mt-1">{feeCollection.totalInvoices}</Metric>
          </div>
        </Grid>
      </Card>

      {/* INVOICE HISTORY */}
      <Card>
        <Flex className="mb-4">
          <Title>Invoice History</Title>
        </Flex>
        {invoices.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Invoice #</TableHeaderCell>
                <TableHeaderCell>Billing Period</TableHeaderCell>
                <TableHeaderCell>Due Date</TableHeaderCell>
                <TableHeaderCell>Amount</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                  <TableCell>{inv.billingPeriod?.month} {inv.billingPeriod?.year}</TableCell>
                  <TableCell>{format(new Date(inv.dueDate), "dd MMM yyyy")}</TableCell>
                  <TableCell>₹{inv.totalAmountInr?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge color={inv.status === "paid" ? "emerald" : inv.status === "overdue" ? "red" : "orange"}>
                      {inv.status?.toUpperCase() || "UNPAID"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="xs" variant="secondary" icon={Download}>PDF</Button>
                    {inv.status !== "paid" && (
                      <Button 
                        size="xs" 
                        color="emerald" 
                        icon={CreditCard}
                        loading={payingInvoiceId === inv.id}
                        onClick={() => handlePayNow(inv.id)}
                      >
                        Pay Now
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10 text-gray-500">
            No invoices generated yet.
          </div>
        )}
      </Card>
      
    </div>
  );
}
