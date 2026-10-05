-- 2026-10-06 — vtu_pyq_index() reports each paper's semester.
--
-- Applied as the migration `vtu_pyq_index_semester`.
--
-- /vtu-pyqs is getting the search-and-filter bar /coverage already has, and the
-- user picked Search + Branch + Semester. `streams` already carries the branch
-- dimension; nothing carried the semester, so the RPC has to grow one.
--
-- A set, exactly like `streams`, for the same reason: `subjects` holds one row
-- per stream and a first-year subject's rows can disagree. Measured against the
-- live table, the 33 subject codes behind the 59 papers resolve to:
--
--   1 & 2           10 subjects   a first-year subject taught in both
--   1                4 subjects
--   2                4 subjects
--   (null)          15 subjects   the semester was never filled in
--
-- NULL is a real and common answer here, so it gets a label rather than a
-- coalesce to something that reads like data — 'Not recorded' says what it is.
-- Fifteen of 33 subjects is too many to guess at.
--
-- Patches the live definition through `pg_get_functiondef` + anchored `replace`
-- rather than restating 250 lines, the same way the stream-set fix did. Every
-- anchor is guarded: a `replace` that matches nothing is a silent no-op, and a
-- half-patched function is worse than an unpatched one.

do $patch$
declare
  d text;
begin
  d := pg_get_functiondef('public.vtu_pyq_index()'::regprocedure);

  if position($a$         s.sub_stream
  from keyed k$a$ in d) = 0 then
    raise exception 'vtu_pyq_index: named select tail not found';
  end if;
  if position($a$                      order by su.stream)                         as sub_stream$a$ in d) = 0 then
    raise exception 'vtu_pyq_index: lateral stream aggregate not found';
  end if;
  if position($a$         coalesce(min(sub_stream), 'All branches') as streams,$a$ in d) = 0 then
    raise exception 'vtu_pyq_index: pap streams line not found';
  end if;
  if position($a$      'streams',      streams,
      'sessions',     sessions,$a$ in d) = 0 then
    raise exception 'vtu_pyq_index: output streams/sessions pair not found';
  end if;

  -- 1. The lateral, alongside the stream aggregate it mirrors.
  d := replace(d,
    $a$                      order by su.stream)                         as sub_stream$a$,
    $b$                      order by su.stream)                         as sub_stream,
           string_agg(distinct su.semester, ', '
                      order by su.semester)                       as sub_semester$b$);

  -- 2. Carry it out of the lateral. `streams` has no fallback here — it is
  --    coalesced in `pap` — and semester follows the same shape.
  d := replace(d,
    $a$         s.sub_stream
  from keyed k$a$,
    $b$         s.sub_stream,
         s.sub_semester
  from keyed k$b$);

  -- 3. The group-by projection.
  d := replace(d,
    $a$         coalesce(min(sub_stream), 'All branches') as streams,$a$,
    $b$         coalesce(min(sub_stream), 'All branches') as streams,
         coalesce(min(sub_semester), 'Not recorded') as semesters,$b$);

  -- 4. And into the payload.
  d := replace(d,
    $a$      'streams',      streams,
      'sessions',     sessions,$a$,
    $b$      'streams',      streams,
      'semesters',    semesters,
      'sessions',     sessions,$b$);

  if position('sub_semester' in d) = 0 then
    raise exception 'vtu_pyq_index: the semester aggregate did not land';
  end if;
  if (length(d) - length(replace(d, 'sub_semester', ''))) / 12 <> 3 then
    raise exception 'vtu_pyq_index: expected 3 `sub_semester` references, found %',
      (length(d) - length(replace(d, 'sub_semester', ''))) / 12;
  end if;

  execute d;

  -- The collection must not move: same papers, same subjects, same sittings.
  if (public.vtu_pyq_index() -> 'totals' ->> 'papers')::int <> 59 then
    raise exception 'papers moved from 59 to %', public.vtu_pyq_index() -> 'totals' ->> 'papers';
  end if;
  if (public.vtu_pyq_index() -> 'totals' ->> 'subjects')::int <> 33 then
    raise exception 'subjects moved from 33 to %', public.vtu_pyq_index() -> 'totals' ->> 'subjects';
  end if;
  if (public.vtu_pyq_index() -> 'totals' ->> 'sessions')::int <> 2 then
    raise exception 'sessions moved from 2 to %', public.vtu_pyq_index() -> 'totals' ->> 'sessions';
  end if;
  if (public.vtu_pyq_index() -> 'totals' ->> 'schemes')::int <> 1 then
    raise exception 'schemes moved from 1 to %', public.vtu_pyq_index() -> 'totals' ->> 'schemes';
  end if;

  -- Every paper must carry the key, and a label rather than a blank.
  if exists (
    select 1
    from jsonb_array_elements(public.vtu_pyq_index() -> 'papers') p
    where coalesce(p ->> 'semesters', '') = ''
  ) then
    raise exception 'a paper came back with no semesters label';
  end if;

  -- And the labels must be exactly the four the data supports. A fifth value
  -- means `subjects.semester` grew a format this patch never mapped.
  if exists (
    select 1
    from jsonb_array_elements(public.vtu_pyq_index() -> 'papers') p
    where (p ->> 'semesters') not in ('1', '2', '1 & 2', 'Not recorded')
  ) then
    raise exception 'an unmapped semester label appeared: %',
      (select string_agg(distinct p ->> 'semesters', ', ')
       from jsonb_array_elements(public.vtu_pyq_index() -> 'papers') p
       where (p ->> 'semesters') not in ('1', '2', '1 & 2', 'Not recorded'));
  end if;

  -- `Not recorded` is the common case, so an empty dropdown would be the
  -- silent failure here. Assert something lands in every bucket but the rarest.
  if (select count(*) from jsonb_array_elements(public.vtu_pyq_index() -> 'papers') p
       where p ->> 'semesters' = '1 & 2') = 0 then
    raise exception 'no paper resolved to semester 1 & 2';
  end if;
  if (select count(*) from jsonb_array_elements(public.vtu_pyq_index() -> 'papers') p
       where p ->> 'semesters' = 'Not recorded') = 0 then
    raise exception 'no paper resolved to Not recorded';
  end if;
end $patch$;
