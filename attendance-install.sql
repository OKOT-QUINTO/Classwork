-- Run ONCE in the ANALYSER project's Supabase SQL Editor.
-- Additive migration: does not modify existing analyser or AttendApp tables.
begin;
alter table public.learners add column if not exists attendance_profile jsonb not null default '{}'::jsonb;
create table if not exists public.attendance_registers (
 id uuid primary key default gen_random_uuid(), school_id text not null,
 year text not null, class_name text not null,
 unique(school_id,year,class_name)
);
create table if not exists public.attendance_terms (
 id uuid primary key default gen_random_uuid(),
 register_id uuid not null references public.attendance_registers(id) on delete cascade,
 n integer not null check(n between 1 and 3), start_date date, end_date date,
 weeks integer not null default 12 check(weeks between 1 and 30),
 unique(register_id,n), unique(id,register_id),
 check(start_date is null or extract(isodow from start_date)=1),
 check(end_date is null or (start_date is not null and end_date>=start_date and end_date<=start_date+weeks*7-3))
);
create table if not exists public.attendance_marks (
 id uuid primary key default gen_random_uuid(), register_id uuid not null,
 term_id uuid not null, week integer not null check(week between 1 and 30),
 learner_id text not null, codes text not null check(codes ~ '^[.PASH]{10}$'),
 foreign key(term_id,register_id) references public.attendance_terms(id,register_id) on delete cascade,
 unique(term_id,week,learner_id)
);
create table if not exists public.attendance_holidays (
 id uuid primary key default gen_random_uuid(),school_id text not null,
 hdate date not null, name text not null, unique(school_id,hdate)
);
create index if not exists attendance_marks_register_idx on public.attendance_marks(register_id);
create index if not exists attendance_holidays_school_idx on public.attendance_holidays(school_id);
-- Use analyser identities and teaching assignments. No new users or passwords.
create or replace function public.attendance_access(school text,cls text,manage boolean default false)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.staff s where s.user_id=auth.uid() and (
  s.role='admin' or (s.school_id::text=school and (
   s.role in ('headteacher','dos','hod') or exists(
    select 1 from public.teaching t where t.staff_id=s.id and t.class_name=cls
    and (not manage or t.subject is null)
   )
  ))
 ));
$$;
create or replace function public.attendance_school_access(school text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.staff s where s.user_id=auth.uid() and
 (s.role='admin' or (s.school_id::text=school and
 (s.role in ('headteacher','dos','hod') or exists(select 1 from public.teaching t where t.staff_id=s.id)))));
$$;
create or replace function public.attendance_register_access(reg uuid,manage boolean default false)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.attendance_registers r where r.id=reg
 and public.attendance_access(r.school_id,r.class_name,manage));
$$;
create or replace function public.attendance_valid_learner(reg uuid,learner text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.enrolments e join public.attendance_registers r
 on e.school_id::text=r.school_id and e.year::text=r.year and e.class_name=r.class_name
 where r.id=reg and e.learner_id::text=learner);
$$;
revoke all on function public.attendance_access(text,text,boolean),public.attendance_school_access(text),public.attendance_register_access(uuid,boolean),public.attendance_valid_learner(uuid,text) from public;
grant execute on function public.attendance_access(text,text,boolean),public.attendance_school_access(text),public.attendance_register_access(uuid,boolean),public.attendance_valid_learner(uuid,text) to authenticated;
alter table public.attendance_registers enable row level security;
alter table public.attendance_terms enable row level security;
alter table public.attendance_marks enable row level security;
alter table public.attendance_holidays enable row level security;
revoke all on public.attendance_registers,public.attendance_terms,public.attendance_marks,public.attendance_holidays from anon;
grant select,insert,update,delete on public.attendance_registers,public.attendance_terms,public.attendance_marks,public.attendance_holidays to authenticated;
drop policy if exists attendance_register_read on public.attendance_registers;
create policy attendance_register_read on public.attendance_registers for select to authenticated using(public.attendance_access(school_id,class_name));
drop policy if exists attendance_register_create on public.attendance_registers;
create policy attendance_register_create on public.attendance_registers for insert to authenticated with check(public.attendance_access(school_id,class_name));
-- Identical-key upsert is needed when two teachers open a new calendar at once.
drop policy if exists attendance_register_update on public.attendance_registers;
create policy attendance_register_update on public.attendance_registers for update to authenticated using(public.attendance_access(school_id,class_name)) with check(public.attendance_access(school_id,class_name));
drop policy if exists attendance_term_read on public.attendance_terms;
create policy attendance_term_read on public.attendance_terms for select to authenticated using(public.attendance_register_access(register_id));
drop policy if exists attendance_term_create on public.attendance_terms;
create policy attendance_term_create on public.attendance_terms for insert to authenticated with check(public.attendance_register_access(register_id));
drop policy if exists attendance_term_manage on public.attendance_terms;
create policy attendance_term_manage on public.attendance_terms for update to authenticated using(public.attendance_register_access(register_id,true)) with check(public.attendance_register_access(register_id,true));
drop policy if exists attendance_marks_read on public.attendance_marks;
create policy attendance_marks_read on public.attendance_marks for select to authenticated using(public.attendance_register_access(register_id));
drop policy if exists attendance_marks_create on public.attendance_marks;
create policy attendance_marks_create on public.attendance_marks for insert to authenticated with check(public.attendance_register_access(register_id) and public.attendance_valid_learner(register_id,learner_id));
drop policy if exists attendance_marks_update on public.attendance_marks;
create policy attendance_marks_update on public.attendance_marks for update to authenticated using(public.attendance_register_access(register_id)) with check(public.attendance_register_access(register_id) and public.attendance_valid_learner(register_id,learner_id));
drop policy if exists attendance_marks_delete on public.attendance_marks;
create policy attendance_marks_delete on public.attendance_marks for delete to authenticated using(public.attendance_register_access(register_id));
drop policy if exists attendance_holidays_all on public.attendance_holidays;
create policy attendance_holidays_all on public.attendance_holidays for all to authenticated using(public.attendance_school_access(school_id)) with check(public.attendance_school_access(school_id));
commit;

-- The reviewed backup import runs as ONE transaction. Any error rolls it all back.
create or replace function public.attendance_import(p_register uuid,p_terms jsonb,p_marks jsonb,p_holidays jsonb)
returns integer language plpgsql security invoker set search_path='' as $$
declare r public.attendance_registers; t jsonb; m jsonb; h jsonb; imported integer:=0;
begin
 select * into r from public.attendance_registers where id=p_register for update;
 if r.id is null or not public.attendance_register_access(p_register,true) then
  raise exception 'Only class teachers or school leadership may import this register';
 end if;
 if exists(select 1 from public.attendance_marks where register_id=p_register) then
  raise exception 'Destination contains attendance; import cancelled';
 end if;
 for t in select * from jsonb_array_elements(p_terms) loop
  update public.attendance_terms set start_date=nullif(t->>'start_date','')::date,
   end_date=nullif(t->>'end_date','')::date,weeks=(t->>'weeks')::integer
   where register_id=p_register and id=(t->>'id')::uuid;
  if not found then raise exception 'Term does not belong to destination';end if;
 end loop;
 for m in select * from jsonb_array_elements(p_marks) loop
  insert into public.attendance_marks(register_id,term_id,week,learner_id,codes)
  values(p_register,(m->>'term_id')::uuid,(m->>'week')::integer,m->>'learner_id',m->>'codes');
  imported:=imported+1;
 end loop;
 for h in select * from jsonb_array_elements(p_holidays) loop
  insert into public.attendance_holidays(school_id,hdate,name)
  values(r.school_id,(h->>'hdate')::date,h->>'name') on conflict(school_id,hdate) do nothing;
 end loop;
 return imported;
end;
$$;
revoke all on function public.attendance_import(uuid,jsonb,jsonb,jsonb) from public;
grant execute on function public.attendance_import(uuid,jsonb,jsonb,jsonb) to authenticated;
