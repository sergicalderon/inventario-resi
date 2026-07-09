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
grant select, insert on public.activity_events to authenticated;

grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.can_write_org(uuid) to authenticated;
grant execute on function public.create_organization(text) to authenticated;
grant execute on function public.register_inventory_movement(uuid, uuid, uuid, text, integer, text, text, text, date) to authenticated;
grant execute on function public.current_actor_email() to authenticated;
grant execute on function public.log_activity_event(uuid, text, text, uuid, text, uuid, text, uuid, text, jsonb) to authenticated;
grant execute on function public.recent_activity(uuid, text, text, date, date, integer) to authenticated;
