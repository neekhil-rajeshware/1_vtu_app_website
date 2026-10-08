-- Four 2022-scheme CIVIL subjects that the VTU Book-of-Studies put in the
-- source folder but that never reached `subjects`.
--
-- Source: E:\VTU_APP\Schemes\2022\3rd Y\Civil engineering\
--            5th Civil engineering.pdf        -> BCV501    (4-page scan, p1-3)
--            6th Civil engineering.pdf        -> BCV654A   (3-page scan, p1-2)
--            6th Civil engineerings.pdf       -> BCVL657A  (4-page scan, p1-3)
--         E:\VTU_APP\Schemes\2022\4th Y\Civil engineering\
--            Civil engineering.pdf            -> BCV714B   (34-page book, p11-17)
--
-- All four attachments are image-only scans, so the folder's text scan saw them
-- as 0-character files and skipped them; the 5th/6th/7th Sem *.xlsx list only
-- the scheduled electives and never mentioned these codes either. They were
-- recovered by OCR (Windows.Media.Ocr via G:\PYQs\ocr.ps1) of the page headers.
--
-- The syllabus PDFs were split out of those scans and uploaded to R2 by
-- G:\PYQs\upload_civ_syllabi.py, each HEAD-verified 200 with a byte-exact size
-- match. BCV501 is not optional: it is a core 5th-semester subject with eight
-- question papers already on disk (G:\PYQs\SPLIT\2022-scheme\CIVIL\5-sem\).
--
-- `subjects.id` has no default, so ids are assigned from the next free block
-- (max was 18728; the 2018/2021 jobs used 13000-14935 and 17000-18728).
-- Odd semesters carry the code in sem_1_sub_code, even ones in sem_2_sub_code,
-- matching every other row in this table.

insert into public.subjects
  (id, scheme_code, cycle, sub_category, elective, stream, branch, semester,
   sem_1_sub_code, sem_2_sub_code, sub_name, syllabus_link)
values
  (19001, '2', null, null, null, null, 'CV', '5', 'BCV501', null,
   'Construction Management and Entrepreneurship',
   'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/5th_sem/BCV501%20Construction%20Management%20and%20Entrepreneurship.pdf'),
  (19002, '2', null, null, null, null, 'CV', '6', null, 'BCV654A',
   'Water Conservation and Rainwater Harvesting',
   'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/6th_sem/BCV654A%20Water%20Conservation%20and%20Rainwater%20Harvesting.pdf'),
  (19003, '2', null, null, null, null, 'CV', '6', null, 'BCVL657A',
   'Building Information Modelling',
   'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/6th_sem/BCVL657A%20Building%20Information%20Modelling.pdf'),
  (19004, '2', null, null, null, null, 'CV', '7', 'BCV714B', null,
   'Earthquake Resistant structures',
   'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/7th_sem/BCV714B%20Earthquake%20Resistant%20structures.pdf')
on conflict (id) do nothing;

-- The two of the four that have question papers on disk need a `py_qp` row to
-- file them into: BCV501 (8 papers) and BCV654A. Their ids come from the
-- table's own sequence. Empty for now — the uploads are a separate step.
insert into public.py_qp (scheme_code, branch_code, stream, semester,
                          sem_1_sub_code, sem_2_sub_code)
select '2', 'CV', null, v.semester, v.s1, v.s2
from (values ('5', 'BCV501', null::text),
             ('6', null, 'BCV654A')) as v(semester, s1, s2)
where not exists (
  select 1 from public.py_qp p
  where p.scheme_code = '2' and p.branch_code = 'CV'
    and coalesce(p.sem_1_sub_code, p.sem_2_sub_code) = coalesce(v.s1, v.s2)
);
