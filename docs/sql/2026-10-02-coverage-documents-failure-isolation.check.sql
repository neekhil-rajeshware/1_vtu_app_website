-- Failure-path check for 2026-10-02-coverage-documents-failure-isolation.sql.
--
-- Run with execute_sql, NOT apply_migration: it ends in `rollback`, which would
-- undo the migration it is checking. The whole script is one transaction, so the
-- two stub functions exist only for its duration — a dropped connection rolls
-- them back too, and nothing else ever sees them.
--
-- Expected: outcome = 'isolated'. Before the isolation, this returned
-- 'content_coverage raised: injected index failure'.

begin;

create or replace function public.gate_pyq_index()
returns jsonb language plpgsql stable set search_path = public
as $stub$ begin raise exception 'injected index failure'; end $stub$;

create or replace function public.vtu_pyq_index()
returns jsonb language plpgsql stable set search_path = public
as $stub$ begin raise exception 'injected index failure'; end $stub$;

create temp table _check(outcome text, pyq_docs text, gate_docs text, branches text, filled text);
do $do$
declare
  c jsonb;
begin
  c := public.content_coverage();

  if (c -> 'pyq' ->> 'documents') is not null or (c -> 'gate' ->> 'documents') is not null then
    insert into _check values ('NOT isolated — a document count survived a failure',
      c -> 'pyq' ->> 'documents', c -> 'gate' ->> 'documents', null, null);
    return;
  end if;

  -- json null, not 0: the page must be able to tell "unknown" from "none".
  if jsonb_typeof(c -> 'pyq' -> 'documents') <> 'null' then
    insert into _check values ('wrong null kind: ' || jsonb_typeof(c -> 'pyq' -> 'documents'),
      null, null, null, null);
    return;
  end if;

  -- Everything that never depended on the indexes must still be there.
  if (c -> 'catalogue' ->> 'branches_covered')::int = 0
     or (c -> 'catalogue' ->> 'with_syllabus')::int = 0
     or (c -> 'pyq' ->> 'filled')::int <> 69
     or (c -> 'gate' ->> 'filled')::int <> 887
     or jsonb_array_length(c -> 'library') <> 4 then
    insert into _check values ('isolation leaked into the catalogue figures', null, null, null, null);
    return;
  end if;

  insert into _check values ('isolated', null, null,
    c -> 'catalogue' ->> 'branches_covered', c -> 'pyq' ->> 'filled');
exception when others then
  insert into _check values ('content_coverage raised: ' || sqlerrm, null, null, null, null);
end $do$;

select * from _check;
rollback;
