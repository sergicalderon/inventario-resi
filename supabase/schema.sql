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

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  type text not null check (type in ('fármaco', 'apósito', 'fungible', 'higiene', 'nutrición', 'otro')),
  category text not null default '',
  subcategory text not null default '',
  unit text not null check (unit in ('unidad', 'caja', 'blíster', 'ampolla', 'sobre', 'ml', 'otro')),
  min_stock integer not null default 0 check (min_stock >= 0),
  main_location text not null default '',
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

create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_org
      and user_id = auth.uid()
  );
$$;

create or replace function public.can_write_org(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_org
      and user_id = auth.uid()
      and role in ('admin', 'staff')
  );
$$;

create or replace function public.create_organization(org_name text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
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

  return new_org;
end;
$$;

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
as $$
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
$$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.suppliers enable row level security;
alter table public.tags enable row level security;
alter table public.products enable row level security;
alter table public.product_tags enable row level security;
alter table public.lots enable row level security;
alter table public.movements enable row level security;

create policy "members can read organizations" on public.organizations
for select to authenticated using (public.is_org_member(id));

create policy "members can read memberships" on public.organization_members
for select to authenticated using (public.is_org_member(organization_id));

create policy "members can read suppliers" on public.suppliers
for select to authenticated using (public.is_org_member(organization_id));
create policy "writers can insert suppliers" on public.suppliers
for insert to authenticated with check (public.can_write_org(organization_id));
create policy "writers can update suppliers" on public.suppliers
for update to authenticated using (public.can_write_org(organization_id)) with check (public.can_write_org(organization_id));

create policy "members can read tags" on public.tags
for select to authenticated using (public.is_org_member(organization_id));
create policy "writers can insert tags" on public.tags
for insert to authenticated with check (public.can_write_org(organization_id));
create policy "writers can update tags" on public.tags
for update to authenticated using (public.can_write_org(organization_id)) with check (public.can_write_org(organization_id));

create policy "members can read products" on public.products
for select to authenticated using (public.is_org_member(organization_id));
create policy "writers can insert products" on public.products
for insert to authenticated with check (public.can_write_org(organization_id));
create policy "writers can update products" on public.products
for update to authenticated using (public.can_write_org(organization_id)) with check (public.can_write_org(organization_id));

create policy "members can read product tags" on public.product_tags
for select to authenticated using (public.is_org_member(organization_id));
create policy "writers can insert product tags" on public.product_tags
for insert to authenticated with check (public.can_write_org(organization_id));
create policy "writers can delete product tags" on public.product_tags
for delete to authenticated using (public.can_write_org(organization_id));

create policy "members can read lots" on public.lots
for select to authenticated using (public.is_org_member(organization_id));
create policy "writers can insert lots" on public.lots
for insert to authenticated with check (public.can_write_org(organization_id));
create policy "writers can update lots" on public.lots
for update to authenticated using (public.can_write_org(organization_id)) with check (public.can_write_org(organization_id));

create policy "members can read movements" on public.movements
for select to authenticated using (public.is_org_member(organization_id));
create policy "writers can insert movements" on public.movements
for insert to authenticated with check (public.can_write_org(organization_id));

create index if not exists suppliers_org_idx on public.suppliers(organization_id);
create index if not exists tags_org_idx on public.tags(organization_id);
create index if not exists products_org_idx on public.products(organization_id);
create index if not exists lots_product_idx on public.lots(product_id);
create index if not exists lots_expiry_idx on public.lots(expires_at);
create index if not exists movements_org_date_idx on public.movements(organization_id, date desc);

grant execute on function public.create_organization(text) to authenticated;
grant execute on function public.register_inventory_movement(uuid, uuid, uuid, text, integer, text, text, text, date) to authenticated;
