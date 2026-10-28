-- WebCAD Libre: esquema para la nube opcional (Supabase / PostgreSQL)
-- Ejecutar en el editor SQL del proyecto de Supabase. Después, en WebCAD: NUBE > Configurar (URL del proyecto y clave «anon»).

create table if not exists public.webcad_drawings (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  data jsonb not null,
  version integer not null default 1,
  team boolean not null default false,          -- visible y editable por todos los usuarios autenticados
  updated_at timestamptz not null default now()
);
create table if not exists public.webcad_versions (
  id bigserial primary key,
  drawing_id uuid not null references public.webcad_drawings(id) on delete cascade,
  version integer not null,
  data jsonb not null,
  comment text,
  author uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create table if not exists public.webcad_markups (
  id uuid primary key default gen_random_uuid(),
  drawing_id uuid not null references public.webcad_drawings(id) on delete cascade,
  space text not null default 'Model',
  x double precision not null,
  y double precision not null,
  text text not null,
  author uuid default auth.uid(),
  author_name text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists webcad_versions_drawing on public.webcad_versions(drawing_id, version desc);
create index if not exists webcad_markups_drawing on public.webcad_markups(drawing_id);

alter table public.webcad_drawings enable row level security;
alter table public.webcad_versions enable row level security;
alter table public.webcad_markups enable row level security;

-- acceso a un dibujo: propietario o dibujo de equipo
create or replace function public.webcad_can_access(d uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.webcad_drawings w where w.id = d and (w.owner = auth.uid() or w.team));
$$;

drop policy if exists "dibujos: leer" on public.webcad_drawings;
create policy "dibujos: leer" on public.webcad_drawings for select to authenticated using (owner = auth.uid() or team);
drop policy if exists "dibujos: crear" on public.webcad_drawings;
create policy "dibujos: crear" on public.webcad_drawings for insert to authenticated with check (owner = auth.uid());
drop policy if exists "dibujos: modificar" on public.webcad_drawings;
create policy "dibujos: modificar" on public.webcad_drawings for update to authenticated using (owner = auth.uid() or team);
drop policy if exists "dibujos: borrar" on public.webcad_drawings;
create policy "dibujos: borrar" on public.webcad_drawings for delete to authenticated using (owner = auth.uid());

drop policy if exists "versiones: leer" on public.webcad_versions;
create policy "versiones: leer" on public.webcad_versions for select to authenticated using (public.webcad_can_access(drawing_id));
drop policy if exists "versiones: crear" on public.webcad_versions;
create policy "versiones: crear" on public.webcad_versions for insert to authenticated with check (public.webcad_can_access(drawing_id));

drop policy if exists "marcas: leer" on public.webcad_markups;
create policy "marcas: leer" on public.webcad_markups for select to authenticated using (public.webcad_can_access(drawing_id));
drop policy if exists "marcas: crear" on public.webcad_markups;
create policy "marcas: crear" on public.webcad_markups for insert to authenticated with check (public.webcad_can_access(drawing_id));
drop policy if exists "marcas: modificar" on public.webcad_markups;
create policy "marcas: modificar" on public.webcad_markups for update to authenticated using (public.webcad_can_access(drawing_id));
