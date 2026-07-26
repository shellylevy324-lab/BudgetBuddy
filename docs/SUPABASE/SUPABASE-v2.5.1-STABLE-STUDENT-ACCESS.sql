-- Buddy Skills v2.5.1: atomic permanent student access link creation/reuse
-- Run once after the v2.5.0 Permanent Student Access SQL.

create or replace function public.get_or_create_student_access(p_student_id uuid)
returns text
language plpgsql
security definer
set search_path=public
as $$
declare
  v_owner_id uuid := auth.uid();
  v_code text;
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_attempt integer := 0;
begin
  if v_owner_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.students s
    where s.id = p_student_id
      and s.owner_id = v_owner_id
      and s.active = true
  ) then
    raise exception 'Active student not found';
  end if;

  select l.access_code into v_code
  from public.student_access_links l
  where l.owner_id = v_owner_id
    and l.student_id = p_student_id
    and l.revoked_at is null
  order by l.created_at desc
  limit 1;

  if v_code is not null then
    return v_code;
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_code := '';
    for i in 1..10 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::integer, 1);
    end loop;

    begin
      insert into public.student_access_links (
        owner_id, student_id, access_code, expires_at
      ) values (
        v_owner_id, p_student_id, v_code, null
      );
      return v_code;
    exception
      when unique_violation then
        -- Another request may have created the student's permanent link first.
        select l.access_code into v_code
        from public.student_access_links l
        where l.owner_id = v_owner_id
          and l.student_id = p_student_id
          and l.revoked_at is null
        order by l.created_at desc
        limit 1;

        if v_code is not null then
          return v_code;
        end if;

        if v_attempt >= 5 then
          raise;
        end if;
    end;
  end loop;
end;
$$;

revoke all on function public.get_or_create_student_access(uuid) from public;
grant execute on function public.get_or_create_student_access(uuid) to authenticated;
