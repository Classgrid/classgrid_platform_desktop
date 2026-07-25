import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, ChevronRight, ChevronLeft, ShieldCheck, Mail, Smartphone, Key, User,
  Upload, School, GraduationCap, Building2, Briefcase, PlaySquare
} from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { ResponsiveSelect } from "@/components/marketing_ui/responsive-select";
import { getResolvedProfileStrategy } from "@/features/shared/lib/profile-strategy-selector";
import Confetti from "react-confetti";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/marketing_ui/input-otp";

export function OnboardingWizardPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // -- DEBUG / DEV MODE STATE --
  const [debugRole, setDebugRole] = useState("student");
  const [debugOrgType, setDebugOrgType] = useState("engineering");

  // Fetch dynamic sections
  const strategy = getResolvedProfileStrategy({
    targetRole: debugRole,
    viewerRole: debugRole,
    orgType: debugOrgType,
    structureType: debugOrgType,
    isSelfView: true
  });

  const dynamicSections = strategy.sections || [];
  
  // Create one step per dynamic section
  const steps = [
    {
      id: "verification",
      title: "Verification & Security",
      subtitle: "Secure your account with dual verification.",
      icon: ShieldCheck,
      type: "fixed_verification"
    },
    ...dynamicSections.map((section: any) => ({
      id: section.key,
      title: section.label,
      subtitle: "Please provide the following required details.",
      icon: typeof section.icon === 'string' ? getIconComponent(section.icon) : (section.icon || Building2),
      type: "dynamic_group",
      dynamicSections: [section]
    })),
    {
      id: "review_submit",
      title: "Review & Submit",
      subtitle: "Please review all your details before final submission.",
      icon: CheckCircle2,
      type: "review"
    }
  ];

  const totalSteps = steps.length;
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsCompleted(true);
      setShowConfetti(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0C10] flex items-center justify-center p-4">
        {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white dark:bg-[#1A1C23] p-10 rounded-3xl shadow-2xl border border-border/50 text-center"
        >
          <div className="mx-auto w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="size-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">You're All Set!</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Welcome to your new digital campus. Your profile has been successfully configured.
          </p>
          <Button size="lg" className="w-full text-lg h-14 rounded-xl" onClick={() => window.location.href = "/"}>
            Go to Dashboard <ChevronRight className="ml-2 size-5" />
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-[#0B0C10] flex flex-col font-sans overflow-hidden">

      {/* ── TOP DEBUG PANEL (Development Only) ── */}
      <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-3 flex flex-wrap items-center justify-center gap-6 text-sm z-50 shrink-0">
        <span className="font-semibold text-yellow-600 dark:text-yellow-500 flex items-center gap-2">
          <PlaySquare className="size-4" /> LOCAL DEBUG MODE
        </span>
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground font-medium">Test Role:</label>
          <select
            value={debugRole}
            onChange={e => { setDebugRole(e.target.value); setCurrentStep(0); }}
            className="bg-background border rounded px-3 py-1.5 font-medium"
          >
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="org_admin">Org Admin</option>
            <option value="hr_dept">HR Admin</option>
            <option value="admission_head">Admission Admin</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground font-medium">Org Type:</label>
          <select
            value={debugOrgType}
            onChange={e => { setDebugOrgType(e.target.value); setCurrentStep(0); }}
            className="bg-background border rounded px-3 py-1.5 font-medium"
          >
            <option value="engineering">Engineering College</option>
            <option value="school">K-12 School</option>
            <option value="coaching">Coaching Center</option>
          </select>
        </div>
      </div>

      {/* FULL SCREEN LAYOUT */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT SIDEBAR (Fixed Width) */}
        <div className="hidden lg:flex w-[260px] bg-white dark:bg-[#1A1C23] border-r border-border/50 flex-col p-6 z-10 shadow-xl overflow-y-auto">
          <div className="flex items-center gap-3 mb-8 shrink-0">
            {/* Mock College Logo */}
            <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-md">
              <GraduationCap className="size-5 text-white" />
            </div>
            {/* Mock College Name */}
            <h2 className="font-extrabold text-lg leading-tight tracking-tight text-foreground">
              EduPlus<br />
              <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">Engineering College</span>
            </h2>
          </div>

          <div className="flex-1 pb-4">
            <div className="space-y-1 relative">
              {/* Progress Line */}
              <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-secondary -z-10 rounded-full" />
              <div
                className="absolute left-5 top-6 w-0.5 bg-primary -z-10 rounded-full transition-all duration-500"
                style={{ height: `${(currentStep / (totalSteps - 1)) * 100}%` }}
              />

              {steps.map((step, idx) => {
                const stepWindowSize = 4;
                const currentWindow = Math.floor(currentStep / stepWindowSize);
                const stepWindow = Math.floor(idx / stepWindowSize);
                
                if (currentWindow !== stepWindow) return null;

                const isActive = idx === currentStep;
                const isPast = idx < currentStep;
                return (
                  <div key={step.id} className="flex items-center gap-4 py-3 cursor-pointer" onClick={() => idx < currentStep && setCurrentStep(idx)}>
                    <div className={`size-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 ${isActive ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/30 scale-105" :
                        isPast ? "bg-primary border-primary text-primary-foreground" :
                          "bg-background border-muted text-muted-foreground"
                      }`}>
                      {isPast ? <CheckCircle2 className="size-5" /> : <span className="text-sm font-bold">{idx + 1}</span>}
                    </div>
                    <div>
                      <span className={`block text-sm transition-colors ${isActive ? "text-foreground font-bold" :
                          isPast ? "text-foreground font-medium" : "text-muted-foreground/60 font-medium"
                        }`}>
                        {step.title}
                      </span>
                      {isActive && <span className="text-[10px] uppercase tracking-wider text-primary font-bold mt-0.5 block">Current Step</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">© Classgrid 2026. All rights reserved.</p>
          </div>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 flex flex-col relative bg-slate-50/50 dark:bg-[#0B0C10] overflow-hidden">

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto relative">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent -z-10 pointer-events-none" />

            <div className="max-w-6xl w-full mx-auto px-6 py-8 md:px-10 lg:py-10 flex flex-col">

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {currentStepData.type !== "dynamic_group" && (
                    <div className="mb-6">
                      <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-2">
                        {currentStepData.title}
                      </h1>
                      <p className="text-base text-muted-foreground">{currentStepData.subtitle}</p>
                    </div>
                  )}

                  {/* ── RENDER PHASE 1: ALL VERIFICATIONS ON ONE MASSIVE SCREEN ── */}
                  {currentStepData.type === "fixed_verification" && (
                    <div className="space-y-6">
                      {/* Block 1: Email Verification */}
                      <div className="bg-white dark:bg-[#1A1C23] p-6 rounded-2xl shadow-sm border border-border/60">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="size-10 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center">
                            <Mail className="size-5" />
                          </div>
                          <h3 className="text-lg font-bold">1. Verify your Email</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1.5 block">Email Address (From Invite)</label>
                            <Input defaultValue="student@classgrid.in" disabled className="bg-secondary/50 h-10 text-sm" />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-foreground mb-1.5 block">6-Digit Verification Code</label>
                            <InputOTP maxLength={6}>
                              <InputOTPGroup className="gap-2">
                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                  <InputOTPSlot key={index} index={index} className="w-12 h-12 text-lg font-bold rounded-xl border border-input bg-transparent" />
                                ))}
                              </InputOTPGroup>
                            </InputOTP>
                          </div>
                        </div>
                      </div>

                      {/* Block 2: Phone Verification */}
                      <div className="bg-white dark:bg-[#1A1C23] p-6 rounded-2xl shadow-sm border border-border/60">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="size-10 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Smartphone className="size-5" />
                          </div>
                          <h3 className="text-lg font-bold">2. Verify your Phone <span className="text-danger">*</span></h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">A verified phone number is strictly required to access the platform.</p>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1.5 block">Mobile Number</label>
                            <div className="flex gap-2">
                              <Input defaultValue="+91" disabled className="w-16 bg-secondary/50 h-10 text-center text-sm font-medium" />
                              <Input placeholder="10-digit number" className="h-10 flex-1 text-sm" />
                              <Button className="h-10 px-4 text-sm font-semibold">Send OTP</Button>
                            </div>
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-foreground mb-1.5 block">SMS Verification Code</label>
                            <InputOTP maxLength={6}>
                              <InputOTPGroup className="gap-2">
                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                  <InputOTPSlot key={index} index={index} className="w-12 h-12 text-lg font-bold rounded-xl border border-input bg-transparent" />
                                ))}
                              </InputOTPGroup>
                            </InputOTP>
                          </div>
                        </div>
                      </div>

                      {/* Block 3: Password Setup */}
                      <div className="bg-white dark:bg-[#1A1C23] p-6 rounded-2xl shadow-sm border border-border/60">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="size-10 bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center">
                            <Key className="size-5" />
                          </div>
                          <h3 className="text-lg font-bold">3. Secure your Account</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1.5 block">New Password</label>
                            <Input type="password" placeholder="••••••••" className="h-10 text-sm" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1.5 block">Confirm Password</label>
                            <Input type="password" placeholder="••••••••" className="h-10 text-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}



                  {/* ── RENDER PHASE 3: DYNAMIC GROUPS (ONE SECTION PER SCREEN) ── */}
                  {currentStepData.type === "dynamic_group" && (
                    <div className="space-y-6">
                      {currentStepData.dynamicSections?.map((section: any, idx: number) => (
                        <div key={idx} className="bg-white dark:bg-[#1A1C23] p-6 rounded-2xl shadow-sm border border-border/60">
                          <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-3">
                            <div className="size-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                              {React.createElement(getIconComponent(section.icon), { className: "size-4" })}
                            </div>
                            <h3 className="text-lg font-bold">{section.label}</h3>
                          </div>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                            {section.fields.map((field: any, fieldIdx: number) => {
                              const isFullWidth = (field.type === 'text' && field.label.includes('Address')) || field.type === 'image';
                              return (
                                <div key={fieldIdx} className={`grid gap-1.5 ${isFullWidth ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
                                  {field.type !== 'image' && (
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                                      {field.label}
                                      {field.required && <span className="text-danger">*</span>}
                                    </label>
                                  )}

                                  {field.type === 'dropdown' ? (
                                    <ResponsiveSelect className="h-10 w-full rounded-lg border-input bg-background px-3 text-sm">
                                      <option value="">Select...</option>
                                      {Array.isArray(field.options) ? field.options.map((opt: string) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      )) : null}
                                    </ResponsiveSelect>
                                  ) : field.type === 'date' ? (
                                    <Input type="date" className="h-10 rounded-lg px-3 text-sm" />
                                  ) : field.type === 'number' ? (
                                    <Input type="number" className="h-10 rounded-lg px-3 text-sm" placeholder="0" />
                                  ) : field.type === 'boolean' ? (
                                    <div className="flex items-center gap-2 h-10">
                                      <input type="checkbox" className="size-4 rounded border-input" />
                                      <span className="text-sm font-medium">{field.label}</span>
                                    </div>
                                  ) : field.type === 'image' ? (
                                    <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer text-center w-full max-w-sm">
                                      <div className="size-12 bg-background rounded-full shadow-sm flex items-center justify-center mb-3">
                                        <Upload className="size-5 text-muted-foreground" />
                                      </div>
                                      <h4 className="font-semibold text-sm">Upload {field.label}</h4>
                                      <p className="text-[10px] text-muted-foreground mt-1">JPEG, PNG up to 2MB</p>
                                    </div>
                                  ) : (
                                    <Input type="text" className="h-10 rounded-lg px-3 text-sm" placeholder={`Enter ${field.label.toLowerCase()}`} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── RENDER PHASE 4: REVIEW PAGE ── */}
                  {currentStepData.type === "review" && (
                    <div className="bg-white dark:bg-[#1A1C23] p-8 rounded-2xl shadow-sm border border-border/60 text-center">
                      <div className="mx-auto size-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="size-8" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Ready to Submit?</h3>
                      <p className="text-muted-foreground mb-6">
                        You have completed all sections. Please ensure your information is accurate before submitting.
                      </p>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* FIXED ACTION BAR (Footer) */}
            <div className="bg-white dark:bg-[#1A1C23] border-t border-border/50 p-4 px-6 md:px-10 flex items-center justify-between shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-20">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="h-10 px-4 text-sm font-medium rounded-lg"
                >
                  <ChevronLeft className="mr-1 size-4" /> Back
                </Button>
                {currentStep > 0 && (
                  <Button variant="ghost" size="sm" className="h-10 text-sm font-medium text-muted-foreground hidden sm:flex">
                    Save as Draft
                  </Button>
                )}
              </div>

              <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                Step {currentStep + 1} of {totalSteps} — {currentStepData.title}
              </div>

              <Button
                size="sm"
                onClick={handleNext}
                className="h-10 px-6 text-sm font-semibold rounded-lg shadow-md shadow-primary/30"
              >
                {currentStep === totalSteps - 1 ? "Submit Profile" : "Save & Continue"}
                {currentStep !== totalSteps - 1 && <ChevronRight className="ml-1 size-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Map string icons from strategy engine to Lucide icons
function getIconComponent(iconName: string) {
  const map: Record<string, any> = {
    User: User,
    GraduationCap: GraduationCap,
    School: School,
    Building2: Building2,
    Briefcase: Briefcase,
    Phone: Smartphone,
    Users: User,
    ShieldCheck: ShieldCheck
  };
  return map[iconName] || CheckCircle2;
}
