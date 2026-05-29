create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_type_id uuid references public.product_types(id) on delete set null,
  name text not null,
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists product_type_id uuid references public.product_types(id) on delete set null;
alter table public.products add column if not exists category_id uuid references public.categories(id) on delete set null;
alter table public.products add column if not exists subcategory_id uuid references public.subcategories(id) on delete set null;
alter table public.products add column if not exists main_location_id uuid references public.locations(id) on delete set null;

create index if not exists locations_org_idx on public.locations(organization_id);
create index if not exists product_types_org_idx on public.product_types(organization_id);
create index if not exists categories_org_idx on public.categories(organization_id);
create index if not exists categories_product_type_idx on public.categories(product_type_id);
create index if not exists subcategories_org_idx on public.subcategories(organization_id);
create index if not exists subcategories_category_idx on public.subcategories(category_id);
create index if not exists products_main_location_idx on public.products(main_location_id);
create index if not exists products_product_type_idx on public.products(product_type_id);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_subcategory_idx on public.products(subcategory_id);

create unique index if not exists locations_org_name_unique on public.locations(organization_id, lower(name));
create unique index if not exists product_types_org_name_unique on public.product_types(organization_id, lower(name));
create unique index if not exists categories_org_type_name_unique on public.categories(organization_id, coalesce(product_type_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));
create unique index if not exists subcategories_category_name_unique on public.subcategories(category_id, lower(name));

insert into public.product_types(organization_id, name)
select organizations.id, defaults.name
from public.organizations
cross join (
  values ('Fármaco'), ('Apósito'), ('Fungible'), ('Higiene'), ('Nutrición'), ('Otro')
) as defaults(name)
where not exists (
  select 1
  from public.product_types existing
  where existing.organization_id = organizations.id
    and lower(existing.name) = lower(defaults.name)
);

insert into public.product_types(organization_id, name)
select distinct products.organization_id, initcap(products.type)
from public.products
where nullif(trim(products.type), '') is not null
  and not exists (
    select 1
    from public.product_types existing
    where existing.organization_id = products.organization_id
      and lower(existing.name) = lower(products.type)
  );

insert into public.locations(organization_id, name)
select distinct products.organization_id, trim(products.main_location)
from public.products
where nullif(trim(products.main_location), '') is not null
  and not exists (
    select 1
    from public.locations existing
    where existing.organization_id = products.organization_id
      and lower(existing.name) = lower(trim(products.main_location))
  );

insert into public.categories(organization_id, product_type_id, name)
select distinct category_sources.organization_id, category_sources.product_type_id, category_sources.name
from (
  select
    products.organization_id,
    product_types.id as product_type_id,
    trim(products.category) as name
  from public.products
  join public.product_types
    on product_types.organization_id = products.organization_id
   and lower(product_types.name) = lower(products.type)
  where nullif(trim(products.category), '') is not null
) category_sources
where not exists (
  select 1
  from public.categories existing
  where existing.organization_id = category_sources.organization_id
    and coalesce(existing.product_type_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(category_sources.product_type_id, '00000000-0000-0000-0000-000000000000'::uuid)
    and lower(existing.name) = lower(category_sources.name)
);

insert into public.subcategories(organization_id, category_id, name)
select distinct subcategory_sources.organization_id, subcategory_sources.category_id, subcategory_sources.name
from (
  select
    products.organization_id,
    categories.id as category_id,
    trim(products.subcategory) as name
  from public.products
  join public.product_types
    on product_types.organization_id = products.organization_id
   and lower(product_types.name) = lower(products.type)
  join public.categories
    on categories.organization_id = products.organization_id
   and categories.product_type_id = product_types.id
   and lower(categories.name) = lower(trim(products.category))
  where nullif(trim(products.subcategory), '') is not null
) subcategory_sources
where not exists (
  select 1
  from public.subcategories existing
  where existing.category_id = subcategory_sources.category_id
    and lower(existing.name) = lower(subcategory_sources.name)
);

update public.products
set product_type_id = product_types.id
from public.product_types
where products.product_type_id is null
  and product_types.organization_id = products.organization_id
  and lower(product_types.name) = lower(products.type);

update public.products
set main_location_id = locations.id
from public.locations
where products.main_location_id is null
  and locations.organization_id = products.organization_id
  and lower(locations.name) = lower(trim(products.main_location));

update public.products
set category_id = categories.id
from public.categories
where products.category_id is null
  and categories.organization_id = products.organization_id
  and categories.product_type_id = products.product_type_id
  and lower(categories.name) = lower(trim(products.category));

update public.products
set subcategory_id = subcategories.id
from public.subcategories
where products.subcategory_id is null
  and subcategories.organization_id = products.organization_id
  and subcategories.category_id = products.category_id
  and lower(subcategories.name) = lower(trim(products.subcategory));

alter table public.locations enable row level security;
alter table public.product_types enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;

drop policy if exists "members can read locations" on public.locations;
create policy "members can read locations" on public.locations
for select to authenticated using (public.is_org_member(organization_id));
drop policy if exists "writers can insert locations" on public.locations;
create policy "writers can insert locations" on public.locations
for insert to authenticated with check (public.can_write_org(organization_id));
drop policy if exists "writers can update locations" on public.locations;
create policy "writers can update locations" on public.locations
for update to authenticated using (public.can_write_org(organization_id)) with check (public.can_write_org(organization_id));

drop policy if exists "members can read product types" on public.product_types;
create policy "members can read product types" on public.product_types
for select to authenticated using (public.is_org_member(organization_id));
drop policy if exists "writers can insert product types" on public.product_types;
create policy "writers can insert product types" on public.product_types
for insert to authenticated with check (public.can_write_org(organization_id));
drop policy if exists "writers can update product types" on public.product_types;
create policy "writers can update product types" on public.product_types
for update to authenticated using (public.can_write_org(organization_id)) with check (public.can_write_org(organization_id));

drop policy if exists "members can read categories" on public.categories;
create policy "members can read categories" on public.categories
for select to authenticated using (public.is_org_member(organization_id));
drop policy if exists "writers can insert categories" on public.categories;
create policy "writers can insert categories" on public.categories
for insert to authenticated with check (public.can_write_org(organization_id));
drop policy if exists "writers can update categories" on public.categories;
create policy "writers can update categories" on public.categories
for update to authenticated using (public.can_write_org(organization_id)) with check (public.can_write_org(organization_id));

drop policy if exists "members can read subcategories" on public.subcategories;
create policy "members can read subcategories" on public.subcategories
for select to authenticated using (public.is_org_member(organization_id));
drop policy if exists "writers can insert subcategories" on public.subcategories;
create policy "writers can insert subcategories" on public.subcategories
for insert to authenticated with check (public.can_write_org(organization_id));
drop policy if exists "writers can update subcategories" on public.subcategories;
create policy "writers can update subcategories" on public.subcategories
for update to authenticated using (public.can_write_org(organization_id)) with check (public.can_write_org(organization_id));

grant select, insert, update on public.locations to authenticated;
grant select, insert, update on public.product_types to authenticated;
grant select, insert, update on public.categories to authenticated;
grant select, insert, update on public.subcategories to authenticated;
