-- 2026-10-07 — the last 46 /vtu-pyqs papers with no semester, and the second
-- half of the "hidden by the branch filter" bug.
--
-- Applied as two migrations, in this order:
--   subjects_first_year_semester_backfill     (data)
--   vtu_pyq_index_subject_key_fallback        (function)
--
-- Reported as "fix the 46 missing semesters". They were two different faults
-- that happened to render the same way, which is why the first fix left two
-- papers behind.

-- ---------------------------------------------------------------------------
-- 1. The data: 26 scheme-1 first-year subjects had `semester` NULL.
--
-- Every one of them is a first-year subject carrying BOTH a sem-1 and a sem-2
-- code — the physics/chemistry cycle gives each first-year subject one code per
-- semester — and `subjects` already states the rule everywhere else:
--
--     one code filled  -> that semester      5 rows say '1', 5 say '2'
--     both filled      -> '1 & 2'            all 29 of them
--
-- The 26 NULL rows were the same shape as those 29, so this set them to
-- '1 & 2'. Scoped to rows with both codes and a name, which also excludes the
-- two all-null junk rows (ids 26, 28) the sheet carries.
--
-- **This alone does not survive.** `subjects.semester` is authored in the sheet
-- and is in the sync function's `columns` list, not its `ignore` list, so every
-- full sync pushes the sheet's blank straight back over it — the timer runs
-- every 15 minutes. The sheet cells for these 26 rows have to be filled, or the
-- sheet's "pull a column from the database" menu action run, before the next
-- sync. Same rule as any other `subjects` edit; see docs/sheet_sync_setup.md.

-- ---------------------------------------------------------------------------
-- 2. The function: `vtu_pyq_index()` resolved one paper through two keys.
--
-- It took the subject's *name and code* from `row_code` (the py_qp row's own
-- code) and its *stream and semester* from `file_code` (the code at the front of
-- the filename), with no fallback between them. When the two disagree the paper
-- prints one subject's name beside another subject's metadata — or, worse, beside
-- none at all.
--
-- py_qp 1398 is the row for BCV714D, "Design And Execution of Pile Foundations",
-- and both of its cells hold files named `BCV714C - ….pdf`. BCV714C is in no
-- table. So the card printed D's name with "All branches" and "Not recorded"
-- next to it. `All branches` is the sentinel for a paper that resolved to no
-- subject, and the browser hides such a paper from *every* branch selection —
-- the same user-visible harm as the 2026-10-07 stream fix, from a different
-- cause.
--
-- Now there is one key, decided once in `subject_key`: the filename's code if it
-- resolves to a subject, else the row's own code. Filename first is deliberate
-- and unchanged — a paper filed inside another subject's R2 folder still carries
-- its own code in its own name, which is how the 2025 papers sitting under
-- "1BCEDC103 … CV Stream" resolve to 1BCEDE103. The row's code is only the
-- fallback, for a file whose code is in no table.
--
-- That also makes the two correlated `row_code` subqueries in `named`
-- redundant — whenever either code resolves, the lateral matches — so they are
-- gone rather than left as a second, unexercised resolution path.
--
-- Still open, and unchanged by this: whether the file should have been named
-- BCV714C or BCV714D. The card can only be as right as the `py_qp` row, and the
-- row says D. Nobody's data was changed on the strength of a filename.
--
-- Measured after: 447 papers, 0 saying "Not recorded", 0 saying "All branches",
-- 302 ms as `anon` (3s timeout) against 234 ms before the extra EXISTS.

-- ---------------------------------------------------------------------------
-- The assertions below check shape, not counts — same reasoning as
-- 2026-10-07-vtu-pyq-index-scheme-and-streams.sql. The last one is the new
-- guard: a paper whose subject resolved must have a semester, and the only
-- papers allowed to lack one are the ones that resolved to no subject at all.
-- That is stated as a relation between the two counts rather than `= 0`, so a
-- genuine data gap on a subject that *did* resolve cannot fail the file.

do $check$
declare
  idx jsonb;
  unplaced int;
  unrecorded int;
begin
  idx := public.vtu_pyq_index() -> 'papers';

  select count(*) into unplaced
  from jsonb_array_elements(idx) p where p ->> 'streams' = 'All branches';

  select count(*) into unrecorded
  from jsonb_array_elements(idx) p where p ->> 'semesters' = 'Not recorded';

  if unrecorded <> unplaced then
    raise exception
      '% papers say Not recorded but only % resolved to no subject',
      unrecorded, unplaced;
  end if;
end $check$;
