-- Keep published Nutrition articles visible to anonymous visitors.
-- The policy check makes this migration safe when the policy was created manually before.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nutrition_articles'
      and policyname = 'Public can read published articles'
  ) then
    create policy "Public can read published articles"
      on public.nutrition_articles
      for select
      to anon, authenticated
      using ("isPublished" = 1);
  end if;
end
$$;

-- The admin Edge Function uploads authenticated images to this public-read bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'renacer-media',
  'renacer-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']::text[]
)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public can read Renacer media'
  ) then
    create policy "Public can read Renacer media"
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'renacer-media');
  end if;
end
$$;
