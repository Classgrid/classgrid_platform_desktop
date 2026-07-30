import React from "react";
import { Users, FileText, CheckCircle, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { DataTable } from "@/components/marketing_ui/data-table";

const applicationsColumns = [
  { accessorKey: "name", header: "Applicant" },
  { accessorKey: "course", header: "Course" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "date", header: "Date" },
];

const applicationsData = [
  { id: "1", name: "Rohan Patel", course: "B.Tech CS", status: "Review", date: "Today" },
  { id: "2", name: "Aditi Sharma", course: "MBA", status: "Interview", date: "Yesterday" },
  { id: "3", name: "Suresh Kumar", course: "B.Sc Physics", status: "Rejected", date: "2 days ago" },
];

export function AdmissionsDashboardPage() {
  return (
    <DashboardLayout role="ADMISSION_MENU">
      <PageHeader 
        title="Admissions Overview" 
        description="Monitor and manage new student applications." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        
        
        
        
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={applicationsColumns} data={applicationsData} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
