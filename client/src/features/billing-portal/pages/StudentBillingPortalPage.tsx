import { Link } from "react-router-dom";

export function StudentBillingPortalPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_60%)]" />
      </div>

      <img src="/classgrid-icon.png" alt="Classgrid" className="h-12 w-auto mb-6 hidden dark:block" onError={(e) => { e.currentTarget.src = "/logo.png"; }} />
      <img src="/classgrid-icon-light.png" alt="Classgrid" className="h-12 w-auto mb-6 block dark:hidden" onError={(e) => { e.currentTarget.src = "/logo.png"; }} />

      <h1 className="text-3xl font-bold tracking-tight mb-2">Student Fee Portal</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        The unified student fee payment portal is currently under development. Check back soon.
      </p>

      <div className="rounded-xl border border-border bg-card/50 p-6 max-w-sm w-full backdrop-blur-sm">
        <div className="space-y-4">
          <div className="h-10 w-full animate-pulse rounded-md bg-muted/60" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted/60" />
          <div className="h-12 w-full animate-pulse rounded-md bg-primary/20" />
        </div>
      </div>
    </main>
  );
}
