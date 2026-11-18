-- Use stable category slugs on products so changing a display name does not break assignment.
alter table public.products
  add column if not exists "categorySlug" text;

-- Seed the requested Renacer categories without overwriting any labels the owner may have edited.
insert into public.categories (slug, "nameIt", "nameEn", "nameEs", "isActive") values
  ('creme', 'Creme', 'Creams', 'Cremas', true),
  ('pomate', 'Pomate', 'Ointments', 'Pomadas', true),
  ('balsami-labiali', 'Balsami labiali', 'Lip balms', 'Bálsamos labiales', true),
  ('oleoliti', 'Oleoliti', 'Oleo infusions', 'Oleatos', true),
  ('saponi-shampoo', 'Saponi e shampoo', 'Soaps and shampoo', 'Jabones y champús', true),
  ('dentifrici', 'Dentifrici', 'Toothpastes', 'Pastas dentales', true),
  ('fasci-di-erbe', 'Fasci di erbe', 'Herbal bundles', 'Atados de hierbas', true)
on conflict (slug) do nothing;

-- Migrate current text labels to stable slugs. Keep the old category text for compatibility.
update public.products p
set "categorySlug" = coalesce(
  (
    select c.slug
    from public.categories c
    where lower(trim(p.category)) in (
      lower(c.slug), lower(c."nameIt"), lower(coalesce(c."nameEn", '')), lower(coalesce(c."nameEs", ''))
    )
    order by c.slug
    limit 1
  ),
  'altro'
)
where p."categorySlug" is null;

alter table public.products
  alter column "categorySlug" set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_category_slug_fkey'
  ) then
    alter table public.products
      add constraint products_category_slug_fkey
      foreign key ("categorySlug") references public.categories(slug) on delete restrict;
  end if;
end
$$;

create index if not exists products_category_slug_idx on public.products ("categorySlug");

-- Public visitors may browse active category labels; admin writes stay behind the Edge Function.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'categories'
      and policyname = 'Public can read active categories'
  ) then
    create policy "Public can read active categories"
      on public.categories for select to anon, authenticated
      using ("isActive" = true);
  end if;
end
$$;

-- Store only a salted PBKDF2 hash after the owner explicitly changes the PIN.
create table if not exists public.admin_security (
  id smallint primary key check (id = 1),
  pin_salt text not null,
  pin_hash text not null,
  pin_changed_at timestamptz not null default now()
);
alter table public.admin_security enable row level security;
revoke all on table public.admin_security from anon, authenticated;
grant all on table public.admin_security to service_role;
