insert into public.organizations (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Local Workspace', 'local-workspace')
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug;
