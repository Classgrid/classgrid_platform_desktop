import React from "react";
import { FileEdit, CheckSquare, Clock, GraduationCap } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { DataTable } from "@/components/marketing_ui/data-table";

const examColumns = [
  { accessorKey: "exam", header: "Exam Name" },
  { accessorKey: "subject", header: "Subject" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "date", header: "Date" },
];

const examData = [
  { id: "1", exam: "Mid-Term", subject: "Physics", status: "Ongoing", date: "Today" },
  { id: "2", exam: "Unit Test 1", subject: "Mathematics", status: "Grading", date: "Yesterday" },
  { id: "3", exam: "Finals", subject: "Chemistry", status: "Scheduled", date: "Next Week" },
];

export function ExamsDashboardPage() {
  return (
    <DashboardLayout role="EXAMS_MENU">
      <PageHeader 
        title="Examinations Overview" 
        description="Manage exams, grading, and results." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        
        
        
        
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming & Active Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={examColumns} data={examData} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
