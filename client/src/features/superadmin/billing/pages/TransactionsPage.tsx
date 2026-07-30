import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/marketing_ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../../components/marketing_ui/select';
import { Input } from '../../../../components/marketing_ui/input';
import { TransactionTable, TransactionDetailDrawer } from '../components/finance/TransactionComponents';

const TransactionsPage = () => {
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const filters = {
    type: filterType !== 'ALL' ? filterType : undefined,
    search: searchQuery,
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="flex justify-between items-center p-6 border-b border-border bg-card">
        <h2 className="text-xl font-semibold tracking-tight">All Network Transactions</h2>
        <div className="flex gap-2 items-center">
          <Select value={filterType} onValueChange={(value) => value && setFilterType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Flows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Flows</SelectItem>
              <SelectItem value="CLASSGRID_SUBSCRIPTION">Classgrid Subscriptions</SelectItem>
              <SelectItem value="INSTITUTION_FEE">Institution Payments</SelectItem>
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
          <CardContent className="p-0">
             <TransactionTable 
               filters={filters} 
               onViewDetail={setSelectedTxId} 
             />
          </CardContent>
        </Card>
      </div>

      {selectedTxId && (
        <TransactionDetailDrawer 
          isOpen={!!selectedTxId} 
          onClose={() => setSelectedTxId(null)} 
          txId={selectedTxId} 
        />
      )}
    </div>
  );
};

export default TransactionsPage;
