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
