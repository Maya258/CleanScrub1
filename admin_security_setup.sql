-- ============================================================
-- CLEAN SCRUB ADMIN SECURITY SETUP
-- Run this in Supabase SQL Editor AFTER you create your admin
-- user in Authentication > Users.
-- ============================================================

-- 1) Keep a private list of authorised admin accounts.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- 2) Secure helper used by booking policies.
create or replace function public.is_clean_scrub_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_clean_scrub_admin() from public;
grant execute on function public.is_clean_scrub_admin() to authenticated;

-- 3) Allow authenticated admins to read and manage bookings.
grant select, update, delete on table public.bookings to authenticated;

-- Remove these policies if you re-run this file, then recreate them cleanly.
drop policy if exists "Admins can view bookings" on public.bookings;
drop policy if exists "Admins can update bookings" on public.bookings;
drop policy if exists "Admins can delete bookings" on public.bookings;

create policy "Admins can view bookings"
on public.bookings
for select
to authenticated
using (public.is_clean_scrub_admin());

create policy "Admins can update bookings"
on public.bookings
for update
to authenticated
using (public.is_clean_scrub_admin())
with check (public.is_clean_scrub_admin());

create policy "Admins can delete bookings"
on public.bookings
for delete
to authenticated
using (public.is_clean_scrub_admin());

-- 4) Cancelled bookings should free their time slot.
-- Your first setup used a normal UNIQUE constraint, so replace it with
-- a partial unique index that applies only to active bookings.
alter table public.bookings
  drop constraint if exists unique_booking_slot;

drop index if exists public.unique_active_booking_slot;
create unique index unique_active_booking_slot
on public.bookings (booking_date, booking_time)
where coalesce(status, 'Pending') <> 'Cancelled';

-- 5) Public availability must ignore cancelled bookings.
create or replace view public.booking_slots as
select booking_date, booking_time
from public.bookings
where coalesce(status, 'Pending') <> 'Cancelled';

grant select on public.booking_slots to anon;

-- ============================================================
-- 6) ADD YOUR ADMIN ACCOUNT
-- FIRST create the account in:
-- Supabase Dashboard > Authentication > Users > Add user
-- THEN replace YOUR_ADMIN_EMAIL below with that exact email and run.
-- ============================================================

-- Example:
-- insert into public.admin_users (user_id)
-- select id from auth.users
-- where email = 'cleanscrubpe@gmail.com'
-- on conflict (user_id) do nothing;

-- Replace the email below, remove the two dashes at the start, then run it:
-- insert into public.admin_users (user_id)
-- select id from auth.users
-- where email = 'YOUR_ADMIN_EMAIL'
-- on conflict (user_id) do nothing;
