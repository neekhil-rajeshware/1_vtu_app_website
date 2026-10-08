-- Make content_coverage() notice a session column it was not told about.
--
-- The pyq block listed the 20 session columns by hand
-- (`lateral (values (p.dec_jan_2018), …, (p.june_july_2027))`) and hardcoded the
-- same 20 twice more (`'sessions', 20`, `'slots', count(*) * 20`). Adding
-- `dec_jan_2028` to py_qp therefore left /coverage reporting 20 sessions and a
-- slot count one column short, with no error — the numbers just quietly stopped
-- being true.
--
-- That was the *only* consumer with the problem. The app reads `py_qp` with a
-- bare `select()` and treats every non-skip key as a session (PyqRow.fromMap),
-- ordering by the year in the column name; `/vtu-pyqs`'s `vtu_pyq_index()`
-- already filters keys on `^(dec_jan|june_july)_[0-9]{4}$`. Both pick up a new
-- column on their own. This one did not.
--
-- Now derived the same way, so "add the column and backfill it" is the whole
-- job. Gate's year columns are still listed by hand below; a 2027 GATE year
-- needs the same treatment.

CREATE OR REPLACE FUNCTION public.content_coverage()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
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
  pyq_session_col as (
    select count(*)::int as n
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'py_qp'
      and column_name ~ '^(dec_jan|june_july)_[0-9]{4}$'
  ),
  pyq_cell as (
    select p.stream as stream,
           count(*) filter (where q.value is not null and q.value <> '') as filled
    from py_qp p
    cross join lateral jsonb_each_text(
      to_jsonb(p) - 'id' - 'created_at' - 'updated_at'
    ) as q(key, value)
    where q.key ~ '^(dec_jan|june_july)_[0-9]{4}$'
    group by p.stream
  ),
  pyq_by_stream as (
    select coalesce(jsonb_agg(
             jsonb_build_object('stream', coalesce(stream, 'Common'), 'filled', filled)
             order by filled desc), '[]'::jsonb) as v
    from pyq_cell
  ),
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
    'sessions',  (select n from pyq_session_col),
    'slots',     (select count(*)::int from py_qp) * (select n from pyq_session_col),
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
