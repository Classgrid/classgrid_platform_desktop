import { useEffect, useState } from "react";

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

const DEMO_ENABLED = true; // Hardcoded for Razorpay review. See cleanup plan to remove.
const API_BASE = import.meta.env.VITE_API_URL || "https://api.classgrid.in";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="ml-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold transition bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function DemoCard() {
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  // On mount, check if active session exists
  useEffect(() => {
    fetch(`${API_BASE}/api/billing/demo/status`)
      .then(r => r.json())
      .then(d => { if (d.enabled && d.has_active_session) setCheckoutUrl(null); })
      .catch(() => {});
  }, []);

  const createSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/billing/demo/session`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      setCheckoutUrl(data.data.checkout_url);
      setCreated(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </span>
        <p className="text-xs font-semibold text-amber-400 uppercase tracking-[0.15em]">
          Razorpay Review — Test Checkout
        </p>
      </div>

      <p className="text-xs text-muted-foreground leading-5">
        This creates a real Razorpay test session. Enter the OTP below, then complete checkout with the test card credentials.
      </p>

      {!checkoutUrl ? (
        <button
          id="demo-create-session-btn"
          onClick={createSession}
          disabled={loading}
          className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-60"
        >
          {loading ? "Creating session…" : "Open Test Checkout →"}
        </button>
      ) : (
        <a
          id="demo-checkout-link"
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-xl bg-amber-500 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-amber-400"
        >
          Open Checkout →
        </a>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Test credentials — always visible */}
      <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Test Credentials</p>

        {[
          { label: "OTP", value: "123456" },
          { label: "Card Number", value: "4111 1111 1111 1111" },
          { label: "Card Expiry", value: "12/27" },
          { label: "CVV", value: "123" },
          { label: "Card OTP", value: "123456" },
          { label: "UPI ID", value: "success@razorpay" },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{item.label}</span>
            <div className="flex items-center">
              <code className="text-xs font-mono font-bold text-foreground">{item.value}</code>
              <CopyButton value={item.value} />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-center">
        This test session expires in 48 hours. No real money is charged.
      </p>
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

            {/* Footer links */}
            <div className="text-center text-xs text-muted-foreground">
              <a href="https://classgrid.in/privacy" className="transition hover:text-foreground underline-offset-2 hover:underline">
                Privacy Policy
              </a>
              {" · "}
              <a href="https://classgrid.in/terms" className="transition hover:text-foreground underline-offset-2 hover:underline">
                Terms of Service
              </a>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
