import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { validateActivationToken, activateAdmin, sendOnboardingOtp, verifyOnboardingOtp, checkUsername } from "../api";
import {
  CheckCircle2, ChevronRight, ChevronLeft, ShieldCheck, Mail, Smartphone, Key, User,
  Upload, School, GraduationCap, Building2, Briefcase, PlaySquare, Eye, EyeOff, Moon, Sun, ChevronDown
} from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/marketing_ui/alert-dialog";
import { useTheme } from "next-themes";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { ResponsiveSelect } from "@/components/marketing_ui/responsive-select";
import { getResolvedProfileStrategy } from "@/features/shared/lib/profile-strategy-selector";
import Confetti from "react-confetti";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/marketing_ui/input-otp";
import { Calendar } from "@/components/marketing_ui/nikhil_calendar";
import { ImageCropperModal } from "@/components/marketing_ui/ImageCropperModal";
import { Popover } from "@base-ui/react/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function OnboardingWizardPage() {
  const { theme, setTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchedEmail, setFetchedEmail] = useState("");
  const [fetchedName, setFetchedName] = useState("");
  const [fetchedRole, setFetchedRole] = useState("");
  const [fetchedOrgType, setFetchedOrgType] = useState("school");
  const [fetchedSubdomain, setFetchedSubdomain] = useState("");
  const [dashboardUrl, setDashboardUrl] = useState("/");
  // Org data auto-fetched from Book a Demo lead
  const [fetchedOrgName, setFetchedOrgName] = useState("");
  const [fetchedAddress, setFetchedAddress] = useState("");
  const [fetchedCity, setFetchedCity] = useState("");
  const [fetchedState, setFetchedState] = useState("");
  // Welcome step: editable name field
  const [adminName, setAdminName] = useState("");

  // OTP Verification States
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);

  // Username States
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState("");

  // Org Verification States
  const [orgEmail, setOrgEmail] = useState("");
  const [orgEmailOtp, setOrgEmailOtp] = useState("");
  const [isOrgEmailVerified, setIsOrgEmailVerified] = useState(false);
  const [orgEmailOtpSent, setOrgEmailOtpSent] = useState(false);
  const [isVerifyingOrgEmail, setIsVerifyingOrgEmail] = useState(false);
  const [alertState, setAlertState] = useState({ open: false, title: "", message: "" });
  const showAlert = (message: string, title: string = "Notice") => { setAlertState({ open: true, title, message }); };

  const handleSendOrgEmailOtp = async () => {
    if (!orgEmail || !orgEmail.includes("@")) {
      showAlert("Please enter a valid organization email.");
      return;
    }
    try {
      await sendOnboardingOtp({ target: orgEmail, type: "email" });
      setOrgEmailOtpSent(true);
      showAlert("OTP sent to organization email!");
    } catch (e: any) {
      showAlert(e.message || "Failed to send OTP");
    }
  };

  const handleVerifyOrgEmailOtp = async (otpValue: string) => {
    if (otpValue.length !== 6) return;
    setIsVerifyingOrgEmail(true);
    try {
      const res = await verifyOnboardingOtp({ target: orgEmail, otp: otpValue });
      if (res.verified) {
        setIsOrgEmailVerified(true);
      }
    } catch (e: any) {
      showAlert(e.message || "Invalid OTP");
    } finally {
      setIsVerifyingOrgEmail(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!fetchedEmail) return;
    try {
      await sendOnboardingOtp({ target: fetchedEmail, type: "email" });
      setEmailOtpSent(true);
      showAlert("OTP sent to your email!");
    } catch (e: any) {
      showAlert(e.message || "Failed to send OTP");
    }
  };

  const handleVerifyEmailOtp = async (otpValue: string) => {
    if (otpValue.length !== 6) return;
    setIsVerifyingEmail(true);
    try {
      const res = await verifyOnboardingOtp({ target: fetchedEmail, otp: otpValue });
      if (res.verified) {
        setIsEmailVerified(true);
      }
    } catch (e: any) {
      showAlert(e.message || "Invalid OTP");
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!phone || phone.length < 10) {
      showAlert("Please enter a valid phone number.");
      return;
    }
    try {
      await sendOnboardingOtp({ target: phone, type: "phone" });
      setPhoneOtpSent(true);
      showAlert("OTP sent to your phone!");
    } catch (e: any) {
      showAlert(e.message || "Failed to send OTP");
    }
  };

  const handleVerifyPhoneOtp = async (otpValue: string) => {
    if (otpValue.length !== 6) return;
    setIsVerifyingPhone(true);
    try {
      const res = await verifyOnboardingOtp({ target: phone, otp: otpValue });
      if (res.verified) {
        setIsPhoneVerified(true);
      }
    } catch (e: any) {
      showAlert(e.message || "Invalid OTP");
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleUsernameChange = async (val: string) => {
    const rawVal = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(rawVal);
    setUsernameAvailable(null);
    setUsernameMessage("");
    
    if (rawVal.length < 3) {
      setUsernameMessage("Must be at least 3 characters.");
      return;
    }
    
    setIsCheckingUsername(true);
    try {
      const res = await checkUsername(rawVal);
      setUsernameAvailable(res.available);
      setUsernameMessage(res.message);
    } catch (err: any) {
      setUsernameAvailable(false);
      setUsernameMessage("Error checking username");
    } finally {
      setIsCheckingUsername(false);
    }
  };

  React.useEffect(() => {
    if (token) {
      validateActivationToken(token)
        .then((res) => {
          if (res.valid) {
            if (res.email) setFetchedEmail(res.email);
            if (res.name) { setFetchedName(res.name); setAdminName(res.name); }
            if (res.role) setFetchedRole(res.role);
            if (res.orgType) setFetchedOrgType(res.orgType);
            if (res.subdomain) setFetchedSubdomain(res.subdomain);
            if (res.orgName) setFetchedOrgName(res.orgName);
            if (res.address) setFetchedAddress(res.address);
            if (res.city) setFetchedCity(res.city);
            if (res.state) setFetchedState(res.state);
          }
        })
        .catch((err) => {
          console.error("Token validation failed:", err);
        });
    }
  }, [token]);
  // Central form state: sectionKey -> { fieldKey: value }
  const [formData, setFormData] = useState<Record<string, Record<string, any>>>({});

  // Password UI State (Ported from ResetPasswordPage)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const passwordRules = useMemo(() => {
    return {
      minLength: password.length >= 8,
      maxLength: password.length > 0 && password.length <= 64,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[@#$%^&*!?_.\-]/.test(password),
    };
  }, [password]);

  const passedRules = Object.values(passwordRules).filter(Boolean).length;

  const strength = useMemo(() => {
    if (!password) return "empty";
    if (passedRules <= 3) return "weak";
    if (passedRules <= 5) return "medium";
    return "strong";
  }, [password, passedRules]);

  const isStrongPassword =
    passwordRules.minLength &&
    passwordRules.maxLength &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.number &&
    passwordRules.special;

  const isConfirmTouched = confirmPassword.length > 0;
  const isPasswordMatch = password === confirmPassword && isConfirmTouched;

  const strengthStyles = {
    empty: { border: "border-input", glow: "", text: "text-muted-foreground", bar: "bg-muted-foreground/20 w-0" },
    weak: { border: "border-red-500/70", glow: "shadow-[0_0_12px_rgba(239,68,68,0.15)]", text: "text-red-500", bar: "bg-red-500 w-1/3" },
    medium: { border: "border-orange-500/70", glow: "shadow-[0_0_12px_rgba(249,115,22,0.15)]", text: "text-orange-500", bar: "bg-orange-500 w-2/3" },
    strong: { border: "border-emerald-500/80", glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]", text: "text-emerald-500", bar: "bg-emerald-500 w-full" },
  };

  const current = strengthStyles[strength as keyof typeof strengthStyles];
  
  const confirmBorder = !isConfirmTouched
    ? "border-input"
    : isPasswordMatch
    ? "border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
    : "border-red-500/70 shadow-[0_0_12px_rgba(239,68,68,0.15)]";

  const handleFieldChange = (sectionKey: string, fieldKey: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...(prev[sectionKey] || {}),
        [fieldKey]: value,
      }
    }));
  };

  // -- DEBUG / DEV MODE STATE --
  const [debugRole, setDebugRole] = useState("student");
  const [debugOrgType, setDebugOrgType] = useState("engineering");

  const effectiveRole = fetchedRole || debugRole;
  const effectiveOrgType = fetchedRole ? fetchedOrgType : debugOrgType;

  // Fetch dynamic sections
  const strategy = getResolvedProfileStrategy({
    targetRole: effectiveRole,
    viewerRole: effectiveRole,
    orgType: effectiveOrgType,
    structureType: effectiveOrgType,
    isSelfView: true
  });

  const dynamicSections = (strategy.sections || []).filter(sec => sec.key !== "organization_details");
  
  const isOrgAdmin = effectiveRole === "org_admin";

  // Create one step per dynamic section
  const steps: any[] = [
    {
      id: "welcome",
      title: "Welcome",
      subtitle: "Let's get started.",
      icon: User,
      type: "fixed_welcome"
    },
    {
      id: "contact_verification",
      title: "Contact Verification",
      subtitle: "Verify your email and phone number.",
      icon: ShieldCheck,
      type: "fixed_verification"
    },
    {
      id: "profile_photo",
      title: "Profile Photo",
      subtitle: "Official passport-size portrait.",
      icon: User,
      type: "fixed_profile_photo"
    },
    {
      id: "personal_details",
      title: "Personal Identity",
      subtitle: "Set up your public profile and @username.",
      icon: Briefcase,
      type: "fixed_personal_details"
    },
    ...dynamicSections.map((section: any) => ({
      id: section.key,
      title: section.label,
      subtitle: "Please provide the following required details.",
      icon: typeof section.icon === 'string' ? getIconComponent(section.icon) : (section.icon || Building2),
      type: "dynamic_group",
      dynamicSections: [section]
    })),
    ...(isOrgAdmin ? [
      {
        id: "terminology",
        title: "Platform Terminology",
        subtitle: "How we organize your digital campus.",
        icon: Building2,
        type: "fixed_terminology"
      },
      {
        id: "org_identity",
        title: "Organization Identity",
        subtitle: "Your logo and portal URL.",
        icon: Building2,
        type: "fixed_org_identity"
      },
      {
        id: "org_details",
        title: "Organization Details",
        subtitle: "Legal and address details.",
        icon: Building2,
        type: "fixed_org_details"
      },
      {
        id: "org_verification",
        title: "Organization Verification",
        subtitle: "Verify official organization contact.",
        icon: ShieldCheck,
        type: "fixed_org_verification"
      }
    ] : []),
    {
      id: "password",
      title: "Secure Your Account",
      subtitle: "Create a strong password to protect your account.",
      icon: Key,
      type: "fixed_password"
    },
    {
      id: "review_submit",
      title: "Review & Submit",
      subtitle: "Please review all your details before final submission.",
      icon: CheckCircle2,
      type: "review"
    }
  ];

  const totalSteps = steps.length;
  const currentStepData = steps[currentStep] || steps[0];

  // Find the password step index dynamically
  const passwordStepIndex = steps.findIndex(s => s.id === "password");

  const handleNext = async () => {
    // Welcome step: require a name
    if (currentStepData.id === "welcome") {
      if (!adminName.trim()) {
        showAlert("Please enter your name to continue.");
        return;
      }
    }
    // Password step: validate strong password
    if (currentStepData.id === "password") {
      if (!password || !isStrongPassword || !isPasswordMatch) {
        showAlert("Please enter a valid, matching, strong password to continue.");
        return;
      }
    }
    // Contact Verification step: validate both are verified
    if (currentStepData.id === "contact_verification") {
      if (!isEmailVerified || !isPhoneVerified) {
        showAlert("Please verify both your email and phone number to continue.");
        return;
      }
    }
    // Personal Details step: validate username
    if (currentStepData.id === "personal_details") {
      if (!usernameAvailable) {
        showAlert("Please choose a valid and available @username.");
        return;
      }
    }
    // Org Verification step
    if (currentStepData.id === "org_verification") {
      if (!isOrgEmailVerified) {
        showAlert("Please verify the organization contact email.");
        return;
      }
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      console.log("FINAL SUBMITTED PROFILE DATA:", formData);
      setIsSubmitting(true);
      try {
        if (token && password) {
          const payload: any = { 
            token, 
            password,
            username,
            orgEmail,
            personalDetails: formData["personal_details"],
            orgIdentity: formData["org_identity"],
            orgDetails: formData["org_details"],
            dynamicData: formData
          };
          if (effectiveRole === "org_admin" && fetchedSubdomain) {
            payload.subdomain = fetchedSubdomain;
          }
          if (formData["org_identity"]?.["slug"]) {
            payload.subdomain = formData["org_identity"]["slug"];
          }
          const res = await activateAdmin(payload);
          if (res.redirectTo) {
            setDashboardUrl(res.redirectTo);
          }
        }
        setIsCompleted(true);
        setShowConfetti(true);
      } catch (err) {
        console.error(err);
        showAlert("Failed to save password or complete setup. Your link may have expired.");
      } finally {
        setIsSubmitting(false);
      }
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
      <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center p-4">
        {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 30%, #1e3a5f 0%, #0a0e1a 50%, #05070d 100%)" }}>
          {/* Starfield */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: `${Math.random() * 2 + 1}px`,
                  height: `${Math.random() * 2 + 1}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.5 + 0.1,
                }}
              />
            ))}
          </div>
          {/* Aurora Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(56,142,255,0.3) 0%, rgba(56,142,255,0.1) 40%, transparent 70%)", filter: "blur(80px)" }} />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 text-center px-6 max-w-xl"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-emerald-400 text-lg font-semibold mb-4 tracking-wide"
            >
              All set
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold text-white mb-10 leading-tight"
            >
              Let's start building together
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
            >
              <Button
                size="lg"
                onClick={() => window.location.href = dashboardUrl}
                className="h-14 px-10 text-base font-semibold rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all duration-300 shadow-lg shadow-blue-500/10"
              >
                Start using Classgrid <ChevronRight className="ml-2 size-5" />
              </Button>
            </motion.div>
          </motion.div>
          <style>{`@keyframes pulse { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.7; } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-background flex flex-col font-sans overflow-hidden">
      {/* Debug Panel - Only show if not using a real token */}
      {!token && (
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
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar */}
        <div className="hidden lg:flex w-[260px] bg-white dark:bg-card border-r border-border/50 flex-col p-6 z-10 shadow-xl overflow-y-auto">
          <div className="flex items-center gap-3 mb-8 shrink-0">
            {/* Org Logo */}
            <div className="size-10 bg-black rounded-xl flex items-center justify-center shrink-0 shadow-md p-1 border border-border">
              <img src="/logo.png" className="w-full h-full object-contain" alt="Classgrid Logo" />
            </div>
            {/* Org Name */}
            <h2 className="font-extrabold text-lg leading-tight tracking-tight text-foreground">
              Classgrid<br />
              {/* Platform is our repo name, ERP is our product name */}
              <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">ERP</span>
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
                  <div 
                    key={step.id} 
                    className={`flex items-center gap-4 py-3 ${isPast ? "cursor-pointer hover:opacity-80 transition-opacity" : isActive ? "cursor-default" : "cursor-default opacity-60"}`} 
                    onClick={() => isPast && setCurrentStep(idx)}
                  >
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

          <div className="mt-auto pt-6 border-t border-border flex items-center justify-center">
            <div className="bg-secondary/50 rounded-full p-1 flex items-center shadow-inner">
              <button 
                onClick={() => setTheme("light")}
                className={cn("p-2 px-3 rounded-full transition-all", theme === "light" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                <Sun className="size-4" />
              </button>
              <button 
                onClick={() => setTheme("dark")}
                className={cn("p-2 px-3 rounded-full transition-all", theme === "dark" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                <Moon className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col relative bg-slate-50/50 dark:bg-background overflow-hidden">

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
                  {currentStepData.type !== "dynamic_group" && currentStepData.type !== "fixed_welcome" && (
                    <div className="mb-6">
                      <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-2">
                        {currentStepData.title}
                      </h1>
                      <p className="text-base text-muted-foreground">{currentStepData.subtitle}</p>
                    </div>
                  )}

                  {/* ── WELCOME STEP: Cinematic Full-Screen Greeting ── */}
                  {currentStepData.type === "fixed_welcome" && (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 120%, #1e3a5f 0%, #0a0e1a 50%, #05070d 100%)" }}>
                      {/* Starfield */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {Array.from({ length: 80 }).map((_, i) => (
                          <div
                            key={i}
                            className="absolute rounded-full bg-white"
                            style={{
                              width: `${Math.random() * 2 + 1}px`,
                              height: `${Math.random() * 2 + 1}px`,
                              top: `${Math.random() * 100}%`,
                              left: `${Math.random() * 100}%`,
                              opacity: Math.random() * 0.6 + 0.1,
                              animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
                              animationDelay: `${Math.random() * 2}s`,
                            }}
                          />
                        ))}
                      </div>
                      {/* Aurora Glow */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(56,142,255,0.25) 0%, rgba(56,142,255,0.08) 40%, transparent 70%)", filter: "blur(60px)" }} />

                      {/* Content */}
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative z-10 text-center px-6 max-w-2xl"
                      >
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.6 }}
                          className="text-white/60 text-lg mb-4 font-medium tracking-wide"
                        >
                          Welcome to Classgrid
                        </motion.p>
                        <motion.h1
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6, duration: 0.8 }}
                          className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
                        >
                          Hey, {adminName.split(' ')[0] || 'Admin'}
                        </motion.h1>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.0, duration: 0.8 }}
                          className="text-white/50 text-lg md:text-xl leading-relaxed mb-10"
                        >
                          Let's set up your digital campus. Just a few quick basics before you jump in.
                        </motion.p>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.4, duration: 0.6 }}
                        >
                          <Button
                            size="lg"
                            onClick={() => { setCurrentStep(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="h-14 px-10 text-base font-semibold rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all duration-300 shadow-lg shadow-blue-500/10"
                          >
                            Get Started <ChevronRight className="ml-2 size-5" />
                          </Button>
                        </motion.div>
                      </motion.div>

                      {/* Pulse animation keyframe */}
                      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.7; } }`}</style>
                    </div>
                  )}

                  {/* Verification Step */}
                  {currentStepData.type === "fixed_verification" && (
                    <div className="space-y-6">
                      {/* Email Verification */}
                      <div className="bg-white dark:bg-card p-6 rounded-2xl shadow-sm border border-border/60">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="size-10 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center">
                            <Mail className="size-5" />
                          </div>
                          <h3 className="text-lg font-bold">1. Verify your Email</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1.5 block">Email Address (From Invite)</label>
                            <div className="flex gap-2">
                              <Input value={fetchedEmail || "Loading..."} readOnly className="bg-secondary/50 h-10 flex-1 text-sm font-medium" />
                              {!isEmailVerified && (
                                <Button 
                                  variant="outline" 
                                  className="h-10 px-4 text-sm font-semibold"
                                  onClick={handleSendEmailOtp}
                                  disabled={emailOtpSent}
                                >
                                  {emailOtpSent ? "Sent" : "Send OTP"}
                                </Button>
                              )}
                            </div>
                            {isEmailVerified && (
                              <p className="text-emerald-600 text-sm mt-2 font-medium flex items-center gap-1">
                                <CheckCircle2 className="size-4" /> Verified
                              </p>
                            )}
                          </div>
                          <div className="flex-1">
                            {isEmailVerified ? (
                              <div className="h-full flex flex-col justify-center">
                                <p className="text-sm text-emerald-600 font-medium">Your email was securely verified via your activation link.</p>
                              </div>
                            ) : emailOtpSent ? (
                              <>
                                <label className="text-xs font-semibold text-foreground mb-1.5 block">6-Digit Verification Code</label>
                                <InputOTP 
                                  maxLength={6} 
                                  disabled={isVerifyingEmail}
                                  value={emailOtp}
                                  onChange={(v) => { setEmailOtp(v); if(v.length===6) handleVerifyEmailOtp(v); }}
                                >
                                  <InputOTPGroup className="gap-2">
                                    {[0, 1, 2, 3, 4, 5].map((index) => (
                                      <InputOTPSlot key={index} index={index} className="w-12 h-12 text-lg font-bold rounded-xl border border-input bg-transparent" />
                                    ))}
                                  </InputOTPGroup>
                                </InputOTP>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Block 2: Phone Verification */}
                      <div className="bg-white dark:bg-card p-6 rounded-2xl shadow-sm border border-border/60">
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
                              <Input 
                                placeholder="10-digit number" 
                                className="h-10 flex-1 text-sm" 
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                disabled={isPhoneVerified}
                              />
                              {!isPhoneVerified && (
                                <Button 
                                  className="h-10 px-4 text-sm font-semibold"
                                  onClick={handleSendPhoneOtp}
                                  disabled={phoneOtpSent && phone.length === 10}
                                >
                                  {phoneOtpSent ? "Resend" : "Send OTP"}
                                </Button>
                              )}
                            </div>
                            {isPhoneVerified && (
                              <p className="text-emerald-600 text-sm mt-2 font-medium flex items-center gap-1">
                                <CheckCircle2 className="size-4" /> Verified
                              </p>
                            )}
                          </div>
                          <div className="flex-1">
                            {isPhoneVerified ? (
                              <div className="h-full flex flex-col justify-center">
                                <p className="text-sm text-emerald-600 font-medium flex items-center gap-2"><CheckCircle2 className="size-4" /> Phone number verified.</p>
                              </div>
                            ) : phoneOtpSent ? (
                              <>
                                <label className="text-xs font-semibold text-foreground mb-1.5 block">SMS Verification Code</label>
                                <InputOTP 
                                  maxLength={6}
                                  disabled={isVerifyingPhone}
                                  value={phoneOtp}
                                  onChange={(v) => { setPhoneOtp(v); if(v.length===6) handleVerifyPhoneOtp(v); }}
                                >
                                  <InputOTPGroup className="gap-2">
                                    {[0, 1, 2, 3, 4, 5].map((index) => (
                                      <InputOTPSlot key={index} index={index} className="w-12 h-12 text-lg font-bold rounded-xl border border-input bg-transparent" />
                                    ))}
                                  </InputOTPGroup>
                                </InputOTP>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}



                  {/* ── RENDER: PROFILE PHOTO (FIXED STEP) ── */}
                  {currentStepData.type === "fixed_profile_photo" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-white dark:bg-card p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/60 text-center flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden">
                        
                        {/* Decorative Background Pattern */}
                        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10" style={{ backgroundImage: "radial-gradient(circle at center, #10b981 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

                        <div className="relative z-10 flex flex-col items-center w-full max-w-md">
                          <h2 className="text-2xl font-bold mb-3">Add Your Identity</h2>
                          <p className="text-muted-foreground mb-10 text-sm leading-relaxed">
                            Upload a high-quality, passport-sized photo for your official ID card. A clear front-facing picture ensures a perfect fit.
                          </p>
                          
                          <div className="w-full flex justify-center mb-2">
                            <ImageUploadField 
                              label="Upload Photo" 
                              value={formData["profile_photo"]?.["image"]}
                              onChange={(base64) => handleFieldChange("profile_photo", "image", base64)}
                              circular={true}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── RENDER: PERSONAL DETAILS (FIXED STEP) ── */}
                  {currentStepData.type === "fixed_personal_details" && (
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-card p-6 rounded-2xl shadow-sm border border-border/60">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="size-10 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Briefcase className="size-5" />
                          </div>
                          <h3 className="text-xl font-bold">Personal Profile & @username</h3>
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="text-sm font-semibold text-foreground mb-1.5 block">Unique @username <span className="text-danger">*</span></label>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">@</span>
                              <Input 
                                placeholder="e.g. john_doe" 
                                className="pl-8 h-10" 
                                value={username}
                                onChange={(e) => handleUsernameChange(e.target.value)}
                              />
                            </div>
                            <div className="h-6 mt-1 flex items-center">
                              {isCheckingUsername && <span className="text-xs text-muted-foreground">Checking availability...</span>}
                              {!isCheckingUsername && usernameMessage && (
                                <span className={cn("text-xs font-medium", usernameAvailable ? "text-emerald-500" : "text-red-500")}>
                                  {usernameMessage}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <label className="text-sm font-semibold text-foreground mb-1.5 block">Job Title / Designation</label>
                              <Input 
                                placeholder="e.g. Principal, HOD, Director" 
                                className="h-10"
                                value={formData["personal_details"]?.["designation"] || ""}
                                onChange={(e) => handleFieldChange("personal_details", "designation", e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-foreground mb-1.5 block">Department</label>
                              <Input 
                                placeholder="e.g. Administration, Computer Science" 
                                className="h-10"
                                value={formData["personal_details"]?.["department"] || ""}
                                onChange={(e) => handleFieldChange("personal_details", "department", e.target.value)}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-semibold text-foreground mb-1.5 block">LinkedIn Profile (Optional)</label>
                            <Input 
                              placeholder="https://linkedin.com/in/username" 
                              className="h-10"
                              value={formData["personal_details"]?.["linkedin"] || ""}
                              onChange={(e) => handleFieldChange("personal_details", "linkedin", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── RENDER: TERMINOLOGY VISUAL (FIXED STEP) ── */}
                  {currentStepData.type === "fixed_terminology" && (() => {
                    const currentOrgType = formData["org_details"]?.type || fetchedOrgType || "Engineering";
                    const terms = getTerminologyLabels(currentOrgType);
                    return (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900" />
                          <div className="relative z-10 flex flex-col items-center">
                            <h3 className="text-2xl font-bold mb-2">Platform Terminology</h3>
                            <p className="text-slate-400 mb-8 text-center max-w-sm">This flowchart visualizes how your data will be hierarchically organized based on your institution type ({currentOrgType}).</p>
                            
                            <div className="flex flex-col items-center gap-4">
                              <motion.div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 w-64 text-center shadow-lg" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                                <Building2 className="size-6 mx-auto mb-2 text-indigo-400" />
                                <div className="font-bold">Organization ({terms.orgLabel})</div>
                                <div className="text-xs text-slate-400">{formData["org_details"]?.name || "Your Institution"}</div>
                              </motion.div>
                              <div className="w-0.5 h-6 bg-indigo-500/50" />
                              <motion.div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 w-64 text-center shadow-lg" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                                <Briefcase className="size-6 mx-auto mb-2 text-blue-400" />
                                <div className="font-bold">{terms.level1}</div>
                                <div className="text-xs text-slate-400">Top Level Structural Unit</div>
                              </motion.div>
                              <div className="w-0.5 h-6 bg-blue-500/50" />
                              <div className="flex gap-4">
                                <motion.div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 w-32 text-center shadow-lg" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                                  <School className="size-5 mx-auto mb-2 text-emerald-400" />
                                  <div className="font-bold text-sm">{terms.level2}</div>
                                </motion.div>
                                <motion.div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 w-32 text-center shadow-lg" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                                  <GraduationCap className="size-5 mx-auto mb-2 text-purple-400" />
                                  <div className="font-bold text-sm">{terms.level3}</div>
                                </motion.div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── RENDER: ORG IDENTITY (FIXED STEP) ── */}
                  {currentStepData.type === "fixed_org_identity" && (
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-card p-8 rounded-3xl shadow-sm border border-border/60">
                        <h3 className="text-xl font-bold mb-8">Brand & Portal Address</h3>
                        <div className="grid md:grid-cols-2 gap-10">
                          <div>
                            <label className="text-sm font-semibold mb-2 block">Upload Institute Logo</label>
                            <p className="text-xs text-muted-foreground mb-4">A square, transparent PNG works best.</p>
                            <div className="flex justify-start">
                              <ImageUploadField 
                                label="Upload Logo" 
                                value={formData["org_identity"]?.["logo"]}
                                onChange={(base64) => handleFieldChange("org_identity", "logo", base64)}
                                circular={false}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-semibold mb-2 block">Your Custom Portal URL <span className="text-danger">*</span></label>
                            <p className="text-xs text-muted-foreground mb-4">Choose a short, memorable slug for your login portal.</p>
                            <div className="flex items-center rounded-xl border border-input bg-secondary/30 pl-4 overflow-hidden h-12 focus-within:ring-2 focus-within:ring-primary/20">
                              <span className="text-muted-foreground font-medium text-sm">classgrid.com/</span>
                              <Input 
                                type="text" 
                                className="flex-1 bg-transparent border-none outline-none shadow-none px-2 text-sm font-bold h-full focus-visible:ring-0 focus-visible:ring-offset-0"
                                placeholder="my-school"
                                value={formData["org_identity"]?.["slug"] || ""}
                                onChange={(e) => handleFieldChange("org_identity", "slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                              />
                            </div>
                            {formData["org_identity"]?.["slug"] && (
                              <p className="text-emerald-500 text-xs mt-3 font-medium flex items-center gap-1">
                                <CheckCircle2 className="size-3" /> URL looks great
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── RENDER: ORG DETAILS (FIXED STEP) ── */}
                  {currentStepData.type === "fixed_org_details" && (
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-card p-8 rounded-3xl shadow-sm border border-border/60">
                        <h3 className="text-xl font-bold mb-6">Organization Details</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="text-sm font-semibold block mb-1.5">Legal Organization Name <span className="text-danger">*</span></label>
                            <Input 
                              value={formData["org_details"]?.["name"] || fetchedOrgName || ""}
                              onChange={(e) => handleFieldChange("org_details", "name", e.target.value)}
                              placeholder="e.g. Cambridge International School"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold block mb-1.5">Type <span className="text-danger">*</span></label>
                            <ResponsiveSelect 
                              className="w-full h-10 rounded-lg border-input bg-background"
                              value={formData["org_details"]?.["type"] || fetchedOrgType || "School"}
                              onChange={(e) => handleFieldChange("org_details", "type", e.target.value)}
                            >
                              <option value="School">School</option>
                              <option value="College">College / University</option>
                              <option value="Coaching">Coaching Institute</option>
                            </ResponsiveSelect>
                          </div>
                          <div>
                            <label className="text-sm font-semibold block mb-1.5">Board / Affiliation</label>
                            <ResponsiveSelect 
                              className="w-full h-10 rounded-lg border-input bg-background"
                              value={formData["org_details"]?.["board"] || "CBSE"}
                              onChange={(e) => handleFieldChange("org_details", "board", e.target.value)}
                            >
                              <option value="CBSE">CBSE</option>
                              <option value="ICSE">ICSE</option>
                              <option value="State">State Board</option>
                              <option value="University">University</option>
                              <option value="None">None</option>
                            </ResponsiveSelect>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm font-semibold block mb-1.5">Full Address <span className="text-danger">*</span></label>
                            <Input 
                              value={formData["org_details"]?.["address"] || fetchedAddress || ""}
                              onChange={(e) => handleFieldChange("org_details", "address", e.target.value)}
                              placeholder="Street address"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold block mb-1.5">City <span className="text-danger">*</span></label>
                            <Input 
                              value={formData["org_details"]?.["city"] || fetchedCity || ""}
                              onChange={(e) => handleFieldChange("org_details", "city", e.target.value)}
                              placeholder="City"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold block mb-1.5">PIN Code <span className="text-danger">*</span></label>
                            <Input 
                              value={formData["org_details"]?.["pincode"] || ""}
                              onChange={(e) => handleFieldChange("org_details", "pincode", e.target.value)}
                              placeholder="e.g. 110001"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── RENDER: ORG VERIFICATION (FIXED STEP) ── */}
                  {currentStepData.type === "fixed_org_verification" && (
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-card p-8 rounded-3xl shadow-sm border border-border/60">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="size-12 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center">
                            <Mail className="size-6" />
                          </div>
                          <h3 className="text-xl font-bold">Verify Organization Contact <span className="text-danger">*</span></h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-8">
                          Please provide the official contact email for the organization. This will be used for billing and critical alerts.
                        </p>
                        <div className="grid md:grid-cols-2 gap-8">
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1.5 block">Official Org Email</label>
                            <div className="flex gap-2">
                              <Input 
                                value={orgEmail} 
                                onChange={(e) => setOrgEmail(e.target.value)}
                                disabled={isOrgEmailVerified || orgEmailOtpSent}
                                placeholder="admin@school.com"
                                className="h-12 flex-1 text-sm font-medium" 
                              />
                              {!isOrgEmailVerified && (
                                <Button 
                                  variant="outline" 
                                  className="h-12 px-6 text-sm font-semibold"
                                  onClick={handleSendOrgEmailOtp}
                                  disabled={orgEmailOtpSent}
                                >
                                  {orgEmailOtpSent ? "Sent" : "Send OTP"}
                                </Button>
                              )}
                            </div>
                            {isOrgEmailVerified && (
                              <p className="text-emerald-600 text-sm mt-3 font-medium flex items-center gap-1">
                                <CheckCircle2 className="size-4" /> Verified
                              </p>
                            )}
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-foreground mb-1.5 block">6-Digit Verification Code</label>
                            <InputOTP 
                              maxLength={6} 
                              disabled={!orgEmailOtpSent || isOrgEmailVerified || isVerifyingOrgEmail}
                              value={orgEmailOtp}
                              onChange={(v) => { setOrgEmailOtp(v); if(v.length===6) handleVerifyOrgEmailOtp(v); }}
                            >
                              <InputOTPGroup className="gap-2">
                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                  <InputOTPSlot key={index} index={index} className="w-12 h-12 text-lg font-bold rounded-xl border border-input bg-transparent" />
                                ))}
                              </InputOTPGroup>
                            </InputOTP>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── RENDER: PASSWORD STEP ── */}
                  {currentStepData.type === "fixed_password" && (
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-card p-8 rounded-2xl shadow-sm border border-border/60">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="size-12 bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center">
                            <Key className="size-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">Create Your Password</h3>
                            <p className="text-sm text-muted-foreground">This will be used to log in to your Classgrid dashboard.</p>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="relative">
                            <label className="text-xs font-semibold text-foreground mb-1.5 block">New Password</label>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                maxLength={64}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setIsPasswordFocused(true)}
                                onBlur={() => setIsPasswordFocused(false)}
                                placeholder="Enter new password"
                                className={`h-12 w-full rounded-xl border bg-background px-4 pr-10 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground ${current.border} ${current.glow}`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                              >
                                {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </button>
                            </div>

                            {/* Floating Rules Popover */}
                            {isPasswordFocused && password.length >= 2 && (
                              <div className="absolute left-[calc(100%+12px)] top-8 z-50 w-[240px] rounded-xl border border-border bg-popover p-3 shadow-lg hidden md:block animate-in fade-in zoom-in-95">
                                <div className="absolute -left-1.5 top-3 h-3 w-3 rotate-45 border-b border-l border-border bg-popover" />
                                <p className="text-[12px] font-semibold text-foreground">Password must contain:</p>
                                <ul className="mt-2 flex flex-col gap-1 text-[11px] text-muted-foreground">
                                  <li className="flex items-center gap-2">
                                    <div className={`h-1.5 w-1.5 rounded-full ${passwordRules.minLength ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                                    Between 8 and 64 characters
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <div className={`h-1.5 w-1.5 rounded-full ${passwordRules.uppercase && passwordRules.lowercase ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                                    Uppercase & lowercase letters
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <div className={`h-1.5 w-1.5 rounded-full ${passwordRules.number ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                                    At least 1 number
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <div className={`h-1.5 w-1.5 rounded-full ${passwordRules.special ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                                    At least 1 special character
                                  </li>
                                </ul>
                              </div>
                            )}

                            {password && (
                              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
                                <div className={`h-full rounded-full transition-all duration-300 ${current.bar}`} />
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="text-xs font-semibold text-foreground mb-1.5 block">Confirm Password</label>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                maxLength={64}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter password"
                                className={`h-12 w-full rounded-xl border bg-background px-4 pr-10 text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground ${confirmBorder}`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                              >
                                {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </button>
                            </div>
                            {isConfirmTouched && (
                              <p className={`mt-1.5 text-xs font-medium ${isPasswordMatch ? "text-emerald-500" : "text-red-500"}`}>
                                {isPasswordMatch ? "Passwords match" : "Passwords do not match"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


                  {/* ── RENDER PHASE 3: DYNAMIC GROUPS (ONE SECTION PER SCREEN) ── */}
                  {currentStepData.type === "dynamic_group" && (
                    <div className="space-y-6">
                      {currentStepData.dynamicSections?.map((section: any, idx: number) => (
                        <div key={idx} className="bg-white dark:bg-card p-6 rounded-2xl shadow-sm border border-border/60">
                          <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-3">
                            <div className="size-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                              {React.createElement(getIconComponent(section.icon), { className: "size-4" })}
                            </div>
                            <h3 className="text-lg font-bold">{section.label}</h3>
                          </div>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                            {section.fields.map((field: any, fieldIdx: number) => {
                              if (field.dependsOn) {
                                // Extract the relative field name since the data is nested under section.key
                                const parentKey = field.dependsOn.field.split('.').pop()!;
                                const parentValue = formData[section.key]?.[parentKey];
                                if (parentValue !== field.dependsOn.value) return null;
                              }
                              
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
                                    <ResponsiveSelect 
                                      className="h-10 w-full rounded-lg border-input bg-background px-3 text-sm"
                                      value={formData[section.key]?.[field.key] || ""}
                                      onChange={(e) => handleFieldChange(section.key, field.key, e.target.value)}
                                    >
                                      <option value="">Select...</option>
                                      {Array.isArray(field.options) ? field.options.map((opt: string) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      )) : null}
                                    </ResponsiveSelect>
                                  ) : field.type === 'date' ? (
                                    <DatePickerField 
                                      value={formData[section.key]?.[field.key]} 
                                      onChange={(date) => handleFieldChange(section.key, field.key, date)}
                                    />
                                  ) : field.type === 'number' ? (
                                    <Input 
                                      type="number" 
                                      className="h-10 rounded-lg px-3 text-sm" 
                                      placeholder="0" 
                                      value={formData[section.key]?.[field.key] || ""}
                                      onChange={(e) => handleFieldChange(section.key, field.key, e.target.value)}
                                    />
                                  ) : field.type === 'boolean' ? (
                                    <div className="flex items-center gap-2 h-10">
                                      <input 
                                        type="checkbox" 
                                        className="size-4 rounded border-input" 
                                        checked={!!formData[section.key]?.[field.key]}
                                        onChange={(e) => handleFieldChange(section.key, field.key, e.target.checked)}
                                      />
                                      <span className="text-sm font-medium">{field.label}</span>
                                    </div>
                                  ) : field.type === 'image' ? (
                                    <ImageUploadField 
                                      label={field.label} 
                                      value={formData[section.key]?.[field.key]}
                                      onChange={(base64) => handleFieldChange(section.key, field.key, base64)}
                                    />
                                  ) : (
                                    <Input 
                                      type="text" 
                                      className="h-10 rounded-lg px-3 text-sm" 
                                      placeholder={`Enter ${field.label.toLowerCase()}`} 
                                      value={formData[section.key]?.[field.key] || ""}
                                      onChange={(e) => handleFieldChange(section.key, field.key, e.target.value)}
                                    />
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
                    <div className="bg-white dark:bg-card p-8 rounded-2xl shadow-sm border border-border/60 text-center">
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
            <div className="bg-white dark:bg-card border-t border-border/50 p-4 px-6 md:px-10 flex items-center justify-between shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-20">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="h-10 px-4 text-sm font-medium rounded-lg cursor-pointer"
                >
                  <ChevronLeft className="mr-1 size-4" /> Back
                </Button>

              </div>

              <Button
                size="sm"
                onClick={() => void handleNext()}
                disabled={isSubmitting}
                className="h-10 px-6 text-sm font-semibold rounded-lg shadow-md shadow-primary/30 cursor-pointer"
              >
                {isSubmitting ? "Submitting..." : (currentStep === totalSteps - 1 ? "Submit Profile" : "Save & Continue")}
                {currentStep !== totalSteps - 1 && !isSubmitting && <ChevronRight className="ml-1 size-4" />}
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

// Completely custom Select component that perfectly matches the styling
// but uses absolutely zero portals, guaranteeing no Base UI / Radix conflicts
function CustomSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  dropdownClassName,
  dropUp = false
}: {
  value: string;
  onValueChange: (val: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  dropUp?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick, true);
    return () => document.removeEventListener("mousedown", onClick, true);
  }, [open]);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className="relative w-full text-sm">
      <button
        type="button"
        onMouseDown={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:ring-1 focus:ring-ring",
          className
        )}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {open && (
        <div 
          className={cn(
            "absolute z-[1000] max-h-56 w-full overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
            dropUp ? "bottom-full mb-1 origin-bottom" : "top-full mt-1 origin-top",
            dropdownClassName
          )}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="p-1">
            {options.map((opt) => (
              <div
                key={opt.value}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onValueChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  value === opt.value ? "bg-accent/50 text-accent-foreground font-medium" : ""
                )}
              >
                {value === opt.value && (
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <CheckCircle2 className="size-3.5" />
                  </span>
                )}
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DatePickerField({ value, onChange }: { value?: Date; onChange?: (date?: Date) => void }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(value);
  const [viewMonth, setViewMonth] = React.useState<Date>(value || new Date());
  
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = React.useState((value || new Date()).getMonth().toString());
  const [selectedYear, setSelectedYear] = React.useState((value || new Date()).getFullYear().toString());
  
  React.useEffect(() => {
    setInternalDate(value);
    if (value) {
      setViewMonth(value);
      setSelectedMonth(value.getMonth().toString());
      setSelectedYear(value.getFullYear().toString());
    }
  }, [value, isOpen]); // Reset internal date when reopening

  const handleSelect = (d: Date | undefined) => {
    if (d) {
      setInternalDate(d);
      setViewMonth(d);
      setSelectedMonth(d.getMonth().toString());
      setSelectedYear(d.getFullYear().toString());
    }
  };

  const handleMonthChange = (val: string) => {
    setSelectedMonth(val);
    const newMonth = new Date(parseInt(selectedYear), parseInt(val), 1);
    setViewMonth(newMonth);
  };

  const handleYearChange = (val: string) => {
    setSelectedYear(val);
    const newMonth = new Date(parseInt(val), parseInt(selectedMonth), 1);
    setViewMonth(newMonth);
  };

  const handleNavMonthChange = (newMonth: Date) => {
    setViewMonth(newMonth);
    setSelectedMonth(newMonth.getMonth().toString());
    setSelectedYear(newMonth.getFullYear().toString());
  };

  const handleApply = () => {
    if (internalDate) {
      onChange?.(internalDate);
    }
    setIsOpen(false);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December",
  ];
  const monthOptions = monthNames.map((m, i) => ({ label: m, value: i.toString() }));
  
  const yearOptions = Array.from({ length: 100 }, (_, i) => {
    const v = (currentYear - i).toString();
    return { label: v, value: v };
  });

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger
        render={
          <button
            type="button"
            className={cn(
              "h-10 w-full flex items-center justify-start text-left font-normal rounded-lg border border-input bg-background px-3 text-sm hover:bg-muted/50",
              !value && "text-muted-foreground"
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value ? format(value, "PPP") : <span>Pick a date</span>}
      </Popover.Trigger>
      
      <Popover.Portal>
        <Popover.Positioner sideOffset={4}>
          <Popover.Popup 
            className="z-[1050] w-[320px] p-0 flex flex-col rounded-xl bg-popover text-popover-foreground text-foreground shadow-2xl border border-border outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          >
            {/* Custom Month/Year Header */}
            <div className="flex items-center gap-2 p-3 pb-0">
              <div className="flex-1">
                <CustomSelect 
                  value={selectedMonth} 
                  onValueChange={handleMonthChange} 
                  options={monthOptions}
                  className="h-8 border-none bg-accent/50 hover:bg-accent font-semibold"
                  dropdownClassName="w-40 -ml-2"
                />
              </div>
              <div className="flex-1">
                <CustomSelect 
                  value={selectedYear} 
                  onValueChange={handleYearChange} 
                  options={yearOptions}
                  className="h-8 border-none bg-accent/50 hover:bg-accent font-semibold"
                  dropdownClassName="w-32"
                />
              </div>
            </div>

            <div className="px-3 pb-3">
              <Calendar
                mode="single"
                month={viewMonth}
                onMonthChange={handleNavMonthChange}
                selected={internalDate}
                fixedWeeks={true}
                showOutsideDays={true}
                onSelect={handleSelect}
                className="bg-transparent p-0 mt-3 flex justify-center"
                classNames={{
                  months: "bg-transparent",
                  month: "bg-transparent",
                  caption_label: "hidden",
                  table: "w-full border-collapse space-y-1 mx-auto",
                }}
              />
            </div>

            {/* Action Button exactly like NikhilTimeCalendar */}
            <div className="p-3 bg-muted/20 border-t border-border rounded-b-xl">
              <Button
                type="button"
                className="w-full bg-foreground text-background hover:bg-foreground/90 font-medium"
                onClick={handleApply}
              >
                Apply Date
              </Button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function ImageUploadField({ label, value, onChange, circular = false }: { label: string; value?: string; onChange?: (base64: string) => void; circular?: boolean }) {
  const [isCropOpen, setIsCropOpen] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState("");
  const [croppedImage, setCroppedImage] = React.useState<string | null>(value || null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync external value
  React.useEffect(() => {
    if (value) setCroppedImage(value);
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || "");
        setIsCropOpen(true);
      });
      const file = e.target.files[0];
      if (file) {
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCropComplete = async (blob: Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result as string;
      setCroppedImage(base64data);
      onChange?.(base64data);
    };
  };

  return (
    <div className="w-full flex justify-center">
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
      
      {!croppedImage ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed border-border p-4 flex flex-col items-center justify-center bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer text-center group",
            circular ? "size-48 md:size-56 rounded-full" : "w-full max-w-sm rounded-xl h-32"
          )}
        >
          <div className="size-10 bg-background rounded-full shadow-sm flex items-center justify-center mb-2">
            <Upload className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
      ) : (
        <div className={cn(
          "relative overflow-hidden shadow-lg border-2 border-border group",
          circular ? "size-48 md:size-56 rounded-full" : "w-32 h-32 rounded-xl"
        )}>
          <img src={croppedImage} alt="Cropped preview" className="w-full h-full object-cover" />
          <div 
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity backdrop-blur-[2px]"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="text-white text-xs font-semibold tracking-wider uppercase">Change</span>
          </div>
        </div>
      )}

      <ImageCropperModal
        isOpen={isCropOpen}
        onClose={() => {
          setIsCropOpen(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        imageSrc={imageSrc}
        onCropComplete={handleCropComplete}
        circularCrop={true}
        aspectRatio={1}
        title={`Crop ${label}`}
      />
    </div>
  );
}
