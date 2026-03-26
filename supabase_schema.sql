-- Run this entire script in your Supabase SQL Editor to build the Lomixa Database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Hospitals Table
create table if not exists public.hospitals (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id),
    name text not null,
    location text,
    type text default 'hospital',
    is_active boolean default true,
    is_verified boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Pharma Companies Table
create table if not exists public.pharma_companies (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id),
    name text not null,
    balance integer default 0,
    is_active boolean default true,
    is_verified boolean default false,
    custom_bundles text, -- JSON string storage for custom pricing
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.doctors (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id),
    hospital_id uuid references public.hospitals(id) on delete cascade,
    hospital_name text,
    name text not null,
    specialty text,
    experience_years integer default 0,
    phone text,
    email text,
    is_active boolean default true,
    is_verified boolean default false,
    balance integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Doctor Availability Slots Table
create table if not exists public.availability_slots (
    id uuid primary key default uuid_generate_v4(),
    doctor_id uuid references public.doctors(id) on delete cascade,
    date date not null,
    time text not null,
    appointment_type text not null,
    duration integer default 30,
    is_booked boolean default false,
    price integer,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Sales Representatives Table
create table if not exists public.sales_reps (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id),
    pharma_id uuid references public.pharma_companies(id) on delete cascade,
    pharma_name text,
    name text not null,
    email text,
    phone text,
    target integer default 25,
    visits_this_month integer default 0,
    balance integer default 0,
    is_active boolean default true,
    is_verified boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Visits (Bookings) Table
create table if not exists public.visits (
    id uuid primary key default uuid_generate_v4(),
    doctor_id uuid references public.doctors(id) on delete cascade,
    doctor_name text not null,
    rep_id uuid references public.sales_reps(id) on delete cascade,
    rep_name text not null,
    rep_user_id uuid references auth.users(id),
    pharma_id uuid references public.pharma_companies(id),
    pharma_name text not null,
    hospital_id uuid references public.hospitals(id),
    hospital_name text not null,
    date date not null,
    time text not null,
    visit_type text not null,
    status text default 'Pending',
    duration_minutes integer default 30,
    notes text,
    outcome_notes text,
    price integer,
    cancelled_by_rep boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Notifications Table
create table if not exists public.notifications (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade,
    title text not null,
    message text not null,
    type text not null,
    read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Bundle Requests (New)
create table if not exists public.bundle_requests (
    id uuid primary key default uuid_generate_v4(),
    pharma_id uuid references public.pharma_companies(id) on delete cascade,
    pharma_name text,
    bundle_name text,
    balance integer,
    price integer,
    card_number text,
    card_holder text,
    status text default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Transactions (New)
create table if not exists public.transactions (
    id uuid primary key default uuid_generate_v4(),
    pharma_id uuid references public.pharma_companies(id) on delete cascade,
    bundle_name text,
    funds_added integer,
    amount_sar integer,
    date text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Platform Finance (New)
create table if not exists public.platform_finance (
    id uuid primary key default uuid_generate_v4(),
    admin_balance integer default 0,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed initial admin balance record
insert into public.platform_finance (id, admin_balance) 
values ('00000000-0000-0000-0000-000000000000', 0)
on conflict (id) do nothing;

-- Set up Row Level Security (RLS) policies 
alter table public.hospitals enable row level security;
alter table public.pharma_companies enable row level security;
alter table public.doctors enable row level security;
alter table public.availability_slots enable row level security;
alter table public.sales_reps enable row level security;
alter table public.visits enable row level security;
alter table public.notifications enable row level security;
alter table public.bundle_requests enable row level security;
alter table public.transactions enable row level security;
alter table public.platform_finance enable row level security;

-- Basic liberal policies (read/write if logged in)
create policy "Enable all for authenticated users" on public.hospitals for all to authenticated using (true);
create policy "Enable all for authenticated users" on public.pharma_companies for all to authenticated using (true);
create policy "Enable all for authenticated users" on public.doctors for all to authenticated using (true);
create policy "Enable all for authenticated users" on public.availability_slots for all to authenticated using (true);
create policy "Enable all for authenticated users" on public.sales_reps for all to authenticated using (true);
create policy "Enable all for authenticated users" on public.visits for all to authenticated using (true);
create policy "Enable all for authenticated users" on public.notifications for all to authenticated using (true);
create policy "Enable all for authenticated users" on public.bundle_requests for all to authenticated using (true);
create policy "Enable all for authenticated users" on public.transactions for all to authenticated using (true);
create policy "Enable all for authenticated users" on public.platform_finance for all to authenticated using (true);
