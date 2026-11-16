-- The product admin now uses the PIN-protected application server.
-- Public visitors may read published catalog entries, but cannot mutate rows
-- or select internal price columns from the REST API.
alter table public.products enable row level security;

do $$
declare
  existing_policy record;
begin
  -- PostgreSQL combines permissive policies with OR; remove older policies so
  -- an existing broad rule cannot bypass the published-only restriction.
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'products'
  loop
    execute format('drop policy if exists %I on public.products', existing_policy.policyname);
  end loop;
end;
$$;

create policy "Public can read published products"
  on public.products
  for select
  to anon, authenticated
  using ("isPublished" = 1);

revoke select, insert, update, delete, truncate on public.products from anon, authenticated;
grant select (
  id,
  slug,
  "sourceLanguage",
  "nameIt",
  "descriptionIt",
  "nameEn",
  "descriptionEn",
  "nameEs",
  "descriptionEs",
  "imageUrl",
  "whatsappMessage",
  "isPublished",
  "createdAt",
  "updatedAt"
) on public.products to anon, authenticated;
