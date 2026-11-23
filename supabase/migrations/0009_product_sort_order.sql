-- Product display order is global across locales and managed from the admin editor.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS "sortOrder" integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS products_published_sort_order_idx
  ON public.products ("isPublished", "sortOrder", "createdAt");
