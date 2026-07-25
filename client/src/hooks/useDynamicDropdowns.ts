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
