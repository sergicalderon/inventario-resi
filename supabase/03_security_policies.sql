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
alter table public.activity_events enable row level security;

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

drop policy if exists "members can read activity events" on public.activity_events;
create policy "members can read activity events" on public.activity_events
for select to authenticated using (public.is_org_member(organization_id));

drop policy if exists "writers can insert activity events" on public.activity_events;
create policy "writers can insert activity events" on public.activity_events
for insert to authenticated with check (public.can_write_org(organization_id));
