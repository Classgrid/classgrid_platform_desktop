import React from "react";
import { IndianRupee, AlertTriangle, TrendingUp, Receipt } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { DataTable } from "@/components/marketing_ui/data-table";

const txColumns = [
  { accessorKey: "student", header: "Student" },
  { accessorKey: "amount", header: "Amount" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "date", header: "Date" },
];

const txData = [
  { id: "1", student: "Karan Desai", amount: "₹45,000", status: "Success", date: "Today" },
  { id: "2", student: "Meera Nair", amount: "₹12,500", status: "Failed", date: "Yesterday" },
  { id: "3", student: "Rahul Verma", amount: "₹85,000", status: "Success", date: "2 days ago" },
];

export function FeesDashboardPage() {
  return (
    <DashboardLayout role="FEES_MENU">
      <PageHeader 
        title="Fees Overview" 
        description="Track payments, dues, and financial reports." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        
        
        
        
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={txColumns} data={txData} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
