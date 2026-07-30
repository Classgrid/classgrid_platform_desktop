import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/marketing_ui/card';
import { Button } from '@/components/marketing_ui/button';

interface BillingPermissionGuardProps {
  children: React.ReactNode;
  userRole?: string; 
}

export const BillingPermissionGuard: React.FC<BillingPermissionGuardProps> = ({ children, userRole }) => {
  // In a real app, this role would be pulled from a Redux store or Auth Context.
  const isAuthorized = userRole === 'SUPER_ADMIN' || userRole === 'BILLING_ADMIN';

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="w-full max-w-md shadow-lg border-red-200">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <ShieldAlert className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-sm text-gray-500 mb-6">
              You do not have the required permissions to view the Billing Command Center. 
              Only Super Administrators and Billing Administrators can access this area.
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
