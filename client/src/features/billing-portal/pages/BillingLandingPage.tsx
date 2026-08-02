import { Link } from "react-router-dom";

const steps = [
  {
    number: "01",
    title: "Open your secure link",
    desc: "Click the payment link sent by your institution or Classgrid.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Enter & verify OTP",
    desc: "A 6-digit code is sent to your registered email. Enter it to verify your identity.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Click Pay",
    desc: "After OTP is verified, the Razorpay checkout opens. Complete your payment securely.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Redirected back",
    desc: "Payment confirmed. You're instantly redirected back to your dashboard.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
];

export function BillingLandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.12),transparent_65%)]" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(to_right,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="relative flex min-h-screen flex-col">

        {/* Header — exact match with marketing */}
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <a
              href="https://classgrid.in"
              className="flex items-center gap-2.5 text-foreground hover:opacity-80 transition-opacity"
            >
              <img src="/logo.png" alt="Classgrid" className="h-7 w-7 object-contain" />
              <span className="text-xl font-black tracking-tighter">CLASSGRID.</span>
            </a>
            <div className="flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
              <span className="relative inline-flex h-2 w-2 rounded-[2px] bg-emerald-500">
                <span className="absolute inset-0 animate-ping rounded-[2px] bg-emerald-500 opacity-70" />
              </span>
              <span className="font-medium">Secure Billing Portal</span>
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
                Classgrid Secure Checkout
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-[2rem]">
                Secure Payment Portal
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                India's unified ERP infrastructure for modern institutions.<br />
                All payments are OTP-verified and processed via Razorpay.
              </p>
            </div>

            {/* Card */}
            <div className="rounded-2xl border border-border bg-card/80 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm">
              <div className="p-7 sm:p-8">

                {/* How it works */}
                <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  How it works
                </p>

                <div className="space-y-0">
                  {steps.map((step, i) => (
                    <div key={i} className="flex gap-4">
                      {/* Left: number + connector line */}
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
                          {step.icon}
                        </div>
                        {i < steps.length - 1 && (
                          <div className="my-1 w-px flex-1 bg-border" />
                        )}
                      </div>

                      {/* Right: content */}
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

                {/* Divider */}
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Security</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Security badges */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    { label: "256-bit SSL", sub: "Encrypted connection" },
                    { label: "PCI-DSS", sub: "Via Razorpay" },
                    { label: "OTP-verified", sub: "Identity confirmation" },
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

                {/* CTA note */}
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  To complete a payment, use the secure link provided by your institution.
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
