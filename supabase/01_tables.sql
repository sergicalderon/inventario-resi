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

create index if not exists suppliers_org_idx on public.suppliers(organization_id);
create index if not exists tags_org_idx on public.tags(organization_id);
create index if not exists products_org_idx on public.products(organization_id);
create index if not exists lots_product_idx on public.lots(product_id);
create index if not exists lots_expiry_idx on public.lots(expires_at);
create index if not exists movements_org_date_idx on public.movements(organization_id, date desc);
