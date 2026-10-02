-- 2026-10-02 — vtu_pyq_index() resolves a filename's subject as a set.
--
-- Applied as the migration `vtu_pyq_index_stream_set`.
--
-- The defect was not only missing determinism. `left join lateral (… limit 1)`
-- with no ORDER BY returns whichever matching `subjects` row the scan reaches
-- first, and `subjects` holds one row per stream for a first-year subject. So
-- the stream printed on /vtu-pyqs was arbitrary AND false:
--
--   1BESC104A  Building Sciences and Mechanics        printed EEE, is CSE, ECE, EEE, ME
--   1BESC104D  Introduction to Mechanical Engineering printed EEE, is CSE, CV, ECE, EEE
--   1BPLC105E  Introduction to C Programming          printed ME,  is CV, ECE, EEE, ME
--   1BCHEE102  Applied Chemistry (EEE, ECE)           printed EEE, is ECE, EEE
--
-- Four codes, five rows of 59. The other 55 subjects resolve to a single stream
-- and were already right, so nothing else moves.
--
-- Aggregates rather than a tie-break: `min()` and `string_agg(… order by …)` do
-- not depend on row order at all, so the result is deterministic by construction
-- instead of by a rule that still has to guess which of several rows is meant.
--
-- This patches the live definition through `pg_get_functiondef` + anchored
-- `replace` rather than restating 250 lines. Every anchor is guarded: a
-- `replace` that matches nothing is a silent no-op, and a half-patched function
-- is worse than an unpatched one.

do $patch$
declare
  d text;
begin
  d := pg_get_functiondef('public.vtu_pyq_index()'::regprocedure);

  if position($a$    select su.sub_name,$a$ in d) = 0 then
    raise exception 'vtu_pyq_index: lateral select head not found';
  end if;
  if position($a$      and (su.sem_1_sub_code = k.file_code or su.sem_2_sub_code = k.file_code)$a$ in d) = 0 then
    raise exception 'vtu_pyq_index: lateral where clause not found';
  end if;
  if position($a$(select su.sub_name from subjects su$a$ in d) = 0 then
    raise exception 'vtu_pyq_index: fallback name subquery not found';
  end if;
  if position($a$                    limit 1),$a$ in d) = 0 then
    raise exception 'vtu_pyq_index: fallback limit-1 lines not found';
  end if;

  -- 1. The resolution itself, as a set.
  d := replace(d,
    $a$    select su.sub_name,
           coalesce(su.sem_1_sub_code, su.sem_2_sub_code) as sub_code,
           su.stream                                      as sub_stream$a$,
    $b$    select min(su.sub_name)                                   as sub_name,
           min(coalesce(su.sem_1_sub_code, su.sem_2_sub_code))    as sub_code,
           string_agg(distinct su.stream, ', '
                      order by su.stream)                         as sub_stream$b$);

  -- 2. The lateral's own `limit 1`, now replaced by the aggregate.
  d := replace(d,
    $a$      and (su.sem_1_sub_code = k.file_code or su.sem_2_sub_code = k.file_code)
    limit 1$a$,
    $b$      and (su.sem_1_sub_code = k.file_code or su.sem_2_sub_code = k.file_code)$b$);

  -- 3. Both fallbacks — the subqueries for a file carrying no usable code. One
  --    replace covers both, because they close identically.
  d := replace(d, $a$(select su.sub_name from subjects su$a$,
                      $b$(select min(su.sub_name) from subjects su$b$);
  d := replace(d, $a$(select coalesce(su.sem_1_sub_code, su.sem_2_sub_code)
                     from subjects su$a$,
                      $b$(select min(coalesce(su.sem_1_sub_code, su.sem_2_sub_code))
                     from subjects su$b$);
  d := replace(d, $a$                    limit 1),$a$, $b$),$b$);

  if position('limit 1' in d) > 0 then
    raise exception 'vtu_pyq_index: % `limit 1` still present after patching',
      (length(d) - length(replace(d, 'limit 1', ''))) / 7;
  end if;
  if position('string_agg(distinct su.stream' in d) = 0 then
    raise exception 'vtu_pyq_index: the stream aggregate did not land';
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

  -- And no paper may print one stream when it belongs to several. This is the
  -- assertion that failed before the patch, on five rows.
  if exists (
    select 1
    from jsonb_array_elements(public.vtu_pyq_index() -> 'papers') p
    where (select count(distinct su.stream) from public.subjects su
            where su.sem_1_sub_code = p ->> 'subject_code'
               or su.sem_2_sub_code = p ->> 'subject_code') > 1
      and (p ->> 'streams') not like '%,%'
  ) then
    raise exception 'a multi-stream paper still prints one stream';
  end if;
end $patch$;
