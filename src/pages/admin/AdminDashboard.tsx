import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getPharmaCompanies, savePharmaCompany, PharmaCompany, getHospitals, Hospital, 
  getDoctors, getSalesReps, getBundleRequests, saveBundleRequest, pushNotification,
  BundleRequest, generateId, saveTransaction, saveHospital,
  deleteHospital, deletePharma, deleteSalesRep, getPharmaBundles, savePharmaBundle, deletePharmaBundle, Bundle
} from '@/lib/store';
import { useTranslation } from 'react-i18next';
import { 
  Building2, Users, CreditCard, ShieldCheck, ShieldAlert, 
  Search, Filter, Edit2, TrendingUp, DollarSign, Package,
  ArrowUpRight, Activity, Hospital as HospitalIcon, Stethoscope,
  Clock, Check, X, AlertCircle, Plus, Trash2, Save, RotateCcw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '../../components/ui/Toast';

export function AdminDashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [pharma, setPharma] = useState<PharmaCompany[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [search, setSearch] = useState('');
  const [requests, setRequests] = useState<BundleRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'verification' | 'bundles' | 'pharma'>('verification');
  
  // Custom Bundle State
  const [editingPharma, setEditingPharma] = useState<PharmaCompany | null>(null);
  const [customBundles, setCustomBundles] = useState<Bundle[]>([]);

  // Rejection State
  const [rejectingUser, setRejectingUser] = useState<{ type: 'hospital' | 'pharma', id: string, name: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const refresh = () => {
    setPharma(getPharmaCompanies());
    setHospitals(getHospitals());
    setRequests(getBundleRequests());
    if (editingPharma) {
      setCustomBundles(getPharmaBundles(editingPharma.id));
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleVerifyUser = (type: 'hospital' | 'pharma', id: string) => {
    if (type === 'hospital') {
      const h = hospitals.find(hosp => hosp.id === id);
      if (h) {
        saveHospital({ ...h, isVerified: true });
        console.log(`[SIMULATED MAIL] To Hospital | ID: ${h.id} | Subject: Infrastructure Verified`);
        if (h.userId) pushNotification({ userId: h.userId, title: 'Hospital Verified', message: 'Your hospital/clinic has been verified on the LOMIXA regional grid.', type: 'info' });
      }
    } else if (type === 'pharma') {
      const p = pharma.find(ph => ph.id === id);
      if (p) {
        savePharmaCompany({ ...p, isVerified: true });
        console.log(`[SIMULATED MAIL] To Pharma | ID: ${p.id} | Subject: Organization Verified`);
        if (p.userId) pushNotification({ userId: p.userId, title: 'Company Verified', message: 'Your pharmaceutical organization has been verified by the Nexus Admin.', type: 'info' });
      }
    }
    refresh();
    toast('Access permission granted and identity verified.', 'success');
  };

  const initiateReject = (type: 'hospital' | 'pharma', id: string) => {
    let name = 'Unknown';
    if (type === 'hospital') name = hospitals.find(h => h.id === id)?.name || name;
    else if (type === 'pharma') name = pharma.find(p => p.id === id)?.name || name;
    
    setRejectingUser({ type, id, name });
  };

  const handleConfirmReject = () => {
    if (!rejectingUser) return;
    const { type, id, name } = rejectingUser;
    
    console.log(`[SIMULATED MAIL] To: ${name} | Subject: Registration Declined | Reason: ${rejectionReason}`);
    
    if (type === 'hospital') {
      deleteHospital(id);
    } else if (type === 'pharma') {
      getSalesReps().filter(r => r.pharmaId === id).forEach(r => deleteSalesRep(r.id));
      deletePharma(id);
    }
    
    setRejectingUser(null);
    setRejectionReason('');
    refresh();
    toast('Registration rejected and purged from the grid.', 'error');
  };

  const handleAddCustomBundle = () => {
    const newBundle: Bundle = {
      id: generateId(),
      name: 'New Bundle',
      credits: 100,
      price: 2500,
      features: ['Visit Credits'],
    };
    setCustomBundles([...customBundles, newBundle]);
  };

  const handleUpdateBundleField = (idx: number, field: keyof Bundle, value: any) => {
    const updated = [...customBundles];
    updated[idx] = { ...updated[idx], [field]: value };
    setCustomBundles(updated);
  };

  const handleSaveAllBundles = () => {
    if (!editingPharma) return;
    const pharmas = getPharmaCompanies();
    const idx = pharmas.findIndex(p => p.id === editingPharma.id);
    if (idx >= 0) {
      pharmas[idx].customBundles = customBundles;
      savePharmaCompany(pharmas[idx]);
      refresh();
      toast('Custom bundles applied for ' + editingPharma.name, 'success');
      setEditingPharma(null);
    }
  };

  const togglePharmaStatus = (pc: PharmaCompany, forceValue?: boolean) => {
    const updated = { ...pc, isActive: forceValue !== undefined ? forceValue : !pc.isActive };
    savePharmaCompany(updated);
    refresh();
    toast(`${pc.name} ${updated.isActive ? 'Activated' : 'Deactivated'}`, 'info');
  };

  const handleApproveRequest = (req: BundleRequest) => {
    const pc = getPharmaCompanies().find(p => p.id === req.pharmaId);
    if (!pc) {
      toast('Reference Pharma not found. Cannot approve.', 'error');
      return;
    }

    // 1. Add credits to pharma (preserving ALL other fields)
    const updatedPharma = { ...pc, credits: (pc.credits || 0) + req.credits };
    savePharmaCompany(updatedPharma);

    // 2. Update request status
    const updatedReq = { ...req, status: 'approved' as const };
    saveBundleRequest(updatedReq);

    // 3. Record transaction
    saveTransaction({
      id: generateId(),
      pharmaId: pc.id,
      bundleName: req.bundleName,
      creditsAdded: req.credits,
      amountEGP: req.price,
      date: new Date().toISOString(),
    });

    // 4. Notify pharma
    if (pc.userId) {
      pushNotification({
        userId: pc.userId,
        title: 'Bundle Approved',
        message: `Your request for ${req.bundleName} bundle has been approved. ${req.credits} credits added.`,
        type: 'info',
      });
      console.log(`[SIMULATED EMAIL] To: ${pc.name} - Bundle Approved: ${req.bundleName}`);
    }

    refresh();
    toast('Bundle request approved and funded.', 'success');
  };

  const handleRejectRequest = (req: BundleRequest) => {
    const updatedReq = { ...req, status: 'rejected' as const };
    saveBundleRequest(updatedReq);
    refresh();
    toast('Bundle request rejected.', 'error');
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  
  // Deduplicate everything
  const uniquePharma = Array.from(new Map<string, PharmaCompany>(pharma.map(p => [p.id, p])).values());
  const uniqueHospitals = Array.from(new Map<string, Hospital>(hospitals.map(h => [h.id, h])).values());

  const pendingHosps = uniqueHospitals.filter(h => h.isVerified === false);
  const pendingPharmas = uniquePharma.filter(p => p.isVerified === false);
  const totalPendingVerification = pendingHosps.length + pendingPharmas.length;

  const filteredPharma = uniquePharma.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 pb-12" dir={t('appName') === 'لوميكسا' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
           <div>
              <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">
                {t('appName')} <span className="text-brand">Nexus</span> Admin
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 uppercase tracking-widest font-bold opacity-60">{t('systemOverlord')}</p>
           </div>
        </div>
      </div>

      {/* Command Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-[1.5rem] border dark:border-slate-800 w-fit">
        {[
          { id: 'verification', label: t('facilityVerificationDesk'), icon: ShieldCheck, color: 'emerald', count: totalPendingVerification },
          { id: 'bundles', label: t('pendingApprovalDesk'), icon: CreditCard, color: 'blue', count: pendingRequests.length },
          { id: 'pharma', label: t('pharmaEcosystemManagement'), icon: Building2, color: 'purple' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase italic tracking-widest text-[10px] transition-all duration-300 relative whitespace-nowrap ${
              activeTab === tab.id 
                ? (tab.color === 'emerald' ? 'bg-brand shadow-brand/20' : 
                   tab.color === 'blue' ? 'bg-blue-600 shadow-blue-500/20' : 
                   'bg-purple-600 shadow-purple-500/20') + ' text-white shadow-lg scale-[1.02]'
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-black border-2 border-white dark:border-slate-900 ${
                activeTab === tab.id ? 'bg-white text-brand-dark' : 'bg-red-500 text-white'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* --- TAB: VERIFICATION --- */}
      {activeTab === 'verification' && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-brand mb-2">
            <ShieldCheck className="w-6 h-6 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
            <h2 className="text-xl font-black uppercase italic tracking-tighter">{t('facilityVerificationDesk')}</h2>
          </div>

          {totalPendingVerification === 0 ? (
            <div className="bg-brand/5 border border-brand/20 rounded-[3rem] p-16 text-center">
               <ShieldCheck className="w-16 h-16 text-brand/20 mx-auto mb-6" />
               <h3 className="text-2xl font-black text-brand uppercase italic tracking-tighter">{t('regionalGridSecure')}</h3>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">{t('allFacilityVerified')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Hospitals */}
              {pendingHosps.map(hosp => (
                 <div key={hosp.id} className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] p-8 hover:shadow-2xl transition-all border-t-8 border-t-blue-500 shadow-xl relative overflow-hidden group flex flex-col">
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                    <div className="flex items-start justify-between mb-6">
                       <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500">
                          <HospitalIcon className="w-6 h-6" />
                       </div>
                       <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-black uppercase tracking-widest text-[8px]">{t('facilityCredentials')}</Badge>
                    </div>
                    <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-1">{hosp.name}</h4>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">{hosp.location}</p>
                    
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <Button 
                        className="rounded-2xl bg-brand-dark hover:bg-brand text-white font-black uppercase italic tracking-widest text-[10px] h-12 shadow-lg shadow-brand/20"
                        onClick={() => handleVerifyUser('hospital', hosp.id)}
                      >
                        {t('accept')}
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="rounded-2xl border border-slate-800 text-slate-500 hover:bg-red-500/10 hover:text-red-500 font-black uppercase italic tracking-widest text-[10px] h-12"
                        onClick={() => initiateReject('hospital', hosp.id)}
                      >
                        {t('reject')}
                      </Button>
                    </div>
                 </div>
              ))}

              {/* Pharma */}
              {pendingPharmas.map(p => (
                 <div key={p.id} className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] p-8 hover:shadow-2xl transition-all border-t-8 border-t-purple-500 shadow-xl relative overflow-hidden group flex flex-col">
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors"></div>
                    <div className="flex items-start justify-between mb-6">
                       <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-500">
                          <Building2 className="w-6 h-6" />
                       </div>
                       <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 font-black uppercase tracking-widest text-[8px]">{t('legalOrganization')}</Badge>
                    </div>
                    <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-1">{p.name}</h4>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">{t('pharmaEcosystemManagement')}</p>
                    
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <Button 
                        className="rounded-2xl bg-brand-dark hover:bg-brand text-white font-black uppercase italic tracking-widest text-[10px] h-12 shadow-lg shadow-brand/20"
                        onClick={() => handleVerifyUser('pharma', p.id)}
                      >
                        {t('accept')}
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="rounded-2xl border border-slate-800 text-slate-500 hover:bg-red-500/10 hover:text-red-500 font-black uppercase italic tracking-widest text-[10px] h-12"
                        onClick={() => initiateReject('pharma', p.id)}
                      >
                        {t('reject')}
                      </Button>
                    </div>
                 </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* --- PHARMA BUNDLE EDITOR MODAL --- */}
      {editingPharma && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             className="absolute inset-0 bg-black/80 backdrop-blur-xl"
             onClick={() => setEditingPharma(null)}
           />
           <motion.div 
             initial={{ scale: 0.9, opacity: 0, y: 20 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             className="relative w-full max-w-4xl bg-[#0f172a] border border-slate-800 rounded-[3rem] shadow-3xl flex flex-col max-h-[90vh] overflow-hidden"
           >
              <div className="p-10 border-b border-slate-800 flex items-center justify-between bg-brand/5">
                 <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-3xl bg-brand/20 flex items-center justify-center text-brand font-black text-4xl shadow-inner border border-brand/30">
                       {editingPharma.name[0]}
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">{t('editCustomBundles')}</h3>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">{t('modifyingPricingFor').replace('{{name}}', editingPharma.name)}</p>
                    </div>
                 </div>
                 <Button variant="ghost" className="h-14 w-14 rounded-2xl hover:bg-red-500/10 group" onClick={() => setEditingPharma(null)}>
                    <X className="w-6 h-6 text-slate-500 group-hover:text-red-500" />
                 </Button>
              </div>

              <div className="p-10 overflow-y-auto flex-1 space-y-6">
                 {customBundles.map((b, bIdx) => (
                    <div key={b.id} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:border-brand/30 transition-all flex flex-col sm:flex-row items-center gap-8 group">
                       <div className="flex-1 w-full space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 px-1">{t('bundleNameLabel')}</Label>
                                <Input 
                                  value={b.name} 
                                  onChange={e => handleUpdateBundleField(bIdx, 'name', e.target.value)}
                                  className="h-12 bg-black/40 border-slate-800 rounded-xl"
                                />
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 px-1">{t('creditsIncluded')}</Label>
                                <Input 
                                  type="number"
                                  value={b.credits} 
                                  onChange={e => handleUpdateBundleField(bIdx, 'credits', parseInt(e.target.value))}
                                  className="h-12 bg-black/40 border-slate-800 rounded-xl"
                                />
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 px-1">{t('priceSAR')}</Label>
                                <Input 
                                  type="number"
                                  value={b.price} 
                                  onChange={e => handleUpdateBundleField(bIdx, 'price', parseInt(e.target.value))}
                                  className="h-12 bg-black/40 border-slate-800 rounded-xl"
                                />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase text-slate-500 px-1">{t('keyValueProp')}</Label>
                             <Input 
                               value={b.features.join(', ')} 
                               onChange={e => handleUpdateBundleField(bIdx, 'features', e.target.value.split(',').map(s => s.trim()))}
                               className="h-12 bg-black/40 border-slate-800 rounded-xl"
                               placeholder="..."
                             />
                          </div>
                       </div>
                       <Button 
                         variant="ghost" 
                         className="h-16 w-16 rounded-3xl group-hover:bg-red-500/10 hover:text-red-500 text-slate-600 border border-slate-800 shrink-0"
                         onClick={() => {
                           setCustomBundles(customBundles.filter((_, i) => i !== bIdx));
                         }}
                       >
                          <Trash2 className="w-6 h-6" />
                       </Button>
                    </div>
                 ))}

                 <Button 
                   variant="outline" 
                   className="w-full h-16 border-dashed border-slate-800 rounded-3xl text-slate-500 hover:text-brand hover:border-brand/50 hover:bg-brand/5 font-black uppercase italic tracking-widest text-xs gap-3"
                   onClick={handleAddCustomBundle}
                 >
                    <Plus className="w-4 h-4" /> {t('addPremiumBundleSlot')}
                 </Button>
              </div>

              <div className="p-10 border-t border-slate-800 bg-slate-900/30 flex items-center justify-end gap-4">
                 <Button 
                   variant="ghost" 
                   className="h-14 px-8 rounded-2xl text-slate-500 font-bold uppercase tracking-widest text-xs"
                   onClick={() => setEditingPharma(null)}
                 >
                    {t('discardChanges')}
                 </Button>
                 <Button 
                   className="h-14 px-10 rounded-2xl bg-brand-dark hover:bg-brand text-white font-black uppercase italic tracking-widest text-xs gap-3 shadow-xl shadow-brand/20"
                   onClick={handleSaveAllBundles}
                 >
                    <Save className="w-4 h-4" /> {t('applyCustomPricing')}
                 </Button>
              </div>
           </motion.div>
        </div>
      )}

      {/* --- TAB: BUNDLE REQUESTS --- */}
      {activeTab === 'bundles' && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-blue-500 mb-2">
            <CreditCard className="w-6 h-6 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
            <h2 className="text-xl font-black uppercase italic tracking-tighter">{t('pendingApprovalDesk')}</h2>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-[3rem] p-16 text-center">
               <Package className="w-16 h-16 text-blue-500/20 mx-auto mb-6" />
               <h3 className="text-2xl font-black text-blue-500 uppercase italic tracking-tighter">No Pending Orders</h3>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">All pharmaceutical credit acquisition requests have been processed</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map(req => (
                <div key={req.id} className="bg-white dark:bg-slate-900/80 border dark:border-slate-800 rounded-[2rem] p-6 shadow-xl border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">{req.pharmaName}</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{req.bundleName} Bundle Request</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="text-xl font-black text-brand tracking-tighter">{req.price.toLocaleString()} SAR</div>
                        <div className="text-[10px] text-slate-500 font-bold">{req.credits} Credits</div>
                     </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-6 border dark:border-slate-800">
                     <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        <span>{t('cardIdentification')}</span>
                        <span className="text-brand font-bold flex items-center gap-1">{t('verified')} <ShieldCheck className="w-3 h-3" /></span>
                     </div>
                     <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                        <span>{req.cardNumber}</span>
                        <span className="italic">{req.cardHolder}</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      className="rounded-xl bg-brand-dark hover:bg-brand text-white font-black uppercase italic tracking-widest text-[10px] h-11 shadow-lg"
                      onClick={() => handleApproveRequest(req)}
                    >
                      {t('confirmAndFund')}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="rounded-xl border border-slate-800 text-slate-400 hover:bg-red-500/10 hover:text-red-500 font-black uppercase italic tracking-widest text-[10px] h-11"
                      onClick={() => handleRejectRequest(req)}
                    >
                      {t('rejectOrder')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* --- TAB: NETWORK MANAGEMENT --- */}
      {activeTab === 'pharma' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t('totalPharma'), value: uniquePharma.length, icon: Building2, color: 'emerald', trend: '+12%' },
          { label: t('totalHospitals'), value: uniqueHospitals.length, icon: HospitalIcon, color: 'blue', trend: '+5%' },
          { label: t('activeReps'), value: getSalesReps().length, icon: Users, color: 'purple', trend: '+18%' },
          { label: t('networkDoctors'), value: getDoctors().length, icon: Stethoscope, color: 'amber', trend: '+31%' },
        ].map((stat, i) => (
          <div key={i} className="bg-app-card border dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-colors ${
              stat.color === 'emerald' ? 'bg-brand/5 group-hover:bg-brand/10' :
              stat.color === 'blue' ? 'bg-blue-500/5 group-hover:bg-blue-500/10' :
              stat.color === 'purple' ? 'bg-purple-500/5 group-hover:bg-purple-500/10' :
              'bg-amber-500/5 group-hover:bg-amber-500/10'
            }`}></div>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${
                stat.color === 'emerald' ? 'bg-brand/10 text-brand' :
                stat.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                stat.color === 'purple' ? 'bg-purple-500/10 text-purple-500' :
                'bg-amber-500/10 text-amber-500'
              }`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-brand bg-brand/10 px-2 py-1 rounded-lg flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> {stat.trend}
              </span>
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{stat.value}</div>
            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pharma Management List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold dark:text-white flex items-center gap-2 uppercase tracking-tighter italic">
              <Package className="w-5 h-5 text-brand" /> {t('pharmaEcosystemManagement')}
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conglomerates..."
                className="pl-9 w-64 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredPharma.map(pc => (
              <div 
                key={pc.id} 
                className={`bg-white dark:bg-slate-900/80 border dark:border-slate-800 rounded-[2rem] p-6 hover:shadow-2xl transition-all group border-l-4 ${
                  pc.isActive 
                    ? "border-l-brand hover:shadow-brand/5" 
                    : "border-l-red-500 grayscale opacity-60 bg-slate-50 dark:bg-slate-900/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-brand font-black text-xl shadow-inner border dark:border-slate-700">
                      {pc.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-lg text-gray-900 dark:text-white uppercase italic tracking-tighter">{pc.name}</h4>
                        {pc.isActive ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-[8px] font-black uppercase tracking-widest">
                            <ShieldCheck className="w-2.5 h-2.5" /> {t('establishedStatus')}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-black uppercase tracking-widest">
                            <ShieldAlert className="w-2.5 h-2.5" /> {t('restrictedStatus')}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                         <div className="flex flex-col">
                           <span className="text-[8px] uppercase font-black text-slate-500 tracking-widest">{t('networkLiquidity')}</span>
                           <span className="text-sm font-bold text-brand">{pc.credits || 0} SAR</span>
                         </div>
                         <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800" />
                         <div className="flex flex-col">
                           <span className="text-[8px] uppercase font-black text-slate-500 tracking-widest">{t('fieldPersonnel')}</span>
                           <span className="text-sm font-bold text-slate-400">{getSalesReps().filter(r => r.pharmaId === pc.id).length} {t('activeReps')}</span>
                         </div>
                      </div>
                    </div>
                  </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end gap-2">
                         <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 rounded-lg border-blue-500/30 text-blue-500 text-[10px] font-black uppercase hover:bg-blue-500/10" 
                              onClick={() => {
                                setEditingPharma(pc);
                                setCustomBundles(getPharmaBundles(pc.id));
                              }}
                            >
                              <Package className="w-3 h-3 mr-1" /> {t('editCustomBundles')}
                            </Button>
                         </div>
                         <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-300 shadow-sm ${
                           pc.isActive 
                             ? "bg-brand border-brand-dark text-white" 
                             : "bg-red-500 border-red-600 text-white"
                         }`}>
                           <span className="text-[10px] font-black uppercase tracking-widest italic">{pc.isActive ? t('active') : t('inactive')}</span>
                           <Switch 
                             checked={pc.isActive} 
                             onCheckedChange={(val) => togglePharmaStatus(pc, val)}
                             className="scale-90"
                           />
                         </div>
                      </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        </div>
      </>
    )}
    {/* --- REJECTION REASON MODAL --- */}
    <AnimatePresence>
      {rejectingUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={() => setRejectingUser(null)}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[#0f172a] border border-red-500/20 rounded-[2.5rem] shadow-3xl overflow-hidden"
          >
            <div className="p-10 border-b border-white/5 bg-red-500/5">
              <div className="flex items-center gap-4 mb-2">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{t('declineRegistration')}</h3>
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t('rejectionReasonLabel')} <span className="text-white">{rejectingUser.name}</span></p>
            </div>

            <div className="p-10 space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">{t('rejectionReasonLabel')}</Label>
                <textarea 
                  autoFocus
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="..."
                  className="w-full min-h-[120px] bg-black/40 border border-slate-800 rounded-2xl p-4 text-white placeholder:text-slate-700 focus:border-red-500/50 outline-none transition-all font-medium text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="ghost" 
                  className="h-14 rounded-2xl border border-slate-800 text-slate-500 hover:text-white font-black uppercase italic tracking-widest text-[10px]"
                  onClick={() => setRejectingUser(null)}
                >
                  {t('cancel')}
                </Button>
                <Button 
                  disabled={!rejectionReason.trim()}
                  className="h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black uppercase italic tracking-widest text-[10px] shadow-lg shadow-red-500/20"
                  onClick={handleConfirmReject}
                >
                  {t('confirmRejection')}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </div>
  );
}
