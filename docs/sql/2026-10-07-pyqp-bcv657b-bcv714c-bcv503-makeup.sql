-- 2026-10-07 — BCV657B papers, the BCV714C code fix, and the June/July 2025 make-up
--
-- Three separate defects, each settled by reading page 1 of the source PDF rather
-- than trusting a filename or the database:
--
--   1. The 2022 CIVIL split tree has a folder named
--      `BCV657D Quality Control and Quality Assurance`. The syllabus source lists
--      BCV657A / BCV657B - Quality Control and Quality Assurance / BCV657C and no
--      D at all, so the folder name is the slip and py_qp 882 (BCV657B) is right —
--      its nine papers were simply unreachable. Eight of the nine are papers
--      (a "Question Paper Version : A|B|C|D" line is printed on page 1, four
--      versions for each of the June/July 2025 and June/July 2026 sittings); the
--      ninth is a scan of version C and is not linked.
--
--   2. `BCV714D - Design And Execution of Pile Foundations.pdf` prints
--      `Course Code : BCV714C` in the page-1 box. The filename and the database
--      both inherited the same faulty text layer. With A and B existing, a fourth
--      elective reading C completes A/B/C/D and D would strand C. BCV714C is free
--      in both tables, so the rename is collision-free.
--
--   3. BCV503 Concrete Technology ran its June/July 2025 sitting twice. The file
--      named `BCV503 Concrete Technology November-2025.pdf` prints a June/July 2025
--      header and asks different questions from the regular paper — a make-up exam.
--      Same pattern, already filed, for BCV501 and BCV654A; their cells are
--      relabelled here so the pair reads Regular / Make-Up instead of Paper A/B.
--
-- No session column was added: june_july_2025 and june_july_2026 both already exist.
-- Eleven R2 objects uploaded to vtu-resources and HEAD-verified byte-exact
-- (G:\PYQs\upload_fixes.py, verify_fixes.py).

-- 1. BCV714D -> BCV714C
update public.subjects set sem_1_sub_code = 'BCV714C' where id = 10076;

update public.py_qp set
  sem_1_sub_code = 'BCV714C',
  dec_jan_2026 = json_build_object('Paper',
    'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/7th_sem/py_qp/BCV714C%20Design%20and%20Execution%20of%20Pile%20Foundations/BCV714C%20-%20Dec-2025-Jan-2026.pdf')::text,
  june_july_2026 = json_build_object('Paper',
    'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/7th_sem/py_qp/BCV714C%20Design%20and%20Execution%20of%20Pile%20Foundations/BCV714C%20-%20June-2026.pdf')::text
where id = 1398;

-- 2. BCV657B — four printed versions per sitting
update public.py_qp t set
  june_july_2025 = s.j25,
  june_july_2026 = s.j26
from (
  select json_build_object('Paper', json_agg(
             json_build_object('label', 'Version ' || v, 'url', u25) order by v))::text as j25,
         json_build_object('Paper', json_agg(
             json_build_object('label', 'Version ' || v, 'url', u26) order by v))::text as j26
  from unnest(array['A','B','C','D']) v,
  lateral (select
    'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/6th_sem/py_qp/BCV657B%20Quality%20Control%20and%20Quality%20Assurance/BCV657B%20-%20June-July-2025%20Version%20' || v || '.pdf' as u25,
    'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/6th_sem/py_qp/BCV657B%20Quality%20Control%20and%20Quality%20Assurance/BCV657B%20-%20June-July-2026%20Version%20' || v || '.pdf' as u26) x
) s
where t.id = 882;

-- 3. BCV503 Concrete Technology — regular + make-up
update public.py_qp set june_july_2025 = json_build_object('Paper', json_build_array(
    json_build_object('label', 'Regular',
      'url', 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/5th_sem/py_qp/BCV503%20Concrete%20Technology/BCV503%20-%20July-2025.pdf'),
    json_build_object('label', 'Make-Up',
      'url', 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/5th_sem/py_qp/BCV503%20Concrete%20Technology/BCV503%20-%20June-2025%20Make-Up.pdf')))::text
where id = 449;

-- 4. the same pair for BCV501 and BCV654A, now labelled
update public.py_qp set june_july_2025 = json_build_object('Paper', json_build_array(
    json_build_object('label', 'Regular',
      'url', 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/5th_sem/py_qp/BCV501%20Construction%20Management%20and%20Entrepreneurship/BCV501%20-%20June-2025%20A.pdf'),
    json_build_object('label', 'Make-Up',
      'url', 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/5th_sem/py_qp/BCV501%20Construction%20Management%20and%20Entrepreneurship/BCV501%20-%20June-2025%20B.pdf')))::text
where id = 5900;

update public.py_qp set june_july_2025 = json_build_object('Paper', json_build_array(
    json_build_object('label', 'Regular',
      'url', 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/6th_sem/py_qp/BCV654A%20Water%20Conservation%20and%20Rainwater%20Harvesting/BCV654A%20-%20June-2025%20A.pdf'),
    json_build_object('label', 'Make-Up',
      'url', 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/6th_sem/py_qp/BCV654A%20Water%20Conservation%20and%20Rainwater%20Harvesting/BCV654A%20-%20June-2025%20B.pdf')))::text
where id = 5901;
