-- Question papers for the two 2022-scheme CIVIL subjects that had a `py_qp`
-- row but no papers: BCV501 (id 5900) and BCV654A (id 5901).
--
-- Source: G:\PYQs\SPLIT\2022-scheme\CIVIL\
--           5-sem\BCV501 Construction Management and Entrepreneurship\  (6 files)
--           6-sem\BCV654A Water Conservation and Rainwater Harvesting\   (5 files)
--
-- Every file's page 1 was read (and the three image-only scans OCR'd via
-- G:\PYQs\ocr.ps1) before any session was assigned, because the filenames
-- disagree with the sessions printed inside them:
--
--   BCV501  Jan-2025.pdf       prints "Dec.2024/Jan.2025" -- Q1a is the same
--                              question as January-2025.pdf, so it is a scan of
--                              that same paper, not a second one.
--           July-2025.pdf     prints "June/July 2025" -- again identical to
--                              June-2025.pdf. Scan of the same paper.
--           November-2025.pdf prints "June/July 2025" but asks *different*
--                              questions from June-2025.pdf, so it is the
--                              sitting's second paper -> "June-2025 B".
--   BCV654A July-2025.pdf     prints "June/July 2025", identical to
--                              June-2025.pdf -> scan of the same paper.
--           November-2025.pdf prints "June/July 2025" with different questions
--                              -> "June-2025 B".
--
-- The two scan duplicates were not uploaded: the text-layer sibling is the same
-- paper and is searchable. Uploaded and HEAD-verified 200 with a byte-exact
-- size by G:\PYQs\upload_bcv501_654a.py and verify_bcv501_654a.py (8/8).
--
-- A session with two papers stores a JSON *list* of {"url": ...} objects, which
-- is the shape 12 existing cells already use (e.g. BCV502's June-2025 A/B).
-- No column was added: "June/July 2025" and "June/July 2026" both already exist.
--
-- One judgement worth a second look: if VTU did hold a separate Nov-2025
-- backlog sitting for these, then "June-2025 B" is really dec_jan_2026 and this
-- update should move it. The printed header says June/July 2025, so that is
-- what was filed.

update public.py_qp set
  dec_jan_2025 = json_build_object('Paper',
    'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/5th_sem/py_qp/BCV501%20Construction%20Management%20and%20Entrepreneurship/BCV501%20-%20January-2025.pdf')::text,
  june_july_2025 = json_build_object('Paper', json_build_array(
    json_build_object('url',
      'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/5th_sem/py_qp/BCV501%20Construction%20Management%20and%20Entrepreneurship/BCV501%20-%20June-2025%20A.pdf'),
    json_build_object('url',
      'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/5th_sem/py_qp/BCV501%20Construction%20Management%20and%20Entrepreneurship/BCV501%20-%20June-2025%20B.pdf')))::text,
  dec_jan_2026 = json_build_object('Paper',
    'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/5th_sem/py_qp/BCV501%20Construction%20Management%20and%20Entrepreneurship/BCV501%20-%20January-2026.pdf')::text
where id = 5900;

update public.py_qp set
  june_july_2025 = json_build_object('Paper', json_build_array(
    json_build_object('url',
      'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/6th_sem/py_qp/BCV654A%20Water%20Conservation%20and%20Rainwater%20Harvesting/BCV654A%20-%20June-2025%20A.pdf'),
    json_build_object('url',
      'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/6th_sem/py_qp/BCV654A%20Water%20Conservation%20and%20Rainwater%20Harvesting/BCV654A%20-%20June-2025%20B.pdf')))::text,
  dec_jan_2026 = json_build_object('Paper',
    'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/6th_sem/py_qp/BCV654A%20Water%20Conservation%20and%20Rainwater%20Harvesting/BCV654A%20-%20January-2026.pdf')::text,
  june_july_2026 = json_build_object('Paper',
    'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/6th_sem/py_qp/BCV654A%20Water%20Conservation%20and%20Rainwater%20Harvesting/BCV654A%20-%20June-2026.pdf')::text
where id = 5901;
