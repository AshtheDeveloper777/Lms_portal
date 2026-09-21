-- =============================================================================
-- Migration 005: Allow Instructors to view student enrollments and count per course
-- =============================================================================

drop policy if exists "Instructors can view course enrollments" on public.enrollments;

create policy "Instructors can view course enrollments"
  on public.enrollments for select
  to authenticated
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'instructor'
    )
    or exists (
      select 1 from public.courses
      where id = enrollments.course_id and instructor_id = auth.uid()
    )
  );

drop policy if exists "Instructors can view course progress" on public.lesson_progress;

create policy "Instructors can view course progress"
  on public.lesson_progress for select
  to authenticated
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'instructor'
    )
    or exists (
      select 1 from public.courses
      where id = lesson_progress.course_id and instructor_id = auth.uid()
    )
  );
