/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/marketing_ui/table";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { cn } from "@/lib/utils";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

type Column = { key: string; header: string; width?: string; accent?: boolean; render?: (value: any, row: any) => React.ReactNode };
type DataTableProps = {
  columns: Column[];
  rows: any[];
  isLoading?: boolean;
  skeletonLines?: number;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  className?: string;
};

export function DataTable({ columns, rows, isLoading, skeletonLines = 5, emptyMessage, onRowClick, className }: DataTableProps) {
  if (isLoading) {
    return (
      <div className={`space-y-3 ${className || ""}`}>
        {Array.from({ length: skeletonLines }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className={`p-8 text-center text-sm text-muted-foreground border border-border rounded-lg bg-card ${className || ""}`}>
        {emptyMessage || "No data available."}
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border bg-card overflow-hidden", className)}>
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.key} className={c.width}>{c.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {rows.map((row, i) => {
              const uniqueKey = row.id || row._id || row.email || i;
              return (
                <motion.tr
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={uniqueKey} 
                  onClick={() => onRowClick?.(row)} 
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted", 
                    onRowClick ? "cursor-pointer" : ""
                  )}
                >
                  {columns.map((c) => (
                    <TableCell key={c.key} className={c.accent ? "font-medium" : ""}>
                      {c.render ? c.render(row[c.key], row) : row[c.key]}
                    </TableCell>
                  ))}
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}

export const RecentActivityTable = DataTable;