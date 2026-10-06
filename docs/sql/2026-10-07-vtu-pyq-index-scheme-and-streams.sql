-- 2026-10-07 — /vtu-pyqs was returning 500; vtu_pyq_index() grows a scheme and
-- resolves each paper's stream.
--
-- Applied as three migrations, in this order:
--   subjects_lookup_indexes
--   vtu_pyq_index_expose_scheme
--   vtu_pyq_index_resolve_stream_from_branch
--
-- Reported as "the papers I just added are not showing on the website". They
-- were: every row and every link the backfill wrote was readable the whole time.
-- The page was a 500.
--
-- `anon` and `authenticated` carry `statement_timeout` (3s / 8s) and `postgres`
-- does not, so `select vtu_pyq_index()` succeeded for anyone testing it in SQL
-- while every real visitor got `57014 canceling statement due to statement
-- timeout`. The 2026-10-07 py_qp backfill took the index from 132 lateral probes
-- to 1,211, and `subjects` had only a primary key on `id` — no index on
-- `scheme_code`, `sem_1_sub_code` or `sem_2_sub_code`. EXPLAIN ANALYZE put 5.0s
-- of a 6.25s runtime in one seq scan of 5,819 rows, 1,211 times over.
--
--   6,247 ms  ->  234 ms
--
-- Two faults sat behind the report and both are fixed here:
--
-- 1. No scheme on a page that now has two. The RPC counted schemes in its totals
--    but never emitted one, so the browser — which builds every dropdown from
--    the fields its rows carry — could not offer a filter. `scheme_code` also
--    joins the GROUP BY, which is the correctness half: `base_file` is only the
--    filename, stripped of the R2 folder that names the scheme, so a 2022 and a
--    2025 paper sharing a code and a filename used to merge into one card with
--    `min(url)` silently choosing which PDF to link.
--
-- 2. All 360 backfilled papers rendered as "All branches", so choosing any
--    branch in the filter hid every one of them. `subjects.stream` and
--    `subjects.branch` are different vocabularies and must not be coalesced:
--      stream = the five streams      CSE, CV, ECE, EEE, ME  (+ 'ALL')
--      branch = the ~40 branch codes  CS, EC, EE, CV, ME, AI, DS, ...
--    The 2022 scheme has `stream` NULL on all 1,340 rows and `branch` set on all
--    of them; the 2025 scheme is the reverse. `coalesce(stream, branch)` would
--    put "CS" in the dropdown beside "CSE". The catalogue already holds the real
--    map — branches.code -> branches.stream_id -> streams.code, and
--    `streams.code` speaks the same five-value vocabulary. All 40 codes the 2022
--    papers carry resolve through it. `streams.name` ("Computer Science & Engg
--    Stream") is NOT the value to use.
--
-- Measured after: 436 papers / 158 subjects / 5 sittings / 2 schemes, streams
-- CSE 176, EEE 84, ME 58, CV 42 on the 2022 side and unchanged on the 2025 side.
--
-- The assertions below check *shape*, not counts. The 2026-10-06 patch could
-- assert exact totals because its whole point was that the collection must not
-- move; this one exists because the collection did move, and pinning 436 would
-- make the file refuse to re-run the day more papers are added.

-- Bulk OR-land, so they are plain `create index` rather than `concurrently`:
-- /vtu-pyqs was down and these take well under a second on 5,819 rows. An OR
-- across two columns cannot use one composite index, so Postgres needs both to
-- build a BitmapOr. The leading `scheme_code` is what keeps each scan to one
-- scheme's 800-1,900 rows instead of all of them.
create index if not exists subjects_scheme_sem1_code_idx
  on public.subjects (scheme_code, sem_1_sub_code);

create index if not exists subjects_scheme_sem2_code_idx
  on public.subjects (scheme_code, sem_2_sub_code);

create or replace function public.vtu_pyq_index()
returns jsonb
language sql
stable
set search_path to 'public'
as $function$
with cell as (
  select coalesce(p.scheme_code, '')                 as scheme_code,
         coalesce(p.sem_1_sub_code, p.sem_2_sub_code) as row_code,
         e.key                                       as session_col,
         item.value                                  as item
  from py_qp p
  cross join lateral jsonb_each_text(
    to_jsonb(p) - 'id' - 'created_at' - 'updated_at'
  ) e
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof((e.value::jsonb) -> 'Paper') = 'array'
         then (e.value::jsonb) -> 'Paper'
         else jsonb_build_array((e.value::jsonb) -> 'Paper') end
  ) item(value)
  where e.value is not null and e.value <> ''
    and e.key ~ '^(dec_jan|june_july)_[0-9]{4}$'
    and (e.value::jsonb) ? 'Paper'
),
resolved as (
  select scheme_code, row_code, session_col,
         case when jsonb_typeof(item) = 'object' then item ->> 'url'
              else item #>> '{}' end as url
  from cell
),
doc as (
  select distinct scheme_code, row_code, session_col, url,
         replace(replace(
           split_part(url, '/', array_length(string_to_array(url, '/'), 1)),
           '%20', ' '), '%26', '&') as file
  from resolved
  where url is not null and url <> '' and row_code is not null
),
keyed as (
  select d.*,
         substring(d.file from '^([0-9A-Za-z]+)')              as file_code,
         regexp_replace(d.file, '\s*\([0-9]+\)\.pdf$', '.pdf') as base_file
  from doc d
),
-- One row per branch code, so joining it cannot multiply the subject rows below.
branch_stream as (
  select b.code, min(st.code) as stream_code
  from branches b
  join streams st on st.id = b.stream_id
  group by b.code
),
named as (
  select k.scheme_code, k.row_code, k.session_col, k.base_file, k.url,
         coalesce(s.sub_name,
                  (select min(su.sub_name) from subjects su
                    where su.scheme_code = k.scheme_code
                      and (su.sem_1_sub_code = k.row_code
                           or su.sem_2_sub_code = k.row_code)),
                  k.row_code)                                          as sub_name,
         coalesce(s.sub_code,
                  (select min(coalesce(su.sem_1_sub_code, su.sem_2_sub_code))
                     from subjects su
                    where su.scheme_code = k.scheme_code
                      and (su.sem_1_sub_code = k.row_code
                           or su.sem_2_sub_code = k.row_code)),
                  k.row_code)                                          as sub_code,
         s.sub_stream,
         s.sub_common,
         s.sub_semester
  from keyed k
  left join lateral (
    select min(su.sub_name)                                   as sub_name,
           min(coalesce(su.sem_1_sub_code, su.sem_2_sub_code))    as sub_code,
           string_agg(distinct coalesce(su.stream, bs.stream_code), ', '
                      order by coalesce(su.stream, bs.stream_code)) as sub_stream,
           bool_or(coalesce(su.stream, bs.stream_code) = 'ALL')     as sub_common,
           string_agg(distinct su.semester, ', '
                      order by su.semester)                       as sub_semester
    from subjects su
    left join branch_stream bs on bs.code = su.branch
    where su.scheme_code = k.scheme_code
      and (su.sem_1_sub_code = k.file_code or su.sem_2_sub_code = k.file_code)
  ) s on true
),
label as (
  select n.*,
         case when n.session_col like 'dec_jan_%'
              then 'Dec ' || (right(n.session_col, 4)::int - 1)
                   || ' – Jan ' || right(n.session_col, 4)
              else 'June – July ' || right(n.session_col, 4) end as session_label
  from named n
),
pap as (
  select scheme_code,
         sub_code,
         sub_name,
         base_file,
         min(url)                                  as url,
         -- Still unfiltered: this lists every stream in the catalogue rather
         -- than the ones this subject is common to. Harmless while one
         -- vocabulary exists; it is the next thing to fix here.
         case when bool_or(sub_common)
              then (select string_agg(distinct coalesce(su.stream, bs.stream_code), ', '
                                      order by coalesce(su.stream, bs.stream_code))
                      from subjects su
                      left join branch_stream bs on bs.code = su.branch
                     where coalesce(su.stream, bs.stream_code) <> 'ALL')
              else coalesce(min(sub_stream), 'All branches') end as streams,
         coalesce(min(sub_semester), 'Not recorded') as semesters,
         string_agg(distinct session_label, ', '
                    order by session_label)        as sessions
  from label
  group by scheme_code, sub_code, sub_name, base_file
)
select jsonb_build_object(
  'papers', coalesce(jsonb_agg(jsonb_build_object(
      'scheme_code',  p.scheme_code,
      'scheme_name',  coalesce((select min(sc.scheme_name)
                                  from schemes sc
                                 where sc.scheme_code = p.scheme_code),
                               p.scheme_code),
      'subject_code', p.sub_code,
      'subject_name', p.sub_name,
      'streams',      p.streams,
      'semesters',    p.semesters,
      'sessions',     p.sessions,
      'url',          p.url
    ) order by p.scheme_code, p.sub_name), '[]'::jsonb),
  'totals', jsonb_build_object(
    'papers',   (select count(*)::int from pap),
    'subjects', (select count(distinct sub_code)::int from pap),
    'sessions', (select count(distinct session_col)::int from label),
    'schemes',  (select count(distinct scheme_code)::int from pap)
  )
)
from pap p;
$function$;

do $check$
declare
  idx jsonb;
begin
  idx := public.vtu_pyq_index() -> 'papers';

  if jsonb_array_length(idx) = 0 then
    raise exception 'vtu_pyq_index returned no papers';
  end if;

  -- The keys the page reads. A missing one is a blank filter or a blank card.
  if exists (
    select 1 from jsonb_array_elements(idx) p
    where coalesce(p ->> 'scheme_code', '') = ''
       or coalesce(p ->> 'scheme_name', '') = ''
       or coalesce(p ->> 'subject_code', '') = ''
       or coalesce(p ->> 'subject_name', '') = ''
       or coalesce(p ->> 'streams', '') = ''
       or coalesce(p ->> 'semesters', '') = ''
       or coalesce(p ->> 'sessions', '') = ''
       or coalesce(p ->> 'url', '') = ''
  ) then
    raise exception 'a paper came back missing a field the page renders';
  end if;

  -- `bool_or(scheme_code)` must be false: a second scheme is why the filter
  -- exists, and one scheme means this patch ran against the wrong table.
  if (public.vtu_pyq_index() -> 'totals' ->> 'schemes')::int < 2 then
    raise exception 'expected at least 2 schemes, found %',
      public.vtu_pyq_index() -> 'totals' ->> 'schemes';
  end if;

  -- The whole point of the branch_stream join. `All branches` is the RPC's
  -- fallback for a paper whose subject resolved to nothing, and it used to be
  -- every 2022-scheme paper. If it is back, the join has stopped matching.
  if exists (
    select 1 from jsonb_array_elements(idx) p where p ->> 'streams' = 'All branches'
  ) then
    raise exception '% papers fell back to All branches',
      (select count(*) from jsonb_array_elements(idx) p
        where p ->> 'streams' = 'All branches');
  end if;

  -- Every stream token must be one of the five. A sixth means either a new
  -- vocabulary arrived, or `streams.name` was used where `streams.code` belongs.
  if exists (
    select 1
    from jsonb_array_elements(idx) p,
         unnest(string_to_array(p ->> 'streams', ', ')) t(token)
    where t.token not in ('CSE', 'CV', 'ECE', 'EEE', 'ME')
  ) then
    raise exception 'an unmapped stream appeared: %',
      (select string_agg(distinct t.token, ', ')
         from jsonb_array_elements(idx) p,
              unnest(string_to_array(p ->> 'streams', ', ')) t(token)
        where t.token not in ('CSE', 'CV', 'ECE', 'EEE', 'ME'));
  end if;
end $check$;
