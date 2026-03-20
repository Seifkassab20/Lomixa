import React, { useState, useEffect } from 'react';
import {
  getDoctors, saveDoctor, deleteDoctor, generateId, Doctor, getHospitals
} from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Plus, Trash2, Edit2, X, Phone, Mail, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SPECIALTIES = [
  'Cardiology', 'Neurology', 'Pediatrics', 'Oncology',
  'Orthopedics', 'Dermatology', 'Psychiatry', 'General Practice',
  'Endocrinology', 'Gastroenterology', 'Pulmonology', 'Rheumatology',
];

export function ManageDoctors() {
  const { userId } = useAuth();
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Doctor | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '', specialty: '', experienceYears: 0,
    phone: '', email: '',
  });

  const hospitals = getHospitals();
  const myHospital = hospitals.find(h => h.userId === userId);

  const refresh = () => {
    const all = getDoctors();
    setDoctors(myHospital ? all.filter(d => d.hospitalId === myHospital.id) : all);
  };

  useEffect(() => { refresh(); }, [myHospital?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const doc: Doctor = {
      id: editingDoc?.id || generateId(),
      name: form.name,
      specialty: form.specialty,
      experienceYears: form.experienceYears,
      phone: form.phone,
      email: form.email,
      hospitalId: myHospital?.id || 'default',
      hospitalName: myHospital?.name || 'Hospital',
      availability: editingDoc?.availability || [],
    };
    saveDoctor(doc);
    refresh();
    setShowForm(false);
    setEditingDoc(null);
    setForm({ name: '', specialty: '', experienceYears: 0, phone: '', email: '' });
  };

  const handleEdit = (doc: Doctor) => {
    setEditingDoc(doc);
    setForm({ name: doc.name, specialty: doc.specialty, experienceYears: doc.experienceYears, phone: doc.phone, email: doc.email });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('deleteDoctor') || 'Remove this doctor?')) {
      deleteDoctor(id);
      refresh();
    }
  };

  const filtered = doctors.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.specialty.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">{t('manageDoctors')}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('addDoctors')}</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingDoc(null); setForm({ name: '', specialty: '', experienceYears: 0, phone: '', email: '' }); }} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="h-4 w-4" /> {t('addDoctor')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('totalDoctors') || 'Total Doctors', value: doctors.length, color: 'emerald' },
          { label: t('cardiology') || 'Cardiology', value: doctors.filter(d => d.specialty === 'Cardiology').length, color: 'red' },
          { label: t('neurology') || 'Neurology', value: doctors.filter(d => d.specialty === 'Neurology').length, color: 'blue' },
          { label: t('other') || 'Other', value: doctors.filter(d => !['Cardiology', 'Neurology'].includes(d.specialty)).length, color: 'amber' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-4">
            <div className="text-2xl font-bold dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchDoctor') || "Search by name or specialty..."} className="dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 max-w-sm" />

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border dark:border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold dark:text-white">{editingDoc ? (t('editDoctor') || 'Edit Doctor') : t('addDoctor')}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="dark:text-slate-300">{t('fullName')}</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Dr. Ahmed Al-Farsi" className="mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
              </div>
              <div>
                <Label className="dark:text-slate-300">{t('specialty')}</Label>
                <select
                  value={form.specialty}
                  onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                  required
                  className="mt-1 w-full rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="">{t('selectSpecialty') || 'Select specialty...'}</option>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{t(s.toLowerCase().replace(' ', '')) || s}</option>)}
                </select>
              </div>
              <div>
                <Label className="dark:text-slate-300">{t('yearsExperience')}</Label>
                <Input type="number" value={form.experienceYears} onChange={e => setForm(f => ({ ...f, experienceYears: parseInt(e.target.value) || 0 }))} required min={0} className="mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
              </div>
              <div>
                <Label className="dark:text-slate-300">{t('email')}</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="doctor@hospital.com.sa" className="mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
              </div>
              <div>
                <Label className="dark:text-slate-300">{t('phone') || 'Phone'}</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+966 5X XXX XXXX" className="mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 dark:border-slate-600 dark:text-slate-300">{t('cancel')}</Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">{editingDoc ? (t('update') || 'Update') : t('add')} {t('doctor')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/30 border dark:border-slate-700 rounded-xl p-12 flex flex-col items-center text-center">
          <Stethoscope className="h-12 w-12 text-gray-200 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-semibold dark:text-slate-300">{search ? (t('noDoctorsFound') || 'No doctors match your search') : t('noDoctorsYet')}</h3>
          {!search && <Button onClick={() => setShowForm(true)} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"><Plus className="h-4 w-4" /> {t('addFirstDoctor')}</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-white dark:bg-slate-800/50 border dark:border-slate-700 rounded-xl p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
                    {doc.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold dark:text-white">{doc.name}</h3>
                    <Badge variant="outline" className="text-xs mt-0.5 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400">
                      {t(doc.specialty.toLowerCase().replace(' ', '')) || doc.specialty}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(doc)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                    <Edit2 className="h-4 w-4 text-gray-400" />
                  </button>
                  <button onClick={() => handleDelete(doc.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-gray-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{doc.experienceYears} {t('yearsExperienceLabel') || 'years experience'}</div>
                {doc.email && <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{doc.email}</div>}
                {doc.phone && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{doc.phone}</div>}
              </div>
              <div className="mt-3 pt-3 border-t dark:border-slate-700 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('active')}</span>
                <span className="ml-auto text-xs text-gray-400 dark:text-slate-500">{doc.availability.filter(s => !s.isBooked).length} {t('slotsAvailable') || 'slots available'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
