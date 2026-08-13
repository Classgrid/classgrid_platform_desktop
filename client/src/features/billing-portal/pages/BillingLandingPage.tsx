import { useEffect, useState } from "react";
import { Spinner } from "@/components/marketing_ui/spinner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/marketing_ui/card";

const steps = [
  {
    number: "01",
    title: "Get your invoice",
    desc: "Classgrid sends an invoice to your registered email when a payment is due.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Click Pay Now",
    desc: "Open the invoice on your admin dashboard and click the Pay Now button. You'll be redirected here.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Verify with OTP",
    desc: "A 6-digit code is sent to your admin email. Enter it to confirm your identity.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Complete payment",
    desc: "Razorpay checkout opens. Pay via UPI, card, or net banking. You're redirected back to your dashboard with a receipt.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
];

const DEMO_ENABLED = true; // Hardcoded for live test
const API_BASE = import.meta.env.VITE_API_URL || "https://api.classgrid.in";

function DemoCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const createSession = async () => {
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/billing/demo/session`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), payerName: "Razorpay Reviewer" })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      window.location.href = data.data.checkout_url;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-sm mb-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500">Razorpay Review — Test Checkout</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        This creates a real Razorpay test session. Enter your email to receive the OTP, then complete checkout with the test card credentials.
      </p>
      <div className="space-y-3">
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="Enter your email to receive OTP" 
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-amber-500 transition-colors"
        />
        <button 
          onClick={createSession} 
          disabled={loading}
          className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-black transition hover:bg-amber-400 flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Spinner className="w-4 h-4 text-black" /> : null}
          {loading ? "Creating Session..." : "Open Test Checkout →"}
        </button>
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
      </div>
    </div>
  );
}

export function BillingLandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.12),transparent_65%)]" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(to_right,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="relative flex min-h-screen flex-col">

        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <a
              href="https://classgrid.in"
              className="flex items-center gap-1.5 text-foreground transition-colors hover:text-foreground/90"
            >
              <img src="/logo.png" alt="Classgrid" className="h-10 w-auto object-contain" />
              <span className="text-xl font-semibold tracking-tight">Classgrid</span>
            </a>
            <div className="flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
              <span className="relative inline-flex h-2 w-2 rounded-[2px] bg-emerald-500">
                <span className="absolute inset-0 animate-ping rounded-[2px] bg-emerald-500 opacity-70" />
              </span>
              <span className="font-medium">Billing Portal</span>
            </div>
          </div>
        </header>

        {/* Main */}
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-[480px] space-y-6">

            {/* Hero block */}
            <div className="space-y-3 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-500">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Classgrid Billing Portal
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-[2rem]">
                SaaS Subscription Payments
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                This portal is for institution admins to pay their<br />
                Classgrid subscription invoice. All payments go via Razorpay.
              </p>
            </div>

            {/* Demo card — only visible when VITE_BILLING_DEMO_MODE=true */}
            {DEMO_ENABLED && <DemoCard />}

            {/* How it works card */}
            <div className="rounded-2xl border border-border bg-card/80 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm">
              <div className="p-7 sm:p-8">

                <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  How it works
                </p>

                <div className="space-y-0">
                  {steps.map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
                          {step.icon}
                        </div>
                        {i < steps.length - 1 && (
                          <div className="my-1 w-px flex-1 bg-border" />
                        )}
                      </div>

                      <div className={`pb-5 ${i === steps.length - 1 ? "pb-0" : ""}`}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold tracking-widest text-muted-foreground/60">{step.number}</span>
                          <p className="text-sm font-semibold text-foreground">{step.title}</p>
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Verified by</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "256-bit SSL", sub: "Encrypted" },
                    { label: "PCI-DSS", sub: "Via Razorpay" },
                    { label: "OTP-verified", sub: "Identity check" },
                  ].map((badge) => (
                    <div
                      key={badge.label}
                      className="flex flex-col items-center rounded-xl border border-border bg-muted/40 px-3 py-3 text-center"
                    >
                      <span className="text-xs font-semibold text-foreground">{badge.label}</span>
                      <span className="mt-0.5 text-[10px] text-muted-foreground">{badge.sub}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                  To pay your invoice, open it from your admin dashboard and click Pay Now.
                </p>
              </div>
            </div>

            {/* Compliance & Contact Footer for Payment Gateways */}
            <div className="flex flex-col items-center gap-2 text-center text-[11px] text-muted-foreground mt-8">
              <p className="text-foreground/80 font-medium text-xs">Classgrid Technologies</p>
              <p>Support: <a href="mailto:support@classgrid.in" className="transition hover:text-foreground">support@classgrid.in</a></p>
              
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 mt-2">
                <a href="https://classgrid.in/refund-policy" target="_blank" className="transition hover:text-foreground underline-offset-2 hover:underline">
                  Refund & Cancellation Policy
                </a>
                <span className="text-border">•</span>
                <a href="https://classgrid.in/privacy" target="_blank" className="transition hover:text-foreground underline-offset-2 hover:underline">
                  Privacy Policy
                </a>
                <span className="text-border">•</span>
                <a href="https://classgrid.in/terms" target="_blank" className="transition hover:text-foreground underline-offset-2 hover:underline">
                  Terms & Conditions
                </a>
                <span className="text-border">•</span>
                <a href="https://classgrid.in/contact" target="_blank" className="transition hover:text-foreground underline-offset-2 hover:underline">
                  Contact Us
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
