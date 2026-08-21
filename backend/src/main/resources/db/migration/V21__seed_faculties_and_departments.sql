-- Sprint 12.1: Seed only faculties and their explicitly provided departments.
-- Do not seed courses, academicians, users, classrooms, buildings, floors, or schedules here.

WITH seed_faculties (id, name, code) AS (
    VALUES
        ('f1200001-0000-4000-8000-000000000001'::uuid, 'Diş Hekimliği Fakültesi', 'DHF'),
        ('f1200002-0000-4000-8000-000000000002'::uuid, 'Eczacılık Fakültesi', 'ECZ'),
        ('f5555555-5555-5555-5555-555555555555'::uuid, 'Eğitim Fakültesi', 'EF'),
        ('f3333333-3333-3333-3333-333333333333'::uuid, 'Fen Edebiyat Fakültesi', 'FEF'),
        ('f1200005-0000-4000-8000-000000000005'::uuid, 'Güzel Sanatlar ve Tasarım Fakültesi', 'GSTF'),
        ('f1200006-0000-4000-8000-000000000006'::uuid, 'Hemşirelik Fakültesi', 'HEM'),
        ('f1200007-0000-4000-8000-000000000007'::uuid, 'Hukuk Fakültesi', 'HUK'),
        ('f4444444-4444-4444-4444-444444444444'::uuid, 'İktisadi ve İdari Bilimler Fakültesi', 'IIBF'),
        ('f1200009-0000-4000-8000-000000000009'::uuid, 'İlahiyat Fakültesi', 'ILH'),
        ('f1200010-0000-4000-8000-000000000010'::uuid, 'İletişim Fakültesi', 'ILT'),
        ('f1111111-1111-1111-1111-111111111111'::uuid, 'Mühendislik Fakültesi', 'MF'),
        ('f1200012-0000-4000-8000-000000000012'::uuid, 'Sağlık Bilimleri Fakültesi', 'SBF'),
        ('f1200013-0000-4000-8000-000000000013'::uuid, 'Spor Bilimleri Fakültesi', 'SPBF'),
        ('f2222222-2222-2222-2222-222222222222'::uuid, 'Tıp Fakültesi', 'TF')
)
INSERT INTO faculties (id, name, code, created_at, updated_at)
SELECT sf.id, sf.name, sf.code, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM seed_faculties sf
WHERE NOT EXISTS (
    SELECT 1
    FROM faculties f
    WHERE LOWER(f.name) = LOWER(sf.name)
       OR LOWER(f.code) = LOWER(sf.code)
);

-- Normalize earlier demo departments to the Sprint 12.1 source names before inserting.
UPDATE departments d
SET name = 'Biyoloji Bölümü',
    code = 'BIO',
    updated_at = CURRENT_TIMESTAMP
FROM faculties f
WHERE d.faculty_id = f.id
  AND f.name = 'Fen Edebiyat Fakültesi'
  AND LOWER(d.name) = LOWER('Biyoloji')
  AND NOT EXISTS (
      SELECT 1
      FROM departments existing
      WHERE existing.faculty_id = f.id
        AND LOWER(existing.name) = LOWER('Biyoloji Bölümü')
  );

UPDATE users u
SET department = 'Biyoloji Bölümü',
    updated_at = CURRENT_TIMESTAMP
WHERE u.faculty = 'Fen Edebiyat Fakültesi'
  AND LOWER(u.department) = LOWER('Biyoloji');

UPDATE departments d
SET name = 'Tıp',
    code = 'TIP',
    updated_at = CURRENT_TIMESTAMP
FROM faculties f
WHERE d.faculty_id = f.id
  AND f.name = 'Tıp Fakültesi'
  AND LOWER(d.name) = LOWER('Tıp Eğitimi')
  AND NOT EXISTS (
      SELECT 1
      FROM departments existing
      WHERE existing.faculty_id = f.id
        AND LOWER(existing.name) = LOWER('Tıp')
  );

UPDATE users u
SET department = 'Tıp',
    updated_at = CURRENT_TIMESTAMP
WHERE u.faculty = 'Tıp Fakültesi'
  AND LOWER(u.department) = LOWER('Tıp Eğitimi');

UPDATE departments d
SET code = CASE
        WHEN d.name = 'Bilgisayar Mühendisliği' THEN 'BM'
        WHEN d.name = 'Elektrik-Elektronik Mühendisliği' THEN 'EEM'
        WHEN d.name = 'Kimya Mühendisliği' THEN 'KM'
        WHEN d.name = 'Sınıf Öğretmenliği' THEN 'SO'
        ELSE d.code
    END,
    updated_at = CURRENT_TIMESTAMP
FROM faculties f
WHERE d.faculty_id = f.id
  AND (
      (f.name = 'Mühendislik Fakültesi' AND d.name IN ('Bilgisayar Mühendisliği', 'Elektrik-Elektronik Mühendisliği', 'Kimya Mühendisliği'))
      OR (f.name = 'Eğitim Fakültesi' AND d.name = 'Sınıf Öğretmenliği')
  );

WITH seed_departments (id, faculty_name, name, code) AS (
    VALUES
        ('d1200001-0000-4000-8000-000000000001'::uuid, 'Diş Hekimliği Fakültesi', 'Diş Hekimliği', 'DHE'),
        ('d1200002-0000-4000-8000-000000000002'::uuid, 'Eczacılık Fakültesi', 'Eczacılık', 'ECZ'),
        ('d1200003-0000-4000-8000-000000000003'::uuid, 'Eğitim Fakültesi', 'Resim-İş Öğretmenliği', 'RIO'),
        ('d1200004-0000-4000-8000-000000000004'::uuid, 'Eğitim Fakültesi', 'Müzik Öğretmenliği', 'MO'),
        ('d1200005-0000-4000-8000-000000000005'::uuid, 'Eğitim Fakültesi', 'Fen Bilgisi Öğretmenliği', 'FBO'),
        ('d1200006-0000-4000-8000-000000000006'::uuid, 'Eğitim Fakültesi', 'Özel Eğitim Öğretmenliği', 'OEO'),
        ('d1200007-0000-4000-8000-000000000007'::uuid, 'Eğitim Fakültesi', 'İlköğretim matematik öğretmenliği', 'IMO'),
        ('d1200008-0000-4000-8000-000000000008'::uuid, 'Eğitim Fakültesi', 'Okul Öncesi Öğretmenliği', 'OOO'),
        ('d5555555-5555-5555-5555-555555555555'::uuid, 'Eğitim Fakültesi', 'Sınıf Öğretmenliği', 'SO'),
        ('d1200010-0000-4000-8000-000000000010'::uuid, 'Eğitim Fakültesi', 'Sosyal Bilgiler Öğretmenliği', 'SBO'),
        ('d1200011-0000-4000-8000-000000000011'::uuid, 'Eğitim Fakültesi', 'İngilizce Öğretmenliği', 'IO'),
        ('d1200012-0000-4000-8000-000000000012'::uuid, 'Fen Edebiyat Fakültesi', 'Arkeoloji Bölümü', 'ARK'),
        ('d1200013-0000-4000-8000-000000000013'::uuid, 'Fen Edebiyat Fakültesi', 'Batı Dilleri ve Edebiyatları Bölümü', 'BDE'),
        ('d4444444-4444-4444-4444-444444444444'::uuid, 'Fen Edebiyat Fakültesi', 'Biyoloji Bölümü', 'BIO'),
        ('d1200015-0000-4000-8000-000000000015'::uuid, 'Fen Edebiyat Fakültesi', 'Coğrafya Bölümü', 'COG'),
        ('d1200016-0000-4000-8000-000000000016'::uuid, 'Fen Edebiyat Fakültesi', 'Felsefe Bölümü', 'FEL'),
        ('d1200017-0000-4000-8000-000000000017'::uuid, 'Fen Edebiyat Fakültesi', 'Fizik Bölümü', 'FIZ'),
        ('d1200018-0000-4000-8000-000000000018'::uuid, 'Fen Edebiyat Fakültesi', 'Kimya Bölümü', 'KIM'),
        ('d1200019-0000-4000-8000-000000000019'::uuid, 'Fen Edebiyat Fakültesi', 'Matematik Bölümü', 'MAT'),
        ('d1200020-0000-4000-8000-000000000020'::uuid, 'Fen Edebiyat Fakültesi', 'Moleküler Biyoloji ve Genetik Bölümü', 'MBG'),
        ('d1200021-0000-4000-8000-000000000021'::uuid, 'Fen Edebiyat Fakültesi', 'Psikoloji Bölümü', 'PSI'),
        ('d1200022-0000-4000-8000-000000000022'::uuid, 'Fen Edebiyat Fakültesi', 'Sosyoloji Bölümü', 'SOS'),
        ('d1200023-0000-4000-8000-000000000023'::uuid, 'Fen Edebiyat Fakültesi', 'Tarih Bölümü', 'TAR'),
        ('d1200024-0000-4000-8000-000000000024'::uuid, 'Fen Edebiyat Fakültesi', 'Türk Dili ve Edebiyatı Bölümü', 'TDE'),
        ('d1200025-0000-4000-8000-000000000025'::uuid, 'Güzel Sanatlar ve Tasarım Fakültesi', 'Gastronomi ve Mutfak Sanatları', 'GMS'),
        ('d1200026-0000-4000-8000-000000000026'::uuid, 'Güzel Sanatlar ve Tasarım Fakültesi', 'Geleneksel Türk Sanatları', 'GTS'),
        ('d1200027-0000-4000-8000-000000000027'::uuid, 'Güzel Sanatlar ve Tasarım Fakültesi', 'Grafik Tasarım', 'GT'),
        ('d1200028-0000-4000-8000-000000000028'::uuid, 'Güzel Sanatlar ve Tasarım Fakültesi', 'Müzik Bilimleri', 'MB'),
        ('d1200029-0000-4000-8000-000000000029'::uuid, 'Güzel Sanatlar ve Tasarım Fakültesi', 'Peyzaj Mimarlığı Bölümü', 'PM'),
        ('d1200030-0000-4000-8000-000000000030'::uuid, 'Güzel Sanatlar ve Tasarım Fakültesi', 'Resim', 'RESIM'),
        ('d1200031-0000-4000-8000-000000000031'::uuid, 'Güzel Sanatlar ve Tasarım Fakültesi', 'Seramik', 'SER'),
        ('d1200032-0000-4000-8000-000000000032'::uuid, 'Hukuk Fakültesi', 'hukuk', 'HUK'),
        ('d1200033-0000-4000-8000-000000000033'::uuid, 'İktisadi ve İdari Bilimler Fakültesi', 'Çalışma Ekonomisi ve Endüstri İlişkileri Bölümü', 'CEI'),
        ('d1200034-0000-4000-8000-000000000034'::uuid, 'İktisadi ve İdari Bilimler Fakültesi', 'Ekonometri Bölümü', 'EKO'),
        ('d1200035-0000-4000-8000-000000000035'::uuid, 'İktisadi ve İdari Bilimler Fakültesi', 'İktisat Bölümü', 'IKT'),
        ('d1200036-0000-4000-8000-000000000036'::uuid, 'İktisadi ve İdari Bilimler Fakültesi', 'İşletme Bölümü', 'ISL'),
        ('d1200037-0000-4000-8000-000000000037'::uuid, 'İktisadi ve İdari Bilimler Fakültesi', 'Maliye Bölümü', 'MAL'),
        ('d1200038-0000-4000-8000-000000000038'::uuid, 'İktisadi ve İdari Bilimler Fakültesi', 'Siyaset Bilimi ve Kamu Yönetimi Bölümü', 'SBKY'),
        ('d1200039-0000-4000-8000-000000000039'::uuid, 'İktisadi ve İdari Bilimler Fakültesi', 'Siyaset Bilimi ve Uluslararası İlişkiler Bölümü', 'SBU'),
        ('d1200040-0000-4000-8000-000000000040'::uuid, 'İktisadi ve İdari Bilimler Fakültesi', 'Uluslararası Ticaret ve İşletmecilik Bölümü', 'UTI'),
        ('d1200041-0000-4000-8000-000000000041'::uuid, 'İlahiyat Fakültesi', 'İlahiyat', 'ILH'),
        ('d1200042-0000-4000-8000-000000000042'::uuid, 'İletişim Fakültesi', 'Halkla İlişkiler ve Tanıtım', 'HIT'),
        ('d1200043-0000-4000-8000-000000000043'::uuid, 'İletişim Fakültesi', 'Gazetecilik', 'GAZ'),
        ('d1200044-0000-4000-8000-000000000044'::uuid, 'İletişim Fakültesi', 'Radyo, Televizyon ve Sinema', 'RTS'),
        ('d1111111-1111-1111-1111-111111111111'::uuid, 'Mühendislik Fakültesi', 'Bilgisayar Mühendisliği', 'BM'),
        ('d1200046-0000-4000-8000-000000000046'::uuid, 'Mühendislik Fakültesi', 'Biyomedikal Mühendisliği', 'BMM'),
        ('d2222222-2222-2222-2222-222222222222'::uuid, 'Mühendislik Fakültesi', 'Elektrik-Elektronik Mühendisliği', 'EEM'),
        ('d1200048-0000-4000-8000-000000000048'::uuid, 'Mühendislik Fakültesi', 'Gıda Mühendisliği', 'GM'),
        ('d1200049-0000-4000-8000-000000000049'::uuid, 'Mühendislik Fakültesi', 'İnşaat Mühendisliği', 'IM'),
        ('d3333333-3333-3333-3333-333333333333'::uuid, 'Mühendislik Fakültesi', 'Kimya Mühendisliği', 'KM'),
        ('d1200051-0000-4000-8000-000000000051'::uuid, 'Mühendislik Fakültesi', 'Maden Mühendisliği', 'MDM'),
        ('d1200052-0000-4000-8000-000000000052'::uuid, 'Mühendislik Fakültesi', 'Makine Mühendisliği', 'MKM'),
        ('d1200053-0000-4000-8000-000000000053'::uuid, 'Mühendislik Fakültesi', 'Yazılım Mühendisliği', 'YM'),
        ('d1200054-0000-4000-8000-000000000054'::uuid, 'Sağlık Bilimleri Fakültesi', 'Beslenme ve Diyetetik', 'BD'),
        ('d1200055-0000-4000-8000-000000000055'::uuid, 'Sağlık Bilimleri Fakültesi', 'Çocuk Gelişimi', 'CG'),
        ('d1200056-0000-4000-8000-000000000056'::uuid, 'Sağlık Bilimleri Fakültesi', 'Dil ve Konuşma Terapisi', 'DKT'),
        ('d1200057-0000-4000-8000-000000000057'::uuid, 'Sağlık Bilimleri Fakültesi', 'Ebelik', 'EBE'),
        ('d1200058-0000-4000-8000-000000000058'::uuid, 'Sağlık Bilimleri Fakültesi', 'Fizyoterapi ve Rehabilitasyon', 'FTR'),
        ('d1200059-0000-4000-8000-000000000059'::uuid, 'Sağlık Bilimleri Fakültesi', 'Gerontoloji', 'GER'),
        ('d1200060-0000-4000-8000-000000000060'::uuid, 'Sağlık Bilimleri Fakültesi', 'Odyoloji', 'ODY'),
        ('d1200061-0000-4000-8000-000000000061'::uuid, 'Spor Bilimleri Fakültesi', 'Antrenörlük Eğitimi', 'AE'),
        ('d1200062-0000-4000-8000-000000000062'::uuid, 'Spor Bilimleri Fakültesi', 'Beden Eğitimi ve Spor Öğretmenliği', 'BES'),
        ('d1200063-0000-4000-8000-000000000063'::uuid, 'Spor Bilimleri Fakültesi', 'Engellilerde Beden Eğitimi ve Spor Eğitimi', 'EBES'),
        ('d1200064-0000-4000-8000-000000000064'::uuid, 'Spor Bilimleri Fakültesi', 'Spor Yöneticiliği', 'SY'),
        ('d6666666-6666-6666-6666-666666666666'::uuid, 'Tıp Fakültesi', 'Tıp', 'TIP')
)
INSERT INTO departments (id, faculty_id, name, code, created_at, updated_at)
SELECT sd.id, f.id, sd.name, sd.code, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM seed_departments sd
JOIN faculties f ON LOWER(f.name) = LOWER(sd.faculty_name)
WHERE NOT EXISTS (
    SELECT 1
    FROM departments d
    WHERE d.faculty_id = f.id
      AND LOWER(d.name) = LOWER(sd.name)
);
