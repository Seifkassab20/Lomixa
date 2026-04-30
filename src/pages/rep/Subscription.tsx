import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getSalesReps, saveBundleRequest, generateId, getSalesReps as getReps } from '@/lib/store';
import { REP_PLANS, getPriceForCountry } from '@/lib/plans';
import { formatCurrency, CountryCode } from '@/lib/currency';
import { 
  Check, ShieldCheck, Zap, Star, Crown, ArrowRight, CreditCard, 
  Lock, Globe, ShieldAlert, Sparkles, X, Activity, Mail, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function RepSubscription() {
  const { userId, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [country, setCountry] = useState<CountryCode>('sa');
  const [loading, setLoading] = useState(false);
  const [repId, setRepId] = useState<string | null>(null);
  const [repName, setRepName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [paymentData, setPaymentData] = useState({
    cardNo: '',
    cardHolder: '',
    cardExpiry: '',
    cardCvv: '',
  });

  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const { getSubscriptionRemainingDays } = require('@/lib/store');
    const reps = getSalesReps();
    const myRep = reps.find(r => r.userId === userId || r.id === userId);
    if (myRep) {
      setRepId(myRep.id);
      setRepName(myRep.name);
      setBalance(myRep.balance || 0);
      setCountry((myRep.location?.country as CountryCode) || 'sa');
      setRemainingDays(getSubscriptionRemainingDays(myRep.id));
    }
  }, [userId]);

  const handleOpenPayment = (plan: any) => {
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handleMockPayment = async () => {
    if (!selectedPlan || !repId) return;
    
    setLoading(true);
    try {
      const price = getPriceForCountry(selectedPlan.id, country);
      
      saveBundleRequest({
        id: generateId(),
        pharmaId: repId,
        pharmaName: repName,
        bundleId: selectedPlan.id,
        bundleName: selectedPlan.name,
        balance: selectedPlan.durationMonths,
        price: price,
        cardNumber: paymentData.cardNo.slice(-4) || '0000',
        cardHolder: paymentData.cardHolder,
        status: 'pending',
        date: new Date().toISOString(),
        type: 'rep'
      });

      toast('Subscription request submitted to admin for approval.', 'success');
      setShowPayment(false);
      setPaymentData({ cardNo: '', cardHolder: '', cardExpiry: '', cardCvv: '' });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err: any) {
      toast(err.message || 'Payment processing failed', 'error');
    } finally {
      setLoading(false);
    }
  };


  const getIcon = (id: string) => {
    switch (id) {
      case '1_month': return <Zap className="w-6 h-6 text-blue-500" />;
      case '3_months': return <Star className="w-6 h-6 text-purple-500" />;
      case '12_months': return <Crown className="w-6 h-6 text-amber-500" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  const getBadge = (id: string) => {
    if (id === '3_months') return <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-500/20">Popular</span>;
    if (id === '12_months') return <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-amber-500/20">Best Value</span>;
    return null;
  };



  return (
    <div className="min-h-screen bg-[#050b14] py-24 px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -z-10"></div>

      <div className="max-w-6xl mx-auto space-y-20">
        {/* Header */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em]"
          >
            <ShieldCheck className="w-4 h-4" />
            Regional Professional Network
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-7xl font-black tracking-tighter text-white uppercase italic leading-none"
          >
            Empower Your <span className="text-emerald-500">Sales Journey</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg font-medium leading-relaxed"
          >
            Choose a plan that fits your professional growth. Your subscription unlocks the full potential of the LOMIXA network.
          </motion.p>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center gap-6">
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl">
                <Globe className="w-5 h-5 text-emerald-500" />
                <div className="text-[10px] font-black uppercase tracking-widest leading-none">
                    <span className="text-slate-500">Professional Region: </span>
                    <span className="text-white italic">{country}</span>
                </div>
            </div>
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 rounded-[2rem] shadow-2xl">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                <div className="text-[10px] font-black uppercase tracking-widest leading-none">
                    <span className="text-slate-500 font-bold">My Wallet: </span>
                    <span className="text-emerald-500 italic text-lg ml-2">{formatCurrency(balance, country)}</span>
                </div>
            </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {REP_PLANS.map((plan, i) => (
            <motion.div 
              key={plan.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className={cn(
                "relative group flex flex-col p-10 bg-slate-900/30 backdrop-blur-xl border-2 rounded-[3.5rem] transition-all duration-500 hover:scale-[1.02]",
                plan.id === '3_months' 
                  ? "border-emerald-500/50 shadow-3xl shadow-emerald-500/10" 
                  : "border-white/5 hover:border-white/20 shadow-2xl"
              )}
            >
              {/* Plan Header */}
              <div className="mb-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all duration-500 shadow-inner">
                    {getIcon(plan.id)}
                  </div>
                  {getBadge(plan.id)}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{plan.name}</h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-5xl font-black text-white tracking-tighter italic">
                      {formatCurrency(getPriceForCountry(plan.id, country), country)}
                    </span>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-auto mb-2 italic">
                      / {plan.durationMonths} Months
                    </span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="flex-1 space-y-4 mb-12">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider leading-tight">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Button */}
              <Button
                onClick={() => handleOpenPayment(plan)}
                className={cn(
                  "w-full h-16 rounded-[2rem] font-black uppercase italic tracking-widest text-xs transition-all shadow-2xl",
                  plan.id === '3_months'
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                    : "bg-white text-[#050b14] hover:bg-slate-200 shadow-white/10"
                )}
              >
                 Request Bundle <ArrowRight className="w-4 h-4 ml-3" />
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="max-w-4xl mx-auto pt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-center gap-6 p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] backdrop-blur-md">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-xl">
                        <Lock className="w-8 h-8 text-slate-500" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-black text-white uppercase italic tracking-widest">Secure Protocols</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed italic">All financial requests are audited through encrypted LOMIXA regional protocols.</p>
                    </div>
                </div>
                <div className="flex items-center gap-6 p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] backdrop-blur-md">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-xl">
                        <CreditCard className="w-8 h-8 text-slate-500" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-black text-white uppercase italic tracking-widest">Admin Audited</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed italic">Subscriptions directly support the LOMIXA network infrastructure and admin audit desk.</p>
                    </div>
                </div>
            </div>
            
            <p className="text-center text-[10px] text-slate-600 mt-16 uppercase tracking-[0.4em] font-black italic">
                Professional Service Agreement · Privacy Protocol · Regional Registry
            </p>
        </div>
      </div>

      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tight text-slate-900 dark:text-white">Secure Payment</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Test Mode Active</p>
                </div>
              </div>
              <button onClick={() => setShowPayment(false)} className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Card Number</Label>
                <div className="relative group">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    value={paymentData.cardNo}
                    onChange={e => setPaymentData({ ...paymentData, cardNo: e.target.value })}
                    placeholder="0000 0000 0000 0000"
                    className="pl-11 h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Card Holder</Label>
                <Input 
                  value={paymentData.cardHolder}
                  onChange={e => setPaymentData({ ...paymentData, cardHolder: e.target.value })}
                  placeholder="John Doe"
                  className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Expiry</Label>
                  <Input 
                    value={paymentData.cardExpiry}
                    onChange={e => setPaymentData({ ...paymentData, cardExpiry: e.target.value })}
                    placeholder="MM/YY"
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 text-center"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">CVV</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      type="password"
                      value={paymentData.cardCvv}
                      onChange={e => setPaymentData({ ...paymentData, cardCvv: e.target.value })}
                      placeholder="•••"
                      maxLength={4}
                      className="pl-11 h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center tracking-widest"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleMockPayment}
                disabled={loading || !paymentData.cardNo || !paymentData.cardHolder || !paymentData.cardExpiry || !paymentData.cardCvv}
                className="w-full h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest italic shadow-xl shadow-emerald-500/20 transition-all"
              >
                {loading ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
