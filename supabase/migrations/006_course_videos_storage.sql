-- ===========================================================================
+-- STORAGE
BUCKET: course-videos
-- ===========================================================================

insert into storage.buckets (id, name, public)
values ('course-videos', 'course-videos', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload course videos" on storage.objects;
drop policy if exists "Public can view course videos"            on storage.objects;
drop policy if exists "Users can update own course videos"           on storage.objects;
drop policy if exists "Users can delete own course videos"           on storage.objects;

create policy "Authenticated users can upload course videos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'course-videos');

create policy "Public can view course videos"
  on storage.objects for select
  using (bucket_id = 'course-videos');

create policy "Users can update own course videos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'course-videos');

create policy "Users can delete own course-videos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'course-videos');
