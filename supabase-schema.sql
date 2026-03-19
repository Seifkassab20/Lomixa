-- MedVisit Connect Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User Roles Table
create table public.user_roles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text check (role in ('pharma', 'hospital', 'doctor', 'rep')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Pharma Companies Table
create table public.pharma_companies (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  credits_available integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Hospitals Table
create table public.hospitals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Doctors Table
create table public.doctors (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  hospital_id uuid references public.hospitals(id) on delete set null,
  name text not null,
  specialty text not null,
  experience_years integer,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sales Reps Table
create table public.sales_reps (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  pharma_id uuid references public.pharma_companies(id) on delete cascade not null,
  name text not null,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Visits / Bookings Table
create table public.visits (
  id uuid default uuid_generate_v4() primary key,
  doctor_id uuid references public.doctors(id) on delete cascade not null,
  rep_id uuid references public.sales_reps(id) on delete cascade not null,
  visit_date timestamp with time zone not null,
  visit_type text check (visit_type in ('In Person', 'Video', 'Call', 'Text')) not null,
  status text check (status in ('Pending', 'Confirmed', 'Completed', 'Cancelled')) default 'Pending' not null,
  duration_minutes integer default 30,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bundles / Transactions Table
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  pharma_id uuid references public.pharma_companies(id) on delete cascade not null,
  bundle_name text not null,
  credits_added integer not null,
  amount_sar numeric(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.user_roles enable row level security;
alter table public.pharma_companies enable row level security;
alter table public.hospitals enable row level security;
alter table public.doctors enable row level security;
alter table public.sales_reps enable row level security;
alter table public.visits enable row level security;
alter table public.transactions enable row level security;

-- Basic RLS (For a real app, these should be more restrictive)
create policy "Users can view their own role" on public.user_roles for select using (auth.uid() = user_id);
create policy "Anyone can view doctors" on public.doctors for select using (true);
create policy "Users can view their own visits" on public.visits for select using (
  exists (select 1 from public.doctors where doctors.id = visits.doctor_id and doctors.user_id = auth.uid()) or
  exists (select 1 from public.sales_reps where sales_reps.id = visits.rep_id and sales_reps.user_id = auth.uid())
);

-- Triggers for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.id, coalesce((new.raw_user_meta_data->>'role')::text, 'pharma'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
