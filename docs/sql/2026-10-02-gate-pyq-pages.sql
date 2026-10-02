-- 2026-10-02 — question-paper pages: GATE and VTU.
--
-- Applied to project kzwykhjalncwyrmcmwsc. This file is the repo's only record
-- of the schema change; this repo keeps no .sql files and its migrations live
-- only in supabase_migrations.schema_migrations.

-- ---------------------------------------------------------------------------
-- 1. name and slug on gatepyqs
-- ---------------------------------------------------------------------------
--
-- The paper's name is recoverable from the R2 folder
-- (CS_Computer_Science_%26_Engineering) but only by URL-decoding and
-- de-prefixing on every render, and the slug is not recoverable predictably at
-- all. Both are stable, so they are computed once here.
--
-- The DO block at the end fails the migration if two papers slugify to the same
-- string, or if any paper has no folder to derive a name from. A silent
-- collision would mean one of 52 pages did not exist, which is the class of bug
-- nobody notices for a month.
--
-- Note the two live cell shapes: older years store a bare URL string, 2024+
-- store [{"url","label"}] because a year can have two sittings. Only the folder
-- segment is wanted here, and both shapes carry it, so both are decoded.

alter table public.gatepyqs
  add column if not exists name text,
  add column if not exists slug text;

with cell as (
  select g.id,
         e.key as yr,
         case when jsonb_typeof((e.value::jsonb) -> 'Paper') = 'array'
              then (e.value::jsonb) -> 'Paper' -> 0 ->> 'url'
              else (e.value::jsonb) ->> 'Paper' end as url
  from public.gatepyqs g
  cross join lateral jsonb_each_text(
    to_jsonb(g) - 'code' - 'name' - 'slug' - 'id'
  ) e
  where e.value is not null and e.value <> ''
    and (e.value::jsonb) ? 'Paper'
),
derived as (
  -- Every year of a paper lives in the same folder, so any URL will do.
  -- Path segments: https: / "" / host / vtu / gatepyqs / <FOLDER> / papers / file
  select id,
         replace(split_part(min(url), '/', 6), '%26', '&') as folder
  from cell
  where url is not null
  group by id
),
named as (
  select g.id,
         -- "CS_Computer_Science_&_Engineering" -> "Computer Science & Engineering"
         -- The paren tidy-up is for one source folder that reads
         -- "EA_...( _Advanced_Communication_Technology)", which decodes to
         -- "Communication( Advanced ..." and is shown to visitors.
         regexp_replace(
           regexp_replace(
             regexp_replace(d.folder, '^[A-Z0-9]+_', ''),
             '_', ' ', 'g'
           ),
           '\(\s+', '(', 'g'
         ) as name
  from public.gatepyqs g
  join derived d on d.id = g.id
)
update public.gatepyqs g
   set name = n.name,
       slug = trim(both '-' from regexp_replace(lower(n.name), '[^a-z0-9]+', '-', 'g'))
  from named n
 where n.id = g.id;

do $$
declare
  v_rows  int;
  v_named int;
  v_slugs int;
  v_blank int;
  v_dupes text;
begin
  select count(*) into v_rows  from public.gatepyqs;
  select count(*) into v_named from public.gatepyqs where name is not null;
  select count(distinct slug) into v_slugs from public.gatepyqs where slug is not null;
  select count(*) into v_blank from public.gatepyqs where slug is null or slug = '';

  if v_named <> v_rows then
    raise exception 'gatepyqs: % of % rows have no name — no folder in any year cell',
      v_rows - v_named, v_rows;
  end if;

  if v_blank > 0 then
    raise exception 'gatepyqs: % rows slugified to an empty string', v_blank;
  end if;

  if v_slugs <> v_rows then
    select string_agg(slug || ' (' || n || ')', ', ')
      into v_dupes
      from (select slug, count(*) as n from public.gatepyqs
             group by slug having count(*) > 1) d;
    raise exception 'gatepyqs: % rows produced only % distinct slugs — %',
      v_rows, v_slugs, v_dupes;
  end if;

  raise notice 'gatepyqs: % rows named and slugged, all distinct', v_rows;
end $$;

alter table public.gatepyqs
  alter column name set not null,
  alter column slug set not null;

create unique index if not exists gatepyqs_slug_key on public.gatepyqs (slug);

-- ---------------------------------------------------------------------------
-- 2. gate_pyq_index()
-- ---------------------------------------------------------------------------
--
-- Every GATE paper, its real year span, and its assets.
--
-- Two cell shapes have to be handled and both are live: older years store a bare
-- URL string, 2024+ store [{"url","label"}] because a year can have two
-- sittings. A parser that handles one shape drops half the papers with no error.
--
-- year_from / year_to are derived so a heading can never contradict the list
-- under it, and totals.documents counts PDFs rather than cells: a 2024 cell
-- holds two sessions, so counting cells understates the collection badly.
--
-- There is deliberately no `solved` key. Every cell in gatepyqs holds `Paper`
-- and `Answer Key` and nothing else; a field that is always [] is a promise the
-- site cannot keep. (`/coverage` shipped the words "and solutions" until
-- 2026-10-02 for exactly this reason.)
--
-- Shaped in SQL because the shape knowledge lives here; shipping 20 raw text
-- columns per row to the client would be waste.

create or replace function public.gate_pyq_index()
returns jsonb
language sql
stable
set search_path = public
as $function$
with cell as (
  select g.code, g.name, g.slug,
         e.key::int     as year,
         e.value::jsonb as j
  from gatepyqs g
  cross join lateral jsonb_each_text(
    to_jsonb(g) - 'code' - 'name' - 'slug' - 'id'
  ) e
  where e.value is not null and e.value <> ''
    and e.key ~ '^[0-9]{4}$'
),
asset as (
  select c.code, c.name, c.slug, c.year, t.k as kind, a.v as item
  from cell c
  cross join lateral (values ('Paper'), ('Answer Key')) as t(k)
  cross join lateral (
    -- A bare string becomes a one-element array so jsonb_array_elements is
    -- never inside the CASE: Postgres rejects a set-returning function in a
    -- CASE branch outright (0A000).
    select jsonb_array_elements(
      case when jsonb_typeof(c.j -> t.k) = 'array' then c.j -> t.k
           else jsonb_build_array(c.j -> t.k) end
    )
  ) as a(v)
  where c.j ? t.k
),
doc as (
  select code, name, slug, year, kind,
         case when jsonb_typeof(item) = 'object' then item ->> 'url'
              else item #>> '{}' end as url,
         case when jsonb_typeof(item) = 'object' then item ->> 'label'
              else null end          as label
  from asset
  where (case when jsonb_typeof(item) = 'object' then item ->> 'url'
              else item #>> '{}' end) is not null
),
yr as (
  select code, name, slug, year,
         jsonb_agg(jsonb_build_object('url', url, 'label', label)
                   order by label nulls first)
           filter (where kind = 'Paper')      as paper,
         jsonb_agg(jsonb_build_object('url', url, 'label', label)
                   order by label nulls first)
           filter (where kind = 'Answer Key') as answer_key
  from doc
  group by code, name, slug, year
),
pap as (
  select code, name, slug,
         jsonb_agg(jsonb_build_object(
           'year',       year,
           'paper',      coalesce(paper, '[]'::jsonb),
           'answer_key', coalesce(answer_key, '[]'::jsonb)
         ) order by year desc) as years,
         min(year) as year_from,
         max(year) as year_to
  from yr
  group by code, name, slug
)
select jsonb_build_object(
  'papers', coalesce(jsonb_agg(jsonb_build_object(
      'code',      code,
      'name',      name,
      'slug',      slug,
      'year_from', year_from,
      'year_to',   year_to,
      'years',     years
    ) order by name), '[]'::jsonb),
  'totals', jsonb_build_object(
    'papers',    (select count(*)::int from pap),
    'documents', (select count(*)::int from doc),
    'year_from', (select min(year_from) from pap),
    'year_to',   (select max(year_to) from pap)
  )
)
from pap;
$function$;

revoke all on function public.gate_pyq_index() from public;
grant execute on function public.gate_pyq_index() to anon, authenticated;
