import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// If UI table isn't found, fallback to simple HTML table styled with Tailwind
const dummyData = [
  { id: "T-1001", name: "Rahul Sharma", email: "rahul@example.com", orgType: "College", status: "Open", date: "Jul 25, 2026" },
  { id: "T-1002", name: "Priya Patel", email: "priya@example.com", orgType: "School", status: "Resolved", date: "Jul 24, 2026" },
  { id: "T-1003", name: "Amit Kumar", email: "amit@example.com", orgType: "Coaching", status: "In Progress", date: "Jul 23, 2026" },
  { id: "T-1004", name: "Neha Singh", email: "neha@example.com", orgType: "School", status: "Closed", date: "Jul 22, 2026" },
  { id: "T-1005", name: "Vikram Reddy", email: "vikram@example.com", orgType: "College", status: "Open", date: "Jul 21, 2026" },
];

export function SandboxPage() {
  return (
    <div className="min-h-screen p-8 lg:p-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Data Table Sandbox</h1>
      
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-medium">Ticket ID</th>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Org Type</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {dummyData.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{row.id}</td>
                <td className="px-6 py-4 text-foreground">{row.name}</td>
                <td className="px-6 py-4 text-muted-foreground">{row.email}</td>
                <td className="px-6 py-4 text-muted-foreground">{row.orgType}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    row.status === 'Open' ? 'bg-blue-500/10 text-blue-500' :
                    row.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500' :
                    row.status === 'In Progress' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-slate-500/10 text-slate-500'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-muted-foreground">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
