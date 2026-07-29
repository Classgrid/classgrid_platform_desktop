import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/marketing_ui/input-otp";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "invalid">("loading");
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract token from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenParam = searchParams.get("token");
    
    if (!tokenParam) {
      setStatus("invalid");
      return;
    }

    setToken(tokenParam);
    // Ideally, we'd verify the token exists and is valid here.
    // For now, we'll assume it's valid and get the email if possible from the backend, 
    // or just let them enter the OTP. The OTP goes to the email that initiated it.
    // Let's just set it to ready. The backend expects the token and OTP.
    setStatus("ready");
  }, [location.search]);

  async function handleResendOtp() {
    setSendingOtp(true);
    setError(null);
    try {
      // In a real implementation, you might need a route to resend OTP based on the token
      // await apiClient.post("/api/billing/handoff/resend-otp", { token });
      toast.info("A new code would be sent here (Backend route needed for resend).");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to resend code.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) return;
    setSubmitting(true);
    setError(null);

    try {
      // 1. Verify OTP with the backend
      const response = await apiClient.post("/api/billing/checkout/verify-otp", {
        token,
        otp
      });

      const { razorpay_order_id, razorpay_key_id, amount, currency, organization_id, email, return_url } = response.data;

      // 2. Open Razorpay Modal
      const options = {
        key: razorpay_key_id,
        amount: amount,
        currency: currency,
        name: "Secure Checkout",
        description: "Complete your payment",
        order_id: razorpay_order_id,
        handler: async function (response: any) {
          try {
            // 3. Confirm Payment with backend
            toast.loading("Verifying payment...", { id: "payment-verify" });
            const confirmResponse = await apiClient.post("/api/billing/checkout/confirm", {
              token,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });

            toast.success("Payment Successful! Redirecting...", { id: "payment-verify" });
            
            // 4. Redirect back
            setTimeout(() => {
              window.location.href = confirmResponse.data.return_url || return_url;
            }, 1500);

          } catch (confirmError) {
            console.error("Confirmation error", confirmError);
            toast.error("Payment verification failed. Please contact support.", { id: "payment-verify" });
          }
        },
        prefill: {
          email: email
        },
        theme: {
          color: "#10b981"
        },
        modal: {
          ondismiss: function() {
            setSubmitting(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        console.error(response.error);
        toast.error(response.error.description || "Payment failed");
        setSubmitting(false);
      });
      rzp.open();

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Invalid OTP or session expired.");
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return <div className="h-screen w-screen bg-background dark:bg-[#080808]" />;
  }

  if (status === "invalid") {
    return (
      <main className="relative min-h-screen overflow-hidden bg-background text-foreground flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-2xl font-bold mb-2">Payment Completed or Link Expired</h2>
        <p className="text-muted-foreground mb-6">This checkout link is no longer valid.</p>
        <button onClick={() => window.history.back()} className="h-10 px-6 rounded-lg bg-primary font-semibold text-primary-foreground transition hover:brightness-110">
          Go Back
        </button>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background gradients matching Marketing UI but adapted for light/dark mode */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04] [background-image:linear-gradient(to_right,rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.1)_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="relative flex min-h-screen flex-col">
        <div className="px-6 pt-6 sm:px-8 sm:pt-8 flex justify-center sm:justify-start">
          <Link to="/" className="inline-flex items-center">
            <img src="/classgrid-icon.png" alt="Classgrid" className="h-8 w-auto hidden dark:block" onError={(e) => { e.currentTarget.src = "/logo.png"; }} />
            <img src="/classgrid-icon-light.png" alt="Classgrid" className="h-8 w-auto block dark:hidden" onError={(e) => { e.currentTarget.src = "/logo.png"; }} />
            <span className="ml-3 text-xl font-black tracking-tighter text-foreground">CLASSGRID.</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-[460px]">
            <div className="rounded-2xl border border-border bg-card/90 shadow-[0_30px_100px_rgba(0,0,0,0.38)] backdrop-blur-sm">
              <div className="p-8 sm:p-10">
                <div className="mb-8 space-y-3 text-center">
                  <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    Secure Checkout
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mt-4">
                      Verify your identity
                    </h1>
                    <p className="mt-2 text-[15px] leading-6 text-muted-foreground">
                      We sent a 6-digit code to your registered email.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="space-y-2 flex flex-col items-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={setOtp}
                        pattern="\d*"
                        containerClassName="w-full justify-center"
                      >
                        <InputOTPGroup className="gap-3 sm:gap-4">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                              className="h-16 w-12 sm:h-[72px] sm:w-[60px] rounded-xl border-2 border-input bg-background text-2xl sm:text-3xl font-black data-[active=true]:border-primary data-[active=true]:ring-4 data-[active=true]:ring-primary/20 shadow-sm transition-all"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <div className="flex justify-center mt-6">
                       <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={sendingOtp || submitting}
                          className="text-sm font-medium text-primary transition hover:text-primary/80 disabled:opacity-60"
                        >
                          {sendingOtp ? "Resending..." : "Didn't receive the code? Resend"}
                        </button>
                    </div>
                  </div>

                  {error ? (
                    <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={submitting || otp.length !== 6}
                    className="mt-6 h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-primary/25"
                  >
                    {submitting ? "Processing..." : "Verify & Pay"}
                  </button>
                </div>
                
                <div className="mt-8 flex items-center justify-center gap-2">
                   <LockIcon /> <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-[0.15em]">Secured by Razorpay</span>
                </div>
              </div>
            </div>

            {/* Legal Links Footer */}
            <div className="mt-8 text-center text-sm text-muted-foreground">
              <Link to="/privacy" className="transition hover:text-foreground">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link to="/terms" className="transition hover:text-foreground">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
}
