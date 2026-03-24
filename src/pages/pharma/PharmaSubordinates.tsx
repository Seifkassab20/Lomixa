import React, { useState, useEffect, useCallback } from 'react';
import { getSalesReps, saveSalesRep, deleteSalesRep, generateId, SalesRep, getPharmaCompanies, getVisits, allocateCreditsToRep } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Trash2, Edit2, X, Phone, Mail, Target, TrendingUp, Trophy, ShieldCheck, ShieldAlert, ArrowRight, ChevronDown, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/Toast';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { createClient } from '@supabase/supabase-js';
import { ARABIC_COUNTRY_CODES } from '@/lib/constants';

// Helper client that doesn't persist session so signing up a user doesn't log out the admin
const createTempClient = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key-for-demo-mode';
  return createClient(url, key, { auth: { persistSession: false } });
};

export function PharmaSubordinates() {
  const { userId } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [repVisitCounts, setRepVisitCounts] = useState<Record<string, number>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingRep, setEditingRep] = useState<SalesRep | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phoneCode: '+966', phone: '', target: 25, password: '' });
  const [allocationRep, setAllocationRep] = useState<SalesRep | null>(null);
  const [allocationAmount, setAllocationAmount] = useState(10);

  const pharmaCompanies = getPharmaCompanies();
  const myCompany = pharmaCompanies.find(c => c.userId === userId);

  const loadData = useCallback(() => {
    const all = getSalesReps();
    const filtered = all.filter(r => r.pharmaId === myCompany?.id);
    setReps(filtered);
    const thisMonth = new Date().getMonth();
    const allVisits = getVisits();
    const counts: Record<string, number> = {};
    filtered.forEach(rep => {
      counts[rep.id] = allVisits.filter(
        v => v.repId === rep.id && new Date(v.date).getMonth() === thisMonth
      ).length;
    });
    setRepVisitCounts(counts);
  }, [myCompany?.id]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myCompany) return;

    const fullPhone = `${form.phoneCode}${form.phone}`;

    let finalUserId = editingRep?.userId || editingRep?.id || generateId();
    let finalId = editingRep?.id || finalUserId;

    // If we're adding a new rep, create their Supabase account too
    if (!editingRep && form.email && form.password) {
      const tempSupabase = createTempClient();
      const { data: authData, error } = await tempSupabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            role: 'rep',
            full_name: form.name,
            phone: fullPhone
          }
        }
      });
      
      if (error) {
        toast(`${t('errorCreatingAccount') || 'Error creating account'}: ${error.message}`, 'error');
        return;
      }
      
      if (authData?.user?.id) {
        finalUserId = authData.user.id;
        finalId = finalUserId;
      }
    }

    const rep: SalesRep = {
      id: finalId,
      userId: finalUserId,
      name: form.name,
      email: form.email,
      phone: fullPhone,
      pharmaId: myCompany.id,
      pharmaName: myCompany.name,
      visitsThisMonth: editingRep?.visitsThisMonth || 0,
      target: form.target,
      credits: editingRep?.credits || 0,
      isActive: editingRep?.isActive ?? true,
      isVerified: true, // Pre-verified by pharma company
      role: 'rep'
    };
    saveSalesRep(rep);
    loadData();
    setShowForm(false);
    setEditingRep(null);
    setForm({ name: '', email: '', phoneCode: '+966', phone: '', target: 25, password: '' });
    toast(editingRep ? t('repUpdated') || 'Representative updated successfully' : t('repAddedWithAccount') || 'Representative and account created successfully', 'success');
  };

  const handleEdit = (rep: SalesRep) => {
    setEditingRep(rep);
    
    // Parse phone code
    let extractedCode = '+966';
    let extractedNumber = rep.phone;
    for (const c of ARABIC_COUNTRY_CODES) {
      if (rep.phone.startsWith(c.code)) {
        extractedCode = c.code;
        extractedNumber = rep.phone.slice(c.code.length);
        break;
      }
    }

    setForm({ name: rep.name, email: rep.email, phoneCode: extractedCode, phone: extractedNumber, target: rep.target, password: '' });
    setShowForm(true);
  };

  const toggleActivation = (rep: SalesRep) => {
    const updated = { ...rep, isActive: !rep.isActive };
    saveSalesRep(updated);
    loadData();
    toast(updated.isActive ? t('repActivated') || 'Representative activated' : t('repDeactivated') || 'Representative deactivated', 'info');
  };

  const handleApprove = (rep: SalesRep) => {
    const updated = { ...rep, isVerified: true, isActive: true };
    saveSalesRep(updated);
    toast(`${rep.name} registration approved and activated.`, 'success');
    loadData();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`${t('removeRepConfirm') || 'Are you sure you want to delete'} ${name}? ${t('actionCannotBeUndone') || 'This action cannot be undone.'}`)) {
      deleteSalesRep(id);
      setReps(prev => prev.filter(r => r.id !== id));
      toast(t('repDeleted') || 'Representative removed permanently', 'success');
    }
  };

  const handleAllocateCredits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocationRep) return;
    const success = allocateCreditsToRep(allocationRep.id, allocationAmount);
    if (success) {
      toast(t('creditsAllocated') || `Allocated ${allocationAmount} credits to ${allocationRep.name}`, 'success');
      setAllocationRep(null);
      loadData();
    } else {
      toast(t('allocationFailed') || 'Allocation failed (insufficient company credits)', 'error');
    }
  };

  const rankedReps = [...reps].sort((a, b) => (repVisitCounts[b.id] || 0) - (repVisitCounts[a.id] || 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('salesRepsTitle') || 'Sales Representatives'}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('manageFieldTeam') || 'Manage your field team and visit targets'}</p>
        </div>
        <Button
          onClick={() => { setShowForm(true); setEditingRep(null); setForm({ name: '', email: '', phoneCode: '+966', phone: '', target: 25, password: '' }); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" /> {t('addRep') || 'Add Rep'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{reps.length}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400">{t('totalRepsLabel') || 'Total Representatives'}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{Object.values(repVisitCounts).reduce((a: number, v: number) => a + v, 0)}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400">{t('totalVisitsMonth') || 'Total Visits This Month (Real)'}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
            <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {reps.length > 0 ? Math.round(reps.reduce((a, r) => a + Math.min((repVisitCounts[r.id] || 0) / r.target, 1) * 100, 0) / reps.length) : 0}%
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400">{t('avgTargetCompletion') || 'Avg Target Completion'}</div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold dark:text-white">{editingRep ? (t('editRep') || 'Edit Representative') : (t('addRepLabel') || 'Add Representative')}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="dark:text-slate-300">{t('fullName') || 'Full Name'}</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Ahmed Al-Farsi" className="mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
              </div>
              <div>
                <Label className="dark:text-slate-300">{t('email') || 'Email'}</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="rep@company.com.sa" className="mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
              </div>
              <div>
                <Label className="dark:text-slate-300">{t('phone') || 'Phone'}</Label>
                <div className="flex gap-2 mt-1">
                  <div className="relative w-24 shrink-0">
                    <select
                      value={form.phoneCode}
                      onChange={e => setForm(f => ({ ...f, phoneCode: e.target.value }))}
                      className="w-full h-10 pl-2 pr-6 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-600 text-xs font-bold outline-none appearance-none"
                    >
                      {ARABIC_COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                  </div>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="5X XXX XXXX" className="flex-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                </div>
              </div>
              <div>
                <Label className="dark:text-slate-300">{t('monthlyVisitTarget') || 'Monthly Visit Target'}</Label>
                <Input type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: parseInt(e.target.value) || 25 }))} required min={1} className="mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
              </div>
              {!editingRep && (
                <div>
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded text-[10px] text-emerald-600 dark:text-emerald-400 mb-2 border border-emerald-100 dark:border-emerald-500/20">
                    {t('adminCreatorNote') || "Defining a password will automatically register a pre-verified account for this representative."}
                  </div>
                  <Label className="dark:text-slate-300">{t('password')}</Label>
                  <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="••••••••" className="mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 dark:border-slate-600 dark:text-slate-300">{t('cancel') || 'Cancel'}</Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">{editingRep ? (t('update') || 'Update') : (t('add') || 'Add')} {t('rep') || 'Rep'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {allocationRep && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm border dark:border-slate-700 shadow-2xl">
            <h2 className="text-xl font-bold dark:text-white mb-4">{t('allocateCreditsTo') || 'Allocate Credits to'} {allocationRep.name}</h2>
            <form onSubmit={handleAllocateCredits} className="space-y-4">
              <div>
                <Label className="dark:text-slate-300">{t('amount') || 'Amount'}</Label>
                <Input type="number" value={allocationAmount} onChange={e => setAllocationAmount(parseInt(e.target.value) || 0)} min={1} required className="mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                <p className="text-xs text-gray-500 mt-2">{t('companyCreditsAvailable') || 'Company Credits'}: {myCompany?.credits}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setAllocationRep(null)} className="flex-1 dark:border-slate-600 dark:text-slate-300">{t('cancel') || 'Cancel'}</Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">{t('allocate') || 'Allocate'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reps.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/30 border dark:border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <Users className="h-12 w-12 text-gray-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-slate-300">{t('noRepsYet') || 'No Representatives Yet'}</h3>
          <p className="text-sm text-gray-400 dark:text-slate-500 mb-4">{t('addFirstRep') || 'Add your first sales representative to get started'}</p>
          <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"><Plus className="h-4 w-4" /> {t('addFirstRepBtn') || 'Add First Rep'}</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rankedReps.map((rep, rankIdx) => {
            const actualVisits = repVisitCounts[rep.id] || 0;
            const progress = Math.min(Math.round((actualVisits / rep.target) * 100), 100);
            const rankColors = ['text-yellow-500', 'text-slate-400', 'text-amber-600'];
            return (
              <div key={rep.id} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                        {rep.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      {rankIdx < 3 && (
                        <Trophy className={`absolute -top-1 -right-1 h-3.5 w-3.5 ${rankColors[rankIdx]}`} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{rep.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {rep.isVerified ? (
                          rep.isActive ? (
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <ShieldAlert className="w-3 h-3 text-red-500" />
                          )
                        ) : (
                          <Clock className="w-3 h-3 text-amber-500" />
                        )}
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest italic",
                          rep.isVerified ? (rep.isActive ? "text-emerald-500" : "text-red-500") : "text-amber-500"
                        )}>
                          {rep.isVerified ? (rep.isActive ? t('active') : t('inactive') || 'Inactive') : 'PENDING'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {rep.isVerified ? (
                    <>
                      <div className="flex items-center gap-2 pr-2 border-r dark:border-slate-700">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500">
                          {rep.isActive ? t('active') : t('inactive') || 'Inactive'}
                        </span>
                        <Switch 
                          checked={rep.isActive} 
                          onCheckedChange={() => toggleActivation(rep)}
                          className="scale-75"
                        />
                      </div>
                      <button onClick={() => handleEdit(rep)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        <Edit2 className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 pr-2 border-r dark:border-slate-700">
                      <Button size="sm" onClick={() => handleApprove(rep)} className="bg-emerald-500 hover:bg-emerald-400 text-black h-8 text-[10px] uppercase font-black tracking-widest italic rounded-xl">
                        Approve
                      </Button>
                    </div>
                  )}

                  <button onClick={() => handleDelete(rep.id, rep.name)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <Trash2 className="h-4 w-4 text-red-500/60 hover:text-red-500" />
                  </button>
                </div>
                <div className="space-y-2 text-sm text-gray-500 dark:text-slate-400 mb-4">
                  {rep.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{rep.email}</div>}
                  {rep.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{rep.phone}</div>}
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl mb-4 border dark:border-slate-700">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{t('availableCredits') || 'Available Credits'}</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white leading-none mt-1">{rep.credits || 0}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setAllocationRep(rep)} className="h-8 text-xs gap-1.5 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10">
                    <Plus className="h-3 w-3" /> {t('giveCredits') || 'Give Credits'}
                  </Button>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 dark:text-slate-400">{t('monthlyProgress') || 'Monthly Progress (Real)'}</span>
                    <span className="font-medium text-gray-700 dark:text-slate-300">{actualVisits}/{rep.target} {t('visits') || 'visits'}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500' : progress >= 60 ? 'bg-blue-500' : 'bg-amber-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-right text-xs mt-1 font-medium" style={{ color: progress >= 100 ? '#10b981' : progress >= 60 ? '#3b82f6' : '#f59e0b' }}>{progress}%</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
