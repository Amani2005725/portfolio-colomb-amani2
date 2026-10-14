-- Exécuter ce fichier dans Supabase > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Développement',
  description text not null default '',
  level integer not null default 75 check (level between 0 and 100),
  icon text not null default 'Code2',
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  icon text not null default 'Layers',
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'Application',
  image_url text not null default '',
  technologies text[] not null default '{}',
  live_url text not null default '',
  github_url text not null default '',
  featured boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  project_type text not null default '',
  budget text not null default '',
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.skills enable row level security;
alter table public.services enable row level security;
alter table public.projects enable row level security;
alter table public.contact_messages enable row level security;

-- A user is an admin only if its auth ID is explicitly registered in admin_users.
create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to authenticated, anon;

create policy "Admins can read admin list" on public.admin_users
for select to authenticated using (user_id = auth.uid());

create policy "Public reads published skills" on public.skills
for select to anon, authenticated using (published = true or public.is_portfolio_admin());
create policy "Admins manage skills" on public.skills
for all to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());

create policy "Public reads published services" on public.services
for select to anon, authenticated using (published = true or public.is_portfolio_admin());
create policy "Admins manage services" on public.services
for all to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());

create policy "Public reads published projects" on public.projects
for select to anon, authenticated using (published = true or public.is_portfolio_admin());
create policy "Admins manage projects" on public.projects
for all to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());

create policy "Visitors can send contact messages" on public.contact_messages
for insert to anon, authenticated with check (
  length(trim(name)) between 2 and 120 and
  length(trim(email)) between 5 and 254 and
  length(trim(message)) between 5 and 5000
);
create policy "Admins can read messages" on public.contact_messages
for select to authenticated using (public.is_portfolio_admin());
create policy "Admins can update messages" on public.contact_messages
for update to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());
create policy "Admins can delete messages" on public.contact_messages
for delete to authenticated using (public.is_portfolio_admin());

grant select on public.skills, public.services, public.projects to anon, authenticated;
grant insert, update, delete on public.skills, public.services, public.projects to authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;
