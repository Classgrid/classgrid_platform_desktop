import { Link } from "react-router-dom";

export function BillingLandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04] [background-image:linear-gradient(to_right,rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.1)_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="relative flex min-h-screen flex-col">
        {/* Header */}
        <div className="px-6 pt-6 sm:px-8 sm:pt-8 flex justify-center sm:justify-start">
          <a href="https://classgrid.in" className="inline-flex items-center">
            <img src="/classgrid-icon.png" alt="Classgrid" className="h-8 w-auto hidden dark:block" onError={(e) => { e.currentTarget.src = "/logo.png"; }} />
            <img src="/classgrid-icon-light.png" alt="Classgrid" className="h-8 w-auto block dark:hidden" onError={(e) => { e.currentTarget.src = "/logo.png"; }} />
            <span className="ml-3 text-xl font-black tracking-tighter text-foreground">CLASSGRID.</span>
          </a>
        </div>

        {/* Main content */}
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-[520px] text-center">

            {/* Badge */}
            <div className="mb-6 inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Secure Billing Portal
            </div>

            {/* Heading */}
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
              Classgrid Secure Checkout
            </h1>
            <p className="text-[16px] leading-7 text-muted-foreground mb-10">
              This is the official payment portal for <strong>Classgrid</strong> — India's modern ERP platform for educational institutions.
              <br /><br />
              To complete a payment, please use the secure link provided by your institution or Classgrid.
            </p>

            {/* Info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 text-left">
              <div className="rounded-xl border border-border bg-card/80 p-5">
                <div className="text-lg mb-1">🏫</div>
                <h3 className="font-semibold text-foreground text-sm mb-1">Institutional Fee Payments</h3>
                <p className="text-xs text-muted-foreground">Students pay tuition, admission and examination fees directly to their institution.</p>
              </div>
              <div className="rounded-xl border border-border bg-card/80 p-5">
                <div className="text-lg mb-1">🔒</div>
                <h3 className="font-semibold text-foreground text-sm mb-1">Platform Subscriptions</h3>
                <p className="text-xs text-muted-foreground">Institutions pay their Classgrid SaaS subscription securely through this portal.</p>
              </div>
            </div>

            {/* Security badges */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground mb-8">
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                256-bit SSL Encryption
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Secured by Razorpay
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><polyline points="20 6 9 17 4 12"></polyline></svg>
                PCI-DSS Compliant
              </span>
            </div>

            {/* CTA */}
            <a
              href="https://classgrid.in"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              ← Back to Classgrid
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="py-6 text-center text-xs text-muted-foreground">
          <div className="flex items-center justify-center gap-4">
            <a href="https://classgrid.in/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="https://classgrid.in/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="https://classgrid.in" className="hover:text-foreground transition-colors">classgrid.in</a>
          </div>
          <p className="mt-3">© {new Date().getFullYear()} Classgrid. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
