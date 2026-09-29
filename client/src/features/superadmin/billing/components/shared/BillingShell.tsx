import React from 'react';
import { Outlet } from 'react-router-dom';

export const BillingShell = () => {
  return (
    <div className="min-h-full bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full h-full space-y-6">
        <div className="min-h-[600px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
