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

import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { DashboardLayout, DashboardRole } from './DashboardLayout';
import { useCurrentUser } from '@/features/auth/queries/useCurrentUser';
import { DomainEnforcer } from '@/components/DomainEnforcer';

export function DynamicRoleLayout() {
  const { data: user, isLoading } = useCurrentUser();
  
  if (isLoading) return null;
  
  if (!user) return <Navigate to="/login" replace />;
  
  const role = (user.role as DashboardRole) || "student";
  
  return (
    <DomainEnforcer 
      allowClassgridUrl={(user.organization?.erp_domain?.allow_classgrid_url ?? user.organization?.custom_domain?.allow_classgrid_url) !== false}
      isCustomDomainEnabled={(user.organization?.erp_domain?.is_enabled ?? user.organization?.custom_domain?.is_enabled) !== false}
      customDomain={
        (user.organization?.erp_domain?.status === "active" || user.organization?.erp_domain?.status === "verified") 
          ? user.organization?.erp_domain?.domain 
          : (user.organization?.custom_domain?.status === "active" ? user.organization?.custom_domain?.domain : null)
      }
    >
      <DashboardLayout role={role} user={user}>
        <Outlet />
      </DashboardLayout>
    </DomainEnforcer>
  );
}
