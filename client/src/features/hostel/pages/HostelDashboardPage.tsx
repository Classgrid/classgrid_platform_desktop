import React from "react";
import { Users, BedDouble, FileKey, AlertCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { DataTable } from "@/components/marketing_ui/data-table";

const hostelColumns = [
  { accessorKey: "student", header: "Student" },
  { accessorKey: "room", header: "Room No." },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "contact", header: "Contact" },
];

const hostelData = [
  { id: "1", student: "Aarav Patel", room: "A-101", status: "Present", contact: "+91 9876543210" },
  { id: "2", student: "Riya Sharma", room: "B-205", status: "On Leave", contact: "+91 9876543211" },
  { id: "3", student: "Dev Kumar", room: "A-302", status: "Present", contact: "+91 9876543212" },
];

export function HostelDashboardPage() {
  return (
    <DashboardLayout role="HOSTEL_MENU">
      <PageHeader 
        title="Hostel Overview" 
        description="Manage residents, rooms, and daily operations." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        
        
        
        
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resident Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={hostelColumns} data={hostelData} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
