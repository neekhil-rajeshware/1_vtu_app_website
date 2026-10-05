-- 2026-10-06 — vtu_pyq_index() expands the `ALL` stream sentinel.
--
-- Applied as the migration `vtu_pyq_index_expand_all_streams`.
--
-- `subjects.stream` holds `ALL` for a subject every branch sits, which is a
-- sentinel sitting in the same column as five real stream codes. The web page
-- was labelling it "All branches" from a constant in the TypeScript, and
-- treating "this paper is common" as a special case in the filter — so the
-- branch list on the site was half database, half hardcoded.
--
-- Expanding it here instead makes the whole thing derive: a common paper comes
-- out carrying the actual streams, and every consumer can match on the value
-- without knowing any sentinel exists. Add a fifth stream to `subjects` and
-- common papers pick it up on the next request, with no code change anywhere.
--
-- The expansion is the distinct streams present in `subjects` with `ALL`
-- removed — not a join to `branches`, which would be wrong. `subjects.stream`
-- speaks its own vocabulary: it has CSE, ECE and EEE, and `branches.code` has
-- none of those three (it has CS, CR, EC and EE). CV and ME happen to exist in
-- both, which is exactly the kind of partial match that looks like it works.
--
-- The `'All branches'` fallback for a file whose code resolves to nothing is
-- left alone: there the branch genuinely is unknown, and listing all five would
-- be inventing an answer rather than deriving one.

do $patch$
declare
  d text;
begin
  d := pg_get_functiondef('public.vtu_pyq_index()'::regprocedure);

  if position($a$           string_agg(distinct su.stream, ', '
                      order by su.stream)                         as sub_stream,$a$ in d) = 0 then
    raise exception 'vtu_pyq_index: lateral stream aggregate not found';
  end if;
  if position($a$         s.sub_stream,
         s.sub_semester
  from keyed k$a$ in d) = 0 then
    raise exception 'vtu_pyq_index: named select tail not found';
  end if;
  if position($a$         coalesce(min(sub_stream), 'All branches') as streams,$a$ in d) = 0 then
    raise exception 'vtu_pyq_index: pap streams line not found';
  end if;

  -- 1. The lateral stops aggregating the sentinel as if it were a stream, and
  --    reports separately whether it saw one.
  d := replace(d,
    $a$           string_agg(distinct su.stream, ', '
                      order by su.stream)                         as sub_stream,$a$,
    $b$           string_agg(distinct nullif(su.stream, 'ALL'), ', '
                      order by nullif(su.stream, 'ALL'))          as sub_stream,
           bool_or(su.stream = 'ALL')                             as sub_common,$b$);

  -- 2. Carry the flag out of the lateral.
  d := replace(d,
    $a$         s.sub_stream,
         s.sub_semester
  from keyed k$a$,
    $b$         s.sub_stream,
         s.sub_common,
         s.sub_semester
  from keyed k$b$);

  -- 3. Expand at the point the value is produced, so every consumer sees the
  --    same derived list.
  d := replace(d,
    $a$         coalesce(min(sub_stream), 'All branches') as streams,$a$,
    $b$         case when bool_or(sub_common)
              then (select string_agg(distinct su.stream, ', '
                                      order by su.stream)
                      from subjects su
                     where su.stream <> 'ALL')
              else coalesce(min(sub_stream), 'All branches') end as streams,$b$);

  if position('sub_common' in d) = 0 then
    raise exception 'vtu_pyq_index: the common-stream flag did not land';
  end if;

  execute d;

  -- The collection must not move.
  if (public.vtu_pyq_index() -> 'totals' ->> 'papers')::int <> 59 then
    raise exception 'papers moved from 59 to %', public.vtu_pyq_index() -> 'totals' ->> 'papers';
  end if;
  if (public.vtu_pyq_index() -> 'totals' ->> 'subjects')::int <> 33 then
    raise exception 'subjects moved from 33 to %', public.vtu_pyq_index() -> 'totals' ->> 'subjects';
  end if;

  -- No paper may still print the sentinel.
  if exists (
    select 1
    from jsonb_array_elements(public.vtu_pyq_index() -> 'papers') p
    where (p ->> 'streams') = 'ALL'
       or (p ->> 'streams') like 'ALL, %'
       or (p ->> 'streams') like '%, ALL'
  ) then
    raise exception 'a paper still reports the ALL sentinel: %',
      (select string_agg(distinct p ->> 'streams', ' | ')
       from jsonb_array_elements(public.vtu_pyq_index() -> 'papers') p
       where (p ->> 'streams') like '%ALL%');
  end if;

  -- And the 23 common papers — which used to produce exactly one value — must
  -- now name more than one stream. This is the assertion that fails before the
  -- patch, on 23 rows.
  if (select count(*)
      from jsonb_array_elements(public.vtu_pyq_index() -> 'papers') p
      where (p ->> 'streams') like '%,%') < 23 then
    raise exception 'only % papers name more than one stream; expected at least 23',
      (select count(*)
       from jsonb_array_elements(public.vtu_pyq_index() -> 'papers') p
       where (p ->> 'streams') like '%,%');
  end if;

  -- The expanded list must be the real streams, not a literal typed here. The
  -- unresolved fallback is exempt: there the branch is honestly unknown.
  if exists (
    select 1
    from jsonb_array_elements(public.vtu_pyq_index() -> 'papers') p
    cross join lateral unnest(string_to_array(p ->> 'streams', ', ')) as t
    where (p ->> 'streams') <> 'All branches'
      and t not in (select distinct su.stream from public.subjects su
                    where su.stream <> 'ALL')
  ) then
    raise exception 'a paper named a stream that is not in subjects';
  end if;
end $patch$;
