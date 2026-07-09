create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  entity_name text not null default '',
  product_id uuid references public.products(id) on delete set null,
  product_name text not null default '',
  lot_id uuid references public.lots(id) on delete set null,
  lot_code text not null default '',
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists activity_events_org_created_idx on public.activity_events(organization_id, created_at desc);
create index if not exists activity_events_product_idx on public.activity_events(product_id);
create index if not exists activity_events_lot_idx on public.activity_events(lot_id);
create index if not exists activity_events_action_idx on public.activity_events(action);

alter table public.activity_events enable row level security;

drop policy if exists "members can read activity events" on public.activity_events;
create policy "members can read activity events" on public.activity_events
for select to authenticated using (public.is_org_member(organization_id));

drop policy if exists "writers can insert activity events" on public.activity_events;
create policy "writers can insert activity events" on public.activity_events
for insert to authenticated with check (public.can_write_org(organization_id));

create or replace function public.current_actor_email()
returns text
language sql
stable
as $fn$
  select coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    nullif(
      case
        when left(coalesce(current_setting('request.jwt.claims', true), ''), 1) = '{'
        then current_setting('request.jwt.claims', true)::jsonb ->> 'email'
        else ''
      end,
      ''
    )
  );
$fn$;

create or replace function public.log_activity_event(
  target_organization_id uuid,
  activity_action text,
  activity_entity_type text,
  activity_entity_id uuid,
  activity_entity_name text default '',
  activity_product_id uuid default null,
  activity_product_name text default '',
  activity_lot_id uuid default null,
  activity_lot_code text default '',
  activity_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.activity_events (
    organization_id,
    action,
    entity_type,
    entity_id,
    entity_name,
    product_id,
    product_name,
    lot_id,
    lot_code,
    actor_user_id,
    actor_email,
    metadata
  )
  values (
    target_organization_id,
    activity_action,
    activity_entity_type,
    activity_entity_id,
    coalesce(activity_entity_name, ''),
    activity_product_id,
    coalesce(activity_product_name, ''),
    activity_lot_id,
    coalesce(activity_lot_code, ''),
    auth.uid(),
    public.current_actor_email(),
    coalesce(activity_metadata, '{}'::jsonb)
  );
end;
$fn$;

create or replace function public.track_product_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  activity_action text;
begin
  if tg_op = 'INSERT' then
    activity_action := 'producto_creado';
  elsif tg_op = 'UPDATE' then
    if (to_jsonb(new) - 'updated_at') = (to_jsonb(old) - 'updated_at') then
      return new;
    end if;

    activity_action := case
      when old.active = true and new.active = false then 'producto_desactivado'
      else 'producto_editado'
    end;
  end if;

  perform public.log_activity_event(
    new.organization_id,
    activity_action,
    'product',
    new.id,
    new.name,
    new.id,
    new.name,
    null,
    '',
    jsonb_build_object('active', new.active)
  );

  return new;
end;
$fn$;

create or replace function public.track_lot_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  product_label text;
  activity_action text;
begin
  if tg_op = 'UPDATE' and
    (to_jsonb(new) - 'current_quantity' - 'status' - 'updated_at') =
    (to_jsonb(old) - 'current_quantity' - 'status' - 'updated_at') then
    return new;
  end if;

  select name into product_label
  from public.products
  where id = new.product_id;

  activity_action := case when tg_op = 'INSERT' then 'lote_creado' else 'lote_editado' end;

  perform public.log_activity_event(
    new.organization_id,
    activity_action,
    'lot',
    new.id,
    new.lot_code,
    new.product_id,
    coalesce(product_label, ''),
    new.id,
    new.lot_code,
    jsonb_build_object('quantity', new.current_quantity, 'status', new.status)
  );

  return new;
end;
$fn$;

create or replace function public.track_supplier_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  activity_action text;
begin
  if tg_op = 'UPDATE' and (to_jsonb(new) - 'updated_at') = (to_jsonb(old) - 'updated_at') then
    return new;
  end if;

  activity_action := case when tg_op = 'INSERT' then 'proveedor_creado' else 'proveedor_editado' end;

  perform public.log_activity_event(
    new.organization_id,
    activity_action,
    'supplier',
    new.id,
    new.name,
    null,
    '',
    null,
    '',
    '{}'::jsonb
  );

  return new;
end;
$fn$;

create or replace function public.track_catalog_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  base_action text;
  entity_label text;
begin
  if tg_op = 'UPDATE' and (to_jsonb(new) - 'updated_at') = (to_jsonb(old) - 'updated_at') then
    return new;
  end if;

  entity_label := tg_argv[0];
  base_action := case
    when tg_op = 'INSERT' then tg_argv[1]
    else tg_argv[2]
  end;

  perform public.log_activity_event(
    new.organization_id,
    base_action,
    entity_label,
    new.id,
    new.name,
    null,
    '',
    null,
    '',
    jsonb_build_object('active', new.active)
  );

  return new;
end;
$fn$;

drop trigger if exists products_activity_trigger on public.products;
create trigger products_activity_trigger
after insert or update on public.products
for each row execute function public.track_product_activity();

drop trigger if exists lots_activity_trigger on public.lots;
create trigger lots_activity_trigger
after insert or update on public.lots
for each row execute function public.track_lot_activity();

drop trigger if exists suppliers_activity_trigger on public.suppliers;
create trigger suppliers_activity_trigger
after insert or update on public.suppliers
for each row execute function public.track_supplier_activity();

drop trigger if exists locations_activity_trigger on public.locations;
create trigger locations_activity_trigger
after insert or update on public.locations
for each row execute function public.track_catalog_activity('location', 'ubicacion_creada', 'ubicacion_editada');

drop trigger if exists product_types_activity_trigger on public.product_types;
create trigger product_types_activity_trigger
after insert or update on public.product_types
for each row execute function public.track_catalog_activity('product_type', 'tipo_producto_creado', 'tipo_producto_editado');

drop trigger if exists categories_activity_trigger on public.categories;
create trigger categories_activity_trigger
after insert or update on public.categories
for each row execute function public.track_catalog_activity('category', 'categoria_creada', 'categoria_editada');

drop trigger if exists subcategories_activity_trigger on public.subcategories;
create trigger subcategories_activity_trigger
after insert or update on public.subcategories
for each row execute function public.track_catalog_activity('subcategory', 'subcategoria_creada', 'subcategoria_editada');

create or replace function public.recent_activity(
  target_organization_id uuid,
  search_text text default '',
  action_filter text default '',
  start_date date default null,
  end_date date default null,
  result_limit integer default 50
)
returns table (
  id text,
  occurred_at timestamptz,
  action text,
  entity_type text,
  entity_id uuid,
  entity_name text,
  product_id uuid,
  product_name text,
  lot_id uuid,
  lot_code text,
  actor_user_id uuid,
  actor_email text,
  quantity integer,
  notes text
)
language sql
stable
as $fn$
  with unified as (
    select
      ('movement:' || movements.id::text) as id,
      movements.created_at as occurred_at,
      case movements.type
        when 'entrada' then 'entrada_stock'
        when 'salida' then 'salida_stock'
        when 'ajuste' then 'ajuste_inventario'
        when 'devolución' then 'devolucion_stock'
        when 'caducado' then 'stock_caducado'
        when 'traslado' then 'traslado_stock'
        else movements.type
      end as action,
      'movement'::text as entity_type,
      movements.id as entity_id,
      movements.reason as entity_name,
      movements.product_id,
      coalesce(products.name, '') as product_name,
      movements.lot_id,
      coalesce(lots.lot_code, '') as lot_code,
      null::uuid as actor_user_id,
      nullif(movements.responsible, '') as actor_email,
      movements.quantity,
      movements.notes
    from public.movements
    left join public.products on products.id = movements.product_id
    left join public.lots on lots.id = movements.lot_id
    where movements.organization_id = target_organization_id

    union all

    select
      ('activity:' || activity_events.id::text) as id,
      activity_events.created_at as occurred_at,
      activity_events.action,
      activity_events.entity_type,
      activity_events.entity_id,
      activity_events.entity_name,
      activity_events.product_id,
      activity_events.product_name,
      activity_events.lot_id,
      activity_events.lot_code,
      activity_events.actor_user_id,
      activity_events.actor_email,
      null::integer as quantity,
      ''::text as notes
    from public.activity_events
    where activity_events.organization_id = target_organization_id
  )
  select *
  from unified
  where public.is_org_member(target_organization_id)
    and (coalesce(action_filter, '') = '' or unified.action = action_filter)
    and (start_date is null or unified.occurred_at >= start_date::timestamptz)
    and (end_date is null or unified.occurred_at < (end_date + 1)::timestamptz)
    and (
      coalesce(search_text, '') = ''
      or unified.product_name ilike '%' || search_text || '%'
      or unified.lot_code ilike '%' || search_text || '%'
      or unified.entity_name ilike '%' || search_text || '%'
    )
  order by unified.occurred_at desc
  limit greatest(1, least(coalesce(result_limit, 50), 200));
$fn$;

grant select, insert on public.activity_events to authenticated;
grant execute on function public.current_actor_email() to authenticated;
grant execute on function public.log_activity_event(uuid, text, text, uuid, text, uuid, text, uuid, text, jsonb) to authenticated;
grant execute on function public.recent_activity(uuid, text, text, date, date, integer) to authenticated;
