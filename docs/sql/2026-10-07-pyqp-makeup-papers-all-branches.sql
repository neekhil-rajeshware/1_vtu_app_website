-- 2026-10-07 — every make-up paper from the June/July 2025 sitting, all branches
--
-- The 2022-scheme file tree holds a make-up for a June sitting as a file named
-- `November-<year>.pdf`: VTU sits the make-up in November and prints the
-- original `June/July 2025` header on the paper. Read by filename, such a paper
-- looks like a Dec/Jan paper, which is why a cell can hold one paper while the
-- folder holds two — 37 cells did.
--
-- Three sources disagree about which sitting a paper belongs to, and they rank
-- in this order: the header printed on page 1, then the filename, then the
-- database. Only the page settles it. Two things that are *not* make-ups were
-- left alone: a scan of the same paper with no text layer (nothing to compare),
-- and VTU's anti-copying `Question Paper Version : A|B|C|D` sets, which are
-- versions of one sitting's paper, not a second sitting.
--
-- 111 cells, two session columns, all branches. 111 R2 objects were uploaded to
-- vtu-resources first and HEAD-verified (200, non-zero length) before any link
-- was written; one of the 111 was already in the bucket from an earlier job.
-- The cells were written as one statement per column from G:\PYQs\cells.sql,
-- which also produced the digests this record was checked against:
--
--   june_july_2025  110 cells  md5 589488f76f9b2cc4c94db4f2c817e84c
--   june_july_2026    1 cell   md5 a81768825edbc7097abb72fcc56bd875
--
-- Five cells were also *emptied*: a filename had filed a paper under the sitting
-- it was sat in rather than the sitting it belongs to. Those are at the end.
--
-- The UPDATEs below are the same statements that were applied, written to be
-- replayable: run them against the pre-2026-10-07 row and you get the row that
-- is there now. `plan_uploads.py` holds the rules; `verify_plan.py` re-derived
-- every pair from the PDFs and found 111 of 111 to be same-sitting, same-subject,
-- 0.22-0.40 alike.

-- 1. June/July 2025 — the Regular is the link already in the cell, unchanged.
--    Not applied as written: the applied statement spelled every cell out. This
--    rebuilds the same value, and the build checks that it does.
with v(id, mk) as (values
(348, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/AD_Artificial_Intelligence_%26_Data_Science/5th_sem/py_qp/BAD515B%20Data%20Warehousing/BAD515B%20-%20November-2025.pdf'),
(353, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/AD_Artificial_Intelligence_%26_Data_Science/5th_sem/py_qp/BCS501%20Software%20Engineering%20%26%20Project%20Management/BCS501%20-%20November-2025.pdf'),
(354, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/AD_Artificial_Intelligence_%26_Data_Science/5th_sem/py_qp/BCS502%20COMPUTER%20NETWORKS/BCS502%20-%20November-2025.pdf'),
(355, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/AD_Artificial_Intelligence_%26_Data_Science/5th_sem/py_qp/BCS503%20THEORY%20OF%20COMPUTATION/BCS503%20-%20November-2025.pdf'),
(356, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/AD_Artificial_Intelligence_%26_Data_Science/5th_sem/py_qp/BCS508%20Environmental%20Studies%20and%20E-Waste%20Management/BCS508%20-%20November-2025.pdf'),
(362, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/AI_Artificial_Intelligence_and_Machine_Learning/5th_sem/py_qp/BCS501%20Software%20Engineering%20%26%20Project%20Management/BCS501%20-%20November-2025.pdf'),
(363, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/AI_Artificial_Intelligence_and_Machine_Learning/5th_sem/py_qp/BCS502%20COMPUTER%20NETWORKS/BCS502%20-%20November-2025.pdf'),
(364, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/AI_Artificial_Intelligence_and_Machine_Learning/5th_sem/py_qp/BCS503%20THEORY%20OF%20COMPUTATION/BCS503%20-%20November-2025.pdf'),
(365, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/AI_Artificial_Intelligence_and_Machine_Learning/5th_sem/py_qp/BCS508%20Environmental%20Studies%20and%20E-Waste%20Management/BCS508%20-%20November-2025.pdf'),
(366, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/AI_Artificial_Intelligence_and_Machine_Learning/5th_sem/py_qp/BCS515C%20UNIX%20SYSTEM%20PROGRAMMING/BCS515C%20-%20November-2025.pdf'),
(377, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/AU_Automobile_Engineering/5th_sem/py_qp/BRMK557%20Research%20Methodology%20and%20IPR/BRMK557%20-%20November-2025.pdf'),
(398, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CI_CSE_(Artificial_Intelligence_%26_Machine_Learning)/5th_sem/py_qp/BCS501%20Software%20Engineering%20%26%20Project%20Management/BCS501%20-%20November-2025.pdf'),
(399, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CI_CSE_(Artificial_Intelligence_%26_Machine_Learning)/5th_sem/py_qp/BCS502%20COMPUTER%20NETWORKS/BCS502%20-%20November-2025.pdf'),
(400, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CI_CSE_(Artificial_Intelligence_%26_Machine_Learning)/5th_sem/py_qp/BCS503%20THEORY%20OF%20COMPUTATION/BCS503%20-%20November-2025.pdf'),
(401, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CI_CSE_(Artificial_Intelligence_%26_Machine_Learning)/5th_sem/py_qp/BCS508%20Environmental%20Studies%20and%20E-Waste%20Management/BCS508%20-%20November-2025.pdf'),
(402, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CI_CSE_(Artificial_Intelligence_%26_Machine_Learning)/5th_sem/py_qp/BCS515C%20UNIX%20SYSTEM%20PROGRAMMING/BCS515C%20-%20November-2025.pdf'),
(407, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CA_CSE_(Artificial_Intelligence)/5th_sem/py_qp/BCS501%20Software%20Engineering%20%26%20Project%20Management/BCS501%20-%20November-2025.pdf'),
(408, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CA_CSE_(Artificial_Intelligence)/5th_sem/py_qp/BCS502%20COMPUTER%20NETWORKS/BCS502%20-%20November-2025.pdf'),
(409, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CA_CSE_(Artificial_Intelligence)/5th_sem/py_qp/BCS503%20THEORY%20OF%20COMPUTATION/BCS503%20-%20November-2025.pdf'),
(410, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CA_CSE_(Artificial_Intelligence)/5th_sem/py_qp/BCS508%20Environmental%20Studies%20and%20E-Waste%20Management/BCS508%20-%20November-2025.pdf'),
(411, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CA_CSE_(Artificial_Intelligence)/5th_sem/py_qp/BCS515C%20UNIX%20SYSTEM%20PROGRAMMING/BCS515C%20-%20November-2025.pdf'),
(413, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CY_CSE_(Cyber_Security)/5th_sem/py_qp/BCS501%20Software%20Engineering%20%26%20Project%20Management/BCS501%20-%20November-2025.pdf'),
(414, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CY_CSE_(Cyber_Security)/5th_sem/py_qp/BCS502%20COMPUTER%20NETWORKS/BCS502%20-%20November-2025.pdf'),
(415, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CY_CSE_(Cyber_Security)/5th_sem/py_qp/BCS503%20THEORY%20OF%20COMPUTATION/BCS503%20-%20November-2025.pdf'),
(416, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CY_CSE_(Cyber_Security)/5th_sem/py_qp/BCS508%20Environmental%20Studies%20and%20E-Waste%20Management/BCS508%20-%20November-2025.pdf'),
(420, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CD_CSE_(Data_Science)/5th_sem/py_qp/BAD515B%20Data%20Warehousing/BAD515B%20-%20November-2025.pdf'),
(424, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CD_CSE_(Data_Science)/5th_sem/py_qp/BCS501%20Software%20Engineering%20%26%20Project%20Management/BCS501%20-%20November-2025.pdf'),
(425, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CD_CSE_(Data_Science)/5th_sem/py_qp/BCS502%20COMPUTER%20NETWORKS/BCS502%20-%20November-2025.pdf'),
(426, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CD_CSE_(Data_Science)/5th_sem/py_qp/BCS503%20THEORY%20OF%20COMPUTATION/BCS503%20-%20November-2025.pdf'),
(427, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CD_CSE_(Data_Science)/5th_sem/py_qp/BCS508%20Environmental%20Studies%20and%20E-Waste%20Management/BCS508%20-%20November-2025.pdf'),
(429, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/IC_CSE_(IoT_%26_Cyber_Security_including_Blockchain_Technology)/5th_sem/py_qp/BCS501%20Software%20Engineering%20%26%20Project%20Management/BCS501%20-%20November-2025.pdf'),
(430, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/IC_CSE_(IoT_%26_Cyber_Security_including_Blockchain_Technology)/5th_sem/py_qp/BCS502%20COMPUTER%20NETWORKS/BCS502%20-%20November-2025.pdf'),
(431, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/IC_CSE_(IoT_%26_Cyber_Security_including_Blockchain_Technology)/5th_sem/py_qp/BCS503%20THEORY%20OF%20COMPUTATION/BCS503%20-%20November-2025.pdf'),
(432, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/IC_CSE_(IoT_%26_Cyber_Security_including_Blockchain_Technology)/5th_sem/py_qp/BCS508%20Environmental%20Studies%20and%20E-Waste%20Management/BCS508%20-%20November-2025.pdf'),
(448, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/5th_sem/py_qp/BCV502%20Geotechnical%20Engineering/BCV502%20-%20November-2025.pdf'),
(458, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CM_Computer_%26_Communication_Engineering/5th_sem/py_qp/BCS501%20Software%20Engineering%20%26%20Project%20Management/BCS501%20-%20November-2025.pdf'),
(459, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CM_Computer_%26_Communication_Engineering/5th_sem/py_qp/BCS503%20THEORY%20OF%20COMPUTATION/BCS503%20-%20November-2025.pdf'),
(460, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CM_Computer_%26_Communication_Engineering/5th_sem/py_qp/BCS508%20Environmental%20Studies%20and%20E-Waste%20Management/BCS508%20-%20November-2025.pdf'),
(461, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CM_Computer_%26_Communication_Engineering/5th_sem/py_qp/BCS515C%20UNIX%20SYSTEM%20PROGRAMMING/BCS515C%20-%20November-2025.pdf'),
(466, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CE_Computer_Engineering/5th_sem/py_qp/BCS501%20Software%20Engineering%20%26%20Project%20Management/BCS501%20-%20November-2025.pdf'),
(467, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CE_Computer_Engineering/5th_sem/py_qp/BCS502%20COMPUTER%20NETWORKS/BCS502%20-%20November-2025.pdf'),
(468, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CE_Computer_Engineering/5th_sem/py_qp/BCS503%20THEORY%20OF%20COMPUTATION/BCS503%20-%20November-2025.pdf'),
(469, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CE_Computer_Engineering/5th_sem/py_qp/BCS508%20Environmental%20Studies%20and%20E-Waste%20Management/BCS508%20-%20November-2025.pdf'),
(470, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CE_Computer_Engineering/5th_sem/py_qp/BCS515C%20UNIX%20SYSTEM%20PROGRAMMING/BCS515C%20-%20November-2025.pdf'),
(472, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CR_Computer_Science/5th_sem/py_qp/BCS501%20Software%20Engineering%20%26%20Project%20Management/BCS501%20-%20November-2025.pdf'),
(473, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CR_Computer_Science/5th_sem/py_qp/BCS502%20COMPUTER%20NETWORKS/BCS502%20-%20November-2025.pdf'),
(474, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CR_Computer_Science/5th_sem/py_qp/BCS503%20THEORY%20OF%20COMPUTATION/BCS503%20-%20November-2025.pdf'),
(475, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CR_Computer_Science/5th_sem/py_qp/BCS508%20Environmental%20Studies%20and%20E-Waste%20Management/BCS508%20-%20November-2025.pdf'),
(477, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CR_Computer_Science/5th_sem/py_qp/BCS515C%20UNIX%20SYSTEM%20PROGRAMMING/BCS515C%20-%20November-2025.pdf'),
(484, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CB_Computer_Science_%26_Business_System/5th_sem/py_qp/BCS502%20COMPUTER%20NETWORKS/BCS502%20-%20November-2025.pdf'),
(485, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CB_Computer_Science_%26_Business_System/5th_sem/py_qp/BCS503%20THEORY%20OF%20COMPUTATION/BCS503%20-%20November-2025.pdf'),
(486, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CB_Computer_Science_%26_Business_System/5th_sem/py_qp/BCS508%20Environmental%20Studies%20and%20E-Waste%20Management/BCS508%20-%20November-2025.pdf'),
(487, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CB_Computer_Science_%26_Business_System/5th_sem/py_qp/BCS515C%20UNIX%20SYSTEM%20PROGRAMMING/BCS515C%20-%20November-2025.pdf'),
(492, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CG_Computer_Science_%26_Design/5th_sem/py_qp/BCS501%20Software%20Engineering%20%26%20Project%20Management/BCS501%20-%20November-2025.pdf'),
(493, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CG_Computer_Science_%26_Design/5th_sem/py_qp/BCS502%20COMPUTER%20NETWORKS/BCS502%20-%20November-2025.pdf'),
(494, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CG_Computer_Science_%26_Design/5th_sem/py_qp/BCS503%20THEORY%20OF%20COMPUTATION/BCS503%20-%20November-2025.pdf'),
(495, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CG_Computer_Science_%26_Design/5th_sem/py_qp/BCS508%20Environmental%20Studies%20and%20E-Waste%20Management/BCS508%20-%20November-2025.pdf'),
(497, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CG_Computer_Science_%26_Design/5th_sem/py_qp/BCS515C%20UNIX%20SYSTEM%20PROGRAMMING/BCS515C%20-%20November-2025.pdf'),
(499, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CS_Computer_Science_%26_Engineering/5th_sem/py_qp/BCS501%20Software%20Engineering%20%26%20Project%20Management/BCS501%20-%20November-2025.pdf'),
(500, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CS_Computer_Science_%26_Engineering/5th_sem/py_qp/BCS502%20COMPUTER%20NETWORKS/BCS502%20-%20November-2025.pdf'),
(501, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CS_Computer_Science_%26_Engineering/5th_sem/py_qp/BCS503%20THEORY%20OF%20COMPUTATION/BCS503%20-%20November-2025.pdf'),
(502, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CS_Computer_Science_%26_Engineering/5th_sem/py_qp/BCS508%20Environmental%20Studies%20and%20E-Waste%20Management/BCS508%20-%20November-2025.pdf'),
(504, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CS_Computer_Science_%26_Engineering/5th_sem/py_qp/BCS515C%20UNIX%20SYSTEM%20PROGRAMMING/BCS515C%20-%20November-2025.pdf'),
(510, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CO_Computer_Science_%26_Engineering_(IoT)/5th_sem/py_qp/BCS501%20Software%20Engineering%20%26%20Project%20Management/BCS501%20-%20November-2025.pdf'),
(511, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CO_Computer_Science_%26_Engineering_(IoT)/5th_sem/py_qp/BCS502%20COMPUTER%20NETWORKS/BCS502%20-%20November-2025.pdf'),
(512, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CO_Computer_Science_%26_Engineering_(IoT)/5th_sem/py_qp/BCS503%20THEORY%20OF%20COMPUTATION/BCS503%20-%20November-2025.pdf'),
(513, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CO_Computer_Science_%26_Engineering_(IoT)/5th_sem/py_qp/BCS508%20Environmental%20Studies%20and%20E-Waste%20Management/BCS508%20-%20November-2025.pdf'),
(516, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/DS_Data_Science/5th_sem/py_qp/BAD515B%20Data%20Warehousing/BAD515B%20-%20November-2025.pdf'),
(520, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/DS_Data_Science/5th_sem/py_qp/BCS501%20Software%20Engineering%20%26%20Project%20Management/BCS501%20-%20November-2025.pdf'),
(521, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/DS_Data_Science/5th_sem/py_qp/BCS503%20THEORY%20OF%20COMPUTATION/BCS503%20-%20November-2025.pdf'),
(522, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/DS_Data_Science/5th_sem/py_qp/BCS508%20Environmental%20Studies%20and%20E-Waste%20Management/BCS508%20-%20November-2025.pdf'),
(523, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/DS_Data_Science/5th_sem/py_qp/BCS515C%20UNIX%20SYSTEM%20PROGRAMMING/BCS515C%20-%20November-2025.pdf'),
(526, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/EE_Electrical_%26_Electronics_Engineering/5th_sem/py_qp/BEE502%20SIGNALS%20AND%20DSP/BEE502%20-%20November-2025.pdf'),
(527, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/EE_Electrical_%26_Electronics_Engineering/5th_sem/py_qp/BEE503%20Power%20Electronics/BEE503%20-%20November-2025.pdf'),
(530, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/EE_Electrical_%26_Electronics_Engineering/5th_sem/py_qp/BEE515C%20ELECTRIC%20VEHIVLE%20FUNDAMENTALS/BEE515C%20-%20November-2025.pdf'),
(534, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/EC_Electronics_%26_Communication_Engineering/5th_sem/py_qp/BEC502%20Digital%20Signal%20Processing/BEC502%20-%20November-2025.pdf'),
(535, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/EC_Electronics_%26_Communication_Engineering/5th_sem/py_qp/BEC503%20DIGITAL%20COMMUNICATION/BEC503%20-%20November-2025.pdf'),
(539, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/EC_Electronics_%26_Communication_Engineering/5th_sem/py_qp/BEC515D%20Satellite%20and%20Optical%20Communication/BEC515D%20-%20November-2025.pdf'),
(550, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/ET_Electronics_%26_Telecommunication_Engineering/5th_sem/py_qp/BEC502%20Digital%20Signal%20Processing/BEC502%20-%20November-2025.pdf'),
(551, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/ET_Electronics_%26_Telecommunication_Engineering/5th_sem/py_qp/BEC503%20DIGITAL%20COMMUNICATION/BEC503%20-%20November-2025.pdf'),
(583, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/IS_Information_Science_%26_Engineering/5th_sem/py_qp/BCS501%20Software%20Engineering%20%26%20Project%20Management/BCS501%20-%20November-2025.pdf'),
(584, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/IS_Information_Science_%26_Engineering/5th_sem/py_qp/BCS502%20COMPUTER%20NETWORKS/BCS502%20-%20November-2025.pdf'),
(585, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/IS_Information_Science_%26_Engineering/5th_sem/py_qp/BCS503%20THEORY%20OF%20COMPUTATION/BCS503%20-%20November-2025.pdf'),
(586, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/IS_Information_Science_%26_Engineering/5th_sem/py_qp/BCS508%20Environmental%20Studies%20and%20E-Waste%20Management/BCS508%20-%20November-2025.pdf'),
(588, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/IS_Information_Science_%26_Engineering/5th_sem/py_qp/BCS515C%20UNIX%20SYSTEM%20PROGRAMMING/BCS515C%20-%20November-2025.pdf'),
(605, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/MM_Mechanical_%26_Smart_Manufacturing/5th_sem/py_qp/BRMK557%20Research%20Methodology%20and%20IPR/BRMK557%20-%20November-2025.pdf'),
(606, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/ME_Mechanical_Engineering/5th_sem/py_qp/BME501%20Industrial%20Management%20%26%20Entrepreneurship/BME501%20-%20November-2025.pdf'),
(607, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/ME_Mechanical_Engineering/5th_sem/py_qp/BME502%20TURBOMACHINES/BME502%20-%20November-2025.pdf'),
(608, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/ME_Mechanical_Engineering/5th_sem/py_qp/BME503%20Theory%20of%20Machines/BME503%20-%20November-2025.pdf'),
(610, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/ME_Mechanical_Engineering/5th_sem/py_qp/BME515A%20MECHATRONICS/BME515A%20-%20November-2025.pdf'),
(645, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/SA_Smart_Agritech/5th_sem/py_qp/BESK508%20ENVIRONMENTAL%20STUDIES/BESK508%20-%20November-2025.pdf'),
(647, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/SA_Smart_Agritech/5th_sem/py_qp/BRMK557%20Research%20Methodology%20and%20IPR/BRMK557%20-%20November-2025.pdf'),
(737, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/AI_Artificial_Intelligence_and_Machine_Learning/6th_sem/py_qp/BIS613D%20Cloud%20Computing%20%26%20Security/BIS613D%20-%20November-2025%20B.pdf'),
(794, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CI_CSE_(Artificial_Intelligence_%26_Machine_Learning)/6th_sem/py_qp/BIS613D%20Cloud%20Computing%20%26%20Security/BIS613D%20-%20November-2025%20B.pdf'),
(809, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CA_CSE_(Artificial_Intelligence)/6th_sem/py_qp/BIS613D%20Cloud%20Computing%20%26%20Security/BIS613D%20-%20November-2025%20B.pdf'),
(824, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CY_CSE_(Cyber_Security)/6th_sem/py_qp/BIS613D%20Cloud%20Computing%20%26%20Security/BIS613D%20-%20November-2025%20B.pdf'),
(854, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/IC_CSE_(IoT_%26_Cyber_Security_including_Blockchain_Technology)/6th_sem/py_qp/BIS613D%20Cloud%20Computing%20%26%20Security/BIS613D%20-%20November-2025%20B.pdf'),
(873, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/6th_sem/py_qp/BCV602%20Irrigation%20Engineering%20and%20Hydraulic%20Structures/BCV602%20-%20November-2025.pdf'),
(876, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/6th_sem/py_qp/BCV613C%20APPLIED%20GEOTECHNICAL%20ENGINEERING/BCV613C%20-%20November-2025%20B.pdf'),
(911, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CE_Computer_Engineering/6th_sem/py_qp/BIS613D%20Cloud%20Computing%20%26%20Security/BIS613D%20-%20November-2025%20B.pdf'),
(955, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CG_Computer_Science_%26_Design/6th_sem/py_qp/BIS613D%20Cloud%20Computing%20%26%20Security/BIS613D%20-%20November-2025%20B.pdf'),
(1004, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/EE_Electrical_%26_Electronics_Engineering/6th_sem/py_qp/BEE613D%20Electric%20Motor%20and%20Drive%20Systems%20for%20Electric%20Vehicles/BEE613D%20-%20November-2025.pdf'),
(1006, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/EE_Electrical_%26_Electronics_Engineering/6th_sem/py_qp/BEE654B%20Technologies%20of%20Renewable%20Energy%20Sources/BEE654B%20-%20November-2025.pdf'),
(1018, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/EC_Electronics_%26_Communication_Engineering/6th_sem/py_qp/BEC613C%20Digital%20Image%20Processing/BEC613C%20-%20November-2025%20B.pdf'),
(1046, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/ET_Electronics_%26_Telecommunication_Engineering/6th_sem/py_qp/BEC613C%20Digital%20Image%20Processing/BEC613C%20-%20November-2025%20B.pdf'),
(1059, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/VL_Electronics_Engineering_(VLSI_Design_and_Technology)/6th_sem/py_qp/BEC613C%20Digital%20Image%20Processing/BEC613C%20-%20November-2025%20B.pdf'),
(1115, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/IS_Information_Science_%26_Engineering/6th_sem/py_qp/BIS613D%20Cloud%20Computing%20%26%20Security/BIS613D%20-%20November-2025%20B.pdf'),
(1141, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/ME_Mechanical_Engineering/6th_sem/py_qp/BME613A%20TOTAL%20QUALITY%20MANAGEMENT/BME613A%20-%20November-2025%20B.pdf'),
(1145, 'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/ME_Mechanical_Engineering/6th_sem/py_qp/BME654B%20Renewable%20Energy%20Power%20Plants/BME654B%20-%20November-2025.pdf')
)
update public.py_qp t
   set june_july_2025 = json_build_object('Paper',
         (case when jsonb_typeof(t.june_july_2025::jsonb -> 'Paper') = 'array'
               then t.june_july_2025::jsonb -> 'Paper'
               else jsonb_build_array(jsonb_build_object(
                      'label', 'Regular',
                      'url',   t.june_july_2025::jsonb ->> 'Paper')) end)
         || jsonb_build_array(jsonb_build_object('label', 'Make-Up', 'url', v.mk))
       )::text
from v where t.id = v.id;

-- 2. Row 449 is written out in full rather than rebuilt: its cell already
--    labelled two papers, and the rebuild below would flatten the second one's
--    label. The make-up joined them as `Make-Up 2`.
update public.py_qp set june_july_2025 = $j${"Paper":[{"label":"Regular","url":"https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/5th_sem/py_qp/BCV503%20Concrete%20Technology/BCV503%20-%20July-2025.pdf"},{"label":"Make-Up","url":"https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/5th_sem/py_qp/BCV503%20Concrete%20Technology/BCV503%20-%20June-2025%20Make-Up.pdf"},{"label":"Make-Up 2","url":"https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/5th_sem/py_qp/BCV503%20Concrete%20Technology/BCV503%20-%20November-2025.pdf"}]}$j$::text where id = 449;

-- 3. june_july_2026 — one cell. The 2025-scheme first-year row already lists six
--    papers for its two course codes, so this is written out in full too: the
--    pair is appended to that list, not wrapped around it.
update public.py_qp set june_july_2026 = $j${"Paper":["https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2025/1st_year/py_qp/1BCEDM103%20%201BCEDM103_203%20Computer-Aided%20Engineering%20Drawing%20for%20ME%20stream%20Engineering/JUNE%20JULY%202026/1BCEDE203%20-%20June-2026%20(2).pdf","https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2025/1st_year/py_qp/1BCEDM103%20%201BCEDM103_203%20Computer-Aided%20Engineering%20Drawing%20for%20ME%20stream%20Engineering/JUNE%20JULY%202026/1BCEDE203%20-%20June-2026%20(3).pdf","https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2025/1st_year/py_qp/1BCEDM103%20%201BCEDM103_203%20Computer-Aided%20Engineering%20Drawing%20for%20ME%20stream%20Engineering/JUNE%20JULY%202026/1BCEDE203%20-%20June-2026.pdf","https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2025/1st_year/py_qp/1BCEDM103%20%201BCEDM103_203%20Computer-Aided%20Engineering%20Drawing%20for%20ME%20stream%20Engineering/JUNE%20JULY%202026/1BCEDS203%20-%20June-2026%20(2).pdf","https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2025/1st_year/py_qp/1BCEDM103%20%201BCEDM103_203%20Computer-Aided%20Engineering%20Drawing%20for%20ME%20stream%20Engineering/JUNE%20JULY%202026/1BCEDS203%20-%20June-2026%20(3).pdf","https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2025/1st_year/py_qp/1BCEDM103%20%201BCEDM103_203%20Computer-Aided%20Engineering%20Drawing%20for%20ME%20stream%20Engineering/JUNE%20JULY%202026/1BCEDS203%20-%20June-2026.pdf",{"label":"Regular","url":"https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2025/1st_year/py_qp/1BCEDM103%20%201BCEDM103_203%20Computer-Aided%20Engineering%20Drawing%20for%20ME%20stream%20Engineering/1BCEDM203%20-%20June-2026%20A.pdf"},{"label":"Make-Up","url":"https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2025/1st_year/py_qp/1BCEDM103%20%201BCEDM103_203%20Computer-Aided%20Engineering%20Drawing%20for%20ME%20stream%20Engineering/1BCEDM203%20-%20June-2026%20B.pdf"}]}$j$::text where id = 160;
-- Five cells that a filename put in the wrong sitting.
--
-- Each holds a paper whose own printed header names a different exam than the
-- column it sits in. A make-up for the June sitting is *sat* in November, so the
-- file is called `November-2025` and the previous job filed it under dec_jan_2026
-- by that name alone. The header is the evidence; the name is not.
--
--   row  448  BCV502   dec_jan_2025  held January-2025  -> prints june_july_2024
--   row 1004  BEE613D  dec_jan_2026  held November-2025 -> prints june_july_2025
--   row 1018  BEC613C  dec_jan_2026  held November-2025 A -> no text layer; its
--                     sibling November-2025 B prints june_july_2025, and both are
--                     downloads of the same November sitting
--   row 1046  BEC613C  dec_jan_2026  (same paper, ET branch)
--   row 1059  BEC613C  dec_jan_2026  (same paper, VL branch)
--
-- The June/July make-up each one actually is gets linked into june_july_2025 by
-- the same job's cells.sql. BCV502's is re-homed here rather than dropped: it is
-- a born-digital 3-page paper printing a June-July 2024 header, and the 4-page
-- scan already in june_july_2024 is a different rendition of that exam.

update public.py_qp set dec_jan_2025 = null where id = 448;

update public.py_qp
   set dec_jan_2026 = null
 where id in (1004, 1018, 1046, 1059);

update public.py_qp
   set june_july_2024 = '{"Paper":[{"label":"Regular","url":"https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/5th_sem/py_qp/BCV502%20Geotechnical%20Engineering/BCV502%20-%20June-July-2024%20A.pdf"},{"label":"Make-Up","url":"https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev/vtu/scheme-2022/CV_Civil_Engineering/5th_sem/py_qp/BCV502%20Geotechnical%20Engineering/BCV502%20-%20January-2025.pdf"}]}'
 where id = 448;
