-- Run this migration in Supabase SQL Editor to enable graphic and video works
-- on an existing portfolio database.
create table if not exists public.creative_works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  category text not null default 'Graphisme',
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.creative_works enable row level security;
drop policy if exists "Public reads published creative works" on public.creative_works;
create policy "Public reads published creative works" on public.creative_works
for select to anon, authenticated using (published = true or public.is_portfolio_admin());
drop policy if exists "Admins manage creative works" on public.creative_works;
create policy "Admins manage creative works" on public.creative_works
for all to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());
grant select on public.creative_works to anon, authenticated;
grant insert, update, delete on public.creative_works to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-images', 'portfolio-images', true, 104857600,
  array['image/*', 'video/*'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = greatest(storage.buckets.file_size_limit, excluded.file_size_limit),
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Portfolio admins upload portfolio media" on storage.objects;
create policy "Portfolio admins upload portfolio media" on storage.objects
for insert to authenticated with check (
  bucket_id = 'portfolio-images' and public.is_portfolio_admin()
);
drop policy if exists "Portfolio admins update portfolio media" on storage.objects;
create policy "Portfolio admins update portfolio media" on storage.objects
for update to authenticated using (
  bucket_id = 'portfolio-images' and public.is_portfolio_admin()
) with check (bucket_id = 'portfolio-images' and public.is_portfolio_admin());
drop policy if exists "Portfolio admins delete portfolio media" on storage.objects;
create policy "Portfolio admins delete portfolio media" on storage.objects
for delete to authenticated using (
  bucket_id = 'portfolio-images' and public.is_portfolio_admin()
);
