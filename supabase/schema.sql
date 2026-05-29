create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'staff', 'read_only')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact text not null default '',
  phone text not null default '',
  email text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

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

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  type text not null check (type in ('fármaco', 'apósito', 'fungible', 'higiene', 'nutrición', 'otro')),
  category text not null default '',
  subcategory text not null default '',
  product_type_id uuid references public.product_types(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.subcategories(id) on delete set null,
  unit text not null check (unit in ('unidad', 'caja', 'blíster', 'ampolla', 'sobre', 'ml', 'otro')),
  min_stock integer not null default 0 check (min_stock >= 0),
  main_location text not null default '',
  main_location_id uuid references public.locations(id) on delete set null,
  main_supplier_id uuid references public.suppliers(id) on delete set null,
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_tags (
  product_id uuid not null references public.products(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  primary key (product_id, tag_id)
);

create table if not exists public.lots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  lot_code text not null,
  expires_at date not null,
  current_quantity integer not null default 0 check (current_quantity >= 0),
  entry_date date not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  notes text not null default '',
  status text not null default 'activo' check (status in ('activo', 'agotado', 'caducado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  date date not null default current_date,
  product_id uuid not null references public.products(id) on delete cascade,
  lot_id uuid references public.lots(id) on delete set null,
  type text not null check (type in ('entrada', 'salida', 'ajuste', 'devolución', 'caducado', 'traslado')),
  quantity integer not null check (quantity >= 0),
  reason text not null default '',
  responsible text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists suppliers_org_idx on public.suppliers(organization_id);
create index if not exists tags_org_idx on public.tags(organization_id);
create index if not exists locations_org_idx on public.locations(organization_id);
create index if not exists product_types_org_idx on public.product_types(organization_id);
create index if not exists categories_org_idx on public.categories(organization_id);
create index if not exists categories_product_type_idx on public.categories(product_type_id);
create index if not exists subcategories_org_idx on public.subcategories(organization_id);
create index if not exists subcategories_category_idx on public.subcategories(category_id);
create index if not exists products_org_idx on public.products(organization_id);
create index if not exists products_main_location_idx on public.products(main_location_id);
create index if not exists products_product_type_idx on public.products(product_type_id);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_subcategory_idx on public.products(subcategory_id);
create index if not exists lots_product_idx on public.lots(product_id);
create index if not exists lots_expiry_idx on public.lots(expires_at);
create index if not exists movements_org_date_idx on public.movements(organization_id, date desc);

create unique index if not exists locations_org_name_unique on public.locations(organization_id, lower(name));
create unique index if not exists product_types_org_name_unique on public.product_types(organization_id, lower(name));
create unique index if not exists categories_org_type_name_unique on public.categories(organization_id, coalesce(product_type_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));
create unique index if not exists subcategories_category_name_unique on public.subcategories(category_id, lower(name));
create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_org
      and user_id = auth.uid()
  );
$fn$;

create or replace function public.can_write_org(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_org
      and user_id = auth.uid()
      and role in ('admin', 'staff')
  );
$fn$;

create or replace function public.create_organization(org_name text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $fn$
declare
  new_org public.organizations;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  insert into public.organizations(name)
  values (coalesce(nullif(trim(org_name), ''), 'Residencia'))
  returning * into new_org;

  insert into public.organization_members(organization_id, user_id, role)
  values (new_org.id, auth.uid(), 'admin');

  insert into public.tags(organization_id, name)
  values
    (new_org.id, 'pedido mensual'),
    (new_org.id, 'urgente'),
    (new_org.id, 'carro curas'),
    (new_org.id, 'farmacia'),
    (new_org.id, 'planta 1'),
    (new_org.id, 'caducidad próxima'),
    (new_org.id, 'proveedor habitual');

  insert into public.product_types(organization_id, name)
  values
    (new_org.id, 'Fármaco'),
    (new_org.id, 'Apósito'),
    (new_org.id, 'Fungible'),
    (new_org.id, 'Higiene'),
    (new_org.id, 'Nutrición'),
    (new_org.id, 'Otro')
  on conflict do nothing;

  return new_org;
end;
$fn$;

create or replace function public.register_inventory_movement(
  target_organization_id uuid,
  target_product_id uuid,
  target_lot_id uuid,
  movement_type text,
  movement_quantity integer,
  movement_reason text default '',
  movement_responsible text default '',
  movement_notes text default '',
  movement_date date default current_date
)
returns public.movements
language plpgsql
security definer
set search_path = public
as $fn$
declare
  new_movement public.movements;
  delta integer;
begin
  if not public.can_write_org(target_organization_id) then
    raise exception 'not allowed';
  end if;

  if movement_quantity < 0 then
    raise exception 'quantity must be positive';
  end if;

  if target_lot_id is not null then
    if movement_type in ('entrada', 'devolución') then
      delta := movement_quantity;
      update public.lots
      set current_quantity = current_quantity + delta,
          status = 'activo',
          updated_at = now()
      where id = target_lot_id
        and organization_id = target_organization_id;
    elsif movement_type = 'ajuste' then
      update public.lots
      set current_quantity = movement_quantity,
          status = case when movement_quantity <= 0 then 'agotado' else 'activo' end,
          updated_at = now()
      where id = target_lot_id
        and organization_id = target_organization_id;
    else
      delta := movement_quantity * -1;
      update public.lots
      set current_quantity = greatest(0, current_quantity + delta),
          status = case when greatest(0, current_quantity + delta) <= 0 then 'agotado' else status end,
          updated_at = now()
      where id = target_lot_id
        and organization_id = target_organization_id;
    end if;

    if movement_type = 'caducado' then
      update public.lots
      set status = 'caducado',
          updated_at = now()
      where id = target_lot_id
        and organization_id = target_organization_id;
    end if;
  end if;

  insert into public.movements (
    organization_id,
    date,
    product_id,
    lot_id,
    type,
    quantity,
    reason,
    responsible,
    notes
  )
  values (
    target_organization_id,
    movement_date,
    target_product_id,
    target_lot_id,
    movement_type,
    movement_quantity,
    coalesce(movement_reason, ''),
    coalesce(movement_responsible, ''),
    coalesce(movement_notes, '')
  )
  returning * into new_movement;

  return new_movement;
end;
$fn$;

grant execute on function public.create_organization(text) to authenticated;
grant execute on function public.register_inventory_movement(uuid, uuid, uuid, text, integer, text, text, text, date) to authenticated;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.suppliers enable row level security;
alter table public.tags enable row level security;
alter table public.locations enable row level security;
alter table public.product_types enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.products enable row level security;
alter table public.product_tags enable row level security;
alter table public.lots enable row level security;
alter table public.movements enable row level security;

drop policy if exists "members can read organizations" on public.organizations;
create policy "members can read organizations" on public.organizations
for select to authenticated using (public.is_org_member(id));

drop policy if exists "members can read memberships" on public.organization_members;
create policy "members can read memberships" on public.organization_members
for select to authenticated using (public.is_org_member(organization_id));

drop policy if exists "members can read suppliers" on public.suppliers;
create policy "members can read suppliers" on public.suppliers
for select to authenticated using (public.is_org_member(organization_id));

drop policy if exists "writers can insert suppliers" on public.suppliers;
create policy "writers can insert suppliers" on public.suppliers
for insert to authenticated with check (public.can_write_org(organization_id));

drop policy if exists "writers can update suppliers" on public.suppliers;
create policy "writers can update suppliers" on public.suppliers
for update to authenticated using (public.can_write_org(organization_id)) with check (public.can_write_org(organization_id));

drop policy if exists "members can read tags" on public.tags;
create policy "members can read tags" on public.tags
for select to authenticated using (public.is_org_member(organization_id));

drop policy if exists "writers can insert tags" on public.tags;
create policy "writers can insert tags" on public.tags
for insert to authenticated with check (public.can_write_org(organization_id));

drop policy if exists "writers can update tags" on public.tags;
create policy "writers can update tags" on public.tags
for update to authenticated using (public.can_write_org(organization_id)) with check (public.can_write_org(organization_id));

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

drop policy if exists "members can read products" on public.products;
create policy "members can read products" on public.products
for select to authenticated using (public.is_org_member(organization_id));

drop policy if exists "writers can insert products" on public.products;
create policy "writers can insert products" on public.products
for insert to authenticated with check (public.can_write_org(organization_id));

drop policy if exists "writers can update products" on public.products;
create policy "writers can update products" on public.products
for update to authenticated using (public.can_write_org(organization_id)) with check (public.can_write_org(organization_id));

drop policy if exists "members can read product tags" on public.product_tags;
create policy "members can read product tags" on public.product_tags
for select to authenticated using (public.is_org_member(organization_id));

drop policy if exists "writers can insert product tags" on public.product_tags;
create policy "writers can insert product tags" on public.product_tags
for insert to authenticated with check (public.can_write_org(organization_id));

drop policy if exists "writers can delete product tags" on public.product_tags;
create policy "writers can delete product tags" on public.product_tags
for delete to authenticated using (public.can_write_org(organization_id));

drop policy if exists "members can read lots" on public.lots;
create policy "members can read lots" on public.lots
for select to authenticated using (public.is_org_member(organization_id));

drop policy if exists "writers can insert lots" on public.lots;
create policy "writers can insert lots" on public.lots
for insert to authenticated with check (public.can_write_org(organization_id));

drop policy if exists "writers can update lots" on public.lots;
create policy "writers can update lots" on public.lots
for update to authenticated using (public.can_write_org(organization_id)) with check (public.can_write_org(organization_id));

drop policy if exists "members can read movements" on public.movements;
create policy "members can read movements" on public.movements
for select to authenticated using (public.is_org_member(organization_id));

drop policy if exists "writers can insert movements" on public.movements;
create policy "writers can insert movements" on public.movements
for insert to authenticated with check (public.can_write_org(organization_id));
grant usage on schema public to authenticated;

grant select on public.organizations to authenticated;
grant select on public.organization_members to authenticated;

grant select, insert, update on public.suppliers to authenticated;
grant select, insert, update on public.tags to authenticated;
grant select, insert, update on public.locations to authenticated;
grant select, insert, update on public.product_types to authenticated;
grant select, insert, update on public.categories to authenticated;
grant select, insert, update on public.subcategories to authenticated;
grant select, insert, update on public.products to authenticated;
grant select, insert, delete on public.product_tags to authenticated;
grant select, insert, update on public.lots to authenticated;
grant select, insert on public.movements to authenticated;

grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.can_write_org(uuid) to authenticated;
grant execute on function public.create_organization(text) to authenticated;
grant execute on function public.register_inventory_movement(uuid, uuid, uuid, text, integer, text, text, text, date) to authenticated;
