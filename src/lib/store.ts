// Global store using localStorage for optimistic persistence + Supabase for real-time cloud sync
import { supabase, isSupabaseConfigured } from './supabase';

export type Role = 'pharma' | 'hospital' | 'doctor' | 'rep' | null;

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experienceYears: number;
  hospitalId: string;
  hospitalName: string;
  phone: string;
  email: string;
  availability: AvailabilitySlot[];
  userId?: string;
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
  email: string;
  phone: string;
  pharmaId: string;
  pharmaName: string;
  userId?: string;
  visitsThisMonth: number;
  target: number;
}

export interface Hospital {
  id: string;
  name: string;
  location: string;
  userId?: string;
}

export interface PharmaCompany {
  id: string;
  name: string;
  credits: number;
  userId?: string;
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
  amountSAR: number;
  date: string;
}

const BUNDLES: Bundle[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 50,
    price: 500,
    features: ['50 Visit Credits', 'Basic Analytics', 'Email Support', '1 Sales Rep'],
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 200,
    price: 1500,
    features: ['200 Visit Credits', 'Advanced Analytics', 'Priority Support', '5 Sales Reps', 'Video Call Integration'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 1000,
    price: 5000,
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
    specialty: d.specialty,
    experience_years: d.experienceYears,
    phone: d.phone,
    email: d.email,
  };
}

function mapDoctorFromDB(db: any): Doctor {
  return {
    id: db.id,
    userId: db.user_id,
    hospitalId: db.hospital_id,
    hospitalName: db.hospital_name,
    name: db.name,
    specialty: db.specialty,
    experienceYears: db.experience_years,
    phone: db.phone,
    email: db.email,
    availability: load(`availability_${db.id}`, []), // Slots handle sync separately below
  };
}

function mapHospitalToDB(h: Hospital) {
  return { id: h.id, user_id: h.userId, name: h.name, location: h.location };
}

function mapHospitalFromDB(db: any): Hospital {
  return { id: db.id, userId: db.user_id, name: db.name, location: db.location };
}

function mapPharmaToDB(p: PharmaCompany) {
  return { id: p.id, user_id: p.userId, name: p.name, credits: p.credits };
}

function mapPharmaFromDB(db: any): PharmaCompany {
  return { id: db.id, userId: db.user_id, name: db.name, credits: db.credits };
}

function mapRepToDB(r: SalesRep) {
  return {
    id: r.id, user_id: r.userId, 
    pharma_id: r.pharmaId === 'default' || !r.pharmaId ? null : r.pharmaId, 
    pharma_name: r.pharmaName,
    name: r.name, email: r.email, phone: r.phone, target: r.target, visits_this_month: r.visitsThisMonth
  };
}

function mapRepFromDB(db: any): SalesRep {
  return {
    id: db.id, userId: db.user_id, pharmaId: db.pharma_id, pharmaName: db.pharma_name,
    name: db.name, email: db.email, phone: db.phone, target: db.target, visitsThisMonth: db.visits_this_month
  };
}

function mapNotifToDB(n: Notification) {
  return { id: n.id, user_id: n.userId, title: n.title, message: n.message, type: n.type, read: n.read };
}

function mapNotifFromDB(db: any): Notification {
  return { id: db.id, userId: db.user_id, title: db.title, message: db.message, type: db.type, read: db.read, createdAt: db.created_at };
}


// BACKGROUND SYNC POLLER
// We poll Supabase silently to pull remote changes down into local memory so the UI remains instantly responsive.
export async function syncCloudData() {
  if (!isSupabaseConfigured) return;

  try {
    const [hospitals, doctors, reps, pharma, visits, notifications] = await Promise.all([
      supabase.from('hospitals').select('*'),
      supabase.from('doctors').select('*'),
      supabase.from('sales_reps').select('*'),
      supabase.from('pharma_companies').select('*'),
      supabase.from('visits').select('*'),
      supabase.from('notifications').select('*'),
    ]);

    if (hospitals.data) save('hospitals', hospitals.data.map(mapHospitalFromDB));
    if (doctors.data) save('doctors', doctors.data.map(mapDoctorFromDB));
    if (reps.data) save('sales_reps', reps.data.map(mapRepFromDB));
    if (pharma.data) save('pharma_companies', pharma.data.map(mapPharmaFromDB));
    if (visits.data) save('visits', visits.data.map(mapVisitFromDB));
    if (notifications.data) save('notifications', notifications.data.map(mapNotifFromDB).slice(0, 100)); // Keep only latest 100

    // Fetch availability slots separately
    const slots = await supabase.from('availability_slots').select('*');
    if (slots.data) {
      const slotsByDoc = slots.data.reduce((acc: any, row: any) => {
        if (!acc[row.doctor_id]) acc[row.doctor_id] = [];
        acc[row.doctor_id].push({
          id: row.id, date: row.date, time: row.time, appointmentType: row.appointment_type, duration: row.duration, isBooked: row.is_booked
        });
        return acc;
      }, {});
      Object.keys(slotsByDoc).forEach(docId => save(`availability_${docId}`, slotsByDoc[docId]));
    }
  } catch (err) {
    console.warn("Cloud sync failed, falling back to local memory:", err);
  }
}

// Ensure first-time load initiates a sync
setTimeout(syncCloudData, 1000);

// Set up periodic sync (every 10s)
setInterval(syncCloudData, 10000);


// ── DATA ACCESS & MUTATION FUNCTIONS ─────────────────────────────
// All mutation functions perform an **Optimistic Update** (instant local save)
// and a **Background Cloud Push** (async remote save). 

// ---- HOSPITALS ----
export function getHospitals(): Hospital[] { return load<Hospital[]>('hospitals', []); }
export function saveHospital(hospital: Hospital) {
  const list = getHospitals();
  const idx = list.findIndex(h => h.id === hospital.id);
  if (idx >= 0) list[idx] = hospital; else list.push(hospital);
  save('hospitals', list);
  if (isSupabaseConfigured) supabase.from('hospitals').upsert(mapHospitalToDB(hospital)).then();
}

// ---- DOCTORS ----
export function getDoctors(): Doctor[] { 
  // Map current slots onto the return payload for smooth UI reading
  return load<Doctor[]>('doctors', []).map(d => ({ ...d, availability: getDoctorAvailability(d.id) }));
}
export function saveDoctor(doctor: Doctor) {
  const list = getDoctors();
  const idx = list.findIndex(d => d.id === doctor.id);
  if (idx >= 0) list[idx] = doctor; else list.push(doctor);
  save('doctors', list);
  if (isSupabaseConfigured) supabase.from('doctors').upsert(mapDoctorToDB(doctor)).then();
}
export function deleteDoctor(id: string) {
  save('doctors', getDoctors().filter(d => d.id !== id));
  if (isSupabaseConfigured) supabase.from('doctors').delete().eq('id', id).then();
}

// ---- SALES REPS ----
export function getSalesReps(): SalesRep[] { return load<SalesRep[]>('sales_reps', []); }
export function saveSalesRep(rep: SalesRep) {
  const list = getSalesReps();
  const idx = list.findIndex(r => r.id === rep.id);
  if (idx >= 0) list[idx] = rep; else list.push(rep);
  save('sales_reps', list);
  if (isSupabaseConfigured) supabase.from('sales_reps').upsert(mapRepToDB(rep)).then();
}
export function deleteSalesRep(id: string) {
  save('sales_reps', getSalesReps().filter(r => r.id !== id));
  if (isSupabaseConfigured) supabase.from('sales_reps').delete().eq('id', id).then();
}

// ---- PHARMA COMPANIES ----
export function getPharmaCompanies(): PharmaCompany[] { return load<PharmaCompany[]>('pharma_companies', []); }
export function savePharmaCompany(company: PharmaCompany) {
  const list = getPharmaCompanies();
  const idx = list.findIndex(c => c.id === company.id);
  if (idx >= 0) list[idx] = company; else list.push(company);
  save('pharma_companies', list);
  if (isSupabaseConfigured) supabase.from('pharma_companies').upsert(mapPharmaToDB(company)).then();
}

// ---- VISITS ----
export function getVisits(): Visit[] { return load<Visit[]>('visits', []); }
export function getVisitById(id: string): Visit | undefined { return getVisits().find(v => v.id === id); }
export function saveVisit(visit: Visit) {
  const list = getVisits();
  const idx = list.findIndex(v => v.id === visit.id);
  if (idx >= 0) list[idx] = visit; else list.push(visit);
  save('visits', list);
  if (isSupabaseConfigured) supabase.from('visits').upsert(mapVisitToDB(visit)).then();
}
export function updateVisitStatus(id: string, status: VisitStatus, extra?: Partial<Visit>) {
  const list = getVisits();
  const idx = list.findIndex(v => v.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], status, ...extra };
    save('visits', list);
    if (isSupabaseConfigured) supabase.from('visits').upsert(mapVisitToDB(list[idx])).then();
    return list[idx];
  }
  return null;
}
export function deleteVisit(id: string) {
  save('visits', getVisits().filter(v => v.id !== id));
  if (isSupabaseConfigured) supabase.from('visits').delete().eq('id', id).then();
}
export function getVisitsByRep(repId: string): Visit[] { return getVisits().filter(v => v.repId === repId); }
export function getVisitsByDoctor(doctorId: string): Visit[] { return getVisits().filter(v => v.doctorId === doctorId); }
export function getVisitsByHospital(hospitalId: string): Visit[] { return getVisits().filter(v => v.hospitalId === hospitalId); }
export function getVisitsByPharma(pharmaId: string): Visit[] { return getVisits().filter(v => v.pharmaId === pharmaId); }

// ---- NOTIFICATIONS ----
export function getNotifications(): Notification[] { return load<Notification[]>('notifications', []); }
export function saveNotification(n: Notification) {
  const list = getNotifications();
  list.unshift(n);
  save('notifications', list.slice(0, 50));
  if (isSupabaseConfigured) supabase.from('notifications').upsert(mapNotifToDB(n)).then();
}
export function markNotificationRead(id: string) {
  const list = getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
  save('notifications', list);
  if (isSupabaseConfigured) supabase.from('notifications').update({ read: true }).eq('id', id).then();
}
export function markAllNotificationsRead() {
  const list = getNotifications().map(n => ({ ...n, read: true }));
  save('notifications', list);
}

// ---- TRANSACTIONS ----
export function getTransactions(): Transaction[] { return load<Transaction[]>('transactions', []); }
export function saveTransaction(t: Transaction) {
  const list = getTransactions();
  list.unshift(t);
  save('transactions', list);
}

// ---- BUNDLES ----
export function getBundles(): Bundle[] { return BUNDLES; }

// ---- PROFILE ----
export function getProfile(userId: string) { return load<Record<string, any>>(`profile_${userId}`, {}); }
export function saveProfile(userId: string, profile: Record<string, any>) { save(`profile_${userId}`, profile); }

// ---- AVAILABILITY ----
export function getDoctorAvailability(doctorId: string): AvailabilitySlot[] {
  return load<AvailabilitySlot[]>(`availability_${doctorId}`, []);
}
export function saveDoctorAvailability(doctorId: string, slots: AvailabilitySlot[]) {
  save(`availability_${doctorId}`, slots);
  
  if (isSupabaseConfigured) {
    // Basic sync: delete old slots for this doctor, insert new
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

// ---- UTILITIES ----
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
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

export function ensureUserEntityExists(user: any) {
  if (!user || (!user.id && !user.user_metadata)) return;
  const role = user.user_metadata?.role;
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const email = user.email || '';
  const phone = user.user_metadata?.mobile || '';
  const org = user.user_metadata?.organization || '';
  const uid = user.id;

  if (role === 'doctor') {
    const docs = getDoctors();
    if (!docs.some(d => d.userId === uid)) {
      saveDoctor({
        id: generateId(), userId: uid, name, email, phone,
        specialty: 'General Practice', experienceYears: 0,
        hospitalId: null as any, hospitalName: org || 'Independent',
        availability: []
      });
    }
  } else if (role === 'rep') {
    const reps = getSalesReps();
    if (!reps.some(r => r.userId === uid)) {
      saveSalesRep({
        id: generateId(), userId: uid, name, email, phone,
        pharmaId: null as any, pharmaName: org || 'Independent Pharma',
        target: 500, visitsThisMonth: 0
      });
    }
  } else if (role === 'hospital') {
    const hosps = getHospitals();
    if (!hosps.some(h => h.userId === uid)) {
      saveHospital({ id: generateId(), userId: uid, name, location: org || 'Saudi Arabia' });
    }
  } else if (role === 'pharma') {
    const pharmas = getPharmaCompanies();
    if (!pharmas.some(p => p.userId === uid)) {
      savePharmaCompany({ id: generateId(), userId: uid, name, credits: 50 });
    }
  }
}
