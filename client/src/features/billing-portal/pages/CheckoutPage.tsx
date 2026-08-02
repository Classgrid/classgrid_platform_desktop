import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { Spinner } from "@/components/marketing_ui/spinner";

const OTP_TTL_SECONDS = 60;

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function CheckoutPage() {
  const location = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "invalid">("loading");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [email, setEmail] = useState("");
  
  const [countdown, setCountdown] = useState(0);
  const [otpExpired, setOtpExpired] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCountdown = () => {
    setCountdown(OTP_TTL_SECONDS);
    setOtpExpired(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setOtpExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    // Better approach: Read from localStorage or cross-subdomain cookie instead of ugly URL params
    const localTheme = localStorage.getItem("vite-ui-theme");
    const themeCookie = document.cookie.split('; ').find(row => row.startsWith('theme='))?.split('=')[1];
    const themeToUse = themeCookie || localTheme;

    if (themeToUse === "dark") {
      document.documentElement.classList.add("dark");
    } else if (themeToUse === "light") {
      document.documentElement.classList.remove("dark");
    }

    const searchParams = new URLSearchParams(location.search);
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setStatus("invalid");
      return;
    }
    setToken(tokenParam);
    apiClient.get(`/api/billing/checkout/session?token=${tokenParam}`)
      .then((res) => {
        if (res.data?.success) {
          setStatus("ready");
          setEmail(res.data.data?.maskedEmail || res.data.email || "your registered email");
          startCountdown();
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => {
        setStatus("invalid");
      });
      
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [location.search]);

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post("/api/billing/checkout/verify-otp", {
        token,
        otp
      });
      const { 
        razorpay_order_id, 
        razorpay_key_id, 
        amountPaise: amount, 
        currency, 
        email: customerEmail, 
        return_url 
      } = response.data.data || response.data;
      
      const options = {
        key: razorpay_key_id,
        amount,
        currency,
        name: "Secure Checkout",
        description: "Complete your payment",
        order_id: razorpay_order_id,
        handler: async function (response: any) {
          try {
            toast.loading("Verifying payment...", { id: "payment-verify" });
            const confirmResponse = await apiClient.post("/api/billing/checkout/confirm", {
              token,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.success("Payment Successful! Redirecting...", { id: "payment-verify" });
            setTimeout(() => {
              window.location.href = confirmResponse.data.return_url || return_url;
            }, 1500);
          } catch (confirmError) {
            console.error("Confirmation error", confirmError);
            toast.error("Payment verification failed. Please contact support.", { id: "payment-verify" });
          }
        },
        prefill: { email: customerEmail },
        theme: { 
          // Razorpay standard checkout does not have a true "dark mode" for the modal body.
          // The color property sets the header and button colors. 
          // Using our brand slate-900 ensures good contrast and a premium look in both themes.
          color: "#0f172a" 
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        console.error(response.error);
        toast.error(response.error.description || "Payment failed");
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Invalid OTP or session expired.");
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Spinner className="w-6 h-6 text-muted-foreground" />
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <main className="relative min-h-screen overflow-hidden bg-background text-foreground flex flex-col items-center justify-center text-center p-6 font-sans">
        <h2 className="text-2xl font-bold mb-2">Payment Completed or Link Expired</h2>
        <p className="text-muted-foreground mb-6">This checkout link is no longer valid.</p>
        <button onClick={() => window.history.back()} className="h-12 rounded-xl bg-slate-900 px-6 font-semibold text-white transition hover:brightness-110 dark:bg-[#2a2a2a]">
          Go Back
        </button>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative font-sans checkout-otp-container" style={{ "--ring": "#444444", "--color-ring": "#444444" } as any}>
      <style>{`
        .checkout-otp-container,
        .checkout-otp-container *,
        .checkout-otp-container *:focus-visible,
        .checkout-otp-container *:focus {
          outline: none !important;
          box-shadow: none !important;
          --tw-ring-color: transparent !important;
          --tw-ring-shadow: none !important;
        }
        /* Specifically target the hidden input that input-otp creates */
        .checkout-otp-container input,
        .checkout-otp-container input:focus,
        .checkout-otp-container input:focus-visible {
          border: none !important;
          background: transparent !important;
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>
      
      {/* Top Left Logo - exactly like marketing */}
      <Link to="/" className="absolute top-6 left-8 flex items-center gap-1.5 hover:opacity-80 transition-opacity">
        <img src="/logo.png" alt="Classgrid Logo" className="h-10 w-auto object-contain" />
        <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-[#f1f1f1]">Classgrid</span>
      </Link>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        
        <div className="w-full max-w-[400px]">
          
          <div className="mb-8 text-center space-y-1">
            <h1 className="text-3xl font-medium tracking-tight text-slate-900 dark:text-[#f1f1f1]">Check your email</h1>
            <p className="text-[14px] text-slate-500 dark:text-[#888888]">After verifying, the payment checkout will open.</p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="flex flex-col items-center gap-3">

              
              {/* Custom OTP implementation to guarantee no hidden styles/green lines */}
              <div className="flex items-center gap-2" dir="ltr">
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const isActive = otp.length === index;
                  return (
                    <div
                      key={index}
                      className={`relative flex h-12 w-10 items-center justify-center rounded-md border text-lg font-medium transition-all ${
                        isActive
                          ? "border-slate-400 dark:border-[#555] z-10"
                          : "border-slate-200 dark:border-[#2a2a2a] hover:border-slate-300 dark:hover:border-[#3a3a3a]"
                      } bg-white text-slate-900 dark:bg-[#161616] dark:text-[#f1f1f1]`}
                    >
                      {otp[index] || ""}
                      {isActive && !otpExpired && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <div className="h-4 w-px animate-pulse bg-slate-900 dark:bg-[#f1f1f1]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <input 
                type="text" 
                value={otp} 
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
                  setOtp(val);
                }}
                disabled={otpExpired}
                className="absolute opacity-0 w-[240px] h-12 z-20 cursor-text"
                style={{ top: 'auto', left: 'auto', outline: 'none', border: 'none', boxShadow: 'none' }}
                autoFocus
              />

              {/* Timer / Resend */}
              <div className="text-[13px] text-center">
                {otpExpired ? (
                  <span className="text-red-400">Code expired. </span>
                ) : countdown > 0 ? (
                  <span className="text-slate-500 dark:text-[#888888]">
                    Code expires in{" "}
                    <span className={`font-mono font-semibold tabular-nums ${
                      countdown <= 10 ? "text-red-400" : "text-slate-900 dark:text-[#f1f1f1]"
                    }`}>
                      {formatCountdown(countdown)}
                    </span>
                  </span>
                ) : null}
                {" "}
                <button
                  type="button"
                  onClick={async () => {
                    setError("");
                    setOtp("");
                    setLoading(true);
                    try {
                      await apiClient.post("/api/billing/handoff/resend-otp", { token });
                      startCountdown();
                    } catch (err: any) {
                      setError(err.response?.data?.error || "Failed to resend");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || (countdown > 0 && !otpExpired)}
                  className="text-slate-900 underline underline-offset-2 transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30 dark:text-[#f1f1f1]"
                >
                  Resend code
                </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm font-medium text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading || otp.length !== 6 || otpExpired}
              className="flex w-full items-center justify-center rounded-md bg-slate-900 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 dark:bg-[#2a2a2a] dark:text-[#f1f1f1] dark:hover:bg-[#333]"
            >
              {loading ? <><Spinner className="w-4 h-4 text-inherit mr-2" /> Verify & Pay</> : "Verify & Pay"}
            </button>
          </form>

        </div>

      </div>

      <div className="absolute bottom-6 w-full text-center">
        <p className="text-[13px] text-slate-400 dark:text-[#666666]">
          <a href="https://classgrid.in/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 decoration-slate-300 transition-colors hover:text-slate-900 dark:decoration-[#444] dark:hover:text-[#f1f1f1]">Terms of Service</a>
          {" "}and{" "}
          <a href="https://classgrid.in/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 decoration-slate-300 transition-colors hover:text-slate-900 dark:decoration-[#444] dark:hover:text-[#f1f1f1]">Privacy Policy</a>
        </p>
      </div>

    </div>
  );
}
