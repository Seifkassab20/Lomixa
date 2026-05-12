import React from 'react';
import { supabase, isSupabaseConfigured } from './supabase';

export type Role = 'pharma' | 'hospital' | 'doctor' | 'rep' | 'admin' | null;

export interface Location {
  country: string;
  city?: string;
  cities?: string[];
  area?: string;
  areas?: string[];
  address?: string;
}

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
  balance?: number;
  userId?: string;
  role?: string;
  availability: AvailabilitySlot[];
  avatar?: string;
  location?: Location;
  rejectionReason?: string;
  approvalStatus?: 'pending_approval' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AvailabilitySlot {
  id: string;
  date: string;
  time: string;
  appointmentType: 'In Person' | 'Video' | 'Call' | 'Text';
  duration: number;
  isBooked: boolean;
  price?: number;
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
  balance: number;
  role?: string;
  avatar?: string;
  location?: Location;
  products?: any[];
  targetSpecialties?: string[];
  subscription?: {
    planId: '1_month' | '3_months' | '12_months';
    status: 'active' | 'expired' | 'none';
    expiryDate: string;
    startDate: string;
  };
  rejectionReason?: string;
  approvalStatus?: 'pending_approval' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface Hospital {
  id: string;
  name: string;
  location?: Location;
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
  balance?: number;
  rejectionReason?: string;
  approvalStatus?: 'pending_approval' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
}


export interface PharmaCompany {
  id: string;
  name: string;
  balance: number;
  userId?: string;
  isActive: boolean;
  isVerified: boolean;
  phone?: string;
  email?: string;
  role?: string;
  avatar?: string;
  location?: Location;
  documents?: {
    commercial: boolean;
    address: boolean;
    vat: boolean;
  };
  customBundles?: Bundle[];
  rejectionReason?: string;
  approvalStatus?: 'pending_approval' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
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
  price?: number;
  notes?: string;           
  outcomeNotes?: string;    
  cancelledByRep?: boolean; 
  slotId?: string;
  createdAt: string;
  
  // New reporting fields
  samplesDelivered?: string[];
  interestLevel?: 'Low' | 'Medium' | 'High';
  followUpDate?: string;
  doctorRating?: number;
  repRating?: number;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorUserId: string;
  repId: string;
  repUserId: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'accepted' | 'rejected';
  meetingId: string;
  createdAt: string;
}


export interface Bundle {
  id: string;
  name: string;
  balance: number;
  price: number;
  features: string[];
}

export interface BundleRequest {
  id: string;
  pharmaId: string; // Entity ID (Pharma ID or Rep ID)
  pharmaName: string; // Entity Name
  bundleId: string;
  bundleName: string;
  balance: number; // Balance Units for Pharma, Duration Months for Rep
  price: number;
  cardNumber: string; // Partial for demo
  cardHolder: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  date: string;
  type?: 'pharma' | 'rep';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'confirmation' | 'cancellation' | 'info' | 'rating';
  relatedId?: string;
  read: boolean;
  createdAt: string;
}

export interface Rating {
  id: string;
  visitId: string;
  doctorId: string;
  repId: string;
  rating: number; // 1-5
  comment?: string;
  type: 'doctor_to_rep' | 'rep_to_doctor';
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: 'visit_payout' | 'pharma_deposit' | 'admin_commission' | 'rep_booking_deduction' | 'rep_subscription' | 'refund';
  amount: number;
  currency: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  relatedId?: string; // Visit ID or Bundle ID
  createdAt: string;
}


const BUNDLES: Bundle[] = [
  {
    id: 'starter',
    name: 'Starter',
    balance: 500, // $500 Credit Value
    price: 400,   // $400 USD
    features: ['500 Unit Value', 'Basic Analytics', 'Email Support', '1 Sales Rep'],
  },
  {
    id: 'professional',
    name: 'Professional',
    balance: 2000,
    price: 1200,
    features: ['2000 Unit Value', 'Advanced Analytics', 'Priority Support', '5 Sales Reps', 'Video Call Integration'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    balance: 10000,
    price: 4000,
    features: ['10000 Unit Value', 'Full Analytics Suite', 'Dedicated Account Manager', 'Unlimited Reps', 'Custom Integrations', 'Arabic/English Support'],
  },
];

const CACHE: Record<string, any> = {};
let mutationListeners: (() => void)[] = [];

/**
 * Reactive hook to subscribe a component to any storage mutations.
 */
export function useStoreListener(callback: () => void) {
  React.useEffect(() => {
      mutationListeners.push(callback);
      
      const handleStorage = (e: StorageEvent) => {
        // Clear cache when storage changes in other tabs
        if (e.key?.startsWith('lomixa_')) {
          Object.keys(CACHE).forEach(k => delete CACHE[k]);
          callback();
        }
      };
      
      window.addEventListener('storage', handleStorage);

      return () => { 
        mutationListeners = mutationListeners.filter(l => l !== callback);
        window.removeEventListener('storage', handleStorage);
      };
  }, [callback]);
}

function getKey(key: string) {
  return `lomixa_${key}`;
}

function load<T>(key: string, fallback: T): T {
  if (CACHE[key] !== undefined && CACHE[key] !== null) return CACHE[key] as T;
  try {
    const raw = localStorage.getItem(getKey(key));
    if (raw && raw !== 'undefined' && raw !== 'null') {
      const data = JSON.parse(raw) as T;
      if (data !== undefined && data !== null) {
        CACHE[key] = data;
        return data;
      }
    }
  } catch {}
  return fallback;
}

function save<T>(key: string, value: T): boolean {
  // Deep equality check to avoid redundant stringify/localStorage hits
  const current = CACHE[key];
  if (current && JSON.stringify(current) === JSON.stringify(value)) return false;

  CACHE[key] = value;
  localStorage.setItem(getKey(key), JSON.stringify(value));
  return true;
}

export function notifyMutation() {
  localStorage.setItem(getKey('last_mutation'), Date.now().toString());
  mutationListeners.forEach(l => l());
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
    rep_user_id: v.repUserId || null,
    pharma_id: v.pharmaId === 'default' || !v.pharmaId ? null : v.pharmaId,
    pharma_name: v.pharmaName,
    hospital_id: v.hospitalId === 'default' || !v.hospitalId ? null : v.hospitalId,
    hospital_name: v.hospitalName,
    date: v.date,
    time: v.time,
    visit_type: v.visitType,
    status: v.status,
    duration_minutes: v.durationMinutes,
    price: v.price,
    notes: v.notes,
    outcome_notes: v.outcomeNotes,
    cancelled_by_rep: v.cancelledByRep
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
    status: (db.status ? db.status.charAt(0).toUpperCase() + db.status.slice(1).toLowerCase() : 'Pending') as VisitStatus,
    durationMinutes: db.duration_minutes,
    price: db.price,
    notes: db.notes,
    outcomeNotes: db.outcome_notes,
    cancelledByRep: db.cancelled_by_rep,
    createdAt: db.created_at,
  };
}

function mapAppointmentToDB(a: Appointment) {
  return {
    id: a.id,
    doctor_id: a.doctorId,
    doctor_user_id: a.doctorUserId,
    rep_id: a.repId,
    rep_user_id: a.repUserId,
    start_time: a.startTime,
    end_time: a.endTime,
    status: a.status,
    meeting_id: a.meetingId
  };
}

function mapAppointmentFromDB(db: any): Appointment {
  return {
    id: db.id,
    doctorId: db.doctor_id,
    doctorUserId: db.doctor_user_id,
    repId: db.rep_id,
    repUserId: db.rep_user_id,
    startTime: db.start_time,
    endTime: db.end_time,
    status: db.status,
    meetingId: db.meeting_id,
    createdAt: db.created_at
  };
}

export function getTransactions(): Transaction[] {
  return load<Transaction[]>('transactions', []);
}

export function saveTransaction(t: Transaction) {
  const list = getTransactions();
  list.unshift(t);
  save('transactions', list.slice(0, 1000));
  notifyMutation();
  if (isSupabaseConfigured) {
    supabase.from('transactions').upsert(mapTransactionToDB(t)).then(({error}) => error && console.error("Cloud push failed:", error));
  }
}

function mapTransactionToDB(t: Transaction) {
  return {
    id: t.id,
    type: t.type,
    amount: t.amount || 0,
    currency: t.currency || 'SAR',
    from_id: t.fromId || 'unknown',
    from_name: t.fromName || 'Unknown',
    to_id: t.toId || 'unknown',
    to_name: t.toName || 'Unknown',
    related_id: t.relatedId || null,
    created_at: t.createdAt || new Date().toISOString()
  };
}

function mapTransactionFromDB(db: any): Transaction {
  return {
    id: db.id || 'err-' + Math.random().toString(36).slice(2, 7),
    type: db.type || 'transaction',
    amount: Number(db.amount) || 0,
    currency: db.currency || 'SAR',
    fromId: db.from_id || '',
    fromName: db.from_name || 'Unknown Entity',
    toId: db.to_id || '',
    toName: db.to_name || 'Unknown Entity',
    relatedId: db.related_id,
    createdAt: db.created_at || new Date().toISOString()
  };
}




function mapDoctorToDB(d: Doctor) {
  return {
    id: d.id,
    user_id: d.userId || null,
    hospital_id: d.hospitalId === 'default' || !d.hospitalId ? null : d.hospitalId,
    hospital_name: d.hospitalName,
    name: d.name,
    specialty: d.specialty,
    experience_years: d.experienceYears,
    phone: d.phone,
    email: d.email,
    is_active: d.isActive,
    is_verified: d.isVerified,
    balance: d.balance || 0,
    location: d.location ? JSON.stringify(d.location) : null,
    avatar: d.avatar,
    title: d.title,
    rejection_reason: d.rejectionReason,
    approval_status: d.approvalStatus,
    reviewed_by: d.reviewedBy,
    reviewed_at: d.reviewedAt
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
    balance: db.balance || 0,
    role: db.role,
    avatar: db.avatar,
    location: location,
    availability: load(`availability_${db.id}`, []),
    rejectionReason: db.rejection_reason,
    approvalStatus: db.approval_status,
    reviewedBy: db.reviewed_by,
    reviewedAt: db.reviewed_at
  };
}

function mapHospitalToDB(h: Hospital) {
  return { 
    id: h.id, 
    user_id: h.userId || null, 
    name: h.name, 
    location: h.location ? (typeof h.location === 'string' ? h.location : JSON.stringify(h.location)) : null, 
    is_active: h.isActive, 
    is_verified: h.isVerified,
    type: h.type,
    phone: h.phone,
    email: h.email,
    avatar: h.avatar,
    balance: h.balance || 0,
    rejection_reason: h.rejectionReason,
    approval_status: h.approvalStatus,
    reviewed_by: h.reviewedBy,
    reviewed_at: h.reviewedAt
  };
}


function mapHospitalFromDB(db: any): Hospital {
  let docs = null;
  try { if (db.documents) docs = JSON.parse(db.documents); } catch(e) {}
  return { 
    id: db.id, 
    userId: db.user_id, 
    name: db.name, 
    location: db.location ? (typeof db.location === 'string' && (db.location.startsWith('{') || db.location.startsWith('[')) ? JSON.parse(db.location) : db.location) : null, 
    isActive: db.is_active ?? true, 
    isVerified: db.is_verified ?? false,
    phone: db.phone,
    email: db.email,
    role: db.role,
    type: db.type || 'hospital',
    avatar: db.avatar,
    documents: docs,
    balance: db.balance || 0,
    rejectionReason: db.rejection_reason,
    approvalStatus: db.approval_status,
    reviewedBy: db.reviewed_by,
    reviewedAt: db.reviewed_at
  };
}


function mapPharmaToDB(p: PharmaCompany) {
  const data: any = { 
    id: p.id, 
    user_id: p.userId || null, 
    name: p.name, 
    balance: p.balance, 
    is_active: p.isActive, 
    is_verified: p.isVerified,
    location: p.location ? JSON.stringify(p.location) : null,
    avatar: p.avatar,
    phone: p.phone,
    email: p.email,
    rejection_reason: p.rejectionReason,
    approval_status: p.approvalStatus,
    reviewed_by: p.reviewedBy,
    reviewed_at: p.reviewedAt
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
    id: db.id, userId: db.user_id, name: db.name, balance: db.balance, 
    isActive: db.is_active ?? true, isVerified: db.is_verified ?? false,
    phone: db.phone, email: db.email, role: db.role,
    customBundles: bundles,
    avatar: db.avatar,
    location: db.location ? (typeof db.location === 'string' ? JSON.parse(db.location) : db.location) : null,
    documents: docs,
    rejectionReason: db.rejection_reason,
    approvalStatus: db.approval_status,
    reviewedBy: db.reviewed_by,
    reviewedAt: db.reviewed_at
  };
}

function mapRepToDB(r: SalesRep) {
  return {
    id: r.id, 
    user_id: r.userId || null, 
    pharma_id: r.pharmaId === 'default' || !r.pharmaId ? null : r.pharmaId, 
    pharma_name: r.pharmaName,
    name: r.name, 
    email: r.email, 
    phone: r.phone, 
    target: r.target, 
    visits_this_month: r.visitsThisMonth, 
    balance: r.balance || 0,
    is_active: r.isActive, 
    is_verified: r.isVerified,
    location: r.location ? JSON.stringify(r.location) : null,
    avatar: r.avatar,
    first_name: r.firstName,
    last_name: r.lastName,
    role_title: r.roleTitle,
    target_specialties: r.targetSpecialties ? JSON.stringify(r.targetSpecialties) : null,
    products: r.products ? JSON.stringify(r.products) : null,
    rejection_reason: r.rejectionReason,
    approval_status: r.approvalStatus,
    reviewed_by: r.reviewedBy,
    reviewed_at: r.reviewedAt
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
    visitsThisMonth: db.visits_this_month, balance: db.balance || 0,
    isActive: db.is_active ?? true,
    isVerified: db.is_verified ?? true,
    role: db.role,
    avatar: db.avatar,
    location: location,
    products: products,
    targetSpecialties: db.target_specialties ? JSON.parse(db.target_specialties) : [],
    subscription: db.subscription ? (typeof db.subscription === 'string' ? JSON.parse(db.subscription) : db.subscription) : undefined,
    rejectionReason: db.rejection_reason,
    approvalStatus: db.approval_status,
    reviewedBy: db.reviewed_by,
    reviewedAt: db.reviewed_at
  };
}

function mapNotifToDB(n: Notification) {
  return { id: n.id, user_id: n.userId, title: n.title, message: n.message, type: n.type, read: n.read };
}

function mapNotifFromDB(db: any): Notification {
  return { id: db.id, userId: db.user_id, title: db.title, message: db.message, type: db.type, read: db.read, relatedId: db.related_id, createdAt: db.created_at };
}

function mapBundleRequestFromDB(db: any): BundleRequest {
  return {
    id: db.id, pharmaId: db.pharma_id, pharmaName: db.pharma_name,
    bundleId: db.bundle_id, bundleName: db.bundle_name, balance: db.balance,
    price: db.price, cardNumber: db.card_number, cardHolder: db.card_holder,
    status: db.status, date: db.created_at
  };
}

const mergeData = (local: any[], cloud: any[], fallbackKeys: string[] = []) => {
  const map = new Map((local || []).filter(Boolean).map(i => [i.id, i]));
  (cloud || []).filter(Boolean).forEach(i => {
    if (!i.id) return;
    const existing = map.get(i.id);
    if (existing) {
      // Local-First: Preserve ANY field that exists locally but is missing/null in cloud
      Object.keys(existing).forEach(k => {
        if (i[k] === undefined || i[k] === null) {
          i[k] = existing[k];
        }
      });
      // Explicit Fallbacks: Always use local for these even if cloud has a value (e.g. status)
      // This is critical for keeping "Confirmed" visits even if the cloud update is slow/failing
      fallbackKeys.forEach(k => {
        const localVal = existing[k];
        const cloudVal = i[k];
        if (localVal !== undefined && localVal !== null) {
          // Special case: status should be case-insensitive in comparison
          if (k === 'status' && typeof localVal === 'string' && typeof cloudVal === 'string') {
            if (localVal.toLowerCase() !== cloudVal.toLowerCase()) {
               console.debug(`[Sync] Preserving local ${k}: ${localVal} (Cloud has: ${cloudVal})`);
               i[k] = localVal;
            }
          } else if (localVal !== cloudVal) {
            i[k] = localVal;
          }
        }
      });
    }
    map.set(i.id, { ...(existing || {}), ...i });
  });
  return Array.from(map.values());
};

// BACKGROUND SYNC POLLER
let IS_SYNCING = false;

export async function syncCloudData() {
  if (!isSupabaseConfigured || IS_SYNCING) return;
  IS_SYNCING = true;

  const safeQuery = async (query: Promise<any>) => {
    try {
      const res = await query;
      return res;
    } catch (e) {
      return { data: null, error: e };
    }
  };

  try {
    const [hospitals, doctors, reps, pharma, visits, notifications, bundleReqs, transactions, finance, appointments] = await Promise.all([
      safeQuery(supabase.from('hospitals').select('id, user_id, hospital_id, hospital_name, name, specialty, experience_years, phone, email, is_active, is_verified, balance, location, avatar, title, rejection_reason, approval_status, reviewed_by, reviewed_at') as any),
      safeQuery(supabase.from('doctors').select('id, user_id, hospital_id, hospital_name, name, specialty, experience_years, phone, email, is_active, is_verified, balance, location, avatar, title, rejection_reason, approval_status, reviewed_by, reviewed_at') as any),
      safeQuery(supabase.from('sales_reps').select('id, user_id, pharma_id, pharma_name, name, email, phone, target, visits_this_month, balance, is_active, is_verified, location, avatar, first_name, last_name, role_title, target_specialties, products, rejection_reason, approval_status, reviewed_by, reviewed_at') as any),
      safeQuery(supabase.from('pharma_companies').select('id, name, email, phone, location, avatar, balance, is_active, is_verified, reviewed_by, reviewed_at') as any),
      safeQuery(supabase.from('visits').select('id, doctor_id, doctor_name, rep_id, rep_name, rep_user_id, pharma_id, pharma_name, hospital_id, hospital_name, date, time, visit_type, status, duration_minutes, price, notes, outcome_notes, cancelled_by_rep, created_at') as any),
      safeQuery(supabase.from('notifications').select('id, user_id, title, message, type, read, created_at') as any),
      safeQuery(supabase.from('bundle_requests').select('id, pharma_id, pharma_name, bundle_id, bundle_name, balance, price, card_number, card_holder, status, created_at') as any),
      safeQuery(supabase.from('transactions').select('id, type, amount, currency, from_id, from_name, to_id, to_name, related_id, created_at') as any),
      safeQuery(supabase.from('platform_finance').select('*').limit(1) as any),
      safeQuery(supabase.from('appointments').select('id, doctor_id, doctor_user_id, rep_id, rep_user_id, start_time, end_time, status, meeting_id, created_at') as any),
    ]);

    // Only skip merging local-to-cloud push if mutation was VERY recent
    // Increase safety window to 10s to prevent race conditions during cloud pull/push
    if (Date.now() - getLastMutationTime() < 10000) return;



    const recentMutation = Date.now() - getLastMutationTime() < 10000;

    const pharmaMap = new Map((pharma.data || []).map(p => [p.id, p.name]));
    const hospitalMap = new Map((hospitals.data || []).map(h => [h.id, h.name]));

    try {
      if (hospitals.data) {
        // Profile fields are local-first — never let cloud downgrade an edited entity
        const merged = mergeData(getHospitals(), hospitals.data.map(mapHospitalFromDB), ['balance', 'name', 'phone', 'location', 'avatar']);
        save('hospitals', merged);
      }
      if (doctors.data) {
        const dbDoctors = doctors.data.map(dbDoc => {
          const freshHospitalName = hospitalMap.get(dbDoc.hospital_id);
          if (freshHospitalName) dbDoc.hospital_name = freshHospitalName;
          return mapDoctorFromDB(dbDoc);
        });
        const merged = mergeData(getDoctors(), dbDoctors, ['balance', 'name', 'phone', 'location', 'avatar', 'title', 'specialty', 'experienceYears']);
        save('doctors', merged);
      }
    } catch (e) { console.error("Sync Error [Profiles]:", e); }

    try {
      if (reps.data) {
        const dbReps = reps.data.map(dbRep => {
          const freshPharmaName = pharmaMap.get(dbRep.pharma_id);
          if (freshPharmaName) dbRep.pharma_name = freshPharmaName;
          return mapRepFromDB(dbRep);
        });
        const merged = mergeData(getSalesReps(), dbReps, ['balance', 'target', 'visitsThisMonth', 'name', 'phone', 'location', 'avatar', 'firstName', 'lastName', 'roleTitle']);
        save('sales_reps', merged);
      }
      if (pharma.data) {
        const merged = mergeData(getPharmaCompanies(), pharma.data.map(mapPharmaFromDB), ['balance', 'name', 'phone', 'location', 'avatar']);
        save('pharma_companies', merged);
      }
    } catch (e) { console.error("Sync Error [Entities]:", e); }
    try {
      if (visits.data) {
        const dbVisits = visits.data.map(dbVisit => {
          const freshPharmaName = pharmaMap.get(dbVisit.pharma_id);
          if (freshPharmaName) dbVisit.pharma_name = freshPharmaName;
          const freshHospitalName = hospitalMap.get(dbVisit.hospital_id);
          if (freshHospitalName) dbVisit.hospital_name = freshHospitalName;
          return mapVisitFromDB(dbVisit);
        });

        const merged = mergeData(getVisits(), dbVisits, ['status', 'price', 'outcomeNotes']);
        save('visits', merged);
      }
    } catch (e) { console.error("Sync Error [Visits]:", e); }
    if (notifications.data) {
      try {
        const merged = mergeData(load('notifications', []), notifications.data.map(mapNotifFromDB).slice(0, 100), ['read']);
        save('notifications', merged);
      } catch (e) { console.error("Sync Error [Notifications]:", e); }
    }

    try {
      if (bundleReqs.data) save('bundle_requests', mergeData(getBundleRequests(), bundleReqs.data.map(mapBundleRequestFromDB)));
      if (transactions.data) save('transactions', mergeData(getTransactions(), transactions.data.map(mapTransactionFromDB)));
      if (finance.data && finance.data[0]) save('admin_balance', finance.data[0].admin_balance);
      if (appointments.data) save('appointments', mergeData(getAppointments(), appointments.data.map(mapAppointmentFromDB)));
    } catch (e) { console.error("Sync Error [Misc]:", e); }


    const slots = await supabase.from('availability_slots').select('*');
    if (slots.data && Date.now() - getLastMutationTime() > 10000) {
      // Filter out past slots before saving locally
      const validSlots = slots.data.filter((s: any) => !isDateTimePast(s.date, s.time));
      
      const slotsByDoc = validSlots.reduce((acc: any, row: any) => {
        if (!acc[row.doctor_id]) acc[row.doctor_id] = [];
        acc[row.doctor_id].push({
          id: row.id, date: row.date, time: row.time, appointmentType: row.appointment_type, duration: row.duration, is_booked: row.is_booked, price: row.price
        });
        return acc;
      }, {});
      Object.keys(slotsByDoc).forEach(docId => save(`availability_${docId}`, slotsByDoc[docId]));

      // Identify expired slots to delete from cloud
      const expiredIds = slots.data
        .filter((s: any) => isDateTimePast(s.date, s.time))
        .map((s: any) => s.id);
      
      if (expiredIds.length > 0) {
        console.log(`[Cleaner] Purging ${expiredIds.length} expired cloud slots...`);
        supabase.from('availability_slots').delete().in('id', expiredIds).then();
      }
    }

    // Also purge expired appointments from cloud (keep for 24 hours post-end time to protect live sessions/feedback)
    if (appointments.data) {
      const now = Date.now();
      const expiredApptIds = appointments.data
        .filter((a: any) => new Date(a.end_time || a.start_time).getTime() + 24 * 3600 * 1000 < now)
        .map((a: any) => a.id);
      
      if (expiredApptIds.length > 0) {
        console.log(`[Cleaner] Purging ${expiredApptIds.length} expired cloud appointments...`);
        supabase.from('appointments').delete().in('id', expiredApptIds).then();
      }
    }

  } catch (err) {
    console.warn("Cloud sync failed:", err);
  } finally {
    IS_SYNCING = false;
  }
}

// Clear existing intervals for Vite HMR
if ((window as any).__storeIntervals) {
  (window as any).__storeIntervals.forEach((id: any) => clearInterval(id));
}
(window as any).__storeIntervals = [
  setInterval(() => {
    purgeExpiredSlots();
    purgeExpiredAppointments();
  }, 300000), // Every 5 minutes
  setInterval(syncCloudData, 60000)
];

setTimeout(syncCloudData, 1000);


// ── DB PUSH CONCURRENCY CONTROL ──────────────────────────────────
const PUSH_LOCKS = new Set<string>();

const withLock = async (key: string, fn: () => Promise<any>) => {
  if (PUSH_LOCKS.has(key)) return;
  PUSH_LOCKS.add(key);
  try { return await fn(); }
  finally { PUSH_LOCKS.delete(key); }
};

// ── DATA ACCESS & MUTATION FUNCTIONS ─────────────────────────────
export function getHospitals(): Hospital[] { 
  const raw = load<Hospital[]>('hospitals', []);
  if (!Array.isArray(raw)) return [];
  const list = raw.filter(h => h && h.id).map(h => h.location ? { ...h, location: { ...h.location, city: h.location.city?.replace(/^city_/, '') } } : h);
  // Deduplicate
  return Array.from(new Map(list.map(h => [h.id, h])).values());
}
export function saveHospital(hospital: Hospital) {
  const list = getHospitals();
  const idx = list.findIndex(h => h.id === hospital.id);
  if (idx >= 0) list[idx] = hospital; else list.push(hospital);
  const changed = save('hospitals', list);
  if (changed) notifyMutation();
  if (isSupabaseConfigured && !hospital.id.startsWith('demo_')) {
    withLock(`hospital_${hospital.id}`, () => 
      (supabase.from('hospitals').upsert(mapHospitalToDB(hospital)) as any).then(({error}) => {
        if (error) {
          if (error.name === 'AbortError' || error.message?.includes('Lock broken')) return;
          console.error("Hospital Cloud Push Failed:", error);
          window.dispatchEvent(new CustomEvent('lomixa_error', { detail: `Cloud Push Failed: ${error.message}` }));
        }
      })
    );
  }
}
export function deleteHospital(id: string) {
  save('hospitals', getHospitals().filter(h => h.id !== id));
  notifyMutation();
  if (isSupabaseConfigured) {
    supabase.from('hospitals').delete().eq('id', id).then(({error}) => error && console.error("Cloud delete hospital failed:", error));
  }
}

export function getDoctors(includeAvailability: boolean = false): Doctor[] { 
  const raw = load<Doctor[]>('doctors', []);
  if (!Array.isArray(raw)) return [];
  const list = raw.filter(d => d && d.id).map(d => d.location ? { ...d, location: { ...d.location, city: d.location.city?.replace(/^city_/, '') } } : d);
  // Deduplicate
  const unique = Array.from(new Map(list.map(d => [d.id, d])).values());
  if (includeAvailability) {
    return unique.map(d => ({ ...d, availability: getDoctorAvailability(d.id) }));
  }
  return unique;
}
export function saveDoctor(doctor: Doctor) {
  const list = getDoctors();
  const idx = list.findIndex(d => d.id === doctor.id);
  if (idx >= 0) list[idx] = doctor; else list.push(doctor);
  const changed = save('doctors', list);
  if (changed) notifyMutation();
    if (isSupabaseConfigured && !doctor.id.startsWith('demo_')) {
      const push = (data: any) => supabase.from('doctors').upsert(data);
      
      withLock(`doctor_${doctor.id}`, () => 
        (push(mapDoctorToDB(doctor)) as any).then(({error}) => {
          if (error) {
            if (error.name === 'AbortError' || error.message?.includes('Lock broken')) return;
            const isFkError = error.message.toLowerCase().includes('foreign key') || error.code === '23503';
            if (isFkError && error.message.includes('hospital_id')) {
              console.warn("Ghost hospital detected. Self-healing to Independent...");
              doctor.hospitalId = 'default';
              doctor.hospitalName = 'Independent / No Hospital';
              const updatedList = getDoctors();
              const i = updatedList.findIndex(d => d.id === doctor.id);
              if (i >= 0) updatedList[i] = doctor;
              save('doctors', updatedList);
              notifyMutation();
              push(mapDoctorToDB(doctor)).then(({error: retryErr}) => {
                if (retryErr) {
                  window.dispatchEvent(new CustomEvent('lomixa_error', { detail: `Doctor DB Fix Failed: ${retryErr.message}` }));
                }
              });
              return;
            }
            console.error("Doctor Cloud Push Failed:", error);
            window.dispatchEvent(new CustomEvent('lomixa_error', { detail: `Doctor DB Error: ${error.message}` }));
          }
        })
      );
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

export function getSalesReps(): SalesRep[] { 
  const raw = load<SalesRep[]>('sales_reps', []);
  if (!Array.isArray(raw)) return [];
  const list = raw.filter(r => r && r.id).map(r => r.location ? { ...r, location: { ...r.location, city: r.location.city?.replace(/^city_/, ''), cities: r.location.cities?.map(c => c?.replace(/^city_/, '')) } } : r); 
  // Deduplicate
  return Array.from(new Map(list.map(r => [r.id, r])).values());
}
export function saveSalesRep(rep: SalesRep) {
  const list = getSalesReps();
  const idx = list.findIndex(r => r.id === rep.id);
  if (idx >= 0) list[idx] = rep; else list.push(rep);
  const changed = save('sales_reps', list);
  if (changed) notifyMutation();
  if (isSupabaseConfigured && !rep.id.startsWith('demo_')) {
    withLock(`rep_${rep.id}`, () => 
      (supabase.from('sales_reps').upsert(mapRepToDB(rep)) as any).then(({error}) => {
        if (error) {
          if (error.name === 'AbortError' || error.message?.includes('Lock broken')) return;
          if (error.message.includes('sales_reps_pharma_id_fkey')) {
            console.warn("Ghost pharma detected. Self-healing to Independent...");
            rep.pharmaId = 'default';
            rep.pharmaName = 'Independent / No Pharma';
            const updatedList = getSalesReps();
            const i = updatedList.findIndex(r => r.id === rep.id);
            if (i >= 0) updatedList[i] = rep;
            save('sales_reps', updatedList);
            notifyMutation();
            supabase.from('sales_reps').upsert(mapRepToDB(rep)).then(({error: retryErr}) => {
              if (retryErr) {
                window.dispatchEvent(new CustomEvent('lomixa_error', { detail: `Sales Rep DB Error: ${retryErr.message}` }));
              }
            });
            return;
          }
          console.error("Sales Rep Cloud Push Failed:", error);
          window.dispatchEvent(new CustomEvent('lomixa_error', { detail: `Sales Rep DB Error: ${error.message}` }));
        }
      })
    );
  }
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

export function allocateFundsToRep(repId: string, amount: number): boolean {
  if (amount <= 0) return false;
  const reps = getSalesReps();
  const repIdx = reps.findIndex(r => r.id === repId);
  if (repIdx < 0) return false;
  
  const pharmaId = reps[repIdx].pharmaId;
  const companies = getPharmaCompanies();
  const companyIdx = companies.findIndex(c => c.id === pharmaId);
  if (companyIdx < 0) return false;
  if (companies[companyIdx].balance < amount) return false;
  
  // Deduct from company and persist
  companies[companyIdx].balance -= amount;
  savePharmaCompany(companies[companyIdx]);
  
  // Add to rep and persist using robust upsert mechanism
  reps[repIdx].balance = (reps[repIdx].balance || 0) + amount;
  saveSalesRep(reps[repIdx]);
  
  return true;
}

export function topupRepBalance(repId: string, amount: number) {
  const reps = getSalesReps();
  const idx = reps.findIndex(r => r.id === repId);
  if (idx < 0) return;
  reps[idx].balance = (reps[idx].balance || 0) + amount;
  saveSalesRep(reps[idx]);
}

export function getPharmaCompanies(): PharmaCompany[] { 
  const raw = load<PharmaCompany[]>('pharma_companies', []);
  if (!Array.isArray(raw)) return [];
  const list = raw.filter(p => p && p.id).map(p => p.location ? { ...p, location: { ...p.location, city: p.location.city?.replace(/^city_/, '') } } : p); 
  // Deduplicate
  return Array.from(new Map(list.map(p => [p.id, p])).values());
}
export function savePharmaCompany(company: PharmaCompany) {
  const list = getPharmaCompanies();
  const idx = list.findIndex(c => c.id === company.id);
  const oldName = idx >= 0 ? list[idx].name : null;
  
  if (idx >= 0) list[idx] = company; else list.push(company);
  const changed = save('pharma_companies', list);
  
  // Cascade name change to reps and visits if name changed
  if (oldName && oldName !== company.name) {
    const reps = getSalesReps();
    const affectedReps = reps.filter(r => r.pharmaId === company.id);
    if (affectedReps.length > 0) {
      affectedReps.forEach(r => r.pharmaName = company.name);
      save('sales_reps', reps);
      // Background sync will eventually push these to cloud
    }

    const visits = getVisits();
    const affectedVisits = visits.filter(v => v.pharmaId === company.id);
    if (affectedVisits.length > 0) {
      affectedVisits.forEach(v => v.pharmaName = company.name);
      save('visits', visits);
    }

    const bundleReqs = getBundleRequests();
    const affectedBundles = bundleReqs.filter(b => b.pharmaId === company.id);
    if (affectedBundles.length > 0) {
      affectedBundles.forEach(b => b.pharmaName = company.name);
      save('bundle_requests', bundleReqs);
    }
  }

  if (changed) notifyMutation();
  if (isSupabaseConfigured && !company.id.startsWith('demo_')) {
    withLock(`pharma_${company.id}`, () => 
      (supabase.from('pharma_companies').upsert(mapPharmaToDB(company)) as any).then(({error}) => {
        if (error) {
          if (error.name === 'AbortError' || error.message?.includes('Lock broken')) return;
          console.error("Pharma Cloud Push Failed:", error);
          window.dispatchEvent(new CustomEvent('lomixa_error', { detail: `Pharma DB Error: ${error.message}` }));
        }
      })
    );
  }
}
export function deletePharma(id: string) {
  // 1. Purge associated representatives from the grid
  const reps = getSalesReps();
  const associatedReps = reps.filter(r => r.pharmaId === id);
  associatedReps.forEach(r => {
    save('sales_reps', getSalesReps().filter(sr => sr.id !== r.id));
    if (isSupabaseConfigured) {
      supabase.from('sales_reps').delete().eq('id', r.id).then();
    }
  });

  // 2. Remove the Pharma entity
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
  if (isSupabaseConfigured && !visit.doctorId.startsWith('demo_') && !visit.repId.startsWith('demo_')) {
    supabase.from('visits').upsert(mapVisitToDB(visit)).then(({error}) => {
      if (error) {
        if (error.name === 'AbortError' || error.message?.includes('Lock broken')) return;
        console.error("Cloud push failed for visit:", error);
        // If it's a foreign key error, it likely means the Doctor/Rep profile isn't in Supabase yet.
        // We'll show a more helpful message.
        const isFkError = error.message.toLowerCase().includes('foreign key') || error.code === '23503';
        if (isFkError) {
          window.dispatchEvent(new CustomEvent('lomixa_error', { 
            detail: `Database Sync Pending: Your profile is not yet fully synchronized. We are attempting to fix this now. Please try again in 5 seconds.` 
          }));
          // Proactive fix: Force-push current user's entity
          supabase.auth.getUser().then(({data: {user}}) => {
            if (user) ensureUserEntityExists(user);
          });
        } else {
          window.dispatchEvent(new CustomEvent('lomixa_error', { detail: `Failed to save visit to database: ${error.message}` }));
        }
      }
    });
  }
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
  const current = getNotifications();
  const unreadIds = current.filter(n => !n.read).map(n => n.id);
  
  const list = current.map(n => ({ ...n, read: true }));
  save('notifications', list);
  notifyMutation();
  
  if (isSupabaseConfigured && unreadIds.length > 0) {
    supabase.from('notifications')
      .update({ read: true })
      .in('id', unreadIds)
      .then(({error}) => error && console.error("Cloud push failed:", error));
  }
}

export function clearAllNotifications() {
  save('notifications', []);
  notifyMutation();
  // Optional: Add cloud delete if needed
}

// ── RATINGS ──────────────────────────────────────────────────
export function getRatings(): Rating[] {
  return load<Rating[]>('ratings', []);
}

export function doctorAverageRating(doctorId: string): number {
  const all = getRatings().filter(r => r.doctorId === doctorId && r.type === 'rep_to_doctor');
  if (all.length === 0) return 0;
  return Math.round((all.reduce((s, r) => s + r.rating, 0) / all.length) * 10) / 10;
}

export function saveRating(r: Rating) {
  const list = getRatings();
  list.push(r);
  save('ratings', list);
  notifyMutation();
  
  if (isSupabaseConfigured) {
    supabase.from('ratings').upsert({
      id: r.id,
      visit_id: r.visitId,
      doctor_id: r.doctorId,
      rep_id: r.repId,
      rating: r.rating,
      comment: r.comment,
      type: r.type,
      created_at: r.createdAt
    }).then();
  }
}


export function getAdminBalance(): number { return load<number>('admin_balance', 0); }

export function saveAdminBalance(balance: number) {
  save('admin_balance', balance);
  notifyMutation();
  if (isSupabaseConfigured) {
    supabase.from('platform_finance').upsert({
      id: '00000000-0000-0000-0000-000000000000',
      admin_balance: balance,
      updated_at: new Date().toISOString()
    }).then(({error}) => error && console.error("Admin Balance Push Failed:", error));
  }
}

export function processVisitPayment(amount: number, doctorId: string) {
  if (!amount || amount <= 0) return;

  // 1. Calculate split (20% to admin, 80% to service provider)
  const adminShare = Math.floor(amount * 0.2);
  const providerShare = amount - adminShare; 

  // 2. Update Admin Balance
  const currentAdminBalance = getAdminBalance();
  saveAdminBalance(currentAdminBalance + adminShare);

  // 3. Determine if doctor belongs to a hospital
  const doctors = getDoctors();
  let doctor = doctors.find(d => d.id === doctorId);
  
  // Extra safety: If not found by ID (maybe old data), try by userId or email
  if (!doctor) doctor = doctors.find(d => d.userId === doctorId);

  if (!doctor) return;

  // Self-Healing: If we find a LATER record with a hospital link for this same person, use that!
  const betterLinkedDoc = doctors.find(d => d.email === doctor.email && d.hospitalId && d.hospitalId !== 'default');
  if (betterLinkedDoc) doctor = betterLinkedDoc;

  const hospitalId = doctor.hospitalId;


  if (hospitalId && hospitalId !== 'default') {
    // Split 80% to Hospital
    const hospitals = getHospitals();
    const hospIdx = hospitals.findIndex(h => h.id === hospitalId);
    if (hospIdx >= 0) {
      hospitals[hospIdx].balance = (Number(hospitals[hospIdx].balance) || 0) + providerShare;
      saveHospital(hospitals[hospIdx]);
      
      // Log Hospital Payout
      saveTransaction({
        id: generateId(),
        type: 'visit_payout',
        amount: providerShare,
        currency: 'SAR',
        fromId: 'system',
        fromName: 'Escrow',
        toId: hospitals[hospIdx].id,
        toName: hospitals[hospIdx].name,
        createdAt: new Date().toISOString()
      });
    } else {
      // Fallback to doctor if hospital not found
      doctor.balance = (Number(doctor.balance) || 0) + providerShare;
      saveDoctor(doctor);

      // Log Doctor Payout
      saveTransaction({
        id: generateId(),
        type: 'visit_payout',
        amount: providerShare,
        currency: 'SAR',
        fromId: 'system',
        fromName: 'Escrow',
        toId: doctor.id,
        toName: doctor.name,
        createdAt: new Date().toISOString()
      });
    }
  } else {
    // 80% to independent Doctor
    doctor.balance = (Number(doctor.balance) || 0) + providerShare;
    saveDoctor(doctor);

    // Log Independent Payout
    saveTransaction({
      id: generateId(),
      type: 'visit_payout',
      amount: providerShare,
      currency: 'SAR',
      fromId: 'system',
      fromName: 'Escrow',
      toId: doctor.id,
      toName: doctor.name,
      createdAt: new Date().toISOString()
    });
  }

  // Log Admin Commission
  saveTransaction({
    id: generateId(),
    type: 'admin_commission',
    amount: adminShare,
    currency: 'SAR',
    fromId: doctor.id,
    fromName: doctor.name,
    toId: 'admin',
    toName: 'System Admin',
    createdAt: new Date().toISOString()
  });
}


export function refundVisitPayment(amount: number, doctorId: string) {
  if (!amount || amount <= 0) return;

  const adminShare = Math.floor(amount * 0.2);
  const providerShare = amount - adminShare;

  // 1. Deduct from Admin
  const currentAdminBalance = getAdminBalance();
  saveAdminBalance(Math.max(0, currentAdminBalance - adminShare));

  // 2. Deduct from Doctor or Hospital
  const doctors = getDoctors();
  const doctor = doctors.find(d => d.id === doctorId);
  if (!doctor) return;

  const hospitalId = doctor.hospitalId;

  if (hospitalId && hospitalId !== 'default') {
    const hospitals = getHospitals();
    const hospIdx = hospitals.findIndex(h => h.id === hospitalId);
    if (hospIdx >= 0) {
      hospitals[hospIdx].balance = Math.max(0, (Number(hospitals[hospIdx].balance) || 0) - providerShare);
      saveHospital(hospitals[hospIdx]);
    } else {
      doctor.balance = Math.max(0, (Number(doctor.balance) || 0) - providerShare);
      saveDoctor(doctor);
    }
  } else {
    doctor.balance = Math.max(0, (Number(doctor.balance) || 0) - providerShare);
    saveDoctor(doctor);
  }
}



export function getBundles(): Bundle[] { return BUNDLES; }

export function getProfile(userId: string) { return load<Record<string, any>>(`profile_${userId}`, {}); }
export function saveProfile(userId: string, profile: Record<string, any>) { 
  save(`profile_${userId}`, profile); 
  notifyMutation();
}

/**
 * Checks if a given date and time is in the past.
 */
export function isDateTimePast(dateStr: string, timeStr: string): boolean {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return date.getTime() < Date.now();
  } catch (e) {
    return false;
  }
}

/** Returns true when a pending visit’s scheduled time is already past */
export function isPendingExpired(v: Visit): boolean {
  return v.status === 'Pending' && isDateTimePast(v.date, v.time);
}

/**
 * Purges expired availability slots for all doctors.
 */
export async function purgeExpiredSlots() {
  const doctors = getDoctors();
  let hasChanges = false;

  for (const doc of doctors) {
    const slots = getDoctorAvailability(doc.id);
    const remaining = slots.filter(s => !isDateTimePast(s.date, s.time));
    
    if (remaining.length !== slots.length) {
      save(`availability_${doc.id}`, remaining);
      hasChanges = true;
      
      if (isSupabaseConfigured) {
        // Find deleted IDs to purge from cloud
        const remainingIds = remaining.map(r => r.id);
        const deletedIds = slots.filter(s => !remainingIds.includes(s.id)).map(s => s.id);
        if (deletedIds.length > 0) {
          supabase.from('availability_slots').delete().in('id', deletedIds).then();
        }
      }
    }
  }

  if (hasChanges) notifyMutation();
}

/**
 * Purges expired appointments.
 */
export async function purgeExpiredAppointments() {
  const appointments = getAppointments();
  const now = Date.now();
  const remaining = appointments.filter(a => {
    try {
      return new Date(a.endTime || a.startTime).getTime() + 24 * 3600 * 1000 > now;
    } catch (e) { return true; }
  });

  if (remaining.length !== appointments.length) {
    save('appointments', remaining);
    notifyMutation();
    
    if (isSupabaseConfigured) {
      const remainingIds = remaining.map(r => r.id);
      const deletedIds = appointments.filter(a => !remainingIds.includes(a.id)).map(a => a.id);
      if (deletedIds.length > 0) {
        supabase.from('appointments').delete().in('id', deletedIds).then();
      }
    }
  }
}

export function getDoctorAvailability(doctorId: string): AvailabilitySlot[] {
  return load<AvailabilitySlot[]>(`availability_${doctorId}`, []);
}
export function saveDoctorAvailability(doctorId: string, slots: AvailabilitySlot[]) {
  save(`availability_${doctorId}`, slots);
  notifyMutation();
  if (isSupabaseConfigured) {
    // Use upsert instead of full delete to prevent cascade deletion of visits
    supabase.from('availability_slots').select('id').eq('doctor_id', doctorId).then(({ data: currentSlots }) => {
      const newSlotIds = slots.map(s => s.id);
      const deletedIds = (currentSlots || []).filter(s => !newSlotIds.includes(s.id)).map(s => s.id);
      
      const updatePromises = [];
      
      if (deletedIds.length > 0) {
        updatePromises.push(supabase.from('availability_slots').delete().in('id', deletedIds));
      }
      
      if (slots.length > 0) {
        updatePromises.push(supabase.from('availability_slots').upsert(
          slots.map(s => ({
            id: s.id, doctor_id: doctorId, date: s.date, time: s.time, 
            appointment_type: s.appointmentType, duration: s.duration, is_booked: s.isBooked, price: s.price
          }))
        ));
      }

      Promise.all(updatePromises).catch(err => console.error("Failed to sync availability slots:", err));
    });
  }
}

export async function checkUserExistence(type: 'email' | 'phone', value: string): Promise<boolean> {
  const cleanValue = value.trim().toLowerCase();
  if (!isSupabaseConfigured) {
    const tables: any[] = [getDoctors(), getSalesReps(), getHospitals(), getPharmaCompanies()];
    return tables.some(table => table.some((item: any) => 
      (item[type] || '').toString().toLowerCase() === cleanValue
    ));
  }
  const tables = ['doctors', 'sales_reps', 'hospitals', 'pharma_companies'];
  try {
    // For emails, we want case-insensitive check. Supabase .eq is case-sensitive for some types.
    // Better to use .ilike or just accept .eq if the DB is configured for CITEXT (common in Supabase)
    // But to be safe across all roles:
    const results = await Promise.all(tables.map(table => 
      supabase.from(table).select('id').ilike(type, cleanValue).limit(1)
    ));
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
  relatedId?: string;
}) {
  saveNotification({
    id: generateId(),
    ...params,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export function deleteNotificationsByRelatedId(relatedId: string | undefined) {
  if (!relatedId) return;
  const notifs = load<Notification[]>('notifications', []);
  const toDelete = notifs.filter(n => n.relatedId === relatedId).map(n => n.id);
  if (toDelete.length === 0) return;
  save('notifications', notifs.filter(n => n.relatedId !== relatedId));
  notifyMutation();
  if (isSupabaseConfigured) {
    supabase.from('notifications').delete().in('id', toDelete).then();
  }
}

export function getBundleRequests(): BundleRequest[] {
  const raw = load<BundleRequest[]>('bundle_requests', []);
  if (!Array.isArray(raw)) return [];
  const list = raw.filter(r => r && r.id);
  // Deduplicate
  return Array.from(new Map(list.map(r => [r.id, r])).values());
}

export function saveBundleRequest(req: BundleRequest) {
  const reqs = getBundleRequests();
  const idx = reqs.findIndex(r => r.id === (req as any).id);
  const updated = idx >= 0 ? reqs.map((r, i) => i === idx ? req : r) : [...reqs, req];
  save('bundle_requests', updated);
  notifyMutation();
  if (isSupabaseConfigured && !req.pharmaId.startsWith('demo_')) {
    supabase.from('bundle_requests').upsert({
      id: req.id, pharma_id: req.pharmaId, pharma_name: req.pharmaName,
      bundle_id: req.bundleId, bundle_name: req.bundleName, balance: req.balance, 
      price: req.price, card_number: req.cardNumber, card_holder: req.cardHolder, 
      status: req.status, type: req.type || 'pharma'
    }).then(({error}) => {
      if (error) {
        console.error("Bundle Request Cloud Push Failed:", error);
        window.dispatchEvent(new CustomEvent('lomixa_error', { detail: `Cloud Push Failed: ${error.message}` }));
      }
    });
  }

  // Notify Admin for new requests (avoid duplicate notifications for updates)
  const isNewPending = req.status === 'pending_approval' && idx < 0;
  if (isNewPending) {
    pushNotification({
      userId: 'admin',
      title: 'New Bundle Request',
      message: `${req.pharmaName} has requested the ${req.bundleName} bundle.`,
      type: 'info'
    });
  }
}

export async function isUserAuthorized(uid?: string, role?: string): Promise<boolean> {
  try {
    if (!uid) return false;
    if (role === 'admin') return true;
    
    // Recovery path for platform administrator
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email === 'admin@gmail.com') return true;
    
    if (!role) return false;
    const checkLocal = () => {
      let entity: any;
      if (role === 'doctor') entity = getDoctors().find(d => d.userId === uid || d.id === uid);
      else if (role === 'pharma') entity = getPharmaCompanies().find(p => p.userId === uid || p.id === uid);
      else if (role === 'hospital') entity = getHospitals().find(h => h.userId === uid || h.id === uid);
      else if (role === 'rep') entity = getSalesReps().find(r => r.userId === uid || r.id === uid);
      return entity;
    };
    const local = checkLocal();
    if (local) return local.isActive !== false;
    if (!isSupabaseConfigured) return false;
    const table: Record<string, string> = { doctor: 'doctors', rep: 'sales_reps', pharma: 'pharma_companies', hospital: 'hospitals' };
    if (!table[role]) return false;
    const { data, error } = await supabase.from(table[role]).select('is_verified, is_active').eq('user_id', uid).single();
    if (error || !data) return false;
    const active = data.is_active === null ? true : data.is_active !== false;
    return active;
  } catch (err) { return false; }
}

export async function getAuthorizationDetails(uid: string, role: string): Promise<{ authorized: boolean; isPending?: boolean; reason?: string }> {
  try {
    if (!uid || !role) return { authorized: false };

    const table: Record<string, string> = { doctor: 'doctors', rep: 'sales_reps', pharma: 'pharma_companies', hospital: 'hospitals' };
    if (!table[role]) return { authorized: false };

    let found = false;
    let verified = false;
    let active = true;
    let rejectionReason = '';
    let approvalStatus: 'pending_approval' | 'approved' | 'rejected' = 'pending_approval';

    const checkLocal = () => {
      let entity: any;
      if (role === 'doctor') entity = getDoctors().find(d => d.userId === uid || d.id === uid);
      else if (role === 'pharma') entity = getPharmaCompanies().find(p => p.userId === uid || p.id === uid);
      else if (role === 'hospital') entity = getHospitals().find(h => h.userId === uid || h.id === uid);
      else if (role === 'rep') entity = getSalesReps().find(r => r.userId === uid || r.id === uid);
      return entity;
    };

    const localEntity = checkLocal();
    if (localEntity) {
      found = true;
      verified = !!localEntity.isVerified;
      active = localEntity.isActive !== false;
      rejectionReason = localEntity.rejectionReason || '';
      approvalStatus = localEntity.approvalStatus || (verified ? 'approved' : (rejectionReason ? 'rejected' : 'pending_approval'));
    } 

    // ALWAYS check cloud if local says not verified, not approved, or not found
    const isDemo = uid.startsWith('demo_');
    if (isSupabaseConfigured && !isDemo && (!localEntity || !verified || approvalStatus !== 'approved')) {
      const { data, error } = await supabase
        .from(table[role])
        .select('is_verified, is_active, rejection_reason, approval_status')
        .eq('user_id', uid)
        .maybeSingle();

      if (!error && data) {
        console.log("[AUTH DEBUG] Cloud data:", data);
        found = true;
        // ... (unchanged code)
        const cloudVerified = data.is_verified === true || data.is_verified === null;
        const cloudActive = data.is_active !== false;
        verified = verified || cloudVerified;
        active = active && cloudActive;
        rejectionReason = data.rejection_reason || rejectionReason;
        approvalStatus = data.approval_status || (cloudVerified ? 'approved' : (data.rejection_reason ? 'rejected' : 'pending_approval'));
        console.log("[AUTH DEBUG] Rejection Reason after merge:", rejectionReason);
        // ... (unchanged code)
        // Update local store with cloud state if they differ
        if (localEntity && (localEntity.isVerified !== cloudVerified || localEntity.approvalStatus !== approvalStatus)) {
          const updated = { 
            ...localEntity, 
            isVerified: cloudVerified, 
            isActive: cloudActive,
            approvalStatus: approvalStatus,
            rejectionReason: rejectionReason
          };
          if (role === 'pharma') savePharmaCompany(updated);
          else if (role === 'hospital') saveHospital(updated);
          else if (role === 'doctor') saveDoctor(updated);
          else if (role === 'rep') saveSalesRep(updated);
        }
      }
    }

    if (!found) return { authorized: false };
    if (!active) return { authorized: false, reason: rejectionReason || 'Account deactivated' };
    
    console.log("[AUTH DEBUG] Final Return for !verified:", { isPending: true, reason: rejectionReason });
    if (!verified || approvalStatus === 'pending_approval' || approvalStatus === 'rejected') {
      return { authorized: true, isPending: true, reason: rejectionReason };
    }

    return { authorized: true };
  } catch (err) {
    console.error("Authorization check failed:", err);
    return { authorized: true }; 
  }
}

export function deleteUserEntity(userId: string, role: string) {
  if (role === 'pharma') deletePharma(userId);
  else if (role === 'hospital') deleteHospital(userId);
  else if (role === 'doctor') deleteDoctor(userId);
  else if (role === 'rep') deleteSalesRep(userId);
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

const REPAIR_LOCKS = new Set<string>();

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
  if (!table || user.id.startsWith('demo_')) return;

  const lockKey = `${role}_${user.id}`;
  if (REPAIR_LOCKS.has(lockKey)) return;
  REPAIR_LOCKS.add(lockKey);

  try {
    let { data, error } = await supabase.from(table).select('*').eq('user_id', user.id).single();
    
    // Fallback: Check if an orphan record exists with the same email but NO user_id
    if ((error && error.code === 'PGRST116') || !data) {
      const email = user.email?.toLowerCase();
      if (email) {
        const { data: orphan } = await supabase.from(table).select('*').eq('email', email).is('user_id', null).maybeSingle();
        if (orphan) {
          console.info(`Found orphan ${role} record for ${email}. Linking to user ${user.id}...`);
          const { data: linked, error: linkErr } = await supabase.from(table).update({ user_id: user.id }).eq('id', orphan.id).select().single();
          if (!linkErr && linked) {
            data = linked;
            error = null;
          }
        }
      }
    }

    if ((error && error.code === 'PGRST116') || !data) {
      const m = user.user_metadata;
      const cleanEmail = user.email?.toLowerCase();
      if (role === 'doctor' && m) {
        const existingDoctor = getDoctors().find(d => 
          d.userId === user.id || 
          d.id === user.id ||
          (cleanEmail && d.email?.toLowerCase() === cleanEmail)
        );
        const updatedDoc = {
          ...existingDoctor,
          id: user.id,
          userId: user.id,
          name: existingDoctor?.name || m.full_name || user.email?.split('@')[0] || 'Doctor',
          title: existingDoctor?.title || m.title || 'dr',
          specialty: existingDoctor?.specialty || m.specialty || '',
          experienceYears: existingDoctor?.experienceYears ?? (isNaN(parseInt(m.experience_years)) ? 0 : parseInt(m.experience_years)),
          hospitalId: existingDoctor?.hospitalId || m.hospital_id || 'default',
          hospitalName: existingDoctor?.hospitalName || m.hospital_name || 'Hospital',
          phone: existingDoctor?.phone || m.phone || '',
          email: (existingDoctor?.email || user.email || '').toLowerCase(),
          isVerified: existingDoctor?.isVerified ?? false,
          isActive: existingDoctor?.isActive ?? true,
          role: 'doctor',
          location: existingDoctor?.location || { country: m.country || 'sa' },
          availability: existingDoctor?.availability || [],
          approvalStatus: existingDoctor?.approvalStatus || (existingDoctor?.isVerified ? 'approved' : 'pending_approval'),
          rejectionReason: existingDoctor?.rejectionReason
        };
        saveDoctor(updatedDoc);
      } else if (role === 'rep' && m) {
        const existingRep = getSalesReps().find(r => 
          r.userId === user.id || 
          r.id === user.id ||
          (cleanEmail && r.email?.toLowerCase() === cleanEmail)
        );
        const updatedRep = {
          ...existingRep,
          id: user.id,
          userId: user.id,
          name: existingRep?.name || m.full_name || user.email?.split('@')[0] || 'Rep',
          phone: existingRep?.phone || m.phone || '',
          email: (existingRep?.email || user.email || '').toLowerCase(),
          pharmaId: existingRep?.pharmaId || m.pharma_id || 'default',
          pharmaName: existingRep?.pharmaName || m.pharma_name || 'Pharma',
          target: existingRep?.target ?? (isNaN(parseInt(m.target)) ? 25 : parseInt(m.target)),
          visitsThisMonth: existingRep?.visitsThisMonth || 0,
          balance: existingRep?.balance || 0,
          isVerified: existingRep?.isVerified ?? false,
          isActive: existingRep?.isActive ?? true,
          role: 'rep',
          location: existingRep?.location || { country: m.country || 'sa' },
          approvalStatus: existingRep?.approvalStatus || (existingRep?.isVerified ? 'approved' : 'pending_approval'),
          rejectionReason: existingRep?.rejectionReason
        };
        saveSalesRep(updatedRep);
      } else if (role === 'pharma' && m) {
        const existingPharma = getPharmaCompanies().find(p => p.userId === user.id || p.id === user.id);
        const updatedPharma = {
          ...existingPharma,
          id: user.id,
          userId: user.id,
          name: existingPharma?.name || m.organization || user.email?.split('@')[1]?.split('.')[0] || 'Pharma',
          balance: existingPharma?.balance ?? 5000,
          isActive: existingPharma?.isActive ?? true,
          isVerified: existingPharma?.isVerified ?? false,
          location: existingPharma?.location || { country: m.country || 'sa' },
          approvalStatus: existingPharma?.approvalStatus || (existingPharma?.isVerified ? 'approved' : 'pending_approval'),
          rejectionReason: existingPharma?.rejectionReason
        };
        savePharmaCompany(updatedPharma);
      } else if (role === 'hospital' && m) {
        const existingHospital = getHospitals().find(h => h.userId === user.id || h.id === user.id);
        const updatedHosp = {
          ...existingHospital,
          id: user.id,
          userId: user.id,
          name: existingHospital?.name || m.organization || 'Clinic/Hospital',
          location: existingHospital?.location || { country: m.country || 'sa' },
          type: existingHospital?.type || 'clinic',
          isActive: existingHospital?.isActive ?? true,
          isVerified: existingHospital?.isVerified ?? false,
          approvalStatus: existingHospital?.approvalStatus || (existingHospital?.isVerified ? 'approved' : 'pending_approval'),
          rejectionReason: existingHospital?.rejectionReason
        };
        saveHospital(updatedHosp);
      }
      return;
    }

    if (error) return;

    // Sync cloud data to local state with conflict resolution (Local-First)
    // IMPORTANT: isVerified and isActive are included as fallback keys so that
    // a locally-approved entity is never downgraded by a stale cloud record.
    if (role === 'pharma') {
      const cloud = mapPharmaFromDB(data);
      savePharmaCompany(mergeData(getPharmaCompanies(), [cloud], ['balance']).find(p => p.id === cloud.id) || cloud);
    } else if (role === 'hospital') {
      const cloud = mapHospitalFromDB(data);
      saveHospital(mergeData(getHospitals(), [cloud], ['balance']).find(h => h.id === cloud.id) || cloud);
    } else if (role === 'doctor') {
      const cloud = mapDoctorFromDB(data);
      saveDoctor(mergeData(getDoctors(), [cloud], ['balance', 'availability']).find(d => d.id === cloud.id) || cloud);
    } else if (role === 'rep') {
      const cloud = mapRepFromDB(data);
      saveSalesRep(mergeData(getSalesReps(), [cloud], ['balance', 'target', 'visitsThisMonth']).find(r => r.id === cloud.id) || cloud);
    }

  } catch (err) {
    console.error("Failed to ensure user entity exists:", err);
  } finally {
    REPAIR_LOCKS.delete(lockKey);
  }
}

export function isRepSubscribed(repIdOrUserId: string): boolean {
  return true; // Subscription requirement removed as per user request
}

/**
 * Calculates remaining days for a Sales Rep's subscription.
 */
export function getSubscriptionRemainingDays(repIdOrUserId: string): number | null {
  const reps = getSalesReps();
  const rep = reps.find(r => r.id === repIdOrUserId || r.userId === repIdOrUserId);
  
  // Try to find the expiry from the rep object first
  if (rep && rep.subscription && rep.subscription.status === 'active') {
    const expiry = new Date(rep.subscription.expiryDate);
    const diffTime = expiry.getTime() - Date.now();
    return diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
  }

  // Fallback: If not synced to rep yet, find the approved request and infer days
  const requests = getBundleRequests();
  const req = requests.find(r => 
     r.status === 'approved' && 
     r.type === 'rep' &&
     (r.pharmaId === repIdOrUserId || (rep?.name && r.pharmaName && rep.name && r.pharmaName.toUpperCase() === rep.name.toUpperCase()))
  );

  if (req) {
    // If we have an approved request, it was for at least 1 month (30 days)
    // We can show the balance/months from the request as a temporary UI bridge
    return (req.balance || 1) * 30; 
  }
  
  return null;
}

/**
 * Returns the maximum days for a rep's current subscription plan.
 */
export function getSubscriptionMaxDays(repIdOrUserId: string): number {
  const reps = getSalesReps();
  const rep = reps.find(r => r.id === repIdOrUserId || r.userId === repIdOrUserId);
  
  if (rep && rep.subscription) {
    const pid = rep.subscription.planId as any;
    if (pid === '1_month') return 30;
    if (pid === '3_months') return 90;
    if (pid === '12_months') return 365;
  }

  // Fallback to check approved requests
  const requests = getBundleRequests();
  const req = requests.find(r => 
     r.status === 'approved' && 
     r.type === 'rep' &&
     (r.pharmaId === repIdOrUserId || (rep?.name && r.pharmaName && rep.name && r.pharmaName.toUpperCase() === rep.name.toUpperCase()))
  );
  
  if (req) {
     const bid = (req as any).bundleId;
     if (bid === '1_month') return 30;
     if (bid === '3_months') return 90;
     if (bid === '12_months') return 365;
  }

  return 30;
}

/**
 * Handles the subscription logic for a Sales Rep.
 */
export function processRepSubscription(
  repId: string, 
  planId: '1_month' | '3_months' | '12_months', 
  amount: number, 
  currency: string
) {
  const reps = getSalesReps();
  
  // Advanced search with name fallback to fix sync issues
  let repIdx = reps.findIndex(r => r.id === repId || r.userId === repId);
  
  if (repIdx < 0) {
     // Last resort: find by bundle request pharmaName if possible
     const requests = getBundleRequests();
     const req = requests.find(r => r.pharmaId === repId || r.id === repId);
     if (req?.pharmaName) {
        repIdx = reps.findIndex(r => r.name && r.name.toUpperCase() === req.pharmaName.toUpperCase());
     }
  }

  if (repIdx < 0) {
    console.error(`[processRepSubscription] Critical Error: Rep not found for ID ${repId}`);
    return;
  }

  const rep = reps[repIdx];
  const months = planId === '1_month' ? 1 : (planId === '3_months' ? 3 : 12);
  
  const startDate = new Date();
  const expiryDate = new Date();
  
  const baseDate = (rep.subscription && rep.subscription.status === 'active') 
    ? new Date(rep.subscription.expiryDate) 
    : startDate;

  expiryDate.setTime(baseDate.getTime());
  expiryDate.setMonth(expiryDate.getMonth() + months);

  rep.subscription = {
    planId,
    status: 'active',
    startDate: startDate.toISOString(),
    expiryDate: expiryDate.toISOString()
  };
  rep.isVerified = true;
  rep.approvalStatus = 'approved';
  rep.isActive = true;
  rep.rejectionReason = '';
  
  // Heal the ID/UserID if this was a loose match
  if (rep.id !== repId && rep.userId !== repId) {
     console.log(`[processRepSubscription] Healing Rep ID from ${rep.id} to ${repId}`);
     rep.userId = repId;
  }
  
  saveSalesRep(rep);

  // 2. Transfer money to Admin balance
  const currentAdminBalance = getAdminBalance();
  saveAdminBalance(currentAdminBalance + amount);

  // 3. Log the transaction for admin records
  saveTransaction({
    id: generateId(),
    type: 'rep_subscription',
    amount,
    currency,
    fromId: rep.id,
    fromName: rep.name,
    toId: 'admin',
    toName: 'System Admin',
    createdAt: new Date().toISOString()
  });

  // 4. Send notification to the representative
  pushNotification({
    userId: rep.userId || rep.id,
    title: `LOMIXA Subscription Activated`,
    message: `Thank you for subscribing to our ${planId.replace('_', ' ')} plan! Your access is fully active until ${expiryDate.toLocaleDateString()}.`,
    type: 'info'
  });
}

// ── APPOINTMENTS & VIDEO CALLS ──────────────────────────────────
export function getAppointments(): Appointment[] {
  return load<Appointment[]>('appointments', []);
}

export function saveAppointment(appointment: Appointment) {
  const list = getAppointments();
  const idx = list.findIndex(a => a.id === appointment.id);
  if (idx >= 0) list[idx] = appointment; else list.push(appointment);
  save('appointments', list);
  notifyMutation();
  if (isSupabaseConfigured) {
    supabase.from('appointments').upsert(mapAppointmentToDB(appointment)).then(({error}) => error && console.error("Appointment Cloud Push Failed:", error));
  }
}

export async function getServerTime(): Promise<Date> {
  if (!isSupabaseConfigured) return new Date();
  try {
    const { data, error } = await supabase.rpc('get_server_time');
    if (error) throw error;
    return new Date(data);
  } catch (err) {
    console.warn("getServerTime RPC failed, trying fallback:", err);
    try {
      // Fallback: try to get time from any table metadata or just use client time
      const { data } = await supabase.from('appointments').select('now()').limit(1);
      if (data && (data as any)[0]?.now) return new Date((data as any)[0].now);
    } catch (fallbackErr) {
       console.warn("getServerTime fallback failed:", fallbackErr);
    }
    return new Date(); 
  }
}
