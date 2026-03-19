import React, { useState, useEffect } from 'react';
import { getSalesReps, saveSalesRep, deleteSalesRep, generateId, SalesRep, getPharmaCompanies } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Trash2, Edit2, X, Phone, Mail, Target, TrendingUp } from 'lucide-react';

export function PharmaSubordinates() {
  const { userId } = useAuth();
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRep, setEditingRep] = useState<SalesRep | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', target: 25 });

  const pharmaCompanies = getPharmaCompanies();
  const myCompany = pharmaCompanies.find(c => c.userId === userId);

  useEffect(() => {
    const all = getSalesReps();
    setReps(all.filter(r => r.pharmaId === myCompany?.id));
  }, [myCompany?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myCompany) return;
    const rep: SalesRep = {
      id: editingRep?.id || generateId(),
      name: form.name,
      email: form.email,
      phone: form.phone,
      pharmaId: myCompany.id,
      pharmaName: myCompany.name,
      visitsThisMonth: editingRep?.visitsThisMonth || 0,
      target: form.target,
    };
    saveSalesRep(rep);
    const all = getSalesReps();
    setReps(all.filter(r => r.pharmaId === myCompany.id));
    setShowForm(false);
    setEditingRep(null);
    setForm({ name: '', email: '', phone: '', target: 25 });
  };

  const handleEdit = (rep: SalesRep) => {
    setEditingRep(rep);
    setForm({ name: rep.name, email: rep.email, phone: rep.phone, target: rep.target });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Remove this sales representative?')) {
      deleteSalesRep(id);
      setReps(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Representatives</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage your field team and visit targets</p>
        </div>
        <Button
          onClick={() => { setShowForm(true); setEditingRep(null); setForm({ name: '', email: '', phone: '', target: 25 }); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" /> Add Rep
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{reps.length}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400">Total Representatives</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{reps.reduce((a, r) => a + r.visitsThisMonth, 0)}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400">Total Visits This Month</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
            <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {reps.length > 0 ? Math.round(reps.reduce((a, r) => a + (r.visitsThisMonth / r.target) * 100, 0) / reps.length) : 0}%
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400">Avg Target Completion</div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold dark:text-white">{editingRep ? 'Edit Representative' : 'Add Representative'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="dark:text-slate-300">Full Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Ahmed Al-Farsi" className="mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
              </div>
              <div>
                <Label className="dark:text-slate-300">Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="rep@company.com.sa" className="mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
              </div>
              <div>
                <Label className="dark:text-slate-300">Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+966 5X XXX XXXX" className="mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
              </div>
              <div>
                <Label className="dark:text-slate-300">Monthly Visit Target</Label>
                <Input type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: parseInt(e.target.value) || 25 }))} required min={1} className="mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 dark:border-slate-600 dark:text-slate-300">Cancel</Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">{editingRep ? 'Update' : 'Add'} Rep</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reps List */}
      {reps.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/30 border dark:border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <Users className="h-12 w-12 text-gray-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-slate-300">No Representatives Yet</h3>
          <p className="text-sm text-gray-400 dark:text-slate-500 mb-4">Add your first sales representative to get started</p>
          <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"><Plus className="h-4 w-4" /> Add First Rep</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reps.map(rep => {
            const progress = Math.min(Math.round((rep.visitsThisMonth / rep.target) * 100), 100);
            return (
              <div key={rep.id} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                      {rep.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{rep.name}</h3>
                      <Badge variant="outline" className="text-xs mt-0.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">Active</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(rep)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                      <Edit2 className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                    </button>
                    <button onClick={() => handleDelete(rep.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-500 dark:text-slate-400 mb-4">
                  {rep.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{rep.email}</div>}
                  {rep.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{rep.phone}</div>}
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 dark:text-slate-400">Monthly Progress</span>
                    <span className="font-medium text-gray-700 dark:text-slate-300">{rep.visitsThisMonth}/{rep.target} visits</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-right text-xs mt-1 text-emerald-600 dark:text-emerald-400 font-medium">{progress}%</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
