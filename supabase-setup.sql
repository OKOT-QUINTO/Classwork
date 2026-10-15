-- CLASSWORK ANALYSIS: run this ONCE in Supabase -> SQL Editor -> New query -> Run
create table if not exists app_data (id text primary key, version int not null default 0, data jsonb, updated_at timestamptz default now());
create table if not exists members (user_id uuid primary key references auth.users(id) on delete cascade, is_admin boolean not null default false);
create table if not exists app_settings (id int primary key, access_code text);
insert into app_data (id, version, data) values ('main', 0, null) on conflict (id) do nothing;

alter table app_data enable row level security;
alter table members enable row level security;
alter table app_settings enable row level security;

create or replace function is_member() returns boolean language sql security definer stable set search_path = public
as $$ select exists (select 1 from members where user_id = auth.uid()) $$;

drop policy if exists "members read data" on app_data;
drop policy if exists "members update data" on app_data;
drop policy if exists "read own membership" on members;
create policy "members read data" on app_data for select to authenticated using (is_member());
create policy "members update data" on app_data for update to authenticated using (is_member()) with check (is_member());
create policy "read own membership" on members for select to authenticated using (user_id = auth.uid());

-- true once the first (administrator) account exists
create or replace function school_ready() returns boolean language sql security definer set search_path = public
as $$ select exists (select 1 from members) $$;
grant execute on function school_ready() to anon, authenticated;

-- first caller becomes administrator and sets the access code; everyone else must give the code
create or replace function join_school(code text) returns text language plpgsql security definer set search_path = public
as $$
declare c text; n int;
begin
  if auth.uid() is null then return 'login'; end if;
  if exists (select 1 from members where user_id = auth.uid()) then return 'ok'; end if;
  select count(*) into n from members;
  if n = 0 then
    if length(trim(coalesce(code,''))) < 4 then return 'bad code'; end if;
    insert into app_settings (id, access_code) values (1, trim(code)) on conflict (id) do update set access_code = trim(code);
    insert into members (user_id, is_admin) values (auth.uid(), true);
    return 'admin';
  end if;
  select access_code into c from app_settings where id = 1;
  if c is not null and trim(code) = c then insert into members (user_id) values (auth.uid()); return 'ok'; end if;
  return 'bad code';
end $$;
grant execute on function join_school(text) to authenticated;
