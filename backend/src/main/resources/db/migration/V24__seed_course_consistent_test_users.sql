-- Sprint 12.3: Login-capable test users derived from the existing course ownership.
-- Weekly schedules reference courses, and courses reference academicians; no parallel
-- course-assignment or schedule-to-user relation is introduced here.
--
-- The current authorization model has no ASSISTANT or HOD role and no assistant/HOD
-- relation. Those users are intentionally not invented by this migration.

-- Keep the existing test personalities and course ownership, but move academician
-- identities away from the institutional email domain. The same academician row is
-- retained, so every course and weekly schedule continues to resolve to the same ID.
WITH linked_academicians AS (
    SELECT
        a.id,
        a.email AS source_email,
        CASE a.id
            WHEN 'a1111111-1111-1111-1111-111111111111'::uuid THEN 'ahmet.yilmaz@dts.test'
            WHEN 'a2222222-2222-2222-2222-222222222222'::uuid THEN 'mehmet.demir@dts.test'
            WHEN 'a3333333-3333-3333-3333-333333333333'::uuid THEN 'elif.celik@dts.test'
            ELSE 'academician-' || a.id::text || '@dts.test'
        END AS test_email,
        a.first_name,
        a.last_name,
        a.phone,
        a.title,
        f.name AS faculty_name,
        d.name AS department_name
    FROM academicians a
    JOIN faculties f ON f.id = a.faculty_id
    JOIN departments d ON d.id = a.department_id
    WHERE EXISTS (SELECT 1 FROM courses c WHERE c.academician_id = a.id)
)
UPDATE users u
SET first_name = la.first_name,
    last_name = la.last_name,
    email = la.test_email,
    password = '$2a$10$Im7U7Zi0uYqeB4mbx5a0Wu.Is5z5nCbB/XwfdID0kzrHirCPnVMRW',
    phone = la.phone,
    title = la.title,
    faculty = la.faculty_name,
    department = la.department_name,
    active = TRUE,
    updated_at = CURRENT_TIMESTAMP
FROM linked_academicians la
WHERE LOWER(u.email) = LOWER(la.source_email);

WITH linked_academicians AS (
    SELECT
        a.id,
        CASE a.id
            WHEN 'a1111111-1111-1111-1111-111111111111'::uuid THEN 'ahmet.yilmaz@dts.test'
            WHEN 'a2222222-2222-2222-2222-222222222222'::uuid THEN 'mehmet.demir@dts.test'
            WHEN 'a3333333-3333-3333-3333-333333333333'::uuid THEN 'elif.celik@dts.test'
            ELSE 'academician-' || a.id::text || '@dts.test'
        END AS test_email
    FROM academicians a
    WHERE EXISTS (SELECT 1 FROM courses c WHERE c.academician_id = a.id)
)
UPDATE academicians a
SET email = la.test_email,
    updated_at = CURRENT_TIMESTAMP
FROM linked_academicians la
WHERE a.id = la.id
  AND LOWER(a.email) <> LOWER(la.test_email);

-- Create only identities that are missing. Reusing the academician UUID in the users
-- table is deterministic and does not change the academician/course primary keys.
INSERT INTO users (
    id, first_name, last_name, email, password, active, created_at, updated_at,
    phone, title, department, faculty
)
SELECT
    a.id,
    a.first_name,
    a.last_name,
    a.email,
    '$2a$10$Im7U7Zi0uYqeB4mbx5a0Wu.Is5z5nCbB/XwfdID0kzrHirCPnVMRW',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    a.phone,
    a.title,
    d.name,
    f.name
FROM academicians a
JOIN faculties f ON f.id = a.faculty_id
JOIN departments d ON d.id = a.department_id
WHERE EXISTS (SELECT 1 FROM courses c WHERE c.academician_id = a.id)
  AND NOT EXISTS (SELECT 1 FROM users u WHERE LOWER(u.email) = LOWER(a.email))
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = a.id);

INSERT INTO user_roles (user_id, role)
SELECT DISTINCT u.id, 'ACADEMICIAN'
FROM academicians a
JOIN courses c ON c.academician_id = a.id
JOIN users u ON LOWER(u.email) = LOWER(a.email)
WHERE NOT EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = u.id
      AND ur.role = 'ACADEMICIAN'
);

-- Existing seeded department admins are retained and converted to test-domain logins.
UPDATE users
SET email = 'department-admin.engineering@dts.test',
    password = '$2a$10$Im7U7Zi0uYqeB4mbx5a0Wu.Is5z5nCbB/XwfdID0kzrHirCPnVMRW',
    faculty = 'Mühendislik Fakültesi',
    department = 'Bilgisayar Mühendisliği',
    active = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE id = '22222222-2222-2222-2222-222222222222'::uuid;

UPDATE users
SET email = 'department-admin.medicine@dts.test',
    password = '$2a$10$Im7U7Zi0uYqeB4mbx5a0Wu.Is5z5nCbB/XwfdID0kzrHirCPnVMRW',
    active = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE id = '33333333-3333-3333-3333-333333333333'::uuid;

-- The earlier Education Faculty demo academician has no Academician/Course record.
-- Reuse that test user as the Education Faculty department admin instead of leaving
-- an ACADEMICIAN login with no course or creating a duplicate person.
UPDATE users
SET first_name = 'Zeynep',
    last_name = 'Arslan',
    email = 'department-admin.education@dts.test',
    password = '$2a$10$Im7U7Zi0uYqeB4mbx5a0Wu.Is5z5nCbB/XwfdID0kzrHirCPnVMRW',
    title = 'Araştırma Görevlisi',
    faculty = 'Eğitim Fakültesi',
    department = 'Sınıf Öğretmenliği',
    active = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE id = '77777777-7777-7777-7777-777777777777'::uuid;

DELETE FROM user_roles
WHERE user_id = '77777777-7777-7777-7777-777777777777'::uuid
  AND role = 'ACADEMICIAN';

INSERT INTO user_roles (user_id, role)
SELECT seed_user.id, 'DEPARTMENT_ADMIN'
FROM users seed_user
WHERE seed_user.id IN (
    '22222222-2222-2222-2222-222222222222'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    '77777777-7777-7777-7777-777777777777'::uuid
)
AND NOT EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = seed_user.id
      AND ur.role = 'DEPARTMENT_ADMIN'
);
