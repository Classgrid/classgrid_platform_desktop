import { Link } from "react-router-dom";

export function BillingLandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background — exact match with marketing site */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.18),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="relative flex min-h-screen flex-col">
        {/* Header — exact match with marketing login */}
        <div className="px-6 pt-6 sm:px-8 sm:pt-8">
          <a
            href="https://classgrid.in"
            className="inline-flex items-center text-xl font-black tracking-tighter text-foreground"
          >
            CLASSGRID.
          </a>
        </div>

        {/* Main content */}
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-[460px]">
            {/* Card — exact same style as marketing login card */}
            <div className="rounded-2xl border border-border bg-card/90 shadow-[0_30px_100px_rgba(0,0,0,0.38)] backdrop-blur-sm">
              <div className="p-8 sm:p-10">
                <div className="mb-8 space-y-3">
                  <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    Secure Billing Portal
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-[2.1rem]">
                      Classgrid Checkout
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-[15px]">
                      Secure payment portal for Classgrid — India's unified ERP
                      infrastructure for modern institutions.
                    </p>
                  </div>
                </div>

                {/* Info section */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3.5">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-primary">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Institutional Fee Payments</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Students pay tuition, admission, and examination fees directly to their institution.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3.5">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-primary">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Platform Subscriptions</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Institutions pay their Classgrid SaaS subscription securely through this portal.</p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-7 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Security
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Security badges */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-primary"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <span>256-bit SSL encryption</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-primary"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>PCI-DSS compliant via Razorpay</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span>OTP-verified checkout flow</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-8 text-center text-sm text-muted-foreground">
                  To complete a payment, use the secure link provided by your institution.
                </div>
              </div>
            </div>

            {/* Footer links — exact match with marketing login */}
            <div className="mt-7 text-center text-sm text-muted-foreground">
              <a href="https://classgrid.in/privacy" className="transition hover:text-foreground">
                Privacy Policy
              </a>{" "}
              and{" "}
              <a href="https://classgrid.in/terms" className="transition hover:text-foreground">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
