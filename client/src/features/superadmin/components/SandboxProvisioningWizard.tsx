import React, { useState } from "react";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsApi } from "../services/superAdminApi";
import { toast } from "sonner";
import { Building2, User, LayoutDashboard, ToggleRight, CheckCircle2 } from "lucide-react";

export function SandboxProvisioningWizard({ 
  lead, 
  onClose, 
  onSuccess 
}: { 
  lead: any; 
  onClose: () => void; 
  onSuccess: (data: any) => void;
}) {
  const [step, setStep] = useState(1);
  const qc = useQueryClient();

  // Step 1: Admin Details
  const [adminName, setAdminName] = useState(lead.adminName || "");
  const [adminEmail, setAdminEmail] = useState(lead.adminEmail || "");
  const [adminPhone, setAdminPhone] = useState(lead.adminPhone || "");
  const [role, setRole] = useState(lead.role || "Administrator");

  // Step 2: Institution Details
  const [institutionName, setInstitutionName] = useState(lead.institutionName || "");
  const [orgType, setOrgType] = useState(lead.orgType || "school");
  const [city, setCity] = useState(lead.city || lead.cityVillage || "");
  const [state, setState] = useState(lead.state || "");
  const [studentCount, setStudentCount] = useState(lead.studentCount || 100);

  // Step 3: Dashboards
  const [allocatedDashboards, setAllocatedDashboards] = useState<string[]>(
    lead.allocatedDashboards || ["dashboard_admission", "dashboard_fees", "dashboard_student", "dashboard_faculty"]
  );

  const availableDashboards = [
    { id: "dashboard_admission", label: "Admissions Dashboard" },
    { id: "dashboard_fees", label: "Fees Dashboard" },
    { id: "dashboard_exam", label: "Exams Dashboard" },
    { id: "dashboard_attendance", label: "Attendance Dashboard" },
    { id: "dashboard_library", label: "Library Dashboard" },
    { id: "dashboard_hr", label: "HR Dashboard" },
    { id: "dashboard_hostel", label: "Hostel Dashboard" },
    { id: "dashboard_faculty", label: "Faculty Dashboard" },
    { id: "dashboard_student", label: "Student Dashboard" },
  ];

  // Step 4: Modules / Features
  const [features, setFeatures] = useState<Record<string, boolean>>({
    ai_assistant: false,
    canteen_module: false,
    transport_tracking: false,
    custom_domain: false,
  });

  const toggleFeature = (key: string) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDashboard = (id: string) => {
    setAllocatedDashboards(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  // Mutations
  const updateAdminMutation = useMutation({
    mutationFn: () => leadsApi.updateAdminDetails(lead._id, { adminName, adminEmail, adminPhone, role }),
    onSuccess: () => setStep(2),
    onError: (err: any) => toast.error(err.message || "Failed to update admin details")
  });

  const updateInstMutation = useMutation({
    mutationFn: () => leadsApi.updateInstitutionDetails(lead._id, { institutionName, orgType, city, state, studentCount }),
    onSuccess: () => setStep(3),
    onError: (err: any) => toast.error(err.message || "Failed to update institution details")
  });

  const updateDashboardsMutation = useMutation({
    mutationFn: () => leadsApi.allocateDashboards(lead._id, { allocatedDashboards }),
    onSuccess: () => setStep(4),
    onError: (err: any) => toast.error(err.message || "Failed to update dashboards")
  });

  const provisionMutation = useMutation({
    mutationFn: () => leadsApi.approve(lead._id, { 
      plan: "sandbox", 
      mode: "sandbox", 
      feature_flags: features 
    }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["super-admin", "leads"] });
      onSuccess(data);
    },
    onError: (err: any) => toast.error(err.message || "Failed to provision sandbox")
  });

  const handleNext = () => {
    if (step === 1) updateAdminMutation.mutate();
    else if (step === 2) updateInstMutation.mutate();
    else if (step === 3) updateDashboardsMutation.mutate();
    else if (step === 4) setStep(5);
    else if (step === 5) provisionMutation.mutate();
  };

  const renderStepIcon = (num: number, icon: any, label: string) => (
    <div className={`flex flex-col items-center justify-center space-y-1 ${step === num ? "text-primary" : step > num ? "text-emerald-500" : "text-muted-foreground opacity-50"}`}>
      <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${step === num ? "border-primary bg-primary/10" : step > num ? "border-emerald-500 bg-emerald-500/10" : "border-muted-foreground"}`}>
        {step > num ? <CheckCircle2 size={18} /> : React.createElement(icon, { size: 18 })}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b bg-muted/20">
          <h2 className="text-2xl font-bold">Sandbox Provisioning Wizard</h2>
          <p className="text-muted-foreground text-sm mt-1">Configure and create a 31-day Sandbox for {lead.institutionName}</p>
          
          <div className="flex justify-between items-center mt-6 px-4 relative">
            <div className="absolute left-8 right-8 top-5 h-0.5 bg-border -z-10" />
            {renderStepIcon(1, User, "Admin")}
            {renderStepIcon(2, Building2, "Institution")}
            {renderStepIcon(3, LayoutDashboard, "Dashboards")}
            {renderStepIcon(4, ToggleRight, "Modules")}
            {renderStepIcon(5, CheckCircle2, "Review")}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <h3 className="font-semibold text-lg border-b pb-2">Step 1: Verify Admin Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Admin Name</label>
                  <Input value={adminName} onChange={e => setAdminName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <Input value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input value={adminPhone} onChange={e => setAdminPhone(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Role / Designation</label>
                  <Input value={role} onChange={e => setRole(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <h3 className="font-semibold text-lg border-b pb-2">Step 2: Verify Institution Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Institution Name</label>
                  <Input value={institutionName} onChange={e => setInstitutionName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Organization Type</label>
                  <select 
                    className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={orgType} 
                    onChange={e => setOrgType(e.target.value)}
                  >
                    <option value="school">School (K-12)</option>
                    <option value="college">College (Higher Ed)</option>
                    <option value="university">University</option>
                    <option value="coaching">Coaching / Institute</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Expected Student Count</label>
                  <Input type="number" value={studentCount} onChange={e => setStudentCount(parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Input value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">State</label>
                  <Input value={state} onChange={e => setState(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <h3 className="font-semibold text-lg border-b pb-2">Step 3: Select Dashboards</h3>
              <p className="text-sm text-muted-foreground mb-4">Select which dashboards should be active for this sandbox.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableDashboards.map(db => {
                  const isSelected = allocatedDashboards.includes(db.id);
                  return (
                    <div 
                      key={db.id}
                      onClick={() => toggleDashboard(db.id)}
                      className={`cursor-pointer border rounded-lg p-3 flex items-start gap-3 transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                    >
                      <div className={`mt-0.5 h-4 w-4 rounded-sm border flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-input'}`}>
                        {isSelected && <CheckCircle2 size={12} />}
                      </div>
                      <span className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>{db.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <h3 className="font-semibold text-lg border-b pb-2">Step 4: Toggle Premium Modules</h3>
              <p className="text-sm text-muted-foreground mb-4">Enable or disable specific features for this sandbox evaluation.</p>
              
              <div className="space-y-3 max-w-lg">
                {Object.entries(features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between border rounded-lg p-4 bg-card">
                    <div>
                      <h4 className="font-semibold capitalize">{key.replace('_', ' ')}</h4>
                      <p className="text-xs text-muted-foreground mt-1">Allow access to {key.replace('_', ' ')} functionality.</p>
                    </div>
                    <Button 
                      variant={value ? "default" : "outline"} 
                      onClick={() => toggleFeature(key)}
                      className={value ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                    >
                      {value ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <h3 className="font-semibold text-lg border-b pb-2">Step 5: Review & Provision</h3>
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1">Organization</h4>
                  <p className="font-medium text-lg">{institutionName}</p>
                  <p className="text-sm opacity-80">{orgType} • {city}, {state} • {studentCount} Students</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1">Administrator</h4>
                  <p className="font-medium">{adminName}</p>
                  <p className="text-sm opacity-80">{adminEmail} • {adminPhone}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1">Configuration</h4>
                  <p className="text-sm opacity-80">{allocatedDashboards.length} Dashboards Selected</p>
                  <p className="text-sm opacity-80">{Object.values(features).filter(Boolean).length} Premium Modules Enabled</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg flex items-start gap-2">
                <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                <span>Clicking <strong>Create Sandbox</strong> will instantly provision the database, configure the dashboard access, generate the secure activation link, and trigger an automated email to {adminEmail}.</span>
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button 
              onClick={handleNext}
              disabled={updateAdminMutation.isPending || updateInstMutation.isPending || updateDashboardsMutation.isPending || provisionMutation.isPending}
              className={step === 5 ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold" : ""}
            >
              {provisionMutation.isPending ? "Provisioning..." : 
               updateAdminMutation.isPending || updateInstMutation.isPending || updateDashboardsMutation.isPending ? "Saving..." :
               step === 5 ? "Create Sandbox" : "Next Step"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
