import React, { useState, useEffect } from 'react';
import { getPharmaBundles, getPharmaCompanies, savePharmaCompany, saveTransaction, generateId, pushNotification, saveBundleRequest, getBundleRequests, Bundle } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Zap, Shield, Star, CheckCircle2, Clock, X, Lock, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, convertCurrency, getCurrencyInfo } from '@/lib/currency';
import { sendEmail, EmailTemplates } from '@/lib/email';

const BUNDLE_ICONS = [Zap, Star, Shield];
const BUNDLE_COLORS = [
  { bg: 'from-slate-800 to-slate-700', accent: 'emerald', border: 'border-slate-600' },
  { bg: 'from-emerald-900 to-teal-800', accent: 'emerald', border: 'border-emerald-600' },
  { bg: 'from-violet-900 to-indigo-800', accent: 'violet', border: 'border-violet-600' },
];

export function PharmaBundles() {
  const { userId, user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  
  // Card form states
  const [cardNo, setCardNo] = useState('');
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const refresh = () => {
    const companies = getPharmaCompanies();
    const matches = companies.filter(c => c.userId === userId || c.id === userId);
    let mine = matches.length > 0 ? matches.sort((a, b) => (b.balance || 0) - (a.balance || 0))[0] : null;
    
    if (mine) {
      setBalance(mine.balance || 0);
      setBundles(getPharmaBundles(mine.id));
      const reqs = getBundleRequests().filter(r => r.pharmaId === mine.id || r.pharmaId === mine.userId);
      setPendingRequests(reqs);
    }
  };

  const companies = getPharmaCompanies();
  const mine = companies.find(c => c.userId === userId) || companies.find(c => c.id === userId);
  const country = mine?.location?.country || 'sa';
  const currency = getCurrencyInfo(country);

  useEffect(() => { refresh(); }, [userId]);

  const handleInitiate = (bundleId: string) => {
    setShowPayment(bundleId);
  };

  const handleRequestApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayment) return;
    setLoading(showPayment);

    const bundle = bundles.find(b => b.id === showPayment);
    const companies = getPharmaCompanies();
    const mine = companies.find(c => c.userId === userId);

    if (bundle && mine) {
      // Convert USD units to local currency values for the actual request
      const localBalance = Math.round(bundle.balance * currency.usdRate);
      const localPrice = Math.round(bundle.price * currency.usdRate);

      // Create request for Admin to review
      saveBundleRequest({
        id: generateId(),
        pharmaId: mine.id,
        pharmaName: mine.name,
        bundleId: bundle.id,
        bundleName: bundle.name,
        balance: localBalance,
        price: localPrice,
        cardNumber: `**** **** **** ${cardNo.slice(-4)}`,
        cardHolder: holder,
        status: 'pending',
        date: new Date().toISOString(),
      });

      toast('Bundle purchase request submitted. Awaiting Admin approval.', 'success');
      
      // Send Real-time Email to Admin
      const adminEmail = 'admin@lomixa.sa'; // Standard network admin mailbox
      const bundleEmail = EmailTemplates.bundleRequest(
        mine.name,
        bundle.name,
        formatCurrency(localPrice, country)
      );
      sendEmail({ to: adminEmail, ...bundleEmail }).catch(console.error);
      
      // Cleanup
      setShowPayment(null);
      setCardNo('');
      setHolder('');
      setExpiry('');
      setCvv('');
      refresh();
    }

    setLoading(null);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
            LOMIXA <span className="text-emerald-500">Market</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 uppercase tracking-widest font-bold opacity-60">Expand your regional healthcare influence</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl px-6 py-4 shadow-xl">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <CreditCard className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Network Liquidity</span>
            <span className="text-xl font-black text-emerald-400">{formatCurrency(balance, country)}</span>
          </div>
        </div>
      </div>

      {/* Pending / Rejected Notifications */}
      <div className="space-y-3">
        {pendingRequests.some(r => r.status === 'pending') && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Clock className="w-5 h-5 text-amber-500" />
               <div className="text-sm font-bold text-amber-500 uppercase tracking-tighter">
                 Acquisition Protocol Pending ({formatCurrency(pendingRequests.find(r => r.status === 'pending')?.price || 0, country)})
               </div>
            </div>
            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Admin Review Required</Badge>
          </div>
        )}

        {pendingRequests.some(r => r.status === 'rejected') && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <AlertCircle className="w-5 h-5 text-red-500" />
               <div className="text-sm font-bold text-red-500 uppercase tracking-tighter">
                 Bundle Request Declined by Administration
               </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-red-500 font-bold" onClick={() => setPendingRequests(pendingRequests.filter(r => r.status !== 'rejected'))}>Dismiss</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {bundles.map((bundle, i) => {
          const Icon = BUNDLE_ICONS[i];
          const colors = BUNDLE_COLORS[i];
          const isPopular = i === 1;
          const isPurchasing = loading === bundle.id;

          return (
            <div
              key={bundle.id}
              className={`relative bg-gradient-to-b ${colors.bg} rounded-[2.5rem] p-8 border ${colors.border} overflow-hidden transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-${colors.accent}-500/20 group`}
            >
              {isPopular && (
                <div className="absolute top-6 right-6">
                  <Badge className="bg-emerald-500 text-white text-[10px] font-black uppercase py-1 px-3 shadow-lg">Premium Tier</Badge>
                </div>
              )}
              <div className="mb-8">
                <div className="inline-flex p-4 rounded-2xl bg-white/10 mb-6 backdrop-blur-md group-hover:scale-110 transition-transform">
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{bundle.name}</h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-5xl font-black text-white tracking-tighter">{formatCurrency(Math.round(bundle.price * currency.usdRate), country)}</span>
                  <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Market Value</span>
                </div>
                <div className="text-emerald-400 text-sm font-black uppercase tracking-widest mt-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {formatCurrency(Math.round(bundle.balance * currency.usdRate), country)} Balance
                </div>
              </div>

              <ul className="space-y-4 mb-10">
                {bundle.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/70 font-bold leading-tight">
                    <div className="p-1 rounded-full bg-white/10 text-emerald-400 shrink-0 mt-0.5">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleInitiate(bundle.id)}
                className="w-full bg-white text-gray-900 hover:bg-emerald-50 font-black h-16 rounded-[1.25rem] transition-all shadow-xl uppercase italic tracking-widest text-xs"
              >
                Acquire Bundle
              </Button>
            </div>
          );
        })}
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#050b14]/80 backdrop-blur-xl" onClick={() => setShowPayment(null)}></div>
          <div className="relative w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-3 italic">
                  <Lock className="w-5 h-5 text-emerald-500" /> Secure Acquisition
                </h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">LOMIXA Banking Interface</p>
              </div>
              <Button size="icon" variant="ghost" className="rounded-2xl" onClick={() => setShowPayment(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <form onSubmit={handleRequestApproval} className="p-8 space-y-6">
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50">
                 <div className="flex justify-between items-center mb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>Order Summary</span>
                    <span>LOMIXA Marketplace</span>
                 </div>
                  <div className="flex justify-between items-end">
                    <div className="text-white font-black italic">{bundles.find(b => b.id === showPayment)?.name} Plan</div>
                    <div className="text-2xl font-black text-emerald-500 tracking-tighter">
                      {formatCurrency(Math.round((bundles.find(b => b.id === showPayment)?.price || 0) * currency.usdRate), country)}
                    </div>
                  </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Cardholder Name</Label>
                  <Input 
                    required 
                    value={holder} 
                    onChange={e => setHolder(e.target.value)}
                    placeholder="CORPORATE ACCOUNT NAME" 
                    className="h-14 rounded-2xl bg-slate-900 border-slate-800 text-white font-bold placeholder:opacity-20" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Card Number</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input 
                      required 
                      maxLength={16}
                      value={cardNo}
                      onChange={e => setCardNo(e.target.value)}
                      placeholder="0000 0000 0000 0000" 
                      className="h-14 rounded-2xl bg-slate-900 border-slate-800 text-white pl-12 font-bold placeholder:opacity-20" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Exp Date</Label>
                    <Input 
                      required 
                      value={expiry}
                      onChange={e => setExpiry(e.target.value)}
                      placeholder="MM/YY" 
                      className="h-14 rounded-2xl bg-slate-900 border-slate-800 text-white font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">CVV</Label>
                    <Input 
                      required 
                      value={cvv}
                      onChange={e => setCvv(e.target.value)}
                      type="password"
                      maxLength={3}
                      placeholder="•••" 
                      className="h-14 rounded-2xl bg-slate-900 border-slate-800 text-white font-bold" 
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading !== null}
                className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase italic tracking-widest rounded-3xl transition-all shadow-xl shadow-emerald-900/20"
              >
                {loading ? 'Processing Protocol...' : 'Submit Request to Admin'}
              </Button>
              <div className="text-center">
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">
                  Your purchase will be processed and validated by the LOMIXA administration desk within 24 hours. Funds will be allocated upon manual validation.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
