import React from "react";
import { CheckCircle, AlertTriangle, CalendarX2, UserX } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { DataTable } from "@/components/marketing_ui/data-table";

const attendanceColumns = [
  { accessorKey: "student", header: "Student" },
  { accessorKey: "course", header: "Course" },
  { accessorKey: "attendance", header: "Attendance %" },
  { accessorKey: "status", header: "Status" },
];

const attendanceData = [
  { id: "1", student: "Karan Desai", course: "B.Tech CS", attendance: "65%", status: "Defaulter" },
  { id: "2", student: "Meera Nair", course: "MBA", attendance: "72%", status: "Warning" },
  { id: "3", student: "Rahul Verma", course: "B.Sc Physics", attendance: "98%", status: "Good" },
];

export function AttendanceDashboardPage() {
  return (
    <DashboardLayout role="ATTENDANCE_MENU">
      <PageHeader 
        title="Attendance Overview" 
        description="Monitor campus-wide attendance and defaulters." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        
        
        
        
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Watchlist</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={attendanceColumns} data={attendanceData} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
