-- Migration to add appointments table for Video Calling
create table if not exists public.appointments (
    id uuid primary key default uuid_generate_v4(),
    doctor_id uuid references public.doctors(id) on delete cascade,
    doctor_user_id uuid references auth.users(id),
    rep_id uuid references public.sales_reps(id) on delete cascade,
    rep_user_id uuid references auth.users(id),
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
    meeting_id text unique not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.appointments enable row level security;

-- Policies
create policy "Users can view their own appointments"
on public.appointments for select
to authenticated
using (
    doctor_user_id = auth.uid() or
    rep_user_id = auth.uid()
);

create policy "Doctors can update their own appointments"
on public.appointments for update
to authenticated
using (
    doctor_user_id = auth.uid()
);

-- Function to get server time
create or replace function get_server_time()
returns timestamp with time zone
language sql
stable
as $$
  select now();
$$;
