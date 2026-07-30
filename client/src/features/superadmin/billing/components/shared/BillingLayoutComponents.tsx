import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/marketing_ui/card';
import { Button } from '@/components/marketing_ui/button';
import { Input } from '@/components/marketing_ui/input';
import { Search, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchBillingPermissions } from '../../../services/superAdminBillingApi';

export const useBillingPermissions = () => {
  return useQuery({
    queryKey: ['billing-permissions'],
    queryFn: fetchBillingPermissions,
  });
};

// 29. BillingShell
export const BillingShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-background text-foreground flex-col w-full">
      <main className="flex-1 overflow-auto bg-muted/20">
        {children}
      </main>
    </div>
  );
};

// 30. BillingPermissionGuard
export const BillingPermissionGuard: React.FC<{
  requiredAction: string;
  children: React.ReactNode;
}> = ({ requiredAction, children }) => {
  const { data: permissions, isLoading } = useBillingPermissions();

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse text-muted-foreground">Checking permissions...</div>;
  }

  // Assuming permissions array contains allowed actions
  const hasAccess = permissions?.includes('SUPER_ADMIN') || permissions?.includes(requiredAction);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border rounded-md bg-muted/50 p-6">
        <Lock className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-foreground">Access Restricted</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mt-2">
          You do not have the necessary permissions ({requiredAction}) to view this billing module.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

// 31. BillingPageHeader
export const BillingPageHeader: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
};

// 32. BillingSearchInput
export const BillingSearchInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = 'Search...' }) => {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 bg-background"
      />
    </div>
  );
};

// 33. BillingEmptyState
export const BillingEmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border rounded-lg bg-card border-dashed">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
        {description}
      </p>
      {action}
    </div>
  );
};
