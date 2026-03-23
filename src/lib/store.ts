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
  isVerified: boolean;
  isActive: boolean;
  userId?: string;
  role?: string;
  availability: AvailabilitySlot[];
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
  isActive: boolean;
  isVerified: boolean;
  visitsThisMonth: number;
  target: number;
  credits: number; // For booking appointments
  role?: string;
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
  role?: string;
}

export interface PharmaCompany {
  id: string;
  name: string;
  credits: number;
  userId?: string;
  isActive: boolean;
  isVerified: boolean;
  phone?: string;
  role?: string;
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
    specialty: d.specialty,
    experience_years: d.experienceYears,
    phone: d.phone,
    email: d.email,
    is_active: d.isActive,
    is_verified: d.isVerified,
    role: d.role
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
    isActive: db.is_active ?? true,
    isVerified: db.is_verified ?? false,
    role: db.role,
    availability: load(`availability_${db.id}`, []), // Slots handle sync separately below
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
    role: h.role 
  };
}

function mapHospitalFromDB(db: any): Hospital {
  return { 
    id: db.id, 
    userId: db.user_id, 
    name: db.name, 
    location: db.location, 
    isActive: db.is_active ?? true, 
    isVerified: db.is_verified ?? false,
    phone: db.phone,
    role: db.role,
    type: db.type || 'hospital'
  };
}

function mapPharmaToDB(p: PharmaCompany) {
  const data: any = { id: p.id, user_id: p.userId, name: p.name, credits: p.credits, is_active: p.isActive, is_verified: p.isVerified, phone: p.phone, role: p.role };
  if (p.customBundles) data.custom_bundles = JSON.stringify(p.customBundles);
  return data;
}

function mapPharmaFromDB(db: any): PharmaCompany {
  let bundles: Bundle[] = [];
  try {
    if (db.custom_bundles) bundles = JSON.parse(db.custom_bundles);
  } catch (e) {
    console.warn("Failed to parse custom bundles for " + db.name, e);
  }

  return { 
    id: db.id, userId: db.user_id, name: db.name, credits: db.credits, 
    isActive: db.is_active ?? true, isVerified: db.is_verified ?? false,
    phone: db.phone, role: db.role,
    customBundles: bundles
  };
}

function mapRepToDB(r: SalesRep) {
  return {
    id: r.id, user_id: r.userId, 
    pharma_id: r.pharmaId === 'default' || !r.pharmaId ? null : r.pharmaId, 
    pharma_name: r.pharmaName,
    name: r.name, email: r.email, phone: r.phone, target: r.target, 
    visits_this_month: r.visitsThisMonth, credits: r.credits || 0,
    is_active: r.isActive, is_verified: r.isVerified, role: r.role
  };
}

function mapRepFromDB(db: any): SalesRep {
  return {
    id: db.id, userId: db.user_id, pharmaId: db.pharma_id, pharmaName: db.pharma_name,
    name: db.name, email: db.email, phone: db.phone, target: db.target, 
    visitsThisMonth: db.visits_this_month, credits: db.credits || 0,
    isActive: db.is_active ?? true,
    isVerified: db.is_verified ?? true,
    role: db.role
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

  // Guard: If we just made a local change, don't overwrite from cloud for 10s 
  // to allow the cloud to catch up and avoid "disappearing" optimistic updates.
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

    // Check again after fetch to avoid race condition during the async call
    if (Date.now() - getLastMutationTime() < 10000) return;

    if (hospitals.data) save('hospitals', hospitals.data.map(mapHospitalFromDB));
    if (doctors.data) save('doctors', doctors.data.map(mapDoctorFromDB));
    if (reps.data) save('sales_reps', reps.data.map(mapRepFromDB));
    if (pharma.data) save('pharma_companies', pharma.data.map(mapPharmaFromDB));
    if (visits.data) save('visits', visits.data.map(mapVisitFromDB));
    if (notifications.data) save('notifications', notifications.data.map(mapNotifFromDB).slice(0, 100)); // Keep only latest 100

    // Fetch availability slots separately
    const slots = await supabase.from('availability_slots').select('*');
    if (slots.data && Date.now() - getLastMutationTime() > 10000) {
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
  notifyMutation();
  if (isSupabaseConfigured) {
    supabase.from('hospitals')
      .upsert(mapHospitalToDB(hospital))
      .then(({error}) => {
        if (error) console.error("Hospital Cloud Push Failed:", error);
      });
  }
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
  notifyMutation();
  if (isSupabaseConfigured) {
    supabase.from('doctors')
      .upsert(mapDoctorToDB(doctor))
      .then(({error}) => {
        if (error) console.error("Doctor Cloud Push Failed:", error);
      });
  }
}
export function deleteDoctor(id: string) {
  // Purge dependencies first to satisfy database constraints
  save('visits', getVisits().filter(v => v.doctorId !== id));
  save(`availability_${id}`, []);
  
  save('doctors', getDoctors().filter(d => d.id !== id));
  notifyMutation();
  
  if (isSupabaseConfigured) {
    supabase.from('visits').delete().eq('doctor_id', id).then();
    supabase.from('doctors').delete().eq('id', id).then(({error}) => error && console.error("Cloud delete doctor failed:", error));
  }
}

// ---- SALES REPS ----
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
  // Purge visits by this rep first
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

  // Check if enough company credits
  if (companies[companyIdx].credits < amount) return false;

  // Perform transfer
  companies[companyIdx].credits -= amount;
  reps[repIdx].credits = (reps[repIdx].credits || 0) + amount;

  // Update company
  save('pharma_companies', companies);
  if (isSupabaseConfigured) {
    supabase.from('pharma_companies').update({ credits: companies[companyIdx].credits }).eq('id', pharmaId).then();
  }

  // Update rep
  save('sales_reps', reps);
  if (isSupabaseConfigured) {
    supabase.from('sales_reps').update({ credits: reps[repIdx].credits }).eq('id', repId).then();
  }

  notifyMutation();
  return true;
}

// ---- PHARMA COMPANIES ----
export function getPharmaCompanies(): PharmaCompany[] { return load<PharmaCompany[]>('pharma_companies', []); }
export function savePharmaCompany(company: PharmaCompany) {
  const list = getPharmaCompanies();
  const idx = list.findIndex(c => c.id === company.id);
  if (idx >= 0) list[idx] = company; else list.push(company);
  save('pharma_companies', list);
  notifyMutation();
  if (isSupabaseConfigured) {
    supabase.from('pharma_companies')
      .upsert(mapPharmaToDB(company))
      .then(({error}) => {
        if (error) {
           console.error("Pharma Cloud Push Failed:", error);
           // We don't toast here as it might be frequent, but we log for debugging
        }
      });
  }
}

// ---- VISITS ----
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

// ---- TRANSACTIONS ----
export function getTransactions(): Transaction[] { return load<Transaction[]>('transactions', []); }
export function saveTransaction(t: Transaction) {
  const list = getTransactions();
  list.unshift(t);
  save('transactions', list);
  notifyMutation();
}

// ---- BUNDLES ----
export function getBundles(): Bundle[] { return BUNDLES; }

// ---- PROFILE ----
export function getProfile(userId: string) { return load<Record<string, any>>(`profile_${userId}`, {}); }
export function saveProfile(userId: string, profile: Record<string, any>) { 
  save(`profile_${userId}`, profile); 
  notifyMutation();
}

// ---- AVAILABILITY ----
export function getDoctorAvailability(doctorId: string): AvailabilitySlot[] {
  return load<AvailabilitySlot[]>(`availability_${doctorId}`, []);
}
export function saveDoctorAvailability(doctorId: string, slots: AvailabilitySlot[]) {
  save(`availability_${doctorId}`, slots);
  notifyMutation();
  
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
/**
 * Checks if a user with the given email or phone exists in any of the role tables.
 * Used for forgot password and verification logic.
 */
export async function checkUserExistence(type: 'email' | 'phone', value: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  
  const tables = ['doctors', 'sales_reps', 'hospitals', 'pharma_companies'];
  try {
    const results = await Promise.all(
      tables.map(table => 
        supabase.from(table).select('id').eq(type, value).limit(1)
      )
    );
    return results.some(r => r.data && r.data.length > 0);
  } catch (err) {
    console.warn("Existence check failed:", err);
    return false;
  }
}

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

  // ONLY auto-create in Demo Mode (Local Storage only). 
  // For Supabase, the account MUST be created during the Registration phase only.
  if (isSupabaseConfigured) return;

  if (role === 'doctor') {
    const docs = getDoctors();
    if (!docs.some(d => d.userId === uid)) {
      saveDoctor({
        id: generateId(), userId: uid, name, email, phone,
        specialty: 'General Practice', experienceYears: 0,
        hospitalId: null as any, hospitalName: org || 'Independent',
        availability: [], isActive: true, isVerified: false
      });
    }
  } else if (role === 'rep') {
    const reps = getSalesReps();
    if (!reps.some(r => r.userId === uid)) {
      saveSalesRep({
        id: generateId(), userId: uid, name, email, phone,
        pharmaId: null as any, pharmaName: org || 'Independent Pharma',
        target: 500, visitsThisMonth: 0, credits: 0, isActive: true, isVerified: false
      });
    }
  } else if (role === 'hospital') {
    const hosps = getHospitals();
    if (!hosps.some(h => h.userId === uid)) {
      saveHospital({ 
        id: generateId(), 
        userId: uid, 
        name, 
        location: org || 'Saudi Arabia', 
        isActive: true, 
        isVerified: false,
        type: (user.user_metadata?.hospital_type || 'hospital') as any
      });
    }
  } else if (role === 'pharma') {
    const pharmas = getPharmaCompanies();
    if (!pharmas.some(p => p.userId === uid)) {
      savePharmaCompany({ id: generateId(), userId: uid, name, credits: 50, isActive: true, isVerified: false });
    }
  }
}

export function getBundleRequests(): BundleRequest[] {
  return load<BundleRequest[]>('bundle_requests', []);
}

export function saveBundleRequest(req: BundleRequest) {
  const reqs = getBundleRequests();
  const idx = reqs.findIndex(r => r.id === (req as any).id);
  const updated = idx >= 0
    ? reqs.map((r, i) => i === idx ? req : r)
    : [...reqs, req];
  save('bundle_requests', updated);
  notifyMutation();
}

/**
 * Checks if a user is both verified by admin and active.
 * Uses local store first, fallbacks to a direct cloud query for 100% reliability.
 */
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

    // Cloud Fallback
    if (!isSupabaseConfigured) return false;
    
    const table: Record<string, string> = { 
      doctor: 'doctors', 
      rep: 'sales_reps', 
      pharma: 'pharma_companies', 
      hospital: 'hospitals' 
    };
    
    if (!table[role]) return false; // Unknown role -> block access

    const { data, error } = await supabase.from(table[role]).select('is_verified, is_active').eq('user_id', uid).single();
    if (error || !data) return false;
    
    const verified = data.is_verified === null ? true : !!data.is_verified;
    const active = data.is_active === null ? true : data.is_active !== false;
    
    return verified && active;
  } catch (err) {
    console.warn("Identity Grid Check Failed (Safe Fallback to Blocked):", err);
    return false; 
  }
}

// ---- CUSTOM PHARMA BUNDLES ----
export function getPharmaBundles(pharmaId: string): Bundle[] {
  const pc = getPharmaCompanies().find(p => p.id === pharmaId);
  if (pc && pc.customBundles && pc.customBundles.length > 0) {
    return pc.customBundles;
  }
  return BUNDLES; // Default template
}

export function savePharmaBundle(pharmaId: string, bundle: Bundle) {
  const pharmas = getPharmaCompanies();
  const idx = pharmas.findIndex(p => p.id === pharmaId);
  if (idx >= 0) {
    if (!pharmas[idx].customBundles) pharmas[idx].customBundles = [...BUNDLES];
    const bIdx = pharmas[idx].customBundles!.findIndex(b => b.id === bundle.id);
    if (bIdx >= 0) {
      pharmas[idx].customBundles![bIdx] = bundle;
    } else {
      pharmas[idx].customBundles!.push(bundle);
    }
    savePharmaCompany(pharmas[idx]);
  }
}

export function deletePharmaBundle(pharmaId: string, bundleId: string) {
  const pharmas = getPharmaCompanies();
  const idx = pharmas.findIndex(p => p.id === pharmaId);
  if (idx >= 0 && pharmas[idx].customBundles) {
    pharmas[idx].customBundles = pharmas[idx].customBundles!.filter(b => b.id !== bundleId);
    savePharmaCompany(pharmas[idx]);
  }
}

export function deletePharma(id: string) {
  // Cascading purge of all associated records
  const reps = getSalesReps().filter(r => r.pharmaId === id);
  reps.forEach(r => deleteSalesRep(r.id));
  
  save('transactions', load<any[]>('transactions', []).filter(t => t.pharmaId !== id));
  save('bundle_requests', getBundleRequests().filter(r => r.pharmaId !== id));
  save('visits', getVisits().filter(v => v.pharmaId !== id));

  save('pharma_companies', getPharmaCompanies().filter(p => p.id !== id));
  notifyMutation();

  if (isSupabaseConfigured) {
    supabase.from('transactions').delete().eq('pharma_id', id).then();
    supabase.from('bundle_requests').delete().eq('pharma_id', id).then();
    supabase.from('visits').delete().eq('pharma_id', id).then();
    supabase.from('pharma_companies').delete().eq('id', id).then(({error}) => error && console.error("Cloud delete pharma failed:", error));
  }
}

export function deleteHospital(id: string) {
  save('hospitals', getHospitals().filter(h => h.id !== id));
  notifyMutation();
  if (isSupabaseConfigured) supabase.from('hospitals').delete().eq('id', id).then(({error}) => error && console.error("Cloud delete failed:", error));
}
export async function wipeAllPublicData() {
  if (confirm('GLOBAL PURGE: This will wipe ALL public data from Supabase sequentially and clear local cache. Proceed?')) {
    // 1. Clear Local
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('lomixa_')) localStorage.removeItem(key);
    });

    // 2. Clear Cloud (Sequential + Exception Resistant)
    if (isSupabaseConfigured) {
      console.log("Starting Sequential Global Purge...");
      
      const tables = [
        'notifications', 'visits', 'availability_slots', 
        'bundle_requests', 'transactions', 'doctors', 
        'sales_reps', 'pharma_companies', 'hospitals'
      ];

      for (const table of tables) {
        try {
          console.log(`Purging ${table}...`);
          // Use neq('id', '0') trick to target all rows
          const { error } = await supabase.from(table).delete().neq('id', '0');
          if (error) console.warn(`Cloud purge failed for table [${table}]:`, error.message);
        } catch (e) {
          console.warn(`Exception during cloud purge for table [${table}]:`, e);
        }
      }

      console.log("Global Purge Process Complete.");
    }
    
    window.location.reload();
  }
}
