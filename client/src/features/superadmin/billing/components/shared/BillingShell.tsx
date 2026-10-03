// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
import React from 'react';
import { Outlet } from 'react-router-dom';

export const BillingShell = () => {
  return (
    <div className="min-h-full bg-background">
      <div className="w-full h-full space-y-6">
        <div className="min-h-[600px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
