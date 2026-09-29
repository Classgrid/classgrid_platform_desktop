import React from 'react';
import { Outlet } from 'react-router-dom';

export const BillingShell = () => {
  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="min-h-[600px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
