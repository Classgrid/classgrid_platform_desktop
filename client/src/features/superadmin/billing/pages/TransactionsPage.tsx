import React, { useState } from 'react';
import { useTransactions } from '../hooks/useBillingFinance';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/marketing_ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../../components/marketing_ui/table';
import { Badge } from '../../../../components/marketing_ui/badge';
import { Spinner } from '../../../../components/marketing_ui/spinner';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../../components/marketing_ui/select';
import { Input } from '../../../../components/marketing_ui/input'; // Assuming marketing_ui input

const TransactionsPage = () => {
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: transactions, isLoading } = useTransactions({
    type: filterType !== 'ALL' ? filterType : undefined,
    search: searchQuery,
  });

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="flex justify-between items-center p-6 border-b border-border bg-card">
        <h2 className="text-xl font-semibold tracking-tight">All Network Transactions</h2>
        <div className="flex gap-2 items-center">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Flows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Flows</SelectItem>
              <SelectItem value="CLASSGRID_SUBSCRIPTION">Classgrid Subscriptions</SelectItem>
              <SelectItem value="STUDENT_FEE">Student Fees</SelectItem>
              <SelectItem value="REFUND">Refunds</SelectItem>
            </SelectContent>
          </Select>
          <Input 
            type="text" 
            placeholder="Search Txn ID..." 
            className="w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="p-6 space-y-6">
        <p className="text-sm text-muted-foreground">
          This table displays all transactions across the platform, including student-to-institution payments.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Transactions Log</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-6"><Spinner /></div>
            ) : transactions?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Txn ID</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Flow</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn: any) => (
                    <TableRow key={txn._id}>
                      <TableCell>{new Date(txn.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {txn.gatewayTransactionId || txn._id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {txn.organizationId?.name || 'Unknown Org'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {txn.paymentFlow?.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{(txn.amountPaise || 0) / 100}
                      </TableCell>
                      <TableCell>
                        <Badge variant={txn.status === 'CAPTURED' ? 'default' : 'secondary'}>
                          {txn.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center p-6 border rounded-lg bg-muted/50 text-muted-foreground text-sm">
                No transactions match your search.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TransactionsPage;
