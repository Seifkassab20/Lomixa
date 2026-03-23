// Global store using localStorage for optimistic persistence + Supabase for real-time cloud sync
import { supabase, isSupabaseConfigured } from './supabase';

export type Role = 'pharma' | 'hospital' | 'doctor' | 'rep' | 'admin' | null;

export interface Doctor {
  id: string;
  name: string; // Combined
  firstName?: string;
  lastName?: string;
  title?: string;
  specialty: string;
  experienceYears: number;
  hospitalId: string;
  hospitalName: string;
  phone: string;
  email: string;
  isVerified: boolean;
  isActive: boolean;
  userId?: string;
  role?: string;
  availability: AvailabilitySlot[];
  avatar?: string;
  location?: any;
}

export interface AvailabilitySlot {
  id: string;
  date: string;
  time: string;
  appointmentType: 'In Person' | 'Video' | 'Call' | 'Text';
  duration: number;
  isBooked: boolean;
}

export interface SalesRep {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  roleTitle?: string;
  email: string;
  phone: string;
  pharmaId: string;
  pharmaName: string;
  userId?: string;
  isActive: boolean;
  isVerified: boolean;
  visitsThisMonth: number;
  target: number;
  credits: number;
  role?: string;
  avatar?: string;
  location?: any;
  products?: any[];
}

export interface Hospital {
  id: string;
  name: string;
  location: string;
  userId?: string;
  isActive: boolean;
  isVerified: boolean;
  type: 'hospital' | 'clinic';
  phone?: string;
  email?: string;
  role?: string;
  avatar?: string;
  documents?: {
    commercial: boolean;
    address: boolean;
    vat: boolean;
  };
}

export interface PharmaCompany {
  id: string;
  name: string;
  credits: number;
  userId?: string;
  isActive: boolean;
  isVerified: boolean;
  phone?: string;
  email?: string;
  role?: string;
  avatar?: string;
  documents?: {
    commercial: boolean;
    address: boolean;
    vat: boolean;
  };
  customBundles?: Bundle[];
}

export type VisitStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
export type VisitType = 'In Person' | 'Video' | 'Call' | 'Text';

export interface Visit {
  id: string;
  doctorId: string;
  doctorName: string;
  repId: string;
  repName: string;
  repUserId?: string;  
  pharmaId: string;
  pharmaName: string;
  hospitalId: string;
  hospitalName: string;
  date: string;
  time: string;
  visitType: VisitType;
  status: VisitStatus;
  durationMinutes: number;
  notes?: string;           
  outcomeNotes?: string;    
  cancelledByRep?: boolean; 
  createdAt: string;
}

export interface Bundle {
  id: string;
  name: string;
  credits: number;
  price: number;
  features: string[];
}

export interface BundleRequest {
  id: string;
  pharmaId: string;
  pharmaName: string;
  bundleId: string;
  bundleName: string;
  credits: number;
  price: number;
  cardNumber: string; // Partial for demo
  cardHolder: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'confirmation' | 'cancellation' | 'info';
  read: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  pharmaId: string;
  bundleName: string;
  creditsAdded: number;
  amountEGP: number;
  date: string;
}

const BUNDLES: Bundle[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 50,
    price: 1500,
    features: ['50 Visit Credits', 'Basic Analytics', 'Email Support', '1 Sales Rep'],
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 200,
    price: 4500,
    features: ['200 Visit Credits', 'Advanced Analytics', 'Priority Support', '5 Sales Reps', 'Video Call Integration'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 1000,
    price: 15000,
    features: ['1000 Visit Credits', 'Full Analytics Suite', 'Dedicated Account Manager', 'Unlimited Reps', 'Custom Integrations', 'Arabic/English Support'],
  },
];

function getKey(key: string) {
  return `lomixa_${key}`;
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(getKey(key));
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
}

function save<T>(key: string, value: T) {
  localStorage.setItem(getKey(key), JSON.stringify(value));
}

function notifyMutation() {
  localStorage.setItem(getKey('last_mutation'), Date.now().toString());
}

function getLastMutationTime() {
  return parseInt(localStorage.getItem(getKey('last_mutation')) || '0');
}

// ── SUPABASE SYNC MAPPINGS ───────────────────────────────────────
function mapVisitToDB(v: Visit) {
  return {
    id: v.id,
    doctor_id: v.doctorId,
    doctor_name: v.doctorName,
    rep_id: v.repId,
    rep_name: v.repName,
    rep_user_id: v.repUserId,
    pharma_id: v.pharmaId === 'default' || !v.pharmaId ? null : v.pharmaId,
    pharma_name: v.pharmaName,
    hospital_id: v.hospitalId === 'default' || !v.hospitalId ? null : v.hospitalId,
    hospital_name: v.hospitalName,
    date: v.date,
    time: v.time,
    visit_type: v.visitType,
    status: v.status,
    duration_minutes: v.durationMinutes,
    notes: v.notes,
    outcome_notes: v.outcomeNotes,
    cancelled_by_rep: v.cancelledByRep,
  };
}

function mapVisitFromDB(db: any): Visit {
  return {
    id: db.id,
    doctorId: db.doctor_id,
    doctorName: db.doctor_name,
    repId: db.rep_id,
    repName: db.rep_name,
    repUserId: db.rep_user_id,
    pharmaId: db.pharma_id,
    pharmaName: db.pharma_name,
    hospitalId: db.hospital_id,
    hospitalName: db.hospital_name,
    date: db.date,
    time: db.time,
    visitType: db.visit_type as VisitType,
    status: db.status as VisitStatus,
    durationMinutes: db.duration_minutes,
    notes: db.notes,
    outcomeNotes: db.outcome_notes,
    cancelledByRep: db.cancelled_by_rep,
    createdAt: db.created_at,
  };
}

function mapDoctorToDB(d: Doctor) {
  return {
    id: d.id,
    user_id: d.userId,
    hospital_id: d.hospitalId === 'default' || !d.hospitalId ? null : d.hospitalId,
    hospital_name: d.hospitalName,
    name: d.name,
    title: d.title,
    specialty: d.specialty,
    experience_years: d.experienceYears,
    phone: d.phone,
    email: d.email,
    is_active: d.isActive,
    is_verified: d.isVerified,
    role: d.role,
    avatar: d.avatar,
    location: d.location ? JSON.stringify(d.location) : null
  };
}

function mapDoctorFromDB(db: any): Doctor {
  let location = null;
  try { if (db.location) location = JSON.parse(db.location); } catch(e) {}
  return {
    id: db.id,
    userId: db.user_id,
    hospitalId: db.hospital_id,
    hospitalName: db.hospital_name,
    name: db.name,
    title: db.title,
    specialty: db.specialty,
    experienceYears: db.experience_years,
    phone: db.phone,
    email: db.email,
    isActive: db.is_active ?? true,
    isVerified: db.is_verified ?? false,
    role: db.role,
    avatar: db.avatar,
    location: location,
    availability: load(`availability_${db.id}`, []),
  };
}

function mapHospitalToDB(h: Hospital) {
  return { 
    id: h.id, 
    user_id: h.userId, 
    name: h.name, 
    location: h.location, 
    is_active: h.isActive, 
    is_verified: h.isVerified,
    type: h.type,
    phone: h.phone,
    email: h.email,
    role: h.role,
    avatar: h.avatar,
    documents: h.documents ? JSON.stringify(h.documents) : null
  };
}

function mapHospitalFromDB(db: any): Hospital {
  let docs = null;
  try { if (db.documents) docs = JSON.parse(db.documents); } catch(e) {}
  return { 
    id: db.id, 
    userId: db.user_id, 
    name: db.name, 
    location: db.location, 
    isActive: db.is_active ?? true, 
    isVerified: db.is_verified ?? false,
    phone: db.phone,
    email: db.email,
    role: db.role,
    type: db.type || 'hospital',
    avatar: db.avatar,
    documents: docs
  };
}

function mapPharmaToDB(p: PharmaCompany) {
  const data: any = { 
    id: p.id, user_id: p.userId, name: p.name, credits: p.credits, 
    is_active: p.isActive, is_verified: p.isVerified, phone: p.phone, email: p.email,
    role: p.role, avatar: p.avatar,
    documents: p.documents ? JSON.stringify(p.documents) : null
  };
  if (p.customBundles) data.custom_bundles = JSON.stringify(p.customBundles);
  return data;
}

function mapPharmaFromDB(db: any): PharmaCompany {
  let bundles: Bundle[] = [];
  try { if (db.custom_bundles) bundles = JSON.parse(db.custom_bundles); } catch (e) {}
  let docs = null;
  try { if (db.documents) docs = JSON.parse(db.documents); } catch(e) {}

  return { 
    id: db.id, userId: db.user_id, name: db.name, credits: db.credits, 
    isActive: db.is_active ?? true, isVerified: db.is_verified ?? false,
    phone: db.phone, email: db.email, role: db.role,
    customBundles: bundles,
    avatar: db.avatar,
    documents: docs
  };
}

function mapRepToDB(r: SalesRep) {
  return {
    id: r.id, user_id: r.userId, 
    pharma_id: r.pharmaId === 'default' || !r.pharmaId ? null : r.pharmaId, 
    pharma_name: r.pharmaName,
    name: r.name, 
    first_name: r.firstName,
    last_name: r.lastName,
    role_title: r.roleTitle,
    email: r.email, phone: r.phone, target: r.target, 
    visits_this_month: r.visitsThisMonth, credits: r.credits || 0,
    is_active: r.isActive, is_verified: r.isVerified, role: r.role,
    avatar: r.avatar,
    location: r.location ? JSON.stringify(r.location) : null,
    products: r.products ? JSON.stringify(r.products) : null
  };
}

function mapRepFromDB(db: any): SalesRep {
  let location = null;
  try { if (db.location) location = JSON.parse(db.location); } catch(e) {}
  let products = [];
  try { if (db.products) products = JSON.parse(db.products); } catch(e) {}
  return {
    id: db.id, userId: db.user_id, pharmaId: db.pharma_id, pharmaName: db.pharma_name,
    name: db.name, 
    firstName: db.first_name,
    lastName: db.last_name,
    roleTitle: db.role_title,
    email: db.email, phone: db.phone, target: db.target, 
    visitsThisMonth: db.visits_this_month, credits: db.credits || 0,
    isActive: db.is_active ?? true,
    isVerified: db.is_verified ?? true,
    role: db.role,
    avatar: db.avatar,
    location: location,
    products: products
  };
}

function mapNotifToDB(n: Notification) {
  return { id: n.id, user_id: n.userId, title: n.title, message: n.message, type: n.type, read: n.read };
}

function mapNotifFromDB(db: any): Notification {
  return { id: db.id, userId: db.user_id, title: db.title, message: db.message, type: db.type, read: db.read, createdAt: db.created_at };
}


// BACKGROUND SYNC POLLER
export async function syncCloudData() {
  if (!isSupabaseConfigured) return;
  if (Date.now() - getLastMutationTime() < 10000) return;

  try {
    const [hospitals, doctors, reps, pharma, visits, notifications] = await Promise.all([
      supabase.from('hospitals').select('*'),
      supabase.from('doctors').select('*'),
      supabase.from('sales_reps').select('*'),
      supabase.from('pharma_companies').select('*'),
      supabase.from('visits').select('*'),
      supabase.from('notifications').select('*'),
    ]);

    if (Date.now() - getLastMutationTime() < 10000) return;

    if (hospitals.data) save('hospitals', hospitals.data.map(mapHospitalFromDB));
    if (doctors.data) save('doctors', doctors.data.map(mapDoctorFromDB));
    if (reps.data) save('sales_reps', reps.data.map(mapRepFromDB));
    if (pharma.data) save('pharma_companies', pharma.data.map(mapPharmaFromDB));
    if (visits.data) save('visits', visits.data.map(mapVisitFromDB));
    if (notifications.data) save('notifications', notifications.data.map(mapNotifFromDB).slice(0, 100));

    const slots = await supabase.from('availability_slots').select('*');
    if (slots.data && Date.now() - getLastMutationTime() > 10000) {
      const slotsByDoc = slots.data.reduce((acc: any, row: any) => {
        if (!acc[row.doctor_id]) acc[row.doctor_id] = [];
        acc[row.doctor_id].push({
          id: row.id, date: row.date, time: row.time, appointment_type: row.appointment_type, duration: row.duration, is_booked: row.is_booked
        });
        return acc;
      }, {});
      Object.keys(slotsByDoc).forEach(docId => save(`availability_${docId}`, slotsByDoc[docId]));
    }
  } catch (err) {
    console.warn("Cloud sync failed:", err);
  }
}

setTimeout(syncCloudData, 1000);
setInterval(syncCloudData, 10000);


// ── DATA ACCESS & MUTATION FUNCTIONS ─────────────────────────────
export function getHospitals(): Hospital[] { return load<Hospital[]>('hospitals', []); }
export function saveHospital(hospital: Hospital) {
  const list = getHospitals();
  const idx = list.findIndex(h => h.id === hospital.id);
  if (idx >= 0) list[idx] = hospital; else list.push(hospital);
  save('hospitals', list);
  notifyMutation();
  if (isSupabaseConfigured) {
    supabase.from('hospitals').upsert(mapHospitalToDB(hospital)).then(({error}) => error && console.error("Hospital Cloud Push Failed:", error));
  }
}
export function deleteHospital(id: string) {
  save('hospitals', getHospitals().filter(h => h.id !== id));
  notifyMutation();
  if (isSupabaseConfigured) {
    supabase.from('hospitals').delete().eq('id', id).then(({error}) => error && console.error("Cloud delete hospital failed:", error));
  }
}

export function getDoctors(): Doctor[] { 
  return load<Doctor[]>('doctors', []).map(d => ({ ...d, availability: getDoctorAvailability(d.id) }));
}
export function saveDoctor(doctor: Doctor) {
  const list = getDoctors();
  const idx = list.findIndex(d => d.id === doctor.id);
  if (idx >= 0) list[idx] = doctor; else list.push(doctor);
  save('doctors', list);
  notifyMutation();
  if (isSupabaseConfigured) {
    supabase.from('doctors').upsert(mapDoctorToDB(doctor)).then(({error}) => error && console.error("Doctor Cloud Push Failed:", error));
  }
}
export function deleteDoctor(id: string) {
  save('visits', getVisits().filter(v => v.doctorId !== id));
  save(`availability_${id}`, []);
  save('doctors', getDoctors().filter(d => d.id !== id));
  notifyMutation();
  if (isSupabaseConfigured) {
    supabase.from('visits').delete().eq('doctor_id', id).then();
    supabase.from('doctors').delete().eq('id', id).then(({error}) => error && console.error("Cloud delete doctor failed:", error));
  }
}

export function getSalesReps(): SalesRep[] { return load<SalesRep[]>('sales_reps', []); }
export function saveSalesRep(rep: SalesRep) {
  const list = getSalesReps();
  const idx = list.findIndex(r => r.id === rep.id);
  if (idx >= 0) list[idx] = rep; else list.push(rep);
  save('sales_reps', list);
  notifyMutation();
  if (isSupabaseConfigured) supabase.from('sales_reps').upsert(mapRepToDB(rep)).then(({error}) => error && console.error("Cloud push failed:", error));
}
export function deleteSalesRep(id: string) {
  save('visits', getVisits().filter(v => v.repId !== id));
  save('sales_reps', getSalesReps().filter(r => r.id !== id));
  notifyMutation();
  if (isSupabaseConfigured) {
    supabase.from('visits').delete().eq('rep_id', id).then();
    supabase.from('sales_reps').delete().eq('id', id).then(({error}) => error && console.error("Cloud delete rep failed:", error));
  }
}

export function allocateCreditsToRep(repId: string, amount: number): boolean {
  if (amount <= 0) return false;
  const reps = getSalesReps();
  const repIdx = reps.findIndex(r => r.id === repId);
  if (repIdx < 0) return false;
  const pharmaId = reps[repIdx].pharmaId;
  const companies = getPharmaCompanies();
  const companyIdx = companies.findIndex(c => c.id === pharmaId);
  if (companyIdx < 0) return false;
  if (companies[companyIdx].credits < amount) return false;
  companies[companyIdx].credits -= amount;
  reps[repIdx].credits = (reps[repIdx].credits || 0) + amount;
  save('pharma_companies', companies);
  if (isSupabaseConfigured) supabase.from('pharma_companies').update({ credits: companies[companyIdx].credits }).eq('id', pharmaId).then();
  save('sales_reps', reps);
  if (isSupabaseConfigured) supabase.from('sales_reps').update({ credits: reps[repIdx].credits }).eq('id', repId).then();
  notifyMutation();
  return true;
}

export function getPharmaCompanies(): PharmaCompany[] { return load<PharmaCompany[]>('pharma_companies', []); }
export function savePharmaCompany(company: PharmaCompany) {
  const list = getPharmaCompanies();
  const idx = list.findIndex(c => c.id === company.id);
  if (idx >= 0) list[idx] = company; else list.push(company);
  save('pharma_companies', list);
  notifyMutation();
  if (isSupabaseConfigured) {
    supabase.from('pharma_companies').upsert(mapPharmaToDB(company)).then(({error}) => error && console.error("Pharma Cloud Push Failed:", error));
  }
}
export function deletePharma(id: string) {
  save('pharma_companies', getPharmaCompanies().filter(p => p.id !== id));
  notifyMutation();
  if (isSupabaseConfigured) {
    supabase.from('pharma_companies').delete().eq('id', id).then(({error}) => error && console.error("Cloud delete pharma failed:", error));
  }
}

export function getVisits(): Visit[] { return load<Visit[]>('visits', []); }
export function getVisitById(id: string): Visit | undefined { return getVisits().find(v => v.id === id); }
export function saveVisit(visit: Visit) {
  const list = getVisits();
  const idx = list.findIndex(v => v.id === visit.id);
  if (idx >= 0) list[idx] = visit; else list.push(visit);
  save('visits', list);
  notifyMutation();
  if (isSupabaseConfigured) supabase.from('visits').upsert(mapVisitToDB(visit)).then(({error}) => error && console.error("Cloud push failed:", error));
}
export function updateVisitStatus(id: string, status: VisitStatus, extra?: Partial<Visit>) {
  const list = getVisits();
  const idx = list.findIndex(v => v.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], status, ...extra };
    save('visits', list);
    notifyMutation();
    if (isSupabaseConfigured) supabase.from('visits').upsert(mapVisitToDB(list[idx])).then(({error}) => error && console.error("Cloud push failed:", error));
    return list[idx];
  }
  return null;
}
export function deleteVisit(id: string) {
  save('visits', getVisits().filter(v => v.id !== id));
  notifyMutation();
  if (isSupabaseConfigured) supabase.from('visits').delete().eq('id', id).then(({error}) => error && console.error("Cloud delete failed:", error));
}

export function getNotifications(): Notification[] { return load<Notification[]>('notifications', []); }
export function saveNotification(n: Notification) {
  const list = getNotifications();
  list.unshift(n);
  save('notifications', list.slice(0, 50));
  notifyMutation();
  if (isSupabaseConfigured) supabase.from('notifications').upsert(mapNotifToDB(n)).then(({error}) => error && console.error("Cloud push failed:", error));
}
export function markNotificationRead(id: string) {
  const list = getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
  save('notifications', list);
  notifyMutation();
  if (isSupabaseConfigured) supabase.from('notifications').update({ read: true }).eq('id', id).then(({error}) => error && console.error("Cloud push failed:", error));
}
export function markAllNotificationsRead() {
  const list = getNotifications().map(n => ({ ...n, read: true }));
  save('notifications', list);
  notifyMutation();
}

export function getTransactions(): Transaction[] { return load<Transaction[]>('transactions', []); }
export function saveTransaction(t: Transaction) {
  const list = getTransactions();
  list.unshift(t);
  save('transactions', list);
  notifyMutation();
}

export function getBundles(): Bundle[] { return BUNDLES; }

export function getProfile(userId: string) { return load<Record<string, any>>(`profile_${userId}`, {}); }
export function saveProfile(userId: string, profile: Record<string, any>) { 
  save(`profile_${userId}`, profile); 
  notifyMutation();
}

export function getDoctorAvailability(doctorId: string): AvailabilitySlot[] {
  return load<AvailabilitySlot[]>(`availability_${doctorId}`, []);
}
export function saveDoctorAvailability(doctorId: string, slots: AvailabilitySlot[]) {
  save(`availability_${doctorId}`, slots);
  notifyMutation();
  if (isSupabaseConfigured) {
    supabase.from('availability_slots').delete().eq('doctor_id', doctorId).then(() => {
      if (slots.length > 0) {
        supabase.from('availability_slots').insert(
          slots.map(s => ({
            id: s.id, doctor_id: doctorId, date: s.date, time: s.time, 
            appointment_type: s.appointmentType, duration: s.duration, is_booked: s.isBooked
          }))
        ).then();
      }
    });
  }
}

export async function checkUserExistence(type: 'email' | 'phone', value: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  const tables = ['doctors', 'sales_reps', 'hospitals', 'pharma_companies'];
  try {
    const results = await Promise.all(tables.map(table => supabase.from(table).select('id').eq(type, value).limit(1)));
    return results.some(r => r.data && r.data.length > 0);
  } catch (err) { return false; }
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function pushNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: Notification['type'];
}) {
  saveNotification({
    id: generateId(),
    ...params,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export function getBundleRequests(): BundleRequest[] {
  return load<BundleRequest[]>('bundle_requests', []);
}

export function saveBundleRequest(req: BundleRequest) {
  const reqs = getBundleRequests();
  const idx = reqs.findIndex(r => r.id === (req as any).id);
  const updated = idx >= 0 ? reqs.map((r, i) => i === idx ? req : r) : [...reqs, req];
  save('bundle_requests', updated);
  notifyMutation();
}

export async function isUserAuthorized(uid?: string, role?: string): Promise<boolean> {
  try {
    if (!uid || !role) return false;
    if (role === 'admin') return true;
    const checkLocal = () => {
      let entity: any;
      if (role === 'doctor') entity = getDoctors().find(d => d.userId === uid);
      else if (role === 'pharma') entity = getPharmaCompanies().find(p => p.userId === uid);
      else if (role === 'hospital') entity = getHospitals().find(h => h.userId === uid);
      else if (role === 'rep') entity = getSalesReps().find(r => r.userId === uid);
      return entity;
    };
    const local = checkLocal();
    if (local && local.isVerified) return local.isActive !== false;
    if (!isSupabaseConfigured) return false;
    const table: Record<string, string> = { doctor: 'doctors', rep: 'sales_reps', pharma: 'pharma_companies', hospital: 'hospitals' };
    if (!table[role]) return false;
    const { data, error } = await supabase.from(table[role]).select('is_verified, is_active').eq('user_id', uid).single();
    if (error || !data) return false;
    const verified = data.is_verified === null ? true : !!data.is_verified;
    const active = data.is_active === null ? true : data.is_active !== false;
    return verified && active;
  } catch (err) { return false; }
}

export function getPharmaBundles(pharmaId: string): Bundle[] {
  const pc = getPharmaCompanies().find(p => p.id === pharmaId);
  if (pc && pc.customBundles && pc.customBundles.length > 0) return pc.customBundles;
  return BUNDLES;
}

export function savePharmaBundle(pharmaId: string, bundle: Bundle) {
  const pharmas = getPharmaCompanies();
  const idx = pharmas.findIndex(p => p.id === pharmaId);
  if (idx >= 0) {
    const pc = pharmas[idx];
    const bundles = pc.customBundles || [];
    const bIdx = bundles.findIndex(b => b.id === bundle.id);
    if (bIdx >= 0) bundles[bIdx] = bundle; else bundles.push(bundle);
    pc.customBundles = bundles;
    savePharmaCompany(pc);
  }
}

export async function deletePharmaBundle(pharmaId: string, bundleId: string) {
  const pharmas = getPharmaCompanies();
  const idx = pharmas.findIndex(p => p.id === pharmaId);
  if (idx >= 0) {
    const pc = pharmas[idx];
    pc.customBundles = (pc.customBundles || []).filter(b => b.id !== bundleId);
    savePharmaCompany(pc);
  }
}

export async function ensureUserEntityExists(user: any) {
  if (!user || !isSupabaseConfigured) return;
  const role = user.user_metadata?.role;
  if (!role || role === 'admin') return;

  const tableMap: Record<string, string> = {
    pharma: 'pharma_companies',
    hospital: 'hospitals',
    doctor: 'doctors',
    rep: 'sales_reps'
  };

  const table = tableMap[role];
  if (!table) return;

  try {
    const { data, error } = await supabase.from(table).select('*').eq('user_id', user.id).single();
    if (error || !data) return;

    // Sync cloud data to local state
    if (role === 'pharma') savePharmaCompany(mapPharmaFromDB(data));
    else if (role === 'hospital') saveHospital(mapHospitalFromDB(data));
    else if (role === 'doctor') saveDoctor(mapDoctorFromDB(data));
    else if (role === 'rep') saveSalesRep(mapRepFromDB(data));
    
    notifyMutation();
  } catch (err) {
    console.error("Failed to ensure user entity exists:", err);
  }
}
