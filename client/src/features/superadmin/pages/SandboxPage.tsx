/*
 * =========================================================================================
 * 🚨 CRITICAL AI & SYSTEM RULE 🚨
 * NO FRONTEND GITHUB ACTIONS: NEVER create yaml files that build/deploy the frontend to EC2.
 * The frontend is hosted 100% on Vercel. EC2 is only for the backend.
 * =========================================================================================
 */

/**
 * ==============================================================================
 * 🚨 AI AGENT WARNING: BREADCRUMB POLICY 🚨
 * ==============================================================================
 * NEVER hardcode "Super Admin Dashboard /" as a breadcrumb on any deep dive page.
 * Deep dive pages or sub-pages MUST accurately reflect the actual parent pages 
 * they were opened from (e.g., Organizations / [Name] / Configuration / ...).
 * DO NOT use generic dashboard text for breadcrumbs.
 * ==============================================================================
 */

/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { GlobalAiConfigPanel } from "@/features/superadmin/components/GlobalAiConfigPanel";
import { AiUsageBar } from "@/components/ai/components/AiUsageBar";
import { SetupUsageCredits } from "@/features/superadmin/components/SetupUsageCredits";
import { ResetOrganizationDailyLimit } from "@/features/superadmin/components/ResetOrganizationDailyLimit";
import { BlockOrganizationAiUsage } from "@/features/superadmin/components/BlockOrganizationAiUsage";
import { EditOrganizationDailyLimit } from "@/features/superadmin/components/EditOrganizationDailyLimit";
import { SuperadminFilterBar } from "@/features/superadmin/components/SuperadminFilterBar";
import { GrantCreditsModal } from "@/features/superadmin/components/GrantCredits";
import { Button } from "@/components/marketing_ui/button";

export function SandboxPage() {
  const [showGrantModal, setShowGrantModal] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background p-8 space-y-12">
      <div className="max-w-4xl mx-auto space-y-12 pb-24">
        
        <div>
          <h2 className="text-2xl font-bold mb-4">Superadmin Filter Bar</h2>
          <SuperadminFilterBar />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Global AI Config Panel</h2>
          <GlobalAiConfigPanel />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">AI Usage Bar</h2>
          <AiUsageBar 
             initialData={{
                type: 'pro',
                used: 25000,
                limit: 100000,
                remaining: 75000,
                freeData: {
                   used: 5000,
                   limit: 10000,
                   remaining: 5000
                }
             }} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Setup Usage Credits</h2>
            <SetupUsageCredits orgId="dummy-org" orgName="Dummy Org" currentPoolLimit={100000} currentUserWeeklyLimit={5000} />
          </div>
          
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Reset Organization Daily Limit</h2>
              <ResetOrganizationDailyLimit orgId="dummy-org" orgName="Dummy Org" />
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4">Edit Organization Daily Limit</h2>
              <EditOrganizationDailyLimit orgId="dummy-org" orgName="Dummy Org" currentPoolLimit={100000} currentUserWeeklyLimit={5000} />
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4">Block Organization AI Usage</h2>
              <BlockOrganizationAiUsage orgId="dummy-org" orgName="Dummy Org" isBlocked={false} />
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4">Grant Credits Modal</h2>
              <Button onClick={() => setShowGrantModal(true)}>Open Grant Credits Modal</Button>
              <GrantCreditsModal 
                isOpen={showGrantModal} 
                onClose={() => setShowGrantModal(false)} 
                users={[{ id: "1", name: "User 1", email: "user1@test.com", role: "Student" }]}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
