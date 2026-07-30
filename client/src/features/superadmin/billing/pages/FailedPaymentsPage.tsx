import React, { useState } from 'react';
import { useFailedPaymentsList, useFailureOverview } from '../hooks/useBillingFailures';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/marketing_ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../../components/marketing_ui/table';
import { Badge } from '../../../../components/marketing_ui/badge';
import { Button } from '../../../../components/marketing_ui/button';
import { Spinner } from '../../../../components/marketing_ui/spinner';
import { AlertCircle, IndianRupee, Building2 } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../../components/marketing_ui/select';

const FailedPaymentsPage = () => {
  const [filterType, setFilterType] = useState('ALL');
  
  const { data: overview, isLoading: overviewLoading } = useFailureOverview();
  const { data: failures, isLoading: failuresLoading } = useFailedPaymentsList();

  const filteredFailures = filterType === 'ALL' 
    ? failures 
    : failures?.filter((f: any) => filterType === 'RESOLVED' ? f.resolved : !f.resolved);

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="flex justify-between items-center p-6 border-b border-border bg-card">
        <h2 className="text-xl font-semibold tracking-tight">Failed Payments Triage</h2>
        <div className="flex gap-2 items-center">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Failures" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Failures</SelectItem>
              <SelectItem value="UNRESOLVED">Unresolved</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="default">
            Generate Recovery Link
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <p className="text-sm text-muted-foreground">
          Triage and recover failed payment attempts. Never automatically retry a charge; generate a new secure checkout link instead.
        </p>



        {/* Log Table */}
        <Card>
          <CardHeader>
            <CardTitle>Failed Transaction Log</CardTitle>
            <p className="text-sm text-muted-foreground">All failed or incomplete platform subscription payments.</p>
          </CardHeader>
          <CardContent>
            {failuresLoading ? (
              <div className="flex justify-center p-6"><Spinner /></div>
            ) : filteredFailures?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Flow</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFailures.map((failure: any) => (
                    <TableRow key={failure._id}>
                      <TableCell>{new Date(failure.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{failure.organizationId?.name || 'Unknown Org'}</TableCell>
                      <TableCell className="text-muted-foreground">SaaS Subscription</TableCell>
                      <TableCell className="text-destructive font-medium">{failure.errorCode || 'UNKNOWN_ERROR'}</TableCell>
                      <TableCell className="text-right">₹{(failure.amountPaise || 0) / 100}</TableCell>
                      <TableCell>
                        <Badge variant={failure.resolved ? "secondary" : "destructive"}>
                          {failure.resolved ? 'Resolved' : 'Unresolved'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center p-6 border rounded-lg bg-muted/50 text-muted-foreground text-sm">
                No failures found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FailedPaymentsPage;
