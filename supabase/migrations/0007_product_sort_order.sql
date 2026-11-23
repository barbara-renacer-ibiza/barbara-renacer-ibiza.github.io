alter table public.products
  add column if not exists "sortOrder" integer;

with ranked as (
  select id, row_number() over (order by "createdAt" asc, id asc) - 1 as position
  from public.products
)
update public.products as p
set "sortOrder" = ranked.position
from ranked
where p.id = ranked.id
  and p."sortOrder" is null;

alter table public.products
  alter column "sortOrder" set default 0,
  alter column "sortOrder" set not null;

create index if not exists products_published_sort_idx
  on public.products ("isPublished", "sortOrder" asc, "createdAt" asc, id asc);
