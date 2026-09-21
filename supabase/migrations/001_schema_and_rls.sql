-- =============================================================================
-- SKILL EVO LMS -- Database Schema + Row Level Security Policies
-- Idempotent: safe to run multiple times (drops existing policies first)
-- =============================================================================

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  role        text not null default 'student' check (role in ('student', 'instructor')),
  created_at  timestamptz not null default now()
);

-- Trigger: auto-create profile row on new user signup
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
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. COURSES TABLE
-- ============================================================

create table if not exists public.courses (
  id            uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  description   text not null default '',
  category      text,
  thumbnail_url text,
  published     boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 3. LESSONS TABLE
-- ============================================================

create table if not exists public.lessons (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  title       text not null,
  description text,
  video_url   text,
  order_index integer not null default 1,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 4. ENROLLMENTS TABLE
-- ============================================================

create table if not exists public.enrollments (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id  uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, course_id)
);

-- ============================================================
-- 5. LESSON PROGRESS TABLE
-- ============================================================

create table if not exists public.lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.profiles(id) on delete cascade,
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  course_id    uuid not null references public.courses(id) on delete cascade,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (student_id, lesson_id)
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- Enable RLS on all tables
-- =============================================================================


-- Ensure columns exist if tables already exist
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text not null default 'student';

alter table public.courses add column if not exists instructor_id uuid references public.profiles(id) on delete cascade;
alter table public.courses add column if not exists title text not null default '';
alter table public.courses add column if not exists description text not null default '';
alter table public.courses add column if not exists category text;
alter table public.courses add column if not exists thumbnail_url text;
alter table public.courses add column if not exists published boolean not null default false;

alter table public.lessons add column if not exists course_id uuid references public.courses(id) on delete cascade;
alter table public.lessons add column if not exists title text not null default '';
alter table public.lessons add column if not exists description text;
alter table public.lessons add column if not exists video_url text;
alter table public.lessons add column if not exists order_index integer not null default 1;

alter table public.enrollments add column if not exists student_id uuid references public.profiles(id) on delete cascade;
alter table public.enrollments add column if not exists course_id uuid references public.courses(id) on delete cascade;
alter table public.enrollments add column if not exists created_at timestamptz not null default now();
alter table public.enrollments add column if not exists enrolled_at timestamptz not null default now();

-- CRITICAL FIX FOR ERROR 42703 (lesson_progress.course_id does not exist):
alter table public.lesson_progress add column if not exists student_id uuid references public.profiles(id) on delete cascade;
alter table public.lesson_progress add column if not exists lesson_id uuid references public.lessons(id) on delete cascade;
alter table public.lesson_progress add column if not exists course_id uuid references public.courses(id) on delete cascade;
alter table public.lesson_progress add column if not exists completed boolean not null default false;
alter table public.lesson_progress add column if not exists completed_at timestamptz;

-- Backfill course_id from lessons table
update public.lesson_progress lp
set course_id = l.course_id
from public.lessons l
where lp.lesson_id = l.id
  and lp.course_id is null;

alter table public.profiles        enable row level security;
alter table public.courses         enable row level security;
alter table public.lessons         enable row level security;
alter table public.enrollments     enable row level security;
alter table public.lesson_progress enable row level security;

-- =============================================================================
-- DROP ALL EXISTING POLICIES (idempotent cleanup)
-- =============================================================================

-- profiles
drop policy if exists "Authenticated users can view profiles"  on public.profiles;
drop policy if exists "Users can update own profile"           on public.profiles;

-- courses
drop policy if exists "Anyone can view published courses"      on public.courses;
drop policy if exists "Instructors can view own courses"       on public.courses;
drop policy if exists "Instructors can create courses"         on public.courses;
drop policy if exists "Instructors can update own courses"     on public.courses;
drop policy if exists "Instructors can delete own courses"     on public.courses;

-- lessons
drop policy if exists "Anyone can view lessons of published courses" on public.lessons;
drop policy if exists "Instructors can view own course lessons"      on public.lessons;
drop policy if exists "Enrolled students can view lessons"           on public.lessons;
drop policy if exists "Instructors can insert lessons"               on public.lessons;
drop policy if exists "Instructors can update lessons"               on public.lessons;
drop policy if exists "Instructors can delete lessons"               on public.lessons;

-- enrollments
drop policy if exists "Students can view own enrollments"            on public.enrollments;
drop policy if exists "Instructors can view course enrollments"      on public.enrollments;
drop policy if exists "Students can enroll in published courses"     on public.enrollments;
drop policy if exists "Students can delete own enrollments"          on public.enrollments;

-- lesson_progress
drop policy if exists "Students can view own progress"               on public.lesson_progress;
drop policy if exists "Instructors can view course progress"         on public.lesson_progress;
drop policy if exists "Students can insert own progress"             on public.lesson_progress;
drop policy if exists "Students can update own progress"             on public.lesson_progress;
drop policy if exists "Students can delete own progress"             on public.lesson_progress;

-- =============================================================================
-- CREATE POLICIES
-- =============================================================================

-- ---- PROFILES ---------------------------------------------------------------

create policy "Authenticated users can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---- COURSES ----------------------------------------------------------------

create policy "Anyone can view published courses"
  on public.courses for select
  using (published = true);

create policy "Instructors can view own courses"
  on public.courses for select
  to authenticated
  using (instructor_id = auth.uid());

create policy "Instructors can create courses"
  on public.courses for insert
  to authenticated
  with check (
    instructor_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'instructor'
    )
  );

create policy "Instructors can update own courses"
  on public.courses for update
  to authenticated
  using (instructor_id = auth.uid())
  with check (instructor_id = auth.uid());

create policy "Instructors can delete own courses"
  on public.courses for delete
  to authenticated
  using (instructor_id = auth.uid());

-- ---- LESSONS ----------------------------------------------------------------

create policy "Anyone can view lessons of published courses"
  on public.lessons for select
  using (
    exists (
      select 1 from public.courses
      where id = lessons.course_id and published = true
    )
  );

create policy "Instructors can view own course lessons"
  on public.lessons for select
  to authenticated
  using (
    exists (
      select 1 from public.courses
      where id = lessons.course_id and instructor_id = auth.uid()
    )
  );

create policy "Enrolled students can view lessons"
  on public.lessons for select
  to authenticated
  using (
    exists (
      select 1 from public.enrollments
      where course_id = lessons.course_id and student_id = auth.uid()
    )
  );

create policy "Instructors can insert lessons"
  on public.lessons for insert
  to authenticated
  with check (
    exists (
      select 1 from public.courses
      where id = lessons.course_id and instructor_id = auth.uid()
    )
  );

create policy "Instructors can update lessons"
  on public.lessons for update
  to authenticated
  using (
    exists (
      select 1 from public.courses
      where id = lessons.course_id and instructor_id = auth.uid()
    )
  );

create policy "Instructors can delete lessons"
  on public.lessons for delete
  to authenticated
  using (
    exists (
      select 1 from public.courses
      where id = lessons.course_id and instructor_id = auth.uid()
    )
  );

-- ---- ENROLLMENTS ------------------------------------------------------------

create policy "Students can view own enrollments"
  on public.enrollments for select
  to authenticated
  using (student_id = auth.uid());

create policy "Instructors can view course enrollments"
  on public.enrollments for select
  to authenticated
  using (
    exists (
      select 1 from public.courses
      where id = enrollments.course_id and instructor_id = auth.uid()
    )
  );

create policy "Students can enroll in published courses"
  on public.enrollments for insert
  to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.courses
      where id = enrollments.course_id and published = true
    )
  );

create policy "Students can delete own enrollments"
  on public.enrollments for delete
  to authenticated
  using (student_id = auth.uid());

-- ---- LESSON PROGRESS --------------------------------------------------------

create policy "Students can view own progress"
  on public.lesson_progress for select
  to authenticated
  using (student_id = auth.uid());

create policy "Instructors can view course progress"
  on public.lesson_progress for select
  to authenticated
  using (
    exists (
      select 1 from public.courses
      where id = lesson_progress.course_id and instructor_id = auth.uid()
    )
  );

create policy "Students can insert own progress"
  on public.lesson_progress for insert
  to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.enrollments
      where course_id = lesson_progress.course_id
        and student_id = auth.uid()
    )
  );

create policy "Students can update own progress"
  on public.lesson_progress for update
  to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy "Students can delete own progress"
  on public.lesson_progress for delete
  to authenticated
  using (student_id = auth.uid());

-- =============================================================================
-- STORAGE BUCKET
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('course-thumbnails', 'course-thumbnails', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload thumbnails" on storage.objects;
drop policy if exists "Public can view thumbnails"                on storage.objects;
drop policy if exists "Users can update own thumbnails"           on storage.objects;
drop policy if exists "Users can delete own thumbnails"           on storage.objects;

create policy "Authenticated users can upload thumbnails"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'course-thumbnails');

create policy "Public can view thumbnails"
  on storage.objects for select
  using (bucket_id = 'course-thumbnails');

create policy "Users can update own thumbnails"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'course-thumbnails' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own thumbnails"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'course-thumbnails' and auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================================================
-- REALTIME
-- Enable realtime on critical tables
-- =============================================================================

do $$
begin
  begin
    alter publication supabase_realtime add table public.courses;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.lessons;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.enrollments;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.lesson_progress;
  exception when duplicate_object then null;
  end;
end $$;

-- =============================================================================
-- TABLE PERMISSIONS
-- Grant table access to anon and authenticated roles (RLS enforces policy rules)
-- =============================================================================

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all routines in schema public to anon, authenticated;

alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant all on routines to anon, authenticated;
