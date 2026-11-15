create policy "Public can read published products"
on public.products
for select
to anon, authenticated
using ("isPublished" = 1);
