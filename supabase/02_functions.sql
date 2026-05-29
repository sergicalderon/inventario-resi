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
