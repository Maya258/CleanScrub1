-- Clean Scrub booking permissions / availability
-- Run only if you have not already created the availability view and insert policy.

alter table public.bookings enable row level security;

grant insert on table public.bookings to anon;

-- Create insert policy only if it does not already exist.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'bookings'
      and policyname = 'Allow public booking inserts'
  ) then
    create policy "Allow public booking inserts"
    on public.bookings
    for insert
    to anon
    with check (true);
  end if;
end $$;

-- Safe public availability view: only date and time are exposed.
create or replace view public.booking_slots as
select booking_date, booking_time
from public.bookings;

grant select on public.booking_slots to anon;
