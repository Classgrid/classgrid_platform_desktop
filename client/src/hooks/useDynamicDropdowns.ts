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

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

export function useDynamicDropdowns(organizationType: string, roleCategory: string, department: string) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingDesignations, setIsLoadingDesignations] = useState(false);

  useEffect(() => {
    if (!organizationType || !roleCategory) {
      setDepartments([]);
      return;
    }
    const fetchDepartments = async () => {
      setIsLoadingDepartments(true);
      try {
        const res = await apiClient.get('/api/dropdowns', {
          params: { type: 'DEPARTMENT', organization_type: organizationType, role_category: roleCategory }
        });
        setDepartments(res.data.options || []);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      } finally {
        setIsLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, [organizationType, roleCategory]);

  useEffect(() => {
    if (!department) {
      setDesignations([]);
      return;
    }
    const fetchDesignations = async () => {
      setIsLoadingDesignations(true);
      try {
        const res = await apiClient.get('/api/dropdowns', {
          params: { type: 'DESIGNATION', organization_type: organizationType, role_category: roleCategory }
        });
        setDesignations(res.data.options || []);
      } catch (err) {
        console.error("Failed to fetch designations", err);
      } finally {
        setIsLoadingDesignations(false);
      }
    };
    fetchDesignations();
  }, [organizationType, roleCategory, department]);

  return { departments, designations, isLoadingDepartments, isLoadingDesignations };
}
