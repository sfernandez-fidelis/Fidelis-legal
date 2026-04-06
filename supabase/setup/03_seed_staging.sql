insert into public.organizations (id, name, slug)
values ('00000000-0000-0000-0000-000000000101', 'Staging Workspace', 'staging-workspace')
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug;
