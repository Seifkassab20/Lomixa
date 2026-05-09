import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ShieldCheck, ArrowRight, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "motion/react";
import logo from "@/assets/logo.svg";

export function RegisterPhase1() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = i18n.language === "ar";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [showExistsModal, setShowExistsModal] = useState(false);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        toast("Demo mode: Simulated verification email sent.", "success");
        setIsPending(true);
        return;
      }

      // Generate a highly secure random temporary password
      const tempPassword = Math.random().toString(36).slice(-10) + "A1!" + crypto.randomUUID();

      const { data, error } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: {
            registration_state: 'pending_email_verification'
          }
        }
      });

      console.log("[Registration Debug] Supabase Response:", { 
        user: data?.user?.id ? "Created" : "Failed", 
        session: data?.session ? "Active (Auto-confirmed)" : "None (Verification required)",
        identities: data?.user?.identities?.length || 0,
        error: error?.message || "None"
      });

      if (error) {
        if (error.message.includes("already registered")) {
          throw new Error("This email is already registered. Please log in.");
        }
        throw new Error(`Registration failed: ${error.message}`);
      }

      // If a session is returned, the user was auto-confirmed or already logged in.
      if (data?.session) {
        navigate("/");
        return;
      }

      // identities: 0 means the user already exists in Supabase.
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setShowExistsModal(true);
        return;
      }

      setIsPending(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!isSupabaseConfigured || resendLoading || resendCountdown > 0) return;
    
    setResendLoading(true);
    toast("Resending verification email...", "info");
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      
      if (error) {
        toast(error.message, "error");
      } else {
        toast("Verification email resent successfully.", "success");
        setResendCountdown(60); // 60 seconds cooldown
      }
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#050b14] text-white font-sans flex flex-col items-center py-20 px-6 relative overflow-x-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none -z-10"></div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl mx-auto mb-16 flex flex-col items-center gap-6"
      >
        <Link to="/" className="flex flex-col items-center gap-6 group">
          <div className="bg-white rounded-[2rem] p-4 w-24 h-24 shadow-2xl transition-all group-hover:scale-105 group-hover:rotate-2">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-5xl font-black italic tracking-tighter uppercase text-white leading-none">
            {t("appName")}
          </span>
        </Link>
      </motion.div>

      <main className="w-full max-w-xl flex-1">
        <AnimatePresence mode="wait">
          {!isPending ? (
            <motion.div
              key="phase1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="rounded-[3.5rem] p-12 bg-slate-900/30 border border-white/5 backdrop-blur-xl shadow-3xl space-y-12"
            >
              <div className="space-y-4 text-center">
                <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">
                  Identity Verification
                </h1>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest leading-relaxed">
                  Enter your email address to begin the secure registration process.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest italic">
                    Email Address*
                  </Label>
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within/input:text-emerald-500 transition-colors" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your professional email"
                      className="h-16 pl-14 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500 text-base"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full h-16 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    t("processing") || "Processing..."
                  ) : (
                    <div className="flex items-center gap-3">
                      Verify Identity
                      <ChevronRight className={cn("w-5 h-5", isRTL && "rotate-180")} />
                    </div>
                  )}
                </Button>

                <div className="text-center pt-4 border-t border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center justify-center gap-4">
                    <span>{t("alreadyHaveAccount")}</span>
                    <Link
                      to="/login"
                      className="text-emerald-500 hover:text-white transition-all underline underline-offset-8 decoration-emerald-500/30"
                    >
                      {t("signIn")}
                    </Link>
                  </p>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="pending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-10 rounded-[3.5rem] p-12 bg-slate-900/30 border border-emerald-500/20 backdrop-blur-xl shadow-3xl"
            >
              <div className="w-32 h-32 mx-auto rounded-[3rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-2xl shadow-emerald-500/20 relative animate-pulse-slow">
                <ShieldCheck className="w-16 h-16 text-emerald-400 relative z-10" />
                <div className="absolute inset-0 bg-emerald-500/20 rounded-[3rem] blur-xl"></div>
              </div>

              <div className="space-y-6">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                  Verification Sent
                </h2>
                <div className="bg-black/40 p-6 rounded-3xl border border-white/5 inline-block">
                  <p className="text-emerald-400 font-bold font-mono tracking-wider">{email}</p>
                </div>
                <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed text-sm">
                  We have sent a secure verification link to your email address. Please click the link to verify your identity and continue the registration process.
                </p>
              </div>

              <div className="pt-8 border-t border-white/5 space-y-6 flex flex-col items-center">
                <p className="text-xs text-slate-500 font-black uppercase tracking-widest italic">
                  Didn't receive the email?
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={handleResend}
                    disabled={resendLoading || resendCountdown > 0}
                    variant="outline"
                    className="h-14 px-8 rounded-2xl border-slate-700 bg-slate-900 text-white font-black uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-50"
                  >
                    {resendLoading ? "Sending..." : resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend Email"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Existing Email Modal */}
      <AnimatePresence>
        {showExistsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 shadow-4xl text-center space-y-8"
            >
              <div className="w-20 h-20 mx-auto rounded-[2rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Mail className="w-10 h-10 text-amber-500" />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-tight">
                  Email Already Registered
                </h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed italic">
                  The email <span className="text-white font-bold">{email}</span> is already associated with a LOMIXA account. Please use a different email address or sign in to your existing account.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => setShowExistsModal(false)}
                  className="h-14 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest text-[10px] hover:bg-slate-200"
                >
                  Use Another Email
                </Button>
                <Link to="/login" className="w-full">
                  <Button 
                    variant="ghost"
                    className="w-full h-14 rounded-2xl text-slate-500 hover:text-white font-black uppercase tracking-widest text-[10px]"
                  >
                    Go to Login
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
