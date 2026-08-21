-- Sprint 12.X: Engineering Faculty realistic room/lab seed.
-- Source does not provide capacities; classrooms.capacity is mandatory, so capacity=1 is a documented demo placeholder.
-- No department allocation is seeded in this migration.
-- Known source conflicts kept as a single physical room:
--   MF-A-2-13: code suggests 2nd floor, source explicitly says 3rd floor.
--   MF-D-K2-22: source mentions multiple usages for the same code.
--   MF-F-Z-19: source mentions multiple usages for the same code.

WITH mf AS (
    SELECT id
    FROM faculties
    WHERE code = 'MF'
)
UPDATE buildings b
SET code = CASE b.name
        WHEN 'A Blok' THEN 'MF-A'
        WHEN 'B Blok' THEN 'MF-B'
        ELSE b.code
    END,
    updated_at = CURRENT_TIMESTAMP
FROM mf
WHERE b.faculty_id = mf.id
  AND b.name IN ('A Blok', 'B Blok')
  AND b.code IN ('A-BLOK', 'B-BLOK');

WITH mf AS (
    SELECT id
    FROM faculties
    WHERE code = 'MF'
),
seed_departments (id, name, code) AS (
    VALUES
        ('d1111111-1111-1111-1111-111111111111'::uuid, 'Bilgisayar Mühendisliği', 'BM'),
        ('d1200046-0000-4000-8000-000000000046'::uuid, 'Biyomedikal Mühendisliği', 'BMM'),
        ('d2222222-2222-2222-2222-222222222222'::uuid, 'Elektrik-Elektronik Mühendisliği', 'EEM'),
        ('d1200048-0000-4000-8000-000000000048'::uuid, 'Gıda Mühendisliği', 'GM'),
        ('d1200049-0000-4000-8000-000000000049'::uuid, 'İnşaat Mühendisliği', 'IM'),
        ('d3333333-3333-3333-3333-333333333333'::uuid, 'Kimya Mühendisliği', 'KM'),
        ('d1200051-0000-4000-8000-000000000051'::uuid, 'Maden Mühendisliği', 'MDM'),
        ('d1200052-0000-4000-8000-000000000052'::uuid, 'Makine Mühendisliği', 'MKM'),
        ('d1200053-0000-4000-8000-000000000053'::uuid, 'Yazılım Mühendisliği', 'YM')
)
INSERT INTO departments (id, faculty_id, name, code, created_at, updated_at)
SELECT sd.id, mf.id, sd.name, sd.code, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM seed_departments sd
CROSS JOIN mf
WHERE NOT EXISTS (
    SELECT 1
    FROM departments d
    WHERE d.faculty_id = mf.id
      AND (LOWER(d.name) = LOWER(sd.name) OR LOWER(d.code) = LOWER(sd.code))
);

WITH mf AS (
    SELECT id
    FROM faculties
    WHERE code = 'MF'
),
seed_buildings (block_code, name, code) AS (
    VALUES
        ('A', 'A Blok', 'MF-A'),
        ('B', 'B Blok', 'MF-B'),
        ('C', 'C Blok', 'MF-C'),
        ('D', 'D Blok', 'MF-D'),
        ('E', 'E Blok', 'MF-E'),
        ('F', 'F Blok', 'MF-F')
)
INSERT INTO buildings (id, faculty_id, name, code, created_at, updated_at)
SELECT md5('mf-building-' || sb.block_code)::uuid, mf.id, sb.name, sb.code, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM seed_buildings sb
CROSS JOIN mf
WHERE NOT EXISTS (
    SELECT 1
    FROM buildings b
    WHERE b.faculty_id = mf.id
      AND (LOWER(b.name) = LOWER(sb.name) OR LOWER(b.code) = LOWER(sb.code))
);

WITH mf AS (
    SELECT id
    FROM faculties
    WHERE code = 'MF'
),
seed_floors (building_code, level, name) AS (
    VALUES
        ('MF-A', 0, 'Zemin Kat'), ('MF-A', 1, '1. Kat'), ('MF-A', 2, '2. Kat'), ('MF-A', 3, '3. Kat'),
        ('MF-B', -1, 'Bodrum Kat'), ('MF-B', 0, 'Zemin Kat'), ('MF-B', 1, '1. Kat'), ('MF-B', 2, '2. Kat'),
        ('MF-C', 0, 'Zemin Kat'), ('MF-C', 1, '1. Kat'), ('MF-C', 2, '2. Kat'), ('MF-C', 3, '3. Kat'),
        ('MF-D', 0, 'Zemin Kat'), ('MF-D', 1, '1. Kat'), ('MF-D', 2, '2. Kat'), ('MF-D', 3, '3. Kat'),
        ('MF-E', 0, 'Zemin Kat'), ('MF-E', 1, '1. Kat'), ('MF-E', 2, '2. Kat'), ('MF-E', 3, '3. Kat'),
        ('MF-F', 0, 'Zemin Kat'), ('MF-F', 1, '1. Kat'), ('MF-F', 2, '2. Kat'), ('MF-F', 3, '3. Kat')
)
INSERT INTO floors (id, building_id, name, level, plan_mode, created_at, updated_at)
SELECT md5('mf-floor-' || sf.building_code || '-' || sf.level)::uuid,
       b.id,
       sf.name,
       sf.level,
       'SLOT_LAYOUT',
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM seed_floors sf
JOIN buildings b ON b.code = sf.building_code
JOIN mf ON mf.id = b.faculty_id
WHERE NOT EXISTS (
    SELECT 1
    FROM floors f
    WHERE f.building_id = b.id
      AND f.level = sf.level
);

WITH mf AS (
    SELECT id
    FROM faculties
    WHERE code = 'MF'
)
UPDATE floors f
SET plan_mode = 'SLOT_LAYOUT',
    updated_at = CURRENT_TIMESTAMP
FROM buildings b, mf
WHERE f.building_id = b.id
  AND b.faculty_id = mf.id
  AND b.code IN ('MF-A', 'MF-B', 'MF-C', 'MF-D', 'MF-E', 'MF-F');

DELETE FROM space_objects so
WHERE so.classroom_id IN (
    'c1111111-1111-1111-1111-111111111111'::uuid,
    'c2222222-2222-2222-2222-222222222222'::uuid,
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'c4444444-4444-4444-4444-444444444444'::uuid,
    'c5555555-5555-5555-5555-555555555555'::uuid
);

DELETE FROM classrooms c
WHERE c.id IN (
    'c1111111-1111-1111-1111-111111111111'::uuid,
    'c2222222-2222-2222-2222-222222222222'::uuid,
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'c4444444-4444-4444-4444-444444444444'::uuid,
    'c5555555-5555-5555-5555-555555555555'::uuid
)
AND NOT EXISTS (SELECT 1 FROM weekly_schedules ws WHERE ws.classroom_id = c.id)
AND NOT EXISTS (SELECT 1 FROM schedule_exceptions se WHERE se.classroom_id = c.id);

WITH seed_rooms (code, building_code, level, room_type, name, type_note) AS (
    VALUES
        ('MF-A-Z-3', 'MF-A', 0, 'CLASSROOM', 'Zemin Kat 1 Nolu Salon', 'Derslik'),
        ('MF-A-Z-4', 'MF-A', 0, 'CLASSROOM', 'Zemin Kat 2 Nolu Salon', 'Derslik'),
        ('MF-A-Z-5', 'MF-A', 0, 'LABORATORY', 'PC Laboratuvarı', 'Laboratuvar'),
        ('MF-A-Z-9', 'MF-A', 0, 'LABORATORY', 'Donanım Laboratuvarı', 'Laboratuvar'),
        ('MF-A-Z-10', 'MF-A', 0, 'CLASSROOM', 'Zemin Kat 5 Nolu Salon', 'Derslik'),
        ('MF-A-Z-11', 'MF-A', 0, 'CLASSROOM', 'Zemin Kat 6 Nolu Salon', 'Derslik'),
        ('MF-A-1-3', 'MF-A', 1, 'CLASSROOM', '1. Kat 1 Nolu Salon', 'Derslik'),
        ('MF-A-1-4', 'MF-A', 1, 'CLASSROOM', '1. Kat 2 Nolu Salon', 'Derslik'),
        ('MF-A-1-5', 'MF-A', 1, 'LABORATORY', 'Bilgisayar Laboratuvarı', 'Laboratuvar'),
        ('MF-A-1-8', 'MF-A', 1, 'CLASSROOM', '1. Kat 4 Nolu Salon', 'Derslik'),
        ('MF-A-1-9', 'MF-A', 1, 'CLASSROOM', '1. Kat 5 Nolu Salon', 'Derslik'),
        ('MF-A-1-10', 'MF-A', 1, 'CLASSROOM', '1. Kat 6 Nolu Salon', 'Derslik'),
        ('MF-A-2-5', 'MF-A', 2, 'CLASSROOM', '2. Kat 1 Nolu Salon', 'Derslik'),
        ('MF-A-2-6', 'MF-A', 2, 'CLASSROOM', '2. Kat 2 Nolu Salon', 'Derslik'),
        ('MF-A-2-7', 'MF-A', 2, 'CLASSROOM', '2. Kat 3 Nolu Salon', 'Derslik'),
        ('MF-A-2-10', 'MF-A', 2, 'CLASSROOM', '2. Kat 4 Nolu Salon', 'Derslik'),
        ('MF-A-2-12', 'MF-A', 2, 'LABORATORY', 'Bilgisayar Laboratuvarı (1. Kapı)', 'Laboratuvar'),
        ('MF-A-2-13', 'MF-A', 3, 'LABORATORY', 'Bilgisayar Laboratuvarı (2. Kapı)', 'Laboratuvar; kaynak 3. Kat dediği için burada tutuldu'),
        ('MF-B-B1', 'MF-B', -1, 'CLASSROOM', 'Bodrum 1 Nolu Salon', 'Derslik'),
        ('MF-B-B10', 'MF-B', -1, 'CLASSROOM', 'Bodrum 2 Nolu Salon', 'Derslik'),
        ('MF-B-B2', 'MF-B', -1, 'LABORATORY', 'Temel İşlemler Laboratuvarı', 'Laboratuvar'),
        ('MF-B-B3', 'MF-B', -1, 'LABORATORY', 'Laboratuvar', 'Laboratuvar'),
        ('MF-B-B8', 'MF-B', -1, 'LABORATORY', 'Tersine Mühendislik Simülasyon Laboratuvarı', 'Laboratuvar'),
        ('MF-B-B9', 'MF-B', -1, 'LABORATORY', 'İnovatif Malzemelerin Tasarım Laboratuvarı', 'Laboratuvar'),
        ('MF-B-Z-3', 'MF-B', 0, 'CLASSROOM', 'Zemin Kat 1 Nolu Salon', 'Derslik'),
        ('MF-B-Z-4', 'MF-B', 0, 'CLASSROOM', 'Zemin Kat 2 Nolu Salon', 'Derslik'),
        ('MF-B-Z-8', 'MF-B', 0, 'LABORATORY', 'Unix Laboratuvarı', 'Laboratuvar'),
        ('MF-B-Z-9', 'MF-B', 0, 'CLASSROOM', 'Zemin Kat 3 Nolu Salon', 'Derslik'),
        ('MF-B-Z-10', 'MF-B', 0, 'LABORATORY', 'PC Laboratuvarı', 'Laboratuvar'),
        ('MF-B-1-2', 'MF-B', 1, 'CLASSROOM', '1. Kat 1 Nolu Salon', 'Derslik'),
        ('MF-B-1-3', 'MF-B', 1, 'CLASSROOM', '1. Kat 2 Nolu Salon', 'Derslik'),
        ('MF-B-1-4', 'MF-B', 1, 'CLASSROOM', '1. Kat 3 Nolu Salon', 'Derslik'),
        ('MF-B-1-7', 'MF-B', 1, 'CLASSROOM', '1. Kat 4 Nolu Salon', 'Derslik'),
        ('MF-B-1-8', 'MF-B', 1, 'CLASSROOM', '1. Kat 5 Nolu Salon', 'Derslik'),
        ('MF-B-1-9', 'MF-B', 1, 'CLASSROOM', '1. Kat 6 Nolu Salon', 'Derslik'),
        ('MF-B-2-2', 'MF-B', 2, 'CLASSROOM', '2. Kat 1 Nolu Salon', 'Derslik'),
        ('MF-B-2-3', 'MF-B', 2, 'CLASSROOM', '2. Kat 2 Nolu Salon', 'Derslik'),
        ('MF-B-2-4', 'MF-B', 2, 'CLASSROOM', '2. Kat 3 Nolu Salon', 'Derslik'),
        ('MF-B-2-5', 'MF-B', 2, 'CLASSROOM', '2. Kat 4 Nolu Salon', 'Derslik'),
        ('MF-B-2-8', 'MF-B', 2, 'CLASSROOM', '2. Kat 5 Nolu Salon', 'Derslik'),
        ('MF-B-2-9', 'MF-B', 2, 'CLASSROOM', '2. Kat 6 Nolu Salon', 'Derslik'),
        ('MF-B-2-10', 'MF-B', 2, 'CLASSROOM', '2. Kat 7 Nolu Salon', 'Derslik'),
        ('MF-C-Z-8', 'MF-C', 0, 'LABORATORY', 'Ders Laboratuvarı', 'Laboratuvar'),
        ('MF-C-Z-9', 'MF-C', 0, 'LABORATORY', 'Ders Laboratuvarı', 'Laboratuvar'),
        ('MF-C-Z-14', 'MF-C', 0, 'LABORATORY', 'Ders Laboratuvarı (1. Kapı)', 'Laboratuvar'),
        ('MF-C-Z-15', 'MF-C', 0, 'LABORATORY', 'Ders Laboratuvarı (2. Kapı)', 'Laboratuvar'),
        ('MF-C-Z-16', 'MF-C', 0, 'LABORATORY', 'Ders Laboratuvarı (1. Kapı)', 'Laboratuvar'),
        ('MF-C-Z-17', 'MF-C', 0, 'LABORATORY', 'Ders Laboratuvarı (2. Kapı)', 'Laboratuvar'),
        ('MF-C-K1-11', 'MF-C', 1, 'LABORATORY', 'Laboratuvar Deposu', 'Laboratuvar'),
        ('MF-C-K2-7', 'MF-C', 2, 'LABORATORY', 'Ders Laboratuvarı', 'Laboratuvar'),
        ('MF-C-K2-8', 'MF-C', 2, 'LABORATORY', 'Laboratuvar Deposu', 'Laboratuvar'),
        ('MF-C-K2-9', 'MF-C', 2, 'LABORATORY', 'Laboratuvar Deposu', 'Laboratuvar'),
        ('MF-C-K2-10', 'MF-C', 2, 'LABORATORY', 'Laboratuvar Deposu', 'Laboratuvar'),
        ('MF-C-K2-11', 'MF-C', 2, 'LABORATORY', 'Laboratuvar Deposu', 'Laboratuvar'),
        ('MF-C-K2-12', 'MF-C', 2, 'LABORATORY', 'Laboratuvar Deposu', 'Laboratuvar'),
        ('MF-C-K2-13', 'MF-C', 2, 'LABORATORY', 'Ders Laboratuvarı', 'Laboratuvar'),
        ('MF-C-K3-7', 'MF-C', 3, 'LABORATORY', 'Araştırma Laboratuvarı', 'Laboratuvar'),
        ('MF-C-K3-13', 'MF-C', 3, 'LABORATORY', 'Ders Laboratuvarı', 'Laboratuvar'),
        ('MF-D-Z-12', 'MF-D', 0, 'LABORATORY', 'Araştırma Laboratuvarı', 'Laboratuvar'),
        ('MF-D-Z-13', 'MF-D', 0, 'LABORATORY', 'Araştırma Laboratuvarı', 'Laboratuvar'),
        ('MF-D-K1-17', 'MF-D', 1, 'CLASSROOM', 'Seminer Dersliği', 'Derslik (Lisans Üstü)'),
        ('MF-D-K2-16', 'MF-D', 2, 'LABORATORY', 'Isı Laboratuvarı', 'Laboratuvar'),
        ('MF-D-K2-17', 'MF-D', 2, 'LABORATORY', 'Depo', 'Laboratuvar'),
        ('MF-D-K2-18', 'MF-D', 2, 'LABORATORY', 'Depo', 'Laboratuvar'),
        ('MF-D-K2-22', 'MF-D', 2, 'LABORATORY', 'Laboratuvar', 'Laboratuvar; kaynakta birden fazla kullanım bilgisiyle geçer'),
        ('MF-D-K3-11', 'MF-D', 3, 'LABORATORY', 'Kromatografik Analizler Laboratuvarı', 'Laboratuvar'),
        ('MF-D-K3-12', 'MF-D', 3, 'LABORATORY', 'Biyoteknolojik Laboratuvar', 'Laboratuvar'),
        ('MF-D-K3-13', 'MF-D', 3, 'LABORATORY', 'Toksikoloji Laboratuvarı', 'Laboratuvar'),
        ('MF-D-K3-17', 'MF-D', 3, 'LABORATORY', 'Ürün Geliştirme Laboratuvarı', 'Laboratuvar'),
        ('MF-D-K3-18', 'MF-D', 3, 'LABORATORY', 'Araştırma Laboratuvarı 4', 'Laboratuvar'),
        ('MF-D-K3-19', 'MF-D', 3, 'LABORATORY', 'Araştırma Laboratuvarı 3', 'Laboratuvar'),
        ('MF-D-K3-20', 'MF-D', 3, 'LABORATORY', 'Araştırma Laboratuvarı 2', 'Laboratuvar'),
        ('MF-D-K3-21', 'MF-D', 3, 'LABORATORY', 'Araştırma Laboratuvarı 1', 'Laboratuvar'),
        ('MF-D-K3-22', 'MF-D', 3, 'LABORATORY', 'Yağ Kimyası Laboratuvarı', 'Laboratuvar'),
        ('MF-D-K3-23', 'MF-D', 3, 'LABORATORY', 'Gıda Analizleri Laboratuvarı', 'Laboratuvar'),
        ('MF-E-Z-1', 'MF-E', 0, 'LABORATORY', 'Ulaştırma Laboratuvarı 1', 'Laboratuvar'),
        ('MF-E-Z-2', 'MF-E', 0, 'LABORATORY', 'Ulaştırma Laboratuvarı 2', 'Laboratuvar'),
        ('MF-E-Z-3', 'MF-E', 0, 'LABORATORY', 'Yapı Malzemesi Laboratuvarı', 'Laboratuvar'),
        ('MF-E-Z-18', 'MF-E', 0, 'CLASSROOM', 'Teknik Çizim Sınıfı', 'Derslik (Teknik)'),
        ('MF-E-K1-1', 'MF-E', 1, 'CLASSROOM', 'Doktora Çalışma Odası', 'Derslik (Lisans Üstü)'),
        ('MF-E-K1-7', 'MF-E', 1, 'LABORATORY', 'Toplantı Salonu', 'Laboratuvar'),
        ('MF-E-K1-8', 'MF-E', 1, 'LABORATORY', 'Bilgisayar Laboratuvarı', 'Laboratuvar'),
        ('MF-E-K2-6', 'MF-E', 2, 'LABORATORY', 'Ders Laboratuvarı', 'Laboratuvar'),
        ('MF-E-K2-7', 'MF-E', 2, 'LABORATORY', 'Ders Laboratuvarı', 'Laboratuvar'),
        ('MF-E-K2-8', 'MF-E', 2, 'LABORATORY', 'Ders Laboratuvarı', 'Laboratuvar'),
        ('MF-E-K2-13', 'MF-E', 2, 'LABORATORY', 'Ders Laboratuvarı', 'Laboratuvar'),
        ('MF-E-K3-1', 'MF-E', 3, 'CLASSROOM', '301 Nolu Derslik', 'Derslik'),
        ('MF-E-K3-2', 'MF-E', 3, 'CLASSROOM', '302 Nolu Derslik', 'Derslik'),
        ('MF-E-K3-3', 'MF-E', 3, 'CLASSROOM', '303 Nolu Derslik', 'Derslik'),
        ('MF-E-K3-5', 'MF-E', 3, 'CLASSROOM', '304 Nolu Derslik', 'Derslik'),
        ('MF-F-Z-19', 'MF-F', 0, 'LABORATORY', 'Yüksek Gerilim Laboratuvarı', 'Laboratuvar; kaynakta birden fazla kullanım bilgisiyle geçer'),
        ('MF-F-Z-20', 'MF-F', 0, 'LABORATORY', 'Mikrobiyoloji Laboratuvarı', 'Laboratuvar'),
        ('MF-F-Z-21', 'MF-F', 0, 'LABORATORY', 'Geoteknik Laboratuvarı', 'Laboratuvar'),
        ('MF-F-K1-14', 'MF-F', 1, 'LABORATORY', 'Laboratuvar (Balkon)', 'Laboratuvar'),
        ('MF-F-K1-15', 'MF-F', 1, 'LABORATORY', 'Laboratuvar (Balkon)', 'Laboratuvar'),
        ('MF-F-K1-16', 'MF-F', 1, 'LABORATORY', 'Araştırma Laboratuvarı 2', 'Laboratuvar'),
        ('MF-F-K1-17', 'MF-F', 1, 'LABORATORY', 'Araştırma Laboratuvarı 1', 'Laboratuvar'),
        ('MF-F-K2-10', 'MF-F', 2, 'LABORATORY', 'Ders Laboratuvarı', 'Laboratuvar'),
        ('MF-F-K2-16', 'MF-F', 2, 'LABORATORY', 'Gıda Kimyası Beslenme Laboratuvarı', 'Laboratuvar'),
        ('MF-F-K2-20', 'MF-F', 2, 'LABORATORY', 'Robotik Laboratuvarı', 'Laboratuvar'),
        ('MF-F-K2-21', 'MF-F', 2, 'LABORATORY', 'Hücre Kültürü Laboratuvarı', 'Laboratuvar'),
        ('MF-F-K2-22', 'MF-F', 2, 'LABORATORY', 'Uçuş Kontrol Laboratuvarı', 'Laboratuvar'),
        ('MF-F-K2-25', 'MF-F', 2, 'LABORATORY', 'Veri İşlem Laboratuvarı', 'Laboratuvar'),
        ('MF-F-K2-26', 'MF-F', 2, 'CLASSROOM', 'Lisans Üstü Ders ve Seminer Salonu', 'Derslik (Lisans Üstü)'),
        ('MF-F-K3-10', 'MF-F', 3, 'LABORATORY', 'Ders Laboratuvarı', 'Laboratuvar'),
        ('MF-F-K3-16', 'MF-F', 3, 'LABORATORY', 'Elektrik Devre Laboratuvarı', 'Laboratuvar'),
        ('MF-F-K3-20', 'MF-F', 3, 'LABORATORY', 'Güç Elektriği Laboratuvarı', 'Laboratuvar'),
        ('MF-F-K3-21', 'MF-F', 3, 'LABORATORY', 'Fizik Laboratuvarı', 'Laboratuvar'),
        ('MF-F-K3-22', 'MF-F', 3, 'LABORATORY', 'Elektrik Makinaları Laboratuvarı', 'Laboratuvar'),
        ('MF-F-K3-23', 'MF-F', 3, 'LABORATORY', 'PLC ve Kontrol Laboratuvarı', 'Laboratuvar')
)
INSERT INTO classrooms (id, floor_id, name, code, capacity, type, equipment, created_at, updated_at)
SELECT md5('mf-classroom-' || sr.code)::uuid,
       f.id,
       sr.name,
       sr.code,
       1,
       sr.room_type,
       sr.type_note || '; kapasite kaynakta yok, zorunlu alan için demo varsayılanı: 1',
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM seed_rooms sr
JOIN buildings b ON b.code = sr.building_code
JOIN floors f ON f.building_id = b.id AND f.level = sr.level
WHERE NOT EXISTS (
    SELECT 1
    FROM classrooms c
    WHERE LOWER(c.code) = LOWER(sr.code)
);

WITH mf_floors AS (
    SELECT f.id AS floor_id, COUNT(c.id)::integer AS room_count
    FROM floors f
    JOIN buildings b ON b.id = f.building_id
    JOIN faculties fa ON fa.id = b.faculty_id
    LEFT JOIN classrooms c ON c.floor_id = f.id AND c.code LIKE 'MF-%'
    WHERE fa.code = 'MF'
      AND b.code IN ('MF-A', 'MF-B', 'MF-C', 'MF-D', 'MF-E', 'MF-F')
    GROUP BY f.id
    HAVING COUNT(c.id) > 0
)
INSERT INTO slot_layout (id, floor_id, rows, columns, created_at, updated_at)
SELECT md5('mf-slot-layout-' || floor_id::text)::uuid,
       floor_id,
       GREATEST(1, CEIL(room_count / 4.0)::integer),
       4,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM mf_floors
WHERE NOT EXISTS (
    SELECT 1
    FROM slot_layout sl
    WHERE sl.floor_id = mf_floors.floor_id
);

WITH ordered_rooms AS (
    SELECT c.id AS classroom_id,
           c.floor_id,
           c.code,
           c.name,
           c.capacity,
           c.type,
           ROW_NUMBER() OVER (PARTITION BY c.floor_id ORDER BY c.code) - 1 AS index_in_floor
    FROM classrooms c
    JOIN floors f ON f.id = c.floor_id
    JOIN buildings b ON b.id = f.building_id
    JOIN faculties fa ON fa.id = b.faculty_id
    WHERE fa.code = 'MF'
      AND b.code IN ('MF-A', 'MF-B', 'MF-C', 'MF-D', 'MF-E', 'MF-F')
      AND c.code LIKE 'MF-%'
)
INSERT INTO space_objects (
    id,
    floor_id,
    classroom_id,
    type,
    status,
    label,
    code,
    capacity,
    position_x,
    position_y,
    width,
    height,
    rotation,
    slot_row,
    slot_column,
    metadata_json,
    created_at,
    updated_at
)
SELECT md5('mf-space-object-' || classroom_id::text)::uuid,
       floor_id,
       classroom_id,
       type,
       'EMPTY',
       name,
       code,
       capacity,
       0,
       0,
       160,
       100,
       0,
       (index_in_floor / 4)::integer,
       (index_in_floor % 4)::integer,
       '{"source":"Sprint 12.X Engineering Faculty seed","layout":"slot","realArchitecturalCoordinates":false}',
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM ordered_rooms
WHERE NOT EXISTS (
    SELECT 1
    FROM space_objects so
    WHERE so.floor_id = ordered_rooms.floor_id
      AND so.classroom_id = ordered_rooms.classroom_id
);
