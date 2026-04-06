import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
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
  const { userId } = useAuth();
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
    const price = getPriceForCountry(plan.id, country);
    if (balance < price) {
      toast(`Insufficient balance. You need ${formatCurrency(price - balance, country)} more.`, "error");
      return;
    }
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repId || !selectedPlan) return;

    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const price = getPriceForCountry(selectedPlan.id, country);
      
      // Deduct from balance
      const reps = getSalesReps();
      const myRep = reps.find(r => r.id === repId);
      if (myRep) {
        myRep.balance = (myRep.balance || 0) - price;
        const { saveSalesRep } = require('@/lib/store');
        saveSalesRep(myRep);
        setBalance(myRep.balance);
      }

      saveBundleRequest({
        id: generateId(),
        pharmaId: repId,
        pharmaName: repName,
        bundleId: selectedPlan.id,
        bundleName: selectedPlan.name,
        balance: selectedPlan.durationMonths, // Duration for reps
        price: price,
        cardNumber: `WALLET_TRANSFER`,
        cardHolder: repName,
        status: 'pending',
        date: new Date().toISOString(),
        type: 'rep'
      });

      setIsSuccess(true);
      setShowPayment(false);
      toast("Subscription request submitted. Balance deducted.", "success");
    } catch (err) {
      toast("Failed to submit request.", "error");
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

      <AnimatePresence>
        {isSuccess && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-slate-900/90 border border-emerald-500/30 backdrop-blur-2xl rounded-[3rem] p-12 text-center space-y-8 shadow-[0_0_50px_rgba(16,185,129,0.1)]"
            >
              <div className="relative mx-auto w-32 h-32">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative w-32 h-32 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                   <Clock className="w-16 h-16 text-emerald-500" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">Subscription Pending</h2>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] bg-emerald-500/5 px-6 py-2 rounded-full inline-block border border-emerald-500/10">Status: Awaiting Audit Authority</p>
              </div>
              <p className="text-slate-400 font-medium leading-relaxed italic text-sm">
                Your request for the <span className="text-white font-bold">{selectedPlan?.name}</span> plan is being processed. 
                <span className="block mt-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Access will be granted immediately upon admin approval.</span>
              </p>
              <Button onClick={() => navigate('/dashboard')} className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase italic tracking-widest text-xs shadow-2xl shadow-emerald-500/20 group">
                 Continue to Portal <ArrowRight className="w-4 h-4 ml-3 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setShowPayment(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-[3.5rem] shadow-4xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                       <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white leading-none">Subscription Details</h3>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1 italic">Professional Billing Registration</p>
                    </div>
                 </div>
                 <button onClick={() => setShowPayment(false)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <div className="p-12 overflow-y-auto space-y-12">
                {/* Plan Summary */}
                <div className="p-8 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                   <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                         {getIcon(selectedPlan?.id)}
                      </div>
                      <div>
                         <h4 className="text-xl font-black text-white uppercase italic leading-none">{selectedPlan?.name}</h4>
                         <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest mt-1 italic">{selectedPlan?.durationMonths} Months Full Network Access</p>
                      </div>
                   </div>
                   <div className="text-3xl font-black text-white italic tracking-tighter">
                      {formatCurrency(getPriceForCountry(selectedPlan?.id, country), country)}
                   </div>
                </div>

                <form onSubmit={handleSubmitRequest} className="space-y-10">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="col-span-2 space-y-4">
                       <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-[0.2em] italic">CARDHOLDER NAME</Label>
                       <Input 
                        value={paymentData.cardHolder} 
                        onChange={e => setPaymentData(p => ({ ...p, cardHolder: e.target.value }))}
                        required 
                        className="h-16 rounded-2xl bg-black/40 border-white/5 font-bold focus:border-emerald-500 transition-all text-sm uppercase tracking-widest" 
                        placeholder={repName.toUpperCase()} 
                      />
                    </div>
                    <div className="col-span-2 space-y-4">
                       <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-[0.2em] italic">CARD NUMBER</Label>
                       <Input 
                        value={paymentData.cardNo} 
                        onChange={e => setPaymentData(p => ({ ...p, cardNo: e.target.value }))}
                        required 
                        maxLength={16} 
                        className="h-16 rounded-2xl bg-black/40 border-white/5 font-bold focus:border-emerald-500 transition-all text-lg tracking-[0.3em]" 
                        placeholder="0000 0000 0000 0000" 
                      />
                    </div>
                    <div className="space-y-4">
                       <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-[0.2em] italic">EXP. DATE</Label>
                       <Input 
                        value={paymentData.cardExpiry} 
                        onChange={e => setPaymentData(p => ({ ...p, cardExpiry: e.target.value }))}
                        required 
                        className="h-16 rounded-2xl bg-black/40 border-white/5 font-bold focus:border-emerald-500 text-center tracking-widest" 
                        placeholder="MM/YY" 
                      />
                    </div>
                    <div className="space-y-4">
                       <Label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-[0.2em] italic">CVV CODE</Label>
                       <Input 
                        value={paymentData.cardCvv} 
                        onChange={e => setPaymentData(p => ({ ...p, cardCvv: e.target.value }))}
                        required 
                        type="password" 
                        maxLength={3} 
                        className="h-16 rounded-2xl bg-black/40 border-white/5 font-bold focus:border-emerald-500 text-center tracking-[0.5em]" 
                        placeholder="•••" 
                      />
                    </div>
                  </div>

                  <div className="p-8 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md flex items-start gap-4">
                     <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                     <p className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-300 leading-relaxed italic">
                        The bundle price will be deducted from your LOMIXA Wallet immediately. Access will be activated automatically once the Administrative Audit desk confirms your request.
                     </p>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-20 rounded-[2.5rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black italic tracking-tighter text-xl shadow-2xl transition-all active:scale-[0.98] group"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="uppercase tracking-widest text-sm font-black italic">Processing Request...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-4">
                        <span className="uppercase tracking-widest text-sm font-black italic">Submit Subscription Request</span>
                        <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
                      </div>
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
