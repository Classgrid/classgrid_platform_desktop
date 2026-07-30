import React from 'react';
import { Button } from '@/components/marketing_ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/marketing_ui/dropdown-menu';
import { Card, CardContent } from '@/components/marketing_ui/card';
import { ButtonGroup } from '@/components/marketing_ui/button-group';
import { Badge } from '@/components/marketing_ui/badge';
import { Columns, Download, Archive, Trash2, Mail } from 'lucide-react';
import { toast } from 'sonner';

// 1. ColumnVisibilityMenu
export const ColumnVisibilityMenu: React.FC<{
  columns: { id: string; label: string; isVisible: boolean }[];
  onToggle: (id: string) => void;
}> = ({ columns, onToggle }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex">
          <Columns className="mr-2 h-4 w-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="capitalize"
            checked={column.isVisible}
            onCheckedChange={() => onToggle(column.id)}
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// 2. BillingExportMenu
export const BillingExportMenu: React.FC<{
  onExport: (format: 'csv' | 'pdf' | 'excel') => Promise<void>;
}> = ({ onExport }) => {
  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    toast.promise(onExport(format), {
      loading: 'Generating export...',
      success: `Exported successfully as ${format.toUpperCase()}`,
      error: 'Failed to generate export',
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>Export as Excel</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>Export as PDF</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// 3. BulkActionToolbar
export const BulkActionToolbar: React.FC<{
  selectedCount: number;
  onAction: (action: 'archive' | 'delete' | 'email') => void;
}> = ({ selectedCount, onAction }) => {
  if (selectedCount === 0) return null;

  return (
    <Card className="bg-primary/5 border-primary/20 shadow-sm mb-4">
      <CardContent className="p-3 flex items-center justify-between">
        <span className="text-sm font-medium text-primary">
          {selectedCount} item(s) selected
        </span>
        <ButtonGroup>
          <Button variant="outline" size="sm" onClick={() => onAction('email')}>
            <Mail className="mr-2 h-4 w-4" /> Message
          </Button>
          <Button variant="outline" size="sm" onClick={() => onAction('archive')}>
            <Archive className="mr-2 h-4 w-4" /> Archive
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onAction('delete')}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </ButtonGroup>
      </CardContent>
    </Card>
  );
};

// 4. BillingAuditTimeline
export const BillingAuditTimeline: React.FC<{
  events: { id: string; timestamp: Date; user: string; action: string; details?: string; status: 'success' | 'warning' | 'error' }[];
}> = ({ events }) => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">Audit Trail</h3>
      <div className="space-y-4 border-l pl-4">
        {events.map((event) => (
          <div key={event.id} className="relative">
            <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
            <div className="flex items-center gap-2">
              <span className="font-medium">{event.action}</span>
              <Badge variant={event.status === 'error' ? 'destructive' : event.status === 'warning' ? 'secondary' : 'default'}>
                {event.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{event.details || `Performed by ${event.user}`}</p>
            <time className="text-xs text-muted-foreground">{event.timestamp.toLocaleString()}</time>
          </div>
        ))}
      </div>
    </div>
  );
};

export { BillingEmptyState } from './BillingLayoutComponents';
