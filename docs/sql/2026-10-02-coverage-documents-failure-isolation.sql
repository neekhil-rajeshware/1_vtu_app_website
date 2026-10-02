-- 2026-10-02 — a broken paper index must not take down /coverage.
--
-- content_coverage() calls vtu_pyq_index() and gate_pyq_index() to fill its two
-- `documents` keys. The `coalesce` around those calls guards a NULL key, not an
-- exception: measured 2026-10-02, replacing gate_pyq_index() with one that
-- raises made content_coverage() raise, getCoverage() return null, and /coverage
-- fall back to its "unavailable" state — and coverageMetrics() return {}, which
-- drops the numbers strip on / and /about back to its admin-typed values.
--
-- So two functions added today carried three existing pages. This narrows that:
-- the two index calls move into pyq_document_counts(), which catches a failure
-- per index and reports that key as NULL. The page then shows "the document
-- count is unavailable" for that one number while every catalogue figure — which
-- never depended on the indexes — keeps rendering.
--
-- NULL, deliberately, not 0. A 0 would print "0 VTU question paper PDFs" on a
-- page whose whole purpose is an honest count, and a false number is worse than
-- an absent one. The same reasoning drove `filled` (cells) losing its job as a
-- stand-in for `documents` (PDFs) earlier today.

create or replace function public.pyq_document_counts()
returns jsonb
language plpgsql
stable
set search_path = public
as $function$
declare
  pyq_n  int;
  gate_n int;
begin
  begin
    pyq_n := (public.vtu_pyq_index() -> 'totals' ->> 'papers')::int;
  exception when others then
    pyq_n := null;
  end;

  begin
    gate_n := (public.gate_pyq_index() -> 'totals' ->> 'documents')::int;
  exception when others then
    gate_n := null;
  end;

  return jsonb_build_object('pyq', pyq_n, 'gate', gate_n);
end;
$function$;

revoke all on function public.pyq_document_counts() from public;
grant execute on function public.pyq_document_counts() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- content_coverage() — unchanged except for the two `documents` expressions,
-- which now read the helper, and the one CTE it needs to be called once.
-- ---------------------------------------------------------------------------

create or replace function public.content_coverage()
returns jsonb
language sql
stable
set search_path = public
as $function$
with
  sem as (
    select scheme_code,
           coalesce(branch, '') as branch,
           unnest(case
                    when semester is null or semester = '1 & 2' then array['1', '2']
                    else array[semester]
                  end) as s
    from subjects
    where scheme_code is not null
  ),
  cell as (
    select scheme_code, branch, s, count(*)::int as n from sem group by 1, 2, 3
  ),
  branch_cells as (
    select branch, jsonb_object_agg(s, n) as cells, sum(n)::int as total
    from (select branch, s, sum(n)::int as n from cell group by 1, 2) z
    group by 1
  ),
  scheme_branch as (
    select scheme_code, jsonb_object_agg(branch, cells) as branches
    from (
      select scheme_code,
             case when branch = '' then 'FIRST' else branch end as branch,
             jsonb_object_agg(s, n) as cells
      from cell group by 1, 2
    ) q
    group by 1
  ),
  scheme_branch_all as (
    select jsonb_object_agg(scheme_code, branches) as v from scheme_branch
  ),
  catalogue as (
    select coalesce(jsonb_agg(jsonb_build_object(
             'code', case when bc.branch = '' then 'FIRST' else bc.branch end,
             'name', coalesce(b.name, 'First year — common to every branch'),
             'stream', coalesce(st.name, 'All branches'),
             'subjects', bc.total,
             'with_syllabus', (
               select count(*)::int from subjects su
               where su.scheme_code is not null
                 and coalesce(su.branch, '') = bc.branch
                 and su.syllabus_link is not null and su.syllabus_link <> ''
             ),
             'by_semester', bc.cells
           ) order by bc.total desc, bc.branch), '[]'::jsonb) as v
    from branch_cells bc
    left join branches b on b.code = bc.branch
    left join streams st on st.id = b.stream_id
  ),
  scheme_cells as (
    select sc.scheme_code as code, sc.scheme_name as name, count(su.id)::int as subjects
    from schemes sc
    left join subjects su on su.scheme_code = sc.scheme_code
    group by sc.scheme_code, sc.scheme_name
  ),
  scheme_list as (
    select jsonb_agg(
             jsonb_build_object('code', code, 'name', name, 'subjects', subjects)
             order by code
           ) as v
    from scheme_cells
  ),
  pyq_cell as (
    select p.stream as stream,
           count(*) filter (where q.v is not null and q.v <> '') as filled
    from py_qp p, lateral (values
      (p.dec_jan_2018),(p.june_july_2018),(p.dec_jan_2019),(p.june_july_2019),
      (p.dec_jan_2020),(p.june_july_2020),(p.dec_jan_2021),(p.june_july_2021),
      (p.dec_jan_2022),(p.june_july_2022),(p.dec_jan_2023),(p.june_july_2023),
      (p.dec_jan_2024),(p.june_july_2024),(p.dec_jan_2025),(p.june_july_2025),
      (p.dec_jan_2026),(p.june_july_2026),(p.dec_jan_2027),(p.june_july_2027)
    ) as q(v)
    group by p.stream
  ),
  pyq_by_stream as (
    select coalesce(jsonb_agg(
             jsonb_build_object('stream', coalesce(stream, 'Common'), 'filled', filled)
             order by filled desc), '[]'::jsonb) as v
    from pyq_cell
  ),
  -- 2007-2013 were added by gate_pyqs_load_2007_2026 and were missing here, so
  -- the dashboard counted 676 slots against a table holding 1,040.
  gate_cell as (
    select count(*) filter (where g.v is not null and g.v <> '') as filled
    from gatepyqs, lateral (values
      (gatepyqs."2007"),(gatepyqs."2008"),(gatepyqs."2009"),(gatepyqs."2010"),
      (gatepyqs."2011"),(gatepyqs."2012"),(gatepyqs."2013"),
      (gatepyqs."2014"),(gatepyqs."2015"),(gatepyqs."2016"),(gatepyqs."2017"),
      (gatepyqs."2018"),(gatepyqs."2019"),(gatepyqs."2020"),(gatepyqs."2021"),
      (gatepyqs."2022"),(gatepyqs."2023"),(gatepyqs."2024"),(gatepyqs."2025"),
      (gatepyqs."2026")
    ) as g(v)
  ),
  -- Materialized so the two index functions are called once between them, not
  -- once per reference. If either raises, its key arrives NULL.
  doc_counts as materialized (
    select public.pyq_document_counts() as v
  ),
  active_formulas as (
    select count(*)::int as n,
           count(*) filter (where calculator_formula is not null and calculator_formula <> '')::int as calc
    from formulas
    where is_active
  )
select jsonb_build_object(
  'generated_at', now(),
  'catalogue', jsonb_build_object(
    'branches_total',   (select count(*)::int from branches),
    'branches_covered', (select count(*)::int from branch_cells where branch <> ''),
    'streams_total',    (select count(*)::int from streams),
    'schemes_total',    (select count(*)::int from schemes),
    'schemes_covered',  (select count(distinct scheme_code)::int from subjects),
    'colleges',         (select count(*)::int from colleges),
    'rows',             (select count(*)::int from subjects where scheme_code is not null),
    'with_syllabus',    (select count(*)::int from subjects
                          where scheme_code is not null
                            and syllabus_link is not null and syllabus_link <> ''),
    'branches',         (select v from catalogue),
    'schemes',          (select v from scheme_list),
    'scheme_branches',  (select v from scheme_branch_all)
  ),
  'pyq', jsonb_build_object(
    'rows',      (select count(*)::int from py_qp),
    'sessions',  20,
    'slots',     (select count(*)::int * 20 from py_qp),
    'filled',    (select coalesce(sum(filled), 0)::int from pyq_cell),
    'documents', (select (v ->> 'pyq')::int from doc_counts),
    'by_stream', (select v from pyq_by_stream)
  ),
  'gate', jsonb_build_object(
    'rows',      (select count(*)::int from gatepyqs),
    'years',     20,
    'slots',     (select count(*)::int * 20 from gatepyqs),
    'filled',    (select filled::int from gate_cell),
    'documents', (select (v ->> 'gate')::int from doc_counts)
  ),
  'library', jsonb_build_array(
    jsonb_build_object('key','formulas','label','Formulas',
      'count',(select n from active_formulas),
      'detail',(select to_char(calc, 'FM999,999,999') from active_formulas)
               || ' with a built-in calculator'),
    jsonb_build_object('key','jobs','label','Job updates',
      'count',(select count(*)::int from jobs)),
    jsonb_build_object('key','projects','label','Project ideas',
      'count',(select count(*)::int from projects)),
    jsonb_build_object('key','exams','label','Exam timetable entries',
      'count',(select count(*)::int from exam_timetable))
  )
);
$function$;

-- ---------------------------------------------------------------------------
-- Assertions
-- ---------------------------------------------------------------------------

-- The happy path is unchanged: same numbers as before this migration.
do $$
declare
  c jsonb := public.content_coverage();
begin
  if (c -> 'pyq' ->> 'documents')::int <> (public.vtu_pyq_index() -> 'totals' ->> 'papers')::int then
    raise exception 'pyq documents % disagrees with vtu_pyq_index %',
      c -> 'pyq' ->> 'documents', public.vtu_pyq_index() -> 'totals' ->> 'papers';
  end if;

  if (c -> 'gate' ->> 'documents')::int <> (public.gate_pyq_index() -> 'totals' ->> 'documents')::int then
    raise exception 'gate documents % disagrees with gate_pyq_index %',
      c -> 'gate' ->> 'documents', public.gate_pyq_index() -> 'totals' ->> 'documents';
  end if;

  if (c -> 'pyq' ->> 'filled')::int <> 69 then
    raise exception 'pyq.filled moved from 69 to %', c -> 'pyq' ->> 'filled';
  end if;

  if (c -> 'gate' ->> 'filled')::int <> 887 then
    raise exception 'gate.filled moved from 887 to %', c -> 'gate' ->> 'filled';
  end if;

  raise notice 'happy path: pyq % documents / % filled; gate % documents / % filled',
    c -> 'pyq' ->> 'documents', c -> 'pyq' ->> 'filled',
    c -> 'gate' ->> 'documents', c -> 'gate' ->> 'filled';
end $$;

-- The failure path — the whole point of this migration — is asserted by
-- `2026-10-02-coverage-documents-failure-isolation.check.sql`, not here. It has
-- to swap the two index functions out and roll them back, and an applied
-- migration already runs inside a transaction: a `rollback` in this file would
-- undo the functions above.

