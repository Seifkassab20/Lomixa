import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { emailVerified, refreshVerificationStatus } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Give it a moment to sync with Supabase session
    const timer = setTimeout(() => {
      refreshVerificationStatus().finally(() => setLoading(false));
    }, 1500);
    return () => clearTimeout(timer);
  }, [refreshVerificationStatus]);

  useEffect(() => {
    if (emailVerified) {
       const timer = setTimeout(() => navigate('/'), 3000);
       return () => clearTimeout(timer);
    }
  }, [emailVerified, navigate]);

  return (
    <div className="min-h-screen bg-[#050b14] text-white font-sans flex flex-col items-center justify-center py-20 px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none -z-10"></div>

      <div className="w-full max-w-lg bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-12 shadow-4xl text-center space-y-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
        
        {loading ? (
          <div className="flex flex-col items-center gap-6">
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Syncing Status...</h2>
          </div>
        ) : emailVerified ? (
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 mx-auto rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative animate-pulse-slow">
              <CheckCircle className="w-12 h-12 text-emerald-400 z-10" />
              <div className="absolute inset-0 bg-emerald-500/20 rounded-[2.5rem] blur-xl"></div>
            </div>
            <div className="space-y-3">
              <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-tight">
                Verified!
              </h3>
              <p className="text-slate-400 text-base font-medium leading-relaxed italic">
                Your email has been successfully confirmed.
              </p>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Redirecting to setup...</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 mx-auto rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white leading-tight">
                Finalizing...
              </h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                We are finishing your account verification. If it takes too long, try clicking the button below.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/')}
              className="w-full h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest"
            >
              Go to Dashboard
              <ArrowRight className="ml-3 w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
