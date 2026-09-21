-- =============================================================================
-- Migration 004: Ensure public.enrollments has both enrolled_at and created_at
-- =============================================================================

alter table public.enrollments add column if not exists created_at timestamptz not null default now();
alter table public.enrollments add column if not exists enrolled_at timestamptz not null default now();

-- Sync values
update public.enrollments set created_at = enrolled_at where created_at is null;
update public.enrollments set enrolled_at = created_at where enrolled_at is null;
