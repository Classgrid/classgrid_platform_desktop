import React from "react";
import { Users, UserX, Briefcase, FileSignature } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { DataTable } from "@/components/marketing_ui/data-table";

const hrColumns = [
  { accessorKey: "employee", header: "Employee" },
  { accessorKey: "department", header: "Department" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "status", header: "Status" },
];

const hrData = [
  { id: "1", employee: "Dr. A. K. Singh", department: "Computer Science", role: "HOD", status: "Active" },
  { id: "2", employee: "Mrs. S. Gupta", department: "Administration", role: "Clerk", status: "On Leave" },
  { id: "3", employee: "Mr. R. Kumar", department: "Maintenance", role: "Staff", status: "Active" },
];

export function HrDashboardPage() {
  return (
    <DashboardLayout role="HR_MENU">
      <PageHeader 
        title="HR & Payroll Overview" 
        description="Manage employees, leaves, and recruitment." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        
        
        
        
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Staff Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={hrColumns} data={hrData} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
