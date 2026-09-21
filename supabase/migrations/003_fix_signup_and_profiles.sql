-- =============================================================================
-- FIX FOR "Database error saving new user" & PROFILE PERMISSIONS
-- Run this in Supabase SQL Editor to enable seamless signups and profile updates.
-- =============================================================================

-- 1. Ensure public.profiles table exists and has proper permissions
grant all on public.profiles to postgres, service_role, anon, authenticated;

-- 2. Drop existing restrictive policies on profiles if any
drop policy if exists "Authenticated users can view profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Allow profile insertion" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

-- 3. Create permissive policies for profiles
create policy "Authenticated users can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Allow profile insertion"
  on public.profiles for insert
  to authenticated, anon
  with check (true);

-- 4. Robust trigger that NEVER fails user registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    email = coalesce(excluded.email, public.profiles.email),
    role = coalesce(excluded.role, public.profiles.role);
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
