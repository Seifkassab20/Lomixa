// Global store using localStorage for persistence across sessions
// This simulates a backend for demo purposes

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

// ---- HOSPITALS ----
export function getHospitals(): Hospital[] {
  return load<Hospital[]>('hospitals', []);
}
export function saveHospital(hospital: Hospital) {
  const list = getHospitals();
  const idx = list.findIndex(h => h.id === hospital.id);
  if (idx >= 0) list[idx] = hospital;
  else list.push(hospital);
  save('hospitals', list);
}

// ---- DOCTORS ----
export function getDoctors(): Doctor[] {
  return load<Doctor[]>('doctors', []);
}
export function saveDoctor(doctor: Doctor) {
  const list = getDoctors();
  const idx = list.findIndex(d => d.id === doctor.id);
  if (idx >= 0) list[idx] = doctor;
  else list.push(doctor);
  save('doctors', list);
}
export function deleteDoctor(id: string) {
  const list = getDoctors().filter(d => d.id !== id);
  save('doctors', list);
}

// ---- SALES REPS ----
export function getSalesReps(): SalesRep[] {
  return load<SalesRep[]>('sales_reps', []);
}
export function saveSalesRep(rep: SalesRep) {
  const list = getSalesReps();
  const idx = list.findIndex(r => r.id === rep.id);
  if (idx >= 0) list[idx] = rep;
  else list.push(rep);
  save('sales_reps', list);
}
export function deleteSalesRep(id: string) {
  const list = getSalesReps().filter(r => r.id !== id);
  save('sales_reps', list);
}

// ---- PHARMA COMPANIES ----
export function getPharmaCompanies(): PharmaCompany[] {
  return load<PharmaCompany[]>('pharma_companies', []);
}
export function savePharmaCompany(company: PharmaCompany) {
  const list = getPharmaCompanies();
  const idx = list.findIndex(c => c.id === company.id);
  if (idx >= 0) list[idx] = company;
  else list.push(company);
  save('pharma_companies', list);
}

// ---- VISITS ----
export function getVisits(): Visit[] {
  return load<Visit[]>('visits', []);
}
export function saveVisit(visit: Visit) {
  const list = getVisits();
  const idx = list.findIndex(v => v.id === visit.id);
  if (idx >= 0) list[idx] = visit;
  else list.push(visit);
  save('visits', list);
}

// ---- NOTIFICATIONS ----
export function getNotifications(): Notification[] {
  return load<Notification[]>('notifications', []);
}
export function saveNotification(n: Notification) {
  const list = getNotifications();
  list.unshift(n);
  save('notifications', list.slice(0, 50));
}
export function markNotificationRead(id: string) {
  const list = getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
  save('notifications', list);
}
export function markAllNotificationsRead() {
  const list = getNotifications().map(n => ({ ...n, read: true }));
  save('notifications', list);
}

// ---- TRANSACTIONS ----
export function getTransactions(): Transaction[] {
  return load<Transaction[]>('transactions', []);
}
export function saveTransaction(t: Transaction) {
  const list = getTransactions();
  list.unshift(t);
  save('transactions', list);
}

// ---- BUNDLES ----
export function getBundles(): Bundle[] {
  return BUNDLES;
}

// ---- PROFILE ----
export function getProfile(userId: string) {
  return load<Record<string, any>>(`profile_${userId}`, {});
}
export function saveProfile(userId: string, profile: Record<string, any>) {
  save(`profile_${userId}`, profile);
}

// ---- AVAILABILITY ----
export function getDoctorAvailability(doctorId: string): AvailabilitySlot[] {
  return load<AvailabilitySlot[]>(`availability_${doctorId}`, []);
}
export function saveDoctorAvailability(doctorId: string, slots: AvailabilitySlot[]) {
  save(`availability_${doctorId}`, slots);
  // Also update the doctor record
  const doctors = getDoctors();
  const idx = doctors.findIndex(d => d.id === doctorId);
  if (idx >= 0) {
    doctors[idx].availability = slots;
    save('doctors', doctors);
  }
}

// ---- UTILITIES ----
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
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
