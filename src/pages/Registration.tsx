import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ShieldCheck, ArrowRight, ChevronRight, Check, Sparkles, Send, ShieldAlert, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "motion/react";
import logo from "@/assets/logo.svg";

export function Registration() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = i18n.language === "ar";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const normalizedEmail = email.trim().toLowerCase();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      toast("Please enter a valid email address.", "error");
      return;
    }

    setLoading(true);
    console.log("[Registration] Starting verification flow for:", normalizedEmail);
    
    try {
      if (!isSupabaseConfigured) {
        toast("Demo mode: Simulated verification email sent.", "success");
        setIsEmailSent(true);
        return;
      }

      // Switching to signInWithOtp for a true "Email Only" flow.
      // This will create the user if they don't exist and send a magic link.
      const { data, error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          shouldCreateUser: true, // This ensures it creates the account if first time
          data: {
            registration_state: 'pending_email_verification'
          }
        }
      });

      console.log("[Registration] Supabase Response:", { data, error });

      if (error) {
        console.error("[Registration] Supabase Error Details:", error);
        throw error;
      }

      setIsEmailSent(true);
      toast("Verification link sent! Please check your inbox.", "success");
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error("[Registration Error]", err);
      toast(err.message || "Failed to send verification link.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!isSupabaseConfigured || resendLoading || resendCountdown > 0) return;
    
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          shouldCreateUser: true,
          data: {
            registration_state: 'pending_email_verification'
          }
        }
      });
      
      if (error) {
        toast(error.message, "error");
      } else {
        toast("Verification link resent successfully.", "success");
        setResendCountdown(60);
      }
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setResendLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-[#050b14] text-white font-sans flex flex-col items-center justify-center py-20 px-6 relative overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none -z-10"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-xl bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-12 shadow-4xl text-center space-y-10 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
          
          <div className="w-24 h-24 mx-auto rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative animate-pulse-slow">
            <Send className="w-10 h-10 text-emerald-400 z-10" />
            <div className="absolute inset-0 bg-emerald-500/20 rounded-[2.5rem] blur-xl"></div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-tight">
              Verification Sent
            </h3>
            <p className="text-slate-400 text-base font-medium leading-relaxed italic">
              We've sent a secure link to <span className="text-emerald-400 font-bold font-mono underline decoration-emerald-500/30">{normalizedEmail}</span>.
            </p>
          </div>

          <div className="bg-white/5 rounded-3xl p-8 border border-white/5 space-y-6">
            <div className="flex items-start gap-4 text-left">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                <Check className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-sm text-slate-300 font-medium">Please check your <span className="text-white font-bold">inbox and spam folder</span>.</p>
            </div>
            <div className="flex items-start gap-4 text-left">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                <Check className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-sm text-slate-300 font-medium">Click the link in the email to verify your account.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleResend}
              disabled={resendLoading || resendCountdown > 0}
              className="w-full h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-emerald-500/20"
            >
              {resendLoading ? "Resending..." : resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend Verification Email"}
            </Button>
            
            <button 
              onClick={() => setIsEmailSent(false)}
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
            >
              Entered wrong email? Go back
            </button>
          </div>

          <div className="pt-6 border-t border-white/5">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
              LOMIXA IDENTITY PROTOCOL · SECURE NODE
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

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
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-[3.5rem] p-12 bg-slate-900/30 border border-white/5 backdrop-blur-xl shadow-3xl space-y-12"
        >
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">
              Begin Registration
            </h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-relaxed">
              Enter your email address to start your professional journey with LOMIXA.
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
                  placeholder="name@company.com"
                  className="h-16 pl-14 rounded-2xl bg-black/40 border-slate-800 font-bold focus:border-emerald-500 text-base"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-emerald-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                "Initialising..."
              ) : (
                <div className="flex items-center gap-3">
                  Verify & Continue
                  <ArrowRight className="w-5 h-5" />
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
      </main>
      
      <div className="mt-12 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-700">
          Professional Healthcare Infrastructure · MENA Region
        </p>
      </div>
    </div>
  );
}
