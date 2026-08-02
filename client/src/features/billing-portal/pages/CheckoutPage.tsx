import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/marketing_ui/input-otp";
import { Button } from "@/components/marketing_ui/button";
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
    
    // Verify token validity with backend
    apiClient.get(`/api/billing/checkout/session?token=${tokenParam}`)
      .then((res) => {
        if (res.data?.success) {
          setStatus("ready");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => {
        setStatus("invalid");
      });
  }, [location.search]);

  async function handleResendOtp() {
    setSendingOtp(true);
    setError(null);
    try {
      await apiClient.post("/api/billing/handoff/resend-otp", { token });
      toast.success("A new code has been sent to your email.");
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
        <Button onClick={() => window.history.back()} size="lg" className="px-6 rounded-lg font-semibold">
          Go Back
        </Button>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background — EXACT copy from marketing LoginPageClient.tsx */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.18),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="relative flex min-h-screen flex-col">
        {/* Header — EXACT copy from marketing LoginPageClient.tsx */}
        <div className="px-6 pt-6 sm:px-8 sm:pt-8">
          <Link
            to="/"
            className="inline-flex items-center text-xl font-black tracking-tighter text-foreground"
          >
            CLASSGRID.
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-[460px]">
            {/* Card — EXACT copy from marketing LoginPageClient.tsx */}
            <div className="rounded-2xl border border-border bg-card/90 shadow-[0_30px_100px_rgba(0,0,0,0.38)] backdrop-blur-sm">
              <div className="p-8 sm:p-10">
                <div className="mb-8 space-y-3">
                  <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    Secure Checkout
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-[2.1rem]">
                      Verify your identity
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-[15px]">
                      We sent a 6-digit code to your registered email.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* OTP — centered and bigger */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Enter your code
                      </label>
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={setOtp}
                        pattern="\d*"
                        containerClassName="w-full"
                      >
                        <InputOTPGroup className="w-full justify-center gap-3">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                              className="h-14 w-12 sm:h-14 sm:w-14 rounded-xl border border-input bg-background/80 text-xl font-bold data-[active=true]:border-primary data-[active=true]:ring-2 data-[active=true]:ring-primary/25"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span className="font-medium">Check your email inbox</span>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={sendingOtp || submitting}
                        className="font-medium text-primary transition hover:text-primary/80 disabled:opacity-60"
                      >
                        {sendingOtp ? "Resending..." : "Resend code"}
                      </button>
                    </div>
                  </div>

                  {error ? (
                    <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </p>
                  ) : null}

                  {/* Button — EXACT same classes from marketing LoginPageClient.tsx */}
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={submitting || otp.length !== 6}
                    className="h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Processing..." : "Verify & Pay"}
                  </button>
                </div>

                <div className="mt-8 text-center text-sm text-muted-foreground">
                  <LockIcon /> Secured by Razorpay
                </div>
              </div>
            </div>

            {/* Footer — EXACT copy from marketing LoginPageClient.tsx */}
            <div className="mt-7 text-center text-sm text-muted-foreground">
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
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1.5 text-muted-foreground">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
}
