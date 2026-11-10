-- PCU One Stop Centre dashboard: run once in Supabase SQL editor

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- ============ profiles & roles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  role text not null default 'pending' check (role in ('pending','staff','admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create function private.current_app_role() returns text
language sql stable security definer set search_path = ''
as $$ select role from public.profiles where id = (select auth.uid()) $$;

create function private.is_staff() returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce(private.current_app_role() in ('staff','admin'), false) $$;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce(private.current_app_role() = 'admin', false) $$;

grant execute on function private.current_app_role(), private.is_staff(), private.is_admin() to authenticated;

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when not exists (select 1 from public.profiles) then 'admin' else 'pending' end
  );
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users for each row execute function private.handle_new_user();

create policy profiles_select on public.profiles for select to authenticated
  using ((select auth.uid()) = id or private.is_admin());
create policy profiles_update_admin on public.profiles for update to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- ============ lookups (editable lists) ============
create table public.lookups (
  id bigint generated always as identity primary key,
  kind text not null,
  value text not null,
  sort int not null default 0,
  unique (kind, value)
);
alter table public.lookups enable row level security;
create policy lookups_select on public.lookups for select to authenticated using (private.is_staff());
create policy lookups_insert on public.lookups for insert to authenticated with check (private.is_admin());
create policy lookups_update on public.lookups for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy lookups_delete on public.lookups for delete to authenticated using (private.is_admin());

insert into public.lookups (kind, value, sort) values
 ('ptj','FSKTM',1),('ptj','FKEE',2),('ptj','FKAAB',3),('ptj','FKMP',4),('ptj','FPTV',5),('ptj','FAST',6),('ptj','Lain-lain',99),
 ('kampus','Parit Raja',1),('kampus','Pagoh',2),
 ('kes_kaunseling','Emosi dan tekanan',1),('kes_kaunseling','Akademik',2),('kes_kaunseling','Hubungan',3),('kes_kaunseling','Keluarga',4),('kes_kaunseling','Kewangan',5),('kes_kaunseling','Lain-lain',99),
 ('kes_tatatertib','Ponteng kelas',1),('kes_tatatertib','Salah laku kampus',2),('kes_tatatertib','Ketidakjujuran akademik',3),('kes_tatatertib','Pelanggaran kod pakaian',4),('kes_tatatertib','Penyalahgunaan ICT',5),('kes_tatatertib','Lain-lain',99),
 ('ujian','DASS-21',1),('ujian','Inventori Minat Kerjaya',2),('ujian','Inventori Personaliti',3),('ujian','Ujian Gaya Pembelajaran',4),('ujian','Lain-lain',99),
 ('intervensi','Kaunseling individu',1),('intervensi','Kaunseling kelompok',2),('intervensi','Bengkel pengurusan stres',3),('intervensi','Rujukan klinikal',4),('intervensi','Susulan berkala',5),
 ('jabatan','PCU',1),('jabatan','HEPA',2),('jabatan','Fakulti',3),('jabatan','Lain-lain',99),
 ('kategori_penyertaan','Pelajar',1),('kategori_penyertaan','Staf',2),('kategori_penyertaan','Komuniti luar',3);

-- ============ import batches (so an import can be undone) ============
create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  filename text,
  row_count int not null default 0,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.import_batches enable row level security;
create policy batches_select on public.import_batches for select to authenticated using (private.is_staff());
create policy batches_insert on public.import_batches for insert to authenticated with check (private.is_staff());
create policy batches_delete on public.import_batches for delete to authenticated
  using (private.is_admin() or created_by = (select auth.uid()));

-- ============ anonymised record tables ============
create table public.counselling_sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date not null,
  ptj text not null,
  gender text not null check (gender in ('Perempuan','Lelaki')),
  source text not null check (source in ('rujukan','sukarela')),
  case_type text not null,
  attended boolean not null default true,
  batch_id uuid references public.import_batches(id) on delete cascade,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  jabatan text not null,
  held_on date not null,
  budget numeric(12,2) not null default 0 check (budget >= 0),
  batch_id uuid references public.import_batches(id) on delete cascade,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.program_participation (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  ptj text not null,
  gender text not null check (gender in ('Perempuan','Lelaki')),
  category text not null,
  participants int not null check (participants > 0),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.psych_tests (
  id uuid primary key default gen_random_uuid(),
  test_date date not null,
  ptj text not null,
  gender text not null check (gender in ('Perempuan','Lelaki')),
  source text not null check (source in ('rujukan','sukarela')),
  test_name text not null,
  person_code text,
  batch_id uuid references public.import_batches(id) on delete cascade,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.discipline_sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date not null,
  ptj text not null,
  gender text not null check (gender in ('Perempuan','Lelaki')),
  case_type text not null,
  attended boolean not null default true,
  batch_id uuid references public.import_batches(id) on delete cascade,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.dass_results (
  id uuid primary key default gen_random_uuid(),
  test_date date not null,
  respondent text not null check (respondent in ('pelajar','staf')),
  ptj text not null,
  gender text not null check (gender in ('Perempuan','Lelaki')),
  campus text not null,
  depression smallint not null check (depression between 0 and 42),
  anxiety smallint not null check (anxiety between 0 and 42),
  stress smallint not null check (stress between 0 and 42),
  depression_level smallint generated always as (
    case when depression <= 9 then 0 when depression <= 13 then 1 when depression <= 20 then 2 when depression <= 27 then 3 else 4 end) stored,
  anxiety_level smallint generated always as (
    case when anxiety <= 7 then 0 when anxiety <= 9 then 1 when anxiety <= 14 then 2 when anxiety <= 19 then 3 else 4 end) stored,
  stress_level smallint generated always as (
    case when stress <= 14 then 0 when stress <= 18 then 1 when stress <= 25 then 2 when stress <= 33 then 3 else 4 end) stored,
  batch_id uuid references public.import_batches(id) on delete cascade,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.interventions (
  id uuid primary key default gen_random_uuid(),
  intervention_date date not null,
  respondent text not null check (respondent in ('pelajar','staf')),
  ptj text not null,
  gender text not null check (gender in ('Perempuan','Lelaki')),
  campus text not null,
  intervention_type text not null,
  stress_status text not null check (stress_status in ('stabil','sederhana','teruk')),
  batch_id uuid references public.import_batches(id) on delete cascade,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- indexes
create index on public.counselling_sessions (session_date);
create index on public.counselling_sessions (batch_id);
create index on public.programs (held_on);
create index on public.programs (batch_id);
create index on public.program_participation (program_id);
create index on public.psych_tests (test_date);
create index on public.psych_tests (batch_id);
create index on public.discipline_sessions (session_date);
create index on public.discipline_sessions (batch_id);
create index on public.dass_results (test_date);
create index on public.dass_results (batch_id);
create index on public.interventions (intervention_date);
create index on public.interventions (batch_id);

-- RLS for every record table: staff read/insert; admin or owner edit/delete
do $$
declare t text;
begin
  foreach t in array array['counselling_sessions','programs','program_participation','psych_tests','discipline_sessions','dass_results','interventions']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (private.is_staff())', t||'_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (private.is_staff())', t||'_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (private.is_admin() or created_by = (select auth.uid())) with check (private.is_admin() or created_by = (select auth.uid()))', t||'_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (private.is_admin() or created_by = (select auth.uid()))', t||'_delete', t);
  end loop;
end $$;

-- nothing is readable without logging in
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon;
